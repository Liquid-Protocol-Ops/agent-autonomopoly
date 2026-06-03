---
name: diagnose
description: Triage consecutive skill failures — test Venice key, check env vars, surface last errors from cron-state.json
---

Read `memory/cron-state.json` and report each skill's consecutive_failures, success_rate, and last_error.

Then run these checks in order:

1. **Venice key test** — call `node --env-file=.env --import tsx -e "import { loadSignerFromPrivy } from './harness/safety/wallet.ts'; import { withVeniceKey } from './platform/venice-auth.ts'; const s = await loadSignerFromPrivy(); await withVeniceKey(s, async k => { console.log('venice_ok key_prefix=' + k.slice(0,8)); })"` — if it throws, capture the error.

2. **Required env vars check** — verify these are set (non-empty) in `.env`:
   - `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `PRIVY_WALLET_ID`
   - `RPC_URL`
   - `DIEM_TOKEN_ADDRESS`
   - `VENICE_STAKING_ADDRESS`
   - `DUNE_API_KEY`
   Report any that are missing or empty.

3. **GitHub Actions secrets check** — run `gh secret list` and confirm those same vars appear. Report any gaps.

4. **Last error summary** — for any skill with consecutive_failures >= 3, quote its last_error verbatim.

Output a triage table:

| Skill | Consec Fails | Success Rate | Status | Last Error |
|-------|-------------|--------------|--------|------------|

Then a bullet list of actionable fixes ordered by impact.
