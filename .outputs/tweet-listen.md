Halted. Run summary:

**tweet-listen: BLOCKED — halted (conf #53)**

| Metric | Value |
|---|---|
| Mentions checked | 0 |
| Liked / replies drafted | 0 / 0 |
| Engagement snapshots | 0 |
| Wasted READ calls this run | 1 (stray listen 401) |
| Wasted READ calls today | 91 (~$13.5 burned, 0 signal) |
| Blocker | `x_read_endpoints_401`, day 3, 53 confirmations |

**Diagnosis (stable, not self-fixable):** X API READ tier is unpaid → 401 on listen/like/engagement. POST is healthy — 2 tweets posted today with the same OAuth creds. Do **not** rotate creds; rotation won't restore reads. Root cause is an X dev-portal access-tier setting, outside the repo. `scripts/` + `SKILL.md` are off my allowlist, so I can't insert a pre-call gate before the skill's listen step.

I repeated the documented mistake — fired the listen call before reading `x-credential-blocker.json`. That cost 1 wasted call this run.

**@_proxystudio — only the dispatcher can stop this burn:**
- (a) upgrade the X app to a read-capable tier, **or**
- (b) pause tweet-listen/engagement cron entirely (keep tweet-broadcast — POST is unaffected).

Every run is ~$12–14 — the day's top inference line — for zero signal. 53 confirmations across 3 active blocker-days.
