# Stake Presales — Explainer

Venice Agent Launchpad. Lock DIEM, earn a token allocation, get your DIEM back.

This is a one-page explanation of the **stake presale** — the launch product. It is not a fundraise. It does not fund the agent. It is a distribution mechanism: you lock DIEM for a fixed term, you earn a share of a new token's supply weighted by your lock tier, and your DIEM is returned to you in full when the lock expires. Your only cost is the opportunity cost of locked DIEM. The token allocation carries market risk.

## What a stake presale is

A Liquid Protocol token launch diverts **10% of supply** (100B total) into a presale vault instead of the permanent liquidity position. Backers deposit DIEM during a short window (default **1 hour**). After the window closes, each backer claims their pro-rata share of that 10%, weighted by their chosen lock tier. The remaining 90% becomes permanent locked liquidity, deployed as a 7-position ladder paired against DIEM.

One vault per launch, at 10% of supply. (A dual-tranche variant — a separate VVV vault alongside the DIEM vault — is a planned fast-follow and is not offered today.)

**Contribute (VVV) mode is NOT offered.** The contract supports a second mode where you donate VVV permanently to fund the agent's compute. That mode is policy-disabled at launch. The only mode you can use is stake mode, and in stake mode your principal always comes back.

## Lock tiers and multipliers

Your share is weighted by how long you lock. Longer lock, larger multiplier, larger slice of the 10%.

| Tier | Lock duration | Multiplier |
|---|---|---|
| 1 | 30 days | 1x |
| 2 | **60 days (default)** | **2x** |
| 3 | 90 days | 3x |

Lock durations count **from the window close**, not from your deposit. Your **first deposit locks your tier** — later deposits must use the same tier.

Your share:

```
share = (yourDIEM x tierMultiplier) / totalWeight x 10% of supply
```

`totalWeight` is the sum of `(amount x multiplier)` across every depositor. Integer division rounds down; dust stays in the vault. Note the weighting is by **lock tier**, not by deposit time — depositing earlier in the window gives no larger share, and your share does not decay.

## Lifecycle: deposit -> claim -> withdraw

1. **Deposit** (during the window). Approve DIEM for the vault, then deposit and pick your tier. The countdown is short — default 1 hour.
2. **Claim** (after the window closes). Call `claimTokens()` once. Your token allocation lands in your wallet. You can claim any time after close; your share does not decay.
3. **Withdraw** (after your lock expires). Once `lockExpiryOf(you)` passes — window close plus your tier's duration — call `withdrawDepositToken()`. Your DIEM returns in full.

Claim and withdraw are independent: you get the tokens at close, you get the DIEM back at lock expiry.

## Worked example — 5 DIEM starting marketcap

Starting marketcap 5 DIEM against 100B supply puts the launch price at 5e-11 DIEM/token. The full 10% presale pot is 10B tokens, nominally worth **0.5 DIEM at launch price**.

Two depositors:

- **Alice** deposits 10 DIEM at the 60-day tier (2x). Weight = 20.
- **Bob** deposits 30 DIEM at the 30-day tier (1x). Weight = 30.
- Total weight = 50.

Allocations:

| | Deposit | Tier | Weight | Share | Tokens | Value at launch price |
|---|---|---|---|---|---|---|
| Alice | 10 DIEM | 60d / 2x | 20 | 40% | 4B | 0.2 DIEM |
| Bob | 30 DIEM | 30d / 1x | 30 | 60% | 6B | 0.3 DIEM |

Alice locked 10 DIEM for 60 days to receive tokens worth 0.2 DIEM at launch price. Bob locked 30 DIEM for 30 days to receive tokens worth 0.3 DIEM at launch price.

This is the honest anchor: at launch, your allocation is worth far less than the DIEM you lock. The thesis is appreciation as price moves up the liquidity ladder. Whatever the token does, the locked DIEM returns in full at expiry — Alice gets her 10 DIEM back after 60 days, Bob gets his 30 DIEM back after 30 days.

## Risk disclosure

- **Principal.** Your DIEM is returned in full after your lock expires. No fee, no haircut at the contract level.
- **Token value is market risk.** Your token allocation may be worth more or less than the DIEM you locked — including less. There is no guaranteed return. The allocation's value at launch is a small fraction of the deposit; any upside depends entirely on the market.
- **Liquidity.** Your DIEM is illiquid for the full lock term. You cannot exit early.
- **Contract.** `LiquidPresaleVault` is **unaudited**. It is GHSA-reviewed, has 24 unit tests, and is fork-tested against the live Liquid factory. An external audit is pending. Do not treat it as audited.
- **Phishing.** Vault addresses are passed through the URL today. Always verify the vault address on Basescan against the creator's official link before approving or depositing.

## Why this is not a fundraise

In stake mode the agent receives nothing. The DIEM you lock sits in the vault and comes back to you. The agent's compute is funded separately — by DIEM it earns from trading fees and stakes on Venice — not by your deposit. A stake presale is a fair-distribution mechanism, not a capital raise.
