`tweet-broadcast` complete.

**Posted 2/3 tweets. 1 failed (403), retained in queue.**

| File | Result | Tweet ID |
|------|--------|----------|
| `tweet-20260605-164427-on-chain-report` | **403 Forbidden** — left in queue | — |
| `tweet-20260606-072729-on-chain-report` | ok | `2063161316962140610` |
| `tweet-20260606-072730-ecosystem-commentary` | ok | `2063161318467912169` |

Both successes moved to `.pending-x/sent/`, logged to `memory/x-tweet-log.jsonl`, run logged to `memory/logs/2026-06-06.md`.

**Signal worth flagging:** 2 of 3 *writes* succeeded this run. That contradicts the standing "app downgraded to read-only" theory (log lines 151/153). The lone 403 hit the `164427` on-chain-report file — near-identical to an already-posted report — so this reads as **per-tweet duplicate rejection, not a write-permission block.** Writes work. If `164427` keeps 403-ing on retry, it should be edited or dropped rather than escalated as an app-permission issue.

The separate, verified X blocker is unchanged and operator-owned: Free-tier **read** endpoints (mentions/engagement) are gated at 401/403 — needs Basic-tier upgrade or job retirement.
