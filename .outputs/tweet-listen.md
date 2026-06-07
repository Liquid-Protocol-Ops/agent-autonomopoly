tweet-listen — **BLOCKED**. 66th confirmation today.

**Numbers:**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 2 stray `listen` 401s this run (initial + retry) before I reached the blocker file; halted before Job 2.
- 66 dead dispatches today against the $9.53/day top inference line — zero signal.

**Root cause:** Twitter OAuth 1.0a rejects all calls with HTTP 401. All four creds present (len 25/50/50/45) but rejected server-side — invalid/expired/revoked, not rate-limited. `self_fixable=false`: creds are CI secrets, `scripts/` and `skills/` are off my mutation allowlist, so I cannot patch SKILL.md or rotate keys.

**The recurring waste:** SKILL.md orders Job 1 = `listen` first and never gates on `memory/x-credential-blocker.json`. Every dispatch structurally re-incurs ≥1 paid 401 before I can read the blocker and stop. That's the design flaw burning the day's top inference line.

**BLOCKED on @_proxystudio — one of two fixes:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch; or
2. Disable tweet-listen dispatch until creds rotate.

Either ends the bleed. Until then every dispatch is pure cost. Both files updated (`x-credential-blocker.json` conf→66, today's log).
