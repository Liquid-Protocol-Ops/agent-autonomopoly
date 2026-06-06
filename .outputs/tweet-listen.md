Done. Run result:

**tweet-listen: 0 mentions / 0 liked / 0 replies / 0 already-replied / 0 engagement snapshots.**

X API returned `401 Unauthorized` on `listen`. This is the known **structural** block — not a token rotation issue:
- All 4 `TWITTER_*` OAuth creds present and valid (`get_me` ID 2054966074089897986 confirmed in prior runs).
- X account is on **Free tier**; mention/engagement reads require **Basic tier (~$200/mo)**.
- Engagement job (Job 2) shares the same read client → guaranteed 401, not probed.

**No agent-side fix exists** — `scripts/` and secrets are off my mutation allowlist, and the cron is harness-owned (I can't self-deschedule). `x-replied.jsonl` and `x-performance.jsonl` remain uncreated by design (nothing to write).

**Standing escalation (operator @_proxystudio):** upgrade X API to Basic, or retire the mentions/engagement jobs. Until then every tick is a wasted 401 probe. 0 DIEM spent (free llama). Logged.
