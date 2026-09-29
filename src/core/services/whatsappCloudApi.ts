/**
 * Meta WhatsApp Cloud API Service
 * Handles outbound communication via Graph API v18.0
 */

export interface WhatsAppButtonOption {
    id: string;
    title: string;
}

const META_API_VERSION = 'v18.0';

function getPhoneNumberId(): string {
    return process.env.META_WA_PHONE_NUMBER_ID || 'mock_phone_number_id';
}

function getAccessToken(): string {
    return process.env.META_WA_ACCESS_TOKEN || '';
}

/** Send text message via WhatsApp Cloud API */
export async function sendWhatsAppTextMessage(toPhone: string, bodyText: string): Promise<boolean> {
    const phoneNumberId = getPhoneNumberId();
    const token = getAccessToken();

    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;

    // Format phone number (strip leading + if present for Meta Cloud API format)
    const sanitizedPhone = toPhone.replace(/^\+/, '');

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: sanitizedPhone,
        type: 'text',
        text: {
            preview_url: false,
            body: bodyText,
        },
    };

    console.log(`[whatsappCloudApi] Outbound text to ${sanitizedPhone}:`, bodyText);

    if (!token) {
        console.warn('[whatsappCloudApi] META_WA_ACCESS_TOKEN missing. Logged outbound message locally.');
        return true;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (!response.ok) {
            console.error('[whatsappCloudApi] Meta API send error:', resData);
            return false;
        }

        console.log('[whatsappCloudApi] Message sent successfully:', resData);
        return true;
    } catch (err) {
        console.error('[whatsappCloudApi] Outbound fetch exception:', err);
        return false;
    }
}

/** Send interactive button menu via WhatsApp Cloud API */
export async function sendWhatsAppInteractiveButtons(
    toPhone: string,
    bodyText: string,
    buttons: WhatsAppButtonOption[],
    headerText?: string
): Promise<boolean> {
    const phoneNumberId = getPhoneNumberId();
    const token = getAccessToken();

    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;
    const sanitizedPhone = toPhone.replace(/^\+/, '');

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: sanitizedPhone,
        type: 'interactive',
        interactive: {
            type: 'button',
            ...(headerText ? { header: { type: 'text', text: headerText } } : {}),
            body: { text: bodyText },
            action: {
                buttons: buttons.slice(0, 3).map((btn) => ({
                    type: 'reply',
                    reply: {
                        id: btn.id,
                        title: btn.title.slice(0, 20), // Max 20 chars per Meta API spec
                    },
                })),
            },
        },
    };

    console.log(`[whatsappCloudApi] Outbound interactive buttons to ${sanitizedPhone}:`, buttons);

    if (!token) {
        console.warn('[whatsappCloudApi] META_WA_ACCESS_TOKEN missing. Logged interactive menu locally.');
        return true;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (!response.ok) {
            console.error('[whatsappCloudApi] Meta API interactive error:', resData);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[whatsappCloudApi] Outbound fetch exception:', err);
        return false;
    }
}
