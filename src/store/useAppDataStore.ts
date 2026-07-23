import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
    BillRecord,
    BudgetRecord,
    GoalRecord,
    INITIAL_BILLS,
    INITIAL_BUDGETS,
    INITIAL_GOALS,
    INITIAL_PLANS,
    INITIAL_TRANSACTIONS,
    INITIAL_WALLETS,
    PlanRecord,
    TransactionRecord,
    WalletRecord,
} from '../data/mockData';

export interface HealthMetric {
    label: string;
    value: number;
    max: number;
    color: string;
    icon: string;
}

interface AppDataState {
    wallets: WalletRecord[];
    transactions: TransactionRecord[];
    bills: BillRecord[];
    budgets: BudgetRecord[];
    goals: GoalRecord[];
    plans: PlanRecord[];
    healthScore: number;
    // Base wallet balances (before any transactions) - used for reactive recompute
    baseWalletBalances: Record<string, number>;

    // Computed / Automation
    getHealthScore: () => number;
    getHealthMetrics: () => HealthMetric[];
    checkUpcomingBills: () => void;
    checkGoalProgress: () => void;
    checkPlanReminders: () => void;

    // Wallet Actions
    addWallet: (wallet: Omit<WalletRecord, 'id'>) => Promise<void>;
    deleteWallet: (id: string) => Promise<void>;
    editWallet: (id: string, updated: Partial<WalletRecord>) => Promise<void>;
    addTransaction: (tx: Omit<TransactionRecord, 'id'>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    editTransaction: (id: string, updated: Partial<TransactionRecord>) => Promise<void>;
    addBill: (bill: Omit<BillRecord, 'id' | 'is_paid'>) => Promise<void>;
    deleteBill: (id: string) => Promise<void>;
    editBill: (id: string, updated: Partial<BillRecord>) => Promise<void>;
    markBillPaid: (billId: string) => Promise<void>;
    addBudget: (budget: Omit<BudgetRecord, 'id' | 'spent' | 'pct'>) => Promise<void>;
    deleteBudget: (id: string) => Promise<void>;
    editBudget: (id: string, updated: Partial<BudgetRecord>) => Promise<void>;
    addGoal: (goal: Omit<GoalRecord, 'id' | 'current_amount'>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    editGoal: (id: string, updated: Partial<GoalRecord>) => Promise<void>;
    depositGoal: (goalId: string, amount: number) => Promise<void>;
    addPlan: (plan: Omit<PlanRecord, 'id' | 'completed'>) => Promise<void>;
    deletePlan: (id: string) => Promise<void>;
    togglePlanDone: (id: string) => Promise<void>;
}

export const useAppDataStore = create<AppDataState>()(
    persist(
        (set, get) => ({
            wallets: INITIAL_WALLETS,
            transactions: INITIAL_TRANSACTIONS,
            bills: INITIAL_BILLS,
            budgets: INITIAL_BUDGETS,
            goals: INITIAL_GOALS,
            plans: INITIAL_PLANS,
            healthScore: 85,
            // Store the "seed" balances for each wallet (independent of transactions)
            baseWalletBalances: Object.fromEntries(INITIAL_WALLETS.map(w => [w.id, w.balance])),

            getHealthMetrics: () => {
                const { wallets, bills, budgets, transactions } = get();
                const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(String(w.balance)) || 0), 0);
                const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);
                const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);

                // 1. Savings Rate (Target: >= 20% savings)
                let savingsRateVal = 50;
                if (totalIncome > 0) {
                    const rate = ((totalIncome - totalExpenses) / totalIncome) * 100;
                    savingsRateVal = Math.max(0, Math.min(100, Math.round(rate)));
                }

                // 2. Budget Discipline (Target: Low average spending vs total budget)
                let budgetDisciplineVal = 100;
                if (budgets.length > 0) {
                    const avgPct = budgets.reduce((sum, b) => sum + (b.pct || 0), 0) / budgets.length;
                    budgetDisciplineVal = Math.max(0, Math.min(100, Math.round(100 - (avgPct * 0.8))));
                }

                // 3. Bill Payment Ratio (Target: 100% paid)
                let billPaymentVal = 100;
                if (bills.length > 0) {
                    const paidCount = bills.filter(b => b.is_paid).length;
                    billPaymentVal = Math.round((paidCount / bills.length) * 100);
                }

                // 4. Debt / Liability Ratio
                const unpaidBills = bills.filter(b => !b.is_paid).reduce((sum, b) => sum + (parseFloat(String(b.amount)) || 0), 0);
                let debtRatioVal = 100;
                if (totalBalance > 0 && unpaidBills > 0) {
                    debtRatioVal = Math.max(0, Math.min(100, Math.round(100 - ((unpaidBills / totalBalance) * 100))));
                }

                // 5. Emergency Coverage
                let emergencyVal = 50;
                if (totalExpenses > 0) {
                    const monthsCovered = totalBalance / totalExpenses;
                    emergencyVal = Math.max(0, Math.min(100, Math.round((monthsCovered / 3) * 100)));
                } else if (totalBalance > 0) {
                    emergencyVal = 100;
                }

                return [
                    { label: 'Savings Rate', value: savingsRateVal, max: 100, color: savingsRateVal >= 50 ? '#16A34A' : '#F59E0B', icon: 'trending-up-outline' },
                    { label: 'Debt & Bills Ratio', value: debtRatioVal, max: 100, color: debtRatioVal >= 70 ? '#4285F4' : '#EF4444', icon: 'card-outline' },
                    { label: 'Budget Discipline', value: budgetDisciplineVal, max: 100, color: budgetDisciplineVal >= 70 ? '#4285F4' : '#F59E0B', icon: 'checkmark-circle-outline' },
                    { label: 'Bill Payments', value: billPaymentVal, max: 100, color: billPaymentVal >= 80 ? '#16A34A' : '#EF4444', icon: 'receipt-outline' },
                    { label: 'Emergency Reserve', value: emergencyVal, max: 100, color: '#8B5CF6', icon: 'shield-outline' },
                ];
            },

            getHealthScore: () => {
                const metrics = get().getHealthMetrics();
                const total = metrics.reduce((sum, m) => sum + m.value, 0);
                return Math.round(total / metrics.length);
            },

            checkUpcomingBills: () => {
                const { bills } = get();
                const today = new Date();

                const upcoming = bills.filter(b => {
                    if (b.is_paid) return false;
                    const dueDate = new Date(b.due_date);
                    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 3;
                });

                if (upcoming.length > 0) {
                    const count = upcoming.length;
                    const totalAmount = upcoming.reduce((sum, b) => sum + (parseFloat(String(b.amount)) || 0), 0);
                    // Standard React Native Alert
                    console.log(`[Automation] Triggering Alert: ${count} bills due shortly.`);
                    Alert.alert(
                        'Upcoming Bills Alert',
                        `You have ${count} bill(s) due in the next 3 days totaling ${totalAmount} FRw. Make sure your wallets are funded.`
                    );
                }
            },

            addWallet: async (newWallet) => {
                const id = `w_${Date.now()}`;
                const walletRecord: WalletRecord = {
                    ...newWallet,
                    id,
                };
                const updatedWallets = [...get().wallets, walletRecord];
                const updatedBaseMap = { ...get().baseWalletBalances, [id]: newWallet.balance };
                set({ wallets: updatedWallets, baseWalletBalances: updatedBaseMap });
            },

            deleteWallet: async (id: string) => {
                const updatedWallets = get().wallets.filter(w => w.id !== id);
                const updatedBaseMap = { ...get().baseWalletBalances };
                delete updatedBaseMap[id];
                const remainingTxs = get().transactions.filter(t => t.wallet_id !== id);
                set({ wallets: updatedWallets, baseWalletBalances: updatedBaseMap, transactions: remainingTxs });
            },

            editWallet: async (id: string, updated: Partial<WalletRecord>) => {
                const { wallets, baseWalletBalances, transactions } = get();
                const target = wallets.find(w => w.id === id);
                if (!target) return;

                let newBaseMap = { ...baseWalletBalances };
                if (updated.balance !== undefined) {
                    const txNet = transactions
                        .filter(t => t.wallet_id === id)
                        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);
                    newBaseMap[id] = Math.max(0, updated.balance - txNet);
                }

                const updatedWallets = wallets.map(w => w.id === id ? { ...w, ...updated } : w);
                set({ wallets: updatedWallets, baseWalletBalances: newBaseMap });
            },

