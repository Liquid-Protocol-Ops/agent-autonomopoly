// Deploy a StakesaleVault for a Liquid Protocol agent token launch.
//
// DIEM holders lock DIEM for 30/60/90 days during the deposit window.
// Token allocation is time-weighted: 30d=1×, 60d=2×, 90d=3×.
// Per-address cap: 10 DIEM. Dust swept to Liquid Protocol treasury after LOCK_90.
//
// Usage:
//   node --env-file=.env --import tsx scripts/deploy-stakesale.ts           # dry-run
//   node --env-file=.env --import tsx scripts/deploy-stakesale.ts --live    # deploy
//   node --env-file=.env --import tsx scripts/deploy-stakesale.ts \
//     [--deposit-window-hours 24]   # default: 24h (min 2h, max 720h / 30d)
//     [--dry-run]
//
// After deploy, pass the vault address to the token launch command:
//   --presale-vault <vaultAddress> --extension-bps <extensionBps>
//
// Recompile bytecode:
//   cd liquid-protocol-v0 && forge build --contracts src/extensions/StakesaleVault.sol

import {
  encodeAbiParameters,
  createPublicClient,
  http,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';
import { mkdirSync, readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadPrivyConfig,
  makeTxSenderFromPrivy,
  loadSignerFromEnv,
  makeTxSenderFromEnv,
} from '../harness/safety/wallet.js';
import { ADDRESSES } from '../platform/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = join(__dirname, '..');

// ── ABI for reading extensionBps from deployed vault ─────────────────────────

const VAULT_VIEW_ABI = [{
  name: 'extensionBps', type: 'function', stateMutability: 'view',
  inputs: [], outputs: [{ name: '', type: 'uint256' }],
}] as const;

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else { out[key] = 'true'; }
    }
  }
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args        = parseArgs(process.argv.slice(2));
  const live        = args['live'] === 'true';
  const dryRun      = !live;
  const windowHours = parseInt(args['deposit-window-hours'] ?? '24');

  if (windowHours < 2 || windowHours > 720) {
    console.error('Error: --deposit-window-hours must be between 2 and 720 (30 days)');
    process.exit(1);
  }

  const depositWindow = BigInt(windowHours * 3600);

  console.log('\nDeploying StakesaleVault:');
  console.log(`  diem:           ${ADDRESSES.DIEM}`);
  console.log(`  factory:        ${ADDRESSES.LIQUID_FACTORY}`);
  console.log(`  depositWindow:  ${depositWindow}s (${windowHours}h)`);
  console.log(`  maxDeposit:     10 DIEM per address`);
  console.log(`  lockTiers:      30d (1×)  60d (2×)  90d (3×)`);
  console.log(`  treasury:       0x872c561f699B42977c093F0eD8b4C9a431280c6c (dust sweep)`);
  console.log(`  owner:          deployer wallet (can update extensionBps)`);
  console.log(`  extensionBps:   2000 (20%) — admin-adjustable post-deploy`);

  if (dryRun) {
    console.log('\n[dry-run] Would deploy StakesaleVault with above params.');
    console.log('[dry-run] Pass --live to execute.\n');
    return;
  }

  const rpcUrl = process.env['RPC_URL']!;
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });

  // Read bytecode from forge build artifact
  const artifactPath = join(REPO_ROOT, '..', 'liquid-protocol-v0', 'out',
    'StakesaleVault.sol', 'StakesaleVault.json');
  let artifact: { bytecode: { object: string } };
  try {
    artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as typeof artifact;
  } catch {
    console.error(`Artifact not found at: ${artifactPath}`);
    console.error('Run: cd liquid-protocol-v0 && forge build --contracts src/extensions/StakesaleVault.sol');
    process.exit(1);
  }
  const creationCode = artifact.bytecode.object;

  // Constructor: (address diem_, address factory_, uint256 depositWindow_)
  const constructorArgs = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address' }, { type: 'uint256' }],
    [ADDRESSES.DIEM, ADDRESSES.LIQUID_FACTORY, depositWindow],
  );
  const initCode = `${creationCode}${constructorArgs.slice(2)}` as Hex;

  // Load wallet
  let txSender: ReturnType<typeof makeTxSenderFromPrivy> | ReturnType<typeof makeTxSenderFromEnv>;
  if (process.env['PRIVY_APP_ID']) {
    const cfg = loadPrivyConfig();
    txSender = makeTxSenderFromPrivy(cfg);
  } else {
    txSender = makeTxSenderFromEnv(rpcUrl);
  }

  console.log('\nDeploying contract...');
  const txHash = await txSender({ to: undefined as unknown as Address, data: initCode });
  console.log(`tx:     ${txHash}`);

  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`status: ${receipt.status}`);
  if (receipt.status !== 'success') throw new Error('Deploy reverted');

  const vaultAddress = receipt.contractAddress;
  if (!vaultAddress) throw new Error('No contractAddress in receipt');

  console.log(`\nVault deployed: ${vaultAddress}`);

  // Read extensionBps from deployed contract
  const extensionBps = await client.readContract({
    address: vaultAddress, abi: VAULT_VIEW_ABI, functionName: 'extensionBps',
  });
  console.log(`extensionBps:   ${extensionBps} (${Number(extensionBps) / 100}%)`);

  // Persist to memory
  const today  = new Date().toISOString().slice(0, 10);
  const logDir = join(REPO_ROOT, 'memory', 'logs');
  mkdirSync(logDir, { recursive: true });

  appendFileSync(
    join(REPO_ROOT, 'memory', 'presales.jsonl'),
    JSON.stringify({
      timestamp:           new Date().toISOString(),
      contract:            'StakesaleVault',
      vaultAddress,
      diem:                ADDRESSES.DIEM,
      factory:             ADDRESSES.LIQUID_FACTORY,
      depositWindowHours:  windowHours,
      extensionBps:        extensionBps.toString(),
      txHash,
    }) + '\n',
  );
  appendFileSync(
    join(logDir, `${today}.md`),
    `\n### deploy-stakesale\n- vault: \`${vaultAddress}\`\n` +
    `- depositWindow: ${windowHours}h\n- extensionBps: ${extensionBps}\n- txHash: ${txHash}\n`,
  );

  console.log('\nSaved to memory/presales.jsonl');
  console.log('\nPass to token launch:');
  console.log(`  --presale-vault ${vaultAddress} --extension-bps ${extensionBps}`);
}

main().catch(e => { console.error(e); process.exit(1); });
