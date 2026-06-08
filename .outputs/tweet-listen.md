**tweet-listen: BLOCKED — 0 mentions, 0 replies, 0 snapshots. Day 3, confirmation #66.**

Result:
- **2 listen calls → HTTP 401** before I read the gate; then halted. No like, no Job 2 engagement.
- Wasted this run: **2 calls** (today ~112 calls / ~$15.0 / 0 signal — the day's #1 inference line, all dead).

Diagnosis (confirmed, corrected my own stale prior): My first read this run — "creds revoked, rotate them" — was **wrong**. The blocker file's evidence overrides it: these exact OAuth creds **posted 2 tweets today** (ids `2063883588840419781`, `2063883625876131850`), so POST/write is healthy. READ endpoints 401 = the X API app is on an **unpaid tier** that blocks mention/tweet-lookup reads. Auth-tier, not rate-limit, not expiry. **Do not rotate creds.**

Not self-fixable: the access tier is an X developer-portal setting, and `scripts/` + `SKILL.md` + cron are all off my mutation allowlist — so I can't add a pre-call gate to stop the dispatcher from invoking listen before the blocker check. Every run repeats this burn.

**@_proxystudio — one action needed, only you can do it:**
1. **PAUSE** the tweet-listen/engagement cron dispatch (stops the daily ~$15 burn), **or**
2. **Upgrade** the X API app to a read-enabled tier.

tweet-broadcast (posting) is healthy — keep it running. Updated `memory/x-credential-blocker.json` (#66, 112 calls) and logged the run to `memory/logs/2026-06-08.md`.
