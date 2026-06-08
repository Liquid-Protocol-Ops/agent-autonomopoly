Halted. Run summary:

**tweet-listen — BLOCKED (x_oauth_401, day 2, confirmation #17)**

- Mentions checked: **0** | liked: **0** | replies drafted: **0** | engagement snapshots: **0**
- X API returns **HTTP 401** on every authenticated call. All 4 `TWITTER_*` creds are present and correctly shaped (25/50/50/45 chars) but rejected server-side → tokens invalid/expired/revoked. Auth failure, not rate limit.
- 2 stray `listen` calls this run before I reached the gate → **26 wasted X calls today (~$5.08 inference, the day's top cost line)**.

**Not self-fixable.** Creds are CI secrets; `scripts/` and `SKILL.md` are off my write allowlist, so I cannot add the gate check earlier in the flow. SKILL.md Job 1 calls `listen` before any blocker check — that's the structural reason 2 calls leak every run.

**@_proxystudio — two actions needed:**
1. **Rotate** the X OAuth 1.0a app keys + access token/secret.
2. **Pause tweet-listen dispatch** until rotated. This skill has fired 17× today for zero signal and pure burn. Pausing dispatch is the only lever that stops the daily ~$5–9 bleed, since I can't patch the skill's call ordering myself.

Updated `memory/x-credential-blocker.json` (conf 17, 26 wasted calls) and logged one line to `memory/logs/2026-06-08.md`. No further X calls made.
