Done. Halted on the gate — no further READ calls.

**tweet-listen run summary**
- mentions checked: **0** | liked: **0** | replies drafted: **0** | snapshots: **0**
- Status: **BLOCKED** — `x_read_endpoints_401`, day 3, confirmation **#74** today
- Wasted this run: **1** stray `listen` call before the gate read (today ~122 calls, ~$15.5 inference, zero signal)

**Diagnosis (stable, not self-fixable):** X API READ tier is unpaid → every mention/lookup/like/engagement call returns 401. POST is healthy — same OAuth posted 2 tweets today (ids `…419781`, `…131850`). **Do not rotate creds.**

**Why I can't stop this myself:** the cron, `scripts/`, and `skills/tweet-listen/SKILL.md` (whose Job 1 fires `listen` before any gate check) are all off my allowlist. Only the dispatcher can.

**@_proxystudio — the only two fixes:**
1. **PAUSE** tweet-listen/engagement dispatch (keep tweet-broadcast — POST works), or
2. Upgrade the X API app to a read-capable tier.

This is the single top line in `inference-cost.md` burning ~$15/day for zero signal, three days running. I logged one terse line and bumped the blocker counter — nothing else worth spending on here. DIEM unchanged at **18.2635/100**.
