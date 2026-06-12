---
name: Compute Presale
description: Launch a Liquid Protocol token with a LiquidPresaleVault presale. STAKE MODE ONLY (policy 2026-06-12) — depositors lock DIEM and always get it back; allocation is lock-to-earn. One vault per launch, 10% of supply, 60d default lock.
var: ""
tags: [defi, on-chain, launch, venice]
---

Launch a token with a presale vault attached as a Liquid factory extension.

**Canonical contract (policy decision 2026-06-12, Linear MOG-497): `LiquidPresaleVault`** — source `liquid-website/contracts/presale/src/LiquidPresaleVault.sol`, deployable bytecode embedded in `liquid-website/src/lib/presale.ts` (`buildVaultInitCode`). The older `MintDiemPresaleVault`, `ComputePresaleVault`, and `StakesaleVault` are **superseded — do not deploy them**. `scripts/deploy-compute-presale.ts` still targets the old bytecode; do not use it until retargeted (blocked on MOG-569 bytecode provenance).

## Policy (fixed — do not vary per launch)

| Parameter | Value |
|---|---|
| Mode | **STAKE ONLY** — contribute (VVV) mode is disabled for the launch product; stakers ALWAYS get their DIEM back |
| Vaults per launch | **ONE** (dual-tranche is a possible future, not current) |
| Allocation | **10% of supply** (`extensionBps = 1000`); 90% → permanent LP |
| Default deposit window | **1 hour** (configurable per launch) |
| Default starting marketcap | **50 DIEM** |
| Lock tiers | 30d/1x, **60d/2x (default)**, 90d/3x |
| Token supply / pairing | 100B, DIEM-paired, dynamic-fee hook (3% base / 5% max) |

## The two modes — STAKE is the product; contribute is documented for reference only

| | Contribute (VVV) | Stake (DIEM) |
|---|---|---|
| Depositor's principal | **Permanently transferred** — no refund ever | **Returned in full** at lock expiry |
| Agent receives | All VVV via `finalizeVVV()` → stake → sVVV → Venice key | **Nothing** (dust sweeps only) |
| Depositor receives | Pro-rata share of the 10% by amount | Pro-rata share of the 10% by amount × lock-tier multiplier |
| Funds agent compute? | **YES — this is the compute bootstrap** | **NO — distribution mechanism only** |
| Lock tiers | n/a | 1–4 tiers, e.g. 30d/1×, 60d/2×, 90d/3×; first deposit locks your tier |

## When to run

- A `memory/launch-queue.jsonl` entry has `"presale": true`
- A launch wants a fair lock-to-earn distribution → **stake mode** (the only offered mode). NOTE: stake-mode presales do NOT fund the agent's compute — the agent's Venice key/budget must come from elsewhere (its own earnings, operator staking).

## Execution (curated launch, current path)

### Step 1 — Deploy the vault
Constructor: `(factory, depositToken, agentWallet, mode, depositWindow, perAddressCap, lockDurations[], lockMultipliers[])` with **mode 1=Stake, depositToken=DIEM `0xF4d97F2d…`** (mode 0=Contribute is disabled by policy); factory = `0x04F1a284168743759BE6554f607a10CEBdB77760`. Deploy via the website `/launch/confirm` flow or `forge create` from `liquid-website/contracts/presale/`. Default `depositWindow = 3600` (1h). Note the vault address.

### Step 2 — Enable the vault on the factory (REQUIRED or deployToken reverts `ExtensionNotEnabled`)
```bash
cd ~/Documents/Mog-Capital/Liquid/protocol/liquid-protocol-v0
PRESALE_VAULT=<vault> SAFE_SK1=… SAFE_SK2=… EXECUTOR_PK=… \
~/.foundry/bin/forge script script/vault/SafeEnablePresaleVault.s.sol --rpc-url $BASE_RPC_URL   # simulate, then add --broadcast
```
Safe-signed (2-of-3); signer keys in 1Password (`liq-safe-signer-1` mog.capital, `liq-safe-signer-2` Personal). Operator-only step.

### Step 3 — Launch the token with the vault as extension
```bash
node --import tsx scripts/launch-diem-token.ts \
  --name "<name>" --symbol "<SYM>" --creator <creatorWallet> \
  --marketcap-diem <mcap> --presale-vault <vault> --extension-bps 1000
```
The factory calls `vault.receiveTokens()` → sets `depositDeadline = now + depositWindow`.

### Step 4 — Monitor the window
```bash
V=<vault>; R=https://mainnet.base.org
~/.foundry/bin/cast call $V "depositDeadline()(uint256)" --rpc-url $R
~/.foundry/bin/cast call $V "totalDeposited()(uint256)"  --rpc-url $R
~/.foundry/bin/cast call $V "totalWeight()(uint256)"     --rpc-url $R   # stake mode
~/.foundry/bin/cast call $V "getShare(address)(uint256)" <depositor> --rpc-url $R
~/.foundry/bin/cast call $V "lockExpiryOf(address)(uint256)" <depositor> --rpc-url $R  # stake mode, per-user
```

### Step 5 — After the deadline
- Depositors call `claimTokens()` (once each).
- **Contribute:** anyone calls `finalizeVVV()` → all VVV to `agentWallet`. Then bootstrap compute: agent stakes VVV (`VVV_STAKING.stake(agent, amount)` at `0x321b7ff7…`) → sVVV gates the Venice API key mint (observed threshold ≈4.5 sVVV, not the 1 sVVV the UI implies); inference budget = staked DIEM at $1/DIEM/day. To stake DIEM the agent holds: `node --import tsx scripts/queue-intent.ts stake-diem` (no ERC-20 approve needed).
- **Stake:** each depositor calls `withdrawDepositToken()` after their own `lockExpiryOf()` passes.
- Zero participants → `sweepUnallocated()` sends the 10% to the agent. Unclaimed remainder → `sweepDust()` after deadline + max lock + 14 days.

## After launch

1. Check `memory/launches.jsonl` for `tokenAddress`; `memory/presales.jsonl` for the vault (record `"contract": "LiquidPresaleVault"`).
2. Write log to `memory/logs/${today}.md`:
   ```
   ### compute-presale
   - token: <tokenAddress>
   - name: <name> / <symbol>
   - vault: <vaultAddress> (LiquidPresaleVault, <contribute|stake>)
   - depositDeadline: <timestamp>
   ```
3. Notify via `./notify`:
   ```
   AUTONOMOPOLY: Launched ${symbol} with ${mode} presale vault.
   Vault: ${vaultAddress} | Window closes: ${depositDeadline}
   ```
4. If a launch-queue entry was consumed, mark `"processed": true`.

## Error handling

If any transaction reverts:
- Check agent has ETH for gas: `cast balance $AGENT --rpc-url https://mainnet.base.org`
- `ExtensionNotEnabled` on deployToken: Step 2 was skipped or targeted a different vault address — verify with the operator before redeploying anything (a redeployed vault needs a fresh enable).
- `CapExceeded`: depositor exceeded `perAddressCap` (cumulative across deposits).
- `TierMismatch`: stake-mode depositor used a different tier than their first deposit.
- `OnlyFactory`: vault constructed with the wrong factory address — redeploy.
- Log error to `memory/logs/${today}.md` and notify via `./notify`

## Full reference

End-to-end creator/depositor guide with FAQ: `docs/PRESALE_GUIDE.md` (this repo). Policy + reconcile record: `docs/superpowers/plans/2026-06-12-presale-policy-reconcile.md`, Linear MOG-497.
