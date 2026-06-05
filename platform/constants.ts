// On-chain addresses for Base mainnet (chain ID 8453).
// Keep in sync with liquid-protocol-ops/sdk/src/constants.ts — these are
// the agent-template's read-only copy so harness modules don't need an SDK dep.

import type { Address } from 'viem';

export const ADDRESSES = {
  // ── Liquid Protocol ──────────────────────────────────────────────────
  FEE_LOCKER: '0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF' as Address,
  // DIEM is both the ERC-20 and the sDIEM staking contract — call stake(uint256) directly, no approve needed.
  // Staking DIEM → sDIEM balance → Venice inference credits ($1/DIEM/day budget).
  DIEM:        '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024' as Address,

  // ── Base canonical ───────────────────────────────────────────────────
  // Canonical wrapped-ETH address, same across all OP-stack chains.
  WETH:        '0x4200000000000000000000000000000000000006' as Address,

  // ── Uniswap v3 (Base mainnet) ─────────────────────────────────────────
  // Source: https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
  UNISWAP_V3_FACTORY:  '0x33128a8fC17869897dcE68Ed026d694621f6FDfD' as Address,
  NFPM_V3:             '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as Address,
  SWAP_ROUTER_V3:      '0x2626664c2603336E57B271c5C0b26F421741e481' as Address,
  QUOTER_V2:           '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as Address,
  UNIVERSAL_ROUTER:    '0x6fF5693b99212Da76ad316178A184AB56D299b43' as Address,
  PERMIT2:             '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address,

  // ── Venice / VVV ─────────────────────────────────────────────────────
  // VVV governance token — stake VVV → sVVV → Venice API key gate (one-time per key).
  // mintDiem(sVVVAmountToLock, minDiemAmountOut) burns sVVV → mints DIEM (selector 0x2006efcb).
  VVV:         '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as Address,
  // VVV staking contract — approve VVV here, then call stake(agentAddress, amount).
  // sVVV is NON-TRANSFERABLE; it is a balance tracked inside this contract.
  // sVVV ≠ sDIEM: sVVV gates the API key; sDIEM (staked DIEM) funds inference credits.
  VVV_STAKING: '0x321b7ff75154472B18EDb199033fF4D116F340Ff' as Address,

  // ── Liquid Protocol hooks / lockers ──────────────────────────────────
  HOOK_DYNAMIC_FEE_V2:    '0x80E2F7dC8C2C880BbC4BDF80A5Fb0eB8B1DB68CC' as Address,
  LP_LOCKER_FEE_CONVERSION: '0x77247fCD1d5e34A3703AcA898A591Dc7422435f3' as Address,
  MEV_DESCENDING_FEES:    '0x8D6B080e48756A99F3893491D556B5d6907b6910' as Address,
  LIQUID_FACTORY:         '0x04F1a284168743759BE6554f607a10CEBdB77760' as Address,

  // ── Pools ─────────────────────────────────────────────────────────────
  // ETH/DIEM Uniswap v3 1% pool on Base — highest APY DIEM pool (655.91% as of 2026-05-14).
  ETH_DIEM_V3: '0x80d995189ecc593672aD4703b250a5e82672EB1D' as Address,

  // ── Uniswap v4 (Base mainnet) ────────────────────────────────────────
  // Source: docs/uniswap-v4-lp-reference.json
  POSITION_MANAGER_V4: '0x7C5f5A4bBd8fD63184577525326123B519429bDc' as Address,
  POOL_MANAGER_V4:     '0x498581fF718922c3f8e6A244956aF099B2652b2b' as Address,

  // ── Liquid Protocol v0 — wstDIEM Inference Vault (v5) ────────────────
  // Source: liquid-protocol-v0 broadcast/DeployAll.s.sol/8453/run-latest.json
  // (deployed 2026-06-04 06:27 UTC; addresses pending docs PR #11 merge).
  // Previous values pointed at deprecated v2 contracts — see commit message.
  // Liquid Protocol redeploys periodically; cross-check on a new rev before reliance.
  INFERENCE_VAULT:    '0xb9f23c33FfD2213f31C0cFb6c9e2fDf525a9Dd2D' as Address,
  FEE_ROUTER:         '0x3b8d968DCca09E319fac7Df741804Af5644E3a60' as Address,
  VAULT_ROUTER:       '0x6fF481F4B3B0E2ADa548D454F7011D1ed51532B6' as Address,
  CURVE_DIEM_WSTDIEM: '0xB9c7F62e4EeC145bFa1C6bBc5fFdFf246181FdA2' as Address,
  AGENT_TGE_REGISTRY: '0x09a4227935FF15b261533238F79935CCcA0e7941' as Address,
} as const;

// Uniswap v3 pool parameters for ETH/DIEM 1% pool.
// token0 = WETH (0x4200...) < token1 = DIEM (0xF4d9...) by address ordering.
export const ETH_DIEM_V3 = {
  FEE:          10_000,  // 1% fee tier
  TICK_SPACING: 200,     // tick spacing for 1% pools
} as const;
