# deploy-autonomous

GitHub template repository for autonomous Claude Code agents deployed by [Liquid Protocol](https://github.com/Liquid-Protocol-Ops). Each agent generated from this template gets its own repo, wallet, Venice API key, and Uniswap LP position — and funds its own cognition from LP fees.

## What an agent does

```
tick (every N minutes, Modal)
  1. Claim LP DIEM fees from FeeLocker  →  if claimable ≥ threshold
  2. Check sVVV balance                 →  gates Venice API key access
  3. Load or mint Venice bearer         →  cached after first autonomous mint
  4. Fast call (llama-3.3-70b, free)   →  classify task; decide if Opus needed
  5. Reason call (claude-opus-4-7)     →  only when fast model says warranted
```

## Economic model

Agents operate in one of two modes, determined by daily DIEM fee rate vs a configurable threshold:

| Mode | Behaviour |
|------|-----------|
| **accumulate** | LP all claimed DIEM to compound the position; run maintenance on free llama only |
| **build** | Stake daily yield for Venice Opus credits; use them to do product work |

Mode is a fact derived from on-chain numbers, not a preference. The agent promotes itself when the economics justify it.

## What's implemented (sessions 1–13)

| Module | File | Status |
|--------|------|--------|
| Tick loop | `harness/tick.ts` | ✅ fast+reason routing |
| Venice provider | `harness/providers/venice.ts` | ✅ claims, sVVV gate, bearer mint, inference |
| Safety allowlist | `harness/safety/allowlist.ts` | ✅ mutation surface guard |
| Wallet abstraction | `harness/safety/wallet.ts` | ✅ Privy server wallet + env fallback |
| Tool-routing log | `harness/observability/tool-routing.ts` | ✅ JSONL cost log with DIEM pricing |
| Identity lint | `scripts/lint-identity.ts` | ✅ frontmatter, drift, links, quote cap |
| Identity CLI | `scripts/create-identity.ts` | ✅ instantiates templates from JSON config |
| Identity templates | `identity/*.template` | ✅ SOUL, STYLE, influences |
| Tests | `harness/**/__tests__/` | ✅ allowlist, wallet, tick routing |

**Next:** LP reinvestment logic (`harness/providers/liquidity.ts`) — single-sided DIEM mint into ETH/DIEM v3 1% pool on Base (655.91% APR).

## Key design decisions

1. **DIEM-only fees, agent wallet as fee recipient** — no WETH→DIEM swap, no platform routing step
2. **Per-agent Venice staking** — each agent owns its own key; no platform quota pool
3. **Privy server wallet (v0), TEE (v1)** — substrate swaps without call-site changes
4. **Hard-locked identity** — constitution fixed at deploy; amendment = death + redeploy
5. **Multi-model routing** — llama free under VVV staking; Opus gated behind fast-model classification

See [`ARCHITECTURE_v2.md`](ARCHITECTURE_v2.md) for full rationale and superseded decisions.

## Deploy a new agent

```bash
# 1. Generate repo from this template on GitHub
# 2. Clone the new repo
# 3. Create identity config
cp identity.autonomopoly.json identity.<agent-name>.json
# edit identity.<agent-name>.json

# 4. Instantiate identity
node --import tsx scripts/create-identity.ts identity.<agent-name>.json \
  --target /path/to/agent-repo

# 5. Set env vars (see .env.example)
# 6. Run a tick
npm run harness:tick
```

## Commands

```bash
npm run typecheck        # tsc --noEmit (strict)
npm test                 # vitest run
npm run lint:identity    # validate identity/ drift + frontmatter
npm run harness:tick     # one tick locally

# single test file
npx vitest run harness/safety/__tests__/allowlist.spec.ts

# lint against a different repo
LINT_REPO_ROOT=/path/to/agent npm run lint:identity
```

## Required env vars

```bash
DIEM_TOKEN_ADDRESS=      # Liquid Protocol DIEM ERC-20 on Base
VVV_STAKING_ADDRESS=     # Venice VVV staking contract (sVVV balance)
RPC_URL=                 # Base mainnet JSON-RPC

# Primary (Privy server wallet)
PRIVY_APP_ID=
PRIVY_APP_SECRET=
PRIVY_WALLET_ID=

# Optional overrides
VENICE_API_KEY=          # Skip autonomous mint (MVP fast path)
VENICE_STAKE_THRESHOLD=  # Min sVVV wei (default: 1e18)
AGENT_PRIVATE_KEY=       # Raw key — fallback for local testing only
```

## Prior art

Identity layer adapted from **Aaron J Mars's `soul.md`** pattern — see [`identity/README.md`](identity/README.md) and [`SECTION_5.md`](SECTION_5.md).

## License

TBD.
