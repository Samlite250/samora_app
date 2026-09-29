import { supabase as supabaseRaw } from '../../data/api/supabase';
import { BillRecord, BudgetRecord, GoalRecord } from '../../data/mockData';
const supabase = supabaseRaw!;

// Types (simplified)
export interface WalletRecord {
    id: string;
    user_id: string;
    name: string;
    type: 'Mobile Money' | 'Bank Account' | 'Savings' | 'Cash' | 'Credit Card';
    balance: number;
    color?: string;
    icon?: string;
}

export interface TransactionRecord {
    id: string;
    user_id: string;
    wallet_id: string;
    wallet_name?: string;
    category: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    title: string;
    notes?: string;
    date: string;
}

export interface Profile {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    currency?: string;
    health_score?: number;
}

/** Get user profile */
export async function getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        console.error('getUserProfile error:', error);
        return null;
    }
    return data as Profile;
}

/** Get wallets for a user */
export async function getWallets(userId: string): Promise<WalletRecord[]> {
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId);
    if (error) {
        console.error('getWallets error:', error);
        return [];
    }
    return data as WalletRecord[];
}

/** Get transactions for a user */
export async function getTransactions(userId: string): Promise<TransactionRecord[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*, wallets!inner(name)')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) {
        console.error('getTransactions error:', error);
        return [];
    }
    return data as TransactionRecord[];
}

/** Create an income transaction */
export async function createIncome(userId: string, payload: Omit<TransactionRecord, 'id' | 'type' | 'user_id'>): Promise<TransactionRecord | null> {
    const { data, error } = await supabase.from('transactions').insert([
        { ...payload, user_id: userId, type: 'income' },
    ]).select().single();
    if (error) {
        console.error('createIncome error:', error);
        return null;
    }
    return data as TransactionRecord;
}

/** Create an expense transaction */
export async function createExpense(userId: string, payload: Omit<TransactionRecord, 'id' | 'type' | 'user_id'>): Promise<TransactionRecord | null> {
    const { data, error } = await supabase.from('transactions').insert([
        { ...payload, user_id: userId, type: 'expense' },
    ]).select().single();
    if (error) {
        console.error('createExpense error:', error);
        return null;
    }
    return data as TransactionRecord;
}

/** Compute total balance for a user */
export async function getBalance(userId: string): Promise<number> {
    const wallets = await getWallets(userId);
    return wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
}

/** Get plans */
export async function getPlans(userId: string) {
    const { data, error } = await supabase.from('plans').select('*').eq('user_id', userId);
    if (error) {
        console.error('getPlans error:', error);
        return [];
    }
    return data;
}

/** Create a plan */
export async function createPlan(userId: string, payload: any) {
    const { data, error } = await supabase.from('plans').insert([{ ...payload, user_id: userId }]).select().single();
    if (error) {
        console.error('createPlan error:', error);
        return null;
    }
    return data;
}

// Duplicate task functions removed; using implementations added later in the file

// Bills
export async function getBills(userId: string): Promise<BillRecord[]> {
    const { data, error } = await supabase.from('bills').select('*').eq('user_id', userId);
    if (error) { console.error('getBills error:', error); return []; }
    return data as BillRecord[];
}

export async function addBill(userId: string, payload: Omit<BillRecord, 'id' | 'is_paid'>): Promise<BillRecord | null> {
    const { data, error } = await supabase.from('bills').insert([{ ...payload, user_id: userId, is_paid: false }]).select().single();
    if (error) { console.error('addBill error:', error); return null; }
    return data as BillRecord;
}

export async function deleteBill(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) { console.error('deleteBill error:', error); return false; }
    return true;
}

export async function editBill(userId: string, id: string, updated: Partial<BillRecord>): Promise<boolean> {
    const { error } = await supabase.from('bills').update(updated).eq('id', id);
    if (error) { console.error('editBill error:', error); return false; }
    return true;
}

export async function markBillPaid(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase.from('bills').update({ is_paid: true }).eq('id', id);
    if (error) { console.error('markBillPaid error:', error); return false; }
    return true;
}

// Budgets
export async function getBudgets(userId: string): Promise<BudgetRecord[]> {
    const { data, error } = await supabase.from('budgets').select('*, categories!inner(name, icon, color)').eq('user_id', userId);
    if (error) { console.error('getBudgets error:', error); return []; }
    return data.map((b: any) => ({
        ...b,
        icon: b.categories?.icon || 'pie-chart-outline',
        color: b.categories?.color || '#4285F4',
        category: b.categories?.name || 'Unknown',
    })) as BudgetRecord[];
}

export async function addBudget(userId: string, payload: Omit<BudgetRecord, 'id' | 'spent' | 'pct'>): Promise<BudgetRecord | null> {
    const { data, error } = await supabase.from('budgets').insert([{ ...payload, user_id: userId, spent: 0, pct: 0 }]).select().single();
    if (error) { console.error('addBudget error:', error); return null; }
    return data as BudgetRecord;
}

export async function deleteBudget(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) { console.error('deleteBudget error:', error); return false; }
    return true;
}

export async function editBudget(userId: string, id: string, updated: Partial<BudgetRecord>): Promise<boolean> {
    const { error } = await supabase.from('budgets').update(updated).eq('id', id);
    if (error) { console.error('editBudget error:', error); return false; }
    return true;
}

// Goals
export async function getGoals(userId: string): Promise<GoalRecord[]> {
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId);
    if (error) { console.error('getGoals error:', error); return []; }
    return data as GoalRecord[];
}

export async function addGoal(userId: string, payload: Omit<GoalRecord, 'id' | 'current_amount'>): Promise<GoalRecord | null> {
    const { data, error } = await supabase.from('goals').insert([{ ...payload, user_id: userId, current_amount: 0 }]).select().single();
    if (error) { console.error('addGoal error:', error); return null; }
    return data as GoalRecord;
}

export async function deleteGoal(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) { console.error('deleteGoal error:', error); return false; }
    return true;
}

export async function editGoal(userId: string, id: string, updated: Partial<GoalRecord>): Promise<boolean> {
    const { error } = await supabase.from('goals').update(updated).eq('id', id);
    if (error) { console.error('editGoal error:', error); return false; }
    return true;
}

export async function depositGoal(userId: string, goalId: string, amount: number): Promise<boolean> {
    const goal = await getGoals(userId).then(gs => gs.find(g => g.id === goalId));
    if (!goal) return false;
    const newAmount = Math.min(goal.target_amount, goal.current_amount + amount);
    const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goalId);
    if (error) { console.error('depositGoal error:', error); return false; }
    return true;
}

// Plans (additional helpers)
export async function deletePlan(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) { console.error('deletePlan error:', error); return false; }
    return true;
}

export async function togglePlanDone(userId: string, id: string, completed: boolean): Promise<boolean> {
    const { error } = await supabase.from('plans').update({ completed }).eq('id', id);
    if (error) { console.error('togglePlanDone error:', error); return false; }
    return true;
}

// Tasks (additional helpers)
export async function getTasks(userId: string): Promise<any[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
    if (error) { console.error('getTasks error:', error); return []; }
    return data;
}

export async function createTask(userId: string, payload: any): Promise<any | null> {
    const { data, error } = await supabase.from('tasks').insert([{ ...payload, user_id: userId }]).select().single();
    if (error) { console.error('createTask error:', error); return null; }
    return data;
}
