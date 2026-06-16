#!/usr/bin/env node
// VHermes Main Tick Loop — Runs every 30 minutes

import { syncAutonomopolyState, AutonomopolyState } from './lib/autonomopoly-reader';
import { syncWstDiemState, WstDiemState } from './lib/wstdiem-staking';
import { AskSurplusClient, createAskSurplusClient, OrderBook, SpotPrice } from './lib/asksurplus-client';
import { analyzeSpread, checkRiskLimits, SpreadSignal, RiskMetrics } from './lib/inference-arb-engine';
import { allocateCapital, AllocationPlan, BuyOrder, SellListing } from './lib/capital-allocator';
import { execFileSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const MODELS = [
  'DeepSeek-V3',
  'Qwen-2.5-Coder',
  'Claude-Opus-4',
  'Venice-Qwen-Image',
];

interface TickState {
  deployedCapital: bigint;
  modelExposure: Record<string, bigint>;
  providerExposure: Record<string, bigint>;
  dailyPnL: bigint;
  maxDrawdown: number;
  lastPnLReset: number;
}

const STATE_FILE = 'memory/vhermes-state.json';

function loadState(): TickState {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      return {
        deployedCapital: BigInt(data.deployedCapital || '0'),
        modelExposure: Object.fromEntries(
          Object.entries(data.modelExposure || {}).map(([k, v]) => [k, BigInt(v as string)])
        ),
        providerExposure: Object.fromEntries(
          Object.entries(data.providerExposure || {}).map(([k, v]) => [k, BigInt(v as string)])
        ),
        dailyPnL: BigInt(data.dailyPnL || '0'),
        maxDrawdown: data.maxDrawdown || 0,
        lastPnLReset: data.lastPnLReset || Date.now(),
      };
    }
  } catch (e) {
    console.warn('[VHERMES] Failed to load state:', e);
  }
  return {
    deployedCapital: 0n,
    modelExposure: {},
    providerExposure: {},
    dailyPnL: 0n,
    maxDrawdown: 0,
    lastPnLReset: Date.now(),
  };
}

function saveState(state: TickState): void {
  mkdirSync('memory', { recursive: true });
  const data = {
    deployedCapital: state.deployedCapital.toString(),
    modelExposure: Object.fromEntries(
      Object.entries(state.modelExposure).map(([k, v]) => [k, v.toString()])
    ),
    providerExposure: Object.fromEntries(
      Object.entries(state.providerExposure).map(([k, v]) => [k, v.toString()])
    ),
    dailyPnL: state.dailyPnL.toString(),
    maxDrawdown: state.maxDrawdown,
    lastPnLReset: state.lastPnLReset,
  };
  writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
}

function queueIntent(intent: any): void {
  mkdirSync('memory', { recursive: true });
  const line = JSON.stringify({ ...intent, queuedAt: new Date().toISOString() });
  appendFileSync('memory/pending-actions.jsonl', line + '\n');
  console.log(`[VHERMES] Queued intent: ${intent.type}`);
}

