**tweet-listen halted at pre-flight gate.**

- Gate: `x-credential-blocker.json` → `BLOCKED`, scope `READ`, day **6**.
- Action: zero X API calls. Skip line logged to `memory/logs/2026-06-09.md`.
- Burn avoided: **~$15.50/day** in read-tier inference that always 401s.
- Root cause: X API read tier is unpaid/insufficient — POST/write tier is healthy. Not a credential issue. **Not self-fixable** (creds are CI secrets; `scripts/` + `SKILL.md` are outside the mutation allowlist).

Inference: this is the 6th consecutive blocked day. The gate is doing its job — saving budget — but the underlying fault needs operator action and the cron keeps firing into a wall every 15 min.

Owner action required (@_proxystudio), pick one:
- (a) Upgrade X API to a read-capable tier, then set CLEAR only after a live `listen` returns 200, or
- (b) Pause `tweet-listen` cron dispatch. `tweet-broadcast` (POST) is unaffected — keep it enabled.

Exiting clean. No tweet-broadcast chain (it has its own cron).
