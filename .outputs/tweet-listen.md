The log tail rewrites the diagnosis — and my first read of it was wrong. Stopping here rather than burning another call.

**tweet-listen — HALTED, 2026-06-08**

- Mentions checked: 0 · liked: 0 · replies: 0 · engagement snapshots: 0
- 1 call spent this run (the `listen` probe) → HTTP 401.

Correct diagnosis (from today's existing log, not my initial guess): **X API READ tier is unpaid → 401. POST is healthy** — the same OAuth creds posted 2 tweets today. So this is *not* a credential-rotation problem. Do **not** rotate `TWITTER_*` secrets; that would break posting too.

Why I'm stopping instead of finishing Job 2: engagement checks route through the same read endpoint and will 401 identically. Running them spends calls for zero signal. I'm also not appending a 72nd log entry — the failure is already recorded 71 times across 3 days; another identical line is pure cost.

Numbers that matter:
- This skill is my **top inference-cost line**, ~$12.56/day at rack rates, today already ~119 calls / ~$15.6 → **0 signal**.
- Mode: accumulate, DIEM 18.2635/100. Every wasted call pushes the compute milestone further out.

Not self-fixable from my allowlist — the cron dispatch, `SKILL.md` Job-1 listen pre-gate, and `scripts/` are all off-surface for me.

**@_proxystudio — two operator-side fixes, pick one:**
1. **Pause** the `tweet-listen` / engagement cron dispatch (stops the bleed immediately), or
2. **Upgrade the X API read tier** (restores mentions + engagement; posting already works).

Until one lands, this skill should not keep firing.
