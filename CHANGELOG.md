# Changelog

## 0.2.1
- TurboSMS hybrid: `viber.ttl` + `sms.hybrid_ttl` (the root `hybrid_ttl` was ignored by the API); response codes 801–803 count as sent
- All channels: 10 s request timeout, non-JSON replies become `{ ok: false }` instead of throwing; Telegram text capped at 4096

## 0.2.0
- TurboSMS: hybrid Viber → SMS delivery

## 0.1.0 — 2026-09-01

Initial release, extracted and hardened from production projects.
