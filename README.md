# @weblabllc/messengers

[![npm](https://img.shields.io/npm/v/@weblabllc/messengers)](https://www.npmjs.com/package/@weblabllc/messengers) [![ci](https://github.com/weblabllc/messengers/actions/workflows/ci.yml/badge.svg)](https://github.com/weblabllc/messengers/actions/workflows/ci.yml) [![license](https://img.shields.io/npm/l/@weblabllc/messengers)](LICENSE)

Framework-free delivery channels behind one `NotificationChannel` interface: Telegram Bot API, Viber, TurboSMS, eSputnik. No framework imports, no storage — pure clients over `fetch`.

## Install

```bash
npm install @weblabllc/messengers
```

## Enable any combination

```ts
import { ChannelRegistry } from '@weblabllc/messengers/registry'

const channels = await ChannelRegistry.create({ channels: ['telegram', 'esputnik'] })
await channels.get('telegram').send(
  { to: chatId, text: 'Замовлення ORD-1 оплачено' },
  { botToken: process.env.TG_TOKEN },
)
```

Or import one channel: `import { TelegramChannel } from '@weblabllc/messengers/telegram'`.

## eSputnik

`EsputnikChannel.send` fires a platform event (`eventTypeKey` from config, `keyValue` = recipient) that triggers the scenario configured in eSputnik. The lower-level `EsputnikClient` also exposes `upsertContacts` with `dedupeOn`.

```ts
import { EsputnikClient } from '@weblabllc/messengers/esputnik'

const client = new EsputnikClient({ apiKey: '...', eventType: 'orderPaid' })
await client.upsertContacts([{ channels: [{ type: 'email', value: 'a@b.ua' }] }])
```

## TurboSMS: SMS and hybrid Viber

`TurboSmsChannel` sends SMS by default. Add `viberSender` (a sender name activated in your TurboSMS account) and the same request goes out as Viber Business Message first, falling back to SMS after `hybridTtlSeconds` (default 60, clamped to TurboSMS's 30–86400 range; sent as `viber.ttl` + `sms.hybrid_ttl`). Viber messages are marked transactional unless `viberTransactional: false`; transactional texts to Ukrainian numbers must match templates pre-registered with TurboSMS.

```ts
import { TurboSmsChannel } from '@weblabllc/messengers/turbosms'

await new TurboSmsChannel().send(
  { to: '380671234567', text: 'Замовлення ORD-1 оплачено' },
  { apiKey: process.env.TURBOSMS_KEY, sender: 'Shop', viberSender: 'Shop' },
)
```

`ViberChannel` is the chatbot API (`chatapi.viber.com`); since 2024 bots are issued to businesses on application and billed monthly, so for transactional delivery to phone numbers the hybrid TurboSMS route is the practical one.

## Errors and timeouts

Every channel posts with a 10 s `AbortSignal.timeout`; a non-JSON reply (a proxy's 502 page) comes back as `{ ok: false, detail: '<status>: <body>' }` instead of throwing. TurboSMS codes 800–803 all count as sent.

## Test

```bash
npm test
```
