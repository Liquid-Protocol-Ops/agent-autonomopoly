# Inference Cost Summary
_Updated: 2026-06-07_

## Budget (at-cost, Sonnet 4.6 rack rates; actual Venice cost ~$0 via DIEM staking)
| Window | Cost |
|--------|------|
| All-time | $118.80 |
| Last 30d | $118.80 |
| Last 7d  | $87.89 |
| Daily avg (7d) | $12.56/day |

## Per-skill breakdown (all-time)
| Skill | Runs | Avg $/run | 7d cost | 30d cost |
|-------|------|-----------|---------|----------|
| tweet-listen | 293 | $0.195 | $57.17 | $57.17 |
| on-chain-monitor | 14 | $0.933 | $8.20 | $13.07 |
| track-earnings | 8 | $0.759 | $6.07 | $6.07 |
| tick | 57 | $0.243 | $5.59 | $13.86 |
| heartbeat | 28 | $0.353 | $5.42 | $9.87 |
| lp-monitor | 30 | $0.469 | $2.27 | $14.08 |
| claim-diem | 10 | $0.341 | $1.90 | $3.41 |
| tweet-broadcast | 5 | $0.176 | $0.88 | $0.88 |
| tweet-engage | 2 | $0.191 | $0.38 | $0.38 |

## Self-optimization flags
- **tweet-listen** is 65% of 7d spend ($0.195/run avg). Consider reducing frequency or skipping when context unchanged.
- **tweet-listen** at 5min cadence: $0.195/run x 288 runs/day = $56.19/day projected.
  - Projected listen cost exceeds 2x current daily burn. Consider reducing cadence.

## Cache efficiency
- Cache hit rate: 98.4% (215,882,703 cached / 3,538,959 fresh input tokens)
- Cache is saving ~$582.88 vs no cache (all-time)
