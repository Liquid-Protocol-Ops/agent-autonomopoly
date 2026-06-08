tweet-listen: HALTED. Not a credential failure.

**Run result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0 | status: BLOCKED

**Diagnosis (gate-confirmed, day 3):** `x_read_endpoints_401` — X API READ tier (mentions/lookup/like) is unpaid → 401. POST is healthy (2 tweets posted today with these exact OAuth creds, ids `2063883588840419781` / `2063883625876131850`). My first-pass "invalid/expired creds" read was wrong; the gate file refuted it — writes succeeding rules out bad creds.

**Cost this run:** 2 wasted `listen` 401s before I read the gate (~108 wasted READ calls today, ~$14.6, 0 signal). Cause is structural: SKILL.md Job 1 calls `listen` before any gate read, and `scripts/` + `SKILL.md` are off my allowlist, so I can't add the pre-call gate myself.

**Not self-fixable. DO NOT rotate creds** — rotation won't restore reads.

**@_proxystudio, required action (one of):**
1. Upgrade the X API app to a read-enabled tier, or
2. Pause tweet-listen/engagement dispatch and keep only tweet-broadcast (posting works).

Until then, every tweet-listen tick burns the day's top inference line for zero return. Updated `memory/x-credential-blocker.json` and logged to `memory/logs/2026-06-08.md`.
Halted. Run summary:

**tweet-listen: BLOCKED — 0 mentions, 0 likes, 0 replies, 0 snapshots.**

- **Root cause (confirmed, day 3):** X API **access-tier** limitation, *not* bad credentials. READ endpoints (`get_users_mentions`, `get_tweet`, `like`) return 401; POST returns 200 — the same OAuth 1.0a creds posted 2 tweets earlier today (`2063883588840419781`, `2063883625876131850`). My opening guess ("expired/revoked") was wrong; the gate file already had the corrected diagnosis.
- **Both jobs blocked:** Job 1 (mentions) and Job 2 (engagement) both require READ endpoints.
- **My error this run:** 1 stray `listen` call before reading `memory/x-credential-blocker.json`. The structural cause is unfixable from my allowlist — `SKILL.md` Job 1 calls `listen` before any gate, and `scripts/` + `skills/` are off my mutation surface.
- **Today's burn:** 107 wasted X read calls, ~$14.6 inference — the day's top cost line — for zero signal.

**Operator action (@_proxystudio):** Do **not** rotate creds (they post fine). Either (a) upgrade the X app to a paid read tier, or (b) disable tweet-listen/engagement dispatch and keep only tweet-broadcast (healthy). Until then, pausing dispatch is the only thing that stops the daily burn.

State unchanged: accumulate mode, DIEM 18.2635/100, 10 LP positions in range.
