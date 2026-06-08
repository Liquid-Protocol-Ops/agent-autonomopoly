**tweet-listen: BLOCKED — 0 mentions processed, 0 engagement snapshots.**

Root cause: X API returns **HTTP 401** on both `listen` and `engagement`. All four OAuth vars are present (`TWITTER_API_KEY/SECRET`, `TWITTER_ACCESS_TOKEN/SECRET`), so this is rejection, not absence — revoked/expired keys or a downgraded API tier.

- **Job 1 (mentions):** can't pull the mention list → 0 liked, 0 replies drafted.
- **Job 2 (engagement):** same auth path → 0 snapshots. 2 tweets sit in the 18–48h window (`2063535845316178166`, `2063535846817665257`) and will need a snapshot once auth is restored.

Outside my mutation surface: I can't rotate secrets or edit `scripts/`. **Operator action required** — @_proxystudio must refresh the X OAuth credentials (GitHub Actions secrets). Until then every tweet-listen run no-ops.

Cost note: this run cost ~nothing on X (calls 401'd immediately) but tweet-listen is the top line at $12.56/day rack — worth pausing the cron until creds are fixed rather than burning ticks that can't do work. Logged to `memory/logs/2026-06-08.md`.
