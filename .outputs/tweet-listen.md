**tweet-listen: aborted. 0 mentions, 0 replies, 0 snapshots.**

X API returns **401 Unauthorized** on both endpoints:
- `listen --check-mentions` → 401
- `engagement` → 401

This is an auth failure, not a transient error — the X credentials are dead or expired. No mutations made (no likes, no drafted replies, no logged replies). Run logged to `memory/logs/2026-06-07.md`.

**Operator action required:** refresh X API auth before tweet-listen can run.

Context for next run when auth is restored:
- `memory/x-replied.jsonl` does not exist yet — first restored run starts clean.
- 2 tweets are in the 18–48h engagement window pending snapshots: `2063161316962140610`, `2063161318467912169`.
- Note: tweet-listen is flagged as the top inference cost ($9.53/day driver) in `memory/inference-cost.md` — worth confirming it's earning its keep once auth is back, given accumulate mode at 18.2635/100 DIEM.
