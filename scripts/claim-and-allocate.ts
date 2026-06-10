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
 * Allocation logic (mode-independent — operator decision 2026-06-10):
 *   - Self-funding first: top up sDIEM toward the dynamic target
 *     (1.5× trailing 7d inference cost; scripts/lib/sdiem-target.ts)
 *   - Above target: stake only confirmed Venice demand from tool-routing.jsonl
 *   - LP the rest (single-sided into ETH/DIEM v3 1% pool, ≥ 0.1 DIEM)
 *
 * Mode (accumulate vs build) no longer changes the allocation — it governs what
 * inference does. Resolution: goals.json modeOverride → cost-indexed gate
 * (build iff sDIEM ≥ buildModeOnSelfFundingRatio × daily cost) → env/goals.
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
import { readGoals, readDailyInferenceCostUsd, resolveSdiemTarget } from './lib/sdiem-target.js';
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

// stakedInfos returns a struct; amountStaked is the first 32-byte word, which is
// all we decode (viem reads declared outputs from the head of the return data).
const STAKED_INFOS_ABI = [
  {
    type: 'function', name: 'stakedInfos', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'amountStaked', type: 'uint256' }],
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

/**
 * Mode resolution (operator decision 2026-06-10):
 *   1. goals.json modeOverride — explicit operator pin, wins over everything
 *   2. cost-indexed gate — build iff sDIEM ≥ buildModeOnSelfFundingRatio ×
 *      trailing 7d daily inference cost (goal-review reconciles goals.json
 *      `mode` with this gate weekly)
 *   3. AGENT_MODE env (executor export) → goals.json mode → accumulate
 */
function resolveMode(sdiemNow: number): 'accumulate' | 'build' {
  const goals = readGoals();
  if (goals.modeOverride === 'build' || goals.modeOverride === 'accumulate') {
    return goals.modeOverride;
  }
  const dailyCost = readDailyInferenceCostUsd();
  if (dailyCost !== null) {
    const ratioGate = goals.modeThresholds?.buildModeOnSelfFundingRatio ?? 2.0;
    return sdiemNow >= ratioGate * dailyCost ? 'build' : 'accumulate';
  }
  const env = process.env['AGENT_MODE'];
  if (env === 'accumulate' || env === 'build') return env;
  if (goals.mode === 'accumulate' || goals.mode === 'build') return goals.mode;
  return 'accumulate';
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

  const claimsPath = 'memory/diem-claims.jsonl';
  const toolRoutingPath = 'memory/tool-routing.jsonl';

  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  mkdirSync('memory', { recursive: true });

  console.log(`\n[claim-and-allocate] ${new Date().toISOString()}`);
  console.log(`dry-run=${dryRun}`);
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

  // ── 2. Self-funding allocation analysis ────────────────────────────

  const dailyRate = estimateDailyRate(claimsPath);
  const veniaDemand = estimateVeniceDemandDiem(toolRoutingPath);
  if (dailyRate > 0) console.log(`\nDaily DIEM rate: ${dailyRate.toFixed(4)} DIEM/day`);

  // Staked sDIEM (Venice inference credits) — both the stake top-up and the
  // build-mode gate depend on it.
  let sdiemNow = 0;
  try {
    const staked = await client.readContract({
      address: ADDRESSES.DIEM, abi: STAKED_INFOS_ABI,
      functionName: 'stakedInfos', args: [agentAddress],
    });
    sdiemNow = Number(formatUnits(staked, 18));
  } catch {
    console.warn('  ⚠ stakedInfos read failed — assuming 0 sDIEM staked');
  }

  const effectiveMode = resolveMode(sdiemNow);
  console.log(`Effective mode: ${effectiveMode}`);

  const totalDiemAfterClaim = claimable + diemWallet;

  // Self-funding first, in BOTH modes — a build-only stake would deadlock the
  // bootstrap (ratio 0 → accumulate → never stakes → ratio stays 0). Note
  // tool-routing demand reads ~0 while inference rides the direct fallback, so
  // the target — not observed demand — drives the top-up.
  const sdiemTarget = resolveSdiemTarget();
  const gapToTarget = Math.max(0, sdiemTarget - sdiemNow);
  const availableDiem = Number(formatUnits(totalDiemAfterClaim, 18));
  let stakeNeededDiem = Math.min(Math.max(veniaDemand, gapToTarget), availableDiem);
  if (stakeNeededDiem < 0.01) stakeNeededDiem = 0;  // skip dust stakes

  const stakeVenice = BigInt(Math.floor(stakeNeededDiem * 1e18));
  const remainder = totalDiemAfterClaim > stakeVenice ? totalDiemAfterClaim - stakeVenice : 0n;
  let lpDiem = 0n;
  let holdDiem = 0n;
  if (remainder >= LP_THRESHOLD_WEI) {
    lpDiem = remainder;
  } else {
    holdDiem = remainder;
  }
  const rationale = `sDIEM ${sdiemNow.toFixed(2)}/${sdiemTarget.toFixed(2)} target — stake ${formatUnits(stakeVenice, 18)} DIEM (gap ${gapToTarget.toFixed(2)}, demand ${veniaDemand.toFixed(3)}), LP ${formatUnits(lpDiem, 18)}, hold ${formatUnits(holdDiem, 18)} (${effectiveMode} mode)`;

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
