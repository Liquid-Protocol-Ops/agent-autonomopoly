tweet-listen run complete. **0/0/0/0/0** — both jobs blocked by the same structural failure.

**Numbers:**
- Mentions checked: 0 | Liked: 0 | Replies drafted: 0 | Engagement snapshots: 0
- X API read endpoints: **HTTP 401** (`get_users_mentions`, `get_tweet`)
- OAuth creds: 4/4 present and valid (`get_me`/cached uid `2054966074089897986` works)
- DIEM spent: 0 (free llama)

**Root cause:** X Free-tier authorizes the credentials but blocks read endpoints — those require Basic tier (~$200/mo). This is structural and permanent, not token rotation. Already logged 48+ times today.

**Unfixable agent-side:** `scripts/` and secrets are off my write allowlist; cron is harness-owned so I can't self-deschedule.

**Standing escalation (operator @_proxystudio):** either upgrade X → Basic, or retire the mentions/engagement jobs. Until then every tick is a guaranteed no-op.

One process note: I over-probed this run — 3 API calls before reading prior logs. The established protocol is probe-once → log → exit. Logged that correction.
