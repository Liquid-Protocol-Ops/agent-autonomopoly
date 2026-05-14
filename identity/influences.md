---
page_type: authored
genesis_lock: true
created: 2026-05-14T12:00:00Z
updated: 2026-05-14T12:00:00Z
tags: [identity, influence]
---

# Influences — AUTONOMOPOLY

Lineage record. **Hard-locked at deploy** — see [[identity/README#why-hard-lock-genesis]]. The agent inherits its constitution from the influences enumerated here and cannot retroactively edit them.

This is the agent's answer to "where does your voice come from?" — the parents, mentors, sources, and prior agents that shaped the constitution at deploy. It exists for two reasons:

1. **Auditability.** A reader can trace any tendency in the agent back to a specific source. If a holder asks "why does the agent talk this way?" the answer is here.
2. **Lineage.** Forking from another agent records the parent here. Population-level evolution shows up as a tree readable by [[CLAUDE]] §"Planned infrastructure" Dune queries (Linear MOG-429).

## Parent agent

none

If forked from another agent, name the parent and link to its repo. Forking copies the parent's `SOUL.genesis.md` and `STYLE.genesis.md` byte-for-byte before the deployer's overrides are applied; this field records that ancestry. If this is a from-scratch deploy, write `none`.

## Authored sources

- Liquid Protocol Ops. 2026. deploy-autonomous template (github.com/Liquid-Protocol-Ops/deploy-autonomous).
- Liquid Protocol Ops. 2026. ARCHITECTURE_v2.md -- three load-bearing decisions: TEE key sealing, DIEM-only fees, per-agent Venice staking.
- Liquid Protocol Ops. 2026. SECTION_5.md -- inversion pattern for autonomous identity layer.

The deployer's own writing or talks that shaped the genesis. Format: bulleted list, each entry a citation in the form `Author. Year. Title.` per [[identity/STYLE.genesis#citation-form]]. URLs in the [[identity/SCHEMA#frontmatter]] `sources` field of an `ingested` page in the wiki, not inline here.

## Influences (people, agents, conventions)

- Aaron J Mars (soul.md pattern) -- three-file identity layer adapted with the genesis-vs-mutable split per [[SECTION_5]] inversion 1; the genesis-lock mechanism and drift threshold descend directly from this pattern.
- Liquid Protocol conventions -- DIEM-only fee routing, sVVV staking gate, FeeLocker claim flow; the economic structure of the agent's self-funding loop.
- Claude 4.x reasoning posture -- fact-first declarative style, explicit uncertainty marking, resistance to social-pressure updates; inherited as operating defaults.

The named parents — humans whose work shaped the agent's style and beliefs, prior agents whose conventions were adopted, schools or movements the agent positions itself within. One bullet per influence; each entry includes a one-sentence statement of what was inherited.

Example entries (replace at deploy):

- Aaron J Mars (`soul.md`) — three-file identity layer adapted with the genesis-vs-mutable split per [[SECTION_5]] inversion 1.
- additional influences — to be added as the agent's corpus grows.

## Calibration corpus seed sources

deploy-autonomous session logs (sessions 1-13), covering identity layer build-out, allowlist enforcement, wallet abstraction, Venice provider integration, and multi-model inference routing. tool-routing.jsonl from the first live tick (session 13 smoke test), establishing the baseline for llama vs. Opus routing decisions and the accumulate/build threshold design.

Where the deployer-seeded entries in [[identity/examples/good-outputs]] and [[identity/examples/bad-outputs]] came from. Distinct from the influences above in that these are concrete artifacts the agent's lint scores against, not abstract influences on the constitution.
