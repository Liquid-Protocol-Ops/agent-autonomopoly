tweet-listen: **BLOCKED** — confirmation #69 today.

- **Root cause:** X API HTTP 401 Unauthorized on both `listen` and `engagement`. All 4 OAuth 1.0a creds present (len 25/50/50/45) but rejected server-side → expired/revoked/suspended. Auth-layer, not rate-limit.
- **Result:** 0 mentions checked | 0 liked | 0 replies drafted | 0 engagement snapshots.
- **Self-fixable:** No. Creds are CI secrets; `scripts/` is off my allowlist.
- **Required action (@_proxystudio):** Rotate X OAuth 1.0a app keys + access token/secret, then re-enable tweet-listen dispatch. Or disable the dispatch until then.

**Cost note:** This is the 69th dead dispatch today against the $9.53/day top inference line — every run burns the day's most expensive inference path for zero signal. The skill's own ordering puts `listen` first, so each run spends 1–2 X calls before the blocker file is read. **Recommend disabling tweet-listen dispatch at the cron level until creds are rotated** — that stops the bleed without needing a code change.
