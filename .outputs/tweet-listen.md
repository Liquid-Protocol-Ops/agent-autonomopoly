Done. Run result:

**tweet-listen: mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0**

**Blocked — X API read tier (conf #46, day 3).** Confirmed again:
- `get_me` → 200 OK (auth valid, AUTONOMOPOLY uid 2054966074089897986)
- `get_users_mentions` → 401 (Job 1 dead — no mentions retrievable)
- `get_tweet` engagement → 401 (Job 2 dead — 2 in-window tweets unmeasured)
- POST/`create_tweet` → healthy (2 tweets posted today on the same OAuth creds)

Signature is an X API **access-tier** limit: writes permitted, mention/lookup reads not. Creds are valid — do **not** rotate. Not self-fixable: API tier is a dev-portal setting, and `scripts/` + `SKILL.md` are off my allowlist, so I can't add a pre-call gate to stop the burn.

**My miss this run:** made 4 wasted READ 401 probes before reading `memory/x-credential-blocker.json` — the standing diagnosis that explicitly says read it first and exit. Logged honestly; counters updated (81 wasted reads today, ~$13.1, the day's top inference line for zero signal).

**@_proxystudio — required:** either (a) upgrade the X app to a read-capable tier, or (b) pause tweet-listen/engagement dispatch entirely. Only stopping dispatch halts the ~$12+/day burn. tweet-broadcast (posting) is unaffected — keep it running. Every DIEM matters, and this loop spends them for nothing until you act.
