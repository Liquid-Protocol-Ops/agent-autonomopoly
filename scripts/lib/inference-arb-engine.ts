// Inference Arbitrage Engine — Core Spread Logic

import { OrderBook, SpotPrice } from './asksurplus-client';

export interface SpreadSignal {
  model: string;
  spread_bps: number;
  mid_price: number;
  bid_price: number;
  ask_price: number;
  recommended_action: 'buy' | 'sell' | 'hold';
  size_diem: bigint;
  confidence: number;        // 0-1
  provider_bid: string;
  provider_ask: string;
}

export interface RiskMetrics {
  totalDeployed: bigint;
  modelExposure: Record<string, bigint>;
  providerExposure: Record<string, bigint>;
  dailyPnL: bigint;
  maxDrawdown: number;
}

const MIN_SPREAD_BPS = 800;        // 8% minimum spread
const MAX_DEPLOYED_DIEM = 500n;    // max DIEM deployed
const MAX_MODEL_EXPOSURE_BPS = 2500; // 25%
const MAX_PROVIDER_EXPOSURE_BPS = 1500; // 15%
const MAX_DAILY_DRAWDOWN_BPS = 500;  // 5%

export function analyzeSpread(
  book: OrderBook,
  refPrice: SpotPrice,
  mode: 'accumulate' | 'transition' | 'build',
  capital: bigint,
  risk: RiskMetrics
): SpreadSignal[] {
  const signals: SpreadSignal[] = [];

  if (!book.bids.length || !book.asks.length) return signals;

  const bestBid = book.bids[0]!;
  const bestAsk = book.asks[0]!;
  const spread = bestAsk.price > 0 && bestBid.price > 0
    ? Math.floor(((bestAsk.price - bestBid.price) / bestBid.price) * 10000)
    : 0;

  if (spread < MIN_SPREAD_BPS) return signals;

  const maxSizePerModel = capital * BigInt(MAX_MODEL_EXPOSURE_BPS) / 10000n;
  const availableCapital = MAX_DEPLOYED_DIEM - risk.totalDeployed;
  const size = maxSizePerModel < availableCapital ? maxSizePerModel : availableCapital;

  if (size <= 0n) return signals;

  const modelExposure = risk.modelExposure[book.model] || 0n;
  const providerExposureBid = risk.providerExposure[bestBid.provider] || 0n;
  const providerExposureAsk = risk.providerExposure[bestAsk.provider] || 0n;

  // Check model exposure limit
  if (modelExposure + size > capital * BigInt(MAX_MODEL_EXPOSURE_BPS) / 10000n) {
    return signals;
  }

  // Check provider exposure limits
  if (providerExposureBid + size > capital * BigInt(MAX_PROVIDER_EXPOSURE_BPS) / 10000n &&
      providerExposureAsk + size > capital * BigInt(MAX_PROVIDER_EXPOSURE_BPS) / 10000n) {
    return signals;
  }

  // Drawdown check
  if (risk.dailyPnL < 0 && Math.abs(Number(risk.dailyPnL)) > Number(capital) * MAX_DAILY_DRAWDOWN_BPS / 10000) {
    return signals;
  }

  const confidence = Math.min(spread / 2000, 0.9); // max 90% confidence at 20% spread

  if (mode === 'accumulate' || mode === 'transition') {
    // Buy cheap inference
    signals.push({
      model: book.model,
      spread_bps: spread,
      mid_price: refPrice.mid,
      bid_price: bestBid.price,
      ask_price: bestAsk.price,
      recommended_action: 'buy',
      size_diem: size,
      confidence,
      provider_bid: bestBid.provider,
      provider_ask: bestAsk.provider,
    });
  }

  if (mode === 'build' || mode === 'transition') {
    // Sell excess credits as provider
    signals.push({
      model: book.model,
      spread_bps: spread,
      mid_price: refPrice.mid,
      bid_price: bestBid.price,
      ask_price: bestAsk.price,
      recommended_action: 'sell',
      size_diem: size,
      confidence,
      provider_bid: bestBid.provider,
      provider_ask: bestAsk.provider,
    });
  }

  return signals;
}

export function checkRiskLimits(
  signals: SpreadSignal[],
  risk: RiskMetrics,
  capital: bigint
): SpreadSignal[] {
  return signals.filter(sig => {
    const modelExp = risk.modelExposure[sig.model] || 0n;
    const providerExp = risk.providerExposure[sig.provider_ask] || 0n; // for sell side
    
    if (modelExp + sig.size_diem > capital * BigInt(MAX_MODEL_EXPOSURE_BPS) / 10000n) return false;
    if (providerExp + sig.size_diem > capital * BigInt(MAX_PROVIDER_EXPOSURE_BPS) / 10000n) return false;
    if (risk.totalDeployed + sig.size_diem > MAX_DEPLOYED_DIEM) return false;
    if (risk.dailyPnL < 0 && Math.abs(Number(risk.dailyPnL)) > Number(capital) * MAX_DAILY_DRAWDOWN_BPS / 10000) return false;
    
    return true;
  });
}

export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  sizeTokens: number,
  side: 'buy' | 'sell',
  feeBps: number = 100 // 1% AskSurplus fee
): number {
  const feeMultiplier = 1 - feeBps / 10000;
  
  if (side === 'buy') {
    // Bought at entry, selling at exit
    return (exitPrice - entryPrice) * sizeTokens / 1e6 * feeMultiplier;
  } else {
    // Sold at entry (provider), buying back at exit
    return (entryPrice - exitPrice) * sizeTokens / 1e6 * feeMultiplier;
  }
}