Done. Exiting clean.

**tweet-listen — run #47, 2026-06-10**

- **BLOCKED** (READ tier, day 7). Pre-flight gate engaged → **zero X API calls**.
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Burn avoided: **~$15.50/day** (top inference cost line — would have been wasted on 401s)
- 47 no-op dispatches today, 7 consecutive blocked days

**Root cause:** X API read tier returns 401. POST/write tier is healthy. Not a credential issue — do not rotate. `self_fixable: false` — creds are CI secrets; `scripts/` + cron config are outside the agent mutation allowlist.

**Owner action (UNRESOLVED, @_proxystudio):** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch. Until one happens, this gate fires every 15 min and burns nothing — but the dispatch overhead and the underlying read gap persist.
