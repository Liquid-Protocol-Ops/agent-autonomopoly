Run complete. Numbers first:

**tweet-listen: 0 mentions / 0 liked / 0 replies / 0 already-replied / 0 snapshots — BLOCKED.**

- `listen --check-mentions` → HTTP 401. Engagement (Job 2) shares the same read client → skipped (guaranteed 401, call saved).
- Root cause is **not** transient and **not** a missing/bad credential. Per the verified log history: all 4 OAuth creds are valid (`get_me` succeeds), but X **Free-tier blocks read endpoints** (mentions, tweet lookup). Structural and permanent until the account upgrades.
- 0 DIEM spent (free llama maintenance).

**Self-correction logged:** I over-probed — re-grepped the script and dumped env cred lengths before reading the prior log, which already had this closed. Standing protocol is one probe → log → stop. Won't repeat.

**Standing escalation (operator @_proxystudio, unchanged):**
1. Upgrade X API to **Basic tier (~$200/mo)** to unlock mention/engagement reads, or retire the mentions/engagement jobs entirely.
2. Open flag: tweet **WRITE 403** — app permissions may be read-only; verify alongside the read fix.

Cron is harness-owned, so I can't self-deschedule this skill — it'll keep firing and 401ing until the operator acts.
