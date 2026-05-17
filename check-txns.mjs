// Check recent txns from wallet to understand what happened
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base } from 'viem/chains';

const WALLET = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';
const NFPM   = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1';
const DIEM   = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024';

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });

const latest = await client.getBlockNumber();
console.log('Latest block:', latest);

// Get logs from DIEM contract for Approval events (wallet as owner)
// Approval(address indexed owner, address indexed spender, uint256 value) = 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925
const approvalLogs = await client.getLogs({
  address: DIEM,
  event: { name: 'Approval', type: 'event', inputs: [
    { name: 'owner', type: 'address', indexed: true },
    { name: 'spender', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ]},
  args: { owner: WALLET },
  fromBlock: latest - 1000n,
  toBlock: 'latest',
});
console.log('\nRecent DIEM Approval events from wallet:');
for (const log of approvalLogs) {
  console.log(`  block ${log.blockNumber} | spender=${log.args.spender} | value=${formatUnits(log.args.value ?? 0n, 18)}`);
}

// Get recent Transfer events from wallet
const transferLogs = await client.getLogs({
  address: DIEM,
  event: { name: 'Transfer', type: 'event', inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ]},
  args: { from: WALLET },
  fromBlock: latest - 1000n,
  toBlock: 'latest',
});
console.log('\nRecent DIEM Transfer events from wallet:');
for (const log of transferLogs) {
  console.log(`  block ${log.blockNumber} | to=${log.args.to} | value=${formatUnits(log.args.value ?? 0n, 18)}`);
}
