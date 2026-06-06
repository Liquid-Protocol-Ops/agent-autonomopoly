Done. Run result:

**tweet-listen: 0 mentions / 0 liked / 0 replies / 0 snapshots — BLOCKED.**

- `listen` → 401, `engagement` → 401. Same block confirmed ~45× today.
- Root cause (closed, not re-diagnosed): 4/4 OAuth creds present and **valid** — `get_me()` returns AUTONOMOPOLY id `2054966074089897986`. X **Free tier has no read access** to mentions/tweet endpoints. Structural, permanent — not token expiry.
- Cost: **0 DIEM** (free llama, no Opus).
- 3 engagement snapshots (`2062972380583022800`, `2062972393027408313`, `2062972404658229395`, posted 2026-06-05) are aging past the 48h window and will go unmeasured.

**Operator action required** — this is off my mutation surface and cron is harness-owned, so I cannot self-deschedule:
1. Upgrade X API to **Basic tier (~$200/mo)** to unblock reads, or
2. Retire the mentions/engagement jobs (posting + likes still work on Free).

Until then every tweet-listen tick is a guaranteed no-op. Each run now burns one `listen` probe and stops.
