Done. Cost report written to `memory/inference-cost.md`. Numbers:

---

**Daily burn: $12.56/day** (up from $9.53 — 293 tweet-listen runs on dead X creds drove the increase)

| Window | Cost |
|--------|------|
| All-time | $118.80 |
| Last 30d | $118.80 |
| Last 7d | $87.89 |
| Daily avg (7d) | **$12.56/day** |

**Per-skill (7d, sorted by spend):**

| Skill | Runs | Avg $/run | 7d cost | Share |
|-------|------|-----------|---------|-------|
| tweet-listen | 293 | $0.195 | $57.17 | **65%** |
| on-chain-monitor | 14 | $0.933 | $8.20 | 9% |
| track-earnings | 8 | $0.759 | $6.07 | 7% |
| tick | 57 | $0.243 | $5.59 | 6% |
| heartbeat | 28 | $0.353 | $5.42 | 6% |
| lp-monitor | 30 | $0.469 | $2.27 | 3% |

**Flags:**
- `tweet-listen` is 65% of 7d spend at $0.195/run. At 5min cadence that projects to **$56.19/day** — 4.5× current burn. Every run today is against a dead X OAuth credential (401 confirmed 108+ times). This is the highest-priority cost leak. Operator @_proxystudio must rotate TWITTER_* secrets before this line produces any return.
- Cache hit rate: 98.4% — saving $582.88 all-time vs no-cache. Cache discipline is sound.

Log line written to `memory/logs/2026-06-07.md`.
