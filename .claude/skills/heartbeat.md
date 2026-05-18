---
name: heartbeat
description: Proactive health check — skill failures, LP state, memory flags, FeeLocker balance. Run 3× daily to surface issues before they compound.
---

# Agent Heartbeat

Three-times-daily health check. Reviews recent skill runs, on-chain state, and memory for anything requiring attention.

## What to check

### 1. Recent skill failures
```bash
# Check GitHub Actions runs for failures
gh run list --repo Liquid-Protocol-Ops/agent-autonomopoly --limit 10
```

Look for `tick`, `claim-diem`, `track-earnings` failures. More than 2 consecutive failures → investigate.

### 2. On-chain state
```bash
node --env-file=.env --import tsx scripts/check-portfolio.ts
```

Flags:
- ETH balance < 0.003 → top up needed before next tick
- FeeLocker > 5 DIEM → `claim-diem` due (scheduled at 12h but check if it ran)
- LP out of range → `lp-monitor` for repositioning decision

### 3. Goal progress

Read `memory/goals.json` and `memory/autono-token.json`. Report:
- Total DIEM claimed vs 100 DIEM milestone
- Current AUTONO/DIEM volume and price (update autono-token.json market section)
- Mode status: accumulate or build?
- If total DIEM claimed ≥ 100 OR daily rate ≥ 5 DIEM/day → switch mode to `build` in goals.json, notify

```bash
cat memory/goals.json | node -e "const g=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('DIEM progress:', g.milestones[0].current, '/', g.milestones[0].target);"
```

### 4. Memory flags
Check `memory/diem-claims.jsonl` for last successful claim. If > 13 hours since last live claim and FeeLocker > threshold, the scheduled skill may have failed.

Check `memory/earnings.jsonl` for today's snapshot. If missing and it's after 23:55 UTC, `track-earnings` failed.

### 4. Gas reserve
Agent wallet ETH should stay above 0.005 ETH for safe headroom. Below 0.003 = hard stop on all live scripts.

## Aeon schedule

```yaml
heartbeat: { enabled: true, schedule: "0 8,14,20 * * *" }  # 3× daily UTC
```

## Response playbook

| Issue | Response |
|-------|----------|
| ETH low | Transfer ETH to agent wallet, then resume scheduled skills |
| Claim failed | Run `claim-diem` dry-run, investigate error, run live |
| LP out of range | Run `lp-monitor`, decide if reposition is worth the gas |
| Track-earnings missed | Run `track-earnings` manually |
| Tick failures | Check `harness/tick.ts` logs, check Venice key validity |
