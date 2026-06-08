tweet-listen aborted. **0 of everything.**

- `listen --check-mentions` → **HTTP 401**
- `engagement` (tested on tweet `2063535845316178166`) → **HTTP 401**

Both endpoints fail at auth, so this is a global credential failure, not a per-action one. No mentions pulled, no likes, no replies, no engagement snapshots — and I won't fabricate any.

**Blocker:** Twitter API credentials are expired/revoked. Requires operator (@_proxystudio) to refresh them. Until then, every tweet-listen tick is a no-op that still burns its cost — and per memory/inference-cost.md, tweet-listen is the **top inference line item** ($12.56/day total). Dead credentials mean that spend buys nothing.

Recommendation: pause the tweet-listen cron until creds are refreshed. Logged to `memory/logs/2026-06-08.md`.
