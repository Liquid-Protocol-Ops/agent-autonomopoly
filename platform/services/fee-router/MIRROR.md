# fee-router here is a MIRROR — deploy-autonomous is canonical

**Canonical:** `Liquid-Protocol-Ops/deploy-autonomous` → `platform/services/fee-router/`
**This copy:** a mirror. Do not treat it as the source of truth.

## Why this file exists

Both repos carry a full copy of this service. As of 2026-08-04 the application
code is *byte-identical* (`diff -r src/` is clean) and
`platform/docker-compose.yml` is byte-identical too — but the dependency
manifests have already drifted, in **both directions**. Two copies with no
stated owner drift silently; this file states the owner.

## Which is canonical, and why

deploy-autonomous landed the service as a real feature PR — *"feat(platform):
session 11 — fee-router Hono service (read-only Base poller) (#20)"*, 2026-05-13.
This repo received it the same day inside its **"Initial commit"**, i.e. as a
wholesale copy at repo creation. deploy-autonomous has the history; this does not.

## Neither repo is the long-term home

`platform/STATUS.md` is explicit: these services *"belong in a separate
`deploy-autonomous-platform` repo. Move them out once that repo exists."*
So this mirror is temporary by design. When that repo lands, both copies go away
rather than one winning.

## Sync rule

1. **Change `src/` in deploy-autonomous first**, then port here. Never the reverse.
2. **Dependency versions must match across both copies.** Converge **upward** to
   the newer version — do not downgrade this repo to match the canonical one.
   The canonical copy is currently *behind* on most deps (see below), so
   convergence means bumping deploy-autonomous, not regressing this one.
3. When either copy changes, update the drift table below or delete it once the
   copies are back in lockstep.

## Recorded drift (2026-08-04)

`src/` identical; `docker-compose.yml` identical; manifests differ:

| dep | deploy-autonomous (canonical) | this repo |
|---|---|---|
| `@hono/node-server` | `^1.13.7` | **`^2.0.4`** — major version apart |
| `viem` | `^2.21.0` | `^2.54.3` |
| `tsx` | `^4.22.4` | `^4.23.0` |
| `vitest` | `^4.1.7` | `^4.1.9` |
| `hono` | `^4.12.27` | `^4.12.23` ← only dep where this repo is behind |
| `ws` override | `>=8.20.1` | `^8.21.0` |

Two things worth acting on:

- **Identical application code is running on a major-version-different HTTP
  server** (`@hono/node-server` 1.x vs 2.x). That is the drift risk, already
  realised.
- **The canonical repo's `ws` override is `>=8.20.1`**, which still permits
  8.20.x. CVE-2026-45736 is patched in **8.21.0**, so `^8.21.0` (this repo's
  value) expresses the intent correctly and the canonical one should adopt it.

Convergence is not done here because it cannot be done from this side alone:
bumping the canonical copy across a `@hono/node-server` major requires running
its own test suite, and that repo's `railway.toml` makes any push to it a
production deploy of the `wstdiem-keeper` service.
