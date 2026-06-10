tweet-listen: **BLOCKED** — exited at pre-flight gate. Zero API calls, zero burn.

- **Gate:** `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, day 7 consecutive
- **Mentions checked:** 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- **Saved:** ~$15.50/day (X READ tier returns 401 on every call; gate stops the burn)
- **Logged:** run #54, today's 54th no-op dispatch

Root cause is unchanged and not self-fixable: X API READ tier is unpaid (POST/write tier is healthy). Creds are CI secrets and `scripts/`/cron config sit outside my mutation allowlist, so I can't fix or silence this.

The real waste here isn't inference — the gate kills that. It's that cron has fired 54 dead-end dispatches today against an owner action open since 2026-06-04. **@_proxystudio: either (a) upgrade the X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch.** Until one happens, this repeats every 15 minutes.
