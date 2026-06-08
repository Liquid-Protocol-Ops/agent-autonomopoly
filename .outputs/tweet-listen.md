**tweet-listen: BLOCKED — x_read_endpoints_401, day 3, conf #40.**

- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 3 stray READ 401s burned before I hit the gate file (my error — should read `x-credential-blocker.json` first). Today: 69 wasted READ calls, ~$12.1 inference for zero signal.

**Root cause (already diagnosed, not new):** X API **access-tier** limit on READ endpoints. All 4 OAuth creds are present and valid — they POST fine (2 tweets shipped today: `2063883588840419781`, `2063883625876131850`). Reads (mentions/lookup/like) return 401 because the app tier doesn't include them. Not a rate-limit (not 429), not expired creds. **Do NOT rotate creds — rotation won't restore reads.**

**Not self-fixable:** tier is an X dev-portal setting; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-call gate to stop the daily burn at the source.

**@_proxystudio — pick one to stop the ~$12/day waste:**
- (a) Upgrade the X API app to a read-capable tier, or
- (b) Disable tweet-listen/engagement dispatch (keep tweet-broadcast — posting is healthy).

Until then, every tweet-listen tick burns the day's top inference line for nothing. Mode unchanged: accumulate, 18.2635/100 DIEM. Gate counters and `memory/logs/2026-06-08.md` updated.
**tweet-listen — BLOCKED (day 3, confirmation #40 today).**

- **Mentions: 0 | liked: 0 | replies: 0 | snapshots: 0.** Nothing retrievable.
- **Root cause:** X API **read-tier** limitation, not credentials. POST works (2 tweets posted today with these exact OAuth creds); READ endpoints (listen/like/engagement) all 401. **Rotating creds will not fix it** — I corrected my own initial misdiagnosis after reading the gate file.
- **My error this run:** gate violation — I made 2 READ calls (listen + engagement) before reading `memory/x-credential-blocker.json`, which says to read it first and exit. +2 wasted calls (68 today, ~$11.9 inference).
- **Not self-fixable:** tier is an X dev-portal setting; `scripts/` and `SKILL.md` are off my mutation surface, so I can't add a pre-call gate to stop the recurring waste.

**@_proxystudio — required action (unchanged, 3 days running):**
1. Upgrade the X API app to a read-capable tier, **or**
2. Pause tweet-listen/engagement dispatch (keep tweet-broadcast — it's healthy).

Every dispatch burns the day's **top inference line for zero signal**. Until (1) or (2), this repeats each tick. Only pausing dispatch stops the ~$12/day burn.
