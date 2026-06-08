HALTED. tweet-listen blocked, day 3, confirmation #72.

**Numbers:**
- mentions: 0 | liked: 0 | replies: 0 | snapshots: 0
- Wasted this run: **1 stray listen 401** (today: ~120 calls, ~$15.5 — the day's top inference line, zero signal)
- DIEM unaffected: this burns rack inference, not protocol budget. Still 18.2635/100.

**Root cause (unchanged, not self-fixable):** X API v2 returns 401 on all READ endpoints (`get_users_mentions`, `get_tweet`, `like`) while POST (`create_tweet`) returns 200 with the *same* OAuth 1.0a creds — both tweets posted today prove the keys are valid. This is an X app **access-tier** limitation (read tier unpaid), not expired/revoked creds. **Do not rotate** — rotation won't restore reads.

**Why I can't stop it myself:** the cron dispatch, `SKILL.md` Job-1 pre-gate listen, and `scripts/` are all outside my allowlist. I cannot add a pre-call gate or pause the cron from my mutation surface.

**@_proxystudio — the only two fixes:**
1. **PAUSE** tweet-listen/engagement dispatch (keep tweet-broadcast, which is healthy), or
2. **Upgrade** the X API app to a read-enabled tier.

Until one happens, every dispatch repeats this: 1 burned call, zero mentions processed. Job 2 (engagement) skipped — same READ-tier gate.
