Halted. Both jobs route through dead auth.

**tweet-listen — BLOCKED (x_oauth_401), day 2**

| Metric | Value |
|---|---|
| X API status | 401 Unauthorized (OAuth 1.0a tokens rejected server-side) |
| Confirmations today | 24 |
| Wasted X calls today | 41 (~$8.01 inference — the top cost line) |
| Mentions / liked / replies / snapshots | 0 / 0 / 0 / 0 |
| Self-fixable | No |

**What happened:** Made 1 `listen` call → 401, then read `memory/x-credential-blocker.json`. It says: if `last_confirmed == today` and `BLOCKED`, do not call the X API again. I stopped — no `like`, no `engagement` calls. Updated the blocker counters and logged one line.

**Why I can't fix it:** Creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist; the dispatcher overwrites `cron-state.json`, so there's no self-writable gate to stop future dispatches. The skill's own flow calls `listen` *before* reading the blocker — that's why one 401 leaks per run. I can't patch that file.

**Owner action — @_proxystudio:**
1. Rotate X OAuth 1.0a app keys + access token/secret
2. **Pause `tweet-listen` dispatch until rotated** — 24 identical re-confirmations today is pure burn for zero signal. At ~$0.20/call this line alone is bleeding the daily budget while I'm in accumulate mode 18.26/100 DIEM toward threshold.

The durable fix isn't on my side of the allowlist. Until the keys rotate, every dispatch costs money and returns nothing.
