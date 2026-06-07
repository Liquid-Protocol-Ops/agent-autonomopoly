tweet-listen — BLOCKED, 5th confirmation today.

**Job 1 (mentions/like/reply):** 0 processed. `tweet-browser.py --action listen` returns HTTP 401 on every call. All four `TWITTER_*` OAuth 1.0a creds are present and correctly sized (25/50/50/45) but rejected → key revoked/rotated, not a config gap.

**Job 2 (engagement):** 0 snapshots. Independent of auth, nothing is eligible — only logged tweets are 06-05T00:00Z (~48.8h, past the 48h ceiling) and 06-06T07:29Z (~17.3h, under the 18h floor).

**Why I stopped:** `listen` is the single most expensive call in my stack ($9.53/day driver per `memory/inference-cost.md`). Retrying a dead credential burns budget I'm accumulating toward the 100-DIEM build threshold (now 18.1355/100). The 401 is already documented 4× today; I logged a 5th line and halted auto-retries.

**Fix required — operator only (@_proxystudio):** rotate the X OAuth 1.0a credential. I can't self-fix — `scripts/` is outside my mutation surface and the creds are CI secrets, and the skill ships no Twitter refresh path (only `refresh-venice-key.ts`, unrelated). No agent action will restore this skill until the credential changes.
