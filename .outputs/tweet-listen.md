**tweet-listen — 49th run. BLOCKED.**

```
mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0
```

**Root cause (settled, not re-investigated):** X API **Free tier blocks read endpoints**. `get_me` returns 200 (creds valid), but `get_users_mentions` and `get_tweet` return `401 Unauthorized`. This is a tier limitation — **token rotation will not fix it.** Live-verified at run 45; re-probing would burn DIEM, so I confirmed the 401 once and stopped.

- **Job 1 (mentions):** `listen --check-mentions` → 401. Nothing pullable. No replies fabricated, no likes sent.
- **Job 2 (engagement):** 3 tweets parked (`2062972380583022800`, `…393027408313`, `…404658229395`) — snapshot-blocked by the same 401.

**This cron is structurally dead — 49 consecutive zero-work runs bleeding accumulate-mode budget against the 18.1355/100 DIEM milestone.** It also exits 0 after logging, so the scheduler shows **false-green** — which is why the escalation hasn't landed.

**@_proxystudio — two real fixes, pick one:**
1. Upgrade X API to **Basic tier** (restores read endpoints), or
2. **Disable** tweet-listen / tweet-engage / tweet-broadcast crons until then.

**Result:** mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0

**Root cause:** X API returns **401 Unauthorized** on every call (`listen --check-mentions` ×2, `engagement` probe ×1). This is the ~10th consecutive failed run since the access token died ~16:44Z. All 4 TWITTER_* creds are present and well-formed (len 25/50/50/45) but rejected at the OAuth layer — token revoked/expired, not missing.

**Impact:**
- Job 1 (mentions): 0 pulled. `memory/x-replied.jsonl` never created — no mentions have ever been processed.
- Job 2 (engagement): 3 tweets in `x-tweet-log.jsonl` are now ~22.6h old, squarely inside the 18–48h window with no `x-performance.jsonl` entry — but the snapshot routes through the same dead OAuth client.

**Fix is outside my surface.** `TWITTER_*` are GitHub Actions secrets; `scripts/` is off-allowlist. Operator **@_proxystudio** must rotate the X access token + secret. Until then this skill is a no-op every run.

No memory writes triggered, no on-chain actions. Run logged to `memory/logs/2026-06-05.md`.
No memory writes beyond the log entry. No on-chain actions. No fabricated replies.
Run 48 — **0 work, structurally blocked.**

- `listen --check-mentions` → 401 ×2, `engagement` → 401 (confirmed live this run).
- **Root cause is settled, not a new failure:** X API project is on **Free tier**, which blocks read endpoints (`get_users_mentions`, `get_tweet`). Creds are valid — `get_me` returns 200. **Token rotation will not fix this.** (Runs 38–43's "rotate token" advice was wrong; corrected at run 44, live-verified run 45.)
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0.
- 3 tweets parked awaiting snapshot, read-blocked.
- No memory/on-chain writes, no fabricated replies. Run logged.

**@_proxystudio — this is 48 consecutive dead runs bleeding accumulate-mode budget against the 18.14/100 DIEM milestone. Two options, both yours to call:**
1. Upgrade X API to Basic tier (restores read access), or
2. Disable the tweet-listen cron.

Note: the scheduler shows these as green successes (skill exits 0 after logging), so the bleed is invisible on the dashboard.
No memory or on-chain writes triggered. Both the fix and the cron config are outside my mutation surface (`scripts/` off-allowlist, TWITTER_* are GitHub Actions secrets).
