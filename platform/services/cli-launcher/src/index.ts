import { loadConfig, ConfigError } from './config.js';
import { launch, printDeployPlan } from './launch.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
deploy-autonomous launch [--dry-run]

Provisions a new autonomous agent: Privy server wallet, DIEM-paired token,
seeded DIEM, GitHub repo fork, and registry entry.

Required env vars:
  AGENT_NAME              Agent's display name
  RPC_URL                 Base mainnet JSON-RPC endpoint
  DEPLOYER_PRIVATE_KEY    Deployer wallet private key (holds ETH + DIEM for deployment)
  PRIVY_APP_ID            Privy application ID
  PRIVY_APP_SECRET        Privy application secret
  GH_TOKEN                GitHub PAT or App token (repo:fork scope required)

Optional env vars:
  AGENT_SYMBOL            Token symbol (default: first 6 chars of name, uppercased)
  AGENT_DESCRIPTION       Agent description
  SEED_DIEM_WEI           DIEM wei to seed to agent wallet (default: 5 DIEM)
  DIEM_ADDRESS            DIEM contract address (default: Base mainnet)
  FEE_LOCKER_ADDRESS      FeeLocker contract address (default: Base mainnet)
  TEMPLATE_REPO           GitHub template repo (default: Liquid-Protocol-Ops/deploy-autonomous)
  TARGET_ORG              GitHub org for forked repo (default: Liquid-Protocol-Ops)
  REGISTRY_PATH           Path to registry JSON file (default: ./platform/registry.json)

Flags:
  --dry-run   Print the deploy plan without executing any transactions or API calls
  --help      Show this help
`);
  process.exit(0);
}

try {
  const config = loadConfig(dryRun);

  if (dryRun) {
    printDeployPlan(config);
  } else {
    await launch(config);
  }
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
