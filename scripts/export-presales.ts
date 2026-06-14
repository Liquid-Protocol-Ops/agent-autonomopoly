import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = join(__dirname, '..');

const jsonlPath = join(REPO_ROOT, 'memory', 'presales.jsonl');
const outPath   = join(REPO_ROOT, 'dashboard', 'app', 'public', 'presales.json');

// Canonical contract is `LiquidPresaleVault` (MOG-497). The superseded
// `MintDiemPresaleVault` is still accepted for backward compatibility with any
// pre-migration jsonl rows, but new launches emit `LiquidPresaleVault`.
type PresaleMode = 'contribute' | 'stake';

interface PresaleEntry {
  vaultAddress: string;
  deployedAt: string;
  agentWallet?: string;
  contract?: string;
  /** Vault mode hint. The dashboard reads `mode()` on-chain as the source of
   *  truth; this is only a display fallback while the chain read is in flight. */
  mode?: PresaleMode;
  /** Launched token address, if known at export time. */
  token?: string;
  /** Deposit token symbol hint (e.g. VVV for contribute, DIEM for stake). */
  depositTokenSymbol?: string;
}

let entries: PresaleEntry[] = [];

if (existsSync(jsonlPath)) {
  const raw = readFileSync(jsonlPath, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean);

  entries = raw.map(line => {
    const r = JSON.parse(line) as Record<string, unknown>;

    const rawMode =
      typeof r['mode'] === 'string' ? (r['mode'] as string).toLowerCase() : undefined;
    const mode: PresaleMode | undefined =
      rawMode === 'contribute' || rawMode === 'stake' ? rawMode : undefined;

    const entry: PresaleEntry = {
      vaultAddress: typeof r['vaultAddress'] === 'string' ? r['vaultAddress'] : '',
      deployedAt:   typeof r['timestamp']    === 'string' ? r['timestamp']    : '',
    };
    if (typeof r['agentWallet'] === 'string') entry.agentWallet = r['agentWallet'];
    if (typeof r['contract'] === 'string') entry.contract = r['contract'];
    if (mode !== undefined) entry.mode = mode;
    if (typeof r['token'] === 'string') entry.token = r['token'];
    if (typeof r['depositTokenSymbol'] === 'string') {
      entry.depositTokenSymbol = r['depositTokenSymbol'];
    }
    return entry;
  }).filter(e => e.vaultAddress.startsWith('0x'));
}

writeFileSync(outPath, JSON.stringify(entries, null, 2));
console.log(`Exported ${entries.length} presale(s) → ${outPath}`);
