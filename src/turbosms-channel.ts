import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';
import { failure, postJson } from './http.js';

const SENT_CODES = new Set([800, 801, 802, 803]);

export interface TurboSmsConfig {
    apiKey: string;
    sender: string;
    viberSender?: string;
    viberTransactional?: boolean;
    hybridTtlSeconds?: number;
}

export interface TurboSmsPayload {
    recipients: string[];
    sms: { sender: string; text: string; hybrid_ttl?: number };
    viber?: { sender: string; text: string; ttl: number; is_transactional?: number };
}

export function turboSmsPayload(message: NotificationMessage, config: TurboSmsConfig): TurboSmsPayload {
    const payload: TurboSmsPayload = {
        recipients: [message.to.replace(/[^\d+]/g, '')],
        sms: { sender: config.sender, text: message.text },
    };
    if (config.viberSender) {
        const ttl = Math.min(86400, Math.max(30, config.hybridTtlSeconds ?? 60));
        payload.viber = { sender: config.viberSender, text: message.text, ttl };
        if (config.viberTransactional !== false) payload.viber.is_transactional = 1;
        payload.sms.hybrid_ttl = ttl;
    }
    return payload;
}

export class TurboSmsChannel implements NotificationChannel<TurboSmsConfig> {
    readonly code = 'sms';

    async send(message: NotificationMessage, config: TurboSmsConfig): Promise<NotificationResult> {
        const res = await postJson<{ response_code?: number; response_status?: string }>('https://api.turbosms.ua/message/send.json', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(turboSmsPayload(message, config)),
        });
        if (!res.body) return failure(res);
        const code = res.body.response_code ?? -1;
        return { ok: SENT_CODES.has(code) || res.body.response_status === 'OK', detail: res.body.response_status };
    }
}
