/**
 * scripts/claim.ts
 *
 * Claims accrued DIEM fees from FeeLocker for an agent wallet (Privy server wallet).
 *
 * Usage:
 *   node --env-file=scripts/.env --import tsx scripts/claim.ts            # live
 *   node --env-file=scripts/.env --import tsx scripts/claim.ts --dry-run  # check only
 *
 * Required env vars:
 *   RPC_URL          Base mainnet RPC
 *   PRIVY_APP_ID     Privy application ID
 *   PRIVY_APP_SECRET Privy application secret
 *   PRIVY_WALLET_ID  Server wallet ID of the agent
 *   AGENT_WALLET     Agent wallet address (to pass as feeOwner)
 *
 * Optional:
 *   DIEM_ADDRESS     Defaults to mainnet DIEM
 *   FEE_LOCKER       Defaults to mainnet FeeLocker
 */

import {
  createPublicClient,
  http,
  formatUnits,
  encodeFunctionData,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';

// ── Addresses ──────────────────────────────────────────────────────────
const DIEM       = (process.env['DIEM_ADDRESS']  ?? '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024') as Address;
const FEE_LOCKER = (process.env['FEE_LOCKER']    ?? '0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF') as Address;

// ── ABIs ──────────────────────────────────────────────────────────────
const FEE_LOCKER_ABI = [
  {
    type: 'function', name: 'availableFees',
    inputs: [{ name: 'feeOwner', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'claim',
    inputs: [{ name: 'feeOwner', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },
] as const;

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'decimals',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

// ── Privy server-wallet TxSender ──────────────────────────────────────
const PRIVY_API_BASE = 'https://api.privy.io/v1';

function privyHeaders(appId: string, appSecret: string): Record<string, string> {
  const auth = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };
}

async function privySend(
  appId: string,
  appSecret: string,
  walletId: string,
  to: Address,
  data: Hex,
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

  const rpcUrl     = process.env['RPC_URL'];
  const appId      = process.env['PRIVY_APP_ID'];
  const appSecret  = process.env['PRIVY_APP_SECRET'];
  const walletId   = process.env['PRIVY_WALLET_ID'];
  const agentWallet = process.env['AGENT_WALLET'] as Address | undefined;

  if (!rpcUrl)      throw new Error('RPC_URL is required');
  if (!appId)       throw new Error('PRIVY_APP_ID is required');
  if (!appSecret)   throw new Error('PRIVY_APP_SECRET is required');
  if (!walletId)    throw new Error('PRIVY_WALLET_ID is required');
  if (!agentWallet) throw new Error('AGENT_WALLET is required');

  const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });

  const [claimable, diemDecimals, diemBefore] = await Promise.all([
    publicClient.readContract({
      address: FEE_LOCKER, abi: FEE_LOCKER_ABI, functionName: 'availableFees',
      args: [agentWallet, DIEM],
    }),
    publicClient.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet] }),
  ]);

  console.log(`\nAgent wallet : ${agentWallet}`);
  console.log(`Claimable    : ${formatUnits(claimable, diemDecimals)} DIEM`);
  console.log(`DIEM balance : ${formatUnits(diemBefore, diemDecimals)} DIEM`);

  if (claimable === 0n) {
    console.log('\nNothing to claim.');
    return;
  }

  if (dryRun) {
    console.log('\n[dry-run] No transaction sent.');
    return;
  }

  console.log('\nSending claim tx via Privy server wallet...');
  const data = encodeFunctionData({
    abi: FEE_LOCKER_ABI,
    functionName: 'claim',
    args: [agentWallet, DIEM],
  });

  const hash = await privySend(appId, appSecret, walletId, FEE_LOCKER, data);
  console.log('tx:', hash);

  console.log('Waiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const diemAfter = await publicClient.readContract({
    address: DIEM, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentWallet],
  });

  console.log('\n✓ Claim complete');
  console.log('  status  :', receipt.status);
  console.log('  tx      :', hash);
  console.log('  DIEM    :', formatUnits(diemAfter, diemDecimals), '(balance after)');
  console.log('  claimed :', formatUnits(diemAfter - diemBefore, diemDecimals), 'DIEM');
}

main().catch(err => { console.error(err); process.exit(1); });
