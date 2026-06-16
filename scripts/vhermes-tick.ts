#!/usr/bin/env node
// VHermes Main Tick Loop — Runs every 30 minutes
import { syncAutonomopolyState } from './lib/autonomopoly-reader';
import { syncWstDiemState } from './lib/wstdiem-staking';
import { analyzeSpread, checkRiskLimits, getModeFromRatio, SpreadSignal } from './lib/inference-arb-engine';
import { allocateCapital, calculateCompounds, AllocationPlan } from './lib/capital-allocator';
// import { AskSurplusClient } from './lib/asksurplus-client';
// import { queueIntents } from './execute-intents';
// import { trackPnL, commitMemory } from './lib/memory';

const CONFIG = {
  MAX_DEPLOYED: 500n * 100n, // 500 DIEM equivalent
  MAX_MODEL_BPS: 2500, // 25%
  MAX_PROVIDER_BPS: 1500, // 15%
  MAX_DAILY_DD_BPS: 500, // 5%
  MAX_WSTDIEM_DEPEG_BPS: 200, // 2%
  MODELS: [
    'DeepSeek-V3',
    'Qwen-2.5-Coder',
    'Claude-Opus-4',
    'Venice-Qwen-Image-2-Pro',
    'Llama-3.3-70B',
  ],
} as const;

async function tick() {
  console.log('[VHERMES] Tick started', new Date().toISOString());

  try {
    // 1. STATE SYNC
    const [autonomopoly, wstDiem] = await Promise.all([
      syncAutonomopolyState(),
      syncWstDiemState(),
    ]);

    console.log('[VHERMES] State:', {
      mode: autonomopoly.mode,
      ratio: autonomopoly.selfFundingRatio,
      diemBalance: autonomopoly.diemBalance.toString(),
      stakedDiem: autonomopoly.stakedDiem.toString(),
      wstDiemCredits: wstDiem.availableCredits.toString(),
      wstDiemDepeg: (wstDiem.depegFromDiem * 100).toFixed(2) + '%',
    });

    // 2. FETCH ORDER BOOKS (mock for now)
    // const orderBooks = await asksurplusClient.getAllOrderBooks();
    const orderBooks = getMockOrderBooks();

    // 3. ANALYZE SPREADS
    const mode = getModeFromRatio(autonomopoly.selfFundingRatio);
    const allSignals = [];
    for (const book of orderBooks) {
      const refPrice = getMockSpotPrice(book.model);
      const signals = analyzeSpread(
        book,
        refPrice,
        mode,
        0n, // deployedCapital - TODO: track from memory
        CONFIG.MAX_DEPLOYED,
        {} // currentExposure - TODO: track from memory
      );
      allSignals.push(...signals);
    }

    console.log('[VHERMES] Signals:', allSignals.map(s => ({
      model: s.model,
      action: s.recommended_action,
      spread: s.spread_bps,
      size: s.size_diem.toString(),
      conf: s.confidence.toFixed(2),
    })));

    // 4. RISK CHECK
    const approved = checkRiskLimits(allSignals, {
      currentExposure: {},
      providerExposure: {},
      deployedCapital: 0n,
      maxDeployed: CONFIG.MAX_DEPLOYED,
      dailyPnL: 0n,
      wstDiemDepeg: wstDiem.depegFromDiem,
    }, {
      maxModelBps: CONFIG.MAX_MODEL_BPS,
      maxProviderBps: CONFIG.MAX_PROVIDER_BPS,
      maxDailyDrawdownBps: CONFIG.MAX_DAILY_DD_BPS,
      maxWstDiemDepegBps: CONFIG.MAX_WSTDIEM_DEPEG_BPS,
    });

    console.log('[VHERMES] Approved:', approved.length);

    // 5. ALLOCATE
    const plan = allocateCapital(autonomopoly, wstDiem, approved, 0n, CONFIG.MAX_DEPLOYED);

    console.log('[VHERMES] Plan:', {
      buys: plan.buyOrders.length,
      sells: plan.sellListings.length,
      compound: plan.compound,
    });

    // 6. EXECUTE (queue intents)
    // await queueIntents(plan);

    // 7. TRACK & REPORT
    // await trackPnL(plan);
    // await commitMemory();

    console.log('[VHERMES] Tick complete');
  } catch (error) {
    console.error('[VHERMES] Tick failed:', error);
    process.exit(1);
  }
}

function getMockOrderBooks() {
  return [
    {
      model: 'DeepSeek-V3',
      bids: [{ price: 0.90, size: 100, provider: 'A' }],
      asks: [{ price: 1.05, size: 100, provider: 'B' }],
      timestamp: Date.now(),
    },
    {
      model: 'Qwen-2.5-Coder',
      bids: [{ price: 0.88, size: 50, provider: 'C' }],
      asks: [{ price: 1.00, size: 50, provider: 'D' }],
      timestamp: Date.now(),
    },
    {
      model: 'Claude-Opus-4',
      bids: [{ price: 2.40, size: 20, provider: 'A' }],
      asks: [{ price: 2.70, size: 20, provider: 'B' }],
      timestamp: Date.now(),
    },
  ];
}

function getMockSpotPrice(model: string) {
  const prices: Record<string, { mid: number; ref: number }> = {
    'DeepSeek-V3': { mid: 0.975, ref: 1.05 },
    'Qwen-2.5-Coder': { mid: 0.94, ref: 1.00 },
    'Claude-Opus-4': { mid: 2.55, ref: 2.70 },
    'Venice-Qwen-Image-2-Pro': { mid: 1.80, ref: 1.90 },
    'Llama-3.3-70B': { mid: 0.45, ref: 0.50 },
  };
  const p = prices[model] || { mid: 1.0, ref: 1.0 };
  return {
    model,
    mid: p.mid,
    spread_bps: ((p.ref - p.mid) / p.mid) * 10000,
    reference_price: p.ref,
    timestamp: Date.now(),
  };
}

tick().catch(console.error);