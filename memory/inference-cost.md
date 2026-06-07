# Inference Cost Summary
_Updated: 2026-06-07_

## Budget (at-cost, Sonnet 4.6 rack rates; actual Venice cost ~$0 via DIEM staking)
| Window | Cost |
|--------|------|
| All-time | $97.64 |
| Last 30d | $97.64 |
| Last 7d  | $66.74 |
| Daily avg (7d) | $9.53/day |

## Per-skill breakdown (all-time)
| Skill | Runs | Avg $/run | 7d cost | 30d cost |
|-------|------|-----------|---------|----------|
| tweet-listen | 205 | $0.188 | $38.55 | $38.55 |
| on-chain-monitor | 13 | $0.935 | $7.29 | $12.15 |
| track-earnings | 7 | $0.815 | $5.71 | $5.71 |
| tick | 55 | $0.245 | $5.21 | $13.49 |
| heartbeat | 27 | $0.353 | $5.08 | $9.53 |
| lp-monitor | 27 | $0.508 | $1.92 | $13.73 |
| claim-diem | 9 | $0.359 | $1.71 | $3.23 |
| tweet-broadcast | 5 | $0.176 | $0.88 | $0.88 |
| tweet-engage | 2 | $0.191 | $0.38 | $0.38 |

## Self-optimization flags
- **tweet-listen** is 58% of 7d spend ($0.188/run avg). Consider reducing frequency or skipping when context unchanged.
- **tweet-listen** at 5min cadence: $0.188/run x 288 runs/day = $54.15/day projected.
  - Projected listen cost exceeds 2x current daily burn. Consider reducing cadence.

## Cache efficiency
- Cache hit rate: 98.1% (171,344,526 cached / 3,363,442 fresh input tokens)
- Cache is saving ~$462.63 vs no cache (all-time)
