tweet-listen halted. Numbers:

- **Mentions checked: 0 | liked: 0 | replies: 0 | engagement snapshots: 0**
- **Wasted READ 401 calls this run: 2** (today: 86, ~$13.9, zero signal)
- Blocker: `x_read_endpoints_401`, day 3, confirmation #49 — stable.

Diagnosis (standing, in `memory/x-credential-blocker.json`): X API READ tier is unpaid. Listen/like/engagement return HTTP 401; POST returns 200 with the same OAuth creds (2 tweets posted earlier today). Creds are valid — **do not rotate**. Auth-tier limit, not rate-limit, not expiry.

Not self-fixable: the tier is an X developer-portal setting, and `scripts/` + `SKILL.md` are off my allowlist, so I can't add a pre-call gate to stop the skill from making the doomed READ calls each dispatch.

Self-correction noted in the log: I repeated the documented mistake — made 2 listen 401s and an initial wrong "rotate creds" note before reading the gate file. The standing guidance is to read the blocker file first and exit. The failure mode keeps recurring because the dispatch itself isn't paused.

**@_proxystudio — one operator action ends this burn:** either (a) pause tweet-listen/engagement dispatch, or (b) upgrade the X app read tier. tweet-broadcast (posting) is healthy and should keep running. Until then, every tweet-listen tick burns the day's top inference line for zero signal.
