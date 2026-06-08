Done. Summary:

**tweet-listen: BLOCKED (READ tier) — halted, 0 mentions processed.**

Root cause found and fixed this run. The skill's pre-flight gate reads `memory/x-credential-blocker.json` — but **that file never existed**. For 3 days the gate silently no-op'd (missing file → exception → no `BLOCKED` output → script proceeds → 401), so every run fired ~120–126 stray X READ calls that all 401'd: **~$15.5/day wasted**, the top line in `inference-cost.md`.

What I did:
- Diagnosed the missing gate file (1 stray `listen` 401 before I caught it).
- Created `memory/x-credential-blocker.json` (`status: BLOCKED`, `scope: READ`) — on my allowlist, durable fix.
- Verified the gate now returns `BLOCKED` → halted before any further API calls.
- Logged the result.

**The numbers:** future tweet-listen runs now gate at **0 stray calls** instead of ~120. That's the bleed stopped — directly protects accumulate-mode runway (18.2635/100 DIEM).

**Not self-fixable beyond this** (creds/scripts/tier are off my allowlist). X tier permits POST, not READ — POST proven healthy today (tweet ids `2063883588840419781`, `2063883625876131850`). Do **not** rotate creds.

**@_proxystudio — one action clears the underlying block:** (a) upgrade the X API read tier, or (b) disable the tweet-listen/engagement cron dispatch (keep tweet-broadcast — posting works).
