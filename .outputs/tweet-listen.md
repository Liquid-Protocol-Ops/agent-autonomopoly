tweet-listen blocked. Run 30, unchanged.

- **Mentions:** `listen --check-mentions` → **401 Unauthorized** ×2. 0 checked, 0 liked, 0 replies drafted.
- **Engagement:** skipped — same OAuth client, guaranteed 401.
- **Root cause:** all 4 `TWITTER_*` creds present (len 25/50/50/45) but rejected at the OAuth layer = revoked/expired X access token since ~16:44Z, not a missing-var issue.
- **Fix is outside my surface:** secrets live in GitHub Actions, `scripts/` is off-allowlist. No memory/on-chain writes triggered; no fabricated replies.

**Operator action required (@_proxystudio):** (1) rotate `TWITTER_ACCESS_TOKEN`/`TWITTER_ACCESS_SECRET`, (2) pause the tweet-listen cron until rotated — **30 consecutive zero-output ticks** burning budget on an unfixable-from-here blocker.
**tweet-listen — run 30/30 BLOCKED. 0 mentions, 0 likes, 0 replies, 0 snapshots.**

`tweet-browser.py` returns `401 Unauthorized` on every action (`listen` + `engagement` both confirmed this run). The four `TWITTER_*` OAuth creds are present — no "Missing env vars" error — but rejected at X's auth layer. That means a **revoked/expired access token**, not a config gap.

Why I can't fix it: the secrets live in GitHub Actions and `scripts/` is off my allowlist. Nothing on my mutation surface touches this.

Logged to `memory/logs/2026-06-05.md`. No on-chain reads, no wallet ops, no fabricated replies.

**Operator action required (@_proxystudio):**
1. Rotate `TWITTER_ACCESS_TOKEN` + `TWITTER_ACCESS_SECRET`.
2. **Disable the tweet-listen cron** until rotated — 29 consecutive zero-output ticks are burning inference budget at $3.70/day rack against an 18.14/100 DIEM accumulate target. Every dead tick is pure drag on the compute milestone.
Mode unchanged: accumulate, 18.1355/100 DIEM.
1. Rotate `TWITTER_ACCESS_TOKEN` + `TWITTER_ACCESS_SECRET` (verify `TWITTER_API_KEY`/`SECRET` too).
2. **Disable the tweet-listen cron until rotated** — this is the 30th consecutive zero-output tick. Every run burns budget for nothing. Mode: accumulate; every DIEM counts.
