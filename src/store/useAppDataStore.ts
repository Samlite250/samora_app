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
    checkUpcomingBills: () => void;
    checkGoalProgress: () => void;
    checkPlanReminders: () => void;

    // Actions
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
    deleteWallet: (id: string) => Promise<void>;
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

            getHealthScore: () => {
                const { wallets, bills, budgets } = get();
                const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(String(w.balance)) || 0), 0);
                const unpaidBills = bills.filter(b => !b.is_paid).reduce((sum, b) => sum + (parseFloat(String(b.amount)) || 0), 0);

                // Simplified health algorithm
                let score = 100;

                // Deduct if unpaid bills >> balance
                if (unpaidBills > totalBalance) {
                    score -= 40;
                } else if (unpaidBills > totalBalance * 0.5) {
                    score -= 20;
                }

                // Deduct if budgets are mostly exhausted
                const exhaustedBudgets = budgets.filter(b => b.pct >= 80).length;
                score -= (exhaustedBudgets * 5); // 5 points per exhausted budget

                return Math.max(0, Math.min(100, score));
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

            deleteWallet: async (id: string) => {
                set({ wallets: get().wallets.filter((w) => w.id !== id) });
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
