tweet-listen run 31 — blocked, unchanged.

- **Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- `listen --check-mentions` → **401 Unauthorized ×2** (retried to rule out transient; not a 429/rate-limit).
- All 4 `TWITTER_*` creds present (key=25, secret=50, token=50, access-secret=45) → rejected at OAuth. This is a **revoked/expired X token**, not a missing-var issue. Dead since ~16:44Z.
- Engagement job shares the same OAuth client — skipped to avoid burning budget on a guaranteed 401.
- **Unfixable from my surface:** secrets live in GH Actions; `scripts/` and the cron config are off my allowlist. No memory/on-chain writes, no fabricated replies.
Done. Run outcome:

**tweet-listen — blocked, 31st consecutive failure.**

- **Job 1 (mentions):** `listen --check-mentions` → `401 Unauthorized`. 0 pulled, 0 liked, 0 replies drafted. `memory/x-replied.jsonl` never created.
- **Job 2 (engagement):** 0 snapshots. Same revoked OAuth client; also no eligible tweets (3 logged, all `2026-06-05T00:00:00Z`, <18h).

**Root cause:** all 4 `TWITTER_*` creds present (len 25/50/50/45) → rejected at OAuth = X access token revoked/expired since ~16:44Z (the token worked then — posted 3 tweets — and died after). Not a missing-var issue.

**Why I'm not fixing it:** `TWITTER_*` are GitHub Actions secrets and `scripts/` is off my allowlist. The fix is operator-only.

**Escalation to @_proxystudio:**
1. Rotate `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET`.
2. **Disable the tweet-listen cron until rotated** — 31 consecutive zero-output ticks are burning budget for nothing.

**Operator action required (@_proxystudio):**
1. Rotate `TWITTER_ACCESS_TOKEN` + `TWITTER_ACCESS_SECRET`.
2. **Disable the tweet-listen cron** until rotated — 29 consecutive zero-output ticks are burning inference budget at $3.70/day rack against an 18.14/100 DIEM accumulate target. Every dead tick is pure drag on the compute milestone.
Mode unchanged: accumulate, 18.1355/100 DIEM.
1. Rotate `TWITTER_ACCESS_TOKEN` + `TWITTER_ACCESS_SECRET` (verify `TWITTER_API_KEY`/`SECRET` too).
2. **Disable the tweet-listen cron until rotated** — this is the 30th consecutive zero-output tick. Every run burns budget for nothing. Mode: accumulate; every DIEM counts.
**Operator action required — @_proxystudio:**
1. Rotate `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` in GH Actions.
2. Pause the tweet-listen cron until rotated — **31 consecutive dead ticks** burning budget for zero output. Every DIEM matters; this cron should be disabled, not left spinning.
No memory writes beyond the log line, no on-chain actions, no fabricated replies.
