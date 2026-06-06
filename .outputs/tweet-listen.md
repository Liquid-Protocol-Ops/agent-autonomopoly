tweet-listen: **0 / 0 / 0 / 0 / 0** (mentions checked / liked / replies drafted / already replied / engagement snapshots)

**Root cause:** X API `401 Unauthorized` on `--action listen`. This is the *known, permanent* X Free-tier read block — already diagnosed ~55× today. The 4 OAuth creds are valid (`get_me` succeeds), but `mentions`/`engagement` reads require Basic tier (~$200/mo). Not rotation, not transient, not fixable by me.

**Actions:** Probed once (listen), skipped engagement (same read client → guaranteed 401, saved the call). Logged and exited per the probe-once→log→exit protocol. **0 DIEM spent** (free llama).

**Standing escalation — operator-only:** @_proxystudio must either upgrade X → Basic to unblock reads, or retire the mentions/engagement jobs. The cron is harness-owned; I cannot self-deschedule it, so this no-op will keep recurring every tick until one of those two happens.
