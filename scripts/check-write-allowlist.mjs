#!/usr/bin/env node
// Runtime enforcement of the agent's write allow-list — the workflow-layer guard
// that `harness/safety/allowlist.ts` was supposed to be but never enforced on the
// live `claude -p` path.
//
// Run as a CI step BEFORE the commit/push step. It fails the job (exit 2) if any
// path changed in this run falls outside the agent's mutation surface — so a
// poisoned skill, a prompt injection, or a buggy self-edit cannot land changes to
// the harness, the fund-moving scripts, the CI workflows, the deps, or the genesis
// identity files and have the next scheduled tick execute them.
//
// The agent MAY self-evolve its skills, identity working copies, and notebook
// (that is the product). It MAY NOT rewrite its own capability surface.
//
// Allow-list policy is intentionally explicit and lives in this committed file so
// the agent cannot widen it (writing to scripts/ is itself blocked).

import { execFileSync } from 'node:child_process';

// Directory prefixes under which all paths are writable by the agent + cron.
export const ALLOWED_PREFIXES = [
  'memory/',
  'wiki/',
  'skills/',                       // workflow-run skills (self-evolution surface)
  '.claude/skills/',               // interactive skills (self-evolution surface)
  'docs/',                         // heartbeat writes docs/status.md
  'dashboard/outputs/',            // captured per-skill outputs
  '.outputs/',                     // chain artifacts
  '.pending-notify/',              // transient notify queue
  'identity/examples/promoted/',   // promoted calibration corpus
];

// Exact files the agent may modify (mutable identity working copies + transient).
export const ALLOWED_FILES = new Set([
  'identity/SOUL.md',
  'identity/STYLE.md',
  'identity/influences.md',
  '.notify-sent-hashes',
]);

// Hard blocks that win even under an allowed prefix (genesis/schema are locked).
const BLOCKED_SUFFIXES = ['.genesis.md'];
const BLOCKED_FILES = new Set(['identity/SCHEMA.md']);

export function isAllowed(p) {
  if (!p) return true;
  if (BLOCKED_FILES.has(p)) return false;
  if (BLOCKED_SUFFIXES.some((s) => p.endsWith(s))) return false;
  if (ALLOWED_FILES.has(p)) return true;
  return ALLOWED_PREFIXES.some((pre) => p.startsWith(pre));
}

// execFile (no shell) — args are passed as an array so nothing is shell-interpreted.
function git(args, allowFail = false) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' });
  } catch (err) {
    if (allowFail) return '';
    throw err;
  }
}

function changedPaths() {
  // Establish the pre-run baseline. The cron runs on the default branch, so
  // origin/main is the state before the agent touched anything. Fetch it so the
  // ref exists even on a shallow checkout; fall back to HEAD if offline.
  const base = process.env['ALLOWLIST_BASE_REF'] || 'origin/main';
  git(['fetch', '--quiet', '--depth=1', 'origin', 'main'], true);
  let tracked = git(['diff', '--name-only', base], true);
  if (!tracked) {
    // base ref unavailable — compare against HEAD (catches only uncommitted),
    // strictly weaker but never crashes the gate.
    tracked = git(['diff', '--name-only', 'HEAD'], true);
  }
  const untracked = git(['ls-files', '--others', '--exclude-standard'], true);
  const all = (tracked + '\n' + untracked)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(all)];
}

function main() {
  const paths = changedPaths();
  const violations = paths.filter((p) => !isAllowed(p));
  if (violations.length) {
    console.error('write-allowlist: BLOCKED — changes outside the agent mutation surface:');
    for (const v of violations) console.error('  ✗ ' + v);
    console.error(
      '\nThe agent may only write: memory/ wiki/ skills/ .claude/skills/ docs/ ' +
        'dashboard/outputs/ .outputs/ identity/SOUL.md identity/STYLE.md identity/influences.md',
    );
    console.error(
      'It may NOT modify harness/, scripts/, .github/, platform/, package*.json, ' +
        '*.genesis.md, or identity/SCHEMA.md. Blocking the push (fail closed).',
    );
    process.exit(2);
  }
  console.log(
    `write-allowlist: OK — ${paths.length} changed path(s), all within the agent mutation surface.`,
  );
}

// Only run the git/CI checks when invoked directly, so tests can import isAllowed.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
