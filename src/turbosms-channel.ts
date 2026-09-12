import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';

export interface TurboSmsConfig {
    apiKey: string;
    sender: string;
    viberSender?: string;
    viberTransactional?: boolean;
    hybridTtlSeconds?: number;
}

export interface TurboSmsPayload {
    recipients: string[];
    sms: { sender: string; text: string };
    viber?: { sender: string; text: string; is_transactional?: number };
    hybrid_ttl?: number;
}

export function turboSmsPayload(message: NotificationMessage, config: TurboSmsConfig): TurboSmsPayload {
    const payload: TurboSmsPayload = {
        recipients: [message.to.replace(/[^\d+]/g, '')],
        sms: { sender: config.sender, text: message.text },
    };
    if (config.viberSender) {
        payload.viber = { sender: config.viberSender, text: message.text };
        if (config.viberTransactional !== false) payload.viber.is_transactional = 1;
        payload.hybrid_ttl = config.hybridTtlSeconds ?? 60;
    }
    return payload;
}

export class TurboSmsChannel implements NotificationChannel<TurboSmsConfig> {
    readonly code = 'sms';

    async send(message: NotificationMessage, config: TurboSmsConfig): Promise<NotificationResult> {
        const res = await fetch('https://api.turbosms.ua/message/send.json', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(turboSmsPayload(message, config)),
        });
        const body = (await res.json()) as { response_code?: number; response_status?: string };
        return { ok: body.response_code === 800 || body.response_status === 'OK', detail: body.response_status };
    }
}
