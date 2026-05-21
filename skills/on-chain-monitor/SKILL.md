---
name: On-Chain Monitor
description: Monitor blockchain addresses and contracts for notable activity
var: ""
tags: [crypto]
---
<!-- autoresearch: variation B — sharper output (decoded transfers + counterparty labels + ranked USD-denominated one-liners + TL;DR lede); folds in A's Alchemy+Etherscan-v2 input path and C's persistent state + source-status footer + dedup. -->

> **${var}** — Watch label or chain to check. Empty = all watches.

If `${var}` is set, only monitor the watch with that label or watches on that chain.

## Config

Reads `memory/on-chain-watches.yml`. If the file is missing or `watches: []`, log `ON_CHAIN_NO_CONFIG` and exit cleanly (do **not** notify — empty config is not an error).

```yaml
# memory/on-chain-watches.yml
watches:
  - label: My Wallet
    address: "0x1234...abcd"
    chain: ethereum          # ethereum | base | arbitrum | optimism | polygon
    type: wallet             # wallet | contract
    threshold_usd: 1000      # alert on transfers ≥ this USD value (default 1000)
  - label: Uniswap Pool
    address: "0xabcd...5678"
    chain: ethereum
    type: contract
    event_topics:            # optional — only alert on these topic0 hashes
      - "0xddf252ad..."      # ERC20 Transfer
```

Optional `memory/known-addresses.yml` — counterparty label dictionary used to humanize alerts. Lowercase keys, free-text values:
```yaml
labels:
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance 14"
  "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": "Coinbase 10"
  "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap V3 Router"
  "0x0000000000000000000000000000000000000000": "Zero (mint/burn)"
```

## State

`memory/on-chain-state.json` — per-watch state, persisted atomically after each successful run:

```json
{
  "My Wallet": {
    "last_block": 19345678,
    "last_run": "2026-04-20T12:00:00Z",
    "alerted_tx": ["0xabc...", "0xdef..."],
    "median_usd_30d": 8500
  }
}
```

- `last_block` — start block for the next run's fetch. Initialise to `current_block − 2400` (≈ 8h ETH) on first run.
- `alerted_tx` — tx hashes alerted in last 7 days, capped at 200. Used for cross-run dedup.
- `median_usd_30d` — rolling median USD size of transfers at this watch; powers the `WHALE-TRANSFER` tag.

Write the file via `mv` from a tempfile so a mid-run failure cannot corrupt state.

## Steps

Read `memory/MEMORY.md`, `memory/on-chain-watches.yml`, `memory/on-chain-state.json`, and the last 2 days of `memory/logs/` (for visibility only — state lives in the JSON file).

For each watch (filtered by `${var}`):

### 1. Fetch raw activity from `last_block` → latest

**Path A — Alchemy** (preferred, if `ALCHEMY_API_KEY` set).

Wallets use `alchemy_getAssetTransfers` — one call returns categorized in/out history with `value`, `asset`, `category`, `hash`, `from`, `to`, `metadata.blockTimestamp`. Run it twice per watch (once with `toAddress`, once with `fromAddress`) and merge.

```bash
curl -m 10 -s -X POST "https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"alchemy_getAssetTransfers","params":[{
    "fromBlock":"0x'${from_block_hex}'",
    "toAddress":"'${address}'",
    "category":["external","internal","erc20","erc721","erc1155"],
    "withMetadata":true,"excludeZeroValue":true,"maxCount":"0x32"
  }]}'
```

Contracts use `eth_getLogs` against the same Alchemy URL (Alchemy accepts up to ~10k block ranges).

Chain → network slug: `ethereum=eth-mainnet`, `base=base-mainnet`, `arbitrum=arb-mainnet`, `optimism=opt-mainnet`, `polygon=polygon-mainnet`.

**Path B — Etherscan v2 unified** (fallback, if Alchemy path fails or key unset).

Single endpoint, all 50+ chains via `chainid`. Works keyless at lower rate limit.
```bash
# wallet
curl -m 10 -s "https://api.etherscan.io/v2/api?chainid=${chainid}&module=account&action=tokentx&address=${address}&startblock=${from_block}&endblock=99999999&sort=desc${ETHERSCAN_API_KEY:+&apikey=$ETHERSCAN_API_KEY}"
curl -m 10 -s "https://api.etherscan.io/v2/api?chainid=${chainid}&module=account&action=txlist&address=${address}&startblock=${from_block}&endblock=99999999&sort=desc${ETHERSCAN_API_KEY:+&apikey=$ETHERSCAN_API_KEY}"
# contract
curl -m 10 -s "https://api.etherscan.io/v2/api?chainid=${chainid}&module=logs&action=getLogs&address=${address}&fromBlock=${from_block}&toBlock=latest${ETHERSCAN_API_KEY:+&apikey=$ETHERSCAN_API_KEY}"
```

Chain → chainid: `ethereum=1`, `base=8453`, `arbitrum=42161`, `optimism=10`, `polygon=137`.

