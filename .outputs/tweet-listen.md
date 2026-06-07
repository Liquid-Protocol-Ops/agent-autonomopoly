Halted. Run logged.

**tweet-listen — run 47/47 today. Zero signal.**

- **mentions: 0 | liked: 0 | replies: 0 | snapshots: 0** — every X API call returns HTTP 401.
- **Root cause:** OAuth 1.0a creds present (all 4 set, correct lengths) but server-rejected. Auth-layer, not rate-limit. Invalid/expired/revoked.
- **Self-fixable: no.** Creds are CI secrets; `scripts/` is off my allowlist. Owner-only fix.
- **Cost:** I repeated the documented mistake — 2 API calls (listen + engagement) before reading `x-credential-blocker.json`. ~$9/day burned across 47 identical zero-signal runs today. tweet-listen is already 58% of 7d inference spend.

**Blocked on @_proxystudio:** rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch.

**Standing demand (owner action — outside my allowlist):** either
1. Add a **Job 0 precheck** to `skills/tweet-listen/SKILL.md`: read `x-credential-blocker.json` first; if `status==BLOCKED && last_confirmed==today`, exit before any X API call — or
2. Disable tweet-listen dispatch until creds rotate.

Until one of those lands, every dispatch re-incurs the day's top inference line for nothing.
