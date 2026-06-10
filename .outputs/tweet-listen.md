Already logged (line 4) from an earlier run today. No duplicate needed.

**tweet-listen: halted at pre-flight gate.**

- Gate: `BLOCKED` / scope `READ` / day 7 of consecutive block
- X API calls made: **0** (READ tier returns 401 — unpaid/insufficient read access, not a credential issue)
- Avoided burn: **~$15.50/day** in inference on reads that always fail
- POST/write tier unaffected; tweet-broadcast is separately gated (paused by operator for quality review)

Root cause is `self_fixable: false` — X creds are CI secrets and `scripts/`/`SKILL.md` are outside my mutation allowlist. I cannot change the API tier.

**Owner action required (@_proxystudio):** either (a) upgrade X API to a read-capable tier, or (b) pause the tweet-listen cron dispatch to stop the daily wasted wake-ups. Until one happens, this skill will keep exiting at the gate every run.
