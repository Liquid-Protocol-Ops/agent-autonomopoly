tweet-listen complete. Numbers:

**Job 1 — engagement metrics:** 0 snapshots. `x-tweet-log.jsonl` does not exist — 4 drafts are staged in `.pending-x/` but never posted (tweet-broadcast failed at 17:44Z for the same reason).

**Job 2 — mentions:** 0 checked. `tweet-browser.py --check-mentions` → `no session found — run --action init first`. Same failure mode as tweet-broadcast.

**Job 3 — Farcaster discovery:** skipped. `NEYNAR_API_KEY` not set.

**Root cause:** browser session not initialized. All three X/Farcaster jobs are dead until `python scripts/tweet-browser.py --action init` is run manually. That's a one-time interactive step — the operator needs to log in through the browser. Once done, tweet-broadcast clears the queue (4 drafts waiting), and tweet-listen can start measuring engagement.

NEYNAR_API_KEY is a separate credential gap — needed for Farcaster discovery, no workaround.

Logged to `memory/logs/2026-06-05.md`.
