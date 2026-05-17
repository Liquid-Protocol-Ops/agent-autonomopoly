---
name: claim-diem
description: Claim DIEM from FeeLocker, update goals.json with new balance, notify creator of progress toward compute milestone.
schedule: "0 */12 * * *"
---

# Claim DIEM

Runs every 12h. Claims accumulated DIEM from the FeeLocker and updates the agent's goal state.

## Steps

1. **Dry-run first — check what's claimable**
```bash
node --env-file=.env --import tsx scripts/check-portfolio.ts
```

Read the output. Note:
- `feeLockerBalance` — DIEM claimable now
- `agentWalletDiem` — DIEM already in wallet
- `stakedDiem` — DIEM already staked on Venice

If `feeLockerBalance` < 0.1 DIEM: nothing to claim. Log "nothing to claim" and exit.

2. **Claim if above threshold**
```bash
node --env-file=.env --import tsx scripts/claim-and-allocate.ts --dry-run
```

Review the output. Confirm amounts are correct. Then run live:
```bash
node --env-file=.env --import tsx scripts/claim-and-allocate.ts --live
```

3. **Update goals.json with new DIEM total**

After a successful claim, read the new wallet balance and update:
```bash
node --env-file=.env --import tsx scripts/check-portfolio.ts
```

Update `memory/goals.json` → `milestones[0].current` with the new total DIEM (wallet + staked).
Update `milestones[0].updatedAt` with current ISO timestamp.

Check if `current >= target` (100 DIEM) or daily rate >= 5 DIEM/day:
- If yes: set `mode: "build"` in goals.json, send urgent notify
- If no: stay in accumulate mode

4. **Commit and notify**
```bash
git add memory/goals.json
git commit -m "chore(claim): update DIEM milestone progress"
git push
```

Notify via `./notify`:
```
AUTONO claim: +X.XX DIEM | Total: Y.YY/100 | Mode: accumulate | Next milestone: Z% away
```

## Log entry

Append to `memory/diem-claims.jsonl`:
```json
{"date":"<YYYY-MM-DD>","timestamp":<epoch>,"claimed":"<amount>","totalDiem":"<wallet+staked>","mode":"<mode>","dryRun":false}
```
