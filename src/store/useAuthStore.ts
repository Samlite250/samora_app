import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../data/api/supabase';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    isLoading: false, // start false so app doesn't hang when no credentials
    setSession: (session) => {
        set({ session, user: session?.user || null, isLoading: false });
    },
    signOut: async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        set({ session: null, user: null });
    },
}));

// Initialize auth state listener only if supabase is configured
if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.getState().setSession(session);
    });
} else {
    // No credentials — treat as logged out, no loading spinner
    useAuthStore.getState().setSession(null);
}
