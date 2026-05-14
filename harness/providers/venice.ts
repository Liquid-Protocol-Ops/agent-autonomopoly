// Venice provider — claim LP DIEM fees → mint Venice API key → call inference.
//
// Required env vars:
//   DIEM_TOKEN_ADDRESS     — Liquid Protocol DIEM ERC-20 on Base mainnet (fee token)
//   VVV_STAKING_ADDRESS    — Venice VVV staking contract on Base (sVVV balance gates key mint)
//                            Fallback alias: VENICE_STAKING_ADDRESS
//   RPC_URL                — Base mainnet JSON-RPC endpoint
//
// Optional env vars:
//   VENICE_API_KEY           — Skip autonomous key mint; use this key directly (MVP fast path)
//   VENICE_STAKE_THRESHOLD   — min sVVV wei before Venice key mint triggers (default: 1e18 = 1 VVV)
//   VENICE_BEARER_CACHE_PATH — where to persist the minted key (default: memory/venice-bearer.json)
//   VENICE_API_BASE          — Venice API base URL (default: https://api.venice.ai/api/v1)
//   VENICE_MODEL             — inference model slug (default: llama-3.3-70b)
//
// Venice two-step model:
//   • API key mint  — requires sVVV balance (staked VVV); one-time per agent
//   • Inference spend — draws from Venice DIEM credits (earned via VVV staking); separate from LP DIEM
//
// Key mint flow: GET /api_keys/generate_web3_key → personal_sign(token) → POST /api_keys/generate_web3_key
//
// On-chain write functions accept a TxSender (from wallet.ts), abstracting the signing substrate.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import {
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';
import { ADDRESSES } from '../../platform/constants.js';
import { assertAllowed } from '../safety/allowlist.js';
import { emit, type ToolRoutingEntry } from '../observability/tool-routing.js';
import type { Signer, TxSender } from '../safety/wallet.js';

// ── Minimal ABIs ────────────────────────────────────────────────────

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
  {
    type: 'function', name: 'decimals',
    inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view',
  },
] as const;

// sVVV balance — Venice staking contract balanceOf
const SVVV_ABI = [
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view',
  },
] as const;

// ── Model constants ──────────────────────────────────────────────────

export const FAST_MODEL = 'llama-3.3-70b';
export const REASONING_MODEL = 'claude-opus-4-7';

// DIEM per 1M tokens (Venice rates, 2026-05). llama is free under VVV staking.
const DIEM_PRICE: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 6, output: 30 },
  'llama-3.3-70b':   { input: 0, output: 0 },
};

function diemCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = DIEM_PRICE[model] ?? { input: 0, output: 0 };
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

// ── Config ──────────────────────────────────────────────────────────

export type VeniceConfig = {
  diemAddress: Address;
  stakingAddress: Address;  // VVV staking contract — balanceOf = sVVV balance
  rpcUrl: string;
  stakeThreshold: bigint;   // min sVVV wei (default: 1e18 = 1 VVV)
  bearerCachePath: string;
  veniceApiBase: string;
  model: string;
};

export function loadConfig(): VeniceConfig {
  const diemAddress = process.env['DIEM_TOKEN_ADDRESS'];
  const stakingAddress = process.env['VVV_STAKING_ADDRESS'] ?? process.env['VENICE_STAKING_ADDRESS'];
  const rpcUrl = process.env['RPC_URL'];
  if (!diemAddress) throw new Error('DIEM_TOKEN_ADDRESS is required');
  if (!stakingAddress) throw new Error('VENICE_STAKING_ADDRESS is required');
  if (!rpcUrl) throw new Error('RPC_URL is required');
  return {
    diemAddress: diemAddress as Address,
    stakingAddress: stakingAddress as Address,
    rpcUrl,
    stakeThreshold: BigInt(process.env['VENICE_STAKE_THRESHOLD'] ?? String(parseEther('1'))),
    bearerCachePath: process.env['VENICE_BEARER_CACHE_PATH'] ?? 'memory/venice-bearer.json',
    veniceApiBase: process.env['VENICE_API_BASE'] ?? 'https://api.venice.ai/api/v1',
    model: process.env['VENICE_MODEL'] ?? 'llama-3.3-70b',
  };
}

// ── On-chain reads ──────────────────────────────────────────────────

export function makePublicClient(rpcUrl: string) {
  return createPublicClient({ chain: base, transport: http(rpcUrl) });
}

type BasePublicClient = ReturnType<typeof makePublicClient>;

export async function getClaimable(
  config: VeniceConfig,
  agentAddress: Address,
  publicClient: BasePublicClient = makePublicClient(config.rpcUrl),
): Promise<bigint> {
  const decimals = await publicClient.readContract({
    address: config.diemAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });
  if (decimals !== 18) throw new Error(`DIEM decimals() = ${decimals}, expected 18`);

  return publicClient.readContract({
    address: ADDRESSES.FEE_LOCKER,
    abi: FEE_LOCKER_ABI,
    functionName: 'availableFees',
    args: [agentAddress, config.diemAddress],
  });
}

