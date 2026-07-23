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

export interface RegisteredUser {
    fullName: string;
    email: string;
    password?: string;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: UserProfile;
    registeredUsers: Record<string, RegisteredUser>;
    isLoading: boolean;
    isAuthenticated: boolean;
    isBiometricEnabled: boolean;
    pinCode: string | null;

    // Actions
    setSession: (session: Session | null) => void;
    setProfile: (profile: Partial<UserProfile>) => void;
    registerUserAccount: (data: RegisteredUser) => void;
    loginWithCredentials: (email: string) => boolean;
    updateProfile: (data: { fullName?: string; phone?: string; email?: string }) => Promise<void>;
    signOut: () => Promise<void>;
    enableBiometrics: (pin: string) => void;
    disableBiometrics: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            profile: DEFAULT_PROFILE,
            registeredUsers: {},
            isLoading: false,
            isAuthenticated: true, // Default true for instant demo access, updated on session change
            isBiometricEnabled: false,
            pinCode: null,

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
                    isAuthenticated: Boolean(session),
                    isLoading: false,
                });
            },

            setProfile: (newProfileData) => {
                const current = get().profile;
                const updated = { ...current, ...newProfileData };
                set({ profile: updated });
            },

            registerUserAccount: (data) => {
                const key = data.email.toLowerCase().trim();
                const users = get().registeredUsers || {};
                const nameParts = data.fullName.trim().split(' ');
                const firstName = nameParts[0] || 'User';
                const lastName = nameParts.slice(1).join(' ') || '';

                const newUsers = {
                    ...users,
                    [key]: {
                        fullName: data.fullName,
                        email: data.email,
                        password: data.password,
                    },
                };

                const newProfile: UserProfile = {
                    firstName,
                    lastName,
                    fullName: data.fullName,
                    email: data.email,
                    phone: get().profile.phone || '+250 780 000 000',
                };

                set({ registeredUsers: newUsers, profile: newProfile });
            },

            loginWithCredentials: (email) => {
                const key = email.toLowerCase().trim();
                const users = get().registeredUsers || {};
                const found = users[key];

                if (found) {
                    const nameParts = found.fullName.trim().split(' ');
                    const firstName = nameParts[0] || 'User';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    set({
                        isAuthenticated: true,
                        profile: {
                            firstName,
                            lastName,
                            fullName: found.fullName,
                            email: found.email,
                            phone: get().profile.phone || '+250 780 000 000',
                        },
                    });
                    return true;
                }

                // If not in registry, construct account dynamically from email
                const dynamicName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                set({
                    isAuthenticated: true,
                    profile: {
                        firstName: dynamicName.split(' ')[0] || 'User',
                        lastName: dynamicName.split(' ').slice(1).join(' ') || '',
                        fullName: dynamicName,
                        email: email,
                        phone: get().profile.phone || '+250 780 000 000',
                    },
                });
                return true;
            },

            updateProfile: async (data) => {
                const current = get().profile;
                const fullName = data.fullName !== undefined ? data.fullName : current.fullName;
                const phone = data.phone !== undefined ? data.phone : current.phone;
                const email = data.email !== undefined ? data.email : current.email;

                const nameParts = fullName.trim().split(' ');
                const firstName = nameParts[0] || current.firstName;
                const lastName = nameParts.slice(1).join(' ') || current.lastName;

                const updatedProfile = {
                    firstName,
                    lastName,
                    fullName,
                    email,
                    phone,
                };

                set({ profile: updatedProfile });

                if (supabase && get().user) {
                    try {
                        await supabase.auth.updateUser({
                            data: { first_name: firstName, last_name: lastName, full_name: fullName, phone },
                        });
                    } catch (err) {
                        console.warn('[useAuthStore] Supabase profile sync warning:', err);
                    }
                }
            },

            enableBiometrics: (pin: string) => {
                set({ isBiometricEnabled: true, pinCode: pin });
            },

            disableBiometrics: () => {
                set({ isBiometricEnabled: false, pinCode: null });
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
            partialize: (state) => ({ profile: state.profile, isAuthenticated: state.isAuthenticated, registeredUsers: state.registeredUsers }),
        }
    )
);

// Listen to Supabase Auth State changes if client is available
if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.getState().setSession(session);
    });
}
