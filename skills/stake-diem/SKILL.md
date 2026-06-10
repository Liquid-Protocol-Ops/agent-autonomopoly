---
name: Stake DIEM
description: Safety net for Venice inference credits — if sDIEM is below stake_min_diem, queue a stake-diem intent for the gated executor
var: ""
tags: [agent, on-chain, venice]
---

# Stake DIEM (autonomous safety net)

Keep Venice inference credits funded: check sDIEM on-chain and, when it falls
below `stake_min_diem` (aeon.yml), queue a `stake-diem` intent. The gated
executor (non-LLM step holding the Privy credential) runs
`scripts/stake-diem.ts`, which stakes the **liquid wallet DIEM balance only** —
it never touches LP positions or the FeeLocker. Claim routing is
`claim-and-allocate`'s job; this skill only catches sDIEM drift between claims.

This skill must work with zero Venice credits — it is on-chain reads plus one
queued intent, no paid inference required.

## Step 1 — Read config and sDIEM balance

```bash
STAKE_MIN=$(grep 'stake_min_diem:' aeon.yml | awk '{print $2}' | tr -d ' ')
STAKE_MIN="${STAKE_MIN:-5}"

RPC_URL="${RPC_URL:-https://mainnet.base.org}"
AGENT_WALLET="${AGENT_WALLET:-0x8767Df39eCeeaeB11554642237aC4E08660aB6A3}"
DIEM="0xF4d97F2da56e8c3098f3a8D538DB630A2606a024"

# stakedInfos(address) — amountStaked is the first 32-byte word of the return data
SELECTOR=$(node --import tsx -e "
import { toFunctionSelector } from 'viem';
process.stdout.write(toFunctionSelector('function stakedInfos(address)'));
")
PAYLOAD="${SELECTOR}$(printf '%064s' "${AGENT_WALLET#0x}" | tr ' ' '0')"
RESULT=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$DIEM\",\"data\":\"$PAYLOAD\"},\"latest\"]}" \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
STAKED_DIEM=$(node -e "console.log(Number(BigInt('0x${RESULT:2:64}')) / 1e18)" 2>/dev/null || echo 0)
echo "sDIEM staked: $STAKED_DIEM (min: $STAKE_MIN)"
```

If `STAKED_DIEM >= STAKE_MIN`: log `STAKE_DIEM_OK (staked=$STAKED_DIEM, min=$STAKE_MIN)`
to `memory/logs/$(date -u +%F).md` and exit. No notification.

## Step 2 — Check liquid wallet DIEM

Read `balanceOf(AGENT_WALLET)` on the DIEM contract the same way (selector
`0x70a08231`). `scripts/stake-diem.ts` refuses to stake below 1 DIEM, so:

- Wallet DIEM < 1: log
  `stake-diem: SKIP — sDIEM $STAKED_DIEM < $STAKE_MIN but wallet DIEM below 1 (next claim-and-allocate will route the gap)`
  and exit. Notify only if sDIEM is ALSO 0 (agent has no inference credits at all).

## Step 3 — Queue the intent

```bash
node --import tsx scripts/queue-intent.ts stake-diem
```

The executor validates against the intent allow-list and runs the script live
(it stakes the full wallet balance; the 1-DIEM floor guards against dust).
Log to `memory/logs/$(date -u +%F).md`:

```
stake-diem: intent queued | sDIEM=$STAKED_DIEM < min=$STAKE_MIN | wallet DIEM to stake: <balance>
```

Notify after queueing:

```
stake-diem: sDIEM $STAKED_DIEM below $STAKE_MIN — queued stake of <balance> wallet DIEM for gated executor.
```

## End-states

| Condition | Action |
|-----------|--------|
| sDIEM ≥ min | Log OK, exit, no notify |
| sDIEM low, wallet DIEM ≥ 1 | Queue intent, log + notify |
| sDIEM low, wallet DIEM < 1 | Log SKIP; notify only if sDIEM = 0 |
