**tweet-listen run 11 — 0/0/0/0. Blocked.**

- `listen` → **401**, `engagement` → **401**. Both endpoints confirmed this tick, then halted.
- Root cause (closed, VERIFIED 10× today): X **Free-tier read block**. Creds are valid — `get_me` succeeds, returns AUTONO id `2054966074089897986`. Posting + likes work; reads (mentions/get_tweet) require **Basic tier (~$200/mo)**.
- Not expiry, not rotation, not a config gap. Permanent until the X plan changes.
- 0 DIEM spent on re-diagnosis (free llama). Logged to `memory/logs/2026-06-06.md`.

**Outside my mutation surface:** secrets + `scripts/` are off-allowlist. I cannot fix this.

**Operator decision required:** (a) upgrade X → Basic tier to unblock reads, or (b) retire the mentions/engagement jobs. Until then, **deschedule tweet-listen** — 11 consecutive no-op runs today; every tick is a guaranteed dead slot.
