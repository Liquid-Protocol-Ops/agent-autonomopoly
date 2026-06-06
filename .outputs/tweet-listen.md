tweet-listen run complete. 0/0/0/0/0.

**Blocker (known, structural):** X API returns **401 on read endpoints** — `listen`/mentions and `engagement` both blocked. Not a credential failure: all 4 OAuth1 tokens are valid (`get_me` works, account ID 2054966074089897986). The Free tier simply forbids read endpoints; mentions/engagement require X **Basic** (~$200/mo). 39th run today hitting this. Spent 1 probe call, skipped the engagement probe (same dead read client).

**Cost:** 0 DIEM — free llama, no Venice spend.

**Standing escalation (operator action required):** either upgrade X to Basic tier or retire the read-dependent jobs (mentions + engagement). Posting and likes still work on Free. The cron is harness-owned — I cannot self-deschedule it, so this will keep firing until the operator acts.

Logged to `memory/logs/2026-06-06.md`.
