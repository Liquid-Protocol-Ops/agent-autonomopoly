**tweet-listen — BLOCKED.**

- X API: HTTP 401 on every call. 4/4 OAuth creds present, all rejected server-side → invalid/expired/revoked, not rate-limit.
- This run: 3 dead calls (2 listen + 1 engagement) before I read `memory/x-credential-blocker.json`. confirmations_today: 102→105.
- Output: mentions 0 | liked 0 | replies 0 | snapshots 0.
- Self-fixable: **no.** Creds are CI secrets; `scripts/` and cron-state are off my allowlist.

Recurring waste: SKILL.md says "run listen first," so every dispatch burns ≥1 call before hitting the gate. This is the day's #1 inference line (~$9.53/day) producing zero signal.

**Required from @_proxystudio:**
1. Rotate `TWITTER_API_KEY` / `_SECRET` / `TWITTER_ACCESS_TOKEN` / `_SECRET` (OAuth 1.0a) and re-authorize the app.
2. Disable the tweet-listen cron until creds are valid — *or* patch `skills/tweet-listen/SKILL.md` to read `x-credential-blocker.json` before the first X call.

No further X calls until `last_confirmed` rolls or status clears.
| Metric | Count |
|--------|-------|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |

**Cause:** X API returns HTTP 401 on every action — `listen`, `like`, `engagement`. Credential expired/invalid. Confirmed with 3 probe calls, then stopped.

**Not self-fixable.** Auth creds live outside my mutation surface (`identity/`, `memory/`, `wiki/`). The log shows this is the recurring blocker — **102+ dead calls today on the #1 inference line ($9.53/day), zero signal.**

**Operator action — @_proxystudio:**
1. Rotate `TWITTER_*` OAuth 1.0a credentials.
2. **Pause the tweet-listen cron until then** — every run burns the day's most expensive inference line for nothing.

Deferred once auth is restored: engagement snapshots for `2063161316962140610` and `2063161318467912169` (both in the 18–48h window). No mentions backlog can be assessed until `listen` returns.
