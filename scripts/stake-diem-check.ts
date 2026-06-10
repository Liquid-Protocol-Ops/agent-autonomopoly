/**
 * scripts/stake-diem-check.ts — deterministic sDIEM safety net (no LLM).
 *
 * Runs in the script_only workflow path (see .github/workflows/aeon.yml).
 * Read-only on-chain: compares staked sDIEM against the resolved target and,
 * when low with ≥ 1 liquid wallet DIEM available, queues a stake-diem intent
 * for the gated executor. This step never signs — scripts/execute-intents.ts
 * (the signing chokepoint) re-validates and runs the stake.
 *
 * Catches sDIEM drift between claim-and-allocate runs; claim routing itself
 * stays claim-and-allocate's job.
 */

import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { ADDRESSES } from '../platform/constants.js';
import { validateIntent } from './lib/intent-allowlist.js';
import { readGoals, resolveSdiemTarget } from './lib/sdiem-target.js';

const PENDING = 'memory/pending-actions.jsonl';

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

function logLine(line: string): void {
  mkdirSync('memory/logs', { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  appendFileSync(`memory/logs/${today}.md`, line + '\n');
}

function notify(text: string): void {
  try {
    mkdirSync('.pending-notify', { recursive: true });
    writeFileSync(`.pending-notify/${Math.floor(Date.now() / 1000)}-stake-diem.md`, text);
  } catch { /* notification is best-effort */ }
}

async function main(): Promise<void> {
  const agentAddress = (process.env['AGENT_WALLET'] ?? readGoals().agentWallet) as Address | undefined;
  if (!agentAddress) throw new Error('AGENT_WALLET env var (or goals.json agentWallet) required');
  const rpcUrl = process.env['RPC_URL'] ?? 'https://mainnet.base.org';

  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  const [stakedWei, walletWei] = await Promise.all([
    client.readContract({
      address: ADDRESSES.DIEM, abi: STAKED_INFOS_ABI,
      functionName: 'stakedInfos', args: [agentAddress],
    }),
    client.readContract({
      address: ADDRESSES.DIEM, abi: ERC20_ABI,
      functionName: 'balanceOf', args: [agentAddress],
    }),
  ]);

  const staked = Number(formatUnits(stakedWei, 18));
  const wallet = Number(formatUnits(walletWei, 18));
  const target = resolveSdiemTarget();

  if (staked >= target) {
    console.log(`STAKE_DIEM_OK (staked=${staked.toFixed(4)}, target=${target.toFixed(2)})`);
    return;
  }

  // scripts/stake-diem.ts refuses to stake below 1 DIEM (dust guard)
  if (wallet < 1) {
    const msg = `stake-diem: SKIP — sDIEM ${staked.toFixed(4)} < target ${target.toFixed(2)} but wallet DIEM ${wallet.toFixed(4)} below 1; next claim-and-allocate routes the gap`;
    console.log(msg);
    logLine(msg);
    if (staked === 0) {
      notify(`⚠️ stake-diem: sDIEM is 0 (no Venice inference credits) and wallet DIEM ${wallet.toFixed(4)} is below the 1-DIEM stake minimum. Gap fills at the next FeeLocker claim.`);
    }
    return;
  }

  validateIntent('stake-diem', []);
  mkdirSync('memory', { recursive: true });
  appendFileSync(
    PENDING,
    JSON.stringify({ action: 'stake-diem', flags: [], queuedAt: new Date().toISOString() }) + '\n',
  );
  const msg = `stake-diem: intent queued | sDIEM ${staked.toFixed(4)} < target ${target.toFixed(2)} | wallet DIEM to stake: ${wallet.toFixed(4)}`;
  console.log(msg);
  logLine(msg);
  notify(`stake-diem: sDIEM ${staked.toFixed(4)} below target ${target.toFixed(2)} — queued stake of ${wallet.toFixed(4)} wallet DIEM for the gated executor.`);
}

main().catch(err => { console.error(err); process.exit(1); });
