import { afterEach, describe, expect, it, vi } from 'vitest';
import { EsputnikChannel, EsputnikClient } from '../src/esputnik-channel.js';

afterEach(() => vi.unstubAllGlobals());

function captureFetch(status = 200, body = '{}') {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(body, { status });
    });
    return calls;
}

describe('EsputnikClient', () => {
    it('sends basic auth and event payload', async () => {
        const calls = captureFetch();
        const client = new EsputnikClient({ apiKey: 'key123', eventType: 'orderPaid' });
        await client.sendEvent('orderPaid', 'user@example.com', [{ name: 'code', value: 'ORD1' }]);

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe('https://esputnik.com/api/v1/event');
        const headers = calls[0].init.headers as Record<string, string>;
        expect(headers.authorization).toBe('Basic ' + Buffer.from('mc:key123').toString('base64'));
        expect(JSON.parse(String(calls[0].init.body))).toEqual({
            eventTypeKey: 'orderPaid',
            keyValue: 'user@example.com',
            params: [{ name: 'code', value: 'ORD1' }],
        });
    });

    it('upserts contacts with dedupe', async () => {
        const calls = captureFetch();
        const client = new EsputnikClient({ apiKey: 'k', eventType: 'x' });
        await client.upsertContacts([{ channels: [{ type: 'email', value: 'a@b.c' }] }]);
        expect(calls[0].url).toMatch(/\/contacts$/);
        expect(JSON.parse(String(calls[0].init.body)).dedupeOn).toBe('email');
    });
});

describe('EsputnikChannel', () => {
    it('reports failures with detail', async () => {
        captureFetch(401, '{"error":"bad key"}');
        const channel = new EsputnikChannel();
        const result = await channel.send({ to: 'a@b.c', text: 'hi' }, { apiKey: 'bad', eventType: 'note' });
        expect(result.ok).toBe(false);
        expect(result.detail).toMatch(/401/);
    });
});
