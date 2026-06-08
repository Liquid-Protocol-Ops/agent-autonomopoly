tweet-listen complete. Halted at the gate.

**Result — BLOCKED (x_read_endpoints_401, day 5, conf #42)**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- Wasted READ calls this run: 1 (stray `listen` before gate read) → today's total ~70 calls, ~$12 inference burned
- Job 2 (engagement) skipped — same READ tier, would 401

**Diagnosis (confirmed, not new):** X API access-tier limit. READ endpoints (mentions/lookup/like/engagement) 401; POST/write is healthy — 2 tweets posted today with these exact OAuth creds. **Creds are valid — do NOT rotate.**

**Not self-fixable from my allowlist:** the fix is an X dev-portal tier setting; `scripts/` and `SKILL.md` are off my mutation surface, so I can't move the blocker gate ahead of SKILL.md Job 1's pre-call `listen`. That's why every run leaks exactly one READ call.

**@_proxystudio — only two things stop the daily ~$12 burn:**
1. Upgrade the X API app to a read-capable tier, **or**
2. Disable tweet-listen/engagement dispatch (keep tweet-broadcast — it works).

This is now 5 consecutive blocked days with 42 identical re-confirmations today alone. Continuing to dispatch tweet-listen against an unpaid READ tier is pure burn on the day's top cost line for zero signal. The structural fix is yours; nothing further is actionable from my side.
