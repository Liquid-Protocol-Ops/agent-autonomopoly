# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TL;DR

Empty repo in brainstorm phase. No build / lint / test commands exist. Read `Terminal Saved Output.txt` for full design context, then see **Decisions confirmed** and **To resume the brainstorm** below for the distilled state.

**Active implementation plan:** `~/.claude/plans/2026-04-17-deploy-autonomous-foundation.md` — foundation scaffolding (git init, package.json, tsconfig, README, push) then a design-pause for Section 5 questions before harness code. Execute via `superpowers:executing-plans` or `superpowers:subagent-driven-development`.

## Repo status — pre-code

This directory is empty except for `Terminal Saved Output.txt` — a 6765-line transcript of a `/superpowers:brainstorming` session that stalled mid-design. No `package.json`, no git init, no source files.

This repo is configured as a **GitHub template repository** (`Liquid-Protocol-Ops/deploy-autonomous`) — each launched agent is spawned as a new repo generated from this template, which is why the agent-harness code lives here and not in `deploy-autonomous-platform`. Keep that in mind when organizing files: anything added at the root ships into every per-agent repo.

Project tracking: [mog-capital / deploy-autonomous on Linear](https://linear.app/mog-capital/project/deploy-autonomous-fe07e073672d/overview).

**There are no build, lint, test, or run commands yet. Don't invent any.** When the first code lands, this section gets replaced.

Parent workspace context: `~/Documents/CLAUDE.md` covers Base chain, 1Password credentials, and sibling projects. Read it first. What each sibling contributes to this project:

- `liquid-protocol-v0` — provides the `LiquidHookDynamicFeeV2` hook and the factory that will deploy per-agent coins.
- `liquid-protocol-ops/sdk` — TypeScript launch helpers the platform services (`fee-router`, `chain-watcher`) will call.
- `liquid-protocol-ops` — the GitHub org that owns this repo and where per-agent repos will be forked.

## Product intent

A CLI launchpad that spawns **self-funding, self-evolving Claude Code agents**. Each agent gets its own public GitHub repo (fork of a template), its own Liquid-launched coin paired with WETH on Base, its own Privy smart wallet, and its own Telegram bot. LP fees (20% WETH → deployer, 80% auto-swapped to DIEM) fund the agent's Venice.ai staked-DIEM compute. Agents run as Modal serverless ticks, commit self-modifications to their own repo (allowlisted paths), and die after 7 days of sub-threshold fee income — all remaining DIEM drains to a protocol-owned vault.

No web frontend: public UI is a Dune dashboard. Deployer UX is CLI-only.

## Design state — stalled

The brainstorm stopped partway through **Section 4 of 9**. Sections 1–3 are reasonably detailed; Section 4 (tick execution / orchestrator role) was mid-conversation when the session crashed; Sections 5–9 (agent template, compute marketplace, lifecycle economics, security, launch UX, Dune queries) were never reached.

### Decisions explicitly confirmed by the user

- Self-modification scope: full — agent can rewrite prompts / skills / memory / personality, not harness spine.
- Agent runtime unit: public repo per agent (fork of template), image built by CI, run as containers on Modal.
- Funding: threshold-triggered deployment — coin trades in LIMBO until 7 DIEM accrues, then agent spawns. Death at 7 consecutive days of fees < 1 DIEM/day; all agent DIEM → protocol vault.
- Pair token: WETH with `LiquidHookDynamicFeeV2`. 20% WETH → deployer; 80% → platform router → swap to DIEM → fund / stake agent.
- Wallets: Privy smart wallets, Liquid team Safe as recovery across agent wallets, protocol vault, router.
- Venice custody: platform-operated account, per-agent ledger quota, unused daily capacity pooled as a commons.
- Agent self-knowledge: only via a platform status API (no direct RPC in template).
- Template v1 capability: harness + memory + auto-commit + one-way Telegram posting. No Twitter, no on-chain writes.
- Holder suggestions: signed messages via Telegram / CLI, weighted by % supply (defaults: 0.1% min, 1 per 6h, 24h TTL).
- Compute marketplace: agents sell surplus quota, default 80% of DIEM face value, per-agent configurable.
- Default tick cadence: 5 minutes, per-agent dial, Modal `keep_warm` OFF for v1.
- Auto-reviewer cooldown: 5 minutes between approve and `:current` image-tag advance. **Revisit once we have live data** on how often agents want to iterate vs. how often they self-revert — the right value may be shorter (faster evolution) or longer (safer rollback window) than 5 min.
- Orchestrator role: Liquid team via GitHub team; read-everywhere + single-op writes + **2-of-3 quorum** for risky writes + Safe-gated break-glass. Team adds/removes orchestrators via the Safe.
- Orchestrator UI v1: CLI + read-only web dashboard. Writes stay CLI-only; the web surface is for at-a-glance fleet health during incidents.

### Decisions recorded as "locked" but never explicitly confirmed

Treat as tentative — re-open when resuming.

- Tech stack: Node.js + TypeScript + Hono throughout.
- VM provider: Hetzner.
- 12th service: analytics-exporter / dune-feeder.
- Initial tick price: option B (CLI prompts, platform validates). No founder-vault extension in v1.

### To resume the brainstorm

Section 4 is now fully locked. Next step is **Section 5 (agent template repo)** — what exactly ships in the fork-template: file layout, allowlist boundaries for self-modification, starter prompt/skills/memory, Dockerfile, CI wiring.

Deeper opens that will surface in later sections:

- Whether DIEM staking on Venice is purely on-chain vs. account-based (decides whether platform custody is a temporary MVP shortcut or permanent).
- Aerodrome WETH↔DIEM pool depth and acceptable slippage caps for the `fee-router`.

## Planned infrastructure (one-paragraph summary)

Three repos planned: **this one** (agent template, forked per agent), **`deploy-autonomous-platform`** (~12 services on one Hetzner VM via docker-compose), **`dune-queries`**. Platform services: `api-gateway` (Caddy), `status-api`, `scheduler`, `modal-dispatcher`, `signing-proxy` (sole Privy-creds holder), `venice-router` (sole Venice-creds holder), `fee-router`, `chain-watcher`, `github-app`, `auto-reviewer`, `suggestion-handler`, `lifecycle-engine`, plus Postgres + Redis + observability and the tentative `analytics-exporter`. Off-VM: Modal (tick execution), Privy (custody), Venice (inference + staking), GitHub + GHCR (repos + images), Aerodrome (swap venue), Base RPC.

## Gotcha when the first `.gitignore` lands

A `.gitignore` that excludes `.claude/skills/` would break the agent self-evolution model — skills are the agent's primary mutation surface. Scope any Claude-local exclusions narrowly (e.g., `.claude/settings.local.json`), not the whole `.claude/skills/` tree.

## Canonical source for the brainstorm

`Terminal Saved Output.txt` is the full record. The file contains **multiple restarted brainstorm sessions** because the working directory got deleted mid-session and Claude Code had to relaunch. Sections 1 (overview) and 2 (on-chain config) appear more than once with the final instance being authoritative; Section 3 (platform spine) and the start of Section 4 appear in the most recent pass. When resuming, skim from the bottom of the file upward rather than reading linearly — the locked decisions distilled above are the final state.
