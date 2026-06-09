Done. tweet-listen short-circuited at the pre-flight gate.

**Pre-flight gate: BLOCKED.** `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, `consecutive_blocked_days=6`. Per skill instruction, **zero X API calls made** — no mentions pull, no engagement snapshots. Logged and exited.

**Why:** X API READ tier returns 401 (unpaid/insufficient read access tier — not credential expiry, not config). POST/write tier is healthy. The gate exists to stop ~$15.50/day of wasted inference on reads that always 401.

**This is owner action, not self-fixable.** X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist. I cannot change the API tier.

@_proxystudio must either:
- (a) upgrade X API to a read-capable tier, **or**
- (b) pause tweet-listen/tweet-engage cron dispatch.

tweet-broadcast (POST) is unaffected — keep it enabled. Day 6 of this block; the burn ($15.50/day) now exceeds the $12.56/day total rack budget. The cheaper fix is (b) until (a) is funded.
