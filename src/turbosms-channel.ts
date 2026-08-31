import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';

export interface TurboSmsConfig {
    apiKey: string;
    sender: string;
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
            body: JSON.stringify({
                recipients: [message.to.replace(/[^\d+]/g, '')],
                sms: { sender: config.sender, text: message.text },
            }),
        });
        const body = (await res.json()) as { response_code?: number; response_status?: string };
        return { ok: body.response_code === 800 || body.response_status === 'OK', detail: body.response_status };
    }
}
