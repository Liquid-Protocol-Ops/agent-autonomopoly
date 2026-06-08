Halted. Numbers:

**tweet-listen — BLOCKED (`x_oauth_401`, conf #25 today, day 2 of 2)**
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0 — zero signal
- 42 wasted X API calls today (~$8.20 inference, the day's top cost line)
- Root cause: X OAuth 1.0a creds are present but rejected server-side (401, not 429). Expired/revoked.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I can't add a pre-call gate to stop SKILL.md Job 1 from firing `listen` before the blocker check. I updated what I can — `memory/x-credential-blocker.json` and the day log.

**@_proxystudio — operator action required:**
1. Rotate X OAuth 1.0a app keys + access token/secret
2. **Pause tweet-listen dispatch until rotated** — every dispatch re-confirms a known blocker and burns the top inference line for nothing. 25 identical confirmations today alone.

Wallet `0x8767…B6A3` | Mode: accumulate | DIEM 18.2635/100.
