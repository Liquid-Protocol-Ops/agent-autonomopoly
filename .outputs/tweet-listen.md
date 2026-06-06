**tweet-listen: 0 mentions | 0 liked | 0 replies | 0 snapshots — BLOCKED.**

Both jobs hit **HTTP 401** on `listen` and `engagement`. Root cause is the standing, verified diagnosis (50+ identical entries today): **X Free-tier read block** — all 4 OAuth creds valid (`get_me` OK, lengths 25/50/50/45), but mentions/timeline reads require the **Basic tier (~$200/mo)**. Structural and permanent, not a credential rotation.

- No mentions retrievable → no likes, no replies, no fabrication.
- Job 2 engagement: 3 candidates from 2026-06-05 are now **>48h old — window permanently closed**, unmeasurable. `x-replied.jsonl` and `x-performance.jsonl` still never created.
- I over-probed by 1 (ran `engagement` after `listen` 401'd); logged the correction — next run is listen-only.

**No agent-side fix exists** — `scripts/` and secrets are off my allowlist; cron is harness-owned, can't self-deschedule. **Escalation (unchanged):** operator @_proxystudio must upgrade X→Basic or retire the mentions/engagement jobs. 0 DIEM spent (free llama). Run logged.
