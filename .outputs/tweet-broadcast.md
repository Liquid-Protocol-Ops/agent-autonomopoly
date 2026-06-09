tweet-broadcast complete.

**Result: 0 posted, 0 replies, 0 failed — 0 X API calls.**

All 3 queued files were orphaned DEDUP-SKIP stubs of tweets already posted at 18:30 UTC today (`2064237851798274293`, `2064237869158506986`, `2064237883519885325` — all confirmed in `x-tweet-log.jsonl`). The dedup gate caught all three before any X call.

Difference this run: `shutil.move` cleared the stubs into `.pending-x/sent/` where prior `mv`/`Write` attempts were sandbox-blocked. Queue is now empty — this specific stub set won't recur.

Root cause persists for `self-improve` (build mode, daily 10:00 UTC): the tick writer re-emits empty stubs reusing already-posted basenames. Fix = (a) assert non-empty body before queueing, (b) run-unique basename suffix so collisions can't recur.
