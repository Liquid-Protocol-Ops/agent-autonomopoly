// Instantiates identity template files for an agent deployment.
//
// Usage:
//   node --import tsx scripts/create-identity.ts <config.json> [--target <dir>] [--force]
//
// What it does:
//   1. Reads *.genesis.md.template and influences.md.template from this repo's identity/
//   2. Substitutes all {{placeholder}} tokens from the config JSON
//   3. Writes SOUL.genesis.md, STYLE.genesis.md, influences.md to target/identity/
//   4. Derives SOUL.md and STYLE.md from their genesis files:
//      - flips genesis_lock: true → false
//      - removes the drift_threshold: line
//      - body is byte-identical (guarantees Jaccard ≈ 1.0, passing the 0.70 threshold)
//   5. Runs lint-identity to verify
//
// Required config keys:
//   agent_name, deploy_timestamp (ISO-8601 UTC e.g. 2026-05-14T12:00:00Z),
//   drift_threshold (0–1 float as string, e.g. "0.70"),
//   who_the_agent_is, what_the_agent_believes, what_the_agent_cares_about,
//   what_the_agent_will_not_do, what_makes_the_agent_particular,
//   how_the_agent_handles_disagreement, voice_register, verbal_moves,
//   anti_moves, telegram_format, parent_agent_or_none,
//   authored_sources, influences_list, corpus_seed_sources

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_REPO_ROOT = resolve(__dirname, '..');

function parseArgs(argv: string[]): { configPath: string; targetDir: string; force: boolean } {
  const args = argv.slice(2);
  let configPath = '';
  let targetDir = TEMPLATE_REPO_ROOT;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (arg === '--target') {
      const next = args[i + 1];
      if (!next) { console.error('--target requires a path'); process.exit(1); }
      targetDir = resolve(next);
      i++;
    } else if (arg === '--force') {
      force = true;
    } else if (!configPath && !arg.startsWith('--')) {
      configPath = arg;
    }
  }

  if (!configPath) {
    console.error('Usage: create-identity <config.json> [--target <dir>] [--force]');
    process.exit(1);
  }

  return { configPath, targetDir, force };
}

function substitute(template: string, config: Record<string, string>): string {
  // Handle {{key | default: value}} (Liquid-style filter syntax)
  let result = template.replace(
    /\{\{([^|}]+)\s*\|\s*default:\s*([^}]+)\}\}/g,
    (_, key: string, def: string) => config[key.trim()] ?? def.trim(),
  );

  // Handle simple {{key}} tokens
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const k = key.trim();
    if (k in config) return config[k] ?? match;
    console.warn(`  warning: unresolved placeholder {{${k}}}`);
    return match;
  });

  return result;
}

// Derive the mutable working copy from a genesis file:
// - flip genesis_lock: true → false
// - remove the drift_threshold: line (including trailing newline)
// Body is preserved byte-for-byte, ensuring Jaccard ≈ 1.0.
function deriveWorkingCopy(genesis: string): string {
  let copy = genesis.replace(/^genesis_lock: true$/m, 'genesis_lock: false');
  copy = copy.replace(/^drift_threshold:.*\r?\n/m, '');
  return copy;
}

function main(): void {
  const { configPath, targetDir, force } = parseArgs(process.argv);

  const config = JSON.parse(readFileSync(resolve(configPath), 'utf8')) as Record<string, string>;
  const templateIdentityDir = join(TEMPLATE_REPO_ROOT, 'identity');
  const targetIdentityDir = join(targetDir, 'identity');

  if (!existsSync(targetIdentityDir)) {
    console.error(`Target identity dir not found: ${targetIdentityDir}`);
    process.exit(1);
  }

  const FILES: Array<{ tpl: string; out: string; mutable: string | null }> = [
    { tpl: 'SOUL.genesis.md.template',  out: 'SOUL.genesis.md',  mutable: 'SOUL.md'  },
    { tpl: 'STYLE.genesis.md.template', out: 'STYLE.genesis.md', mutable: 'STYLE.md' },
    { tpl: 'influences.md.template',    out: 'influences.md',    mutable: null        },
  ];

  // Pre-flight: check for existing genesis files before writing any
  for (const { out } of FILES) {
    const outPath = join(targetIdentityDir, out);
    if (!force && existsSync(outPath)) {
      console.error(`  error: ${out} already exists in ${targetIdentityDir}`);
      console.error('  Use --force to overwrite existing genesis files.');
      process.exit(1);
    }
  }

  console.log(`Writing identity files to: ${targetIdentityDir}\n`);

  for (const { tpl, out, mutable } of FILES) {
    const tplPath = join(templateIdentityDir, tpl);
    if (!existsSync(tplPath)) {
      console.error(`  error: template not found: ${tplPath}`);
      process.exit(1);
    }

    const template = readFileSync(tplPath, 'utf8');
    const content = substitute(template, config);

    const outPath = join(targetIdentityDir, out);
    writeFileSync(outPath, content, 'utf8');
    console.log(`  wrote ${out}`);

    if (mutable !== null) {
      const mutPath = join(targetIdentityDir, mutable);
      const mutContent = deriveWorkingCopy(content);
      writeFileSync(mutPath, mutContent, 'utf8');
      console.log(`  wrote ${mutable} (derived from genesis)`);
    }
  }

  console.log('\nRunning lint-identity...');
  const lint = spawnSync(
    'node',
    ['--import', 'tsx', 'scripts/lint-identity.ts'],
    {
      cwd: TEMPLATE_REPO_ROOT,
      env: { ...process.env, LINT_REPO_ROOT: targetDir },
      stdio: 'inherit',
    },
  );

  if (lint.status !== 0) {
    console.error('\nlint-identity failed — see output above.');
    process.exit(1);
  }
}

main();
