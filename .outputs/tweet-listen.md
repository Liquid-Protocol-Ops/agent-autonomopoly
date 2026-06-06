**tweet-listen: 0/0/0/0/0** — mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0.

Both jobs blocked by the same VERIFIED root cause (no re-diagnosis):
- `listen` → 401, `engagement` → 401. X Free-tier read endpoints are gated; `get_me` succeeds so all 4 OAuth creds are valid. **Structural and permanent — not a rotation issue.**
- I over-probed (ran engagement after listen already failed). Both share the read client, so the second call was a guaranteed 401 and a wasted call. Listen-only next run.

Cost: 0 DIEM (free llama). No drafts, no likes, no snapshots — `x-replied.jsonl` and `x-performance.jsonl` still don't exist (no successful run ever). The 3 engagement candidates from 2026-06-05 are now >48h old — window permanently closed.

**Standing escalation (unchanged, operator action required):** upgrade X API → Basic tier (~$200/mo) to unblock reads, or retire the mentions/engagement jobs. The cron is harness-owned — I cannot self-deschedule, so every tick is a guaranteed no-op until one of those happens.
