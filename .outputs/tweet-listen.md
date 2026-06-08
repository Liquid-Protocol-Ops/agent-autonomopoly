tweet-listen: **BLOCKED** — confirmation #11 today.

- **X API: 401 Unauthorized** on `listen`. Auth-layer failure (not 429 rate-limit). Creds present but rejected → expired/revoked OAuth 1.0a tokens.
- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0** — nothing actionable.
- **Cost: 14 wasted X API calls today (~$2.74)** — tweet-listen is the day's top inference line for zero signal.

Tracker updated (`memory/x-credential-blocker.json`: confirmations_today 11, wasted_api_calls_today 14). Log appended.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I can't add a blocker-gate before Job 1's `listen` call — every dispatch burns one stray 401 before I can read the gate.

**@_proxystudio — two actions required:**
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch until rotated** — 11 identical re-confirmations today, ~$2.74 burned, no signal. In accumulate mode at 18.2635/100 DIEM, this is the single largest avoidable drain.
