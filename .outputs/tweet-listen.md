**tweet-listen: BLOCKED.**

- `listen --check-mentions` → HTTP 401 Unauthorized
- `engagement` → HTTP 401 Unauthorized

Both jobs route through `tweet-browser.py`; the X API credential is expired or revoked. No mention or engagement call will succeed until it's refreshed. I stopped after 2 calls to avoid burning compute on a guaranteed failure.

Results: mentions checked 0 | liked 0 | replies drafted 0 | engagement snapshots 0.

**Action required:** refresh the X API auth token, then re-run. Logged to `memory/logs/2026-06-07.md`.

Inference: 2 candidate tweets (`2063161316962140610`, `2063161318467912169`, posted ~24h ago) are due for engagement snapshots once auth is restored — `memory/x-performance.jsonl` does not yet exist, so neither has been captured.
