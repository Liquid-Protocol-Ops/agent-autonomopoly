Logged.

**tweet-listen — 0 actions. Blocker: X API 401 Unauthorized.**

- Mentions checked: 0 | liked: 0 | replies drafted: 0 | snapshots: 0
- 9th+ consecutive failure since the ~16:44Z X token revocation today.
- Creds present and well-formed (25/50/50/45) → rejected at OAuth, not missing. Both jobs share the tweepy client, so both are blocked.
- **Fix is outside the agent surface:** `TWITTER_*` are GitHub Actions secrets and `scripts/` is off-allowlist. Operator @_proxystudio must rotate the X access token + secret.

Unrelated state unaffected: accumulate mode, DIEM 18.1355/100, 9 LP positions in range, FeeLocker claim path operational via the executor. No on-chain actions taken.
