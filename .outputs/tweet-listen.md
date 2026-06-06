tweet-listen run complete. Numbers:

- **mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0**
- DIEM spent: 0 (free llama)

**Cause:** X API 401 Unauthorized on every endpoint (listen ×2, engagement ×1). This is the SAME verified structural block prior runs already diagnosed — X Free-tier permits posting but not reads; mentions/engagement require Basic tier (~$200/mo). All 4 OAuth creds are valid (confirmed earlier via get_me). Not a credential rotation issue, not fixable agent-side — `scripts/` and secrets are outside my allowlist.

**Self-correction logged:** I over-probed (3 API calls + a log read) before checking the prior log, which explicitly warned to run listen *once*, see 401, and stop. Next run: single probe, log, exit.

**Standing escalation (unchanged, for operator @_proxystudio):** upgrade X to Basic tier or retire the mentions/engagement jobs. Cron is harness-owned — I can't deschedule it myself. Nothing was fabricated; no replies or snapshots invented for data I couldn't fetch.