            addTransaction: async (newTx) => {
                const id = `tx_${Date.now()}`;
                const txItem: TransactionRecord = {
                    id,
                    title: newTx.title,
                    type: newTx.type,
                    amount: newTx.amount,
                    category: newTx.category,
                    wallet_id: newTx.wallet_id || 'w1',
                    wallet_name: newTx.wallet_name || 'Main Wallet',
                    date: newTx.date || new Date().toISOString().split('T')[0],
                    notes: newTx.notes,
                };

                const updatedTxs = [txItem, ...get().transactions];
                const { baseWalletBalances, wallets, budgets } = get();

                // Recompute wallet balances from scratch (consistent with delete/edit)
                const walletBalanceMap: Record<string, number> = { ...baseWalletBalances };
                updatedTxs.forEach(tx => {
                    const wid = tx.wallet_id;
                    if (walletBalanceMap[wid] !== undefined) {
                        if (tx.type === 'income') walletBalanceMap[wid] += tx.amount;
                        else if (tx.type === 'expense') walletBalanceMap[wid] -= tx.amount;
                    }
                });

                const updatedWallets = wallets.map(w => ({
                    ...w,
                    balance: Math.max(0, walletBalanceMap[w.id] ?? w.balance),
                }));

                // Recompute budget spending from scratch
                const budgetSpendMap: Record<string, number> = {};
                updatedTxs.forEach(tx => {
                    if (tx.type === 'expense') {
                        budgets.forEach(b => {
                            if (b.category.toLowerCase().includes(tx.category.toLowerCase())) {
                                budgetSpendMap[b.id] = (budgetSpendMap[b.id] || 0) + tx.amount;
                            }
                        });
                    }
                });

                const updatedBudgets = budgets.map(b => {
                    const newSpent = budgetSpendMap[b.id] ?? b.spent;
                    const newPct = Math.min(100, Math.round((newSpent / b.total) * 100));

                    // Budget Alert Notifications
                    if (txItem.type === 'expense' && b.category.toLowerCase().includes(txItem.category.toLowerCase())) {
                        if (newPct >= 100 && b.pct < 100) {
                            Alert.alert('🚨 Budget Exceeded!', `You've exceeded your ${b.category} budget!`);
                        } else if (newPct >= 80 && b.pct < 80) {
                            Alert.alert('⚠️ Budget Warning', `You've used ${newPct}% of your ${b.category} budget.`);
                        }
                    }

                    return { ...b, spent: newSpent, pct: newPct };
                });

                set({ transactions: updatedTxs, wallets: updatedWallets, budgets: updatedBudgets });
            },

