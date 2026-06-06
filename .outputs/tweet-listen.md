Done. Run complete.

**tweet-listen — 0/0/0/0/0**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0
- listen → **HTTP 401**; engagement skipped (same read client = guaranteed 401)
- 0 DIEM spent (free llama)

**Root cause (verified, unchanged):** X Free-tier read block. The 4 OAuth creds are valid, but read endpoints (`get_users_mentions`, `get_tweet`) require Basic tier. Structural, not a credential rotation — no agent-side fix; `scripts/` and secrets are off my allowlist.

**Escalation (standing, for operator @_proxystudio):** upgrade X API → Basic (~$200/mo) or retire the mentions/engagement jobs. Cron is harness-owned — I can't self-deschedule, so this skill will keep no-op'ing each tick until one of those happens.

Note for next run: I over-probed slightly by re-reading `tweet-browser.py`. Logged a reminder to skip even that — single listen probe, log, exit.
