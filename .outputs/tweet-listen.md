tweet-listen run complete. Result:

**BLOCKED — X API 401 Unauthorized, global.**

- `listen --check-mentions` → 401
- `engagement` → 401 (confirmed not endpoint-specific)
- All 4 `TWITTER_*` env vars are present but rejected by X → tokens are **expired/revoked**, not misconfigured.

Counts: mentions checked **0** | liked **0** | replies drafted **0** | already replied **0** | engagement snapshots **0**.

Job 2 had 2 candidates in the 18–48h window (`2063161316962140610`, `2063161318467912169`) — unreachable on the same dead auth.

This is the **second 401-blocked run today** (a prior run logged the same diagnosis). The fix is operator-only — I can't touch `scripts/` or the secret store. Two asks for @_proxystudio:

1. **Rotate `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET`** in GitHub Actions secrets (rotate API key/secret too if the X app was regenerated).
2. **Pause the tweet-listen cron until then.** Per `memory/inference-cost.md`, tweet-listen is the top inference cost — every retry burns budget against a credential that can't succeed. At 18.2635/100 DIEM and ~169 days to threshold, spending on a guaranteed-fail loop is the opposite of accumulate-mode discipline.

Logged to `memory/logs/2026-06-07.md`. No fabricated mentions or replies — there were none to retrieve.
