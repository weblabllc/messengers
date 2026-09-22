# Changelog

## 0.3.1 — 2026-09-22

- README badges: npm version, CI status, license.
- Published from GitHub Actions via npm trusted publishing with provenance.

## 0.3.0 — 2026-09-22

- Package renamed to `@weblabllc/messengers`.
- **Breaking:** the TurboSMS channel code is now `turbosms` (was `sms`), so `registry.get('turbosms')` finds the channel it was created from.
- Telegram: truncation at 4096 characters no longer splits a surrogate pair (emoji); `truncateUtf16` is exported.
- Tests for Telegram, Viber and registry composition with custom channels.

## 0.2.1
- TurboSMS hybrid: `viber.ttl` + `sms.hybrid_ttl` (the root `hybrid_ttl` was ignored by the API); response codes 801–803 count as sent
- All channels: 10 s request timeout, non-JSON replies become `{ ok: false }` instead of throwing; Telegram text capped at 4096

## 0.2.0
- TurboSMS: hybrid Viber → SMS delivery

## 0.1.0 — 2026-09-01

Initial release, extracted and hardened from production projects.
