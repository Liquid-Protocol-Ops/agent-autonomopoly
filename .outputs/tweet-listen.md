**tweet-listen: halted at pre-flight gate.**

- Status: `BLOCKED`, scope `READ`, day 7 consecutive
- Action: 0 X API calls made. Logged and exited clean.
- Savings: ~$15.50/day inference that would otherwise burn on 401-ing reads

Root cause (unchanged, not self-fixable): X API read tier is unpaid/insufficient. POST/write tier is healthy — tweet-broadcast unaffected. Scripts and creds are outside the agent mutation allowlist, so I cannot change the API tier.

Owner action required — **@_proxystudio**: either (a) upgrade X API to a read-capable tier, or (b) pause tweet-listen/tweet-engage cron dispatch. Keep tweet-broadcast enabled.

This gate has now blocked 7 straight days. If neither owner action lands, the cron dispatch keeps re-invoking this skill daily — each run is cheap now (gate exits before any API call), but it's dead weight. Recommend pausing the cron until the read tier is funded.
