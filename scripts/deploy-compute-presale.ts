// Deploy a MintDiemPresaleVault for the Venice Agent Launchpad.
//
// Depositors bring VVV tokens OR DIEM directly. For VVV deposits, the vault
// stakes VVV → burns sVVV → mints DIEM, forwarding DIEM to agentWallet (minus protocol fee).
// For DIEM deposits, DIEM passes through directly.
//
// Depositors earn pro-rata token allocation based on DIEM contributed (or DIEM-equivalent
// from VVV conversion) vs totalDiemMinted.
//
// Usage:
//   node --env-file=.env --import tsx scripts/deploy-compute-presale.ts \
//     [--agent-wallet 0x...]          # who receives DIEM (default: AGENT_ADDRESS env)
//     [--protocol 0x...]              # autonomopoly fee recipient (default: AGENT_ADDRESS)
//     [--protocol-fee-bps 200]        # fee in bps, e.g. 200 = 2% (default: 0)
//     [--diem-target 100]             # DIEM target in whole units (default: 100)
//     [--deposit-window-hours 24]     # deposit window in hours, min 2 (default: 24)
//     [--dry-run]
//
// Pass the deployed vault address to the token launch script via --presale-vault.
// Recompile bytecode: cd liquid-protocol-v0 && forge build --contracts src/extensions/MintDiemPresaleVault.sol

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

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = join(__dirname, '..');

// ── Protocol addresses (Base mainnet) ─────────────────────────────────────────
const LIQUID_FACTORY = '0x04F1a284168743759BE6554f607a10CEBdB77760' as Address;
const VVV            = '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as Address;
const VVV_STAKING    = '0x321b7ff75154472B18EDb199033fF4D116F340Ff' as Address;
const DIEM           = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024' as Address;
const AGENT          = (process.env['AGENT_ADDRESS'] ?? '0x0000000000000000000000000000000000000000') as Address;

const PRIVY_API_BASE = 'https://api.privy.io/v1';

// ── Privy helpers ──────────────────────────────────────────────────────────
function privyHeaders(appId: string, appSecret: string) {
  return {
    Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };
}

