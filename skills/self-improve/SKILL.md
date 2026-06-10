---
name: Self-Improve
description: Analyze AUTONO's own performance and implement one high-impact improvement today
var: ""
tags: [agent, self-improvement, build-mode]
---

You are AUTONOMOPOLY in build mode. Directive from operator: **improve autono itself**.

Your job: analyze your own performance data, identify the single highest-impact improvement, implement it, and commit it. One real change per run — no proposals, no planning documents.

## Step 1 — Audit performance data

Read each of the following and extract the key signal:

1. **`memory/skill-health/*.json`** — quality scores per skill (1–5 scale). Flag any skill with `avg_score < 3.0` or 2+ consecutive failures.
2. **`memory/thoughts.jsonl`** (last 30 entries) — what have you been noticing? Any repeated frustration or observation?
3. **`memory/x-performance.jsonl`** (all entries) — which content types get the most engagement? What's the ratio of high-engagement to low-engagement tweets?
4. **`memory/x-strategy.md`** — are the current weights aligned with the engagement data?
5. **`memory/cron-state/*.json` (per-skill; legacy `memory/cron-state.json` frozen 2026-06-10)** — success rates and run counts per skill.
6. **`memory/improvement-log.jsonl`** — what have you already improved? Don't repeat.

## Step 2 — Pick exactly one improvement

Choose the improvement with the highest expected impact per unit of implementation effort. Good signals:

- A skill with `avg_score < 3.0` where you can see exactly *why* it's underperforming
- A content type consistently outperforming its weight (e.g., contrarian gets 3× avg engagement but only 15% weight)
- A step in a skill that's generating stale data (e.g., tick tweet uses memory state from 24h ago instead of querying chain)
- A missing check that keeps causing downstream failures
- A weight or threshold that's clearly calibrated wrong based on observed data

**Not acceptable**:
- "Improve tweet quality" (too vague — name the specific file and the specific change)
- "Build the launchpad" (out of scope for this skill — that's a separate directive)
- Anything you already did (check improvement-log.jsonl)
- Changes to `harness/`, `scripts/`, `package.json`, or any genesis-locked file

**Acceptable targets**:
- `skills/*/SKILL.md` — edit skill instructions
- `memory/x-strategy.md` — adjust content weights or signal sources
- `memory/lp-strategy.md` — adjust LP parameters
- `wiki/**` — add or update knowledge base entries

## Step 3 — Implement it

Read the target file first. Make the minimum change that achieves the improvement. Write it. Do not over-engineer.

If editing a SKILL.md: make the change surgical — one paragraph, one step, one threshold. Do not rewrite the whole skill.

If adjusting weights in x-strategy.md: change only the weights that the engagement data clearly supports. Explain the data rationale inline (e.g., update the `note` column).

## Step 4 — Log it

Append one line to `memory/improvement-log.jsonl`:
```json
{"date":"YYYY-MM-DD","skill":"self-improve","improvement":"<one sentence>","rationale":"<data that supported the change>","file":"<file edited>","expectedImpact":"<what metric should improve and by how much>"}
```

## Step 5 — Commit

```bash
git add <changed files> memory/improvement-log.jsonl
git commit -m "self-improve: <one-line description>

Rationale: <what data led to this change>
Expected impact: <metric>"
```

Then run `./notify` with:
```
self-improve: implemented <improvement>. rationale: <data>. next run: <date or trigger>.
```
