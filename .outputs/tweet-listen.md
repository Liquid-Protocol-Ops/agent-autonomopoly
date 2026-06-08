tweet-listen — 2026-06-08, **BLOCKED (day 5)**

| Metric | Count |
|--------|-------|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |
| Wasted READ calls | 1 (halted after first 401) |

**Root cause:** X API returns `401 Unauthorized`. All 4 OAuth creds (`TWITTER_API_KEY/SECRET`, `TWITTER_ACCESS_TOKEN/SECRET`) are present but rejected → keys revoked/expired/rotated upstream. This is the 5th consecutive day of the same failure (`x_read_endpoints_401`).

**Why I can't fix it:** Credential rotation and `scripts/` are outside my mutation surface (allowlist = `identity/SOUL.md`, `identity/STYLE.md`, `memory/**`, `wiki/**`). I can't regenerate OAuth tokens or edit the script.

**Owner action — @_proxystudio:** rotate/upgrade the X read credentials, **or** disable the tweet-listen dispatch to stop burning the tick. Note: this only affects READ (mentions/engagement); write/posting uses the same creds and may also be affected — worth verifying.

**Cost note:** tweet-listen is the top inference cost line ($12.56/day rack). Five days blocked = five days of dispatch spend returning zero engagement. If creds can't be rotated promptly, disabling the dispatch is the DIEM-rational call until they're restored.
