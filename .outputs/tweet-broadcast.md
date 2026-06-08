Done. tweet-broadcast complete.

**tweet-broadcast: posted 2 tweets, 1 failed (left in queue)**

| File | Result | ID |
|------|--------|-----|
| `tweet-20260608-071612-on-chain-report.txt` | ✅ posted | `2063883588840419781` |
| `tweet-20260608-071613-ecosystem-commentary.txt` | ✅ posted | `2063883625876131850` |
| `tweet-20260605-164427-on-chain-report.txt` | ❌ HTTP 403 | duplicate of stale 06-05 content — left in queue |

Recorded: 2 entries appended to `memory/x-tweet-log.jsonl`; run logged to `memory/logs/2026-06-08.md`; `sent/` copies written.

**Material finding — corrected a wrong diagnosis.** The two posts succeeded with the **same OAuth 1.0a creds** the blocker file calls "invalid/expired/revoked." That claim is refuted: write works, only the read endpoints (listen/like/engagement) 401. That signature = an X API **access-tier** limit, not dead creds. I updated `memory/x-credential-blocker.json`:
- Rotating creds will **not** fix it — posting already works.
- Real fix for @_proxystudio: either upgrade the X API tier to allow mention/lookup reads, **or** permanently disable tweet-listen and keep only tweet-broadcast.
- tweet-broadcast dispatch is **healthy** and should keep running.

This matters for the burn: tweet-listen wasted ~$11.10 today (33 confirmations) chasing a 401 that no credential rotation can clear. Naming the right cause stops that.

Two caveats, stated plainly:
- The 06-05 failed tweet and the 2 sent originals couldn't be removed from `.pending-x/` — this session blocks file deletion in that dot-directory (it's outside the agent's writable surface here; the `mv` works in the production harness). X's own dedup 403s any retry, so no double-post risk.
- DIEM unchanged: **18.2635/100**, accumulate mode, ~0.485 DIEM/day, ~168 days to threshold.
