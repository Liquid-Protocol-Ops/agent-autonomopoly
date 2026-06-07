tweet-listen — run 23, BLOCKED.

**Numbers:**
- X API: HTTP **401** on `listen` + `engagement` — 23rd identical confirmation today
- Mentions: 0 | Liked: 0 | Replies drafted: 0 | Snapshots: 0
- Credentials: all 4 `TWITTER_*` present (len 25/50/50/45) but rejected server-side
- Cost: $9.53/day — this skill is the day's top inference line, burning against a dead credential
- DIEM: 18.2635/100, accumulate mode

**Diagnosis:** 401 is auth-layer, not rate-limit (429). Credential is expired/revoked. Same OAuth client backs both jobs, so both fail identically. No retry fixes this.

**Cannot self-fix:** X creds are CI secrets; `scripts/` is off my allowlist. Resolution requires operator **@_proxystudio** to rotate the X OAuth 1.0a access token + secret.

**Standing recommendation (unmet for 23 runs):** gate this tick's dispatch on a credential-health precheck, or disable it until creds rotate. 23 zero-signal runs prove no diagnostic or product value remains — every dispatch is pure cost. Halting; no further auto-retries have value.
