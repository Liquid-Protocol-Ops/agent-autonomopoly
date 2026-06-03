/**
 * scripts/claim-and-allocate.ts
 *
 * Claim DIEM from FeeLocker, run accumulate-vs-build analysis, route earnings.
 *
 * DRY-RUN BY DEFAULT — transactions only execute with --live flag.
 * This is the scheduled skill backing `claim-diem` in aeon.yml (every 12 hours).
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/claim-and-allocate.ts           # dry-run
 *   node --env-file=.env --import tsx scripts/claim-and-allocate.ts --live    # execute
 *
 * Allocation logic (accumulate mode):
 *   - All claimed DIEM >= threshold → single-sided LP into ETH/DIEM v3 1% pool
 *   - WETH buffer: if wallet WETH < 0.005 ETH, skip this run (gas reserve)
 *
 * Allocation logic (build mode, AGENT_MODE=build):
 *   - Estimate Opus inference demand from memory/tool-routing.jsonl (last 7 days)
 *   - Stake minimum DIEM for confirmed Venice demand
 *   - LP the rest
 *
 * Logs to memory/diem-claims.jsonl on successful claim.
 */

import {
  createPublicClient,
  http,
  formatUnits,
  encodeFunctionData,
  type Address,
} from 'viem';
import { base } from 'viem/chains';
import { appendFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { ADDRESSES } from '../platform/constants.js';
import { reinvestToLP } from '../harness/providers/liquidity.js';
import {
  loadPrivyConfig,
  loadSignerFromPrivy,
  makeTxSenderFromPrivy,
  loadSignerFromEnv,
  makeTxSenderFromEnv,
  type TxSender,
} from '../harness/safety/wallet.js';

// ── Config ──────────────────────────────────────────────────────────

const LP_THRESHOLD_WEI  = 100_000_000_000_000_000n;  // 0.1 DIEM minimum to LP
const WETH_GAS_RESERVE  = 3_000_000_000_000_000n;     // 0.003 ETH minimum gas reserve
const BUILD_DAILY_THRESHOLD = 0.5;  // DIEM/day needed to promote to build mode

// ── ABIs ───────────────────────────────────────────────────────────

const FEE_LOCKER_ABI = [
  {
    type: 'function', name: 'availableFees', stateMutability: 'view',
    inputs: [{ name: 'feeOwner', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'claim', stateMutability: 'nonpayable',
    inputs: [{ name: 'feeOwner', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [],
  },
] as const;

const ERC20_ABI = [
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────

type ClaimEntry = {
  date:       string;
  timestamp:  number;
  amountWei:  string;
  amountDiem: string;
  mode:       string;
  allocation: AllocationDecision;
  dryRun:     boolean;
  lpTxHash?:  string;
  claimTxHash?: string;
};

type AllocationDecision = {
  mode:           'accumulate' | 'build';
  totalDiem:      string;
  lpDiem:         string;
  stakeVenice:    string;
  hold:           string;
  rationale:      string;
  dailyRateEst:   string;
};

/** Average daily DIEM rate from last N claim entries */
function estimateDailyRate(claimsPath: string, days = 7): number {
  if (!existsSync(claimsPath)) return 0;
  const entries = readFileSync(claimsPath, 'utf8')
    .split('\n').filter(Boolean)
    .map(l => JSON.parse(l) as ClaimEntry)
    .filter(e => !e.dryRun)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  if (entries.length < 2) return 0;

  const oldest = entries[entries.length - 1]!;
  const newest = entries[0]!;
  const elapsedDays = (newest.timestamp - oldest.timestamp) / 86400;
  if (elapsedDays < 0.01) return 0;

  const totalDiem = entries.reduce((s, e) => s + parseFloat(e.amountDiem), 0);
  return totalDiem / elapsedDays;
}

/** Estimate Venice Opus demand from tool-routing.jsonl */
function estimateVeniceDemandDiem(toolRoutingPath: string): number {
  if (!existsSync(toolRoutingPath)) return 0;
  const lines = readFileSync(toolRoutingPath, 'utf8')
    .split('\n').filter(Boolean)
    .slice(-500);  // last 500 calls

  let totalCostDiem = 0;
  for (const line of lines) {
    try {
      // venice.ts emits entries with the model under `variant` (e.g. ":claude-opus-4-7"), not `model`
      const entry = JSON.parse(line) as { variant?: string; cost_diem?: number };
      if (entry.variant?.includes('opus') && entry.cost_diem) {
        totalCostDiem += entry.cost_diem;
      }
    } catch { /* skip */ }
  }
  return totalCostDiem;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const live   = process.argv.includes('--live');
  const dryRun = !live;

  const rpcUrl = process.env['RPC_URL'] ?? 'https://mainnet.base.org';
  const agentAddress = process.env['AGENT_WALLET'] as Address | undefined;
  if (!agentAddress) throw new Error('AGENT_WALLET env var required');

  const agentMode = (process.env['AGENT_MODE'] ?? 'accumulate') as 'accumulate' | 'build';
  const claimsPath = 'memory/diem-claims.jsonl';
  const toolRoutingPath = 'memory/tool-routing.jsonl';

  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  mkdirSync('memory', { recursive: true });

  console.log(`\n[claim-and-allocate] ${new Date().toISOString()}`);
  console.log(`mode=${agentMode}  dry-run=${dryRun}`);
  if (dryRun) console.log('  (pass --live to execute transactions)\n');

  // ── 1. Read current state ──────────────────────────────────────────

  const [claimable, diemWallet, ethWei] = await Promise.all([
    client.readContract({
      address: ADDRESSES.FEE_LOCKER, abi: FEE_LOCKER_ABI,
      functionName: 'availableFees', args: [agentAddress, ADDRESSES.DIEM],
    }),
    client.readContract({
      address: ADDRESSES.DIEM, abi: ERC20_ABI,
      functionName: 'balanceOf', args: [agentAddress],
    }),
    client.getBalance({ address: agentAddress }),
  ]);

  console.log(`FeeLocker claimable : ${formatUnits(claimable, 18)} DIEM`);
  console.log(`Wallet DIEM         : ${formatUnits(diemWallet, 18)} DIEM`);
  console.log(`Wallet ETH          : ${formatUnits(ethWei, 18)} ETH`);

  const gasSponsored = Boolean(process.env['PRIVY_GAS_POLICY_ID']);
  if (ethWei < WETH_GAS_RESERVE) {
    if (gasSponsored) {
      console.log(`ETH balance (${formatUnits(ethWei, 18)}) below reserve — gas sponsored via Privy policy, continuing.`);
    } else {
      console.warn(`\n⚠  ETH balance (${formatUnits(ethWei, 18)}) below gas reserve (${formatUnits(WETH_GAS_RESERVE, 18)})`);
      console.warn('   Top up agent wallet or set PRIVY_GAS_POLICY_ID to sponsor gas.');
      if (!dryRun) {
        console.error('Aborting live run — insufficient gas reserve.');
        process.exit(1);
      }
    }
  }

  if (claimable === 0n && diemWallet < LP_THRESHOLD_WEI) {
    console.log('\nNothing to claim and no wallet DIEM above threshold. Done.');
    return;
  }

  // ── 2. Accumulate vs build analysis ───────────────────────────────

  const dailyRate = estimateDailyRate(claimsPath);
  const veniaDemand = estimateVeniceDemandDiem(toolRoutingPath);

  // Determine effective mode (env var can be overridden by daily rate)
  let effectiveMode: 'accumulate' | 'build' = agentMode;
  if (dailyRate >= BUILD_DAILY_THRESHOLD && agentMode === 'accumulate') {
    effectiveMode = 'build';
    console.log(`\n⇧ Daily rate ${dailyRate.toFixed(4)} DIEM/day ≥ threshold ${BUILD_DAILY_THRESHOLD} → auto-promoting to build mode`);
  } else if (dailyRate > 0) {
    console.log(`\nDaily DIEM rate: ${dailyRate.toFixed(4)} DIEM/day (threshold: ${BUILD_DAILY_THRESHOLD})`);
  }

  const totalDiemAfterClaim = claimable + diemWallet;

  let stakeVenice = 0n;
  let lpDiem = 0n;
  let holdDiem = 0n;
  let rationale = '';

  if (effectiveMode === 'accumulate') {
    // Accumulate: LP everything above threshold
    if (totalDiemAfterClaim >= LP_THRESHOLD_WEI) {
      lpDiem = totalDiemAfterClaim;
      rationale = `Accumulate mode: all ${formatUnits(lpDiem, 18)} DIEM → ETH/DIEM v3 1% LP (highest yield)`;
    } else {
      holdDiem = totalDiemAfterClaim;
      rationale = `${formatUnits(holdDiem, 18)} DIEM below ${formatUnits(LP_THRESHOLD_WEI, 18)} threshold — holding`;
    }
  } else {
    // Build mode: stake minimum for Venice, LP the rest
    // 1 DIEM staked ≈ $1/day inference budget. Opus 4.7 ≈ 0.027 DIEM/call.
    // Stake only confirmed demand from tool-routing.jsonl.
    const stakeNeededDiem = Math.min(veniaDemand, Number(formatUnits(totalDiemAfterClaim, 18)) * 0.3);
    stakeVenice = BigInt(Math.floor(stakeNeededDiem * 1e18));
    lpDiem = totalDiemAfterClaim > stakeVenice ? totalDiemAfterClaim - stakeVenice : 0n;
    holdDiem = totalDiemAfterClaim > stakeVenice + lpDiem ? totalDiemAfterClaim - stakeVenice - lpDiem : 0n;
    rationale = `Build mode: stake ${formatUnits(stakeVenice, 18)} DIEM for Venice Opus (${veniaDemand.toFixed(3)} DIEM demand last ${500} calls), LP ${formatUnits(lpDiem, 18)} DIEM`;
  }

  const allocation: AllocationDecision = {
    mode:         effectiveMode,
    totalDiem:    formatUnits(totalDiemAfterClaim, 18),
    lpDiem:       formatUnits(lpDiem, 18),
    stakeVenice:  formatUnits(stakeVenice, 18),
    hold:         formatUnits(holdDiem, 18),
    rationale,
    dailyRateEst: dailyRate.toFixed(6),
  };

  console.log(`\n── Allocation decision ──`);
  console.log(`Mode      : ${effectiveMode}`);
  console.log(`Total DIEM: ${allocation.totalDiem}`);
  console.log(`→ LP      : ${allocation.lpDiem} DIEM`);
  console.log(`→ Stake   : ${allocation.stakeVenice} DIEM`);
  console.log(`→ Hold    : ${allocation.hold} DIEM`);
  console.log(`Rationale : ${rationale}`);

  if (dryRun) {
    console.log('\n[dry-run] Transactions simulated. No on-chain state changed.');
    console.log('[dry-run] Re-run with --live to execute.\n');

    // Log dry-run entry for auditability
    const entry: ClaimEntry = {
      date:       new Date().toISOString().slice(0, 10),
      timestamp:  Date.now() / 1000,
      amountWei:  claimable.toString(),
      amountDiem: formatUnits(claimable, 18),
      mode:       effectiveMode,
      allocation,
      dryRun:     true,
    };
    appendFileSync(claimsPath, JSON.stringify(entry) + '\n');
    return;
  }

  // ── 3. Load wallet ────────────────────────────────────────────────

  let txSender: TxSender;
  if (process.env['PRIVY_APP_ID']) {
    const cfg = loadPrivyConfig();
    txSender = makeTxSenderFromPrivy(cfg);
  } else {
    txSender = makeTxSenderFromEnv(rpcUrl);
  }

  // ── 4. Claim DIEM from FeeLocker ──────────────────────────────────

  let claimTxHash: string | undefined;
  if (claimable > 0n) {
    console.log(`\nStep 1: claim ${formatUnits(claimable, 18)} DIEM from FeeLocker...`);
    const data = encodeFunctionData({
      abi: FEE_LOCKER_ABI, functionName: 'claim',
      args: [agentAddress, ADDRESSES.DIEM],
    });
    const hash = await txSender({ to: ADDRESSES.FEE_LOCKER, data });
    claimTxHash = hash;
    console.log(`  tx: ${hash}`);
    await client.waitForTransactionReceipt({ hash });
    console.log(`  ✓ claimed`);
  } else {
    console.log('\nStep 1: FeeLocker empty, skipping claim');
  }

  // ── 5. Route DIEM per allocation ─────────────────────────────────

  let lpTxHash: string | undefined;

  if (stakeVenice > 0n) {
    console.log(`\nStep 2a: stake ${formatUnits(stakeVenice, 18)} DIEM on Venice...`);
    // DIEM contract is also the Venice staking contract — stake(uint256) directly
    const stakeAbi = [{
      name: 'stake', type: 'function', stateMutability: 'nonpayable',
      inputs: [{ name: 'amount', type: 'uint256' }], outputs: [],
    }] as const;
    const stakeData = encodeFunctionData({ abi: stakeAbi, functionName: 'stake', args: [stakeVenice] });
    const stakeHash = await txSender({ to: ADDRESSES.DIEM, data: stakeData });
    console.log(`  tx: ${stakeHash}`);
    await client.waitForTransactionReceipt({ hash: stakeHash });
    console.log(`  ✓ staked`);
  }

  if (lpDiem >= LP_THRESHOLD_WEI) {
    const stepNum = stakeVenice > 0n ? '2b' : '2';
    console.log(`\nStep ${stepNum}: LP ${formatUnits(lpDiem, 18)} DIEM into ETH/DIEM v3 1% pool...`);
    const result = await reinvestToLP(rpcUrl, agentAddress, lpDiem, 'medium', txSender);
    lpTxHash = result.mintTxHash;
    console.log(`  ✓ LP minted | range=[${result.tickLower},${result.tickUpper}] tick=${result.currentTick}`);
  }

  // ── 6. Log to diem-claims.jsonl ───────────────────────────────────

  const entry: ClaimEntry = {
    date:       new Date().toISOString().slice(0, 10),
    timestamp:  Date.now() / 1000,
    amountWei:  claimable.toString(),
    amountDiem: formatUnits(claimable, 18),
    mode:       effectiveMode,
    allocation,
    dryRun:     false,
    ...(claimTxHash !== undefined && { claimTxHash }),
    ...(lpTxHash !== undefined && { lpTxHash }),
  };
  appendFileSync(claimsPath, JSON.stringify(entry) + '\n');
  console.log(`\n✓ Done. Logged to ${claimsPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
