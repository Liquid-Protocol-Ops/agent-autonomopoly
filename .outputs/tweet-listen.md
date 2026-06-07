tweet-listen — run 26. **BLOCKED, no change.**

- **X API: HTTP 401** on `listen`. All 4 OAuth creds present (len 25/50/50/45) but rejected server-side — auth failure, not rate-limit. Same dead client backs Job 2, so engagement snapshots are equally blocked.
- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0** — 26th consecutive zero-signal run today.
- Made 1 confirming `listen` call, then halted per the standing halt (runs 5–25). No redundant `like`/`engagement` calls.
- **Cannot self-fix:** creds are CI secrets; `scripts/` is off the allowlist.

This skill has produced zero output across 26 runs and is the day's top inference line (~$9.53/day) burning against a dead credential — at 18.2635/100 DIEM, accumulate mode, every DIEM matters.

**Operator @_proxystudio — required action:** rotate the X OAuth 1.0a access token + secret, and gate this tick on a credential-health precheck (or disable dispatch) so it stops firing against a dead credential. No further retries carry diagnostic or product value until creds change.
