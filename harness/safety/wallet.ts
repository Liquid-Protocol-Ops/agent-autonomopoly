// Agent wallet substrate.
//
// PRODUCTION substrate: Privy server wallet (v0b below).
//   The agent never stores or handles a private key. Privy holds the key in their
//   secure infrastructure; we authenticate to their API with PRIVY_APP_SECRET
//   (Basic auth: base64(PRIVY_APP_ID:PRIVY_APP_SECRET)).
//
//   Required GitHub Actions secrets:
//     PRIVY_APP_ID     — Privy application ID
//     PRIVY_APP_SECRET — Privy application secret (the credential; keep in secrets, never .env)
//     PRIVY_WALLET_ID  — ID of the agent's server wallet
//
// TEST-ONLY substrate: env-key (v0a below).
//   loadSignerFromEnv / makeTxSenderFromEnv read AGENT_PRIVATE_KEY from the environment.
//   NEVER set AGENT_PRIVATE_KEY in production or GitHub Actions secrets.
//   Use only in local unit tests with a throwaway dev key.
//
// v1: TEE-backed equivalents (Phala / Marlin Oyster / AWS Nitro) — post-MVP.
//     Same interfaces; no call-site changes when substrate swaps.
//
// Design constraints (per ARCHITECTURE_v2.md §2.1):
//   - No key material crosses the module boundary.
//   - No logging of key material.
//   - Signer is a structural subset of viem LocalAccount so the interface
//     stays stable across substrate changes.

import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex, LocalAccount } from 'viem';
import { ADDRESSES } from '../../platform/constants.js';

export type Signer = Pick<LocalAccount, 'address' | 'signMessage' | 'signTypedData'>;

// TxSender abstracts "send a contract call" without exposing the substrate.
// Returns the transaction hash.
export type TxSender = (params: { to: Address; data: Hex }) => Promise<Hex>;

// ── Destination allow-list (defense-in-depth fund guard) ─────────────
//
// The signing substrate is the single chokepoint through which every on-chain
// write passes. It rejects any transaction whose destination is not a known
// protocol contract. So even if the agent runtime is hijacked (e.g. prompt
// injection reaching a skill) or a script is buggy, funds cannot be routed to
// an arbitrary address — the worst case is a blocked call, not a drain.
//
// The allow-list is sourced from platform/constants ADDRESSES (self-maintaining:
// every legitimate destination the agent's scripts call is already declared
// there) plus any extra targets passed explicitly or via the TX_EXTRA_ALLOWED
// env var (comma-separated lower/mixed-case addresses). Fail closed.

export class TxDestinationNotAllowed extends Error {
  public readonly to: string;
  constructor(to: string) {
    super(`tx destination not in protocol allow-list: ${to}`);
    this.name = 'TxDestinationNotAllowed';
    this.to = to;
  }
}

function allowedTargets(extra?: readonly Address[]): ReadonlySet<string> {
  const set = new Set<string>();
  for (const addr of Object.values(ADDRESSES)) set.add(addr.toLowerCase());
  const env = process.env['TX_EXTRA_ALLOWED'];
  if (env) {
    for (const a of env.split(',')) {
      const t = a.trim().toLowerCase();
      if (t) set.add(t);
    }
  }
  if (extra) for (const a of extra) set.add(a.toLowerCase());
  return set;
}

export function assertTxAllowed(to: Address | undefined, extra?: readonly Address[]): void {
  // Reject contract-creation (no `to`) and any unknown destination. The agent's
  // legitimate flows all target a declared protocol contract; bare deploys go
  // through reviewed, explicitly-allow-listed paths if ever needed.
  if (!to || !allowedTargets(extra).has(to.toLowerCase())) {
    throw new TxDestinationNotAllowed(String(to));
  }
}

export type TxSenderOptions = { allowedTargets?: readonly Address[] };

// ── v0a: env-key substrate (TEST ONLY — never use in production) ─────

const AGENT_PRIVATE_KEY = 'AGENT_PRIVATE_KEY';

export function loadSignerFromEnv(): Signer {
  const raw = process.env[AGENT_PRIVATE_KEY];
  if (raw === undefined || raw === '') {
    throw new Error(`${AGENT_PRIVATE_KEY} is required`);
  }
  const normalized = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    // Note: error message MUST NOT include `raw` or `normalized`.
    throw new Error(`${AGENT_PRIVATE_KEY} is malformed (expected 64-char hex, with or without 0x prefix)`);
  }
  const account = privateKeyToAccount(normalized as Hex);
  return {
    address: account.address,
    signMessage: account.signMessage.bind(account),
    signTypedData: account.signTypedData.bind(account),
  };
}

export function makeTxSenderFromEnv(rpcUrl: string, opts?: TxSenderOptions): TxSender {
  const raw = process.env[AGENT_PRIVATE_KEY];
  if (raw === undefined || raw === '') throw new Error(`${AGENT_PRIVATE_KEY} is required`);
  const normalized = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(`${AGENT_PRIVATE_KEY} is malformed (expected 64-char hex, with or without 0x prefix)`);
  }
  const account = privateKeyToAccount(normalized as Hex);
  const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });
  return ({ to, data }) => {
    assertTxAllowed(to, opts?.allowedTargets);
    return walletClient.sendTransaction({ to, data });
  };
}

