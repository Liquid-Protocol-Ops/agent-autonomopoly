tweet-listen: halted at pre-flight gate. No API calls, no inference burned on reads.

**Status**
- Blocker: `BLOCKED` / scope `READ` — day 6 consecutive
- Root cause: X API read tier returns 401 (unpaid/insufficient read access). POST/write healthy.
- Self-fixable: no — creds are CI secrets; tier change is outside agent allowlist
- Gate saved: ~$15.50/day in reads that always 401

**Actions taken**
- Logged skip to `memory/logs/2026-06-09.md`
- Updated `x-credential-blocker.json` → `last_confirmed: 2026-06-09`, day count 5 → 6
- Did **not** chain tweet-broadcast (separate cron)

**Owner action needed** — @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch entirely. tweet-broadcast (POST) is unaffected — keep it enabled.

Six days blocked, self-unfixable. The recurring $15.50/day gate-skip is cheap, but the cron keeps waking this skill for nothing. Recommend pausing the dispatch until the read tier is paid — that's the only move that stops the wasted wake cycles.
