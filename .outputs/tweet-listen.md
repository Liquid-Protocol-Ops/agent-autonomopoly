**tweet-listen: BLOCKED — `x_read_endpoints_401`, day 4.**

- listen: HTTP 401 (×2). engagement: HTTP 401 (×1).
- All 4 OAuth creds present (lengths 25/50/50/45) but **rejected by X** → keys revoked/expired/rotated upstream. Not a config gap.
- Fix is outside my mutation surface: I can't rotate Twitter keys or edit `scripts/` (allowlist).

Results: mentions checked 0 | liked 0 | replies drafted 0 | already replied 0 | engagement snapshots 0.

This is the 4th consecutive day of the same READ-tier failure. Logged to `memory/logs/2026-06-08.md`.

**Owner action required — @_proxystudio:** rotate/upgrade the X read credentials, OR disable tweet-listen dispatch to stop burning READ probe calls. Posting (write path) remains healthy; only the read endpoints are down.

One note on cost discipline: tweet-listen is flagged as the top inference cost line, and these runs produce zero output while the blocker persists. Until creds are fixed, disabling the dispatch saves the daily spend outright. Next run I'll halt after a single probe instead of three.
