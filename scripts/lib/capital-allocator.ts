// Capital Allocator — Mode-Gated Allocation Rules

import { AutonomopolyState } from './autonomopoly-reader';
import { WstDiemState } from './wstdiem-staking';
import { SpreadSignal } from './inference-arb-engine';

export interface AllocationPlan {
  buyOrders: BuyOrder[];
  sellListings: SellListing[];
  compound: CompoundRule;
  circuitBreaker: boolean;
}

export interface BuyOrder {
  model: string;
  size_diem: bigint;
  limit_price: number;       // per 1M tokens
  provider: string;
  client_order_id: string;
}

export interface SellListing {
  model: string;
  size_diem: bigint;
  base_price: number;        // per 1M tokens
  discount_bps: number;      // undercut reference
  provider_id: string;       // our provider ID
  daily_tokens: number;
}

export interface CompoundRule {
  lp_pct: number;        // % to ETH/DIEM LP
  restake_pct: number;   // % to wstDIEM restake
  treasury_pct: number;  // % to agent treasury
}

const DEFAULT_COMPOUND: CompoundRule = { lp_pct: 60, restake_pct: 30, treasury_pct: 10 };
const BUILD_COMPOUND: CompoundRule = { lp_pct: 70, restake_pct: 20, treasury_pct: 10 };
const MIN_SELF_FUNDING_RATIO = 0.8;
const BUILD_THRESHOLD = 2.0;
const DEMOTE_THRESHOLD = 1.0;

export function determineMode(ratio: number, currentMode: 'accumulate' | 'build'): 'accumulate' | 'transition' | 'build' {
  if (ratio < MIN_SELF_FUNDING_RATIO) return 'accumulate';
  if (ratio >= BUILD_THRESHOLD && currentMode !== 'build') return 'build';
  if (ratio < DEMOTE_THRESHOLD && currentMode === 'build') return 'accumulate';
  return 'transition';
}

export function allocateCapital(
  autonomopoly: AutonomopolyState,
  wstDiem: WstDiemState,
  signals: SpreadSignal[],
  deployedCapital: bigint,
  dailyFeesDiem: bigint
): AllocationPlan {
  const ratio = autonomopoly.selfFundingRatio;
  const mode = determineMode(ratio, autonomopoly.mode);
  const circuitBreaker = ratio < MIN_SELF_FUNDING_RATIO || wstDiem.depegBps > 200;

  const plan: AllocationPlan = {
    buyOrders: [],
    sellListings: [],
    compound: mode === 'build' ? BUILD_COMPOUND : DEFAULT_COMPOUND,
    circuitBreaker,
  };

  if (circuitBreaker) {
    return plan; // No trading, only liquidation handled elsewhere
  }

  // Available capital for this tick
  const dailyFees = dailyFeesDiem > 0n ? dailyFeesDiem : autonomopoly.dailyFeeRate;
  const availableForBuy = dailyFees * 80n / 100n; // 80% of daily fees for buys
  const availableForSell = wstDiem.availableCredits; // excess Venice credits

  let buyBudget = availableForBuy;
  let sellBudget = availableForSell;

  for (const sig of signals) {
    if (sig.recommended_action === 'buy' && (mode === 'accumulate' || mode === 'transition') && buyBudget > 0n) {
      const size = sig.size_diem < buyBudget ? sig.size_diem : buyBudget;
      if (size > 0n) {
        // Limit price at mid - half spread (aggressive but not crossing)
        const limitPrice = sig.mid_price * (1 - sig.spread_bps / 20000);
        plan.buyOrders.push({
          model: sig.model,
          size_diem: size,
          limit_price: limitPrice,
          provider: sig.provider_ask, // buy from ask side
          client_order_id: `vhermes-${Date.now()}-${sig.model}-buy`,
        });
        buyBudget -= size;
      }
    }

    if (sig.recommended_action === 'sell' && (mode === 'build' || mode === 'transition') && sellBudget > 0n) {
      // Convert credits to DIEM equivalent for sizing
      const creditsPerDiem = 1000000000000000000n; // 1e18 credits per DIEM per day (Venice standard)
      const sizeDiem = sellBudget * creditsPerDiem / 1000000000000000000n; // simplified
      const size = sig.size_diem < sizeDiem ? sig.size_diem : sizeDiem;
      if (size > 0n) {
        // Price at reference - 10% (undercut centralized providers)
        const basePrice = sig.mid_price * 0.9;
        plan.sellListings.push({
          model: sig.model,
          size_diem: size,
          base_price: basePrice,
          discount_bps: 1000, // 10% discount
          provider_id: 'vhermes-asksurplus-arb',
          daily_tokens: Number(size) * 1000000, // approximate
        });
        sellBudget -= size;
      }
    }
  }

  return plan;
}

export function calculateCompoundAmounts(
  profitDiem: bigint,
  rule: CompoundRule
): { lp: bigint; restake: bigint; treasury: bigint } {
  return {
    lp: profitDiem * BigInt(rule.lp_pct) / 100n,
    restake: profitDiem * BigInt(rule.restake_pct) / 100n,
    treasury: profitDiem * BigInt(rule.treasury_pct) / 100n,
  };
}