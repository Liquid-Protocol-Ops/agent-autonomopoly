// Inference Arbitrage Engine — Core Spread Logic
import { OrderBook, SpotPrice, Model } from './asksurplus-client';

export interface SpreadSignal {
  model: Model;
  spread_bps: number;
  mid_price: number;
  reference_price: number;
  recommended_action: 'buy' | 'sell' | 'hold';
  size_diem: bigint;
  confidence: number;
  bid_price: number;
  ask_price: number;
  best_bid_provider: string;
  best_ask_provider: string;
}

export interface RiskCheck {
  passed: boolean;
  model_exposure_bps: number;
  provider_exposure_bps: number;
  deployed_pct: number;
  daily_pnl_pct: number;
  wstdiem_depeg_pct: number;
  reason?: string;
}

export function analyzeSpread(
  book: OrderBook,
  refPrice: SpotPrice,
  mode: 'accumulate' | 'transition' | 'build',
  deployedCapital: bigint,
  maxDeployed: bigint,
  currentExposure: Record<string, bigint>
): SpreadSignal[] {
  const signals: SpreadSignal[] = [];
  
  if (book.bids.length === 0 || book.asks.length === 0) return signals;

  const bestBid = book.bids[0];
  const bestAsk = book.asks[0];
  const spread = ((bestAsk.price - bestBid.price) / bestBid.price) * 10000;

  const MIN_SPREAD_BPS = 800; // 8%
  if (spread < MIN_SPREAD_BPS) return signals;

  const maxModelSize = maxDeployed / 4n; // 25% per model

  if (mode === 'accumulate' || mode === 'transition') {
    // Buy cheap inference: place bid below mid, near best bid
    const buyPrice = bestBid.price * 1.001; // 1 tick above best bid
    signals.push({
      model: book.model as Model,
      spread_bps: spread,
      mid_price: refPrice.mid,
      reference_price: refPrice.reference_price,
      recommended_action: 'buy',
      size_diem: maxModelSize > deployedCapital ? deployedCapital : maxModelSize,
      confidence: Math.min(spread / 2000, 0.9),
      bid_price: buyPrice,
      ask_price: bestAsk.price,
      best_bid_provider: bestBid.provider,
      best_ask_provider: bestAsk.provider,
    });
  }

  if (mode === 'build' || mode === 'transition') {
    // Sell excess credits: place ask above mid, near best ask
    const sellPrice = bestAsk.price * 0.999; // 1 tick below best ask
    signals.push({
      model: book.model as Model,
      spread_bps: spread,
      mid_price: refPrice.mid,
      reference_price: refPrice.reference_price,
      recommended_action: 'sell',
      size_diem: maxModelSize,
      confidence: Math.min(spread / 2000, 0.9),
      bid_price: bestBid.price,
      ask_price: sellPrice,
      best_bid_provider: bestBid.provider,
      best_ask_provider: bestAsk.provider,
    });
  }

  return signals;
}

export function checkRiskLimits(
  signals: SpreadSignal[],
  state: {
    currentExposure: Record<string, bigint>;
    providerExposure: Record<string, bigint>;
    deployedCapital: bigint;
    maxDeployed: bigint;
    dailyPnL: bigint;
    wstDiemDepeg: number;
  },
  limits: {
    maxModelBps: number;
    maxProviderBps: number;
    maxDailyDrawdownBps: number;
    maxWstDiemDepegBps: number;
  }
): SpreadSignal[] {
  const approved: SpreadSignal[] = [];

  for (const sig of signals) {
    const modelExp = state.currentExposure[sig.model] || 0n;
    const newModelExp = modelExp + sig.size_diem;
    const modelExpBps = Number((newModelExp * 10000n) / state.maxDeployed);

    if (modelExpBps > limits.maxModelBps) {
      console.log(`[risk] Model ${sig.model} exposure ${modelExpBps}bps exceeds ${limits.maxModelBps}bps`);
      continue;
    }

    const provider = sig.recommended_action === 'buy' ? sig.best_ask_provider : sig.best_bid_provider;
    const providerExp = state.providerExposure[provider] || 0n;
    const newProviderExp = providerExp + sig.size_diem;
    const providerExpBps = Number((newProviderExp * 10000n) / state.maxDeployed);

    if (providerExpBps > limits.maxProviderBps) {
      console.log(`[risk] Provider ${provider} exposure ${providerExpBps}bps exceeds ${limits.maxProviderBps}bps`);
      continue;
    }

    const deployedPct = Number((state.deployedCapital * 10000n) / state.maxDeployed);
    if (deployedPct > 10000) continue; // 100%

    if (state.dailyPnL < 0) {
      const ddBps = Number((-state.dailyPnL * 10000n) / state.deployedCapital);
      if (ddBps > limits.maxDailyDrawdownBps) {
        console.log(`[risk] Daily drawdown ${ddBps}bps exceeds ${limits.maxDailyDrawdownBps}bps`);
        continue;
      }
    }

    if (state.wstDiemDepeg * 10000 > limits.maxWstDiemDepegBps) {
      console.log(`[risk] wstDIEM depeg ${state.wstDiemDepeg * 100}bps exceeds limit`);
      continue;
    }

    approved.push(sig);
  }

  return approved;
}

export function getModeFromRatio(ratio: number): 'accumulate' | 'transition' | 'build' {
  if (ratio < 1.0) return 'accumulate';
  if (ratio < 2.0) return 'transition';
  return 'build';
}