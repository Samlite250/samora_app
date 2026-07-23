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
    INITIAL_TRANSACTIONS,
    INITIAL_WALLETS,
    TransactionRecord,
    WalletRecord,
} from '../data/mockData';

interface AppDataState {
    wallets: WalletRecord[];
    transactions: TransactionRecord[];
    bills: BillRecord[];
    budgets: BudgetRecord[];
    goals: GoalRecord[];

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
}

export const useAppDataStore = create<AppDataState>()(
    persist(
        (set, get) => ({
            wallets: INITIAL_WALLETS,
            transactions: INITIAL_TRANSACTIONS,
            bills: INITIAL_BILLS,
            budgets: INITIAL_BUDGETS,
            goals: INITIAL_GOALS,

            addTransaction: async (newTx) => {
                const id = `tx_${Date.now()}`;
                const txItem: TransactionRecord = {
                    id,
                    title: newTx.title,
                    type: newTx.type,
                    amount: newTx.amount,
                    category: newTx.category,
                    wallet_id: newTx.wallet_id || 'w1',
                    wallet_name: newTx.wallet_name || 'Bank of Kigali',
                    date: newTx.date || new Date().toISOString().split('T')[0],
                    notes: newTx.notes,
                };

                const updatedTxs = [txItem, ...get().transactions];
                const updatedWallets = get().wallets.map((w) => {
                    if (w.name === txItem.wallet_name || w.id === txItem.wallet_id) {
                        const change = txItem.type === 'income' ? txItem.amount : txItem.type === 'expense' ? -txItem.amount : 0;
                        return { ...w, balance: Math.max(0, w.balance + change) };
                    }
                    return w;
                });

                const updatedBudgets = get().budgets.map((b) => {
                    if (txItem.type === 'expense' && b.category.toLowerCase().includes(txItem.category.toLowerCase())) {
                        const newSpent = b.spent + txItem.amount;
                        const newPct = Math.min(100, Math.round((newSpent / b.total) * 100));

                        // Budget Alert Notifications
                        if (newPct >= 100 && b.pct < 100) {
                            Alert.alert('🚨 Budget Exceeded!', `You have exceeded your ${b.category} budget of ${b.total} FRw.`);
                        } else if (newPct >= 80 && b.pct < 80) {
                            Alert.alert('⚠️ Budget Warning', `You have used ${newPct}% of your ${b.category} budget.`);
                        }

                        return { ...b, spent: newSpent, pct: newPct };
                    }
                    return b;
                });

                set({
                    transactions: updatedTxs,
                    wallets: updatedWallets,
                    budgets: updatedBudgets,
                });
            },

            deleteTransaction: async (id: string) => {
                set({ transactions: get().transactions.filter((tx) => tx.id !== id) });
            },

            editTransaction: async (id: string, updated: Partial<TransactionRecord>) => {
                set({
                    transactions: get().transactions.map((tx) =>
                        tx.id === id ? { ...tx, ...updated } : tx
                    ),
                });
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
        }),
        {
            name: 'samora_app_data_v2',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
