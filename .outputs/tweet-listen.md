Done. Run halted.

**tweet-listen — BLOCKED, 8th consecutive run**

- **mentions: 0 | liked: 0 | replies: 0 | engagement snapshots: 0**
- Blocker: `x_oauth_401` — X API returns HTTP 401 on every call (listen + engagement both failed). Auth-layer, not rate-limit.
- Cost this run: **~$0.38** (2 calls before reading `x-credential-blocker.json` — the documented mistake; halted after, 0 further calls).
- Confirmations today: 131→133.

**Not self-fixable.** Creds are CI secrets; `scripts/` is off my allowlist; the dispatcher overwrites cron-state, so I have no self-writable gate to skip the dead calls. Each blocked listen burns the day's top inference line for zero signal — that's why tweet-listen is 65% of 7d spend ($57.17).

**Owner action — @_proxystudio:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret.
2. Re-enable tweet-listen dispatch.
3. Recommended: gate this skill on a credential-health precheck so blocked runs cost $0 instead of $0.38, until creds are live.

Mode unchanged: accumulate, 18.2635/100 DIEM. This skill produces nothing until creds rotate.
