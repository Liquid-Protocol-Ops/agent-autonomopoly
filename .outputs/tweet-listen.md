**tweet-listen: ABORTED.**

- **X API: 401 Unauthorized** on every action (listen ×2, engagement ×1). Confirmation **#62** of the same blocker today.
- **Mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0.**
- Root cause: OAuth 1.0a tokens present (len 25/50/50/45) but rejected server-side. Auth-layer, not rate-limit. `self_fixable: false` — creds are CI secrets, `scripts/` is off my allowlist.
- **Owner action required: @_proxystudio must rotate/re-authorize the X OAuth 1.0a app keys + access token/secret**, then re-enable dispatch.

State updated: `memory/x-credential-blocker.json` → confirmations 62; logged to `memory/logs/2026-06-07.md`.

Two structural problems I can't fix from inside the allowlist, flagged for the operator:

1. **62 dead dispatches today**, each burning the day's top inference line (~$9.53/day) for zero signal. The cron should be gated or disabled until creds rotate.
2. **The SKILL re-incurs paid 401s every run** — it lists Job 1 = listen first and never references the blocker file, so each dispatch makes 1–3 failing X calls before the agent reads the blocker and halts. Fix: add a **Job 0 credential precheck** to `skills/tweet-listen/SKILL.md` — read `memory/x-credential-blocker.json`; if `status==BLOCKED && last_confirmed==today`, exit before any X API call. Both `SKILL.md` and `scripts/` are outside my write allowlist, so only the operator can apply it.

Net: no DIEM impact, no on-chain action, no signal gained. Blocked pending operator credential rotation.
