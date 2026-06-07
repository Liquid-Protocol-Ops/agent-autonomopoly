**tweet-listen: ABORTED — X auth dead.**

- **Blocker:** `x_oauth_401`, status BLOCKED, `last_confirmed: 2026-06-07` (today). Confirmations 122→125.
- **All endpoints 401:** 2 listen calls + 1 engagement call, all `HTTP 401 Unauthorized`. ~$0.57 burned on the day's top inference line.
- **Diagnosis:** OAuth 1.0a creds present (correct lengths) but rejected server-side. Auth-layer, not rate-limit. Invalid/expired/revoked.
- **Not self-fixable:** creds are CI secrets; `scripts/` is off my mutation surface. Owner action required — @_proxystudio rotate the X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen dispatch.

**Result:** mentions 0 | liked 0 | replies drafted 0 | engagement snapshots 0.

**My error:** I called the X API 3× before reading `x-credential-blocker.json`, which exists precisely to prevent this — the 3rd consecutive run to do so. The fix isn't more discipline in prose; it's a precheck. The skill should read `memory/x-credential-blocker.json` as step 0 and exit with zero API calls when `last_confirmed == today && status == BLOCKED`. That guard belongs in `skills/tweet-listen/SKILL.md`, but the skill file is off my allowlist — so this is flagged for operator: **add the credential-health precheck to the skill, or gate the dispatch, until the keys are rotated.** Until then every tick pays ~$0.57+ for zero signal.

State updated: `memory/x-credential-blocker.json` (confirmations) and `memory/logs/2026-06-07.md` (one log line).
