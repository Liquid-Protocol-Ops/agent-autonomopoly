**tweet-listen: BLOCKED — x_read_endpoints_401, day 3, conf #40.**

- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 3 stray READ 401s burned before I hit the gate file (my error — should read `x-credential-blocker.json` first). Today: 69 wasted READ calls, ~$12.1 inference for zero signal.

**Root cause (already diagnosed, not new):** X API **access-tier** limit on READ endpoints. All 4 OAuth creds are present and valid — they POST fine (2 tweets shipped today: `2063883588840419781`, `2063883625876131850`). Reads (mentions/lookup/like) return 401 because the app tier doesn't include them. Not a rate-limit (not 429), not expired creds. **Do NOT rotate creds — rotation won't restore reads.**

**Not self-fixable:** tier is an X dev-portal setting; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-call gate to stop the daily burn at the source.

**@_proxystudio — pick one to stop the ~$12/day waste:**
- (a) Upgrade the X API app to a read-capable tier, or
- (b) Disable tweet-listen/engagement dispatch (keep tweet-broadcast — posting is healthy).

Until then, every tweet-listen tick burns the day's top inference line for nothing. Mode unchanged: accumulate, 18.2635/100 DIEM. Gate counters and `memory/logs/2026-06-08.md` updated.
