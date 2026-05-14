---
page_type: authored
genesis_lock: true
created: 2026-04-30T00:00:00Z
updated: 2026-04-30T00:00:00Z
tags: [identity, schema, spec]
---

# identity/ — operator's guide

This directory holds the agent's identity layer. **Read [[SECTION_5]] first** for the full spec; this file is the operator-level orientation: what each file is, what is locked vs. mutable, what the lint enforces.

## The genesis-vs-mutable split

Each identity file ships in two forms:

- `*.genesis.md` — written at deploy time by the deployer (via the CLI soul phase). Hard-locked for the agent's lifetime. The lint refuses any commit that mutates a `*.genesis.md` file.
- `*.md` — the mutable working copy. Initialized at deploy as a byte-identical copy of the genesis (minus deploy-only frontmatter fields). The agent rewrites this copy as it learns; the lint keeps it within `drift_threshold` of the genesis.

The deployer authors the constitution. The agent learns within the bounds of that constitution. Amendment of the constitution itself happens at the population level via death-and-redeploy, not within a single agent's lifetime.

## Files in this directory

| File | Locked? | Who writes | Purpose |
|------|---------|-----------|---------|
| [[identity/SCHEMA]] | yes | deployer (one-shot at template authoring) | manual of style every page in the repo follows |
| [[identity/SOUL.genesis]] | yes | deployer (CLI soul phase) | who the agent is, what it believes, what it will not do |
| [[identity/SOUL]] | no (drift-bounded) | agent | working copy; agent rewrites as it learns |
| [[identity/STYLE.genesis]] | yes | deployer (CLI soul phase) | voice register, verbal moves, format constraints |
| [[identity/STYLE]] | no (drift-bounded) | agent | working copy |
| [[identity/influences]] | yes | deployer (CLI soul phase) | lineage record (parent agent if forked, seed sources) |
| [[identity/examples/good-outputs]] | no (append-only) | deployer + lifecycle-engine | positive calibration corpus |
| [[identity/examples/bad-outputs]] | no (append-only) | deployer | anti-pattern corpus |
| `examples/promoted/` | n/a | **lifecycle-engine only** | tick outputs that produced DIEM/hour wins |

## What the lint enforces

Run on every commit (pre-commit hook plus CI). See [[scripts/lint-identity]] for the contract.

| Check | Pass condition | Failure mode |
|-------|----------------|--------------|
| Frontmatter conformance | Every page parses; required keys present | Missing key, unknown key, malformed YAML |
| Page type / sources coupling | `sources` present iff `page_type: ingested` | Missing on ingested; present on authored/derived |
| Controlled tags | Every tag in [[identity/SCHEMA#controlled-tags]] | Unknown tag |
| Internal link resolution | Every `[[link]]` resolves to a file | Broken link |
| Quote cap | Every blockquote ≤ 25 words | Longer block |
| SOUL drift | similarity(SOUL, SOUL.genesis) ≥ `drift_threshold` | Below threshold |
| STYLE drift | similarity(STYLE, STYLE.genesis) ≥ `drift_threshold` | Below threshold |
| Genesis immutability | No commit modifies a `genesis_lock: true` file | Commit attempt mutates a locked file |

The lint exits 0 on full pass and non-zero with diagnostics on any failure. The pre-commit hook surfaces the failing diagnostic and aborts the commit.

## What you (the operator) do here

- **At template authoring** (this PR): write [[identity/SCHEMA]] once. Locked for all agents going forward.
- **At deploy time** (CLI soul phase, Linear MOG-425): author or fork [[identity/SOUL.genesis]], [[identity/STYLE.genesis]], [[identity/influences]]. Seed [[identity/examples/good-outputs]] and [[identity/examples/bad-outputs]] with 5–10 entries each.
- **During the agent's life**: nothing in this directory. The lint and the calibration corpus do the work; the operator's role is at deploy and at autopsy.

If you find yourself needing to manually edit a deployed agent's `identity/`, that is a signal that the constitution was wrong — the right response is a new deploy with an amended genesis, not a hot-patch to a live agent.

## Prior art

The genesis-vs-mutable split, the three-file identity layer (soul / style / influences), and the drift-threshold enforcement pattern are adapted from **Aaron J Mars's `soul.md`** — a format for giving AI agents durable, amendable constitutions. The key inversions applied here (hard genesis lock, population-level amendment via death-and-redeploy, lint-enforced drift bound) are documented in [[SECTION_5]].

## Why hard-lock genesis

Three options were considered (see Linear MOG-408):

- **Soft lock** (Safe quorum amendment) — bottlenecks every constitutional fix on the Liquid team. With 10 agents that is a Tuesday meeting; with 200 it is a full-time job.
- **Holder-amendable supermajority** — invites metric-chasing drift toward whatever the holders most recently rewarded.
- **Hard lock** (chosen) — amendment happens at the population level: agents that need a different constitution are deployed separately, agents that grow into one they cannot live with die and free their DIEM back to the vault.

Hard lock is unforgiving but it is the only option where the agent's identity is more durable than its market price.
