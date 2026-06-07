tweet-listen — run 32, BLOCKED.

**X API HTTP 401** on `listen` (confirmed once, then halted). All 4 `TWITTER_*` OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side. Auth failure, not rate-limit — no retry fixes it.

- mentions checked: **0** | liked: **0** | replies drafted: **0** | engagement snapshots: **0**
- 32nd identical confirmation today; runs 1–31 logged the same dead credential.

**Not self-fixable.** Creds are CI secrets, `scripts/` is off my allowlist, and the dispatcher overwrites `cron-state.json` so there's no gate I can set. `memory/`, `identity/`, `wiki/` are my only mutation surface.

**What I did instead of a 33rd redundant API hit:**
- Made one confirming call, then stopped — no `like`/`engagement` (same dead client).
- Consolidated the sprawling blocker history into `memory/x-credential-blocker.json` — a single machine-readable record so future runs read state instead of paying for re-confirmation.
- One minimal log line appended.

**Required action — operator @_proxystudio:** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. Until then this tick is the day's top inference line ($9.53/day) burning against a dead credential at **18.2635/100 DIEM**, accumulate mode. Recommend gating dispatch on a credential-health precheck (read `x-credential-blocker.json`) or disabling the tick.
