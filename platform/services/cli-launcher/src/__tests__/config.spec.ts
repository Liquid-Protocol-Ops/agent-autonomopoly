import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, ConfigError } from '../config.js';

const REQUIRED = {
  AGENT_NAME: 'Test Agent',
  RPC_URL: 'https://base.rpc.example',
  DEPLOYER_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  PRIVY_APP_ID: 'privy-app-id',
  PRIVY_APP_SECRET: 'privy-app-secret',
  GH_TOKEN: 'ghp_token',
  DIEM_PRICE_USD: '2248',
};

function setEnv(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) process.env[k] = v;
}

function clearEnv() {
  for (const k of Object.keys(REQUIRED)) delete process.env[k];
  delete process.env['AGENT_SYMBOL'];
  delete process.env['AGENT_DESCRIPTION'];
  delete process.env['DIEM_PRICE_USD'];
  delete process.env['INITIAL_MARKET_CAP_USD'];
}

describe('loadConfig', () => {
  beforeEach(() => { clearEnv(); setEnv(REQUIRED); });
  afterEach(() => { clearEnv(); });

  it('loads all required env vars', () => {
    const cfg = loadConfig();
    expect(cfg.agent.name).toBe('Test Agent');
    expect(cfg.chain.rpcUrl).toBe(REQUIRED.RPC_URL);
    expect(cfg.privy.appId).toBe(REQUIRED.PRIVY_APP_ID);
    expect(cfg.github.token).toBe(REQUIRED.GH_TOKEN);
    expect(cfg.dryRun).toBe(false);
  });

  it('derives symbol from name when AGENT_SYMBOL is unset', () => {
    const cfg = loadConfig();
    expect(cfg.agent.symbol).toBe('TESTAGENT'.slice(0, 6)); // "TESTAG"
  });

  it('uses AGENT_SYMBOL when provided', () => {
    process.env['AGENT_SYMBOL'] = 'MYTKN';
    expect(loadConfig().agent.symbol).toBe('MYTKN');
  });

  it('sets dryRun flag', () => {
    expect(loadConfig(true).dryRun).toBe(true);
  });

  it('uses default contract addresses', () => {
    const cfg = loadConfig();
    expect(cfg.chain.diemAddress).toBe('0xF4d97F2da56e8c3098f3a8D538DB630A2606a024');
    expect(cfg.chain.feeLockerAddress).toBe('0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF');
    expect(cfg.chain.initialMarketCapUsd).toBe(20000);
    expect(cfg.chain.diemPriceUsd).toBe(2248);
  });

  for (const key of Object.keys(REQUIRED)) {
    it(`throws ConfigError when ${key} is missing`, () => {
      delete process.env[key];
      expect(() => loadConfig()).toThrow(ConfigError);
    });
  }
});
