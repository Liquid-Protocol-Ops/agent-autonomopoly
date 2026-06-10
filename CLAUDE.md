# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run typecheck        # tsc --noEmit (strict mode, no emit)
npm run build            # tsc -p .
npm test                 # vitest run (all tests)
npm run lint:identity    # validate identity/ markdown schema + drift
```

Run a single test file:
```bash
npx vitest run harness/safety/__tests__/allowlist.spec.ts
```

Run lint-identity against a different root (e.g. a fixture tree):
```bash
LINT_REPO_ROOT=/path/to/fixture npm run lint:identity
```

## What this repo is

A **GitHub template** (`Liquid-Protocol-Ops/deploy-autonomous`) — each launched agent is a new repo generated from this template. The harness code, identity layer, and safety modules live here and ship into every per-agent repo verbatim. Anything added at the root goes into every agent.

## Product intent

A CLI launchpad that spawns **self-funding, self-evolving Claude Code agents**. Each agent gets:
- Its own GitHub repo (fork of this template)
- A TOKEN/DIEM pool on Base via `liquid-sdk` — DIEM-only fees accrue to the agent's wallet
- Its own wallet (TEE-sealed post-MVP, `.env`-stored for v0)
- Its own Venice API key (minted once after staking ≥ 0.1 sDIEM; $1/DIEM/day inference budget)
- Its own Telegram bot (v1)

No router, no swap step, no platform custody. Agents run as Modal ticks (v0), die after 7 days of sub-threshold income, remaining DIEM drains to the protocol vault.

### Launch params (set at fork time by agent-portal)

| Field | Description |
|-------|-------------|
| `name` | Agent display name |
| `symbol` | Ticker (2–10 alphanumeric) |
| `goal` | Creator's mission statement — written into `memory/goals.json` at fork |
| `telegramUserId` | Creator's Telegram numeric user ID — set as `TELEGRAM_ALLOWED_USER_IDS` + `TELEGRAM_CHAT_ID` secrets |

### Post-launch settings

The portal exposes `POST /api/agent/[slug]/settings` for:
- `veniceApiKey` — bring-your-own Venice key, bypasses DIEM-earned inference
- `telegramUserId` — update allowed Telegram users post-launch

## Implemented code

### `harness/safety/allowlist.ts`

Enforces the agent's mutation surface. The agent may only write to:
- `identity/SOUL.md` and `identity/STYLE.md` (mutable working copies)
- `memory/**` and `wiki/**` (agent's notebook)

Everything else — `harness/`, `scripts/`, `identity/SCHEMA.md`, `identity/*.genesis.md`, `package.json`, spec docs — is off-limits. Use `assertAllowed(path)` before any agent-initiated write; `isAllowed(path)` for checks. `ALLOWLIST_POLICY` exports the full set for introspection.

### `harness/safety/wallet.ts`

Two implementations of the same `Signer` + `TxSender` interfaces:

- **`loadSignerFromPrivy` / `makeTxSenderFromPrivy`** — **production substrate**. Privy server wallet via REST API. The agent never stores or handles a private key — Privy holds it. We authenticate with Basic auth (`base64(PRIVY_APP_ID:PRIVY_APP_SECRET)`). Requires three GitHub Actions secrets: `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `PRIVY_WALLET_ID`.
- **`loadSignerFromEnv` / `makeTxSenderFromEnv`** — **test-only**. Reads `AGENT_PRIVATE_KEY` from env. Never set this secret in GitHub Actions. Use only in local unit tests with throwaway dev keys.
- **TEE variants** — post-MVP; same interfaces, no call-site changes

`Signer` exposes only `address`, `signMessage`, `signTypedData` (structural subset of viem `LocalAccount`). `TxSender` is `(params: { to, data }) => Promise<Hex>` — abstracts the signing substrate for on-chain writes.

Note: Privy **embedded** wallets (rejected in early arch docs) require a human session; Privy **server** wallets are fully headless.

### Wallet management — production rules

| Rule | Detail |
|------|--------|
| No private key in secrets | `AGENT_PRIVATE_KEY` must NOT be set in GitHub Actions or `.env` |
| Privy credential = `PRIVY_APP_SECRET` | This is the sensitive credential (Basic auth token). Treat like a password. |
| Signing flow | Script → `makeTxSenderFromPrivy` → POST `/wallets/{id}/rpc` → Privy signs → tx hash |
| Wallet address | `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3` (Base mainnet) |
| Recovery | Privy dashboard; agent wallet is Privy-managed, not operator-held |

### `harness/safety/x-policy.ts`

Authoritative X command policy. `X_DISPATCH_ALLOWLIST = new Set(['tweet-listen'])` — the only skill the X webhook may dispatch. `X_FORBIDDEN_OPERATIONS` enumerates all permanently-blocked operations (fund transfers, wallet signing, LP operations, etc.). Exports `isXDispatchAllowed` and `assertXDispatchAllowed`. The zero-fund-transfer rule is mirrored in `api/webhook/x.ts` and `skills/tweet-listen/SKILL.md`.

### `api/webhook/x.ts` + `api/cron/listen.ts`

Webhook: validates X HMAC signatures (fail-closed), reads `memory/x-credential-blocker.json` before dispatching, enforces `X_DISPATCH_ALLOWLIST`. Cron: dispatches `tweet-broadcast` + `tweet-listen` concurrently every 15 minutes via Vercel edge function.

### `scripts/tweet-browser.py`

X API v2 automation using OAuth 1.0a User Context. GET endpoints (mentions, user lookup) use `requests_oauthlib.OAuth1` via raw `requests` — not tweepy — because tweepy 4.x returns 401 on `get_users_mentions` for project-enrolled apps. Write operations (post, like) use `tweepy.Client`. Implements `init`, `post`, `listen`, `engagement`, and `like` actions.

### `scripts/lint-identity.ts`

Validates `identity/`, `SECTION_5.md`, and `ARCHITECTURE_v2.md` on every commit. Four checks:

1. **Frontmatter** — all five required keys (`page_type`, `genesis_lock`, `created`, `updated`, `tags`), controlled tag vocabulary, ISO-8601 dates, `sources` iff `page_type: ingested`.
2. **Drift** — Jaccard similarity of `SOUL.md` vs `SOUL.genesis.md` (and STYLE pair) must be ≥ `drift_threshold` (default 0.70). Template-mode pair skips the gate (bodies differ structurally before substitution).
3. **Broken internal links** — `[[path/to/page]]` links must resolve to an existing file.
4. **Quote cap** — any blockquote block must be ≤ 25 words.

### `platform/venice-auth.ts`

Derives the agent's Venice API key by signing a challenge with the agent wallet (proves sVVV staking ownership). Resolution order: `VENICE_API_KEY` env → wallet challenge bootstrap (2 HTTP calls + 1 Privy sign). `withVeniceKey(signer, fn)` wraps any Venice-dependent operation and retries once with a fresh key on 401.

### `scripts/analyze-lp.ts`

Runs each tick to evaluate LP performance. Executes Dune Q7591697 (v3 incremental master portfolio — pre-computed `fee_apr_pct`, `il_pct`, `net_pnl_usd`, `recommended_action` per position; ~2.5 credits/run after Run 1), sends metrics to Venice AI for positioning recommendations, writes `memory/lp-analysis-YYYY-MM-DD.md`, and updates Dune strategy log Q7582817.

### `scripts/reposition.ts`

Closes an out-of-range (or near-boundary) LP position, optionally claims FeeLocker fees, swaps 50% of returned tokens to rebalance, and mints a new in-range position centered on the current tick (±5 spacings). Records new tokenId in `memory/lp-positions.jsonl`. Use `--force` to reposition an in-range position.

### `identity/`

Six files in genesis/mutable pairs: `SOUL.genesis.md` + `SOUL.md`, `STYLE.genesis.md` + `STYLE.md`, `influences.md`. Templates ship with `.template` extension; the deploy-time substitution replaces them with the real files. `SCHEMA.md` is genesis-locked and defines all rules the lint enforces. `identity/index.ts` exports the module. `examples/` holds calibration corpus (good/bad outputs; `promoted/` fills as the agent runs).

## Architecture v2 (ratified 2026-04-30)

The three load-bearing conclusions — read `ARCHITECTURE_v2.md` for the full rationale:

1. **Provably autonomous = TEE** — agent key sealed in Phala/Marlin/Nitro. Punted for v0 (Privy server wallet); substrate swaps without changing any call sites.
2. **DIEM-only fees, agent wallet as fee recipient** — removes the WETH→DIEM swap and the platform fee-router as a routing step. `fee-router` becomes a thin stake-trigger watcher.
3. **Per-agent Venice staking** — each agent owns its own Venice key; no platform quota allocation, no commons pool. DIEM contract is its own staking contract — `stake(uint256)` directly, no ERC-20 approve step.

**Superseded (do not implement):** WETH pairing, Privy *embedded* wallets for agent wallets, platform Venice account, bare `.env` private key as primary wallet substrate. See `ARCHITECTURE_v2.md` §3 for the full conflict table.

## Live AUTONO runtime (as of 2026-06-08)

**MODE: BUILD** — activated 2026-06-08. First directive: improve autono itself.
LP income continues compounding in parallel. `self-improve` runs daily at 10:00 UTC.

AUTONO (@AUTONOMOPOLY) is live on X and posting from Base mainnet. Key facts:

### X API
- App: **autonotest** (Pay Per Use project, project-enrolled)
- Credentials: stored in 1Password UUID `2kodp6bck3gg7omvwn3zr2e43m`; mirrored to GitHub Actions secrets + Vercel env vars
- Auth: OAuth 1.0a User Context (4-key). GET endpoints use `requests_oauthlib.OAuth1` via raw `requests`; tweepy `Client` is used for write ops only. Reason: tweepy 4.x returns 401 on `get_users_mentions` for project-enrolled apps.
- Webhook: `api/webhook/x.ts` — fail-closed auth (HMAC SHA-256 signature required). Dispatches only `tweet-listen` (hardcoded allowlist in `harness/safety/x-policy.ts`).
- Cron: Vercel `*/15 * * * *` → `api/cron/listen.ts` → dispatches `tweet-broadcast` + `tweet-listen` concurrently

### Safety — HARD RULE
X is observation/broadcast only. **No X event may ever trigger fund transfers, wallet signing, or on-chain transactions.** Enforced in three places: `harness/safety/x-policy.ts` (authoritative), `api/webhook/x.ts` (X_DISPATCH_ALLOWLIST), `skills/tweet-listen/SKILL.md` (agent instruction). `@_proxystudio` is the only operator account; even operators cannot trigger financial operations via X.

### Quality feedback loop
1. tick → posts tweets, tags with `#content_type:TYPE` header in `.pending-x/`
2. tweet-broadcast → posts and logs to `memory/x-tweet-log.jsonl`
3. tweet-listen Job 2 → snapshots engagement (last 7 days, not yet measured) → `memory/x-performance.jsonl`
4. tweet-reflect (weekly, Sunday 09:00 UTC via GHA schedule) → reweights `memory/x-strategy.md`, nominates promoted candidates to `memory/x-promoted-candidates.jsonl`
5. tick reads weights from `memory/x-strategy.md` → selects outward signal content type probabilistically

