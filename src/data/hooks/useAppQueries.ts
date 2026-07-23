import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import {
    INITIAL_BILLS,
    INITIAL_BUDGETS,
    INITIAL_GOALS,
    INITIAL_TRANSACTIONS,
    INITIAL_WALLETS
} from '../mockData';

// Helper hook to fetch the current user's profile
export function useProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!supabase || !userId) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) return null;
            return data;
        },
        enabled: !!userId,
    });
}

// Fetch wallets for active user
export function useWallets(userId?: string) {
    return useQuery({
        queryKey: ['wallets', userId],
        queryFn: async () => {
            if (!supabase || !userId) return INITIAL_WALLETS as any;
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });
            if (error || !data || data.length === 0) return INITIAL_WALLETS as any;
            return data;
        },
        initialData: INITIAL_WALLETS as any,
    });
}

// Fetch transactions with related wallet info
export function useTransactions(userId?: string, limit?: number) {
    return useQuery({
        queryKey: ['transactions', userId, limit],
        queryFn: async () => {
            if (!supabase || !userId) {
                return (limit ? INITIAL_TRANSACTIONS.slice(0, limit) : INITIAL_TRANSACTIONS) as any;
            }
            let query = supabase
                .from('transactions')
                .select('*, wallets(name, type)')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error || !data || data.length === 0) {
                return (limit ? INITIAL_TRANSACTIONS.slice(0, limit) : INITIAL_TRANSACTIONS) as any;
            }
            return data;
        },
        initialData: (limit ? INITIAL_TRANSACTIONS.slice(0, limit) : INITIAL_TRANSACTIONS) as any,
    });
}

// Fetch budgets
export function useBudgets(userId?: string) {
    return useQuery({
        queryKey: ['budgets', userId],
        queryFn: async () => {
            if (!supabase || !userId) return INITIAL_BUDGETS as any;
            const { data, error } = await supabase
                .from('budgets')
                .select('*, categories(name, icon, color)')
                .eq('user_id', userId);
            if (error || !data || data.length === 0) return INITIAL_BUDGETS as any;
            return data;
        },
        initialData: INITIAL_BUDGETS as any,
    });
}

// Fetch goals
export function useGoals(userId?: string) {
    return useQuery({
        queryKey: ['goals', userId],
        queryFn: async () => {
            if (!supabase || !userId) return INITIAL_GOALS as any;
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId);
            if (error || !data || data.length === 0) return INITIAL_GOALS as any;
            return data;
        },
        initialData: INITIAL_GOALS as any,
    });
}

// Fetch bills
export function useBills(userId?: string) {
    return useQuery({
        queryKey: ['bills', userId],
        queryFn: async () => {
            if (!supabase || !userId) return INITIAL_BILLS as any;
            const { data, error } = await supabase
                .from('bills')
                .select('*')
                .eq('user_id', userId)
                .order('due_date', { ascending: true });
            if (error || !data || data.length === 0) return INITIAL_BILLS as any;
            return data;
        },
        initialData: INITIAL_BILLS as any,
    });
}


