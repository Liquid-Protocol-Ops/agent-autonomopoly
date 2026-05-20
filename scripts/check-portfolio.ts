/**
 * scripts/check-portfolio.ts
 *
 * Reads all agent positions on-chain via viem (not raw curl) and prints a status table.
 * Logs result to memory/logs/YYYY-MM-DD.md.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/check-portfolio.ts
 *   node --env-file=.env --import tsx scripts/check-portfolio.ts --no-log
 *
 * No wallet needed — read-only.
 */

import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import { writeFileSync, mkdirSync } from 'node:fs';
import { ADDRESSES } from '../platform/constants.js';

// ── ABIs ──────────────────────────────────────────────────────────────

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }] },
] as const;

const FEE_LOCKER_ABI = [{
  name: 'availableFees', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'feeOwner', type: 'address' }, { name: 'token', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }],
}] as const;

const NFPM_ABI = [{
  name: 'positions', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'tokenId', type: 'uint256' }],
  outputs: [
    { name: 'nonce', type: 'uint96' },
    { name: 'operator', type: 'address' },
    { name: 'token0', type: 'address' },
    { name: 'token1', type: 'address' },
    { name: 'fee', type: 'uint24' },
    { name: 'tickLower', type: 'int24' },
    { name: 'tickUpper', type: 'int24' },
    { name: 'liquidity', type: 'uint128' },
    { name: 'feeGrowthInside0LastX128', type: 'uint256' },
    { name: 'feeGrowthInside1LastX128', type: 'uint256' },
    { name: 'tokensOwed0', type: 'uint128' },
    { name: 'tokensOwed1', type: 'uint128' },
  ],
}, {
  name: 'balanceOf', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }],
}, {
  name: 'tokenOfOwnerByIndex', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
  outputs: [{ name: '', type: 'uint256' }],
}] as const;

