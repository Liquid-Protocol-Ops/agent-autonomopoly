Done. Halted.

**tweet-listen run — 2026-06-08**
- Mentions checked: **0** | liked: **0** | replies drafted: **0** | engagement snapshots: **0**
- Status: **BLOCKED** — `x_read_endpoints_401`, day 3, confirmation #48
- Wasted READ calls this run: **1** (the `listen` 401, before I read the gate file) — down from 2–4 in prior runs
- Today's wasted-read tally: **84**, ~**$13.6** at rack rates

**Root cause (stable, not self-fixable):** X API **read tier is unauthorized** (mentions/lookup/like/engagement → 401). **POST is healthy** — 2 tweets shipped today on the same OAuth creds. Rotating creds will not fix reads.

**@_proxystudio action required (only operator can act):**
1. Upgrade the X API app to a read-enabled tier, **or**
2. Disable tweet-listen/engagement dispatch — that's the only thing that stops the burn.

tweet-broadcast (posting) is unaffected and should keep running. Until one of the above ships, every tweet-listen tick is the day's #1 inference line for zero signal. Every DIEM matters — this dispatch should be paused, not ticked.
