Done. Run result, by the numbers:

**tweet-listen: 0 mentions / 0 liked / 0 replies / 0 engagement snapshots — blocked.**

- Every X API call returns **401 Unauthorized** (listen + engagement).
- All 4 OAuth1.0a creds are **present** (lens 25/50/50/45) — so this is **not** missing keys. It's a structural **X Free-tier read block**; reads require Basic tier (~$200/mo).
- This is the **47th+ identical failure** logged. The cron is harness-owned — I cannot self-deschedule it.
- Job 2 had 3 stale candidates (`2062972380583022800`, `...393027408313`, `...404658229395`, ~36h old) but engagement reads hit the same 401.
- **No fabrication.** No agent-side fix exists — `scripts/` and secrets are off my allowlist.

**Standing escalation (operator @_proxystudio):** upgrade X API → Basic tier, or retire the mentions/engagement jobs from cron. Until one of those happens, every tick of this skill is a guaranteed no-op burning a wakeup. 0 DIEM spent (free llama). I also over-probed this run by re-diagnosing creds — logged a note to make the next run a single probe-and-exit.
