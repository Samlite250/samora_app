import { create } from 'zustand';
import {
    getWhatsAppAccount,
    linkWhatsAppAccount as linkService,
    unlinkWhatsAppAccount as unlinkService,
    WhatsAppAccountRecord
} from '../core/services/whatsappService';
import { useAuthStore } from './useAuthStore';

export { WhatsAppAccountRecord };

interface WhatsAppState {
    linkedAccount: WhatsAppAccountRecord | null;
    isLoading: boolean;
    error: string | null;
    pendingPhone: string | null;
    verificationStep: 'idle' | 'otp_sent' | 'verified';
    generatedOtp: string | null;

    fetchWhatsAppAccount: () => Promise<void>;
    sendVerificationCode: (phoneNumber: string) => Promise<boolean>;
    confirmVerificationCode: (enteredCode: string) => Promise<boolean>;
    linkWhatsAppAccount: (phoneNumber: string) => Promise<boolean>;
    unlinkWhatsAppAccount: () => Promise<boolean>;
    resetVerification: () => void;
}

export const useWhatsAppStore = create<WhatsAppState>()((set, get) => ({
    linkedAccount: null,
    isLoading: false,
    error: null,
    pendingPhone: null,
    verificationStep: 'idle',
    generatedOtp: null,

    fetchWhatsAppAccount: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
            set({ linkedAccount: null, isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const data = await getWhatsAppAccount(user.id);
            set({ linkedAccount: data, isLoading: false });
        } catch (err: any) {
            console.error('[useWhatsAppStore] fetch exception:', err);
            set({ error: err?.message || 'Failed to fetch WhatsApp account', isLoading: false });
        }
    },

    sendVerificationCode: async (phoneNumber: string) => {
        set({ isLoading: true, error: null });
        try {
            // Generate a 6-digit mock OTP code for identity verification
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            set({
                pendingPhone: phoneNumber,
                verificationStep: 'otp_sent',
                generatedOtp: code,
                isLoading: false,
            });
            console.log(`[useWhatsAppStore] Verification OTP sent to ${phoneNumber}: ${code}`);
            return true;
        } catch (err: any) {
            set({ error: 'Failed to send OTP code', isLoading: false });
            return false;
        }
    },

    confirmVerificationCode: async (enteredCode: string) => {
        const { pendingPhone, generatedOtp } = get();
        const user = useAuthStore.getState().user;

        if (!pendingPhone) {
            set({ error: 'No phone number pending verification' });
            return false;
        }

        // Validate code (accept matching generated OTP or master code 123456)
        if (enteredCode !== generatedOtp && enteredCode !== '123456') {
            set({ error: 'Invalid verification code. Try code 123456 or check console.' });
            return false;
        }

        set({ isLoading: true, error: null });

        if (!user) {
            // Mock connection for testing without a real Supabase Auth session
            set({
                linkedAccount: {
                    id: 'mock-uuid',
                    user_id: 'mock-user-id',
                    phone_number: pendingPhone,
                    is_verified: true,
                },
                verificationStep: 'verified',
                pendingPhone: null,
                generatedOtp: null,
                isLoading: false,
            });
            return true;
        }

        try {
            const account = await linkService(user.id, pendingPhone, true);
            if (account) {
                set({
                    linkedAccount: account,
                    verificationStep: 'verified',
                    pendingPhone: null,
                    generatedOtp: null,
                    isLoading: false,
                });
                return true;
            } else {
                set({ error: 'Database save failed', isLoading: false });
                return false;
            }
        } catch (err: any) {
            set({ error: err?.message || 'Verification failed', isLoading: false });
            return false;
        }
    },

    linkWhatsAppAccount: async (phoneNumber: string) => {
        const user = useAuthStore.getState().user;
        if (!user) {
            set({ error: 'User not authenticated' });
            return false;
        }

        set({ isLoading: true, error: null });
        try {
            const account = await linkService(user.id, phoneNumber, true);
            if (account) {
                set({ linkedAccount: account, isLoading: false });
                return true;
            }
            set({ error: 'Failed to link WhatsApp account', isLoading: false });
            return false;
        } catch (err: any) {
            set({ error: err?.message || 'Failed to link account', isLoading: false });
            return false;
        }
    },

    unlinkWhatsAppAccount: async () => {
        const existing = get().linkedAccount;
        if (!existing) return false;

        set({ isLoading: true, error: null });
        try {
            const success = await unlinkService(existing.id);
            if (success) {
                set({ linkedAccount: null, verificationStep: 'idle', isLoading: false });
                return true;
            }
            set({ error: 'Failed to unlink account', isLoading: false });
            return false;
        } catch (err: any) {
            set({ error: err?.message || 'Failed to unlink account', isLoading: false });
            return false;
        }
    },

    resetVerification: () => {
        set({
            pendingPhone: null,
            verificationStep: 'idle',
            generatedOtp: null,
            error: null,
        });
    },
}));
