# Feature Flags — Design Spec
**Date:** 2026-06-02
**Repos:** agent-autonomopoly, deploy-autonomous, liquid-protocol-v0, sdk
**Status:** Approved
**Linear:** MOG-519 (self-healing flags — implement when that work ships)

---

## Problem

Feature behavior in the agent harness is controlled by scattered `process.env` checks with no central registry, no defaults contract, and no CI enforcement. Deploy-time choices for `liquid-protocol-v0` have no documented flag surface. There is no consistent way to turn features on/off per environment.

## Goals

1. Single registry file per repo — all flags defined in one place
2. Typed booleans at call sites — no raw `process.env` string checks outside the registry
3. Explicit defaults — `true` = currently active (stays on if env var missing), `false` = opt-in only
4. GH Actions reads the same vars from repo Variables — no separate CI config format
5. Self-healing flags (MOG-519) pre-registered with `false` defaults, ready to flip as each subsystem ships

## Out of Scope

- `sdk` — pure library, no runtime dispatch; flags live in consumers
- Per-wallet or per-user flag targeting
- Remote flag evaluation (Edge Config, LaunchDarkly)
- Feature flags inside Solidity contracts (already handled by on-chain `enabled*` mappings)

---

## Design

### Module pattern

Each TypeScript repo gets one file: `platform/flags.ts`.

```ts
// platform/flags.ts
const env = (key: string, defaultOn = false): boolean =>
  process.env[key] !== undefined
    ? process.env[key]!.toLowerCase() === 'true'
    : defaultOn

// All flags exported from here. No process.env reads anywhere else.
```

**Rules:**
- `defaultOn: true` — feature is currently active; env var only needed to disable it
- `defaultOn: false` — opt-in only; must be explicitly set to `'true'`
- Call sites import typed booleans: `import { ENABLE_LP_REPOSITION } from '@/platform/flags'`
- ESLint `no-restricted-syntax` bans `process.env` reads outside `platform/flags.ts`

`.env.example` in each repo lists every flag with a one-line description. GitHub Actions reads the same vars from repo Variables (`${{ vars.FLAG_NAME }}`).

For `liquid-protocol-v0`, Foundry's `vm.envBool(key, default)` reads flags in deploy scripts. A `script/flags.env.example` documents all deploy-time flags.

---

## Flag Inventory

### agent-autonomopoly + deploy-autonomous (`platform/flags.ts`)

#### Inference / AI
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_PAID_INFERENCE` | false | Use Opus/paid model; false = free Llama-3.3 |
| `ENABLE_VENICE_KEY_MINT` | true | Auto-mint Venice key via wallet challenge; false = use raw `VENICE_API_KEY` |
| `ENABLE_VENICE_INFERENCE` | true | Venice as the inference provider |

#### LP Management
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_LP_ANALYSIS` | true | Run LP analysis script each tick |
| `ENABLE_LP_REPOSITION` | true | Reposition out-of-range LP positions |
| `ENABLE_FEELOCKER_CLAIM` | true | Claim WETH from FeeLocker |

#### Staking
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_VVV_STAKE` | false | Stake VVV to mint Venice key |
| `ENABLE_DIEM_STAKE` | true | Stake DIEM on Venice for inference credits |

#### Wallet
| Flag | Default | Description |
|------|---------|-------------|
| `USE_PRIVY_WALLET` | true | Privy server wallet; false = `AGENT_PRIVATE_KEY` (test only) |

#### Protocols
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_UNISWAP_V3` | true | Interact with Uniswap V3 |
| `ENABLE_UNISWAP_V4` | false | Interact with Uniswap V4 (opt-in) |
| `ENABLE_0X_SWAPS` | true | 0x API for token swaps (LP rebalancing) |

#### Skills
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_SKILL_COMPUTE_PRESALE` | false | Compute-presale aeon skill |

#### Actions
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_ACTION_FINALIZE_VVV` | false | Call `finalizeVVV()` after presale deadline |
| `ENABLE_ACTION_CLAIM_TOKENS` | true | Call `claimTokens()` on presale vaults |
| `ENABLE_ACTION_WITHDRAW_DIEM` | false | Call `withdrawDepositToken()` after lock expiry |

