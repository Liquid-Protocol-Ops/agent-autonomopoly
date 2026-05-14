/**
 * scripts/swap-diem-vvv.ts
 *
 * Swaps LP DIEM → WETH → VVV via Uniswap V3, then stakes VVV on Venice staking contract
 * so the agent can mint a Venice API key.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/swap-diem-vvv.ts            # live
 *   node --env-file=.env --import tsx scripts/swap-diem-vvv.ts --dry-run  # simulate only
 *
 * Required env vars (root .env or scripts/.env):
 *   RPC_URL            Base mainnet RPC
 *   PRIVY_APP_ID       Privy application ID
 *   PRIVY_APP_SECRET   Privy application secret
 *   PRIVY_WALLET_ID    Agent's Privy server wallet ID
 *   AGENT_WALLET       Agent wallet address
 *
 * Optional:
 *   DIEM_SWAP_AMOUNT   Amount of LP DIEM to swap (human units, default: 0.05)
 *   SLIPPAGE_BPS       Slippage tolerance in bps (default: 200 = 2%)
 */

import {
  createPublicClient,
  encodePacked,
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
const DIEM             = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024' as Address;
const VVV              = '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as Address;
const WETH             = '0x4200000000000000000000000000000000000006' as Address;
const VVV_STAKING      = '0x321b7ff75154472B18EDb199033fF4D116F340Ff' as Address;
const UNI_V3_ROUTER    = '0x2626664c2603336E57B271c5C0b26F421741e481' as Address;

// Pool fees (both legs use 0.3%)
const DIEM_WETH_FEE = 3000;
const WETH_VVV_FEE  = 3000;

// ── ABIs ──────────────────────────────────────────────────────────────
const ERC20_ABI = [
  { name: 'approve',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',        inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'decimals',  type: 'function', stateMutability: 'view',        inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

const SWAP_ROUTER_ABI = [{
  name: 'exactInput',
  type: 'function',
  stateMutability: 'payable',
  inputs: [{
    name: 'params',
    type: 'tuple',
    components: [
      { name: 'path',             type: 'bytes'   },
      { name: 'recipient',        type: 'address' },
      { name: 'amountIn',         type: 'uint256' },
      { name: 'amountOutMinimum', type: 'uint256' },
    ],
  }],
  outputs: [{ name: 'amountOut', type: 'uint256' }],
}] as const;

const VVV_STAKING_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'stake',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',     inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

// ── Privy sender ──────────────────────────────────────────────────────
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

  if (!rpcUrl)      throw new Error('RPC_URL is required');
  if (!appId)       throw new Error('PRIVY_APP_ID is required');
  if (!appSecret)   throw new Error('PRIVY_APP_SECRET is required');
  if (!walletId)    throw new Error('PRIVY_WALLET_ID is required');
  if (!agentWallet) throw new Error('AGENT_WALLET is required');

  const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });

  const humanAmount = process.env['DIEM_SWAP_AMOUNT'] ?? '0.05';
  const slippageBps = BigInt(process.env['SLIPPAGE_BPS'] ?? '200');

  const [diemDecimals, vvvDecimals, diemBalance, vvvBefore, svvvBefore] = await Promise.all([
    publicClient.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: VVV,  abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet] }),
    publicClient.readContract({ address: VVV,  abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet] }),
    publicClient.readContract({ address: VVV_STAKING, abi: VVV_STAKING_ABI, functionName: 'balanceOf', args: [agentWallet] }),
  ]);

  const amountIn     = parseUnits(humanAmount, diemDecimals);
  const amountOutMin = amountIn * (10000n - slippageBps) / 10000n; // rough floor; refine with quote if needed

  console.log(`\nAgent wallet : ${agentWallet}`);
  console.log(`DIEM balance : ${formatUnits(diemBalance, diemDecimals)} DIEM`);
  console.log(`VVV balance  : ${formatUnits(vvvBefore, vvvDecimals)} VVV`);
  console.log(`sVVV balance : ${formatUnits(svvvBefore, 18)} sVVV`);
  console.log(`\nSwap: ${humanAmount} DIEM → WETH → VVV`);
  console.log(`Path : DIEM/WETH 0.3% → WETH/VVV 0.3%`);

  if (diemBalance < amountIn) {
    throw new Error(`Insufficient DIEM: have ${formatUnits(diemBalance, diemDecimals)}, need ${humanAmount}`);
  }

  if (dryRun) {
    console.log('\n[dry-run] No transactions sent.');
    return;
  }

  // ── Step 1: Approve DIEM → UniV3 Router ─────────────────────────────
  console.log('\n[1/3] Approving DIEM to Uniswap V3 router...');
  const { encodeAbiParameters: enc, parseAbiParameters: par } = await import('viem');
  const approveData = encodeAbiParameters(
    par('address,uint256'),
    [UNI_V3_ROUTER, maxUint256],
  );
  // Build approve calldata manually using ABI encoding
  const approveSig = '0x095ea7b3'; // approve(address,uint256)
  const approveTx = await privySend(appId, appSecret, walletId, DIEM,
    `${approveSig}${approveData.slice(2)}` as Hex,
  );
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log(`      tx: ${approveTx}`);

  // ── Step 2: Swap DIEM → WETH → VVV via exactInput ───────────────────
  console.log('[2/3] Swapping DIEM → WETH → VVV...');
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  // Multi-hop path: DIEM → (fee 0.3%) → WETH → (fee 0.3%) → VVV
  const path = encodePacked(
    ['address', 'uint24', 'address', 'uint24', 'address'],
    [DIEM, DIEM_WETH_FEE, WETH, WETH_VVV_FEE, VVV],
  );

  // Simulate first
  let vvvOut: bigint;
  try {
    const result = await publicClient.simulateContract({
      address: UNI_V3_ROUTER,
      abi: SWAP_ROUTER_ABI,
      functionName: 'exactInput',
      args: [{ path, recipient: agentWallet, amountIn, amountOutMinimum: 0n }],
      account: agentWallet,
    });
    vvvOut = result.result;
    console.log(`      expected VVV out: ${formatUnits(vvvOut, vvvDecimals)}`);
  } catch (err) {
    console.error('      simulation failed:', err instanceof Error ? err.message : err);
    throw err;
  }

  // Encode exactInput calldata
  const swapCalldata = encodeAbiParameters(
    parseAbiParameters('(bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)'),
    [{ path, recipient: agentWallet, amountIn, amountOutMinimum: vvvOut * (10000n - slippageBps) / 10000n }],
  );
  const exactInputSig = '0xb858183f'; // exactInput((bytes,address,uint256,uint256))
  const swapTx = await privySend(appId, appSecret, walletId, UNI_V3_ROUTER,
    `${exactInputSig}${swapCalldata.slice(2)}` as Hex,
  );
  await publicClient.waitForTransactionReceipt({ hash: swapTx });
  console.log(`      tx: ${swapTx}`);

  const vvvAfterSwap = await publicClient.readContract({
    address: VVV, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet],
  });
  const vvvReceived = vvvAfterSwap - vvvBefore;
  console.log(`      received: ${formatUnits(vvvReceived, vvvDecimals)} VVV`);

  // ── Step 3: Approve VVV → Venice staking, then stake ────────────────
  console.log('[3/3] Staking VVV on Venice...');

  // Approve VVV → staking contract
  const vvvApproveSig = '0x095ea7b3';
  const vvvApproveData = encodeAbiParameters(
    parseAbiParameters('address,uint256'),
    [VVV_STAKING, vvvReceived],
  );
  const vvvApproveTx = await privySend(appId, appSecret, walletId, VVV,
    `${vvvApproveSig}${vvvApproveData.slice(2)}` as Hex,
  );
  await publicClient.waitForTransactionReceipt({ hash: vvvApproveTx });

  // Stake VVV — stake(uint256)
  const stakeSig = '0xa694fc3a'; // stake(uint256)
  const stakeData = encodeAbiParameters(parseAbiParameters('uint256'), [vvvReceived]);
  const stakeTx = await privySend(appId, appSecret, walletId, VVV_STAKING,
    `${stakeSig}${stakeData.slice(2)}` as Hex,
  );
  const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeTx });
  console.log(`      tx: ${stakeTx}`);

  const svvvAfter = await publicClient.readContract({
    address: VVV_STAKING, abi: VVV_STAKING_ABI, functionName: 'balanceOf', args: [agentWallet],
  });

  console.log('\n✓ Done');
  console.log(`  status  : ${stakeReceipt.status}`);
  console.log(`  sVVV    : ${formatUnits(svvvAfter, 18)} (staked VVV balance)`);
  console.log(`\nAgent now has sVVV — ready to mint Venice API key via harness tick.`);
}

main().catch(err => { console.error(err); process.exit(1); });