const POOL_ABI = [{
  name: 'slot0', type: 'function', stateMutability: 'view',
  inputs: [],
  outputs: [
    { name: 'sqrtPriceX96', type: 'uint160' },
    { name: 'tick', type: 'int24' },
    { name: 'observationIndex', type: 'uint16' },
    { name: 'observationCardinality', type: 'uint16' },
    { name: 'observationCardinalityNext', type: 'uint16' },
    { name: 'feeProtocol', type: 'uint8' },
    { name: 'unlocked', type: 'bool' },
  ],
}] as const;

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const noLog = process.argv.includes('--no-log');
  const rpcUrl = process.env['RPC_URL'] ?? 'https://mainnet.base.org';
  const agent = (process.env['AGENT_WALLET'] ?? ADDRESSES.WETH) as Address; // fallback is wrong, just for type

  if (!process.env['AGENT_WALLET']) {
    throw new Error('AGENT_WALLET env var required');
  }
  const agentAddress = process.env['AGENT_WALLET'] as Address;

  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\nPortfolio check — ${today}`);
  console.log(`Agent: ${agentAddress}\n`);

  // ── Wallet balances ──────────────────────────────────────────────

  const [ethWei, wethBal, diemBal, svvvBal, vvvBal] = await Promise.all([
    client.getBalance({ address: agentAddress }),
    client.readContract({ address: ADDRESSES.WETH, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentAddress] }),
    client.readContract({ address: ADDRESSES.DIEM, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentAddress] }),
    client.readContract({ address: ADDRESSES.VVV_STAKING, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentAddress] }),
    client.readContract({ address: ADDRESSES.VVV, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentAddress] }),
  ]);

  const eth  = Number(formatUnits(ethWei, 18));
  const weth = Number(formatUnits(wethBal, 18));
  const diem = Number(formatUnits(diemBal, 18));
  const svvv = Number(formatUnits(svvvBal, 18));
  const vvv  = Number(formatUnits(vvvBal, 18));

  console.log('--- Wallet balances ---');
  console.log(`ETH:  ${eth.toFixed(6)}`);
  console.log(`WETH: ${weth.toFixed(4)}`);
  console.log(`DIEM: ${diem.toFixed(4)}`);
  console.log(`VVV:  ${vvv.toFixed(4)}`);
  console.log(`sVVV: ${svvv.toFixed(4)}`);

  // ── FeeLocker ─────────────────────────────────────────────────────

  const claimable = await client.readContract({
    address: ADDRESSES.FEE_LOCKER, abi: FEE_LOCKER_ABI,
    functionName: 'availableFees', args: [agentAddress, ADDRESSES.DIEM],
  });
  const claimableDiem = Number(formatUnits(claimable, 18));
  console.log(`\nFeeLocker: ${claimableDiem.toFixed(4)} DIEM claimable`);

  // ── Uniswap v3 LP positions ───────────────────────────────────────

  const nfpmBal = await client.readContract({
    address: ADDRESSES.NFPM_V3, abi: NFPM_ABI, functionName: 'balanceOf', args: [agentAddress],
  });

  console.log(`\nNFPM positions owned: ${nfpmBal}`);

  const lpRows: string[] = [];
  for (let i = 0n; i < nfpmBal; i++) {
    const tokenId = await client.readContract({
      address: ADDRESSES.NFPM_V3, abi: NFPM_ABI,
      functionName: 'tokenOfOwnerByIndex', args: [agentAddress, i],
    });

    const pos = await client.readContract({
      address: ADDRESSES.NFPM_V3, abi: NFPM_ABI,
      functionName: 'positions', args: [tokenId],
    });

    const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = pos;

    // Get current tick from pool
    const poolFee = fee;
    let currentTick: number | null = null;
    let inRange = false;
    try {
      // Derive pool address via factory (simplified: check ETH_DIEM pool directly)
      if (token1.toLowerCase() === ADDRESSES.DIEM.toLowerCase()) {
        const slot0 = await client.readContract({
          address: ADDRESSES.ETH_DIEM_V3, abi: POOL_ABI, functionName: 'slot0',
        });
        currentTick = slot0[1];
        inRange = currentTick > tickLower && currentTick < tickUpper;
      }
    } catch { /* pool read optional */ }

    const status = liquidity === 0n ? 'BURNED' : inRange ? 'IN RANGE ✓' : `OUT OF RANGE (tick ${currentTick})`;

    console.log(`\n  tokenId ${tokenId}:`);
    console.log(`    pair    : ${token0.slice(0,10)}.../${token1.slice(0,10)}... @ ${poolFee/10000}%`);
    console.log(`    range   : [${tickLower}, ${tickUpper}]  current: ${currentTick ?? '?'}  — ${status}`);
    console.log(`    liquidity: ${liquidity}`);
    console.log(`    owed0   : ${formatUnits(tokensOwed0, 18)} WETH`);
    console.log(`    owed1   : ${formatUnits(tokensOwed1, 18)} DIEM`);

    lpRows.push(`tokenId=${tokenId} range=[${tickLower},${tickUpper}] tick=${currentTick} liquidity=${liquidity} status=${status}`);
  }

  // ── Write log ─────────────────────────────────────────────────────

  if (noLog) return;

  mkdirSync('memory/logs', { recursive: true });
  const logPath = `memory/logs/${today}.md`;

  const lines = [
    `### on-chain check — ${today}`,
    ``,
    `**Agent wallet:** \`${agentAddress}\``,
    ``,
    `| Asset | Balance | Note |`,
    `|-------|---------|------|`,
    `| ETH | ${eth.toFixed(6)} | ${eth < 0.002 ? 'Low — top up recommended' : 'OK'} |`,
    `| DIEM | ${diem.toFixed(4)} | Wallet balance |`,
    `| VVV (loose) | ${vvv.toFixed(4)} | — |`,
    `| sVVV | ${svvv.toFixed(4)} | Venice API key ${svvv >= 1 ? 'active ✓' : 'INACTIVE — need ≥1 sVVV'} |`,
    ``,
    `**FeeLocker (\`${ADDRESSES.FEE_LOCKER}\`):**`,
    `- \`availableFees(agent, DIEM)\` → **${claimableDiem.toFixed(4)} DIEM** ${claimableDiem > 0 ? '← claimable' : '— nothing claimable yet'}`,
    ``,
    `**Uniswap v3 LP positions (${nfpmBal} total):**`,
    ...lpRows.map(r => `- ${r}`),
    ``,
    `**Action items:**`,
    eth < 0.002 ? `- [ ] Top up agent ETH for gas (~0.005 ETH recommended)` : `- [x] ETH gas OK`,
    claimableDiem > 0.1 ? `- [ ] Claim ${claimableDiem.toFixed(4)} DIEM from FeeLocker` : `- [x] FeeLocker negligible`,
    ``,
  ].join('\n');

  writeFileSync(logPath, lines);
  console.log(`\nSaved to ${logPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
