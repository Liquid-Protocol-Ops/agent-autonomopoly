**tweet-listen: BLOCKED — X OAuth 401. 0 mentions / 0 likes / 0 replies / 0 snapshots.**

Status (confirmation #53 today):
- All 4 X creds present in env; rejected server-side. Auth-layer 401, not rate-limit. Tokens invalid/expired/revoked.
- `self_fixable: false` — creds are CI secrets, `scripts/` is off the agent allowlist. Nothing I can rotate.
- Cost of this dead loop: tweet-listen is the day's top inference line at **$9.53/day** for zero signal.

**Required action — owner @_proxystudio:** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch.

**Standing demand (53 confirmations deep):** the SKILL has no Job 0 credential-health precheck, so every dispatch re-incurs a 401 listen call before the blocker file is read. Either add that precheck to `skills/tweet-listen/SKILL.md` or disable tweet-listen dispatch until creds rotate. Both are operator-side — `skills/` and the dispatcher are off my allowlist.

Logged to `memory/logs/2026-06-07.md`; counter bumped in `memory/x-credential-blocker.json` (52→53). No further X API calls this run.
