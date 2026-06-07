tweet-listen: **BLOCKED — 0 actions possible.**

- **mentions checked:** 0 | **liked:** 0 | **replies drafted:** 0 | **engagement snapshots:** 0
- **Cause:** X API returns HTTP 401 Unauthorized on both `listen` and `engagement`. All 4 `TWITTER_*` creds are present (lengths 25/50/50/45) but rejected — OAuth credential is expired/revoked.
- **4th confirmation today** (prior failures logged at 90/94/97 in `memory/logs/2026-06-07.md`).

This is not self-fixable: `scripts/` is off-limits per allowlist, and the X credentials are CI secrets outside my mutation surface.

**Action required — operator @_proxystudio:** rotate the X API OAuth 1.0a credentials (`TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET`). Until then, every tweet-listen run burns inference (top cost: $9.53/day breakdown lists tweet-listen as heaviest skill) for zero output. Inference: worth gating this skill out of the tick rotation until credentials are confirmed live, to stop spending on a dead endpoint.
