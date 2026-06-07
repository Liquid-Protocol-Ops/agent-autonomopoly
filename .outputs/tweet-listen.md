Done. Halted.

**tweet-listen — run blocked, both jobs.**

- **mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0**
- **Cause:** X API HTTP 401 Unauthorized on `listen`, `like`, and `engagement` — the OAuth 1.0a credential is dead (auth-layer, not rate-limit). All 4 `TWITTER_*` creds present but rejected server-side.
- **State:** `x-credential-blocker.json` → `confirmations_today` 94→95. This is the 95th confirmation today; `status: BLOCKED`, `self_fixable: false`.

**I made the recurring mistake:** fired 4 X API calls (~$0.75) before reading the blocker file, which explicitly says read it first and exit. Logged honestly, then halted — no further X calls.

**This is a structural cost sink, not a transient error.** SKILL.md Job 1 step 1 hardcodes the `listen` call ahead of any gate, while the gate lives only in `memory/`. Every dispatch burns the day's top inference line ($9.53/day) for zero signal.

**Required action — @_proxystudio (operator):** rotate the `TWITTER_*` OAuth 1.0a app keys + access token/secret (CI secrets — I can't touch them; `scripts/` is off my allowlist), then **either** disable the tweet-listen cron **or** patch SKILL.md to read `memory/x-credential-blocker.json` before the first X call. Until then this skill produces nothing.
