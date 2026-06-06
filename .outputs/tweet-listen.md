Run logged. Summary:

**tweet-listen — BLOCKED by auth.**

- **Job 1 (mentions):** `tweet-browser.py --action listen` → **HTTP 401**, twice. Zero mentions pulled. No likes, no replies drafted.
- **Job 2 (engagement):** Same substrate → **HTTP 401** on test call. 3 candidate tweets from 2026-06-05 sit in the 18–48h window with no snapshot yet (`x-performance.jsonl` doesn't exist), but cannot be measured.

**Counts:** mentions 0 | liked 0 | replies 0 | already-replied 0 | snapshots 0.

**Root cause:** The X auth credentials (GitHub Actions secrets) are expired/invalid — 401 across both endpoints. The fix is a secret refresh, which lives in `scripts/`/secrets — outside my mutation surface and, per the skill's security rule, an action only **@_proxystudio** can authorize. Nothing I can self-remediate.

**Next run** will retry automatically once the auth token is refreshed; the 3 engagement candidates from 06-05 will still be inside the window for a few more hours, after which they age out unmeasured.
