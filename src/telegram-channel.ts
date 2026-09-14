import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';
import { failure, postJson } from './http.js';

const TELEGRAM_TEXT_LIMIT = 4096;

export interface TelegramConfig {
    botToken: string;
}

export class TelegramChannel implements NotificationChannel<TelegramConfig> {
    readonly code = 'telegram';

    async send(message: NotificationMessage, config: TelegramConfig): Promise<NotificationResult> {
        const res = await postJson<{ ok: boolean; description?: string }>(
            `https://api.telegram.org/bot${config.botToken}/sendMessage`,
            {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ chat_id: message.to, text: message.text.slice(0, TELEGRAM_TEXT_LIMIT) }),
            },
        );
        if (!res.body) return failure(res);
        return { ok: res.body.ok === true, detail: res.body.description };
    }
}
