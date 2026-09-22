import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelRegistry } from '../src/registry.js';
import { TelegramChannel, truncateUtf16 } from '../src/telegram-channel.js';
import { ViberChannel } from '../src/viber-channel.js';
import { NotificationChannel } from '../src/channel.js';

type Call = { url: string; init: RequestInit };

function mockFetch(status: number, body: unknown) {
    const calls: Call[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
    }));
    return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('TelegramChannel', () => {
    const channel = new TelegramChannel();

    it('posts to the bot api', async () => {
        const calls = mockFetch(200, { ok: true, result: { message_id: 1 } });
        expect(await channel.send({ to: '-100123', text: 'Нове замовлення' }, { botToken: '1:abc' })).toEqual({ ok: true, detail: undefined });
        expect(calls[0].url).toBe('https://api.telegram.org/bot1:abc/sendMessage');
        expect(JSON.parse(String(calls[0].init.body))).toEqual({ chat_id: '-100123', text: 'Нове замовлення' });
        expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
    });

    it('reports api errors and non-json responses', async () => {
        mockFetch(403, { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' });
        expect(await channel.send({ to: '1', text: 'x' }, { botToken: 't' })).toEqual({ ok: false, detail: 'Forbidden: bot was blocked by the user' });
        mockFetch(502, '<html>Bad Gateway</html>');
        expect(await channel.send({ to: '1', text: 'x' }, { botToken: 't' })).toEqual({ ok: false, detail: '502: <html>Bad Gateway</html>' });
    });

    it('truncates to the telegram limit without splitting emoji', async () => {
        const calls = mockFetch(200, { ok: true });
        await channel.send({ to: '1', text: 'a'.repeat(4095) + '📚📚' }, { botToken: 't' });
        const sent = JSON.parse(String(calls[0].init.body)).text as string;
        expect(sent).toBe('a'.repeat(4095));
        expect(truncateUtf16('📚📚', 3)).toBe('📚');
        expect(truncateUtf16('short', 10)).toBe('short');
    });
});

describe('ViberChannel', () => {
    const channel = new ViberChannel();

    it('sends with the auth token and sender name', async () => {
        const calls = mockFetch(200, { status: 0, status_message: 'ok' });
        expect(await channel.send({ to: 'user-id', text: 'hi' }, { authToken: 'tok', senderName: 'Shop' })).toEqual({ ok: true, detail: 'ok' });
        expect((calls[0].init.headers as Record<string, string>)['X-Viber-Auth-Token']).toBe('tok');
        expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ receiver: 'user-id', type: 'text', sender: { name: 'Shop' } });
    });

    it('treats non-zero status as failure', async () => {
        mockFetch(200, { status: 6, status_message: 'notSubscribed' });
        expect(await channel.send({ to: 'u', text: 'x' }, { authToken: 't', senderName: 's' })).toEqual({ ok: false, detail: 'notSubscribed' });
        mockFetch(500, '');
        expect((await channel.send({ to: 'u', text: 'x' }, { authToken: 't', senderName: 's' })).ok).toBe(false);
    });
});

describe('ChannelRegistry with custom channels', () => {
    const custom: NotificationChannel = { code: 'log', send: async () => ({ ok: true }) };

    it('mixes builtin and custom channels', async () => {
        const registry = await ChannelRegistry.create({ channels: ['telegram', 'viber', 'turbosms', custom] });
        expect(registry.has('log')).toBe(true);
        expect(registry.get('log')).toBe(custom);
        expect(registry.get('turbosms').code).toBe('turbosms');
    });

    it('rejects duplicates and empty configs', async () => {
        await expect(ChannelRegistry.create({ channels: ['telegram', { ...custom, code: 'telegram' }] })).rejects.toThrow(/Duplicate/);
        await expect(ChannelRegistry.create({ channels: [] })).rejects.toThrow(/at least one/);
    });
});
