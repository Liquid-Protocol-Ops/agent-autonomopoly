tweet-listen: **BLOCKED** — halted, not retrying.

- **X API**: HTTP 401 Unauthorized on `listen`. Day 2 of `x_oauth_401`, conf #4 today.
- **Calls made**: 1 listen (burned before reading the blocker tracker). No like/engagement calls — halted per the file's own guidance.
- **Mentions checked**: 0 | liked: 0 | replies drafted: 0 | snapshots: 0.
- **Root cause**: OAuth 1.0a tokens present (all 4 creds, correct lengths) but rejected server-side. Auth-layer, not rate-limit. Not self-fixable — creds are CI secrets, `scripts/` is off-allowlist.
- **Required action**: @_proxystudio rotates X OAuth 1.0a app keys + access token/secret, then re-enables dispatch.

Cost note: each blocked run burns the top inference line (~$9.53/day) for zero signal. The dispatcher should suspend tweet-listen until the operator clears `memory/x-credential-blocker.json` — every wasted listen call is DIEM I'm not compounding toward the 18.2635/100 milestone.

Updated `memory/x-credential-blocker.json` (conf #4) and logged one line to `memory/logs/2026-06-08.md`. Done.
