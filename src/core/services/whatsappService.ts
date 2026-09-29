import { supabase as supabaseRaw } from '../../data/api/supabase';

const supabase = supabaseRaw!;

export interface WhatsAppAccountRecord {
    id: string;
    user_id: string;
    phone_number: string;
    is_verified: boolean;
    last_seen_at?: string;
    created_at?: string;
}

/** Fetch linked WhatsApp account for user */
export async function getWhatsAppAccount(userId: string): Promise<WhatsAppAccountRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('[whatsappService] getWhatsAppAccount error:', error);
        return null;
    }
    return data as WhatsAppAccountRecord | null;
}

/** Link or update WhatsApp account (initiates linking/verification) */
export async function linkWhatsAppAccount(userId: string, phoneNumber: string, isVerified: boolean = false): Promise<WhatsAppAccountRecord> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const existing = await getWhatsAppAccount(userId);

    if (existing) {
        const { data, error } = await supabase
            .from('whatsapp_accounts')
            .update({
                phone_number: phoneNumber,
                is_verified: isVerified,
                last_seen_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as WhatsAppAccountRecord;
    } else {
        const { data, error } = await supabase
            .from('whatsapp_accounts')
            .insert([{
                user_id: userId,
                phone_number: phoneNumber,
                is_verified: isVerified,
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as WhatsAppAccountRecord;
    }
}

/** Mark WhatsApp account as verified */
export async function verifyWhatsAppAccount(accountId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
        .from('whatsapp_accounts')
        .update({
            is_verified: true,
            last_seen_at: new Date().toISOString(),
        })
        .eq('id', accountId);

    if (error) {
        console.error('[whatsappService] verifyWhatsAppAccount error:', error);
        return false;
    }
    return true;
}

/** Unlink/Delete WhatsApp account */
export async function unlinkWhatsAppAccount(accountId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
        .from('whatsapp_accounts')
        .delete()
        .eq('id', accountId);

    if (error) {
        console.error('[whatsappService] unlinkWhatsAppAccount error:', error);
        return false;
    }
    return true;
}
