// Canonical presale contract: LiquidPresaleVault (MOG-497).
// Modes mirror the Solidity enum: Contribute (0) = VVV, permanent sweep to agent;
// Stake (1) = DIEM, time-locked, returned in full at lock expiry.
export type PresaleMode = 'contribute' | 'stake';

export interface PresaleEntry {
  vaultAddress: string;
  deployedAt: string;
  agentWallet?: string;
  contract?: string;
  /** Optional mode hint from the export; chain `mode()` read is authoritative. */
  mode?: PresaleMode;
  token?: string;
  depositTokenSymbol?: string;
}

export interface LockTier {
  duration: bigint;   // seconds
  multiplier: bigint; // weight multiplier (e.g. 1, 2, 3)
}

export interface VaultState {
  address: `0x${string}`;
  mode: PresaleMode;
  depositToken: `0x${string}`;
  depositTokenSymbol: string;
  agentWallet: `0x${string}`;
  token: `0x${string}`;
  initialized: boolean;

  depositDeadline: bigint;
  totalDeposited: bigint;
  totalTokenSupply: bigint;

  // STAKE-only aggregates (0 / empty in CONTRIBUTE mode).
  totalWeight: bigint;
  lockTiers: LockTier[];

  // Per-connected-wallet position (undefined when no wallet).
  myDeposited?: bigint;
  myWeight?: bigint;
  myChosenLock?: bigint;   // tier duration the user locked into (STAKE)
  myLockExpiry?: bigint;   // personal unlock timestamp (STAKE)
  myClaimed?: boolean;
  myWithdrawn?: boolean;
  myShare?: bigint;
  myBalance?: bigint;
  myAllowance?: bigint;
}
