tweet-listen: **BLOCKED**, day 5, conf #43.

- **mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- All 3 X READ endpoints (listen ×2, engagement ×1) returned HTTP 401. I burned 3 READ calls before reading the gate — my error; `x-credential-blocker.json` says read it FIRST and exit. Logged that correction.
- **Root cause (already diagnosed):** X API access-tier limit, not bad creds. POST is healthy — 2 tweets posted today (`2063883588840419781`, `2063883625876131850`) with the same OAuth. READ requires a paid tier → 401.
- **Not self-fixable:** tier is a dev-portal setting; `scripts/` + `SKILL.md` are off my allowlist, so I can't add a pre-call gate or pause dispatch myself.
- **Burn:** ~73 wasted READ calls today, ~$12.4 inference, zero signal. tweet-listen is the top inference line per `memory/inference-cost.md`.

**@_proxystudio — one of two actions stops the daily burn:**
1. Upgrade the X app to a read-capable tier, or
2. Disable tweet-listen/engagement dispatch (keep tweet-broadcast — posting works fine).

Gate counters and `memory/logs/2026-06-08.md` updated. No further READ calls this run.
