import { useState } from 'react';
import { encodeFunctionData, parseUnits, formatUnits, type Address } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import type { ConnectedWallet } from '@privy-io/react-auth';
import { sendAndWait } from '../lib/wallet';
import { VAULT_WRITE_ABI, ERC20_ABI } from '../lib/contracts';
import type { VaultState } from '../types';

interface ActionPanelProps {
  vault: VaultState;
  wallet: ConnectedWallet | null;
  onDone: () => void; // caller refreshes vault state after tx
}

export default function ActionPanel({ vault, wallet, onDone }: ActionPanelProps) {
  const { login } = usePrivy();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isStake = vault.mode === 'stake';

  // First-deposit tier selection (STAKE only). Once a user has deposited, the
  // tier is locked in on-chain (chosenLock) and reused automatically.
  const lockedTier = vault.myChosenLock !== undefined && vault.myChosenLock > 0n
    ? vault.myChosenLock
    : undefined;
  const defaultTier = vault.lockTiers[0]?.duration;
  const [tier, setTier] = useState<bigint | undefined>(lockedTier ?? defaultTier);
  const effectiveTier = lockedTier ?? tier;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const windowOpen = vault.initialized && now < vault.depositDeadline;
  const windowClosed = vault.initialized && now >= vault.depositDeadline;
  const lockExpired =
    isStake && vault.myLockExpiry !== undefined && vault.myLockExpiry > 0n && now >= vault.myLockExpiry;

  const canDeposit = windowOpen;
  const canClaim = windowClosed && vault.myDeposited !== undefined && vault.myDeposited > 0n && !vault.myClaimed;
  const canFinalize = !isStake && windowClosed;
  const canWithdraw = isStake && lockExpired && vault.myDeposited !== undefined && vault.myDeposited > 0n && !vault.myWithdrawn;

  async function run(buildData: () => `0x${string}`, to: Address, label: string) {
    if (!wallet) return;
    setError(null);
    setStatus(`${label}…`);
    try {
      const data = buildData();
      await sendAndWait(wallet, to, data, setStatus);
      setStatus(`${label} confirmed`);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus(null);
    }
  }

  async function handleApprove() {
    const amountWei = parseUnits(amount || '0', 18);
    if (amountWei === 0n) return;
    await run(
      () => encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [vault.address, amountWei] }),
      vault.depositToken,
      'Approve',
    );
  }

  async function handleDeposit() {
    const amountWei = parseUnits(amount || '0', 18);
    if (amountWei === 0n) return;
    if (isStake) {
      if (effectiveTier === undefined) {
        setError('Select a lock tier first');
        return;
      }
      const lockTier = effectiveTier;
      await run(
        () => encodeFunctionData({ abi: VAULT_WRITE_ABI, functionName: 'deposit', args: [amountWei, lockTier] }),
        vault.address,
        'Deposit',
      );
    } else {
      await run(
        () => encodeFunctionData({ abi: VAULT_WRITE_ABI, functionName: 'deposit', args: [amountWei] }),
        vault.address,
        'Deposit',
      );
    }
  }

  async function handleClaim() {
    await run(
      () => encodeFunctionData({ abi: VAULT_WRITE_ABI, functionName: 'claimTokens', args: [] }),
      vault.address,
      'Claim tokens',
    );
  }

  async function handleFinalize() {
    await run(
      () => encodeFunctionData({ abi: VAULT_WRITE_ABI, functionName: 'finalizeVVV', args: [] }),
      vault.address,
      'Finalize',
    );
  }

  async function handleWithdraw() {
    await run(
      () => encodeFunctionData({ abi: VAULT_WRITE_ABI, functionName: 'withdrawDepositToken', args: [] }),
      vault.address,
      'Withdraw',
    );
  }

  if (!wallet) {
    return (
      <button
        onClick={login}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded font-mono"
      >
        [ CONNECT WALLET ]
      </button>
    );
  }

  const amountWei = amount ? parseUnits(amount, 18) : 0n;
  const needsApproval = canDeposit && amountWei > 0n && (vault.myAllowance ?? 0n) < amountWei;

  return (
    <div className="space-y-3">
      {canDeposit && (
        <div className="space-y-2">
          {isStake && lockedTier === undefined && vault.lockTiers.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Lock tier</label>
              <select
                value={effectiveTier !== undefined ? effectiveTier.toString() : ''}
                onChange={e => setTier(BigInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-gray-400"
              >
                {vault.lockTiers.map(t => (
                  <option key={t.duration.toString()} value={t.duration.toString()}>
                    {Number(t.duration) / 86400}d — {Number(t.multiplier)}× weight
                  </option>
                ))}
              </select>
            </div>
          )}
          {isStake && lockedTier !== undefined && (
            <p className="text-xs text-gray-500">
              Locked tier: {Number(lockedTier) / 86400}d (reused for additional deposits)
            </p>
          )}
          <label className="text-xs text-gray-400">
            Deposit amount ({vault.depositTokenSymbol})
            {vault.myBalance !== undefined && (
              <span className="ml-2 text-gray-500">
                Balance: {formatUnits(vault.myBalance, 18)}
              </span>
            )}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            {needsApproval && (
              <button
                onClick={handleApprove}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded font-mono"
              >
                [ APPROVE ]
              </button>
            )}
            <button
              onClick={handleDeposit}
              disabled={needsApproval || amountWei === 0n || (isStake && effectiveTier === undefined)}
              className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm py-2 px-4 rounded font-mono"
            >
              [ DEPOSIT ]
            </button>
          </div>
        </div>
      )}

      {canClaim && (
        <button
          onClick={handleClaim}
          className="w-full bg-green-700 hover:bg-green-600 text-white text-sm py-2 px-4 rounded font-mono"
        >
          [ CLAIM TOKENS ]
          {vault.myShare !== undefined && vault.myShare > 0n && (
            <span className="ml-2 text-green-300 text-xs">
              ({formatUnits(vault.myShare, 18)})
            </span>
          )}
        </button>
      )}

      {canFinalize && (
        <button
          onClick={handleFinalize}
          className="w-full bg-yellow-700 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded font-mono"
        >
          [ FINALIZE → AGENT ]
        </button>
      )}

      {canWithdraw && (
        <button
          onClick={handleWithdraw}
          className="w-full bg-purple-700 hover:bg-purple-600 text-white text-sm py-2 px-4 rounded font-mono"
        >
          [ WITHDRAW {vault.depositTokenSymbol} ]
          {vault.myDeposited !== undefined && (
            <span className="ml-2 text-purple-300 text-xs">
              ({formatUnits(vault.myDeposited, 18)})
            </span>
          )}
        </button>
      )}

      {status && <p className="text-xs text-blue-300 font-mono">{status}</p>}
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
