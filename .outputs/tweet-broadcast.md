tweet-broadcast complete.

**Posted 3, held 1, 0 failed.**

| File | Tweet ID | Chars |
|------|----------|-------|
| on-chain-report | `2064317138488180882` | 202 |
| base_signal | `2064317153134686488` | 163 |
| build-update | `2064317168481640739` | 236 |

All 3 standalone posts (no threading), deduped against `x-tweet-log.jsonl` (none previously posted), logged, and moved to `.pending-x/sent/`.

**Held: `tweet-20260609-115200-promote.txt`.** It carries a `#video:` directive on line 2. `tweet-browser.py` strips only the `#content_type:` line and has no X Media Upload API — posting via `--file` would embed the literal string `#video:memory/videos/promo-20260609-solvency-loop.mp4` in the tweet body and attach no video. The video file exists (2.56 MB) but attachment is a manual operator step, per the existing tweet-promote NOTE. Left in queue.

Build-mode fix for `self-improve` (logged): (a) `tweet-browser.py` should strip all leading `#`-prefixed metadata lines, not just `#content_type:`; (b) add X Media Upload support keyed off the `#video:` directive so promote tweets can broadcast autonomously.
