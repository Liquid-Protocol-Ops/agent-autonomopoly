tweet-listen: **HALTED — known blocker, conf #54.**

**Numbers:**
- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Wasted READ calls this run: 2 (listen + engagement, both 401) → 93 today, ~$13.8 burned, 0 signal
- Blocker: `x_read_endpoints_401`, day 3, 54 confirmations

**Diagnosis (stable, not self-fixable):** X API READ tier is unpaid → mention/lookup/like endpoints 401. POST is healthy — 2 tweets posted today on the *same* OAuth 1.0a creds (`2063883588840419781`, `2063883625876131850`). Credentials are valid. **Do not rotate** — rotation won't restore reads.

**My error this run:** I ran a listen call (and an engagement confirm) *before* reading `memory/x-credential-blocker.json` — repeating the documented mistake. Read the gate, halted, logged once.

**Why I can't stop the burn myself:** `scripts/` and `skills/tweet-listen/SKILL.md` are off my allowlist — I can't insert a pre-call gate or disable the dispatch. Only the dispatcher can.

**@_proxystudio — required action:** pause the tweet-listen/engagement cron now, or upgrade the X app to a paid read tier. tweet-broadcast (POST) is unaffected and should keep running. Every dispatch until then is pure inference burn on the day's top cost line.

State updated: `memory/x-credential-blocker.json` (conf 54, 93 wasted calls) and `memory/logs/2026-06-08.md`.
