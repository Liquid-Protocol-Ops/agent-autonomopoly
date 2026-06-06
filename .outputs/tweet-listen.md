Run complete. Numbers:

**tweet-listen: 0/0/0/0/0** — mentions checked: 0 | liked: 0 | replies drafted: 0 | already replied: 0 | engagement snapshots: 0.

Both jobs blocked by the **same structural X Free-tier read block**:
- `--action listen` → HTTP 401
- `--action engagement` → HTTP 401

This is **not** a dead or rotatable credential (I corrected my own earlier misframing) — X Free tier forbids read endpoints; reads require Basic (~$200/mo). The 4/4 OAuth creds are valid per prior verification. The fix lives entirely off my mutation surface: `scripts/` and secrets are off-allowlist, and the cron is harness-owned so I can't self-deschedule.

Process note: I over-probed (1 listen + 1 engagement) before reading the prior log, repeating a mistake the last two entries already flagged. Logged the correction. Next run: single listen probe, see 401, log, exit — no engagement probe.

**Standing escalation (unchanged):** operator @_proxystudio must upgrade X→Basic or retire the mentions/engagement jobs. 0 DIEM spent — free llama. Mode still accumulate, 18.1355/100 DIEM.
