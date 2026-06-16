---
page_type: authored
genesis_lock: true
created: 2026-06-16T00:00:00Z
updated: 2026-06-16T00:00:00Z
tags: [identity, schema, spec]
---
# SCHEMA — manual of style for vhermes-asksurplus-arb

This document defines the shape of every `.md` file in the agent's repo. **`genesis_lock: true`** — this file does not change for the lifetime of the agent once deployed. The drift lint (`scripts/lint-identity.ts`) enforces conformance on every commit.

The schema extends the AUTONOMOPOLY pattern with VHermes-specific tags for AskSurplus arbitrage operations.

## Frontmatter

Every page begins with YAML frontmatter delimited by `---`. Required keys:

- **`page_type`** — one of `ingested | authored | derived`. See [[#page-types]].
- **`genesis_lock`** — `true | false`. `true` means "this file is immutable for the agent's lifetime"; the lint flags any commit that mutates a genesis-locked file.
- **`created`** — ISO-8601 UTC timestamp of first write.
- **`updated`** — ISO-8601 UTC timestamp of last write. For `genesis_lock: true` pages, equals `created`.
- **`tags`** — non-empty list, drawn only from the controlled vocabulary in [[#controlled-tags]].

Conditionally required:

- **`sources`** — list of `{ url, cite }` objects. **Required iff** `page_type: ingested`. `cite` is the human-readable citation (e.g., `"Author. Year. Title."`).
- **`drift_threshold`** — number in `[0, 1]`. **Required iff** the file is `*.genesis.md`. Default 0.85. The mutable working copy must score ≥ `drift_threshold` against the genesis on every commit.

Unknown frontmatter keys are a lint error. If a new key is needed, this schema must be amended at the population level via death-and-redeploy.

## Page types

- **`ingested`** — copied from an external source. Requires `sources`. Long-form excerpts must be summarized in the agent's voice; raw quotes are bounded by the 25-word cap (see [[#quote-cap]]).
- **`authored`** — original prose by the deployer (for genesis files) or the agent (for mutable working copies). No `sources` required, though linking to inputs is encouraged.
- **`derived`** — computed by the agent from other pages or tick results (e.g., a memory page summarizing a span of activity). Must reference its inputs via internal links so the lineage is auditable.

## Internal links

Use `[[path/to/page]]` form. The path is repo-root-relative, no `.md` extension. Every `[[...]]` link must resolve to an existing file in the repo. Broken links are a lint error.

## Quote cap

Any markdown blockquote (`>`) line, joined into one block, must contain ≤ 25 words. Longer quotes are a lint error.

## Controlled tags

The full vocabulary for v1:

- **`identity`** — anything inside `identity/`.
- **`schema`** — this file and any future style-guide pages.
- **`soul`** — SOUL-related (genesis or working copy).
- **`style`** — STYLE-related.
- **`influence`** — lineage and influences pages.
- **`calibration`** — examples corpus (good / bad / promoted).
- **`spec`** — specification documents.
- **`decision`** — decision records.
- **`memory`** — reserved for the agent's mutable memory pages.
- **`observation`** — reserved for `derived` pages computed from ticks.
- **`arbitrage`** — AskSurplus spread signals, PnL, positions.
- **`market`** — order book data, pricing, provider health.
- **`yield`** — wstDIEM staking, Venice credits, compounding.

Tags are lowercase. A page may carry multiple tags.