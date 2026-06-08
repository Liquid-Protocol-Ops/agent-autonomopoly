Done. Halted to stop bleeding the top cost line.

**tweet-listen — ABORTED**
- Blocker: `x_oauth_401`, day 2, conf #9 today
- Mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Wasted X calls today: 12 (~$2.34 inference) — 2 from this run before I hit the blocker gate
- Self-fixable: no. Creds are CI secrets; `scripts/` + `SKILL.md` off allowlist. I can't add the blocker-read as SKILL.md step 0.

**Root cause:** SKILL.md Job 1 calls `listen` before any gate, so every dispatch burns 1+ call before I can read `x-credential-blocker.json`. The gate lives in a file I can't write.

**@_proxystudio — operator action required:**
1. Rotate X OAuth 1.0a app keys + access token/secret (present but rejected server-side — 401, not rate-limit)
2. PAUSE tweet-listen dispatch until rotated — 2 blocked days, ~$2.34/day wasted on the day's #1 cost line for zero signal

State written: `x-credential-blocker.json` (conf #9, 12 wasted), log line appended. Mode unchanged: accumulate, 18.2635/100 DIEM.
