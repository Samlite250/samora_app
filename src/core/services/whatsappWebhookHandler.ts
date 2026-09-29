import { supabase as supabaseRaw } from '../../data/api/supabase';
import { processInboundWhatsAppMessage } from './whatsappBotEngine';

const supabase = supabaseRaw!;

export interface InboundWhatsAppMessage {
    fromPhone: string;
    messageId: string;
    timestamp: string;
    type: 'text' | 'button_reply' | 'unknown';
    textBody?: string;
    buttonReplyId?: string;
    buttonReplyTitle?: string;
}

const DEFAULT_VERIFY_TOKEN = 'digital_plus_whatsapp_webhook_verify_token_2026';

/** Validate GET verification challenge from Meta Developer Console */
export function verifyWebhookChallenge(mode: string | null, token: string | null, challenge: string | null): { status: number; body: string } {
    const expectedToken = process.env.META_WA_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === expectedToken) {
        console.log('[whatsappWebhookHandler] Webhook verified successfully!');
        return { status: 200, body: challenge || '' };
    }

    console.warn('[whatsappWebhookHandler] Webhook verification failed. Invalid token.');
    return { status: 403, body: 'Forbidden: Invalid verification token' };
}

/** Extract structured inbound message details from Meta webhook payload */
export function parseInboundWebhookPayload(payload: any): InboundWhatsAppMessage | null {
    try {
        const entry = payload?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) return null;

        const fromPhone = '+' + message.from;
        const messageId = message.id;
        const timestamp = message.timestamp;

        if (message.type === 'text') {
            return {
                fromPhone,
                messageId,
                timestamp,
                type: 'text',
                textBody: message.text?.body?.trim(),
            };
        } else if (message.type === 'interactive') {
            const interactive = message.interactive;
            if (interactive?.type === 'button_reply') {
                return {
                    fromPhone,
                    messageId,
                    timestamp,
                    type: 'button_reply',
                    buttonReplyId: interactive.button_reply?.id,
                    buttonReplyTitle: interactive.button_reply?.title,
                    textBody: interactive.button_reply?.title,
                };
            }
        }

        return {
            fromPhone,
            messageId,
            timestamp,
            type: 'unknown',
        };
    } catch (err) {
        console.error('[whatsappWebhookHandler] Payload parse exception:', err);
        return null;
    }
}

/** Log inbound message to public.whatsapp_messages in Supabase */
export async function logInboundMessageToDb(msg: InboundWhatsAppMessage, accountId?: string): Promise<string | null> {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('whatsapp_messages')
            .insert([{
                whatsapp_account_id: accountId || null,
                direction: 'inbound',
                message_type: msg.type,
                body: msg.textBody || msg.buttonReplyTitle || '[media/unknown]',
                whatsapp_message_id: msg.messageId,
                status: 'processed',
            }])
            .select()
            .single();

        if (error) {
            console.error('[whatsappWebhookHandler] DB log error:', error);
            return null;
        }
        return data?.id || null;
    } catch (err) {
        console.error('[whatsappWebhookHandler] DB log exception:', err);
        return null;
    }
}

/** Full entry point for processing POST webhook payloads */
export async function handleWebhookEvent(payload: any): Promise<boolean> {
    const parsedMsg = parseInboundWebhookPayload(payload);
    if (!parsedMsg) {
        console.log('[whatsappWebhookHandler] Non-message webhook event acknowledged.');
        return true;
    }

    return await processInboundWhatsAppMessage(parsedMsg);
}
