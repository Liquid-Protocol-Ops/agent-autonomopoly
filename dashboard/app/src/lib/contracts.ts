import { type Address } from 'viem';
import { makePublicClient } from './chain';
import type { LockTier, PresaleMode, VaultState } from '../types';

// Known deposit tokens on Base (used only as a display fallback if the ERC-20
// `symbol()` read fails; the on-chain symbol is preferred).
export const VVV_ADDRESS  = '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as const;
export const DIEM_ADDRESS = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024' as const;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Unified read ABI for LiquidPresaleVault — covers both CONTRIBUTE and STAKE
// modes. Mirrors the canonical website ABI (contracts/presale/src/LiquidPresaleVault.sol).
export const VAULT_READ_ABI = [
  { name: 'mode',                  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'depositToken',          type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'agentWallet',           type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'token',                 type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'totalTokenSupply',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'depositDeadline',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'initialized',           type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'totalDeposited',        type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalWeight',           type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'deposited',             type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'weight',                type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'chosenLock',            type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'tokensClaimed',         type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'depositTokenWithdrawn', type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'lockExpiryOf',          type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'lockTiers',             type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'durations', type: 'uint256[]' }, { name: 'multipliers', type: 'uint256[]' }] },
  { name: 'getShare',              type: 'function', stateMutability: 'view', inputs: [{ name: 'who', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

export const VAULT_WRITE_ABI = [
  // CONTRIBUTE deposit (no lock)
  { name: 'deposit',              type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  // STAKE deposit (with lock tier duration)
  { name: 'deposit',              type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'lockDuration_', type: 'uint256' }], outputs: [] },
  { name: 'claimTokens',          type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'withdrawDepositToken', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'finalizeVVV',          type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'sweepUnallocated',     type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;

export const ERC20_ABI = [
  { name: 'approve',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner',   type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'symbol',    type: 'function', stateMutability: 'view',       inputs: [], outputs: [{ type: 'string' }] },
] as const;

function fallbackSymbol(depositToken: Address): string {
  if (depositToken.toLowerCase() === VVV_ADDRESS.toLowerCase()) return 'VVV';
  if (depositToken.toLowerCase() === DIEM_ADDRESS.toLowerCase()) return 'DIEM';
  return 'TOKEN';
}

export async function readVaultState(
  vaultAddress: Address,
  userAddress?: Address,
): Promise<VaultState> {
  const client = makePublicClient();

  const rc = <T>(fn: string, args?: unknown[]) =>
    client.readContract({
      address: vaultAddress,
      abi: VAULT_READ_ABI,
      functionName: fn as never,
      args: (args ?? []) as never,
    }) as Promise<T>;

  const erc = <T>(fn: string, tokenAddr: Address, args: unknown[]) =>
    client.readContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: fn as never,
      args: args as never,
    }) as Promise<T>;

  const [modeRaw, depositToken, agentWallet, token, totalTokenSupply,
         depositDeadline, initialized, totalDeposited, totalWeight, tiersRaw] =
    await Promise.all([
      rc<number>('mode'),
      rc<Address>('depositToken'),
      rc<Address>('agentWallet'),
      rc<Address>('token').catch(() => ZERO_ADDRESS as Address),
      rc<bigint>('totalTokenSupply'),
      rc<bigint>('depositDeadline'),
      rc<boolean>('initialized'),
      rc<bigint>('totalDeposited'),
      rc<bigint>('totalWeight'),
      rc<readonly [readonly bigint[], readonly bigint[]]>('lockTiers')
        .catch(() => [[], []] as unknown as readonly [readonly bigint[], readonly bigint[]]),
    ]);

  const mode: PresaleMode = Number(modeRaw) === 1 ? 'stake' : 'contribute';

  const [durations, multipliers] = tiersRaw;
  const lockTiers: LockTier[] = durations.map((duration, i) => ({
    duration,
    multiplier: multipliers[i] ?? 1n,
  }));

  const depositTokenSymbol = await erc<string>('symbol', depositToken, [])
    .catch(() => fallbackSymbol(depositToken));

  let myDeposited:  bigint  | undefined;
  let myWeight:     bigint  | undefined;
  let myChosenLock: bigint  | undefined;
  let myLockExpiry: bigint  | undefined;
  let myClaimed:    boolean | undefined;
  let myWithdrawn:  boolean | undefined;
  let myShare:      bigint  | undefined;
  let myBalance:    bigint  | undefined;
  let myAllowance:  bigint  | undefined;

  if (userAddress) {
    [myDeposited, myWeight, myChosenLock, myLockExpiry, myClaimed,
     myWithdrawn, myShare, myBalance, myAllowance] = await Promise.all([
      rc<bigint>('deposited',             [userAddress]),
      rc<bigint>('weight',                [userAddress]),
      rc<bigint>('chosenLock',            [userAddress]),
      rc<bigint>('lockExpiryOf',          [userAddress]),
      rc<boolean>('tokensClaimed',        [userAddress]),
      rc<boolean>('depositTokenWithdrawn',[userAddress]),
      rc<bigint>('getShare',              [userAddress]),
      erc<bigint>('balanceOf', depositToken, [userAddress]),
      erc<bigint>('allowance', depositToken, [userAddress, vaultAddress]),
    ]);
  }

  return {
    address: vaultAddress,
    mode,
    depositToken,
    depositTokenSymbol,
    agentWallet,
    token,
    initialized,
    depositDeadline,
    totalDeposited,
    totalTokenSupply,
    totalWeight,
    lockTiers,
    ...(myDeposited  !== undefined && { myDeposited }),
    ...(myWeight     !== undefined && { myWeight }),
    ...(myChosenLock !== undefined && { myChosenLock }),
    ...(myLockExpiry !== undefined && { myLockExpiry }),
    ...(myClaimed    !== undefined && { myClaimed }),
    ...(myWithdrawn  !== undefined && { myWithdrawn }),
    ...(myShare      !== undefined && { myShare }),
    ...(myBalance    !== undefined && { myBalance }),
    ...(myAllowance  !== undefined && { myAllowance }),
  };
}
