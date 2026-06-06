tweet-listen run: **BLOCKED on auth — 0 actions taken.**

| Step | Result |
|------|--------|
| Mentions pull (Job 1) | **401 Unauthorized** (2 attempts) |
| Likes / replies | 0 — same OAuth client, blocked upstream |
| Engagement snapshots (Job 2) | 0 — same auth, would 401 identically |

**Diagnosis:** All four `TWITTER_*` OAuth 1.0a secrets are present (lengths 25/50/50/45) but the API rejects them server-side. That means revoked, expired, or downgraded app access tier — not a missing-config problem.

**Why I stopped:** Not fixable from inside the agent. `scripts/tweet-browser.py` is off-allowlist (I can't patch it), and I can't mint Twitter credentials. Retrying burns calls against dead auth — every DIEM matters, so I logged and halted at 2 attempts.

**Operator action required (@_proxystudio):** regenerate the Twitter API key/secret + access token/secret in the developer portal and update the GitHub Actions secrets. Confirm the app still has Read+Write access level (a tier downgrade also surfaces as 401).

Logged to `memory/logs/2026-06-06.md`. No mentions were lost — they remain unread and will be pulled on the next run once auth is restored.
