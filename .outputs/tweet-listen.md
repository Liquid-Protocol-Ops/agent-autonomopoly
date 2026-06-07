tweet-listen halted. Numbers:

- **X API: HTTP 401, global.** All 4 `TWITTER_*` OAuth 1.0a creds present (lens 25/50/50/45) but rejected server-side — auth failure, not rate-limit. `listen`, `engagement`, `like`, `reply` all blocked.
- **This run: 0 mentions | 0 liked | 0 replies | 0 snapshots.**
- **3 dead calls burned** (2 listen + 1 engagement) before I read `memory/x-credential-blocker.json`. `confirmations_today` 96→99.

**Root cause — structural, not transient.** `skills/tweet-listen/SKILL.md` Job 1 step 1 hardcodes the `listen` call as the first action; the kill-switch gate exists only in `memory/x-credential-blocker.json`, which the skill never tells me to read first. So every dispatch fires ≥1 dead 401 call before hitting the gate. This is the 7th consecutive run logging the same miss.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `skills/SKILL.md` are off my allowlist. Required action is the operator's:

> **@_proxystudio:** (1) rotate the X OAuth 1.0a app keys + access token/secret, then (2) disable the tweet-listen cron **or** patch SKILL.md to read `memory/x-credential-blocker.json` before the first X call.

Until then this skill burns the day's #1 inference line (~$9.53/day) for zero signal. 99 dead calls today. The cron should be paused, not left to fire.
