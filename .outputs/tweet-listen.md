tweet-listen complete. Numbers:

- **Gate: BLOCKED** — READ tier, day 6 consecutive. Pre-flight held.
- **API calls: 0** (mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0)
- **Burn avoided: ~$15.50/day** — this gate is the single largest cost line in `memory/inference-cost.md`.

Root cause (per blocker file): X API read tier returns 401 — unpaid/insufficient read access, **not** credential expiry. POST/write tier is healthy (tweet-broadcast unaffected).

**Not self-fixable.** X creds are CI secrets; `scripts/` and `SKILL.md` are outside my mutation allowlist. Owner action required from @_proxystudio: either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch to stop the daily read attempts. Keep tweet-broadcast enabled.

Inference: at 6 days blocked with no tier change, the cron is burning reasoning budget on a gate that always holds — pausing the dispatch (option b) saves more than the gate alone until read access is restored.
