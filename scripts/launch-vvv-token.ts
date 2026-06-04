// Launch a VVV-denominated token on Liquid Protocol with dynamic fees + creator fee routing.
//
// Usage:
//   node --env-file=.env --import tsx scripts/launch-vvv-token.ts \
//     --name "Token Name" --symbol "SYM" \
//     [--creator 0x...]         # defaults to AGENT wallet
//     [--marketcap-vvv 50]      # target VVV marketcap at launch (default: 50)
//     [--image "https://..."]
//     [--metadata '{"k":"v"}']
//     [--dry-run]
//
// Tick math: tickIfToken0IsLiquid = round(log(vvvPerToken) / log(1.0001) / 60) * 60
// where vvvPerToken = targetMarketcapVVV / 100_000_000_000 (100B total supply).
// If creator == AGENT wallet, fees route to the agent's Privy-controlled address.

import {
  encodeFunctionData,
  decodeEventLog,
  keccak256,
  encodePacked,
  type Address,
  type Hex,
} from 'viem';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = join(__dirname, '..');

// ── Protocol addresses ─────────────────────────────────────────────────────
const FACTORY        = '0x04F1a284168743759BE6554f607a10CEBdB77760' as Address;
const VVV            = '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as Address;
const HOOK_DYN_FEE   = '0x80E2F7dC8C2C880BbC4BDF80A5Fb0eB8B1DB68CC' as Address;
const LP_LOCKER      = '0x77247fCD1d5e34A3703AcA898A591Dc7422435f3' as Address;
const MEV_DESC_FEES  = '0x8D6B080e48756A99F3893491D556B5d6907b6910' as Address;
const AGENT          = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3' as Address;
const PRIVY_API_BASE = 'https://api.privy.io/v1';
const CHAIN_ID       = 8453n;
const TICK_SPACING   = 60;
const TOTAL_SUPPLY   = 100_000_000_000; // 100B tokens

// ── ABIs ───────────────────────────────────────────────────────────────────
const FACTORY_ABI = [
  {
    name: 'deployToken',
    type: 'function' as const,
    stateMutability: 'payable' as const,
    inputs: [{
      name: 'deploymentConfig', type: 'tuple' as const, components: [
        { name: 'tokenConfig', type: 'tuple' as const, components: [
          { name: 'tokenAdmin',         type: 'address'  as const },
          { name: 'name',               type: 'string'   as const },
          { name: 'symbol',             type: 'string'   as const },
          { name: 'salt',               type: 'bytes32'  as const },
          { name: 'image',              type: 'string'   as const },
          { name: 'metadata',           type: 'string'   as const },
          { name: 'context',            type: 'string'   as const },
          { name: 'originatingChainId', type: 'uint256'  as const },
        ]},
        { name: 'poolConfig', type: 'tuple' as const, components: [
          { name: 'hook',                 type: 'address' as const },
          { name: 'pairedToken',          type: 'address' as const },
          { name: 'tickIfToken0IsLiquid', type: 'int24'   as const },
          { name: 'tickSpacing',          type: 'int24'   as const },
          { name: 'poolData',             type: 'bytes'   as const },
        ]},
        { name: 'lockerConfig', type: 'tuple' as const, components: [
          { name: 'locker',           type: 'address'   as const },
          { name: 'rewardAdmins',     type: 'address[]' as const },
          { name: 'rewardRecipients', type: 'address[]' as const },
          { name: 'rewardBps',        type: 'uint16[]'  as const },
          { name: 'tickLower',        type: 'int24[]'   as const },
          { name: 'tickUpper',        type: 'int24[]'   as const },
          { name: 'positionBps',      type: 'uint16[]'  as const },
          { name: 'lockerData',       type: 'bytes'     as const },
        ]},
        { name: 'mevModuleConfig', type: 'tuple' as const, components: [
          { name: 'mevModule',     type: 'address' as const },
          { name: 'mevModuleData', type: 'bytes'   as const },
        ]},
        { name: 'extensionConfigs', type: 'tuple[]' as const, components: [
          { name: 'extension',    type: 'address' as const },
          { name: 'msgValue',     type: 'uint256' as const },
          { name: 'extensionBps', type: 'uint16'  as const },
          { name: 'extensionData', type: 'bytes'  as const },
        ]},
      ],
    }],
    outputs: [{ name: 'tokenAddress', type: 'address' as const }],
  },
] as const;

