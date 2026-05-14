// Main tick loop — one execution per Modal invocation (v0).
//
// Inference routing:
//   fast   → llama-3.3-70b (free under VVV staking) — planning, classification, cheap calls
//   reason → claude-opus-4-7 (6/30 DIEM per 1M in/out) — reasoning, only when warranted
//
// Flow per tick:
//   1. Claim LP DIEM fees if ≥ threshold
//   2. Verify sVVV balance gates Venice key access
//   3. Load or mint Venice bearer
//   4. Fast call: classify the tick task and decide if deep reasoning is needed
//   5. Reason call (conditional): do the substantive work with Opus 4.7
//
// Run locally:  npm run harness:tick

import {
  loadConfig as loadVeniceConfig,
  makePublicClient,
  getClaimable,
  getStakedBalance,
  claimDiem,
  loadOrMintBearer,
  callInference,
  FAST_MODEL,
  REASONING_MODEL,
} from './providers/venice.js';
import { reinvestToLP } from './providers/liquidity.js';
import {
  loadPrivyConfig,
  loadSignerFromPrivy,
  makeTxSenderFromPrivy,
  loadSignerFromEnv,
  makeTxSenderFromEnv,
  type Signer,
  type TxSender,
} from './safety/wallet.js';

// ── Types ────────────────────────────────────────────────────────────

export type TickDeps = {
  signer: Signer;
  txSender: TxSender;
};

// ── Mode ─────────────────────────────────────────────────────────────

// accumulate: LP claimed DIEM into ETH/DIEM v3 pool; run on free llama only.
// build:      stake yield for Venice Opus credits; run product-building ticks.
// Controlled by AGENT_MODE env var until on-chain daily-rate determination is wired.
const AGENT_MODE = (process.env['AGENT_MODE'] ?? 'accumulate') as 'accumulate' | 'build';

// ── Bootstrap ────────────────────────────────────────────────────────

export async function loadTickDeps(): Promise<TickDeps> {
  if (process.env['PRIVY_APP_ID']) {
    const cfg = loadPrivyConfig();
    const signer = await loadSignerFromPrivy(cfg);
    const txSender = makeTxSenderFromPrivy(cfg);
    return { signer, txSender };
  }
  const signer = loadSignerFromEnv();
  const { rpcUrl } = loadVeniceConfig();
  const txSender = makeTxSenderFromEnv(rpcUrl);
  return { signer, txSender };
}

// ── Model routing helpers ────────────────────────────────────────────

const LOG_PATH = process.env['TOOL_ROUTING_LOG'] ?? 'memory/tool-routing.jsonl';

type InferCtx = { config: ReturnType<typeof loadVeniceConfig>; bearer: string };

async function callFast(ctx: InferCtx, prompt: string, opts: { maxTokens?: number; systemPrompt?: string } = {}): Promise<string> {
  return callInference(ctx.config, ctx.bearer, { ...opts, model: FAST_MODEL, prompt }, LOG_PATH);
}

async function callReason(ctx: InferCtx, prompt: string, opts: { maxTokens?: number; systemPrompt?: string } = {}): Promise<string> {
  return callInference(ctx.config, ctx.bearer, { ...opts, model: REASONING_MODEL, prompt }, LOG_PATH);
}

// ── Tick ─────────────────────────────────────────────────────────────

// Fast model returns a JSON decision: { needs_reasoning: bool, task: string, rationale: string }
const PLAN_SYSTEM = `You are the AUTONOMOPOLY agent's planning layer.
Given the current tick context, decide whether this tick requires deep reasoning (claude-opus-4-7) or a simple fast response (llama).
Respond with valid JSON only:
{ "needs_reasoning": <bool>, "task": "<one-line task description>", "rationale": "<why>" }`;

const REASON_SYSTEM = `You are AUTONOMOPOLY, a self-funding autonomous agent on Base.
You earn LP DIEM fees, stake them for Venice inference credits, and grow your capabilities over time.
Complete the assigned task thoughtfully. Be concrete and brief.`;

export async function runTick(deps: TickDeps): Promise<void> {
  const { signer, txSender } = deps;
  const agentAddress = signer.address;
  const config = loadVeniceConfig();
  const publicClient = makePublicClient(config.rpcUrl);

  console.log(`[tick] mode=${AGENT_MODE}`);

  // 1. Claim LP DIEM fees from FeeLocker whenever above threshold.
  const claimable = await getClaimable(config, agentAddress, publicClient);
  if (claimable >= config.stakeThreshold) {
    const claimHash = await claimDiem(config, agentAddress, txSender);
    await publicClient.waitForTransactionReceipt({ hash: claimHash });
    console.log(`[tick] claimed ${claimable} DIEM`);

    // 1a. Accumulate mode: reinvest claimed DIEM into ETH/DIEM v3 1% pool.
    //     Single-sided DIEM, range below current tick — earns fees as DIEM appreciates.
    if (AGENT_MODE === 'accumulate') {
      const lp = await reinvestToLP(config.rpcUrl, agentAddress, claimable, 'short', txSender);
      await publicClient.waitForTransactionReceipt({ hash: lp.mintTxHash });
      console.log(`[tick] LP reinvested | ticks=[${lp.tickLower},${lp.tickUpper}] currentTick=${lp.currentTick}`);
      return;  // accumulate mode does not proceed to inference
    }
  }

  // 2. sVVV balance gates Venice API key access.
  const staked = await getStakedBalance(config, agentAddress, publicClient);
  if (staked < config.stakeThreshold) {
    console.log(`[tick] sVVV=${staked} below threshold=${config.stakeThreshold} — skipping inference`);
    return;
  }

  // 3. Load bearer (cached after first mint).
  const bearer = await loadOrMintBearer(config, signer);
  const ctx: InferCtx = { config, bearer };

  // 4. Fast call: plan the tick — decide if Opus 4.7 is needed.
  const tickContext = `Current tick. Agent wallet: ${agentAddress}. claimable DIEM: ${claimable}. sVVV staked: ${staked}.`;
  const planRaw = await callFast(ctx, tickContext, { systemPrompt: PLAN_SYSTEM, maxTokens: 128 });
  console.log(`[tick] fast plan: ${planRaw.trim()}`);

  let plan: { needs_reasoning: boolean; task: string; rationale: string };
  try {
    plan = JSON.parse(planRaw) as typeof plan;
  } catch {
    // If fast model didn't return valid JSON, skip reasoning and log the raw reply.
    console.log('[tick] plan parse failed — skipping reason step');
    return;
  }

  // 5. Reason call (conditional): Opus 4.7 only when the fast model says it's warranted.
  if (plan.needs_reasoning) {
    console.log(`[tick] routing to ${REASONING_MODEL}: ${plan.task}`);
    const result = await callReason(ctx, plan.task, { systemPrompt: REASON_SYSTEM, maxTokens: 512 });
    console.log(`[tick] reason: ${result.trim()}`);
  } else {
    console.log(`[tick] fast path sufficient: ${plan.task}`);
  }
}

// ── Entry point ──────────────────────────────────────────────────────

if (process.argv[1] === new URL(import.meta.url).pathname) {
  loadTickDeps()
    .then(runTick)
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error('[tick] fatal:', err);
      process.exit(1);
    });
}
