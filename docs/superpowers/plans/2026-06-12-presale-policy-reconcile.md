# Presale policy + reconcile pass — 2026-06-12

## POLICY v2 (later same day — supersedes decision 4's framing)

5. **STAKE MODE ONLY at launch.** Contribute (VVV) mode is disabled for the launch product — stakers ALWAYS get their DIEM back. Consequence (accepted): presales do not fund agent compute.
6. **Defaults locked:** deposit window 1h · starting marketcap 5 DIEM · lock tiers 30d/1x, **60d/2x (default selection)**, 90d/3x.
7. Website track addition: remove/disable the contribute-mode radio in the wizard; default tier 60d.

## POLICY v3 (later again — pool setup + fees)

8. **LP fees DIEM-only by default:** `feePreference [Paired, Paired]` — both reward slots auto-convert to DIEM.
9. **AUTONO rug-proofing:** per-slot reward admins `[creator, AUTONO_WALLET]` — locker slot-gates `updateRewardRecipient`/`updateFeePreference`, so the creator cannot touch AUTONO's 5%. ⚠ This also fixed a latent revert: the locker REQUIRES `rewardAdmins.length == rewardBps.length`; the website's `presale.ts` still passes 1 admin + 2 recipients and would revert at `deployToken` — added to MOG-568.
10. **7-position liquidity ladder** (locker max) replaces the single position — marketcap-multiple ranges: 1–5× 4%, 5–20× 6% (sub-100-DIEM region thin: 10% total), 20–200× 30%, 50–200× 13% (overlap), 200–2000× 22%, 2000–20000× 17%, 10000×–max 8%. Implemented + dry-run-verified in `deploy-autonomous/scripts/launch-diem-token.ts` (PRs #69 + #70). Website confirm page must adopt the same `lockerConfig` (MOG-568).
11. Starting marketcap default **5 DIEM** (PRs #50/#67).

Decisions made by Gordon this session (recorded in Linear MOG-497):

1. **Canonical presale contract: `LiquidPresaleVault`** — source `liquid-website/contracts/presale/src/LiquidPresaleVault.sol`, bytecode embedded in `liquid-website/src/lib/presale.ts`. `ComputePresaleVault`, `ComputePresaleFactory`, `MintDiemPresaleVault` (liquid-protocol-v0) and `StakesaleVault` are **superseded** — kept for tests/reference, never to be deployed.
2. **Allocation policy: ONE vault per launch at 10% of supply** (`extensionBps = 1000`). Dual-tranche (10% VVV vault + 10% DIEM vault = 20%) is a **fast-follow**, not current — the `/launch` page "two-tranche" copy must be corrected until it ships.
3. **Default deposit window: 1 hour** everywhere. Website wizard currently takes whole days (min 1) — needs a days→hours form change (website repo).
4. **Economics clarification (must appear in all user-facing docs):** contribute-mode VVV is swept to the agent wallet and funds compute (VVV → sVVV → Venice key; budget = staked DIEM at $1/DIEM/day). **Stake-mode DIEM is returned to depositors in full — it does NOT fund the agent**; stake mode is purely a lock-for-allocation distribution mechanism.

## Done this session (this repo + cross-repo)

- [x] Security review of ComputePresaleVault + dashboard (MOG-497 comments, all PASS)
- [x] `SafeEnablePresaleVault.s.sol` + fork tests — liquid-protocol-v0 PR #19, merged (`d986c62`)
- [x] Full 3-repo feature sweep (findings in MOG-497 comment 2026-06-12)
- [x] Workspace `~/CLAUDE.md` reconciled to the decisions
- [x] `skills/compute-presale/SKILL.md` rewritten for LiquidPresaleVault (this repo)
- [x] `docs/PRESALE_GUIDE.md` — end-to-end creator/depositor guide (this repo)

## Remaining — this track (agent/ops repos)

- [ ] deploy-autonomous: reconcile `.claude/skills/compute-presale` + `stakesale` SKILL.md; `launch-diem-token.ts` `--extension-bps` default 2000→1000 + comment fixes; deprecation headers on `deploy-compute-presale.ts` / `deploy-stakesale.ts` (PR, squash)
- [ ] liquid-protocol-v0: SUPERSEDED notice headers on the three old presale contracts; update `EXTENSION-ALLOWLIST.md` ("no plans to approve additional extensions" contradicts the launchpad — per-launch Safe enables are now policy) (PR, squash)
- [ ] Retarget `deploy-compute-presale.ts` to LiquidPresaleVault bytecode (needs artifact provenance from MOG-569 first — do not retarget before that lands)
- [ ] presale-monitor.ts: verify ABI compat with LiquidPresaleVault (`lockExpiryOf(address)` per-user vs old global `lockExpiry()`; the single-tier shim covers 1-tier vaults only)
- [ ] dashboard `presales.json` `contract` field expects "MintDiemPresaleVault" — update export + SPA types when first LiquidPresaleVault presale is recorded

## Remaining — website track (NEW SESSION: MOG-568/569 + follow-ups)

- [ ] MOG-568 confirm-page "vault pending approval" gate. ⚠ `enabledExtensions` mapping in Liquid.sol is **internal — no public getter**. The page cannot `eth_call` it; read the storage slot via `eth_getStorageAt` (mapping at its declared slot, key = vault address) or watch `SetExtension(address,bool)` events. Verify slot index against the deployed factory before shipping.
- [ ] MOG-569 VAULT_BYTECODE provenance + CI drift check (blocks script retarget above)
- [ ] Wizard: deposit window days→hours, default 1h (decision #3)
- [ ] `/launch` page copy: remove/asterisk "two-tranche presale" until fast-follow ships (decision #2)
- [ ] `docs/presale-product-spec.md`: fold in the four decisions; mark dual-tranche §s as fast-follow
- [ ] website CLAUDE.md says "No test suite exists" — false (vitest + presale tests); fix
- [ ] Stake-mode UI copy: make explicit the locked DIEM does not fund the agent (decision #4)

## Open Linear state

- MOG-497 (In Progress): user testing + marketing + Dune remain; security review + enable-path + policy decisions done
- MOG-565: item 1 (optimizer_runs) resolved by website PR #291 (now 20000); item 2 (ComputePresaleSecurity.t.sol review) done — 4/4 GHSA regression tests pass. Close after confirming nothing else pending.
- MOG-568/569: website track, new session
