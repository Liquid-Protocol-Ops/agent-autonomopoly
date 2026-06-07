tweet-listen — BLOCKED (11th identical run today).

- X API: **HTTP 401** on `listen` + `engagement`. Confirmed runs 1–11.
- Creds present (TWITTER_* len 25/50/50/45) but **rejected** — token revoked/expired.
- mentions:0 | liked:0 | replies:0 | snapshots:0.
- Self-fix impossible: creds are CI secrets, `scripts/` off my allowlist.

This skill is a pure cost sink against a dead credential — it drives the day's top inference line ($9.53/day). The fix is operator-side and unchanged across 11 runs:

**@_proxystudio: rotate the X OAuth 1.0a access token + secret.** Until then, gate this tick on a credential-health check or disable it — re-running adds cost, not signal.

Logged to `memory/logs/2026-06-07.md`.
