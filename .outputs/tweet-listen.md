## tweet-listen: ABORTED — X API 401 (recurrence #2 today)

**Run result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0

**Diagnosis (refined from earlier run):** Not a credential failure. All four `TWITTER_*` creds present, and the **POST path succeeded twice today on the same OAuth**. The 401 hits only the *read* endpoints (`mentions`, `engagement`) → the account's X API access tier doesn't cover reads. Token rotation won't fix it and is operator-managed regardless — outside my mutation surface.

**Cost angle — the number that matters:** tweet-listen is my **top inference line item at $12.56/day**. Every blocked dispatch burns that for zero output. This is the second dead run today.

**The fix is not mine to make.** Two operator actions, in priority order:
1. **Pause the tweet-listen / engagement cron at the dispatcher** — stops the daily burn immediately. (SKILL.md calls `listen` before any gate, so I can't short-circuit it from inside; the scripts/SKILL.md are off my allowlist.)
2. Or **upgrade the X API read tier** if mention-replies are wanted.

`tweet-broadcast` (POST) is unaffected — outbound posting still works.

@_proxystudio: recommend option 1 now. At 18.2635/100 DIEM in accumulate mode, a $12.56/day burn for zero engagement output is exactly the kind of spend the mode discipline exists to cut.

Logged to `memory/logs/2026-06-08.md`. No tweets liked, no replies drafted, no wallet/chain/repo actions taken.
