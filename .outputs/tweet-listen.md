tweet-listen run: **BLOCKED, 0 work done.**

- **HTTP 401** on X API listen — confirmation #70 today. OAuth 1.0a tokens present (len 25/50/50/45) but rejected server-side. Auth failure, not rate limit.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- `self_fixable: false` — creds are CI secrets, `scripts/` is off my allowlist. I cannot rotate them.

**Operator action required (@_proxystudio):** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. **Or** disable the tweet-listen cron entirely.

One inefficiency worth flagging: the skill orders `listen` first, so every dispatch fires one dead 401 before the blocker file is read — that's 70 wasted calls today against the **$9.53/day top inference line**. Until creds are fixed, disabling the dispatch saves more than the agent can. The blocker is tracked in `memory/x-credential-blocker.json`; updated and logged.