### Scheduled skills (aeon.yml `on.schedule`)
Cron→skill mapping matches `github.event.schedule` (not wall-clock — GHA delays
broke hour matching). Early checkout runs for schedule events so goals.json
gates work.
- `0 9 * * 1` (Monday) → `cost-report`: aggregates `memory/token-usage.csv` → updates `memory/inference-cost.md`
- `0 9 * * 0` (Sunday) → `tweet-reflect`: skipped while goals.json `tweetingPaused`
- `0 10 * * *` (daily) → `self-improve`: only fires when `mode == "build"` — reads skill-health + tweet performance, implements one high-impact change, commits to repo

### Script-only skills (no LLM)
`stake-diem` and `track-earnings` run as deterministic scripts in the workflow
(`script_only` path in `.github/workflows/aeon.yml`) — no Claude step, no
Venice/CCR setup, zero inference cost, immune to provider overloads. Any tx
they want goes through the intent queue + gated executor like everything else.

### Reliability invariants (2026-06-10)
- `@anthropic-ai/claude-code` is **pinned** in the workflow — bump deliberately
- Transient 529/overloaded responses retry up to 3× with backoff before the
  direct-auth fallback engages
- Run state is per-skill under `memory/cron-state/<skill>.json` (legacy
  `memory/cron-state.json` frozen) — concurrent jobs no longer race on one file

