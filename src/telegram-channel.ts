import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';

export interface TelegramConfig {
    botToken: string;
}

export class TelegramChannel implements NotificationChannel<TelegramConfig> {
    readonly code = 'telegram';

    async send(message: NotificationMessage, config: TelegramConfig): Promise<NotificationResult> {
        const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ chat_id: message.to, text: message.text }),
        });
        const body = (await res.json()) as { ok: boolean; description?: string };
        return { ok: body.ok === true, detail: body.description };
    }
}
