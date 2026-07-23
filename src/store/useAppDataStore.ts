import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../data/api/supabase';
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
    addBill: (bill: Omit<BillRecord, 'id' | 'is_paid'>) => Promise<void>;
    markBillPaid: (billId: string) => Promise<void>;
    addBudget: (budget: Omit<BudgetRecord, 'id' | 'spent' | 'pct'>) => Promise<void>;
    addGoal: (goal: Omit<GoalRecord, 'id' | 'current_amount'>) => Promise<void>;
    depositGoal: (goalId: string, amount: number) => Promise<void>;
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

                // 1. Update transactions list
                const updatedTxs = [txItem, ...get().transactions];

                // 2. Update wallet balance automatically
                const updatedWallets = get().wallets.map((w) => {
                    if (w.name === txItem.wallet_name || w.id === txItem.wallet_id) {
                        const change = txItem.type === 'income' ? txItem.amount : txItem.type === 'expense' ? -txItem.amount : 0;
                        return { ...w, balance: Math.max(0, w.balance + change) };
                    }
                    return w;
                });

                // 3. Update budget spending if expense
                const updatedBudgets = get().budgets.map((b) => {
                    if (txItem.type === 'expense' && b.category.toLowerCase().includes(txItem.category.toLowerCase())) {
                        const newSpent = b.spent + txItem.amount;
                        return { ...b, spent: newSpent, pct: Math.min(100, Math.round((newSpent / b.total) * 100)) };
                    }
                    return b;
                });

                set({
                    transactions: updatedTxs,
                    wallets: updatedWallets,
                    budgets: updatedBudgets,
                });

                // 4. Try Syncing to Supabase
                if (supabase) {
                    try {
                        await supabase.from('transactions').insert([{
                            title: txItem.title,
                            type: txItem.type,
                            amount: txItem.amount,
                            category: txItem.category,
                            wallet_name: txItem.wallet_name,
                            date: txItem.date,
                        }]);
                    } catch (e) { }
                }
            },

            addBill: async (newBill) => {
                const id = `bill_${Date.now()}`;
                const billItem: BillRecord = { ...newBill, id, is_paid: false };
                set({ bills: [...get().bills, billItem] });

                if (supabase) {
                    try {
                        await supabase.from('bills').insert([billItem]);
                    } catch (e) { }
                }
            },

            markBillPaid: async (billId) => {
                const targetBill = get().bills.find((b) => b.id === billId);
                if (!targetBill || targetBill.is_paid) return;

                const updatedBills = get().bills.map((b) =>
                    b.id === billId ? { ...b, is_paid: true } : b
                );

                // Auto-deduct from main wallet as expense
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

            addGoal: async (newGoal) => {
                const id = `goal_${Date.now()}`;
                const item: GoalRecord = { ...newGoal, id, current_amount: 0 };
                set({ goals: [...get().goals, item] });
            },

            depositGoal: async (goalId, amount) => {
                const updatedGoals = get().goals.map((g) =>
                    g.id === goalId ? { ...g, current_amount: Math.min(g.target_amount, g.current_amount + amount) } : g
                );
                set({ goals: updatedGoals });
            },
        }),
        {
            name: 'samora_app_data_v2',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
