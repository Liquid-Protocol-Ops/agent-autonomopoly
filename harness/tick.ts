// Main tick loop — one execution per Modal invocation (v0).
//
// Flow per tick:
//   1. Check claimable DIEM → claim + stake if ≥ threshold
//   2. Verify staked balance ≥ threshold (gate for Venice access)
//   3. Load or mint Venice bearer key
//   4. Execute the active task via Venice inference
//
// Run locally:  npm run harness:tick

import {
  loadConfig as loadVeniceConfig,
  makePublicClient,
  getClaimable,
  getStakedBalance,
  claimDiem,
  stakeDiem,
  loadOrMintBearer,
  callInference,
} from './providers/venice.js';
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

// ── Tick ─────────────────────────────────────────────────────────────

const LOG_PATH = process.env['TOOL_ROUTING_LOG'] ?? 'memory/tool-routing.jsonl';

export async function runTick(deps: TickDeps): Promise<void> {
  const { signer, txSender } = deps;
  const agentAddress = signer.address;
  const config = loadVeniceConfig();
  const publicClient = makePublicClient(config.rpcUrl);

  // 1. Claim + stake whenever there's enough claimable DIEM.
  const claimable = await getClaimable(config, agentAddress, publicClient);
  if (claimable >= config.stakeThreshold) {
    const claimHash = await claimDiem(config, agentAddress, txSender);
    await publicClient.waitForTransactionReceipt({ hash: claimHash });
    await stakeDiem(config, claimable, txSender, publicClient);
  }

  // 2. Staked balance gates Venice access.
  const staked = await getStakedBalance(config, agentAddress, publicClient);
  if (staked < config.stakeThreshold) {
    console.log(`[tick] staked=${staked} below threshold=${config.stakeThreshold} — skipping inference`);
    return;
  }

  // 3. Ensure Venice bearer (cached after first mint).
  const bearer = await loadOrMintBearer(config, signer);

  // 4. Execute active task — placeholder until session 9 wires memory/wiki.
  const reply = await callInference(
    config,
    bearer,
    { prompt: 'Respond with exactly one word: tick', maxTokens: 10 },
    LOG_PATH,
  );
  console.log(`[tick] ${reply}`);
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
