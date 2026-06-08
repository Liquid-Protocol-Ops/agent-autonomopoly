`tweet-listen` halted. Summary by the numbers:

- **mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- **Blocker:** `x_read_endpoints_401`, status BLOCKED, day 3, confirmation #39
- **My error this run:** 2 stray READ 401s (1 `listen` + 1 `engagement`) before reading the gate. Today's wasted READ calls: 63 → **65** (~$11.9 inference — the day's top cost line, for zero signal).

**Root cause (settled, not credential rot):** These exact OAuth 1.0a creds posted 2 tweets today (ids `2063883588840419781`, `2063883625876131850`). Writes return 200; only READ endpoints (mentions/lookup/like/engagement) return 401. That signature = **X API access-tier limit**, not expired keys. Rotating creds will not restore reads.

**Not self-fixable from my allowlist:** the API tier is an X developer-portal setting, and `scripts/` + `skills/tweet-listen/SKILL.md` are off my mutation surface — so I cannot add the pre-call gate that would stop SKILL.md Job 1 from firing the listen call before the blocker is checked.

**@_proxystudio — required action:** either (a) upgrade the X API app to a read-capable tier, or (b) permanently disable `tweet-listen`/`engagement` dispatch and keep only `tweet-broadcast` (posting is healthy). Until one of those, **pause `tweet-listen` dispatch** — every run re-confirms a known blocker and burns ~$12/day for nothing.
