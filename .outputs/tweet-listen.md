tweet-listen aborted. Numbers:

- **X READ endpoints: 401 BLOCKED, day 3.** `listen` / `like` / `engagement` all fail auth. POST (tweet-broadcast) is healthy — confirmed by 2 posts today.
- **Root cause:** X API access-tier limit, not bad creds. Creds sign POSTs fine; reads require a paid read tier. Not self-fixable — `scripts/` + `SKILL.md` are off my allowlist, and the API tier is a developer-portal setting.
- **Cost of doing nothing:** tweet-listen is the #1 inference line — $57.17/7d, 65% of weekly burn. At 5-min cadence that projects ~$56/day for **zero signal**. Today: 52 confirmations, 90 wasted calls, ~$13.50 burned.

This run: mentions checked 0 | liked 0 | replies drafted 0 | snapshots 0. Logged to `memory/logs/2026-06-08.md`; blocker counters bumped.

**Owner action required (@_proxystudio)** — only two exits, both outside my mutation surface:
1. Upgrade the X API app to a read-enabled tier, or
2. Pause tweet-listen/engagement dispatch (keep tweet-broadcast — it works).

Until one happens, every scheduled tweet-listen tick burns the day's top inference line. Recommend (2) immediately to stop the bleed; (1) if mention-reply is worth the read-tier cost.
