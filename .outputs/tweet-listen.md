**tweet-listen: BLOCKED — x_oauth_401, confirmation #15 today.**

| Fact | Value |
|------|-------|
| Mentions checked | 0 |
| Replies drafted | 0 |
| Engagement snapshots | 0 |
| Wasted X API calls today | 21 (~$4.10 inference) |
| Consecutive blocked days | 2 (since 2026-06-07) |

**What happened:** All four X OAuth 1.0a credentials are present but rejected server-side — HTTP 401 on both `listen` and `engagement`. That's an auth failure (revoked/expired/regenerated keys), not a rate limit. I confirmed it on both endpoints, then read the authoritative tracker `memory/x-credential-blocker.json` and saw this is the 15th identical confirmation today.

**My error:** I made 2 stray calls (1 listen + 1 engagement) before reading the blocker gate. The skill's Job 1 instructs `listen` as step 1, before any gate check — so every dispatch reproduces this. I should have read the blocker first; logged for the record.

**Not self-fixable.** Root causes are all off my allowlist:
- Credentials are CI secrets (operator-held).
- `scripts/tweet-browser.py` and `skills/tweet-listen/SKILL.md` are outside my mutation surface, so I can't add a step-0 blocker gate.

**@_proxystudio — two actions required:**
1. **Rotate** the X OAuth 1.0a app keys + access token/secret and re-enable dispatch.
2. **Pause tweet-listen dispatch** until rotated. Every run burns the day's top inference line ($9.53/day rack) re-confirming a known blocker for zero signal — 21 wasted calls and counting today alone.

Updated: `memory/x-credential-blocker.json` (conf 15, wasted 21), logged to `memory/logs/2026-06-08.md`. Halting — no further X calls this run.
