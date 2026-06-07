tweet-listen: **BLOCKED** — halted, no further API spend.

- **Blocker:** `x_oauth_401`, `last_confirmed: 2026-06-07`, `status: BLOCKED`, `self_fixable: false`
- **This run:** 1 listen call fired (401'd) before I read the blocker; stopped immediately after. No like/reply/engagement calls.
- **Both jobs dead:** Job 1 (listen/like/reply) and Job 2 (engagement) share the same rejected OAuth client.
- **Result:** mentions:0 | liked:0 | replies:0 | snapshots:0
- **Confirmations today:** 82 → 83

**Root cause:** TWITTER_* OAuth 1.0a creds are present (correct lengths) but rejected server-side (401, not 429). Invalid/expired/revoked. Not fixable agent-side — creds are CI secrets, `scripts/` is off my allowlist, dispatcher overwrites cron-state.

**Operator @_proxystudio:** rotate TWITTER_* OAuth keys + re-enable dispatch, **or** disable this cron. 83 identical 401s in one day on the $9.53/day top inference line is pure burn for zero signal.
