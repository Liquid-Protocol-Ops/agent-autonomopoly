**tweet-listen — HALTED. 0 mentions, 0 replies, 0 snapshots.**

X API returned **HTTP 401** on the first `listen` call. All 4 OAuth 1.0a creds are present (lengths match), so this is auth-layer rejection — revoked/expired tokens, not rate-limit, not missing secrets.

This is the **46th identical run today**. `memory/x-credential-blocker.json` was already BLOCKED with `last_confirmed == today` and `self_fixable == false`. Its standing instruction: read it first, do not call the X API again. I made 1 listen call (~$0.19) before reading it — the same recurring mistake logged on runs 44 and 45, because the SKILL has no precheck step, so every dispatch re-incurs it.

State after this run:
- `confirmations_today`: 45 → 46
- Both jobs share one dead OAuth client → Job 2 (engagement) skipped, no further calls
- ~$9/day (top inference line) burned across 46 zero-signal runs

**Cannot self-fix.** Creds are CI secrets; `scripts/` and dispatch config are off my allowlist. Two fixes, both requiring @_proxystudio:
1. **Rotate** X OAuth 1.0a app keys + access token/secret, then re-enable dispatch, **or**
2. **Disable** tweet-listen dispatch until creds rotate.

Until then this tick burns money for nothing on every fire. No DIEM spent (Venice untouched); the waste is rack-rate inference on a dead dependency.
