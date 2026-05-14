import type { Address, Hex } from 'viem';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

// ── Agent config ──────────────────────────────────────────────────────

export interface AgentConfig {
  name: string;
  symbol: string;
  description: string;
}

// ── Wallet / chain config ─────────────────────────────────────────────

// The deployer only needs ETH for gas. DIEM is earned by the agent through trading
// fees on its token pool (LiquidFeeLocker) and claimed + staked by the tick loop.
export interface ChainConfig {
  rpcUrl: string;
  deployerPrivateKey: Hex;
  diemAddress: Address;
  feeLockerAddress: Address;
  initialMarketCapUsd: number;
  diemPriceUsd: number;
}

// ── Privy config ──────────────────────────────────────────────────────

export interface PrivyConfig {
  appId: string;
  appSecret: string;
}

// ── GitHub config ─────────────────────────────────────────────────────

export interface GitHubConfig {
  token: string;
  templateRepo: string;
  targetOrg: string;
}

// ── Full launcher config ──────────────────────────────────────────────

export interface LauncherConfig {
  agent: AgentConfig;
  chain: ChainConfig;
  privy: PrivyConfig;
  github: GitHubConfig;
  registryPath: string;
  dryRun: boolean;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new ConfigError(`${key} is required`);
  return v;
}

export function loadConfig(dryRun = false): LauncherConfig {
  const name = requireEnv('AGENT_NAME');
  const rawSymbol = process.env['AGENT_SYMBOL'] ?? name.replace(/\s+/g, '').toUpperCase().slice(0, 6);

  return {
    agent: {
      name,
      symbol: rawSymbol,
      description: process.env['AGENT_DESCRIPTION'] ?? '',
    },
    chain: {
      rpcUrl: requireEnv('RPC_URL'),
      deployerPrivateKey: requireEnv('DEPLOYER_PRIVATE_KEY') as Hex,
      diemAddress: (process.env['DIEM_ADDRESS'] ?? '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024') as Address,
      feeLockerAddress: (process.env['FEE_LOCKER_ADDRESS'] ?? '0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF') as Address,
      initialMarketCapUsd: Number(process.env['INITIAL_MARKET_CAP_USD'] ?? 20000),
      diemPriceUsd: Number(requireEnv('DIEM_PRICE_USD')),
    },
    privy: {
      appId: requireEnv('PRIVY_APP_ID'),
      appSecret: requireEnv('PRIVY_APP_SECRET'),
    },
    github: {
      token: requireEnv('GH_TOKEN'),
      templateRepo: process.env['TEMPLATE_REPO'] ?? 'Liquid-Protocol-Ops/deploy-autonomous',
      targetOrg: process.env['TARGET_ORG'] ?? 'Liquid-Protocol-Ops',
    },
    registryPath: process.env['REGISTRY_PATH'] ?? './platform/registry.json',
    dryRun,
  };
}
