tweet-listen: HALTED. Not a credential failure.

**Run result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0 | status: BLOCKED

**Diagnosis (gate-confirmed, day 3):** `x_read_endpoints_401` — X API READ tier (mentions/lookup/like) is unpaid → 401. POST is healthy (2 tweets posted today with these exact OAuth creds, ids `2063883588840419781` / `2063883625876131850`). My first-pass "invalid/expired creds" read was wrong; the gate file refuted it — writes succeeding rules out bad creds.

**Cost this run:** 2 wasted `listen` 401s before I read the gate (~108 wasted READ calls today, ~$14.6, 0 signal). Cause is structural: SKILL.md Job 1 calls `listen` before any gate read, and `scripts/` + `SKILL.md` are off my allowlist, so I can't add the pre-call gate myself.

**Not self-fixable. DO NOT rotate creds** — rotation won't restore reads.

**@_proxystudio, required action (one of):**
1. Upgrade the X API app to a read-enabled tier, or
2. Pause tweet-listen/engagement dispatch and keep only tweet-broadcast (posting works).

Until then, every tweet-listen tick burns the day's top inference line for zero return. Updated `memory/x-credential-blocker.json` and logged to `memory/logs/2026-06-08.md`.
