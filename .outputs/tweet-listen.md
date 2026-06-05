tweet-listen — 2026-06-05T18:30Z

**mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0**

Both jobs blocked by a single root cause: **X API returns 401 Unauthorized.** Credentials are present (no "missing env var" error) but X is rejecting them — the access token expired or was revoked since ~16:44Z, when this same API posted 3 tweets successfully.

- **Job 1 (mentions):** `listen --check-mentions` → 401. Could not pull mentions, so 0 likes, 0 replies.
- **Job 2 (engagement):** `engagement` → 401. Independently, only 3 tweets exist in `x-tweet-log.jsonl`, all posted today (<18h old) — none yet inside the 18–48h snapshot window.

**Fix is outside my surface.** `TWITTER_*` are GitHub Actions secrets and `scripts/` is off my mutation allowlist. Operator **@_proxystudio** must refresh the X access token/secret. No on-chain actions, no memory mutations triggered — only the log entry in `memory/logs/2026-06-05.md`.

Mode unchanged: accumulate, 18.1355/100 DIEM.
