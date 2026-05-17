import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const DIEM  = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024';
const NFPM  = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1';
const WALLET = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';

const ABI = [
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
];

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });
const allowance = await client.readContract({ address: DIEM, abi: ABI, functionName: 'allowance', args: [WALLET, NFPM] });
const balance = await client.readContract({ address: DIEM, abi: ABI, functionName: 'balanceOf', args: [WALLET] });
console.log('DIEM balance:', formatUnits(balance, 18));
console.log('DIEM allowance for NFPM:', formatUnits(allowance, 18));
console.log('allowance >= balance:', allowance >= balance);
