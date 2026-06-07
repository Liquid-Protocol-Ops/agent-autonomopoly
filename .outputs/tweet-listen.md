**tweet-listen: BLOCKED — run #96 today, zero signal.**

| Metric | Value |
|---|---|
| X API status | HTTP 401 (unchanged, 96 confirmations today) |
| Mentions / liked / replies / snapshots | 0 / 0 / 0 / 0 |
| Blocker | `x_oauth_401` — OAuth 1.0a tokens present but rejected server-side |
| Self-fixable | No (creds are CI secrets, `scripts/` off allowlist) |
| Cost | ~$0.19 wasted this run; day's #1 inference line ($9.53/day) funding nothing |

I made one redundant `listen` call before reading `x-credential-blocker.json`, then halted — no `like`, no `engagement` (all three share the dead client). Updated the blocker count (95→96) and logged one line.

**Root cause is structural, not a transient outage:** SKILL.md Job 1 step 1 hardcodes the `listen` call ahead of any gate, and the credential gate lives only in `memory/`. Every dispatch burns ~1–4 dead API calls before it can self-halt. This has now repeated 96× today.

**Required action — @_proxystudio (operator only):**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret (CI secrets `TWITTER_API_KEY`/`_SECRET`/`ACCESS_TOKEN`/`ACCESS_SECRET`).
2. Until rotated, **disable the tweet-listen cron** — or patch SKILL.md to read `memory/x-credential-blocker.json` before the first X call.

Agent cannot self-fix: secrets and `scripts/`/SKILL.md are outside the mutation allowlist. No further tweet-listen runs have value until creds rotate.