            deleteTransaction: async (id: string) => {
                const txToDelete = get().transactions.find(tx => tx.id === id);
                if (!txToDelete) return;

                const remainingTxs = get().transactions.filter(tx => tx.id !== id);
                const { baseWalletBalances, wallets, budgets } = get();

                // Recompute all wallet balances from scratch
                const walletBalanceMap: Record<string, number> = { ...baseWalletBalances };
                remainingTxs.forEach(tx => {
                    const wid = tx.wallet_id;
                    if (walletBalanceMap[wid] !== undefined) {
                        if (tx.type === 'income') walletBalanceMap[wid] += tx.amount;
                        else if (tx.type === 'expense') walletBalanceMap[wid] -= tx.amount;
                    }
                });

                const updatedWallets = wallets.map(w => ({
                    ...w,
                    balance: Math.max(0, walletBalanceMap[w.id] ?? w.balance),
                }));

                // Recompute all budget spending from scratch
                const budgetSpendMap: Record<string, number> = {};
                remainingTxs.forEach(tx => {
                    if (tx.type === 'expense') {
                        budgets.forEach(b => {
                            if (b.category.toLowerCase().includes(tx.category.toLowerCase())) {
                                budgetSpendMap[b.id] = (budgetSpendMap[b.id] || 0) + tx.amount;
                            }
                        });
                    }
                });

                const updatedBudgets = budgets.map(b => {
                    const newSpent = budgetSpendMap[b.id] ?? 0;
                    const newPct = Math.min(100, Math.round((newSpent / b.total) * 100));
                    return { ...b, spent: newSpent, pct: newPct };
                });

                set({ transactions: remainingTxs, wallets: updatedWallets, budgets: updatedBudgets });
            },

            editTransaction: async (id: string, updated: Partial<TransactionRecord>) => {
                const updatedTxs = get().transactions.map(tx => tx.id === id ? { ...tx, ...updated } : tx);
                const { baseWalletBalances, wallets, budgets } = get();

                // Recompute wallet balances with the edited list
                const walletBalanceMap: Record<string, number> = { ...baseWalletBalances };
                updatedTxs.forEach(tx => {
                    const wid = tx.wallet_id;
                    if (walletBalanceMap[wid] !== undefined) {
                        if (tx.type === 'income') walletBalanceMap[wid] += tx.amount;
                        else if (tx.type === 'expense') walletBalanceMap[wid] -= tx.amount;
                    }
                });

                const updatedWallets = wallets.map(w => ({
                    ...w,
                    balance: Math.max(0, walletBalanceMap[w.id] ?? w.balance),
                }));

                // Recompute budget spending with the edited list
                const budgetSpendMap: Record<string, number> = {};
                updatedTxs.forEach(tx => {
                    if (tx.type === 'expense') {
                        budgets.forEach(b => {
                            if (b.category.toLowerCase().includes(tx.category.toLowerCase())) {
                                budgetSpendMap[b.id] = (budgetSpendMap[b.id] || 0) + tx.amount;
                            }
                        });
                    }
                });

                const updatedBudgets = budgets.map(b => {
                    const newSpent = budgetSpendMap[b.id] ?? 0;
                    const newPct = Math.min(100, Math.round((newSpent / b.total) * 100));
                    return { ...b, spent: newSpent, pct: newPct };
                });

                set({ transactions: updatedTxs, wallets: updatedWallets, budgets: updatedBudgets });
            },

