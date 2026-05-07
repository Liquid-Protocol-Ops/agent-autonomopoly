// Agent wallet substrate.
//
// Two implementations of the same Signer + TxSender interfaces:
//   v0a: loadSignerFromEnv / makeTxSenderFromEnv  — bare AGENT_PRIVATE_KEY in .env
//   v0b: loadSignerFromPrivy / makeTxSenderFromPrivy — Privy server wallet (primary for v0)
//   v1:  TEE-backed equivalents (Phala / Marlin Oyster / AWS Nitro) — post-MVP
//
// Callers never change when the substrate swaps.
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

export type Signer = Pick<LocalAccount, 'address' | 'signMessage' | 'signTypedData'>;

// TxSender abstracts "send a contract call" without exposing the substrate.
// Returns the transaction hash.
export type TxSender = (params: { to: Address; data: Hex }) => Promise<Hex>;

// ── v0a: env-key substrate ───────────────────────────────────────────

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

export function makeTxSenderFromEnv(rpcUrl: string): TxSender {
  const raw = process.env[AGENT_PRIVATE_KEY];
  if (raw === undefined || raw === '') throw new Error(`${AGENT_PRIVATE_KEY} is required`);
  const normalized = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(`${AGENT_PRIVATE_KEY} is malformed (expected 64-char hex, with or without 0x prefix)`);
  }
  const account = privateKeyToAccount(normalized as Hex);
  const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });
  return ({ to, data }) => walletClient.sendTransaction({ to, data });
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
};

export function loadPrivyConfig(): PrivyWalletConfig {
  const appId = process.env['PRIVY_APP_ID'];
  const appSecret = process.env['PRIVY_APP_SECRET'];
  const walletId = process.env['PRIVY_WALLET_ID'];
  if (!appId) throw new Error('PRIVY_APP_ID is required');
  if (!appSecret) throw new Error('PRIVY_APP_SECRET is required');
  if (!walletId) throw new Error('PRIVY_WALLET_ID is required');
  return { appId, appSecret, walletId };
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
): TxSender {
  return async ({ to, data }: { to: Address; data: Hex }): Promise<Hex> => {
    const rpcRes = await fetchFn(`${PRIVY_API_BASE}/wallets/${config.walletId}/rpc`, {
      method: 'POST',
      headers: privyHeaders(config),
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        caip2: 'eip155:8453',
        chain_type: 'ethereum',
        params: { transaction: { to, data } },
      }),
    });
    if (!rpcRes.ok) throw new Error(`Privy eth_sendTransaction failed: ${rpcRes.status}`);
    const body = await rpcRes.json() as { data: { hash: Hex } };
    return body.data.hash;
  };
}
