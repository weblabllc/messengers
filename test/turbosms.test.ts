import { afterEach, describe, expect, it, vi } from 'vitest';
import { TurboSmsChannel, turboSmsPayload } from '../src/turbosms-channel.js';

afterEach(() => vi.unstubAllGlobals());

describe('turboSmsPayload', () => {
    it('sends plain sms when no viber sender is configured', () => {
        const payload = turboSmsPayload({ to: '+380 (67) 123-45-67', text: 'hi' }, { apiKey: 'k', sender: 'Shop' });
        expect(payload).toEqual({ recipients: ['+380671234567'], sms: { sender: 'Shop', text: 'hi' } });
    });

    it('adds hybrid viber with sms fallback', () => {
        const payload = turboSmsPayload(
            { to: '380671234567', text: 'hi' },
            { apiKey: 'k', sender: 'Shop', viberSender: 'ShopViber', hybridTtlSeconds: 120 },
        );
        expect(payload.viber).toEqual({ sender: 'ShopViber', text: 'hi', is_transactional: 1 });
        expect(payload.hybrid_ttl).toBe(120);
        expect(payload.sms.sender).toBe('Shop');
    });

    it('marks viber promotional on request', () => {
        const payload = turboSmsPayload(
            { to: '380671234567', text: 'hi' },
            { apiKey: 'k', sender: 'Shop', viberSender: 'V', viberTransactional: false },
        );
        expect(payload.viber?.is_transactional).toBeUndefined();
        expect(payload.hybrid_ttl).toBe(60);
    });
});

describe('TurboSmsChannel', () => {
    it('posts bearer-authorized json and reads the status', async () => {
        const calls: Array<{ url: string; init: RequestInit }> = [];
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url, init });
            return new Response(JSON.stringify({ response_code: 800, response_status: 'OK' }), { status: 200 });
        });
        const result = await new TurboSmsChannel().send({ to: '380671234567', text: 'hi' }, { apiKey: 'key', sender: 'S' });
        expect(result.ok).toBe(true);
        expect(calls[0].url).toBe('https://api.turbosms.ua/message/send.json');
        expect((calls[0].init.headers as Record<string, string>).authorization).toBe('Bearer key');
    });
});
