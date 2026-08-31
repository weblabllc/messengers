import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';

export interface ViberConfig {
    authToken: string;
    senderName: string;
}

export class ViberChannel implements NotificationChannel<ViberConfig> {
    readonly code = 'viber';

    async send(message: NotificationMessage, config: ViberConfig): Promise<NotificationResult> {
        const res = await fetch('https://chatapi.viber.com/pa/send_message', {
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
        const body = (await res.json()) as { status: number; status_message?: string };
        return { ok: body.status === 0, detail: body.status_message };
    }
}