            addBill: async (newBill) => {
                const id = `bill_${Date.now()}`;
                const billItem: BillRecord = { ...newBill, id, is_paid: false };
                set({ bills: [...get().bills, billItem] });
            },

            deleteBill: async (id: string) => {
                set({ bills: get().bills.filter((b) => b.id !== id) });
            },

            editBill: async (id: string, updated: Partial<BillRecord>) => {
                set({
                    bills: get().bills.map((b) => (b.id === id ? { ...b, ...updated } : b)),
                });
            },

            markBillPaid: async (billId) => {
                const targetBill = get().bills.find((b) => b.id === billId);
                if (!targetBill || targetBill.is_paid) return;

                const updatedBills = get().bills.map((b) =>
                    b.id === billId ? { ...b, is_paid: true } : b
                );

                const targetWallet = get().wallets[0];
                const updatedWallets = get().wallets.map((w, idx) =>
                    idx === 0 ? { ...w, balance: Math.max(0, w.balance - targetBill.amount) } : w
                );

                const billTx: TransactionRecord = {
                    id: `tx_bill_${Date.now()}`,
                    title: `Paid Bill: ${targetBill.title}`,
                    category: targetBill.category || 'Utilities',
                    amount: targetBill.amount,
                    type: 'expense',
                    wallet_id: targetWallet.id,
                    wallet_name: targetWallet.name,
                    date: new Date().toISOString().split('T')[0],
                };

                set({
                    bills: updatedBills,
                    wallets: updatedWallets,
                    transactions: [billTx, ...get().transactions],
                });
            },

            addBudget: async (newBudget) => {
                const id = `bud_${Date.now()}`;
                const item: BudgetRecord = { ...newBudget, id, spent: 0, pct: 0 };
                set({ budgets: [...get().budgets, item] });
            },

            deleteBudget: async (id: string) => {
                set({ budgets: get().budgets.filter((b) => b.id !== id) });
            },

            editBudget: async (id: string, updated: Partial<BudgetRecord>) => {
                set({
                    budgets: get().budgets.map((b) => (b.id === id ? { ...b, ...updated } : b)),
                });
            },

            addGoal: async (newGoal) => {
                const id = `goal_${Date.now()}`;
                const item: GoalRecord = { ...newGoal, id, current_amount: 0 };
                set({ goals: [...get().goals, item] });
            },

            deleteGoal: async (id: string) => {
                set({ goals: get().goals.filter((g) => g.id !== id) });
            },

            editGoal: async (id: string, updated: Partial<GoalRecord>) => {
                set({
                    goals: get().goals.map((g) => (g.id === id ? { ...g, ...updated } : g)),
                });
            },

            depositGoal: async (goalId, amount) => {
                const updatedGoals = get().goals.map((g) =>
                    g.id === goalId ? { ...g, current_amount: Math.min(g.target_amount, g.current_amount + amount) } : g
                );
                set({ goals: updatedGoals });
            },


            checkGoalProgress: () => {
                const { goals } = get();
                const today = new Date();
                const atRisk = goals.filter(g => {
                    const current = g.current_amount || 0;
                    const target = g.target_amount || 1;
                    const pct = (current / target) * 100;
                    const deadline = new Date(g.deadline);
                    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft > 0 && daysLeft <= 7 && pct < 80;
                });
                if (atRisk.length > 0) {
                    const names = atRisk.map(g => g.title).join(', ');
                    Alert.alert('⚠️ Goals At Risk', `${atRisk.length} goal(s) due soon but under 80%:\n\n${names}\n\nBoost your savings!`);
                }
            },

            checkPlanReminders: () => {
                const { plans } = get();
                const today = new Date().toISOString().slice(0, 10);
                const overdue = plans.filter(p => !p.completed && p.date < today);
                const dueToday = plans.filter(p => !p.completed && p.date === today);
                if (dueToday.length > 0) {
                    Alert.alert('📅 Plans Due Today', `You have ${dueToday.length} plan(s) for today. Open the Planner to view them.`);
                }
                if (overdue.length > 0) {
                    Alert.alert('⏰ Overdue Plans', `You have ${overdue.length} overdue plan(s). Open the Planner to review.`);
                }
            },

            addPlan: async (newPlan) => {
                const id = `plan_${Date.now()}`;
                const item: PlanRecord = { ...newPlan, id, completed: false };
                set({ plans: [item, ...get().plans] });
            },

            deletePlan: async (id: string) => {
                set({ plans: get().plans.filter((p) => p.id !== id) });
            },

            togglePlanDone: async (id: string) => {
                set({ plans: get().plans.map((p) => p.id === id ? { ...p, completed: !p.completed } : p) });
            },
        }),
        {
            name: 'samora_app_data_v2',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
