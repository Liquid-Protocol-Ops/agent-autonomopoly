import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import type { LauncherConfig } from './config.js';
import { provisionAgentWallet } from './steps/provision-wallet.js';
import { deployAgentToken, type TokenDeployer } from './steps/deploy-token.js';
import { forkTemplateRepo, agentRepoName } from './steps/fork-repo.js';
import { writeRegistryEntry } from './steps/write-registry.js';

export interface LaunchDeps {
  fetchFn?: typeof fetch;
  tokenDeployer?: TokenDeployer;
}

// ── Dry-run ───────────────────────────────────────────────────────────

export function printDeployPlan(config: LauncherConfig): void {
  const repoName = agentRepoName(config.agent.name);
  console.log('\n=== deploy-autonomous launch plan ===');
  console.log(`Agent name    : ${config.agent.name}`);
  console.log(`Token symbol  : ${config.agent.symbol}`);
  console.log(`Description   : ${config.agent.description || '(none)'}`);
  console.log('');
  console.log(`Chain         : Base mainnet (8453)`);
  console.log(`RPC           : ${config.chain.rpcUrl.replace(/\/[a-zA-Z0-9_-]{20,}/, '/***')}`);
  console.log(`DIEM address  : ${config.chain.diemAddress}`);
  console.log(`Fee locker    : ${config.chain.feeLockerAddress}`);
  console.log(`DIEM price    : $${config.chain.diemPriceUsd.toLocaleString()}`);
  console.log(`Starting MC   : $${config.chain.initialMarketCapUsd.toLocaleString()}`);
  console.log('');
  console.log(`Privy app     : ${config.privy.appId}`);
  console.log(`GitHub org    : ${config.github.targetOrg}`);
  console.log(`Template repo : ${config.github.templateRepo}`);
  console.log(`Agent repo    : ${config.github.targetOrg}/${repoName}`);
  console.log(`Registry      : ${config.registryPath}`);
  console.log('');
  console.log('Steps that would execute:');
  console.log('  1. Provision Privy server wallet for agent');
  console.log('  2. Deploy DIEM-paired token via liquid-sdk (7-position $1K→$10B layout)');
  console.log('  3. Fork template repo → ' + `${config.github.targetOrg}/${repoName}`);
  console.log('  4. Write registry entry to ' + config.registryPath);
  console.log('\n[dry-run] No transactions or API calls were made.');
}

// ── Full launch ───────────────────────────────────────────────────────

export async function launch(
  config: LauncherConfig,
  deps: LaunchDeps = {},
): Promise<void> {
  const fetchFn = deps.fetchFn ?? fetch;
  const repoName = agentRepoName(config.agent.name);

  // Step 1 — provision agent wallet
  console.log('[1/4] Provisioning agent wallet via Privy...');
  const agentWallet = await provisionAgentWallet(config.privy, fetchFn);
  console.log(`      wallet: ${agentWallet.address} (id: ${agentWallet.walletId})`);

  // Step 2 — deploy token
  console.log('[2/4] Deploying DIEM-paired token via liquid-sdk...');
  const account = privateKeyToAccount(config.chain.deployerPrivateKey);
  const transport = http(config.chain.rpcUrl);
  const publicClient = createPublicClient({ chain: base, transport });
  const walletClient = createWalletClient({ chain: base, transport, account });
  console.log(`      deployer: ${account.address}`);

  const token = await deployAgentToken({
    agentWallet: agentWallet.address,
    agent: config.agent,
    chain: config.chain,
    walletClient,
    publicClient,
    deployer: deps.tokenDeployer,
  });
  console.log(`      token: ${token.tokenAddress} (tx: ${token.txHash})`);

  // Step 3 — fork repo
  console.log('[3/4] Forking template repo...');
  const forked = await forkTemplateRepo(config.github, repoName, fetchFn);
  console.log(`      repo: ${forked.htmlUrl}`);

  // Step 4 — write registry
  console.log('[4/4] Writing registry entry...');
  writeRegistryEntry(config.registryPath, {
    id: repoName,
    name: config.agent.name,
    wallet: agentWallet.address,
    walletId: agentWallet.walletId,
    tokenAddress: token.tokenAddress,
    deployTxHash: token.txHash,
    repoUrl: forked.htmlUrl,
    createdAt: new Date().toISOString(),
  });
  console.log(`      written to ${config.registryPath}`);

  console.log('\n✓ Agent deployed successfully.');
  console.log(`  Token   : ${token.tokenAddress}`);
  console.log(`  Wallet  : ${agentWallet.address}`);
  console.log(`  Repo    : ${forked.htmlUrl}`);
  console.log(`  Env vars to set in the agent repo:`);
  console.log(`    PRIVY_APP_ID=${config.privy.appId}`);
  console.log(`    PRIVY_APP_SECRET=<your-app-secret>`);
  console.log(`    PRIVY_WALLET_ID=${agentWallet.walletId}`);
  console.log(`    DIEM_TOKEN_ADDRESS=${config.chain.diemAddress}`);
  console.log(`    VENICE_STAKING_ADDRESS=${config.chain.diemAddress}`);
  console.log(`    RPC_URL=${config.chain.rpcUrl.replace(/\/[a-zA-Z0-9_-]{20,}/, '/***')}`);
}
