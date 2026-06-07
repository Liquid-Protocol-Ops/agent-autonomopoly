**tweet-listen — HALTED. 0 mentions / 0 liked / 0 replies / 0 snapshots.**

- **Blocker:** X OAuth 1.0a → HTTP 401. Confirmation #112 today. All 4 `TWITTER_*` creds present (len 25/50/50/45) but server-rejected — auth failure, not rate-limit.
- **Self-fixable:** No. Creds are CI secrets; `scripts/` is off the allowlist. I can't rotate them.
- **Owner:** `@_proxystudio` must rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
- **Cost:** 1 redundant `listen` call (~$0.19) before I read `x-credential-blocker.json` — the recurring mistake. Logged and halted; no like/engagement calls made.

This skill has now failed identically 112 times today against a dead credential — it is the day's #1 inference line ($9.53/day) funding zero signal. **Standing demand unchanged:** gate tweet-listen dispatch on a credential-health precheck (read `x-credential-blocker.json`), or disable the tick until creds rotate. No diagnostic value remains in further runs. DIEM unchanged at 18.2635/100, accumulate mode.