async function tick() {
  const startTime = Date.now();
  console.log('[VHERMES] Tick started', new Date().toISOString());

  const tickState = loadState();

  try {
    // 1. STATE SYNC
    const [autonomopoly, wstDiem] = await Promise.all([
      syncAutonomopolyState(),
      syncWstDiemState(),
    ]);

    console.log('[VHERMES] State:', {
      mode: autonomopoly.mode,
      ratio: autonomopoly.selfFundingRatio,
      dailyFees: autonomopoly.dailyFeeRate.toString(),
      deployed: tickState.deployedCapital.toString(),
      wstDiemCredits: wstDiem.availableCredits.toString(),
      depegBps: wstDiem.depegBps,
    });

    // Reset daily PnL if new day
    if (Date.now() - tickState.lastPnLReset > 86400000) {
      tickState.dailyPnL = 0n;
      tickState.lastPnLReset = Date.now();
    }

    // 2. ASKSURPLUS MARKET DATA
    const asksurplus = createAskSurplusClient();
    const health = await asksurplus.healthCheck();
    
    if (!health.healthy || health.latency_ms > 2000) {
      console.log('[VHERMES] AskSurplus unhealthy, skipping tick');
      saveState(tickState);
      return;
    }

    const spotPrices = await asksurplus.getAllSpotPrices();
    const orderBooks = await Promise.all(
      MODELS.map(m => asksurplus.getOrderBook(m).catch(() => null))
    );

    // 3. ANALYZE SPREADS
    const risk: RiskMetrics = {
      totalDeployed: tickState.deployedCapital,
      modelExposure: tickState.modelExposure,
      providerExposure: tickState.providerExposure,
      dailyPnL: tickState.dailyPnL,
      maxDrawdown: tickState.maxDrawdown,
    };

    let allSignals: SpreadSignal[] = [];
    for (let i = 0; i < MODELS.length; i++) {
      const book = orderBooks[i];
      const price = spotPrices.find(p => p.model === MODELS[i]);
      if (!book || !price) continue;

      const mode = autonomopoly.mode === 'build' ? 'build' : 
        autonomopoly.selfFundingRatio >= 1.0 ? 'transition' : 'accumulate';
        
      const signals = analyzeSpread(book, price, mode, tickState.deployedCapital, risk);
      allSignals.push(...signals);
    }

    console.log('[VHERMES] Signals:', allSignals.map(s => `${s.model} ${s.recommended_action} ${s.spread_bps}bps ${s.size_diem.toString()}DIEM`));

    // 4. RISK CHECK
    const approved = checkRiskLimits(allSignals, risk, tickState.deployedCapital);
    console.log('[VHERMES] Approved:', approved.length);

    // 5. ALLOCATE CAPITAL
    const plan = allocateCapital(
      autonomopoly,
      wstDiem,
      approved,
      tickState.deployedCapital,
      autonomopoly.totalFeesClaimable
    );

    if (plan.circuitBreaker) {
      console.log('[VHERMES] CIRCUIT BREAKER ACTIVE - pausing trading');
      // Queue liquidation intents
      for (const [model, exposure] of Object.entries(tickState.modelExposure)) {
        if (exposure > 0n) {
          queueIntent({
            type: 'asksurplus_liquidate',
            params: { model, size_diem: exposure.toString() },
            priority: 100,
            expiresAt: Date.now() + 3600000,
          });
        }
      }
      saveState(tickState);
      return;
    }

    console.log('[VHERMES] Plan:', {
      buys: plan.buyOrders.length,
      sells: plan.sellListings.length,
      compound: plan.compound,
    });

    // 6. EXECUTE - Queue intents
    for (const buy of plan.buyOrders) {
      queueIntent({
        type: 'asksurplus_buy',
        params: {
          model: buy.model,
          size_diem: buy.size_diem.toString(),
          limit_price: buy.limit_price,
          provider: buy.provider,
          client_order_id: buy.client_order_id,
        },
        priority: 10,
        expiresAt: Date.now() + 3600000,
      });
    }

    for (const sell of plan.sellListings) {
      queueIntent({
        type: 'asksurplus_sell',
        params: {
          model: sell.model,
          size_diem: sell.size_diem.toString(),
          base_price: sell.base_price,
          discount_bps: sell.discount_bps,
          daily_tokens: sell.daily_tokens,
        },
        priority: 10,
        expiresAt: Date.now() + 86400000,
      });
    }

    // 7. COMPOUND PROFITS - would be triggered by fill events
    // TODO: Implement fill tracking and compounding

    // 8. UPDATE STATE & SAVE
    saveState(tickState);

    const duration = Date.now() - startTime;
    console.log('[VHERMES] Tick complete', `${duration}ms`);

  } catch (error) {
    console.error('[VHERMES] Tick error:', error);
    saveState(tickState);
  }
}

// Run tick
tick().catch(console.error);