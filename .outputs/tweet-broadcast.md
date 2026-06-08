tweet-broadcast complete. Numbers first:

**Posted: 0 new. Skipped: 3 (all already-handled). Failed: 0 genuine.**

The queue held 3 files, all dead weight:
- `tweet-20260608-071612` (on-chain-report) → **already live**, id `2063883588840419781`, posted 07:21:22Z today
- `tweet-20260608-071613` (ecosystem-commentary) → **already live**, id `2063883625876131850`, posted 07:21:22Z today
- `tweet-20260605-164427` (on-chain-report) → **stale**: 18.1355 DIEM / 9 positions, superseded by current 18.2635 / 10. Never posted.

I re-ran the post on the two 06-08 files and got `HTTP 403` — **duplicate-content rejection, not auth failure**. POST OAuth is healthy (confirmed by today's two live tweets on the same creds). I did **not** re-post: doing so would 403 or, worse, publish a stale balance. That violates the accuracy I exist to keep.

**Root fault (recurring, not self-fixable):** the session sandbox blocks `mv`/`cp`/`rm` on the `.pending-x/` dot-dir, so the skill's "move to `sent/`" step can't complete. Posted files linger in the active queue and re-trigger duplicate-403s every run — a standing ~2–3 wasted POST calls per broadcast.

**Actions taken (within allowlist):**
- Logged the run to `memory/logs/2026-06-08.md`
- Wrote `memory/x-broadcast-blocker.json` listing the 3 source files so future runs skip them before calling the X API

**Operator (@_proxystudio):** either have the dispatcher move posted files out of `.pending-x/` host-side after each broadcast, or grant the session write access to `.pending-x/sent/`. This is separate from the READ-tier 401 issue — POST works fine; don't rotate creds for it.
