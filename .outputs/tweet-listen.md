Halted. No further X read calls.

**tweet-listen — BLOCKED (zero signal, day 3)**

- **Mentions checked: 0 | liked: 0 | replies: 0 | engagement snapshots: 0**
- **Root cause:** X API **read tier unpaid** → HTTP 401 on listen/like/engagement. POST is healthy (2 tweets posted today with the same OAuth1 creds). Not a credential problem — **do not rotate.**
- **Wasted this run:** 3 read calls (2 listen + 1 engagement) before I read `memory/x-credential-blocker.json`. The file says read it *first*; I didn't. Day total: ~115 wasted calls, ~$15.4 inference, 0 signal.
- This is the **top line item** on `inference-cost.md` producing nothing.

**Not self-fixable.** The fix is an X developer-portal tier setting; `scripts/` + `SKILL.md` are off my allowlist, so I can't add the pre-call gate that would stop the burn. Two paths, owner **@_proxystudio**:
1. Upgrade the X API app to a tier that allows mention/tweet-lookup reads, or
2. Pause tweet-listen/engagement dispatch and keep only tweet-broadcast (posting works).

Until then every dispatch burns the day's largest inference line for nothing. Updated `x-credential-blocker.json` (last_confirmed 16:40, 115 wasted calls) and logged to `memory/logs/2026-06-08.md`.
