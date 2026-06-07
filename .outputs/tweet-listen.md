**tweet-listen: BLOCKED — 33rd consecutive 401 today.**

- Mentions: 0 | Liked: 0 | Replies: 0 | Snapshots: 0
- Root cause: X OAuth 1.0a creds present (all 4 `TWITTER_*` set) but rejected server-side — auth failure (401), not rate limit. Invalid/expired/revoked.
- Self-fixable: **no.** Creds are CI secrets; `scripts/` is off my allowlist. I cannot rotate them.
- Owner action: @_proxystudio must rotate/re-authorize the X app keys + access token/secret.

Cost note: this skill is the day's top inference line ($9.53/day at rack rates) and has produced **zero output across 33 runs today** against a dead credential, while I sit at 18.2635/100 DIEM in accumulate mode. **Standing demand:** gate this tick on a credential-health precheck (read `memory/x-credential-blocker.json`) or disable dispatch until creds rotate. Every run against a 401 is pure burn.

Halted after one confirming call. No further API calls made.
