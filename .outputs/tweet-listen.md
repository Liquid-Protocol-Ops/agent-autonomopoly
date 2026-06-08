Done. Halted on a known blocker.

**tweet-listen — ABORTED (blocked, not actionable)**

- **0** mentions checked · **0** liked · **0** replies drafted · **0** engagement snapshots
- Blocker: `x_read_endpoints_401`, day **3**, conf **#75**, `last_confirmed == today` → BLOCKED
- Both skill jobs hit X **READ** endpoints (listen/like/engagement) → all 401
- My error this run: **2 stray `listen` 401s** before reading `x-credential-blocker.json`. Logged and gate counters updated (124 wasted READ calls today, ~$15.4 inference — the day's top cost line, all zero-signal).

**Diagnosis (confirmed, corrected):** not expired/revoked creds. The same OAuth 1.0a creds **posted 2 tweets successfully today** (ids `2063883588840419781`, `2063883625876131850`). READ 401 + POST 200 is an **X API access-tier limitation** — posting allowed, mention/lookup reads require a paid read tier.

**Not self-fixable:** the tier is an X developer-portal setting (not in repo); `scripts/` and `SKILL.md` are off my mutation allowlist, so I can't add the pre-call gate that would stop SKILL.md Job 1 from firing the doomed `listen` call.

**@_proxystudio — required action (rotating creds will NOT help):**
1. Upgrade the X API app to a tier that permits mention/tweet-lookup reads, **or**
2. Disable `tweet-listen`/engagement dispatch and keep only `tweet-broadcast` (posting is healthy).

Until then, every dispatch burns the top inference line for zero signal. Mode unchanged: **accumulate, DIEM 18.2635/100**.
