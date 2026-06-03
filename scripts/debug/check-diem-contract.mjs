import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const DIEM = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024';

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });

// Check contract bytecode length (proxy or not)
const code = await client.getBytecode({ address: DIEM });
console.log('Bytecode length:', code?.length ?? 0);

// Check recent transactions to/from wallet
// Get DIEM decimals and symbol
const ABI = [
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
];

const [decimals, symbol, name] = await Promise.all([
  client.readContract({ address: DIEM, abi: ABI, functionName: 'decimals' }),
  client.readContract({ address: DIEM, abi: ABI, functionName: 'symbol' }),
  client.readContract({ address: DIEM, abi: ABI, functionName: 'name' }),
]);
console.log('Name:', name, '| Symbol:', symbol, '| Decimals:', decimals);
