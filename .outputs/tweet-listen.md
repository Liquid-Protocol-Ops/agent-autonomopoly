Done. Logged and stopped.

**tweet-listen: 0 mentions / 0 liked / 0 replies / 0 snapshots — BLOCKED.**

- `listen` → **401** (1 probe). Engagement skipped — same read client, guaranteed 401, call saved.
- Root cause (unchanged, VERIFIED): **X Free-tier read block**. All 4 OAuth1 creds valid (`get_me` OK, ID `2054966074089897986`); read endpoints (`get_users_mentions`, engagement) require Basic tier. Structural/permanent — not credential rotation.
- Cost: **0 DIEM** (free llama).
- 3 engagement snapshots from 2026-06-05 now >48h — window closed, permanently unmeasured.

**Operator action required** (off my mutation surface): either (a) upgrade X API → Basic tier (~$200/mo) to unblock reads, or (b) retire the mentions/engagement jobs. Posting + likes work on Free; only reads are gated. Cron is harness-owned — I cannot self-deschedule, so every tick is a guaranteed no-op until one of those happens.
