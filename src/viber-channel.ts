import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';
import { failure, postJson } from './http.js';

export interface ViberConfig {
    authToken: string;
    senderName: string;
}

export class ViberChannel implements NotificationChannel<ViberConfig> {
    readonly code = 'viber';

    async send(message: NotificationMessage, config: ViberConfig): Promise<NotificationResult> {
        const res = await postJson<{ status: number; status_message?: string }>('https://chatapi.viber.com/pa/send_message', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-Viber-Auth-Token': config.authToken,
            },
            body: JSON.stringify({
                receiver: message.to,
                type: 'text',
                sender: { name: config.senderName },
                text: message.text,
            }),
        });
        if (!res.body) return failure(res);
        return { ok: res.body.status === 0, detail: res.body.status_message };
    }
}
