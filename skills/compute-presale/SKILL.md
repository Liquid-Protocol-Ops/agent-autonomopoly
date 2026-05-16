---
name: Compute Presale
description: Deploy a MintDiemPresaleVault alongside a new Liquid Protocol token to bootstrap Venice compute for an unfunded agent. VVV depositors get token allocation; vault converts VVV → DIEM → agent wallet.
var: ""
tags: [defi, on-chain, launch, venice]
---

Bootstrap Venice compute for an unfunded agent by deploying a `MintDiemPresaleVault` alongside a new token launch.

**Two deposit paths:**

| Path | Function | Who uses it | Flow |
|------|----------|-------------|------|
| VVV | `deposit(vvvAmount, minDiemOut)` | VVV holders | Vault stakes VVV → sVVV (internal) → `mintDiem` → DIEM to agent |
| DIEM | `depositDIEM(diemAmount)` | DIEM holders | DIEM passes through directly to agent |

Depositors never see sVVV — it is the vault's internal staked balance created during VVV conversion.

**Rate (Base mainnet, 2026-05):** ~0.00141 DIEM/VVV — need ~70,884 VVV for 100 DIEM (~$10,600)  
**Deposit window:** default 24h; configurable at deploy time (minimum 2h, maximum 30 days)  
**Protocol fee (autonomopoly):** set at deploy time (e.g. 200 bps = 2%)

Both paths add to `totalDiemMinted`. Allocation scales linearly with DIEM routed vs `diemTarget`:
```
effectiveAllocation = min(totalDiemMinted, diemTarget) * extensionSupply / diemTarget
depositorShare      = diemContributed[depositor] * effectiveAllocation / totalDiemMinted
```
`diemContributed` is the DIEM-equivalent per depositor (VVV converted value or direct DIEM amount).  
If only 50% of `diemTarget` is reached, only 50% of `extensionSupply` is distributable; the rest is burned.

## When to run

- When a `memory/launch-queue.jsonl` entry has `"presale": true`
- When agent has no Venice API key and needs compute bootstrapped from VVV holders
- When a token launch is requested and the creator wants Venice ecosystem backers

## Required parameters

Check `memory/launch-queue.jsonl` for a pending entry:
```json
{
  "name": "Token Name", "symbol": "SYM", "creator": "0x...",
  "marketcapDiem": 50, "image": "https://...",
  "presale": true,
  "depositWindowDays": 7,
  "diemTarget": 100,
  "protocolFeeBps": 200
}
```

Defaults if no queue entry: `depositWindowDays=7`, `diemTarget=100`, `protocolFeeBps=0`.

## Execution

### Step 1 — Deploy the presale vault
```bash
node --env-file=.env --import tsx scripts/deploy-compute-presale.ts \
  --deposit-window-hours 24 \
  --diem-target 100 \
  --protocol-fee-bps 200 \
  --dry-run
# Remove --dry-run to execute
# Min window: 2h. Max window: 30 days (720h).
```
Note the `vaultAddress` from output.

### Step 2 — Launch token with vault as extension
```bash
node --env-file=.env --import tsx scripts/launch-diem-token.ts \
  --name "<name>" \
  --symbol "<symbol>" \
  --creator "<creator>" \
  --marketcap-diem <marketcapDiem> \
  --presale-vault <vaultAddress>
```
The factory calls `vault.receiveTokens()` → sets `depositDeadline = block.timestamp + depositWindow`.

### Step 3 — Monitor the deposit window

Read vault state:
```bash
VAULT=<vaultAddress>
RPC=https://mainnet.base.org
cast call $VAULT "depositDeadline()(uint256)"   --rpc-url $RPC
cast call $VAULT "totalDiemMinted()(uint256)"   --rpc-url $RPC
cast call $VAULT "remainingCapacity()(uint256)" --rpc-url $RPC
cast call $VAULT "totalVvvDeposited()(uint256)" --rpc-url $RPC  # VVV path only

# Per-depositor breakdown
DEPOSITOR=<address>
cast call $VAULT "diemContributed(address)(uint256)" $DEPOSITOR --rpc-url $RPC
cast call $VAULT "vvvDeposited(address)(uint256)"    $DEPOSITOR --rpc-url $RPC
cast call $VAULT "diemDeposited(address)(uint256)"   $DEPOSITOR --rpc-url $RPC
cast call $VAULT "getShare(address)(uint256)"        $DEPOSITOR --rpc-url $RPC
```

After `depositDeadline` passes, depositors call `claimTokens()` and anyone can call `burnUnclaimed()` to burn unallocated supply.

### Step 4 — Stake DIEM for Venice inference

Once DIEM lands in agent wallet:
```bash
node --env-file=.env --import tsx scripts/stake-diem.ts
```
(Delegates to `stake-diem` skill — calls `DIEM.stake(amount)` directly, no ERC-20 approve needed)

## After launch

1. Check `memory/launches.jsonl` for `tokenAddress`.
2. Check `memory/presales.jsonl` for vault address.
3. Write log to `memory/logs/${today}.md`:
   ```
   ### compute-presale
   - token: <tokenAddress>
   - name: <name> / <symbol>
   - vault: <vaultAddress>
   - diemTarget: <N> DIEM
   - depositDeadline: <timestamp>
   ```
4. Notify via `./notify`:
   ```
   AUTONOMOPOLY: Launched ${symbol} with VVV presale vault.
   Vault: ${vaultAddress}
   DIEM target: ${diemTarget} | Window closes: ${depositDeadline}
   ```
5. If a launch-queue entry was consumed, mark `"processed": true`.

## Error handling

If any transaction reverts:
- Check agent has ETH for gas: `cast balance $AGENT --rpc-url https://mainnet.base.org`
- Verify PRIVY_* env vars are present
- If `WouldExceedCap()`: depositor tried to mint more than remaining capacity — check `remainingCapacity()`
- If `NotFactory()`: only Liquid Protocol factory may call `receiveTokens` — vault was passed wrong factory address
- Log error to `memory/logs/${today}.md` and notify via `./notify`
