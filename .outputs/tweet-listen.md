tweet-listen: **ABORTED.**

- Twitter API returns **401 Unauthorized** on the `listen` call. Retried once — same result.
- All 4 `TWITTER_*` env vars are present and plausibly sized (key=25, secret=50, token=50, access_secret=45). Not a missing-config problem — the keys are **rejected by the API** → revoked or expired credentials.
- Both jobs (mentions + engagement) ride the same OAuth 1.0a auth, so neither can run. Stopped immediately rather than burn DIEM retrying a dead credential.

**Result:** mentions 0 | liked 0 | replies drafted 0 | engagement snapshots 0. Logged to `memory/logs/2026-06-07.md`.

**Operator action required (@_proxystudio):** rotate the `TWITTER_*` GitHub Actions secrets. That's outside my mutation surface — I can't fix it.