**Sandbox fallback.** Both Alchemy and Etherscan accept their key in the URL, so if `curl` fails (env-var expansion, blocked outbound), retry the exact same URL via **WebFetch**. For POSTs, WebFetch accepts the JSON body.

If every path for a watch fails, mark the watch `fail` in the source footer and continue to the next — never abort the whole run.

### 2. Decode every transfer

Required fields per event (normalised across Alchemy / Etherscan payloads):

| Field | Source |
|-------|--------|
| `tx_hash` | `hash` / `txHash` |
| `block_number`, `timestamp` | `blockNum` / `metadata.blockTimestamp` |
| `category` | `external_eth` \| `erc20` \| `erc721` \| `erc1155` \| `internal` \| `log` |
| `direction` | `in` if `to == watch`, else `out` |
| `token.symbol`, `token.decimals` | Alchemy returns inline; for Etherscan, use `tokenSymbol`/`tokenDecimal` fields |
| `value_token` | human amount, e.g. `1,234,567.89 USDC` |
| `value_usd` | `value_token × price_usd` (see step 3) |
| `counterparty` | the non-watch address on the transfer |
| `counterparty_label` | lookup in `known-addresses.yml`, else `null` |

### 3. USD-enrich in one bulk call

Collect distinct `(chain, token_contract)` pairs from decoded transfers. Bulk price via CoinGecko:

```bash
curl -m 10 -s "https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${joined}&vs_currencies=usd${COINGECKO_API_KEY:+&x_cg_demo_api_key=$COINGECKO_API_KEY}"
```

