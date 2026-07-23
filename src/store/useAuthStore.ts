import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../data/api/supabase';

export interface UserProfile {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
}

const DEFAULT_PROFILE: UserProfile = {
    firstName: 'Sam',
    lastName: 'Ndayambaje',
    fullName: 'Sam Ndayambaje',
    email: 'sam@samora.com',
    phone: '+250 78 812 3456',
};

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: UserProfile;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    setProfile: (profile: Partial<UserProfile>) => void;
    updateProfile: (data: { fullName?: string; phone?: string; email?: string }) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            profile: DEFAULT_PROFILE,
            isLoading: false,
            isAuthenticated: true, // Default true for instant demo access, updated on session change

            setSession: (session) => {
                const user = session?.user || null;
                const existingProfile = get().profile;

                let updatedProfile = { ...existingProfile };
                if (user) {
                    const meta = user.user_metadata || {};
                    const email = user.email || existingProfile.email;
                    const firstName = meta.first_name || meta.firstName || existingProfile.firstName;
                    const lastName = meta.last_name || meta.lastName || existingProfile.lastName;
                    const fullName = meta.full_name || meta.fullName || `${firstName} ${lastName}`.trim();
                    const phone = meta.phone || existingProfile.phone;

                    updatedProfile = {
                        firstName,
                        lastName,
                        fullName: fullName || 'Sam Ndayambaje',
                        email,
                        phone,
                    };
                }

                set({
                    session,
                    user,
                    profile: updatedProfile,
                    isAuthenticated: !!session || true,
                    isLoading: false,
                });
            },

            setProfile: (newProfileData) => {
                const current = get().profile;
                const updated = { ...current, ...newProfileData };
                set({ profile: updated });
            },

            updateProfile: async (data) => {
                const current = get().profile;
                const fullName = data.fullName !== undefined ? data.fullName : current.fullName;
                const phone = data.phone !== undefined ? data.phone : current.phone;
                const email = data.email !== undefined ? data.email : current.email;

                // Split name into first and last name
                const nameParts = fullName.trim().split(' ');
                const firstName = nameParts[0] || current.firstName;
                const lastName = nameParts.slice(1).join(' ') || current.lastName;

                const updatedProfile: UserProfile = {
                    firstName,
                    lastName,
                    fullName,
                    email,
                    phone,
                };

                set({ profile: updatedProfile });

                // Sync with Supabase if client exists and user is authenticated
                if (supabase && get().user) {
                    try {
                        await supabase.auth.updateUser({
                            data: {
                                first_name: firstName,
                                last_name: lastName,
                                full_name: fullName,
                                phone: phone,
                            },
                        });
                    } catch (err) {
                        console.warn('[useAuthStore] Supabase profile sync warning:', err);
                    }
                }
            },

            signOut: async () => {
                if (supabase) {
                    try {
                        await supabase.auth.signOut();
                    } catch (err) {
                        console.warn('[useAuthStore] Supabase sign out warning:', err);
                    }
                }
                set({ session: null, user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'samora_auth_store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ profile: state.profile, isAuthenticated: state.isAuthenticated }),
        }
    )
);

// Listen to Supabase Auth State changes if client is available
if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.getState().setSession(session);
    });
}
