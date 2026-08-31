import { describe, expect, it } from 'vitest';
import { ChannelRegistry } from '../src/registry.js';

describe('ChannelRegistry', () => {
    it('enables any combination', async () => {
        const registry = await ChannelRegistry.create({ channels: ['telegram', 'esputnik'] });
        expect(registry.codes().sort()).toEqual(['esputnik', 'telegram']);
        expect(() => registry.get('viber')).toThrow(/not enabled/);
    });

    it('rejects unknown channels', async () => {
        await expect(ChannelRegistry.create({ channels: ['whatsapp' as never] })).rejects.toThrow(/Unknown builtin/);
    });
});
