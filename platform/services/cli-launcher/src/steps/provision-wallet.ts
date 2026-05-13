import type { PrivyConfig } from '../config.js';
import type { Address } from 'viem';

export interface ProvisionedWallet {
  walletId: string;
  address: Address;
}

// Creates a new Privy server wallet for the agent.
// The platform never holds the private key — Privy manages it server-side.
export async function provisionAgentWallet(
  config: PrivyConfig,
  fetchFn: typeof fetch = fetch,
): Promise<ProvisionedWallet> {
  const auth = Buffer.from(`${config.appId}:${config.appSecret}`).toString('base64');

  const res = await fetchFn('https://api.privy.io/v1/wallets', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'privy-app-id': config.appId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chain_type: 'ethereum' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Privy wallet provisioning failed (${res.status}): ${text}`);
  }

  const data = await res.json() as { id: string; address: string };
  return { walletId: data.id, address: data.address as Address };
}
