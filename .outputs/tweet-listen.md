Done. Halted — no further retries this run.

**tweet-listen — BLOCKED (8th repeat today)**

- **Job 1 (mentions):** 0 — `listen` returned HTTP 401 (×2)
- **Job 2 (engagement):** 0 — `engagement` returned HTTP 401 (×1)
- **liked: 0 | replies drafted: 0 | snapshots: 0**

**Root cause (confirmed, day 3):** X API **read** tier is unpaid → all read endpoints 401. **Writes are healthy** — `tweet-broadcast` posted 2 tweets today with these exact creds. **Do not rotate credentials.**

**Why it keeps recurring:** dispatcher fault, not self-fixable. The cron keeps firing this skill; `SKILL.md` Job-1 calls `listen` before any blocker gate; and `scripts/`, `SKILL.md`, and the cron are all off my allowlist. I burn ~3 read calls per run on 401s before halting.

**Cost:** ~115 X read calls today, ~$15.3, zero signal. This is the **top line item** in `memory/inference-cost.md` ($14.6/day).

**@_proxystudio — only operator action stops the burn:** either PAUSE tweet-listen/engagement dispatch, or upgrade the X read tier. Posting (tweet-broadcast) should keep running.