async function privyDeploy(
  appId: string, appSecret: string, walletId: string,
  initCode: Hex,
): Promise<Hex> {
  const res = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}/rpc`, {
    method: 'POST',
    headers: privyHeaders(appId, appSecret),
    body: JSON.stringify({
      method: 'eth_sendTransaction',
      caip2: 'eip155:8453',
      chain_type: 'ethereum',
      params: { transaction: { data: initCode } }, // no 'to' = contract creation
    }),
  });
  if (!res.ok) throw new Error(`Privy deploy failed: ${await res.text()}`);
  return ((await res.json()) as { data: { hash: Hex } }).data.hash;
}

// ── CLI args ───────────────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));

  const dryRun          = args['dry-run'] === 'true';
  const windowHours     = parseInt(args['deposit-window-hours'] ?? '24');
  const diemTargetUnits = parseInt(args['diem-target'] ?? '100');
  const agentWallet     = (args['agent-wallet'] ?? AGENT) as Address;
  const protocolAddr    = (args['protocol'] ?? AGENT) as Address;
  const protocolFeeBps  = BigInt(args['protocol-fee-bps'] ?? '0');

  if (windowHours < 2) {
    console.error('Error: --deposit-window-hours must be ≥ 2 (contract minimum is 2 hours)');
    process.exit(1);
  }

  const depositWindow = BigInt(windowHours * 3600);
  const diemTarget    = BigInt(diemTargetUnits) * 10n ** 18n;

  console.log('\nDeploying MintDiemPresaleVault:');
  console.log(`  vvv:              ${VVV}  (users deposit VVV tokens)`);
  console.log(`  vvvStaking:       ${VVV_STAKING}  (vault stakes VVV → sVVV internally)`);
  console.log(`  diem:             ${DIEM}  (users may also deposit DIEM directly)`);
  console.log(`  agentWallet:      ${agentWallet}`);
  console.log(`  diemTarget:       ${diemTargetUnits} DIEM`);
  console.log(`  depositWindow:    ${depositWindow}s (${windowHours}h)`);
  console.log(`  factory:          ${LIQUID_FACTORY}`);
  console.log(`  protocol:         ${protocolAddr}`);
  console.log(`  protocolFeeBps:   ${protocolFeeBps} (${Number(protocolFeeBps) / 100}%)`);
  console.log(`\n  VVV path rate: ~0.00141 DIEM/VVV → need ~${Math.ceil(diemTargetUnits / 0.00141).toLocaleString()} VVV to fill target via VVV deposits`);

  if (dryRun) {
    console.log('\n[dry-run] Would deploy MintDiemPresaleVault with above params');
    return;
  }

  const appId     = process.env['PRIVY_APP_ID']!;
  const appSecret = process.env['PRIVY_APP_SECRET']!;
  const walletId  = process.env['PRIVY_WALLET_ID']!;
  const rpcUrl    = process.env['RPC_URL']!;

  // Read bytecode from the forge build artifact
  const artifactPath = join(REPO_ROOT, '..', 'liquid-protocol-v0', 'out',
    'MintDiemPresaleVault.sol', 'MintDiemPresaleVault.json');
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as {
    bytecode: { object: string };
  };
  const creationCode = artifact.bytecode.object;

  // Constructor args order: vvv, vvvStaking, diem, agentWallet, diemTarget,
  //                         depositWindow, factory, protocol, protocolFeeBps
  const constructorArgs = encodeAbiParameters(
    [
      { type: 'address' }, // vvv
      { type: 'address' }, // vvvStaking
      { type: 'address' }, // diem
      { type: 'address' }, // agentWallet
      { type: 'uint256' }, // diemTarget
      { type: 'uint256' }, // depositWindow
      { type: 'address' }, // factory
      { type: 'address' }, // protocol
      { type: 'uint256' }, // protocolFeeBps
    ],
    [VVV, VVV_STAKING, DIEM, agentWallet, diemTarget, depositWindow, LIQUID_FACTORY, protocolAddr, protocolFeeBps],
  );
  const initCode = `${creationCode}${constructorArgs.slice(2)}` as Hex;

  console.log('\nDeploying contract...');
  const txHash = await privyDeploy(appId, appSecret, walletId, initCode);
  console.log(`tx:     ${txHash}`);

  const client  = createPublicClient({ chain: base, transport: http(rpcUrl) });
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`status: ${receipt.status}`);
  if (receipt.status !== 'success') throw new Error('Deploy reverted');

  const vaultAddress = receipt.contractAddress;
  if (!vaultAddress) throw new Error('No contractAddress in receipt');

  console.log(`\nVault deployed: ${vaultAddress}`);

  // Persist to memory
  const today  = new Date().toISOString().slice(0, 10);
  const logDir = join(REPO_ROOT, 'memory', 'logs');
  mkdirSync(logDir, { recursive: true });
  mkdirSync(join(REPO_ROOT, 'memory'), { recursive: true });

  appendFileSync(
    join(REPO_ROOT, 'memory', 'presales.jsonl'),
    JSON.stringify({
      timestamp:      new Date().toISOString(),
      contract:       'MintDiemPresaleVault',
      vaultAddress,
      agentWallet,
      diemTarget:     diemTarget.toString(),
      depositWindowHours: windowHours,
      protocolAddr,
      protocolFeeBps: protocolFeeBps.toString(),
      txHash,
    }) + '\n',
  );
  appendFileSync(
    join(logDir, `${today}.md`),
    `\n### deploy-compute-presale\n- vault: ${vaultAddress}\n- diemTarget: ${diemTargetUnits} DIEM\n` +
    `- protocol: ${protocolAddr} (${Number(protocolFeeBps)/100}%)\n- txHash: ${txHash}\n`,
  );

  console.log(`Saved to memory/presales.jsonl`);
  console.log(`\nPass to token launch: --presale-vault ${vaultAddress}`);
}

main().catch(e => { console.error(e); process.exit(1); });