### LP positions
- Agent wallet: `0x8767Df39eCeeaeB11554642237aC4E08660aB6A3`
- WETH/DIEM Uniswap v3 1% pool: `0x80d995189ecc593672aD4703b250a5e82672EB1D`
- NFPM: `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1` (Base mainnet)
- Live position data: run `memory/on-chain-state.json` or query chain directly — do **not** hardcode dollar values (they rot)
- Note: `weth` in `memory/on-chain-state.json` → `diem-claims` section is **liquid WETH only**, not LP-locked WETH

### Skills in production
Lean schedule (~18 LLM runs/day as of 2026-06-10): `tick` (2h, includes LP range
check), `heartbeat` (2×/day), `claim-diem` (12h), `on-chain-monitor` (daily),
`goal-review` (weekly), `cost-report` (weekly), `self-improve` (build mode —
daily), plus script-only `stake-diem` + `track-earnings`. All `tweet-*` skills
paused (operator decision — resume when self-funding ratio ≥ 1).

## Active plans

- `MVP_PLAN.md` — 13 sessions to ship the v0 funding loop end-to-end. Sessions 1–4 (identity bundle, lint tests, allowlist, wallet) complete. X integration complete. Next: spend tracking automation + quality loop validation.
- `PLAN.md` — full 28-ticket dispatch plan; superseded in detail by MVP_PLAN.md but retained for Linear ticket context.

When resuming: read this file → `memory/MEMORY.md` → `memory/x-strategy.md` → `memory/cron-state/*.json`.

## Planned infrastructure (post-v2)

Three repos: **this one** (agent template), **`deploy-autonomous-platform`** (~9 services on Hetzner via docker-compose), **`dune-queries`**. Platform services: `api-gateway`, `status-api`, `scheduler`, `modal-dispatcher`, `fee-router` (claim + stake only), `chain-watcher`, `github-app`, `auto-reviewer`, `suggestion-handler`, `lifecycle-engine`, Postgres, Redis, observability. Removed vs. v1 plan: `signing-proxy` and `venice-router`. Off-VM: Modal (v0 ticks), Venice (inference + staking), GitHub + GHCR, Base RPC.

## `.gitignore` gotcha

Do not exclude `.claude/skills/` — skills are the agent's primary mutation surface. Scope any Claude-local exclusions narrowly (e.g., `.claude/settings.local.json`).

## Linear

[mog-capital / deploy-autonomous](https://linear.app/mog-capital/project/deploy-autonomous-fe07e073672d/overview) — MOG-405 epic and 28 children cover the full decision history.
