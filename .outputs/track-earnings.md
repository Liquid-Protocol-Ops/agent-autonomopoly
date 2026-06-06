Done. Summary:

---

**track-earnings — 2026-06-06**

Script ran against live Base RPC. Snapshot appended to `memory/earnings.jsonl`.

**Numbers:**
- `tick=-72` — lowest recorded tick. Significant DIEM/WETH price drop vs prior ticks (1251–1974 range over recent days).
- `FeeLocker: 0.005097 DIEM` claimable — nearly empty. Prior tick on 06-06 showed 0.3457 DIEM; Inference: executor claimed ~0.340 DIEM between first tick and this run.
- `tokensOwed0/1: 0` across all 60 positions — no uncollected fees in NFPM.
- `totalDiemWei: 0` — expected; all fresh mints or recently collected.

**LP state (on-chain confirmed):**
| tokenId | range | status |
|---------|-------|--------|
| 5274051 | [-400, 1600] | IN RANGE ✓ |
| 5274058/5274068/5274073/5274079/5274088 | [-600, 1400] | IN RANGE ✓ (×5) |
| 5274420/5274422 | [-800, 1200] | IN RANGE ✓ (NEW — first snapshot) |
| all others | various | BURNED (52 positions) |

**New positions discovered:** `#5274420` and `#5274422` — both [-800,1200], liquidity `2.1T` and `25.5T` respectively. Minted since the 2026-06-05 08:41Z on-chain check. Inference: repositioned down when tick broke through -600 lower bound.

**Milestone:** DIEM=18.1355/100 (accumulate mode). FeeLocker at 0.005097 DIEM is below 0.1 threshold — no claim this tick. Daily rate reassessment warranted: at tick=-72, active positions are WETH-heavy and earning WETH fees primarily, not DIEM. Inference: DIEM fee rate may be lower than the 0.485 DIEM/day observed rate.
