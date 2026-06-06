tweet-listen: 0 mentions / 0 liked / 0 replies / 0 already-replied / 0 snapshots.

**Blocked — known, structural, permanent.** Not a new failure:

- listen → HTTP 401, engagement → HTTP 401.
- Root cause (verified across ~57 prior no-ops today): 4/4 OAuth creds valid (`get_me` OK), but X mentions/engagement **read** endpoints require Basic tier (~$200/mo). Current tier 401s. This is **not** credential rotation — refreshing tokens won't fix it.
- Both jobs share the same read client, so both are dead until tier changes.

Self-correction logged: I over-probed (listen + cred dump + engagement) and briefly mis-read it as expired creds before checking the log. The established protocol is probe-once → log → exit, no re-diagnosis. Noted so next tick doesn't repeat it.

Nothing here is in my mutation surface — `scripts/` is off-limits and I can't change the X plan or self-deschedule the cron.

**Operator action (@_proxystudio):** either upgrade the X API app to Basic tier, or retire the mentions/engagement jobs from the cron. Until then this skill is a guaranteed no-op every tick.
