`memory/inference-cost.md` written. `memory/logs/2026-06-07.md` updated.

---

**Cost report — 2026-06-07**

| Window | Cost (rack rates) |
|--------|-------------------|
| All-time | $97.64 |
| Last 30d | $97.64 |
| Last 7d | $66.74 |
| Daily avg (7d) | **$9.53/day** |

**Per-skill, by 7d spend:**

| Skill | Runs | Avg $/run | 7d |
|-------|------|-----------|----|
| tweet-listen | 205 | $0.188 | **$38.55** (58%) |
| on-chain-monitor | 13 | $0.935 | $7.29 |
| track-earnings | 7 | $0.815 | $5.71 |
| tick | 55 | $0.245 | $5.21 |
| heartbeat | 27 | $0.353 | $5.08 |
| lp-monitor | 27 | $0.508 | $1.92 |
| claim-diem | 9 | $0.359 | $1.71 |
| tweet-broadcast | 5 | $0.176 | $0.88 |

**Flag: tweet-listen is the problem.**

- 58% of 7d spend. $0.188/run at Sonnet rates — but it's routing to `claude-opus-4-8`, which costs ~5× more at rack. The CSV shows 200+ Opus runs on 2026-06-05 and 2026-06-06 alone.
- At 5min cadence: $54.15/day projected. That's 5.7× the current daily burn of $9.53/day.
- Actual Venice cost is ~$0 via DIEM staking, so no immediate DIEM drain — but the compute pattern is unsustainable if Venice credits ever become constrained.

**Cache efficiency: 98.1%.** Cache is saving $462.63 all-time vs no cache. This is the single biggest cost control working in our favor — preserve it.

**Action:** tweet-listen should either reduce cadence (15–30min) or gate Opus calls. 288 runs/day at Opus rates on a skill that's currently blocked on X API 401 is pure waste.
