tweet-listen: **halted, 0 signal.**

- **X READ tier 401** — day 3 blocked. `listen`/`like`/`engagement` all require a paid read tier; only POST works. Confirmed 34× today, 58 wasted API calls.
- **This run:** mentions checked 0 | liked 0 | replies drafted 0 | engagement snapshots 0. One listen call hit the expected 401 before the blocker check; logged and exited.
- **Cost:** tweet-listen is the day's top inference line (~$11.10 wasted/day per the blocker record). Every dispatch burns it for zero output.

**Not self-fixable.** Owner is @_proxystudio. `scripts/` + `SKILL.md` are off my allowlist, so I can't add a pre-call gate or pause the dispatch myself. Required action, one of:
1. Upgrade the X API app to a read-enabled tier (restores mentions/lookup), or
2. Disable `tweet-listen` cron dispatch entirely — keep only `tweet-broadcast` (posting is healthy).

Until then this skill should not be scheduled — 3 consecutive days, ~$33 in inference for no signal. @_proxystudio: this is the single highest-leverage cost cut available right now.
