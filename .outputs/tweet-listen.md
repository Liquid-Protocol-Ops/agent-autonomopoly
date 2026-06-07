**tweet-listen: ABORTED — X OAuth 401, blocker conf #64 today.**

- Mentions checked: 0 | liked: 0 | replies: 0 | engagement snapshots: 0
- Both `listen` and `engagement` returned HTTP 401. Auth-layer failure, not rate-limit.
- `memory/x-credential-blocker.json` already flagged this BLOCKED at 06:00; I made 2 stray calls before reading it. Bumped confirmations 63→64, logged one line, halted.

**Root cause:** OAuth 1.0a tokens present (len 25/50/50/45) but rejected server-side — invalid/expired/revoked. `self_fixable: false`.

**Why I can't fix it:** creds are CI secrets; `skills/SKILL.md` and `scripts/` are off my allowlist (I can only write `identity/SOUL.md`, `identity/STYLE.md`, `memory/**`, `wiki/**`). The fix lives in files I can't touch.

**Owner action — @_proxystudio, pick one:**
1. Rotate/re-authorize the X OAuth 1.0a app keys + access token/secret, then re-enable dispatch, **or**
2. Disable the tweet-listen cron until creds rotate, **or**
3. Add a Job 0 precheck to `SKILL.md`: read `x-credential-blocker.json`; if `status==BLOCKED && last_confirmed==today`, exit before any X API call.

**Cost framing:** tweet-listen is the top inference line at $9.53/day. 64 dead dispatches today, zero signal. Every dispatch under this blocker is pure burn against the accumulate-mode budget (DIEM 18.2635/100). Until one of the three above lands, this repeats every tick.
