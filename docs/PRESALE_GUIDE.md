# Venice Agent Launchpad — Presale Guide

End-to-end guide for **creators** launching a token with a presale and **depositors** backing one. Canonical as of 2026-06-12 (policy: Linear MOG-497). Contract: `LiquidPresaleVault` (source `liquid-website/contracts/presale/src/LiquidPresaleVault.sol`).

## What a presale launch is

A Liquid Protocol token launch (100B supply, paired with DIEM on a Uniswap V4 dynamic-fee pool) with **10% of supply diverted into a presale vault** instead of LP. Backers deposit during a short window (default **1 hour**); after it closes they claim their pro-rata share of the 10%. The other 90% becomes permanent locked liquidity. LP trading fees stream 95% to the creator, 5% to AUTONO.

There are two presale modes, and **they have fundamentally different economics**:

| | CONTRIBUTE (VVV) | STAKE (DIEM) |
|---|---|---|
| You deposit | VVV | DIEM |
| Your principal | ⚠ **GONE FOREVER** — irrevocably transferred to the agent | **Returned in full** after your lock expires |
| What you get | Share of the 10% pro-rata by amount | Share of the 10% pro-rata by amount × your lock-tier multiplier |
| What the agent gets | All the VVV — this **funds its Venice compute** | **Nothing.** Stake mode does not fund the agent; it's a fair-distribution mechanism where your "cost" is opportunity cost of locked DIEM |
| Lock | none (instant, permanent) | your chosen tier (e.g. 30/60/90 days), counted **from the window close** |

## For creators

### What you provide

| Field | Default | Notes |
|---|---|---|
| Name / symbol | — | symbol ≤10 chars |
| Image | none | optional, ≤5MB, pinned to IPFS |
| Starting marketcap | 50 DIEM | sets the pool's initial price tick |
| Mode | contribute | contribute (VVV) or stake (DIEM) — one vault, one mode |
| Deposit window | **1 hour** | configurable |
| Per-address cap | 0 (unlimited) | cumulative across deposits per wallet; sybil-able — treat as a fairness signal, not a hard guarantee |
| Lock tiers (stake only) | 30d/1×, 60d/2×, 90d/3× | 1–4 tiers; durations strictly increasing; multipliers 1–1000 non-decreasing |
| Your wallet | — | becomes `agentWallet` (receives contribute-mode VVV), tokenAdmin, and 95% LP-fee recipient. You must hold sVVV (the wizard checks) |

### Launch sequence (curated — current process)

1. **Vault deploys** with your config (website `/launch/confirm` step 1, or operator-run).
2. **Operator enables the vault** on the Liquid factory — the Safe signs `setExtension(vault, true)` via `SafeEnablePresaleVault.s.sol`. ⚠ Without this, the token deploy reverts `ExtensionNotEnabled`. Do **not** retry the website flow while waiting — a retry deploys a *new* vault that would need its own enable.
3. **Token deploys** with the vault as an extension; the factory hands the vault its 10% and the deposit clock starts.
4. Share your token page: `/launch/<token>?vvv=<vault>` (contribute) or `?stakesale=<vault>` (stake).

### After the window closes (contribute mode — bootstrapping your agent's compute)

1. Anyone may call `finalizeVVV()` — all VVV moves to your agent wallet.
2. Stake it: `VVV_STAKING.stake(agentWallet, amount)` (`0x321b7ff7…`) → non-transferable sVVV.
3. sVVV gates minting the agent's **Venice API key** — plan for **≈4.5 sVVV minimum** (observed; UI copy saying "≥1" understates it).
4. The key's daily inference budget comes from **staked DIEM at $1/DIEM/day** — DIEM your agent earns (e.g. trading fees) and stakes; contribute-mode VVV buys the key gate, not the budget. (≈50 inference calls/DIEM/day is a rough estimate that varies by model.)

### Edge cases you should know

- **Zero deposits:** call `sweepUnallocated()` — the full 10% goes to your agent wallet.
- **Unclaimed tokens:** recoverable via `sweepDust()` only after window close + your longest lock + 14 days.
- **Orphaned vault:** if the token-deploy tx fails after the vault deployed, the vault is dead weight (harmless, holds nothing) — deploy a fresh one; it needs a fresh enable.

## For depositors

### How to participate

1. Open the token's launch page. ⚠ **Vault addresses come from the URL** — verify the vault address on Basescan against the official link from the creator before approving anything (the page itself warns about this).
2. Approve the deposit token (VVV or DIEM) for the vault — the UI requests exact amounts.
3. Deposit before the countdown ends. Stake mode: your **first deposit locks your tier**; later deposits must use the same tier. Caps are cumulative per wallet.
4. After the window closes: `claimTokens()` — once per wallet, any time, your share doesn't decay.
5. Stake mode only: after **your** lock expires (`lockExpiryOf(you)` = window close + your tier), `withdrawDepositToken()` returns your DIEM in full.

### Your share

- Contribute: `yourVVV / totalVVV × 10% of supply`
- Stake: `(yourDIEM × tierMultiplier) / totalWeight × 10% of supply`
- Integer division rounds down; dust stays in the vault (eventually swept to the agent).

### Risk summary

| Risk | Contribute | Stake |
|---|---|---|
| Principal loss | **100% by design** — you are donating VVV to the agent | None at contract level (DIEM returned in full) |
| Token value | Market risk — your allocation may be worth less than your deposit | Same, but your principal is intact |
| Lock | n/a | DIEM illiquid until your tier expires |
| Contract | Unaudited (GHSA-reviewed + 24 unit + fork-tested against the live factory; external audit pending) | same |
| Phishing | Verify vault address from URL on Basescan | same |

## Contract quick reference

`deposit(amount)` (contribute) / `deposit(amount, lockDuration)` (stake) · `claimTokens()` · `withdrawDepositToken()` (stake, post-lock) · `finalizeVVV()` (contribute, post-window, permissionless) · `sweepUnallocated()` / `sweepDust()` (to agent) · views: `getShare(addr)`, `lockExpiryOf(addr)`, `depositDeadline()`, `totalDeposited()`, `totalWeight()`, `lockTiers()`. Guards: nonReentrant + CEI everywhere, balance-delta accounting (fee-on-transfer safe), `DepositTokenCollision` check, per-address cap, `TierMismatch`.

## Current limitations (honest list)

- Single vault per launch; dual-tranche (10% VVV + 10% DIEM simultaneously) is a planned fast-follow — the factory already supports it.
- Each launch needs a Safe-signed enable step (curated launches only for now; self-serve needs a singleton-extension refactor).
- Vault discovery is URL-param-based (phishing-prone); on-chain discovery from the token's extension list is specced but unbuilt.
- No presale listing/discovery page yet.
- `LiquidPresaleVault` is not externally audited.
- The DIEM/VVV rate (≈0.00141, May 2026) and calls-per-DIEM estimates shown in UIs are snapshots — verify current rates before sizing a contribute-mode raise.
