// Capital Allocator — Mode-Gated Allocation Rules
import { AutonomopolyState } from './autonomopoly-reader';
import { WstDiemState } from './wstdiem-staking';
import { SpreadSignal } from './inference-arb-engine';

export interface AllocationPlan {
  buyOrders: BuyOrder[];
  sellListings: SellListing[];
  compound: CompoundRule;
  riskMetrics: RiskMetrics;
}

export interface BuyOrder {
  model: string;
  size_diem: bigint;
  limit_price: number;
  provider: string;
}

export interface SellListing {
  model: string;
  size_diem: bigint;
  pricing: { base: number; discount_bps: number };
  daily_credits: number;
}

export interface CompoundRule {
  lp_pct: number;
  restake_pct: number;
  treasury_pct: number;
}

export interface RiskMetrics {
  total_deployed: bigint;
  model_exposure: Record<string, bigint>;
  provider_exposure: Record<string, bigint>;
  estimated_daily_yield: bigint;
}
export function allocateCapital(
  autonomopoly: AutonomopolyState,
  wstDiem: WstDiemState,
  signals: SpreadSignal[],
  deployedCapital: bigint,
  maxDeployed: bigint = 500n * 100n
): AllocationPlan {
  const ratio = autonomopoly.selfFundingRatio;
  const mode = getModeFromRatio(ratio);

  const plan: AllocationPlan = {
    buyOrders: [],
    sellListings: [],
    compound: { lp_pct: 60, restake_pct: 30, treasury_pct: 10 },
    riskMetrics: {
      total_deployed: deployedCapital,
      model_exposure: {},
      provider_exposure: {},
      estimated_daily_yield: 0n,
    },
  };

  if (mode === 'build') {
    plan.compound = { lp_pct: 70, restake_pct: 20, treasury_pct: 10 };
  } else if (mode === 'transition') {
    plan.compound = { lp_pct: 65, restake_pct: 25, treasury_pct: 10 };
  }

  for (const sig of signals) {
    if (sig.recommended_action === 'buy' && (mode === 'accumulate' || mode === 'transition')) {
      plan.buyOrders.push({
        model: sig.model,
        size_diem: sig.size_diem,
        limit_price: sig.bid_price,
        provider: sig.best_ask_provider,
      });
      plan.riskMetrics.model_exposure[sig.model] = 
        (plan.riskMetrics.model_exposure[sig.model] || 0n) + sig.size_diem;
      plan.riskMetrics.provider_exposure[sig.best_ask_provider] = 
        (plan.riskMetrics.provider_exposure[sig.best_ask_provider] || 0n) + sig.size_diem;
      plan.riskMetrics.total_deployed += sig.size_diem;
    }

    if (sig.recommended_action === 'sell' && (mode === 'build' || mode === 'transition')) {
      const dailyCredits = Number(wstDiem.dailyCredits);
      const sellCredits = Math.min(dailyCredits, Number(sig.size_diem));
      plan.sellListings.push({
        model: sig.model,
        size_diem: sig.size_diem,
        pricing: { base: sig.ask_price, discount_bps: 1000 },
        daily_credits: sellCredits,
      });
      plan.riskMetrics.estimated_daily_yield += 
        BigInt(Math.floor(sellCredits * sig.ask_price * 100));
    }
  }

  return plan;
}

export function calculateCompounds(
  pnl: bigint,
  rule: CompoundRule
): { lp: bigint; restake: bigint; treasury: bigint } {
  const total = pnl;
  return {
    lp: (total * BigInt(rule.lp_pct)) / 100n,
    restake: (total * BigInt(rule.restake_pct)) / 100n,
    treasury: (total * BigInt(rule.treasury_pct)) / 100n,
  };
}