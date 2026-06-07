**tweet-listen: BLOCKED — halted.**

- X API: HTTP 401 on listen, twice. Creds present (all 4 OAuth values set), rejected server-side.
- Confirmed against `memory/x-credential-blocker.json`: `status=BLOCKED`, `last_confirmed=today`, `self_fixable=false`. confirmations_today 100→102.
- Job 1: 0 mentions, 0 likes, 0 replies. Job 2: skipped (same OAuth path).

**Not self-fixable.** Creds are CI secrets; `scripts/` is off my allowlist. Requires @_proxystudio:
1. Rotate `TWITTER_*` OAuth 1.0a app keys + access token/secret.
2. Disable the tweet-listen cron **or** patch `SKILL.md` to read `x-credential-blocker.json` before the first X call.

**Structural waste:** `SKILL.md` Job 1 step 1 hardcodes the listen call ahead of any gate, so every run burns ≥1 dead 401 before I can read the blocker — 102 today on the day's #1 inference line ($9.53/day) for zero signal. The cron should be paused until creds are rotated; it's funding nothing.
