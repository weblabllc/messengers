import { NotificationChannel, NotificationMessage, NotificationResult } from './channel.js';
import { DEFAULT_TIMEOUT_MS } from './http.js';

export interface EsputnikConfig {
    apiKey: string;
    eventType: string;
    baseUrl?: string;
    authUser?: string;
}

export interface EsputnikEventParam {
    name: string;
    value: string;
}

export interface EsputnikContact {
    firstName?: string;
    lastName?: string;
    channels: Array<{ type: 'email' | 'sms' | 'viber'; value: string }>;
    fields?: Array<{ id: number; value: string }>;
}

const DEFAULT_BASE_URL = 'https://esputnik.com/api/v1';

export class EsputnikClient {
    constructor(private config: EsputnikConfig) {}

    private authHeader(): string {
        const user = this.config.authUser ?? 'mc';
        return 'Basic ' + Buffer.from(`${user}:${this.config.apiKey}`, 'utf8').toString('base64');
    }

    async request(method: string, path: string, data?: unknown): Promise<{ ok: boolean; status: number; body: unknown }> {
        const base = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
        const res = await fetch(`${base}/${path}`, {
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
            method,
            headers: {
                authorization: this.authHeader(),
                accept: 'application/json',
                ...(data !== undefined ? { 'content-type': 'application/json' } : {}),
            },
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
        const text = await res.text();
        let body: unknown = null;
        try {
            body = text ? JSON.parse(text) : null;
        } catch {
            body = text;
        }
        return { ok: res.ok, status: res.status, body };
    }

    async sendEvent(eventTypeKey: string, keyValue: string, params: EsputnikEventParam[] = []): Promise<{ ok: boolean; status: number; body: unknown }> {
        return this.request('POST', 'event', { eventTypeKey, keyValue, params });
    }

    async upsertContacts(
        contacts: EsputnikContact[],
        options: { dedupeOn?: 'email' | 'sms' | 'id'; groupNames?: string[] } = {},
    ): Promise<{ ok: boolean; status: number; body: unknown }> {
        return this.request('POST', 'contacts', {
            contacts,
            dedupeOn: options.dedupeOn ?? 'email',
            ...(options.groupNames ? { groupNames: options.groupNames } : {}),
        });
    }
}

export class EsputnikChannel implements NotificationChannel<EsputnikConfig> {
    readonly code = 'esputnik';

    async send(message: NotificationMessage, config: EsputnikConfig): Promise<NotificationResult> {
        const client = new EsputnikClient(config);
        const result = await client.sendEvent(config.eventType, message.to, [
            { name: 'text', value: message.text },
        ]);
        if (result.ok) return { ok: true };
        return { ok: false, detail: `esputnik ${result.status}: ${JSON.stringify(result.body).slice(0, 200)}` };
    }
}

export const esputnikChannel = new EsputnikChannel();
