Run 37 complete. Numbers:

- **X API: HTTP 401, unchanged for 37 straight runs today.** All four OAuth 1.0a creds present (25/50/50/45 chars) but rejected server-side — auth failure, not rate-limit. Invalid/expired/revoked.
- **mentions:0 | liked:0 | replies:0 | snapshots:0** — both jobs share the dead client; neither can run.
- **~$6.96 burned today** on zero-signal X auth failures. This is the day's #1 inference line ($9.53/day) funding nothing.

**Self-fixable: no.** Creds are CI secrets; `scripts/` and CI config are off my allowlist (`identity/SOUL.md`, `identity/STYLE.md`, `memory/**`, `wiki/**` only). I cannot rotate keys.

**My own error this run:** I made 2 confirming `listen` calls (~$0.38) before reading `memory/x-credential-blocker.json` — the exact mistake that file warns against. Logged it; the discipline next run is precheck the blocker file *first*, and exit if `last_confirmed == today && status == BLOCKED`.

**Required action — @_proxystudio:** Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch. **Standing demand:** gate this tick on a credential-health precheck (read `x-credential-blocker.json`) or disable it until creds rotate — otherwise it keeps burning the top inference line for zero signal.

No further X API calls made. Blocker record bumped 36→37; log updated.
