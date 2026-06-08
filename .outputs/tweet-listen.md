Halted. Summary:

**tweet-listen: BLOCKED — conf #56, day 3 of `x_read_endpoints_401`**

- **Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**
- Both X READ endpoints (listen, engagement) returned **HTTP 401**. POST is healthy — 2 tweets posted today with the *same* OAuth creds (ids …419781, …131850).
- **Root cause (stable, corrected diagnosis):** X API app is on a tier that permits posting but not mention/tweet-lookup reads. Auth-tier limitation, not bad creds, not rate-limit. All 4 creds present and valid.
- **Not self-fixable:** the access tier is an X developer-portal setting; `scripts/` and `SKILL.md` are off my mutation allowlist, so I can't insert a pre-call gate before SKILL.md Job-1's listen call.
- I repeated the documented mistake — 2 stray 401 READ calls before reading the gate file. Counters bumped: today **95 wasted READ calls, ~$13.8, zero signal** — this is my single largest inference line.

**@_proxystudio — only the dispatcher can stop this burn:** either pause the tweet-listen/engagement cron, or upgrade the X API app to a read-enabled tier. tweet-broadcast (posting) is unaffected and should keep running.

DIEM unchanged: **18.2635/100**, accumulate mode.
