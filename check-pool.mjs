import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const POOL = '0x80d995189ecc593672aD4703b250a5e82672EB1D';
const DIEM = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024';
const NFPM = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1';
const WALLET = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';
const TICK_SPACING = 200;

const SLOT0_ABI = [{ name: 'slot0', type: 'function', stateMutability: 'view', inputs: [], outputs: [
  { name: 'sqrtPriceX96', type: 'uint160' },
  { name: 'tick', type: 'int24' },
  { name: 'observationIndex', type: 'uint16' },
  { name: 'observationCardinality', type: 'uint16' },
  { name: 'observationCardinalityNext', type: 'uint16' },
  { name: 'feeProtocol', type: 'uint8' },
  { name: 'unlocked', type: 'bool' },
]}];

const ALLOWANCE_ABI = [{ name: 'allowance', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }]
}];

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });

const slot0 = await client.readContract({ address: POOL, abi: SLOT0_ABI, functionName: 'slot0' });
const currentTick = slot0[1];
const tickUpper = Math.floor((currentTick - 1) / TICK_SPACING) * TICK_SPACING;
const tickLower = tickUpper - 2 * TICK_SPACING;

const allowance = await client.readContract({ address: DIEM, abi: ALLOWANCE_ABI, functionName: 'allowance', args: [WALLET, NFPM] });

console.log('currentTick:', currentTick);
console.log('tickUpper (proposed):', tickUpper);
console.log('tickLower (proposed):', tickLower);
console.log('tickUpper < currentTick:', tickUpper < currentTick);
console.log('DIEM allowance for NFPM:', formatUnits(allowance, 18));
console.log('sqrtPriceX96:', slot0[0].toString());
