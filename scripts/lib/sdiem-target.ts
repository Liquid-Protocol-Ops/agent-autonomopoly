/**
 * scripts/lib/sdiem-target.ts
 *
 * Shared resolution of the agent's sDIEM stake target (Venice inference
 * credits; 1 sDIEM ≈ $1/day budget). Policy (operator decision 2026-06-10):
 * 1.5× the trailing 7-day average daily inference cost, clamped to [1, 50].
 *
 * Resolution order: SDIEM_TARGET env → 1.5× cost from memory/inference-cost.md
 * → goals.json sdiemTarget → 5.
 */

import { readFileSync } from 'node:fs';

export type Goals = {
  mode?: string;
  modeOverride?: string;
  sdiemTarget?: number;
  agentWallet?: string;
  modeThresholds?: { buildModeOnSelfFundingRatio?: number; accumulateModeBelowRatio?: number };
};

export function readGoals(): Goals {
  try {
    return JSON.parse(readFileSync('memory/goals.json', 'utf8')) as Goals;
  } catch {
    return {};
  }
}

/** Trailing 7d average daily inference cost (USD) from memory/inference-cost.md, or null. */
export function readDailyInferenceCostUsd(): number | null {
  try {
    const md = readFileSync('memory/inference-cost.md', 'utf8');
    const m = md.match(/Daily avg \(7d\)[^$]*\$([0-9]+(?:\.[0-9]+)?)/);
    if (m?.[1]) {
      const v = Number(m[1]);
      if (Number.isFinite(v) && v > 0) return v;
    }
  } catch { /* file absent — fall through */ }
  return null;
}

export function resolveSdiemTarget(): number {
  const env = process.env['SDIEM_TARGET'];
  if (env) {
    const v = Number(env);
    if (Number.isFinite(v) && v >= 0) return v;
  }
  const daily = readDailyInferenceCostUsd();
  if (daily !== null) return Math.min(50, Math.max(1, daily * 1.5));
  const { sdiemTarget } = readGoals();
  if (typeof sdiemTarget === 'number' && Number.isFinite(sdiemTarget) && sdiemTarget >= 0) {
    return sdiemTarget;
  }
  return 5;
}
