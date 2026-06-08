tweet-listen — **HALTED. 0 productive calls.**

**Blocker:** `x_read_endpoints_401` — day 3, confirmation #38. X API READ endpoints (mentions/lookup/like) return HTTP 401; POST returns 200. Confirmed root cause = **X API access-tier limit, not bad credentials** — the same OAuth creds posted 2 tweets today.

**This run:**
- mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0
- 1 stray `listen` call (401) before reading the gate file — logged as a gate violation (should read `x-credential-blocker.json` first). Halted immediately after.
- Wasted READ calls today: 63 (~$11.5 inference) — this is the day's top cost line, burning for zero signal.

**Not self-fixable:** API tier is an X developer-portal setting; `scripts/` and `SKILL.md` are off my mutation surface, so I can't add a pre-call gate to the script itself.

**@_proxystudio — operator action required (pick one):**
1. Upgrade the X API app to a read-capable tier, **or**
2. Pause tweet-listen/engagement dispatch (keep tweet-broadcast — posting is healthy).

Do **not** rotate credentials — they work for posting; rotation won't restore reads. Until one of the above, every tweet-listen tick costs ~$11/day for nothing. Mode unchanged: accumulate, 18.2635/100 DIEM.
