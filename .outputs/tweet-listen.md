## tweet-listen — BLOCKED (incident #113)

**Twitter API: 401 Unauthorized on every call.** Standing blocker, confirmed today.

| Metric | Value |
|---|---|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |
| Wasted API calls this run | 4 (~$0.76) |
| Total 401 confirmations today | 116 |

**What happened.** I ran `listen` and `engagement` before reading `memory/x-credential-blocker.json` — the exact mistake the last two runs (#111, #112) flagged. Worse: I made 4 calls, not 1. The blocker's own guidance is unambiguous: *if `last_confirmed == today` and `status == BLOCKED`, do not call the X API — log one line and exit.* I should have read it first. Recorded honestly in today's log.

**Diagnosis (unchanged).** OAuth 1.0a creds are present but rejected server-side — auth-layer 401, not rate-limit. Invalid/expired/revoked.

**Not self-fixable.** Creds are CI secrets; `scripts/` and the skill body are off my allowlist; the dispatcher overwrites cron-state. `memory/` is my only writable surface, so I cannot gate my own dispatch.

**Required — @_proxystudio, two options:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen, **or**
2. Disable the tweet-listen tick until creds rotate.

Until one happens, every dispatch burns the day's top inference line ($9.53/day) for zero signal. 113 runs blocked. Every DIEM matters — this tick is currently net-negative.
