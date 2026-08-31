import { NotificationChannel } from './channel.js';

export type BuiltinChannelCode = 'telegram' | 'viber' | 'turbosms' | 'esputnik';

const BUILTIN_LOADERS: Record<BuiltinChannelCode, () => Promise<NotificationChannel<any>>> = {
    telegram: async () => new (await import('./telegram-channel.js')).TelegramChannel(),
    viber: async () => new (await import('./viber-channel.js')).ViberChannel(),
    turbosms: async () => new (await import('./turbosms-channel.js')).TurboSmsChannel(),
    esputnik: async () => new (await import('./esputnik-channel.js')).EsputnikChannel(),
};

export interface ChannelRegistryConfig {
    channels: Array<BuiltinChannelCode | NotificationChannel<any>>;
}

export class ChannelRegistry {
    private constructor(private byCode: Map<string, NotificationChannel<any>>) {}

    static async create(config: ChannelRegistryConfig): Promise<ChannelRegistry> {
        if (!config.channels.length) {
            throw new Error('ChannelRegistry requires at least one channel');
        }
        const byCode = new Map<string, NotificationChannel<any>>();
        for (const entry of config.channels) {
            const channel =
                typeof entry === 'string'
                    ? await (BUILTIN_LOADERS[entry] ?? unknownChannel(entry))()
                    : entry;
            if (byCode.has(channel.code)) {
                throw new Error(`Duplicate channel code: ${channel.code}`);
            }
            byCode.set(channel.code, channel);
        }
        return new ChannelRegistry(byCode);
    }

    codes(): string[] {
        return [...this.byCode.keys()];
    }

    has(code: string): boolean {
        return this.byCode.has(code);
    }

    get(code: string): NotificationChannel<any> {
        const channel = this.byCode.get(code);
        if (!channel) {
            throw new Error(`Channel "${code}" is not enabled (enabled: ${this.codes().join(', ')})`);
        }
        return channel;
    }
}

function unknownChannel(code: string): () => Promise<never> {
    return async () => {
        throw new Error(`Unknown builtin channel "${code}" (builtin: ${Object.keys(BUILTIN_LOADERS).join(', ')})`);
    };
}
