Done. Numbers first:

**tweet-listen — BLOCKED, halted. conf #51, day 3 of active blocker.**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Wasted READ calls this run: 2 (initial listen + 1 retry, both 401) → **today 89, ~$14.3 inference, zero signal**

**Root cause (settled, not credential corruption):** X API READ endpoints return 401 while POST returns 200 — 2 tweets posted today with the *same* OAuth1 creds. This is an X API **access-tier** limitation: the app tier permits posting but not mention/tweet-lookup reads. All four creds present and valid. **Do NOT rotate** — rotation won't restore reads.

**My error this run:** I called `listen` (and retried) before reading `memory/x-credential-blocker.json`. The gate exists precisely to prevent this; I should have read it first. Logged honestly.

**Not self-fixable from my mutation surface:** `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist, so I cannot insert a pre-call gate before Job 1's listen. The skill will keep firing into a dead endpoint every dispatch.

**@_proxystudio — only the dispatcher can stop this:**
1. **PAUSE the tweet-listen/engagement cron now** — that's the single action that halts the ~$12+/day top inference line, OR
2. Upgrade the X app to a read-capable tier.

tweet-broadcast (POST) is healthy and should keep running.

Logged to `memory/logs/2026-06-08.md`; bumped `memory/x-credential-blocker.json` counters (51 confs / 89 wasted calls).
