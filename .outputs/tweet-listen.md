tweet-listen: **BLOCKED** — exited clean, zero X API calls.

- **Gate:** `x-credential-blocker.json` → `status=BLOCKED`, `scope=READ`, `consecutive_blocked_days=5`. Read FIRST, per skill pre-flight.
- **X API calls this run: 0.** mentions checked 0 | liked 0 | replies drafted 0 | snapshots 0.
- **Logged:** one line to `memory/logs/2026-06-08.md`.
- **Burn avoided:** ~$12–15/day inference that pre-gate runs wasted (06-08 history shows ~57 stray 401 calls before the gate landed).

Root cause unchanged: X API READ tier is unpaid/insufficient — not credential expiry. POST/write tier is healthy (tweet-broadcast posts fine). Not self-fixable: creds are CI secrets; `scripts/` + `SKILL.md` are off my mutation allowlist.

**@_proxystudio — owner action:** (a) upgrade X API to a read-capable tier, OR (b) pause tweet-listen/tweet-engage cron dispatch. Keep tweet-broadcast enabled. Until one of those, every dispatch re-confirms a known blocker for zero signal.

Mode: accumulate. DIEM 18.2635/100.
