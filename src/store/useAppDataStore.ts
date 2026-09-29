import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createExpense, createIncome, getTransactions, getWallets } from '../core/services/financialService';
import { supabase as supabaseRaw } from '../data/api/supabase';
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
import { useAuthStore } from './useAuthStore';
const supabase = supabaseRaw!;

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

    // Database Sync
    fetchData: () => Promise<void>;

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

            fetchData: async () => {
                const user = useAuthStore.getState().user;
                if (!user) return;
                try {
                    const wallets = await getWallets(user.id);
                    const transactions = await getTransactions(user.id);
                    const billsRes = await supabase.from('bills').select('*').eq('user_id', user.id).order('due_date', { ascending: true });
                    const bills = billsRes.data && billsRes.data.length > 0 ? billsRes.data : INITIAL_BILLS;
                    const budgetsRes = await supabase.from('budgets').select('*, categories!inner(name, icon, color)').eq('user_id', user.id);
                    const budgets = budgetsRes.data && budgetsRes.data.length > 0 ? budgetsRes.data.map((b: any) => ({
                        ...b, icon: b.categories?.icon || 'pie-chart-outline', color: b.categories?.color || '#4285F4', category: b.categories?.name || 'Unknown'
                    })) : INITIAL_BUDGETS;
                    const goalsRes = await supabase.from('goals').select('*').eq('user_id', user.id);
                    const goals = goalsRes.data && goalsRes.data.length > 0 ? goalsRes.data : INITIAL_GOALS;
                    const plansRes = await supabase.from('plans').select('*').eq('user_id', user.id).order('date', { ascending: true });
                    const plans = plansRes.data && plansRes.data.length > 0 ? plansRes.data : INITIAL_PLANS;
                    const baseWalletBalances = Object.fromEntries(wallets.map((w: any) => [w.id, w.balance]));
                    set({ wallets, transactions, bills, budgets, goals, plans, baseWalletBalances });
                } catch (e) {
                    console.log('Error fetching data via financialService:', e);
                }
            },

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
                const user = useAuthStore.getState().user;
                if (!user || !supabase) return;

                const { data, error } = await supabase.from('wallets').insert([{
                    user_id: user.id,
                    name: newWallet.name,
                    type: newWallet.type,
                    balance: newWallet.balance,
                    color: newWallet.color,
                    icon: newWallet.icon
                }]).select().single();

                if (error || !data) {
                    console.error('addWallet err:', error);
                    return;
                }

                const walletRecord: WalletRecord = {
                    ...newWallet,
                    id: data.id,
                };
                const updatedWallets = [...get().wallets, walletRecord];
                const updatedBaseMap = { ...get().baseWalletBalances, [data.id]: newWallet.balance };
                set({ wallets: updatedWallets, baseWalletBalances: updatedBaseMap });
            },

            deleteWallet: async (id: string) => {
                const { error } = await supabase.from('wallets').delete().eq('id', id);
                if (error) { console.error('deleteWallet err:', error); return; }

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

                const { error } = await supabase.from('wallets').update(updated).eq('id', id);
                if (error) { console.error('editWallet err:', error); return; }

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
                const user = useAuthStore.getState().user;
                if (!user) return;
                try {
                    let result: TransactionRecord | null = null;
                    if (newTx.type === 'income') {
                        result = await createIncome(user.id, {
                            wallet_id: newTx.wallet_id,
                            category: newTx.category,
                            title: newTx.title,
                            amount: newTx.amount,
                            notes: newTx.notes,
                            date: newTx.date || new Date().toISOString().split('T')[0]
                        });
                    } else if (newTx.type === 'expense') {
                        result = await createExpense(user.id, {
                            wallet_id: newTx.wallet_id,
                            category: newTx.category,
                            title: newTx.title,
                            amount: newTx.amount,
                            notes: newTx.notes,
                            date: newTx.date || new Date().toISOString().split('T')[0]
                        });
                    }
                    if (!result) return;
                    // Update local state similarly to previous logic
                    const txItem: TransactionRecord = {
                        id: result.id,
                        title: result.title,
                        type: result.type,
                        amount: result.amount,
                        category: result.category,
                        wallet_id: result.wallet_id,
                        wallet_name: newTx.wallet_name || get().wallets.find(w => w.id === result.wallet_id)?.name || 'Wallet',
                        date: result.date,
                        notes: result.notes,
                    };
                    const updatedTxs = [txItem, ...get().transactions];
                    const { baseWalletBalances, wallets, budgets } = get();
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
                } catch (e) {
                    console.error('addTransaction service error:', e);
                }
            },

            deleteTransaction: async (id: string) => {
                const txToDelete = get().transactions.find(tx => tx.id === id);
                if (!txToDelete) return;

                const { error } = await supabase.from('transactions').delete().eq('id', id);
                if (error) { console.error('deleteTx error:', error); return; }

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
                const { error } = await supabase.from('transactions').update(updated).eq('id', id);
                if (error) { console.error('editTx error:', error); return; }

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

                // Bug 4+8 fix: seed map from current budget spent values so unrelated
                // budgets are NOT zeroed out — only recompute from scratch via full tx scan
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
                    // Bug 4+8 fix: fall back to previous b.spent (not 0) for unrelated budgets
                    const newSpent = budgetSpendMap[b.id] !== undefined ? budgetSpendMap[b.id] : b.spent;
                    const newPct = Math.min(100, Math.round((newSpent / b.total) * 100));
                    return { ...b, spent: newSpent, pct: newPct };
                });

                set({ transactions: updatedTxs, wallets: updatedWallets, budgets: updatedBudgets });
            },

            addBill: async (newBill) => {
                const user = useAuthStore.getState().user;
                if (!user || !supabase) return;

                const { data, error } = await supabase.from('bills').insert([{
                    user_id: user.id,
                    title: newBill.title,
                    amount: newBill.amount,
                    due_date: newBill.due_date,
                    category: newBill.category,
                    provider: newBill.provider,
                    is_paid: false
                }]).select().single();

                if (error || !data) { console.error('addBill error:', error); return; }
                const billItem: BillRecord = { ...newBill, id: data.id, is_paid: false };
                set({ bills: [...get().bills, billItem] });
            },

            deleteBill: async (id: string) => {
                const { error } = await supabase.from('bills').delete().eq('id', id);
                if (error) { console.error('deleteBill error:', error); return; }
                set({ bills: get().bills.filter((b) => b.id !== id) });
            },

            editBill: async (id: string, updated: Partial<BillRecord>) => {
                const { error } = await supabase.from('bills').update(updated).eq('id', id);
                if (error) { console.error('editBill error:', error); return; }
                set({
                    bills: get().bills.map((b) => (b.id === id ? { ...b, ...updated } : b)),
                });
            },

            markBillPaid: async (billId) => {
                const targetBill = get().bills.find((b) => b.id === billId);
                if (!targetBill || targetBill.is_paid) return;

                const { error } = await supabase.from('bills').update({ is_paid: true }).eq('id', billId);
                if (error) { console.error('markBillPaid error:', error); return; }

                // Bug 3 fix: mark bill paid first
                const updatedBills = get().bills.map((b) =>
                    b.id === billId ? { ...b, is_paid: true } : b
                );
                set({ bills: updatedBills });

                // Bug 3 fix: use addTransaction so wallet balance recompute runs
                // through the same consistent path as all other expense transactions
                const targetWallet = get().wallets[0];
                await get().addTransaction({
                    title: `Paid Bill: ${targetBill.title}`,
                    category: targetBill.category || 'Utilities',
                    amount: targetBill.amount,
                    type: 'expense',
                    wallet_id: targetWallet.id,
                    wallet_name: targetWallet.name,
                    date: new Date().toISOString().split('T')[0],
                });
            },

            addBudget: async (newBudget) => {
                const user = useAuthStore.getState().user;
                if (!user || !supabase) return;

                const { data, error } = await supabase.from('budgets').insert([{
                    user_id: user.id,
                    category: newBudget.category,
                    total: newBudget.total,
                    icon: newBudget.icon,
                    color: newBudget.color,
                    spent: 0,
                    pct: 0
                }]).select().single();

                if (error || !data) { console.error('addBudget error:', error); return; }
                const item: BudgetRecord = { ...newBudget, id: data.id, spent: 0, pct: 0 };
                set({ budgets: [...get().budgets, item] });
            },

            deleteBudget: async (id: string) => {
                const { error } = await supabase.from('budgets').delete().eq('id', id);
                if (error) { console.error('deleteBudget error:', error); return; }
                set({ budgets: get().budgets.filter((b) => b.id !== id) });
            },

            editBudget: async (id: string, updated: Partial<BudgetRecord>) => {
                const { error } = await supabase.from('budgets').update(updated).eq('id', id);
                if (error) { console.error('editBudget error:', error); return; }
                set({
                    budgets: get().budgets.map((b) => (b.id === id ? { ...b, ...updated } : b)),
                });
            },

            addGoal: async (newGoal) => {
                const user = useAuthStore.getState().user;
                if (!user || !supabase) return;

                const { data, error } = await supabase.from('goals').insert([{
                    user_id: user.id,
                    title: newGoal.title,
                    target_amount: newGoal.target_amount,
                    deadline: newGoal.deadline,
                    category: newGoal.category,
                    icon: newGoal.icon,
                    color: newGoal.color,
                    current_amount: 0
                }]).select().single();

                if (error || !data) { console.error('addGoal error:', error); return; }
                const item: GoalRecord = { ...newGoal, id: data.id, current_amount: 0 };
                set({ goals: [...get().goals, item] });
            },

            deleteGoal: async (id: string) => {
                const { error } = await supabase.from('goals').delete().eq('id', id);
                if (error) { console.error('deleteGoal error:', error); return; }
                set({ goals: get().goals.filter((g) => g.id !== id) });
            },

            editGoal: async (id: string, updated: Partial<GoalRecord>) => {
                const { error } = await supabase.from('goals').update(updated).eq('id', id);
                if (error) { console.error('editGoal error:', error); return; }
                set({
                    goals: get().goals.map((g) => (g.id === id ? { ...g, ...updated } : g)),
                });
            },

            depositGoal: async (goalId, amount) => {
                const targetGoal = get().goals.find((g) => g.id === goalId);
                if (!targetGoal) return;

                const newAmount = Math.min(targetGoal.target_amount, targetGoal.current_amount + amount);
                const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goalId);
                if (error) { console.error('depositGoal error:', error); return; }

                const updatedGoals = get().goals.map((g) =>
                    g.id === goalId ? { ...g, current_amount: newAmount } : g
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
                const user = useAuthStore.getState().user;
                if (!user || !supabase) return;

                const { data, error } = await supabase.from('plans').insert([{
                    user_id: user.id,
                    date: newPlan.date,
                    note: newPlan.note,
                    completed: false
                }]).select().single();

                if (error || !data) { console.error('addPlan error:', error); return; }
                const item: PlanRecord = { ...newPlan, id: data.id, completed: false };
                set({ plans: [item, ...get().plans] });
            },

            deletePlan: async (id: string) => {
                const { error } = await supabase.from('plans').delete().eq('id', id);
                if (error) { console.error('deletePlan error:', error); return; }
                set({ plans: get().plans.filter((p) => p.id !== id) });
            },

            togglePlanDone: async (id: string) => {
                const target = get().plans.find(p => p.id === id);
                if (!target) return;

                const newStatus = !target.completed;
                const { error } = await supabase.from('plans').update({ completed: newStatus }).eq('id', id);
                if (error) { console.error('togglePlanDone error:', error); return; }

                set({ plans: get().plans.map((p) => p.id === id ? { ...p, completed: newStatus } : p) });
            },
        }),
        {
            name: 'samora_app_data_v2',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
