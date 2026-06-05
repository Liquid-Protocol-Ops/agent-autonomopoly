---
name: cost-report
description: Aggregate memory/token-usage.csv into memory/inference-cost.md — a self-optimization summary the agent reads on every run
var: ""
tags: [cost, meta, self-optimization]
---

Read `memory/token-usage.csv` and write `memory/inference-cost.md`.

## Compute

```python
import csv, json
from collections import defaultdict
from datetime import datetime, timedelta, timezone

rows = list(csv.DictReader(open('memory/token-usage.csv')))

# Pricing (Sonnet 4.6 public rates — Venice is ~free via DIEM staking, but track as if direct)
INPUT_RATE  = 3.00 / 1_000_000   # $/token
OUTPUT_RATE = 15.00 / 1_000_000
CACHE_RATE  = 0.30 / 1_000_000

def cost(r):
    return int(r['input_tokens'])*INPUT_RATE + int(r['output_tokens'])*OUTPUT_RATE + int(r['cache_read'])*CACHE_RATE

today = datetime.now(timezone.utc).date()
window_7  = str(today - timedelta(days=7))
window_30 = str(today - timedelta(days=30))

by_skill = defaultdict(lambda: {'runs':0,'cost_total':0,'cost_7d':0,'cost_30d':0,
                                 'input':0,'output':0,'cache_read':0})
for r in rows:
    s = r['skill']
    c = cost(r)
    by_skill[s]['runs'] += 1
    by_skill[s]['cost_total'] += c
    by_skill[s]['input'] += int(r['input_tokens'])
    by_skill[s]['output'] += int(r['output_tokens'])
    by_skill[s]['cache_read'] += int(r['cache_read'])
    if r['date'] >= window_30: by_skill[s]['cost_30d'] += c
    if r['date'] >= window_7:  by_skill[s]['cost_7d'] += c

total_cost   = sum(v['cost_total'] for v in by_skill.values())
total_7d     = sum(v['cost_7d']    for v in by_skill.values())
total_30d    = sum(v['cost_30d']   for v in by_skill.values())

# Daily burn: cost over last 7 days / 7
daily_burn = total_7d / 7

# Per-run averages
per_run = {s: v['cost_total']/v['runs'] for s,v in by_skill.items() if v['runs'] > 0}

# Flag heavy skills: > 30% of 7d spend
heavy = [s for s,v in by_skill.items() if total_7d > 0 and v['cost_7d']/total_7d > 0.30]

lines = [
    "# Inference Cost Summary",
    f"_Updated: {today}_",
    "",
    "## Budget (at-cost, Sonnet 4.6 rack rates; actual Venice cost ~$0 via DIEM staking)",
    f"| Window | Cost |",
    f"|--------|------|",
    f"| All-time | ${total_cost:.2f} |",
    f"| Last 30d | ${total_30d:.2f} |",
    f"| Last 7d  | ${total_7d:.2f} |",
    f"| Daily avg (7d) | ${daily_burn:.2f}/day |",
    "",
    "## Per-skill breakdown (all-time)",
    "| Skill | Runs | Avg $/run | 7d cost | 30d cost |",
    "|-------|------|-----------|---------|----------|",
]
for s, v in sorted(by_skill.items(), key=lambda x: -x[1]['cost_7d']):
    avg = v['cost_total']/v['runs'] if v['runs'] else 0
    lines.append(f"| {s} | {v['runs']} | ${avg:.3f} | ${v['cost_7d']:.2f} | ${v['cost_30d']:.2f} |")

lines += [
    "",
    "## Self-optimization flags",
]
if heavy:
    for s in heavy:
        pct = by_skill[s]['cost_7d']/total_7d*100
        avg = per_run[s]
        lines.append(f"- **{s}** is {pct:.0f}% of 7d spend (${avg:.3f}/run avg). Consider reducing frequency or skipping when context unchanged.")
else:
    lines.append("- No skill exceeds 30% of 7d spend. Cost distribution is healthy.")

# tweet-listen check: every 5min = 288 runs/day potential
tl = by_skill.get('tweet-listen', {})
if tl.get('runs',0) > 0:
    tl_avg = tl['cost_total']/tl['runs']
    proj_daily = tl_avg * 288
    lines.append(f"- **tweet-listen** at 5min cadence: ${tl_avg:.3f}/run × 288 runs/day = ${proj_daily:.2f}/day projected.")
    if proj_daily > daily_burn * 2:
        lines.append("  - Projected listen cost exceeds 2× current daily burn. Consider reducing cadence.")

lines += [
    "",
    "## Cache efficiency",
]
total_in  = sum(v['input']      for v in by_skill.values())
total_cr  = sum(v['cache_read'] for v in by_skill.values())
if total_in + total_cr > 0:
    cache_pct = total_cr / (total_in + total_cr) * 100
    lines.append(f"- Cache hit rate: {cache_pct:.1f}% ({total_cr:,} cached / {total_in:,} fresh input tokens)")
    lines.append("- Cache is saving ~" + f"${total_cr*(INPUT_RATE-CACHE_RATE):.2f}" + " vs no cache (all-time)")

open('memory/inference-cost.md', 'w').write('\n'.join(lines) + '\n')
print("cost-report: wrote memory/inference-cost.md")
```

Run the block above with:
```bash
python3 -c "exec(open('/dev/stdin').read())" << 'PYEOF'
[paste block]
PYEOF
```

Or more simply — just run it as a here-doc:

```bash
python3 << 'PYEOF'
import csv, json
# ... (full block above)
PYEOF
```

After writing `memory/inference-cost.md`, log one line to `memory/logs/{today}.md`:
```
cost-report: total_cost=$X.XX | daily_burn=$Y.ZZ/day | heavy_skills=[list or none]
```

Do not make any other changes. The file is picked up automatically on next tick.
