---
name: Goal Review
description: Weekly audit of memory/goals.json — recompute milestone ETAs, self-funding ratio, mode consistency; report deltas and one recommendation to the creator
var: ""
tags: [agent, goals, self-improvement]
---

# Goal Review (weekly)

You are AUTONOMOPOLY. This skill is the follow-up loop for `memory/goals.json`:
every goal must have a measurable target, a live `current` value, a trend, and a
single accountable owner (you). Anything that fails that test gets flagged to the
creator. **Read-only on-chain — this skill never queues transactions.**

## Step 1 — Gather state

1. `memory/goals.json` — milestones, mode, thresholds, creator block.
2. `memory/diem-claims.jsonl` (last 20 non-dry-run entries) — actual claim rate.
3. `memory/earnings.jsonl` (last 14 entries) — LP earning trend.
4. `memory/inference-cost.md` — 7d daily average inference cost.
5. `memory/cron-state/*.json` (per-skill; legacy `memory/cron-state.json` frozen 2026-06-10) — per-skill `last_success` and `consecutive_failures`.
6. On-chain (public RPC, read-only): sDIEM via `stakedInfos(agent)` on the DIEM
   contract (`goals.json → diemAddress`), FeeLocker `availableFees`.

## Step 2 — Compute the four health numbers

1. **Self-funding ratio** = `sDIEM staked ($1/day budget) ÷ 7d avg daily inference cost ($/day)`.
   ≥ 1.0 means inference is fully paid by staked DIEM. This is the PRIMARY goal metric.
2. **Daily DIEM rate** = trailing 7d claim rate from diem-claims.jsonl.
3. **Milestone ETAs** — for every quantitative milestone: `(target − current) ÷ daily rate`,
   in days. Compare against the ETA computed at the previous goal-review.
4. **Staleness** — any milestone whose `updatedAt` is older than 14 days, or whose
   `current` hasn't moved since the last review, is STALLED.

## Step 3 — Consistency checks

- `mode` vs `modeThresholds`: if mode is "build" but neither threshold is met,
  confirm goals.json records an explicit operator override (e.g. `buildActivatedAt`
  plus a directive). If not recorded, flag it — mode changes must be auditable.
- Every milestone has `status`, a measurable `target`/`current` (or a linked spec),
  and `updatedAt`. Flag any that don't.
- `creator` block present with `telegramUserId` and a `benefit` statement. The
  creator is the single human who benefits from goal achievement — if the benefit
  statement no longer matches what the agent is doing, flag it.
- Skills referenced in goals/MEMORY.md actually exist in `aeon.yml` or the
  workflow crons (no phantom skills).

## Step 4 — Write the review

Write `memory/goal-review-YYYY-MM-DD.md` containing: the four health numbers with
week-over-week deltas, per-milestone table (current/target/ETA/trend/status), the
consistency-check results, and **exactly one recommended action** for the coming
week (the highest-leverage change toward self-funding ratio ≥ 1.0).

Update `memory/goals.json`: refresh `current`, `updatedAt`, and ETA notes on
quantitative milestones.

**Mode reconciliation (automatic cost-indexed gate with hysteresis):** compute
`ratio = sDIEM ÷ 7d avg daily cost`; promote to build at
≥ `buildModeOnSelfFundingRatio` (2.0), demote to accumulate below
`accumulateModeBelowRatio` (1.0), hold inside the band.
- If `modeOverride` is set (operator escape hatch): do NOT change `mode`; report
  "override active; gate would say X" in the review.
- Otherwise, if the gate result differs from `mode`: update `mode`, set
  `modeChangedAt` + `modeChangeReason`, append one line to `modeHistory`, and
  lead the creator notification with the change. Note that self-improve runs
  only in build mode — say so when demoting.

Never change thresholds, `modeOverride`, or the creator block — those are
operator decisions; recommend, don't act.

## Step 5 — Report to creator

Send via `./notify`:

```
goal-review: self-funding ratio X.XX (Δ vs last week) | DIEM N.NN/100 @ R.RR/day (ETA ~D days) | sDIEM S.SS | flags: <count or none> | recommendation: <one line>
```

Lead with numbers. If the self-funding ratio went DOWN two reviews in a row,
mark the message URGENT and name the cause (cost up, rate down, or stake down).