// ── v0b: Privy server-wallet substrate ──────────────────────────────
//
// Required env vars:
//   PRIVY_APP_ID     — Privy application ID
//   PRIVY_APP_SECRET — Privy application secret
//   PRIVY_WALLET_ID  — ID of the server wallet to use

const PRIVY_API_BASE = 'https://api.privy.io/v1';

export type PrivyWalletConfig = {
  appId: string;
  appSecret: string;
  walletId: string;
  gasPolicyId?: string;  // set to sponsor gas via Privy policy; omit to pay gas from wallet
};

export function loadPrivyConfig(): PrivyWalletConfig {
  const appId = process.env['PRIVY_APP_ID'];
  const appSecret = process.env['PRIVY_APP_SECRET'];
  const walletId = process.env['PRIVY_WALLET_ID'];
  if (!appId) throw new Error('PRIVY_APP_ID is required');
  if (!appSecret) throw new Error('PRIVY_APP_SECRET is required');
  if (!walletId) throw new Error('PRIVY_WALLET_ID is required');
  const cfg: PrivyWalletConfig = { appId, appSecret, walletId };
  const gasPolicyId = process.env['PRIVY_GAS_POLICY_ID'];
  if (gasPolicyId) cfg.gasPolicyId = gasPolicyId;
  return cfg;
}

function privyBasicAuth(config: PrivyWalletConfig): string {
  return `Basic ${Buffer.from(`${config.appId}:${config.appSecret}`).toString('base64')}`;
}

function privyHeaders(config: PrivyWalletConfig): Record<string, string> {
  return {
    Authorization: privyBasicAuth(config),
    'privy-app-id': config.appId,
    'Content-Type': 'application/json',
  };
}

export async function loadSignerFromPrivy(
  config: PrivyWalletConfig,
  fetchFn: typeof fetch = fetch,
): Promise<Signer> {
  const res = await fetchFn(`${PRIVY_API_BASE}/wallets/${config.walletId}`, {
    headers: privyHeaders(config),
  });
  if (!res.ok) throw new Error(`Privy get-wallet failed: ${res.status}`);
  const { address } = await res.json() as { address: `0x${string}` };

  const signer = {
    address,

    signMessage: async ({ message }: { message: string | { raw: Hex | Uint8Array } }) => {
      const msg = typeof message === 'string'
        ? message
        : typeof (message as { raw: unknown }).raw === 'string'
          ? (message as { raw: string }).raw
          : Buffer.from((message as { raw: Uint8Array }).raw).toString('hex');
      const encoding = typeof message === 'string' ? 'utf-8' : 'hex';
      const rpcRes = await fetchFn(`${PRIVY_API_BASE}/wallets/${config.walletId}/rpc`, {
        method: 'POST',
        headers: privyHeaders(config),
        body: JSON.stringify({ method: 'personal_sign', params: { message: msg, encoding } }),
      });
      if (!rpcRes.ok) throw new Error(`Privy personal_sign failed: ${rpcRes.status}`);
      const body = await rpcRes.json() as { data: { signature: Hex } };
      return body.data.signature;
    },

    signTypedData: async (params: unknown) => {
      const rpcRes = await fetchFn(`${PRIVY_API_BASE}/wallets/${config.walletId}/rpc`, {
        method: 'POST',
        headers: privyHeaders(config),
        body: JSON.stringify({ method: 'eth_signTypedData_v4', params: { typed_data: params } }),
      });
      if (!rpcRes.ok) throw new Error(`Privy eth_signTypedData_v4 failed: ${rpcRes.status}`);
      const body = await rpcRes.json() as { data: { signature: Hex } };
      return body.data.signature;
    },
  };

  return signer as unknown as Signer;
}

export function makeTxSenderFromPrivy(
  config: PrivyWalletConfig,
  fetchFn: typeof fetch = fetch,
  opts?: TxSenderOptions,
): TxSender {
  return async ({ to, data }: { to: Address; data: Hex }): Promise<Hex> => {
    assertTxAllowed(to, opts?.allowedTargets);
    const body: Record<string, unknown> = {
      method: 'eth_sendTransaction',
      caip2: 'eip155:8453',
      chain_type: 'ethereum',
      params: { transaction: { to, data } },
    };
    if (config.gasPolicyId) body['policy_ids'] = [config.gasPolicyId];

    const rpcRes = await fetchFn(`${PRIVY_API_BASE}/wallets/${config.walletId}/rpc`, {
      method: 'POST',
      headers: privyHeaders(config),
      body: JSON.stringify(body),
    });
    if (!rpcRes.ok) {
      const errBody = await rpcRes.text();
      throw new Error(`Privy eth_sendTransaction failed: ${rpcRes.status} — ${errBody}`);
    }
    const result = await rpcRes.json() as { data: { hash: Hex } };
    return result.data.hash;
  };
}
