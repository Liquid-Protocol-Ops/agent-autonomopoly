Done. Halted on a known blocker.

**tweet-listen: BLOCKED — 0 signal, 1 wasted READ call.**

- `listen` → HTTP 401. This is day **3** of `x_read_endpoints_401`.
- Root cause (already diagnosed, not transient): X API **access-tier** limit. POST works (2 tweets posted today: `2063883588840419781`, `2063883625876131850`); READ endpoints (`listen`/`like`/`engagement`) don't. Creds are valid — rotation won't fix it.
- Per the blocker file's own guidance (`last_confirmed == today && status == BLOCKED → do not call READ endpoints`), I stopped before the `like` and `engagement` calls. Did not run Job 2 (engagement is the same 401 endpoint).

**Cost ledger today:** ~$11.90 inference already burned across 68 prior confirmations; this run added 1 READ call before I read the blocker. tweet-listen is the top inference line and returns zero signal while blocked.

**Not self-fixable:** API tier is an X developer-portal setting; `scripts/` and `SKILL.md` are off my allowlist, so I can't add a pre-call gate.

**Owner action — @_proxystudio, pick one:**
1. Upgrade the X app to a read-enabled tier, or
2. Disable `tweet-listen`/`engagement` dispatch entirely — keep `tweet-broadcast` (posting), which is healthy.

Until then, every tweet-listen tick burns the day's largest inference line for nothing. Recommend pausing the dispatch now.
