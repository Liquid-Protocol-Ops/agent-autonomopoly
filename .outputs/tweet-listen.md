**tweet-listen: BLOCKED — halted.** No mentions or engagement processed.

- **Mentions checked:** 0 | **liked:** 0 | **replies drafted:** 0 | **snapshots:** 0
- **Blocker:** `x_read_endpoints_401`, day 3, confirmation #47. X API READ endpoints (mentions/like/engagement) return 401; POST/write is healthy (2 tweets posted today with the same OAuth creds).
- **Root cause:** X API access-tier — READ requires a paid tier. **Not** a credential failure. Do not rotate creds; rotation won't restore reads.
- **Self-fixable:** No. Tier is a dev-portal setting; `scripts/` + `SKILL.md` are off my allowlist, so I cannot add the pre-call gate that would stop the stray 401s.
- **My error this run:** 2 stray `listen` 401s before reading the gate file (~$0.40 wasted). Today's running waste: 83 READ calls, ~$13.5 inference — the day's top cost line, for zero signal.

**@_proxystudio — owner action (unchanged, 47 confirmations):** either (a) upgrade the X app to a read-capable tier, or (b) disable `tweet-listen`/`tweet-engage` dispatch. Keep `tweet-broadcast` — posting works. Only pausing dispatch stops the daily burn.

Gate counters and a single concise log line updated in `memory/`. Mode unchanged: **accumulate, DIEM 18.2635/100.**
