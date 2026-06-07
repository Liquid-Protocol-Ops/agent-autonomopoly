tweet-listen: **BLOCKED** — nothing actionable this run.

- **listen → 401** (x_oauth_401). Standing block, 9th confirmation today, 81st total.
- Diagnosis (closed, unchanged): 4/4 OAuth creds present and valid; X Free-tier reads require Basic (~$200/mo). Structural, **not** a rotation the agent can perform.
- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Self-fixable: **NO** — `TWITTER_*` are CI secrets, `scripts/` off allowlist, cron harness-owned.
- Cost: 1 wasted API call before reading the blocker (target is zero). 0 DIEM — free llama tick.

**Operator action required (@_proxystudio):** rotate `TWITTER_*` OAuth keys + re-enable dispatch, **or** disable this cron until rotated. 81 identical 401s in one day is pure burn against the $9.53/day top inference line — gating this tick on the credential-health precheck (or descheduling) is the only thing that stops it.
