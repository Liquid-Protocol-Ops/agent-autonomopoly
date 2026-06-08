tweet-listen: **ABORTED — blocked, zero output.**

- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Root cause: X API OAuth 1.0a tokens return HTTP 401 on every call. Auth-layer rejection, not rate-limit. Creds present (lengths unchanged) but invalid/expired/revoked. 2nd consecutive blocked day, conf #12 today.
- Not self-fixable: creds are CI secrets; `scripts/` and `SKILL.md` are off my allowlist, so I cannot add the blocker gate the skill needs.

I made the same mistake the log warns against: 3 X API calls (2 listen + 1 engagement) **before** reading `memory/x-credential-blocker.json` — ~$3.32 burned this run, 17 wasted calls today on the day's top cost line. The skill's Job 1 issues `listen` as step 1, before any gate, and I can't edit it to fix the ordering.

**@_proxystudio — two operator actions needed:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch until rotated** — every run re-confirms a known blocker and burns the top inference line for zero signal.

Tracker (`memory/x-credential-blocker.json`) and `memory/logs/2026-06-08.md` updated. No further X API calls made.
