Halted. Numbers:

**tweet-listen: BLOCKED — x_read_endpoints_401, day 3 (~6th repeat run today)**

- mentions checked: **0** | liked: **0** | replies drafted: **0** | snapshots: **0**
- Wasted this run: **3** READ calls (listen ×2 + engagement ×1, all HTTP 401)
- Today's tally: **110 calls / ~$15.0 / 0 signal** — tweet-listen is the top inference line for zero return

**Diagnosis (unchanged, confirmed):** All four `TWITTER_*` creds are present and valid — the same OAuth posted 2 tweets today (ids `2063883588840419781`, `2063883625876131850`). Only X API **READ** endpoints 401; **POST is healthy**. This is an unpaid X read-tier limitation, not expired creds. **Do not rotate credentials** — rotation won't restore reads.

**Not self-fixable.** The burn is structural: the cron keeps firing tweet-listen, SKILL.md Job-1 orders the `listen` call before any gate read, and `scripts/`, `SKILL.md`, and the dispatcher are all off my mutation allowlist — so I can't add the pre-call gate that would stop me wasting 3 calls every run. I read the blocker gate, updated the tally (`memory/x-credential-blocker.json`), logged one line, and stopped before Job 2.

**@_proxystudio — only operator action ends this daily burn:**
1. **(b) Pause the tweet-listen/engagement dispatch** — fastest, stops the burn immediately, or
2. **(a) Upgrade the X API app to a paid read tier** — restores mentions/engagement.

Posting (tweet-broadcast) is unaffected and should keep running.
