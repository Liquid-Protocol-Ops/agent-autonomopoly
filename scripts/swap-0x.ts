/**
 * scripts/swap-0x.ts
 *
 * Swaps LP DIEM → VVV via 0x API (routes through Aerodrome V3 on Base),
 * then stakes all received VVV on the Venice staking contract so the agent
 * can mint a Venice API key.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/swap-0x.ts            # live
 *   node --env-file=.env --import tsx scripts/swap-0x.ts --dry-run  # quote only
 *
 * Required env vars:
 *   RPC_URL          Base mainnet RPC
 *   PRIVY_APP_ID     Privy application ID
 *   PRIVY_APP_SECRET Privy application secret
 *   PRIVY_WALLET_ID  Agent's Privy server wallet ID
 *   AGENT_WALLET     Agent wallet address
 *   ZEROX_API_KEY    0x API key
 *
 * Optional:
 *   DIEM_SWAP_AMOUNT Amount of LP DIEM to swap (human units, default: 0.05)
 *   SLIPPAGE_BPS     Slippage in bps (default: 100 = 1%)
 */

import {
  createPublicClient,
  encodeAbiParameters,
  parseAbiParameters,
  http,
  parseUnits,
  formatUnits,
  maxUint256,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';

// ── Addresses ──────────────────────────────────────────────────────────
const DIEM        = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024' as Address;
const VVV         = '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as Address;
const VVV_STAKING = '0x321b7ff75154472B18EDb199033fF4D116F340Ff' as Address;

const ZEROX_API = 'https://api.0x.org/swap/allowance-holder/quote';

// ── ABIs ──────────────────────────────────────────────────────────────
const ERC20_ABI = [
  { name: 'approve',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',        inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'decimals',  type: 'function', stateMutability: 'view',        inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

const VVV_STAKING_ABI = [
  { name: 'stake',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

// ── Privy helpers ─────────────────────────────────────────────────────
const PRIVY_API_BASE = 'https://api.privy.io/v1';

function privyHeaders(appId: string, appSecret: string): Record<string, string> {
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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Privy eth_sendTransaction failed (${res.status}): ${text}`);
  }
  const body = await res.json() as { data: { hash: Hex } };
  return body.data.hash;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const rpcUrl      = process.env['RPC_URL'];
  const appId       = process.env['PRIVY_APP_ID'];
  const appSecret   = process.env['PRIVY_APP_SECRET'];
  const walletId    = process.env['PRIVY_WALLET_ID'];
  const agentWallet = process.env['AGENT_WALLET'] as Address | undefined;
  const zeroxKey    = process.env['ZEROX_API_KEY'];

  if (!rpcUrl)      throw new Error('RPC_URL is required');
  if (!appId)       throw new Error('PRIVY_APP_ID is required');
  if (!appSecret)   throw new Error('PRIVY_APP_SECRET is required');
  if (!walletId)    throw new Error('PRIVY_WALLET_ID is required');
  if (!agentWallet) throw new Error('AGENT_WALLET is required');
  if (!zeroxKey)    throw new Error('ZEROX_API_KEY is required');

  const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });

  const humanAmount = process.env['DIEM_SWAP_AMOUNT'] ?? '0.05';
  const slippageBps = Number(process.env['SLIPPAGE_BPS'] ?? '100');

  const [diemDecimals, vvvDecimals, diemBalance, vvvBefore, svvvBefore] = await Promise.all([
    publicClient.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: VVV,  abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet] }),
    publicClient.readContract({ address: VVV,  abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet] }),
    publicClient.readContract({ address: VVV_STAKING, abi: VVV_STAKING_ABI, functionName: 'balanceOf', args: [agentWallet] }),
  ]);

  const amountIn = parseUnits(humanAmount, diemDecimals);

  console.log(`\nAgent wallet : ${agentWallet}`);
  console.log(`DIEM balance : ${formatUnits(diemBalance, diemDecimals)} DIEM`);
  console.log(`VVV balance  : ${formatUnits(vvvBefore, vvvDecimals)} VVV`);
  console.log(`sVVV balance : ${formatUnits(svvvBefore, 18)} sVVV`);
  console.log(`\nSwap: ${humanAmount} DIEM → VVV (via 0x / Aerodrome V3)`);

  if (diemBalance < amountIn) {
    throw new Error(`Insufficient DIEM: have ${formatUnits(diemBalance, diemDecimals)}, need ${humanAmount}`);
  }

  // ── Get 0x quote ─────────────────────────────────────────────────────
  console.log('\nFetching 0x quote...');
  const qParams = new URLSearchParams({
    sellToken: DIEM,
    buyToken: VVV,
    sellAmount: amountIn.toString(),
    taker: agentWallet,
    chainId: '8453',
    slippageBps: slippageBps.toString(),
    // DIEM/VVV liquidity lives on Aerodrome V3; exclude V4 hook pool to avoid routing failures
    excludedSources: 'Uniswap_V4',
  });
  const quoteRes = await fetch(`${ZEROX_API}?${qParams}`, {
    headers: { '0x-api-key': zeroxKey, '0x-version': 'v2' },
  });
  if (!quoteRes.ok) {
    const text = await quoteRes.text();
    throw new Error(`0x quote failed (${quoteRes.status}): ${text}`);
  }
  const quote = await quoteRes.json() as {
    buyAmount: string;
    minBuyAmount: string;
    allowanceTarget: Address;
    transaction: { to: Address; data: Hex; value: string };
    issues: { allowance: { actual: string; spender: string } | null };
    route: { fills: Array<{ source: string }> };
  };

  console.log(`Expected VVV : ${formatUnits(BigInt(quote.buyAmount), vvvDecimals)}`);
  console.log(`Min VVV      : ${formatUnits(BigInt(quote.minBuyAmount), vvvDecimals)}`);
  console.log(`Route        : ${quote.route.fills.map(f => f.source).join(' → ')}`);

  if (dryRun) {
    console.log('\n[dry-run] No transactions sent.');
    return;
  }

  // ── Step 1: Approve DIEM → 0x allowance holder ───────────────────────
  if (quote.issues.allowance !== null) {
    console.log(`\n[1/3] Approving DIEM to 0x allowance holder (${quote.allowanceTarget})...`);
    const sig = '0x095ea7b3'; // approve(address,uint256)
    const data = encodeAbiParameters(parseAbiParameters('address,uint256'), [quote.allowanceTarget, maxUint256]);
    const tx = await privySend(appId, appSecret, walletId, DIEM, `${sig}${data.slice(2)}` as Hex);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`      tx: ${tx}`);
  } else {
    console.log('\n[1/3] Allowance already set, skipping approve.');
  }

  // ── Step 2: Refetch fresh quote + execute swap ───────────────────────
  // Always get a fresh quote at swap time so minBuyAmount reflects current block.
  console.log('[2/3] Getting fresh quote and swapping DIEM → VVV...');
  const freshRes = await fetch(`${ZEROX_API}?${qParams}`, {
    headers: { '0x-api-key': zeroxKey, '0x-version': 'v2' },
  });
  if (!freshRes.ok) {
    const text = await freshRes.text();
    throw new Error(`0x fresh quote failed (${freshRes.status}): ${text}`);
  }
  const freshQuote = await freshRes.json() as typeof quote;
  console.log(`      fresh quote: ${formatUnits(BigInt(freshQuote.buyAmount), vvvDecimals)} VVV expected`);

  const swapTx = await privySend(appId, appSecret, walletId, freshQuote.transaction.to, freshQuote.transaction.data);
  await publicClient.waitForTransactionReceipt({ hash: swapTx });
  console.log(`      tx: ${swapTx}`);

  const vvvAfter = await publicClient.readContract({
    address: VVV, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet],
  });
  const vvvReceived = vvvAfter - vvvBefore;
  console.log(`      received: ${formatUnits(vvvReceived, vvvDecimals)} VVV`);

  // ── Step 3: Approve VVV → staking, then stake ────────────────────────
  console.log('[3/3] Staking VVV on Venice...');

  const approveSig = '0x095ea7b3';
  const approveData = encodeAbiParameters(parseAbiParameters('address,uint256'), [VVV_STAKING, vvvReceived]);
  const approveTx = await privySend(appId, appSecret, walletId, VVV, `${approveSig}${approveData.slice(2)}` as Hex);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  const stakeSig = '0xa694fc3a'; // stake(uint256)
  const stakeCalldata = encodeAbiParameters(parseAbiParameters('uint256'), [vvvReceived]);
  const stakeTx = await privySend(appId, appSecret, walletId, VVV_STAKING, `${stakeSig}${stakeCalldata.slice(2)}` as Hex);
  const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeTx });
  console.log(`      tx: ${stakeTx}`);

  const svvvAfter = await publicClient.readContract({
    address: VVV_STAKING, abi: VVV_STAKING_ABI, functionName: 'balanceOf', args: [agentWallet],
  });

  console.log('\n✓ Done');
  console.log(`  status : ${stakeReceipt.status}`);
  console.log(`  sVVV   : ${formatUnits(svvvAfter, 18)} (staked VVV)`);
  console.log(`\nAgent now has sVVV — ready to mint Venice API key via harness tick.`);
}

main().catch(err => { console.error(err); process.exit(1); });