const TOKEN_CREATED_ABI = [
  {
    name: 'TokenCreated',
    type: 'event' as const,
    anonymous: false,
    inputs: [
      { name: 'msgSender',        type: 'address'   as const, indexed: false },
      { name: 'tokenAddress',     type: 'address'   as const, indexed: true  },
      { name: 'tokenAdmin',       type: 'address'   as const, indexed: true  },
      { name: 'tokenImage',       type: 'string'    as const, indexed: false },
      { name: 'tokenName',        type: 'string'    as const, indexed: false },
      { name: 'tokenSymbol',      type: 'string'    as const, indexed: false },
      { name: 'tokenMetadata',    type: 'string'    as const, indexed: false },
      { name: 'tokenContext',     type: 'string'    as const, indexed: false },
      { name: 'startingTick',     type: 'int24'     as const, indexed: false },
      { name: 'poolHook',         type: 'address'   as const, indexed: false },
      { name: 'poolId',           type: 'bytes32'   as const, indexed: false },
      { name: 'pairedToken',      type: 'address'   as const, indexed: false },
      { name: 'locker',           type: 'address'   as const, indexed: false },
      { name: 'mevModule',        type: 'address'   as const, indexed: false },
      { name: 'extensionsSupply', type: 'uint256'   as const, indexed: false },
      { name: 'extensions',       type: 'address[]' as const, indexed: false },
    ],
  },
] as const;

// ── Tick math ──────────────────────────────────────────────────────────────
// Returns tickIfToken0IsLiquid aligned to TICK_SPACING.
// SDK negates internally if the deployed token address > VVV address.
function tickFromMarketcapVVV(marketcapVVV: number): number {
  const vvvPerToken = marketcapVVV / TOTAL_SUPPLY;
  const tick = Math.round(Math.log(vvvPerToken) / Math.log(1.0001));
  return Math.round(tick / TICK_SPACING) * TICK_SPACING;
}

// ── Privy helpers ──────────────────────────────────────────────────────────
function privyHeaders(appId: string, appSecret: string) {
  return {
    Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };
}

