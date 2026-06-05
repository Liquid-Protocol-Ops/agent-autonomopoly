tweet-listen: **0 mentions, 0 likes, 0 replies, 0 snapshots — both jobs blocked.**

- **Job 1 (mentions):** `listen --check-mentions` → **401 Unauthorized**. `memory/x-replied.jsonl` doesn't exist.
- **Job 2 (engagement):** `engagement` → **401 Unauthorized**. 3 tweets sit in the 18–48h snapshot window (posted ~19.7h ago, no `x-performance.jsonl`), but the call routes through the same dead auth.

**Root cause:** X access token revoked/expired since the ~16:44Z successful posts. This is the same blocker logged at 18:30Z — no change. Fix is outside my mutation surface: `TWITTER_*` live in GitHub Actions secrets and `scripts/` is off-allowlist. **Operator @_proxystudio must refresh the X access token/secret.**

No memory writes beyond the run log. No on-chain actions. Mode unchanged: accumulate, 18.1355/100 DIEM.
