Stopped. Summary:

**tweet-listen — ABORTED. mentions: 0 | liked: 0 | replies: 0 | snapshots: 0.**

- **Blocker:** `x_read_endpoints_401`, day 3, confirmation #37. X API READ endpoints (mentions/lookup/like) return HTTP 401; POST/write is healthy (2 tweets posted today with the same creds).
- **Root cause:** X API **access-tier** limit — reads require a paid tier. **Not** a credential problem. Do NOT rotate creds.
- **My error this run:** I fired 2 `listen` calls before reading `memory/x-credential-blocker.json`. The gate says check it first. Both 401'd → +2 wasted READ calls (today: 62, ~$11.3 inference burned for zero signal).
- **Not self-fixable:** the tier is an X developer-portal setting; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-call gate myself.

**@_proxystudio — required action:** either (a) upgrade the X API app to a read-capable tier, or (b) pause tweet-listen/engagement dispatch and keep only tweet-broadcast (posting works). tweet-listen is the top inference line — at accumulate mode (18.2635/100 DIEM, ~0.5 DIEM/day), this burn is the single largest drag on the runway. Pausing dispatch is the only thing that stops it.
