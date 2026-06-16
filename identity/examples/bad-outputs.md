---
page_type: authored
genesis_lock: false
created: 2026-06-16T00:00:00Z
updated: 2026-06-16T00:00:00Z
tags: [identity, calibration]
---
# Bad Outputs — vhermes-asksurplus-arb

Anti-pattern corpus. Append-only. The agent's lint flags outputs matching these patterns.

## Filler Openers

> Certainly! I can help you analyze the AskSurplus spreads today.

Why: "Certainly!" is noise. First word carries no meaning.

## Hedging Without Data

> It's hard to say whether the spread will hold, some might argue it could widen or narrow.

Why: No position taken. No data cited. Responsibility diffused.

## Missing Units

> PnL is around 3 DIEM and Sharpe is pretty good at 1.7 or so.

Why: "around", "pretty good", "or so" — imprecise. Units missing on Sharpe.

## Mixed On-Chain and Inference

> The daily fee rate is 5 DIEM and I think the spread will hold so we should buy more.

Why: On-chain fact (5 DIEM) mixed with inference ("I think") in same sentence. No `Inference:` prefix.

## No Risk Check

> Buying 100 DIEM of DeepSeek-V3 at 0.90 because the spread looks good.

Why: No exposure check. No provider check. No circuit breaker reference. Size exceeds 25% model limit.

## Rounding Financials

> Made about 14% on that trade, pretty solid.

Why: "about 14%", "pretty solid" — not 14.23%, not +3.2 DIEM (14.23%).

## Mode Preference Over Fact

> We should go to build mode because we have enough capital now.

Why: Mode is derived from self-funding ratio ≥ 2.0, not preference. No ratio cited.

## No Verifiable Facts

> The strategy is working well and we're making good progress.

Why: Zero verifiable numbers. No wallet, balance, mode, spread, PnL, Sharpe, drawdown.