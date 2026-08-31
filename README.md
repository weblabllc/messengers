# @risklight/messengers

Framework-free delivery channels behind one `NotificationChannel` interface: Telegram Bot API, Viber, TurboSMS, eSputnik. No framework imports, no storage — pure clients over `fetch`.

## Install

```bash
npm install @risklight/messengers
```

## Enable any combination

```ts
import { ChannelRegistry } from '@risklight/messengers/registry'

const channels = await ChannelRegistry.create({ channels: ['telegram', 'esputnik'] })
await channels.get('telegram').send(
  { to: chatId, text: 'Замовлення ORD-1 оплачено' },
  { botToken: process.env.TG_TOKEN },
)
```

Or import one channel: `import { TelegramChannel } from '@risklight/messengers/telegram'`.

## eSputnik

`EsputnikChannel.send` fires a platform event (`eventTypeKey` from config, `keyValue` = recipient) that triggers the scenario configured in eSputnik. The lower-level `EsputnikClient` also exposes `upsertContacts` with `dedupeOn`.

```ts
import { EsputnikClient } from '@risklight/messengers/esputnik'

const client = new EsputnikClient({ apiKey: '...', eventType: 'orderPaid' })
await client.upsertContacts([{ channels: [{ type: 'email', value: 'a@b.ua' }] }])
```

## Test

```bash
npm test
```