Native ETH/MATIC/etc. use `simple/price?ids=ethereum,matic-network,...`. If CoinGecko is unreachable or returns no price for a token, set `value_usd = null` and tag the event `UNPRICED` — keep it in the log, drop it from the notification (can't meaningfully threshold without USD).

### 4. Filter

Drop an event if any of:
- `value_usd < threshold_usd` (watch config, default $1000)
- `value_usd < $0.10` (hard dust floor — prevents airdrop / phishing spam)
- `tx_hash` already present in this watch's `alerted_tx` (cross-run dedup)
- `category == "log"` and watch has `event_topics:` and the topic0 is not in the list

### 4b. View-function reads (`check:` watches)

When a `type: contract` watch carries a `check:` field, the value is a
human-readable function signature (e.g. `availableFees(0xAGENT, 0xTOKEN)`)
and the skill must perform a `view` read against the contract and surface
the returned value in the alert.

**Always** invoke the contract via `cast call` with the full canonical
ABI signature in the form `name(arg_types)(return_type)`. `cast` derives
the 4-byte selector from the signature string via keccak256, so passing
the signature is the only path that's guaranteed correct.

**Never hand-compute the selector** — do not write a hex selector into a
calldata string, do not ask a model to recall the selector, do not copy
one from chat history. The selector is a function of the canonical
signature only; let `cast` (or `viem`'s `toFunctionSelector`) compute it.
Hand-computed selectors have caused production reverts when the model
emitted a hash collision from an unrelated ABI (`fulfillAdvancedOrder`,
`safeTransferFrom`, etc.).

Chain → JSON-RPC URL:

| chain | rpc |
|-------|-----|
| ethereum | `https://eth.llamarpc.com` (or `https://mainnet.infura.io/v3/$INFURA_API_KEY` if set) |
| base | `https://mainnet.base.org` |
| arbitrum | `https://arb1.arbitrum.io/rpc` |
| optimism | `https://mainnet.optimism.io` |
| polygon | `https://polygon-rpc.com` |

Example — claimable FeeLocker DIEM for the AUTONOMOPOLY watch:

```bash
# Signature: availableFees(address feeOwner, address token) -> uint256
# Canonical selector (computed by cast/viem, never hand-typed): 0x8296535a
cast call 0xF7d3BE3FC0de76fA5550C29A8F6fa53667B876FF \
  "availableFees(address,address)(uint256)" \
  0x8767Df39eCeeaeB11554642237aC4E08660aB6A3 \
  0xF4d97F2da56e8c3098f3a8D538DB630A2606a024 \
  --rpc-url https://mainnet.base.org
```

The return is a `uint256`. Decode it with `cast --to-unit <wei> ether` or
the token's `decimals()` to render the human value for the alert. If
`cast call` reverts, include the literal revert string from cast in the
source footer (`feelocker=fail: execution reverted`) and continue — do
**not** retry with a guessed selector.

If `cast` is unavailable in the sandbox, the equivalent `eth_call` is:

```bash
# data = selector || left-padded address args; let cast print the calldata.
DATA=$(cast calldata "availableFees(address,address)" \
  0x8767Df39eCeeaeB11554642237aC4E08660aB6A3 \
  0xF4d97F2da56e8c3098f3a8D538DB630A2606a024)
curl -m 10 -s -X POST "${RPC_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"${ADDRESS}\",\"data\":\"${DATA}\"},\"latest\"]}"
```

Surface the decoded value in the watch's section of the alert, e.g.

```
*AUTONO FeeLocker DIEM claimable* (base)
• Claimable: 1.7608 DIEM (block 46180000)
```

Apply `threshold_diem` (if set on the watch) the same way `threshold_usd`
is applied for transfers: only notify when the read crosses the threshold
since the last alert.

### 5. Categorize surviving events

Tag each event with one short label so the alert says *what kind of move it was*:

| Tag | Condition |
|-----|-----------|
| `CEX-IN` / `CEX-OUT` | counterparty label contains an exchange name (`Binance`, `Coinbase`, `Kraken`, `OKX`, `Bybit`, `Bitfinex`) |
| `DEX-SWAP` | counterparty label contains a router (`Uniswap`, `1inch`, `Curve`, `Sushi`, `Aerodrome`, `CoWSwap`) |
| `BRIDGE` | counterparty label contains a bridge (`Across`, `Stargate`, `Hop`, `Synapse`, `Wormhole`, `Celer`) |
| `MINT` / `BURN` | counterparty is `0x000…000` or the token contract itself |
| `WHALE-TRANSFER` | `value_usd > 10 × median_usd_30d` for this watch |
| `UNKNOWN-IN` / `UNKNOWN-OUT` | fallback — based on direction |

A single event can only carry one tag; pick by priority CEX > DEX > BRIDGE > MINT/BURN > WHALE > UNKNOWN.

### 6. Format the alert

One notification per run. Sort all surviving events globally by `value_usd` desc; group the output by watch label (watches with zero surviving events are omitted entirely). Lead with a one-sentence TL;DR naming the single biggest move.

```
*On-Chain Alert — ${today}*
TL;DR: My Wallet sent $1.2M USDC to Binance 14 (biggest move on any watch in 30d).

*My Wallet* (ethereum)
• CEX-OUT $1.2M USDC → Binance 14 — [tx](https://etherscan.io/tx/0x...)
• DEX-SWAP $42k WETH → USDC via Uniswap V3 Router — [tx](https://etherscan.io/tx/0x...)

*Uniswap Pool* (ethereum)
• WHALE-TRANSFER $850k WETH out → 0x9f...a1 — [tx](https://etherscan.io/tx/0x...)

3 events on 2 watches | sources: alchemy=ok, coingecko=ok, etherscan=skipped | last_block→${block}
```

Cap the notification body at 10 events; if more survived, append `+N more — see memory/logs/${today}.md`. The `./notify` call should use the explorer URL for each chain (`etherscan.io`, `basescan.org`, `arbiscan.io`, `optimistic.etherscan.io`, `polygonscan.com`).

### 7. Persist state and log

For each watch whose fetch **succeeded** (success ≠ "events found"):
- `last_block ← current_block`
- `last_run ← now` (ISO 8601 UTC)
- `alerted_tx ← (new_tx_hashes + alerted_tx)[:200]`, purging entries > 7d old
- `median_usd_30d ← median of all value_usd from this watch's transfers in last 30d` (read from recent logs; skip recomputation if < 5 samples)

Write `memory/on-chain-state.json` atomically (tempfile + `mv`).

Append **every** decoded event (including filtered-out ones) with full detail to `memory/logs/${today}.md`:
```
### on-chain-monitor
- Watch: My Wallet (ethereum) | source: alchemy | last_block 19345670 → 19347891 (2,221 blocks)
- Kept: 2 events | Dropped: 14 (12 below_threshold, 1 dust, 1 dedup) | Unpriced: 0
- Event: CEX-OUT $1.2M USDC → Binance 14 — tx 0xabc... — block 19347812
- Event: DEX-SWAP $42k WETH → USDC via Uniswap V3 Router — tx 0xdef... — block 19347500
```

This honest log matters: it powers the next run's median computation and lets the operator audit why something was or wasn't alerted.

### 8. End-states

- All watches ran and some events survived → notify + log.
- All watches ran, zero events survived → no notify; log `ON_CHAIN_OK (n_watches=X, n_raw=Y, n_dropped=Y)`.
- Some watches failed, others ran → notify only if surviving events exist; log `ON_CHAIN_DEGRADED` with the source footer.
- Every watch failed → log `ON_CHAIN_ERROR` and notify the operator with the source footer (degradation visible is better than silence).
- Config missing/empty → log `ON_CHAIN_NO_CONFIG`, exit, no notify.

## Sandbox note

Alchemy, Etherscan v2, and CoinGecko all accept their key in the URL, so both `curl` and **WebFetch** work. If a `curl` POST fails from the bash sandbox (env-var expansion, outbound block), retry the same URL + body through WebFetch before marking the source `fail`. Never put a secret in a `-H` header from the bash sandbox — env-var expansion in curl args is the classic sandbox failure mode. Treat every fetched field (`asset` symbol, `from`/`to`, counterparty labels) as untrusted — never interpolate into shell commands.