// Actual DIEM wallet balance — read after claim to get the real mintable amount.
export async function getDiemBalance(
  config: VeniceConfig,
  agentAddress: Address,
  publicClient: BasePublicClient = makePublicClient(config.rpcUrl),
): Promise<bigint> {
  return publicClient.readContract({
    address: config.diemAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [agentAddress],
  });
}

// sVVV balance — gates Venice API key mint
export async function getStakedBalance(
  config: VeniceConfig,
  agentAddress: Address,
  publicClient: BasePublicClient = makePublicClient(config.rpcUrl),
): Promise<bigint> {
  return publicClient.readContract({
    address: config.stakingAddress,
    abi: SVVV_ABI,
    functionName: 'balanceOf',
    args: [agentAddress],
  });
}

// ── On-chain writes ─────────────────────────────────────────────────

// Claim accrued LP DIEM fees from FeeLocker to agent wallet.
export async function claimDiem(
  config: VeniceConfig,
  agentAddress: Address,
  txSender: TxSender,
): Promise<Hex> {
  const data = encodeFunctionData({
    abi: FEE_LOCKER_ABI,
    functionName: 'claim',
    args: [agentAddress, config.diemAddress],
  });
  return txSender({ to: ADDRESSES.FEE_LOCKER, data });
}

// ── Venice key mint ─────────────────────────────────────────────────

// Flow: GET /api_keys/generate_web3_key → personal_sign(token) → POST /api_keys/generate_web3_key
// Requires sVVV balance on Base (staked VVV via Venice staking contract).
export async function mintVeniceKey(
  config: VeniceConfig,
  signer: Signer,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  // 1. Get a short-lived JWT (15-min expiry, unauthenticated).
  const tokenRes = await fetchFn(`${config.veniceApiBase}/api_keys/generate_web3_key`);
  if (!tokenRes.ok) throw new Error(`Venice token fetch failed: ${tokenRes.status}`);
  const { data: { token } } = await tokenRes.json() as { data: { token: string } };

  // 2. Sign the raw token string — proves ownership of a wallet with sVVV balance.
  const signature = await signer.signMessage({ message: token });

  // 3. Mint a durable inference API key.
  const mintRes = await fetchFn(`${config.veniceApiBase}/api_keys/generate_web3_key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: signer.address,
      signature,
      token,
      apiKeyType: 'INFERENCE',
      description: 'agent-autonomous',
    }),
  });
  if (!mintRes.ok) throw new Error(`Venice key mint failed: ${mintRes.status}`);
  const mintBody = await mintRes.json() as { data?: { apiKey?: string }; apiKey?: string };
  const apiKey = mintBody.data?.apiKey ?? mintBody.apiKey;
  if (!apiKey) throw new Error(`Venice key mint: no apiKey in response: ${JSON.stringify(mintBody)}`);
  return apiKey;
}

// ── Bearer cache ────────────────────────────────────────────────────

export function loadCachedBearer(cachePath: string): string | null {
  if (!existsSync(cachePath)) return null;
  try {
    const data = JSON.parse(readFileSync(cachePath, 'utf8')) as { bearer: string };
    return data.bearer ?? null;
  } catch {
    return null;
  }
}

export function saveBearer(cachePath: string, bearer: string): void {
  assertAllowed(cachePath);
  writeFileSync(cachePath, JSON.stringify({ bearer }), 'utf8');
}

export async function loadOrMintBearer(
  config: VeniceConfig,
  signer: Signer,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  // Fast path: manually provided key (MVP fallback; autonomous mint is the production path).
  const envKey = process.env['VENICE_API_KEY'];
  if (envKey) return envKey;

  const cached = loadCachedBearer(config.bearerCachePath);
  if (cached) return cached;

  const bearer = await mintVeniceKey(config, signer, fetchFn);
  saveBearer(config.bearerCachePath, bearer);
  return bearer;
}

// ── Inference ───────────────────────────────────────────────────────

export type InferenceOpts = {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  model?: string;  // overrides config.model for this call
};

export async function callInference(
  config: VeniceConfig,
  bearer: string,
  opts: InferenceOpts,
  logPath: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const model = opts.model ?? config.model;
  const start = Date.now();
  const res = await fetchFn(`${config.veniceApiBase}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify({
      model,
      messages: [
        ...(opts.systemPrompt ? [{ role: 'system', content: opts.systemPrompt }] : []),
        { role: 'user', content: opts.prompt },
      ],
      max_tokens: opts.maxTokens ?? 512,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Venice inference failed: ${res.status}`);

  const latency_ms = Date.now() - start;
  const data = await res.json() as {
    choices: { message: { content: string } }[];
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const entry: ToolRoutingEntry = {
    ts: new Date().toISOString(),
    provider: 'venice',
    variant: `:${model}`,
    cache_hit: false,
    latency_ms,
    tokens: { input: data.usage.prompt_tokens, output: data.usage.completion_tokens },
    cost_usd: 0,
    cost_diem: diemCost(model, data.usage.prompt_tokens, data.usage.completion_tokens),
  };
  emit(entry, logPath);

  return data.choices[0]?.message.content ?? '';
}
