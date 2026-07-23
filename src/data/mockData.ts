export interface WalletRecord {
    id: string;
    name: string;
    type: 'Mobile Money' | 'Bank Account' | 'Savings' | 'Cash' | 'Credit Card';
    balance: number; // in RWF
    color: string;
    icon: string;
}

export interface TransactionRecord {
    id: string;
    title: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number; // in RWF
    category: string;
    wallet_id: string;
    wallet_name: string;
    date: string;
    notes?: string;
}

export interface BudgetRecord {
    id: string;
    category: string;
    spent: number; // in RWF
    total: number; // in RWF
    icon: string;
    color: string;
    pct: number;
}

export interface BillRecord {
    id: string;
    title: string;
    amount: number; // in RWF
    due_date: string;
    category: string;
    is_paid: boolean;
    provider: string;
}

export interface GoalRecord {
    id: string;
    title: string;
    target_amount: number; // in RWF
    current_amount: number; // in RWF
    deadline: string;
    category: string;
    icon: string;
    color: string;
}

export interface PlanRecord {
    id: string;
    date: string; // YYYY-MM-DD
    note: string;
    completed: boolean;
}

// ─── 5 WALLETS ───
export const INITIAL_WALLETS: WalletRecord[] = [
    { id: 'w1', name: 'MTN Mobile Money', type: 'Mobile Money', balance: 850000, color: '#F59E0B', icon: 'phone-portrait-outline' },
    { id: 'w2', name: 'BK Current Account', type: 'Bank Account', balance: 2450000, color: '#4285F4', icon: 'business-outline' },
    { id: 'w3', name: 'I&M Savings Account', type: 'Savings', balance: 4120000, color: '#16A34A', icon: 'wallet-outline' },
    { id: 'w4', name: 'Cash Wallet', type: 'Cash', balance: 145000, color: '#8B5CF6', icon: 'cash-outline' },
    { id: 'w5', name: 'Equity Visa Card', type: 'Credit Card', balance: 620000, color: '#EF4444', icon: 'card-outline' },
];

// ─── 5 TRANSACTIONS ───
export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
    { id: 't1', title: 'Monthly Salary Deposit', type: 'income', amount: 2850000, category: 'Income', wallet_id: 'w2', wallet_name: 'BK Current Account', date: '2026-07-22' },
    { id: 't2', title: 'House Rent Payment', type: 'expense', amount: 450000, category: 'Housing', wallet_id: 'w2', wallet_name: 'BK Current Account', date: '2026-07-20' },
    { id: 't3', title: 'Simba Supermarket Groceries', type: 'expense', amount: 68500, category: 'Food & Dining', wallet_id: 'w1', wallet_name: 'MTN Mobile Money', date: '2026-07-19' },
    { id: 't4', title: 'MTN Airtime & Data Bundle', type: 'expense', amount: 15000, category: 'Utilities', wallet_id: 'w1', wallet_name: 'MTN Mobile Money', date: '2026-07-18' },
    { id: 't5', title: 'Transfer to I&M Savings', type: 'transfer', amount: 350000, category: 'Savings', wallet_id: 'w3', wallet_name: 'I&M Savings Account', date: '2026-07-15' },
];

// ─── 5 BUDGETS ───
export const INITIAL_BUDGETS: BudgetRecord[] = [
    { id: 'b1', category: 'Food & Dining', spent: 340000, total: 450000, icon: 'restaurant-outline', color: '#4285F4', pct: 75 },
    { id: 'b2', category: 'Housing & Rent', spent: 450000, total: 450000, icon: 'home-outline', color: '#16A34A', pct: 100 },
    { id: 'b3', category: 'Transport & Fuel', spent: 95000, total: 150000, icon: 'car-outline', color: '#F59E0B', pct: 63 },
    { id: 'b4', category: 'Utilities & Bills', spent: 78000, total: 100000, icon: 'flash-outline', color: '#8B5CF6', pct: 78 },
    { id: 'b5', category: 'Shopping & Leisure', spent: 120000, total: 200000, icon: 'bag-outline', color: '#EF4444', pct: 60 },
];

// ─── 5 BILLS / EVENTS ───
export const INITIAL_BILLS: BillRecord[] = [
    { id: 'bl1', title: 'EUCL Electricity Token', amount: 25000, due_date: '2026-07-28', category: 'Utilities', is_paid: false, provider: 'EUCL' },
    { id: 'bl2', title: 'WASAC Water Bill', amount: 12500, due_date: '2026-07-30', category: 'Utilities', is_paid: false, provider: 'WASAC' },
    { id: 'bl3', title: 'MTN 4G Home Fiber', amount: 35000, due_date: '2026-08-01', category: 'Internet', is_paid: false, provider: 'MTN Rwanda' },
    { id: 'bl4', title: 'Canal+ TV Subscription', amount: 18000, due_date: '2026-08-05', category: 'Entertainment', is_paid: true, provider: 'Canal+' },
    { id: 'bl5', title: 'Waka Fitness Gym Membership', amount: 50000, due_date: '2026-08-10', category: 'Health', is_paid: false, provider: 'Waka Fitness' },
];

// ─── 5 GOALS ───
export const INITIAL_GOALS: GoalRecord[] = [
    { id: 'g1', title: 'Emergency Fund', target_amount: 3000000, current_amount: 2150000, deadline: '2026-12-31', category: 'Savings', icon: 'shield-checkmark-outline', color: '#16A34A' },
    { id: 'g2', title: 'Buy Plot of Land (Kigali)', target_amount: 15000000, current_amount: 6800000, deadline: '2027-06-30', category: 'Real Estate', icon: 'location-outline', color: '#4285F4' },
    { id: 'g3', title: 'MacBook Pro M3 Upgrade', target_amount: 2800000, current_amount: 1950000, deadline: '2026-10-15', category: 'Gadgets', icon: 'laptop-outline', color: '#8B5CF6' },
    { id: 'g4', title: 'Annual Family Vacation', target_amount: 2000000, current_amount: 1400000, deadline: '2026-11-20', category: 'Travel', icon: 'airplane-outline', color: '#F59E0B' },
    { id: 'g5', title: 'Stock Investment Portfolio', target_amount: 5000000, current_amount: 2300000, deadline: '2027-03-31', category: 'Investment', icon: 'trending-up-outline', color: '#EC4899' },
];

// ─── PLANNED NOTES ───
export const INITIAL_PLANS: PlanRecord[] = [
    { id: 'p1', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), note: 'Pay taxes and audit docs.', completed: false },
    { id: 'p2', date: new Date().toISOString().slice(0, 10), note: 'Buy groceries for the week.', completed: false },
];
