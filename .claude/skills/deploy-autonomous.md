---
name: deploy-autonomous
description: Working in the deploy-autonomous GitHub template repo — agent harness, identity layer, Venice provider, safety modules, and the create-identity CLI.
---

# deploy-autonomous skill

This is the **GitHub template** (`Liquid-Protocol-Ops/deploy-autonomous`) that every autonomous Claude Code agent repo is generated from. Changes here ship into every per-agent repo on next sync. Always consider downstream effects before editing shared harness code.

## What is implemented (sessions 1–13)

### Harness tick (`harness/tick.ts`)
One execution per Modal invocation. Flow per tick:
1. Claim LP DIEM fees from FeeLocker if claimable ≥ `stakeThreshold`
2. Wait for claim receipt
3. Check sVVV balance gates Venice API key access
4. Load or mint Venice bearer (cached in `memory/venice-bearer.json`)
5. **Fast call** (llama-3.3-70b, free under VVV staking): classify task, return `{ needs_reasoning, task, rationale }` JSON
6. **Reason call** (claude-opus-4-7, ~0.027 DIEM/call): only if `needs_reasoning: true`

Run locally: `npm run harness:tick`

### Venice provider (`harness/providers/venice.ts`)
- `loadConfig()` — reads env vars, returns `VeniceConfig`
- `getClaimable()` — reads FeeLocker `availableFees`
- `getStakedBalance()` — reads sVVV balance on VVV staking contract
- `claimDiem()` — calls FeeLocker `claim`, returns tx hash
- `loadOrMintBearer()` — env fast path (`VENICE_API_KEY`) → disk cache → autonomous mint (GET+POST `/api_keys/generate_web3_key`)
- `callInference()` — POST `/chat/completions`, logs cost in DIEM to `memory/tool-routing.jsonl`
- `FAST_MODEL = 'llama-3.3-70b'`, `REASONING_MODEL = 'claude-opus-4-7'`

### Safety (`harness/safety/`)
- **`allowlist.ts`** — `assertAllowed(path)` before any agent write. Agent may only write to `identity/SOUL.md`, `identity/STYLE.md`, `memory/**`, `wiki/**`. Everything else is off-limits.
- **`wallet.ts`** — `Signer` + `TxSender` interfaces. Two implementations: `loadSignerFromPrivy/makeTxSenderFromPrivy` (primary, headless server wallet) and `loadSignerFromEnv/makeTxSenderFromEnv` (fallback for local testing).

### Observability (`harness/observability/tool-routing.ts`)
Appends JSONL entries to `memory/tool-routing.jsonl` on every inference call:
```jsonl
{ "ts":"...", "provider":"venice", "variant":":claude-opus-4-7", "cache_hit":false, "latency_ms":1200, "tokens":{"input":500,"output":200}, "cost_usd":0, "cost_diem":0.027 }
```

### Identity layer (`identity/`)
Three genesis-locked files (hard-locked at deploy) + three mutable working copies (drift-bounded at 0.70 Jaccard similarity by lint):
- `SOUL.genesis.md` / `SOUL.md` — who the agent is, beliefs, constraints
- `STYLE.genesis.md` / `STYLE.md` — voice register, verbal moves, format
- `influences.md` — lineage record (parent agent, authored sources, influences)

Template files (`*.template`) are instantiated by the deploy CLI.

### Create-identity CLI (`scripts/create-identity.ts`)
```bash
node --import tsx scripts/create-identity.ts <config.json> [--target <dir>] [--force]
```
Reads `identity/*.template` files, substitutes `{{placeholders}}` from JSON config, writes genesis files, derives mutable copies (byte-identical body, flipped `genesis_lock`, removed `drift_threshold`), runs lint to verify. Used to instantiate per-agent identity at deploy time.

### Identity lint (`scripts/lint-identity.ts`)
```bash
npm run lint:identity
LINT_REPO_ROOT=/path/to/agent npm run lint:identity  # against a different repo
```
Checks: frontmatter required keys, ISO-8601 dates, controlled tags, sources coupling, drift threshold (Jaccard ≥ 0.70), broken `[[internal links]]`, blockquote word cap (≤ 25 words).

## Key env vars

| Var | Required | Purpose |
|-----|----------|---------|
| `DIEM_TOKEN_ADDRESS` | yes | Liquid Protocol DIEM ERC-20 on Base |
| `VVV_STAKING_ADDRESS` | yes | Venice VVV staking contract (sVVV balance) |
| `RPC_URL` | yes | Base mainnet JSON-RPC |
| `PRIVY_APP_ID` | yes (primary) | Privy server wallet app |
| `PRIVY_APP_SECRET` | yes (primary) | Privy server wallet secret |
| `PRIVY_WALLET_ID` | yes (primary) | Agent's Privy wallet ID |
| `AGENT_PRIVATE_KEY` | fallback only | Raw key for local testing |
| `VENICE_API_KEY` | optional | Skip autonomous key mint (MVP fast path) |
| `VENICE_STAKE_THRESHOLD` | optional | Min sVVV wei (default: 1e18) |

Never commit `.env`. Secrets come from 1Password per `~/Documents/CLAUDE.md`.

## Commands

```bash
npm run typecheck        # tsc --noEmit strict
npm test                 # vitest run
npm run lint:identity    # identity/ validation
npm run harness:tick     # run one tick locally
npx vitest run harness/safety/__tests__/allowlist.spec.ts  # single test file
```

## Architecture principles (ARCHITECTURE_v2.md)

1. **TEE key sealing** — punted to v1 (Privy server wallet for v0); substrate swaps without call-site changes
2. **DIEM-only fees, agent wallet as fee recipient** — no WETH→DIEM swap, no platform fee-router routing step
3. **Per-agent Venice staking** — each agent owns its own Venice key; no platform quota

**Superseded (do not implement):** WETH pairing, Privy embedded wallets, platform Venice account, bare `.env` private key as primary wallet.

## Economic model (accumulate | build)

The agent operates in one of two modes determined by daily DIEM fee rate vs threshold:
- **Accumulate**: LP all claimed DIEM (compound LP position), run maintenance on free llama only
- **Build**: stake yield for Venice Opus credits, use them for product-building ticks

Target LP pool: **ETH/DIEM Uniswap v3 1% on Base** (655.91% APR as of 2026-05-14). Strategy: single-sided DIEM, `tickLower = currentTick`, `tickUpper = currentTick + N * 200` (tick spacing 200 for 1% tier).

## What's next (after session 13)

- LP reinvestment logic in tick (`harness/providers/liquidity.ts`): `increaseLiquidity` on ETH/DIEM v3 pool
- Mode determination from daily fee rate
- `scripts/stake-vvv.ts` — stake VVV to unlock Venice API key mint
