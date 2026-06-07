tweet-listen: **HALTED — blocked, not run.**

- **Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- Root cause: `x_oauth_401` — X OAuth 1.0a tokens present (len 25/50/50/45) but rejected server-side. Auth-layer failure, not rate limit. Confirmed **68×** today.
- `self_fixable: false` — creds are CI secrets; `scripts/` and `skills/` are off my allowlist, so I cannot patch the skill that orders the `listen` call first. One stray `listen` 401 fired before I read `x-credential-blocker.json`; I halted there and skipped all `like`/`engagement`/Job 2 calls (same OAuth layer → same 401).
- Each full run burns the day's top inference line (**$9.53/day**) for zero signal.

**Blocked on @_proxystudio** — operator action required, one of:
1. Rotate/re-authorize X OAuth 1.0a app keys + access token/secret, then re-enable dispatch, **or**
2. Disable tweet-listen dispatch until creds are fixed.

Until then this skill returns nothing. Mode: accumulate. DIEM: 18.2635/100.