async function privySend(
  appId: string, appSecret: string, walletId: string,
  to: Address, data: Hex,
): Promise<Hex> {
  const res = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}/rpc`, {
    method: 'POST',
    headers: privyHeaders(appId, appSecret),
    body: JSON.stringify({
      method: 'eth_sendTransaction',
      caip2: 'eip155:8453',
      chain_type: 'ethereum',
      params: { transaction: { to, data } },
    }),
  });
  if (!res.ok) throw new Error(`Privy send failed: ${await res.text()}`);
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
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));

  const name         = args['name'] ?? '';
  const symbol       = args['symbol'] ?? '';
  const dryRun       = args['dry-run'] === 'true';
  const marketcapVVV = parseFloat(args['marketcap-vvv'] ?? '50');
  const creator      = (args['creator'] ?? AGENT) as Address;

  // Fail-closed creator guard: a non-agent creator routes tokenAdmin / rewardAdmins
  // / rewardRecipients / feeRecipient to that address. Because launch params can
  // originate from an agent-writable queue (memory/launch-queue.jsonl), only the
  // agent's own wallet is permitted unless an operator explicitly allow-lists
  // others via LAUNCH_CREATOR_ALLOWLIST (comma-separated addresses).
  {
    const allowedCreators = new Set(
      [AGENT, ...(process.env['LAUNCH_CREATOR_ALLOWLIST'] ?? '').split(',')]
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean),
    );
    if (!allowedCreators.has(creator.toLowerCase())) {
      throw new Error(
        `creator ${creator} is not allow-listed — refusing to route token admin/fees ` +
          `to a non-agent address. Set LAUNCH_CREATOR_ALLOWLIST to permit it.`,
      );
    }
  }
  const image        = args['image'] ?? '';
  const metadata     = args['metadata'] ?? '';

  if (!name || !symbol) {
    console.error('Usage: --name "Token Name" --symbol "SYM" [--creator 0x...] [--marketcap-vvv 50] [--dry-run]');
    process.exit(1);
  }

  if (Number.isNaN(marketcapVVV) || marketcapVVV <= 0) {
    console.error('--marketcap-vvv must be a positive number');
    process.exit(1);
  }

  const appId     = process.env['PRIVY_APP_ID']!;
  const appSecret = process.env['PRIVY_APP_SECRET']!;
  const walletId  = process.env['PRIVY_WALLET_ID']!;
  const rpcUrl    = process.env['RPC_URL']!;

  // If creator is the agent itself, fees route to the agent Privy wallet (same address).
  const feeRecipient: Address =
    creator.toLowerCase() === AGENT.toLowerCase() ? AGENT : creator;

  const tick = tickFromMarketcapVVV(marketcapVVV);
  const salt = keccak256(encodePacked(
    ['string', 'string', 'uint256'],
    [name, symbol, BigInt(Date.now())],
  ));

  console.log('\nLaunching VVV-denominated token:');
  console.log(`  name:          ${name}`);
  console.log(`  symbol:        ${symbol}`);
  console.log(`  creator:       ${creator}`);
  console.log(`  feeRecipient:  ${feeRecipient}`);
  console.log(`  marketcap:     ${marketcapVVV} VVV`);
  console.log(`  tick:          ${tick}  (tickIfToken0IsLiquid)`);
  console.log(`  pairedToken:   VVV (${VVV})`);
  console.log(`  hook:          HOOK_DYNAMIC_FEE_V2`);
  console.log(`  salt:          ${salt}`);

  if (dryRun) {
    console.log('\n[dry-run] Would call deployToken on', FACTORY);
    return;
  }

  const calldata = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'deployToken',
    args: [{
      tokenConfig: {
        tokenAdmin:         feeRecipient,
        name,
        symbol,
        salt,
        image,
        metadata,
        context:            '',
        originatingChainId: CHAIN_ID,
      },
      poolConfig: {
        hook:                 HOOK_DYN_FEE,
        pairedToken:          VVV,
        tickIfToken0IsLiquid: tick,
        tickSpacing:          TICK_SPACING,
        poolData:             '0x',
      },
      lockerConfig: {
        locker:           LP_LOCKER,
        rewardAdmins:     [feeRecipient],
        rewardRecipients: [feeRecipient],
        rewardBps:        [10000],
        tickLower:        [-887220],
        tickUpper:        [887220],
        positionBps:      [10000],
        lockerData:       '0x',
      },
      mevModuleConfig: {
        mevModule:     MEV_DESC_FEES,
        mevModuleData: '0x',
      },
      extensionConfigs: [],
    }],
  });

  function mkClient(url: string) {
    return createPublicClient({ chain: base, transport: http(url) });
  }
  const client = mkClient(rpcUrl);

  console.log('\nSending deployToken tx...');
  const txHash = await privySend(appId, appSecret, walletId, FACTORY, calldata);
  console.log(`tx:     ${txHash}`);

  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`status: ${receipt.status}`);
  if (receipt.status !== 'success') throw new Error('Transaction reverted');

  // Parse TokenCreated event
  let tokenAddress: Address | undefined;
  let startingTick: number | undefined;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: TOKEN_CREATED_ABI,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      });
      if (decoded.eventName === 'TokenCreated') {
        const ev = decoded.args as Record<string, unknown>;
        tokenAddress = ev['tokenAddress'] as Address;
        startingTick = ev['startingTick'] as number;
        break;
      }
    } catch { /* not this log */ }
  }

  if (!tokenAddress) throw new Error('TokenCreated event not found in receipt');

  const today   = new Date().toISOString().slice(0, 10);
  const logDir  = join(REPO_ROOT, 'memory', 'logs');
  mkdirSync(logDir, { recursive: true });
  appendFileSync(
    join(logDir, `${today}.md`),
    `\n### launch-vvv-token\n- token: ${tokenAddress}\n- symbol: ${symbol}\n- name: ${name}\n- startingTick: ${startingTick}\n- marketcap: ${marketcapVVV} VVV\n- feeRecipient: ${feeRecipient}\n- txHash: ${txHash}\n`,
  );

  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    tokenAddress,
    symbol,
    name,
    startingTick,
    marketcapVVV,
    pairedToken: VVV,
    feeRecipient,
    txHash,
  });
  appendFileSync(join(REPO_ROOT, 'memory', 'launches.jsonl'), record + '\n');

  console.log(`\nToken deployed: ${tokenAddress}`);
  console.log(`Starting tick:  ${startingTick}`);
  console.log('Saved to memory/launches.jsonl');
}

main().catch(e => { console.error(e); process.exit(1); });