#### Comms
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_TELEGRAM_BOT` | true | Telegram bot notifications |

#### Debug
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_TOOL_ROUTING_LOG` | false | Log tool routing decisions |

#### Self-healing (MOG-519 — all false until implementation ships)
| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_RPC_RETRY` | false | Exponential backoff on RPC failures |
| `ENABLE_ERROR_MEMORY` | false | Persist error state to `memory/error-state.json` across ticks |
| `ENABLE_IDEMPOTENCY_GUARDS` | false | Pending-tx journal in `memory/pending-txs.jsonl`, prevents double-fire |
| `ENABLE_CIRCUIT_BREAKER` | false | Per-service failure threshold; open/close on consecutive failures |
| `ENABLE_GRACEFUL_SHUTDOWN` | false | SIGTERM drain — wait for in-flight tx receipt before exit |

---

### GitHub Actions (repo Variables, `${{ vars.FLAG }}`)

| Flag | Default | Gates |
|------|---------|-------|
| `ENABLE_TYPECHECK` | true | `tsc --noEmit` strict check |
| `ENABLE_UNIT_TESTS` | true | vitest unit suite |
| `ENABLE_INTEGRATION_TESTS` | false | Fork tests against Base mainnet |
| `ENABLE_CODEQL` | true | CodeQL security scan |

Workflow steps use:
```yaml
- name: Integration tests
  if: vars.ENABLE_INTEGRATION_TESTS == 'true'
  run: npm run test:integration
```

---

### liquid-protocol-v0 (`script/flags.env.example`, `vm.envBool`)

| Flag | Default | Gates |
|------|---------|-------|
| `ENABLE_EXTENSION_PRESALE_VVV` | false | VVV presale vault extension in deploy |
| `ENABLE_EXTENSION_PRESALE_DIEM` | false | DIEM presale vault extension in deploy |
| `ENABLE_EXTENSION_AIRDROP` | false | Airdrop extension |
| `ENABLE_EXTENSION_DEV_BUY` | false | Dev buy extension |
| `ENABLE_HOOK_DYNAMIC_FEE` | true | Dynamic fee hook (false = static fee hook) |
| `ENABLE_MEV_AUCTION` | false | MEV auction module |
| `ENABLE_MEV_DESCENDING_FEE` | false | Descending fee MEV module |
| `VERIFY_CONTRACTS` | false | Etherscan verification post-deploy |
| `ENABLE_INTEGRATION_TESTS_CI` | false | Fork tests in CI workflow |

Usage in Forge scripts:
```solidity
bool enablePresaleVVV = vm.envBool("ENABLE_EXTENSION_PRESALE_VVV", false);
if (enablePresaleVVV) {
    extensionConfigs.push(/* presale VVV config */);
}
```

---

## Implementation Sequence

### agent-autonomopoly + deploy-autonomous (identical steps, apply to both)

1. Create `platform/flags.ts` with all flags
2. Update `.env.example` — one line per flag with description
3. Replace all `process.env.X` reads in harness/platform/scripts with flag imports
4. Add ESLint rule banning raw `process.env` reads outside `platform/flags.ts`
5. Update GitHub Actions workflows — add `if: vars.ENABLE_X` guards on gated steps
6. Set repo Variables in GitHub for each GH Actions flag

### liquid-protocol-v0

1. Create `script/flags.env.example`
2. Update deploy scripts to use `vm.envBool` for each extension/hook/module flag
3. Update `.github/workflows/` with `ENABLE_INTEGRATION_TESTS_CI` guard

### Lifecycle rule

Flags are temporary. When a `false`-default feature becomes always-on, delete the flag entry and the gate. No permanent feature switches.

---

## Verification

```bash
# TypeScript repos — no process.env outside flags.ts
grep -r "process\.env" agent-autonomopoly/harness agent-autonomopoly/platform \
  --include="*.ts" | grep -v "platform/flags.ts"
# Should return nothing

# Solidity — flags.env.example present
ls liquid-protocol-v0/script/flags.env.example

# GH Actions — gated steps present
grep "vars.ENABLE_" agent-autonomopoly/.github/workflows/*.yml
```
