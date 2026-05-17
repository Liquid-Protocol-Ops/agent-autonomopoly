import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base } from 'viem/chains';

const WALLET = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';
const DIEM = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024';
const ERC20_ABI = [{ name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }];

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });
const eth = await client.getBalance({ address: WALLET });
const diem = await client.readContract({ address: DIEM, abi: ERC20_ABI, functionName: 'balanceOf', args: [WALLET] });
console.log('ETH:', formatEther(eth));
console.log('DIEM:', formatUnits(diem, 18));
