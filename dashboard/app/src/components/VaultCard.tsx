import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import Countdown from './Countdown';
import type { VaultState } from '../types';

interface VaultCardProps {
  vaultAddress: string;
  state: VaultState | null;
  loading: boolean;
}

function statusBadge(state: VaultState): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (!state.initialized) return 'NOT STARTED';
  if (now < state.depositDeadline) return 'OPEN';
  // Window closed. CONTRIBUTE sweeps to the agent (FINALIZED); STAKE keeps
  // deposits locked per-user until each staker's expiry (CLOSED).
  return state.mode === 'stake' ? 'CLOSED' : 'FINALIZED';
}

function badgeColor(badge: string): string {
  if (badge === 'OPEN') return 'bg-green-900 text-green-300';
  if (badge === 'FINALIZED') return 'bg-blue-900 text-blue-300';
  if (badge === 'CLOSED') return 'bg-purple-900 text-purple-300';
  return 'bg-gray-800 text-gray-400';
}

export default function VaultCard({ vaultAddress, state, loading }: VaultCardProps) {
  const short = `${vaultAddress.slice(0, 6)}…${vaultAddress.slice(-4)}`;

  if (loading) {
    return (
      <div className="border border-gray-700 rounded p-4 animate-pulse bg-gray-900">
        <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-24" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="border border-gray-700 rounded p-4 bg-gray-900">
        <p className="text-gray-500 text-sm font-mono">{short}</p>
        <p className="text-red-400 text-xs mt-1">Failed to load</p>
      </div>
    );
  }

  const badge = statusBadge(state);
  const modeLabel = state.mode === 'stake' ? 'STAKE' : 'CONTRIBUTE';

  return (
    <Link
      to={`/vault/${vaultAddress}`}
      className="block border border-gray-700 hover:border-gray-500 rounded p-4 bg-gray-900 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm text-gray-300">{short}</span>
        <span className={`text-xs px-2 py-0.5 rounded font-mono ${badgeColor(badge)}`}>{badge}</span>
      </div>
      <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
        <span>Mode: {modeLabel} ({state.depositTokenSymbol})</span>
        <span>Deposited: {formatUnits(state.totalDeposited, 18)} {state.depositTokenSymbol}</span>
        {state.initialized && state.depositDeadline > 0n && (
          <Countdown targetUnix={state.depositDeadline} label="Window" />
        )}
      </div>
    </Link>
  );
}
