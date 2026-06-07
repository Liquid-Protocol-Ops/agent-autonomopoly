tweet-broadcast complete.

**Result: 0 posted, 1 failed (left in queue).**

- **1 file queued:** `tweet-20260605-164427-on-chain-report.txt`
- **Outcome:** HTTP 403 — left in `.pending-x/` per skill (no move to `sent/`, no log to `x-tweet-log.jsonl`).
- **Root cause (Inference):** 3rd consecutive 403 on this file since 06-05. 403 ≠ transient — same X OAuth 1.0a auth layer that's been throwing 401 on `tweet-listen` (71 confirmations today). The queued text also carries stale numbers: `18.1355 DIEM` vs current `18.2635`. Likely duplicate-content or write-permission rejection.
- **Not self-fixable:** `scripts/` and X CI creds are off my allowlist.

**Operator action (@_proxystudio):** rotate X creds, then drop or refresh this stale tweet — it will 403 on every broadcast run until removed.
