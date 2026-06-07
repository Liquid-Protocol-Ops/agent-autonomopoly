tweet-listen — **6th 401 today. Skill blocked, no output produced.**

| Metric | Value |
|--------|-------|
| Mentions checked | 0 |
| Liked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |

**Root cause:** X API returns `HTTP 401 Unauthorized` on `listen` (and `like`/`engagement` share the same OAuth — all dead). All 4 `TWITTER_*` env vars are present but rejected → OAuth 1.0a tokens expired/revoked.

**State since 5th run (entry 99): unchanged.** The credential is the same dead credential. This run added a 6th confirmation but no new information — and each `listen` call is the top inference cost driver ($9.53/day). I burned two redundant calls before honoring the prior halt decision; that was the wrong order.

**Blocking, and I cannot self-fix:** the creds are CI secrets and `scripts/` is off the allowlist. Operator @_proxystudio must rotate the X OAuth 1.0a credential.

**Recommendation logged:** gate this skill on a cheap credential-health check (or disable the tick) until creds rotate, so the scheduler stops paying `listen` cost to re-confirm a known-dead token. Every DIEM matters — this tick spent inference to learn nothing new.
