# Demo Storyboard — Stake Presale Depositor Flow

Shot-by-shot storyboard for a demo GIF or short video of the depositor flow on a stake presale. This is a description for whoever records it — no recording is produced here.

Flow covered: connect -> approve DIEM -> pick 60d tier -> deposit -> see share -> (after window) claim -> (after lock) withdraw.

> Draft only. Mechanics are accurate to the shipped LiquidPresaleVault as of 2026-06-12. Keep on-screen claims truthful: principal returns in full; the token allocation is market risk; stake mode only.

## Format notes

- Target length: 25-40 seconds. A looping GIF can stop after the share reveal (frame 6) and use the later frames as a follow-up clip.
- Aspect: 16:9 for video, 1:1 or 4:5 crop for social.
- Capture a real testnet/fork session if possible. If using mocked balances, watermark the frame "illustrative".
- No background music with lyrics; keep captions readable. Match the dry, declarative copy voice — no exclamation points.
- Mask or use a throwaway wallet address. Never show a real seed or private key.

## Frames

### Frame 1 — Token launch page (cold open)

- **Visual:** The `/launch/<token>?stakesale=<vault>` page. Token name, symbol, image. A live countdown showing the deposit window (e.g. "57:12 remaining"). The vault address visible with a "verify on Basescan" link.
- **Caption:** "A new agent token is launching. 10% of supply is in a stake presale."
- **Hold:** 3s. Let the countdown tick once.

### Frame 2 — Connect wallet

- **Visual:** User clicks "Connect Wallet". Wallet modal appears, user selects their wallet, connection confirms. Address now shown truncated in the header (e.g. `0x1234...abcd`).
- **Caption:** "Connect your wallet."
- **Hold:** 2s.

### Frame 3 — Verify the vault address

- **Visual:** Cursor hovers the vault address, clicks "verify on Basescan". A second tab/inset shows the vault contract on Basescan matching the on-page address.
- **Caption:** "Always verify the vault address on Basescan first. Addresses come from the URL."
- **Hold:** 3s. This frame is a deliberate safety beat — do not cut it.

### Frame 4 — Approve DIEM

- **Visual:** User enters a deposit amount (e.g. 10 DIEM). Clicks "Approve DIEM". Wallet pops the ERC-20 approval for the exact amount to the vault. User confirms. Button transitions to a pending spinner, then to "Approved".
- **Caption:** "Approve DIEM for the vault."
- **Hold:** 3s including the confirm.

### Frame 5 — Pick the 60-day tier and deposit

- **Visual:** Three tier options shown: 30d (1x), 60d (2x), 90d (3x). The 60d tier is preselected as default and highlighted. User leaves it on 60d. Clicks "Deposit". Wallet pops the deposit transaction. User confirms.
- **Caption:** "Pick a lock tier. 60 days at 2x is the default. Your first deposit locks your tier."
- **Hold:** 4s including the confirm.

### Frame 6 — See your share

- **Visual:** Deposit confirms. The page updates to show the user's position: amount deposited (10 DIEM), tier (60d / 2x), weight, and estimated share of the 10% (e.g. "your share: 40% of presale, ~4B tokens"). A small line notes "share may change as others deposit until the window closes".
- **Caption:** "Your share is set by amount x tier multiplier. It does not decay — depositing earlier gives no edge."
- **Hold:** 4s. This is the GIF loop point.

### Frame 7 — Window closes (time jump)

- **Visual:** A clean transition card: "Deposit window closed." The countdown reads 00:00. The position card now shows a "Claim" button enabled.
- **Caption:** "When the window closes, claim opens."
- **Hold:** 2s. Use a subtle time-jump treatment (fade or "1 hour later" lower-third).

### Frame 8 — Claim tokens

- **Visual:** User clicks "Claim". Wallet pops `claimTokens()`. User confirms. Token balance appears in the position card and in the wallet. The "withdraw DIEM" control is shown but disabled with a label "unlocks in 60 days".
- **Caption:** "Claim your token allocation. Your locked DIEM stays until your tier expires."
- **Hold:** 3s.

### Frame 9 — Lock expires, withdraw DIEM (time jump)

- **Visual:** Second time-jump lower-third ("60 days later"). The "Withdraw DIEM" control is now enabled. User clicks it. Wallet pops `withdrawDepositToken()`. User confirms. The 10 DIEM returns to the wallet balance; position card shows "DIEM returned in full".
- **Caption:** "After your lock expires, withdraw your DIEM in full. Principal returned. Token value is market risk."
- **Hold:** 4s.

### Frame 10 — Closing card

- **Visual:** Summary card. Three lines: "Locked 10 DIEM at 60d / Claimed token allocation at close / Withdrew 10 DIEM at lock expiry". Footer: "Stake mode only. Unaudited contract — verify before you deposit."
- **Caption:** "Lock-to-earn. Your principal always comes back."
- **Hold:** 4s. End on this frame.

## On-screen copy guardrails

- Never imply guaranteed returns. The token allocation can be worth less than the deposit.
- Always pair "claim" (tokens) and "withdraw" (DIEM principal) so viewers do not conflate them.
- Keep the "unaudited / verify on Basescan" beats in (frames 3 and 10). Do not trim them for length.
- Stake mode only — do not show or mention a VVV/contribute path.
