// Diagnose STF by simulating the mint call
import { createPublicClient, http, encodeFunctionData, formatUnits } from 'viem';
import { base } from 'viem/chains';

const POOL  = '0x80d995189ecc593672aD4703b250a5e82672EB1D';
const DIEM  = '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024';
const NFPM  = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1';
const WETH  = '0x4200000000000000000000000000000000000006';
const WALLET = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';
const TICK_SPACING = 200;

const SLOT0_ABI = [{ name: 'slot0', type: 'function', stateMutability: 'view', inputs: [], outputs: [
  { name: 'sqrtPriceX96', type: 'uint160' },
  { name: 'tick', type: 'int24' },
]}];

const NFPM_MINT_ABI = [{ name: 'mint', type: 'function', stateMutability: 'payable',
  inputs: [{ name: 'params', type: 'tuple', components: [
    { name: 'token0', type: 'address' }, { name: 'token1', type: 'address' },
    { name: 'fee', type: 'uint24' }, { name: 'tickLower', type: 'int24' },
    { name: 'tickUpper', type: 'int24' }, { name: 'amount0Desired', type: 'uint256' },
    { name: 'amount1Desired', type: 'uint256' }, { name: 'amount0Min', type: 'uint256' },
    { name: 'amount1Min', type: 'uint256' }, { name: 'recipient', type: 'address' },
    { name: 'deadline', type: 'uint256' },
  ]}],
  outputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'liquidity', type: 'uint128' },
    { name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }]
}];

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) });

const slot0 = await client.readContract({ address: POOL, abi: SLOT0_ABI, functionName: 'slot0' });
const currentTick = slot0[1];
const tickUpper = Math.floor((currentTick - 1) / TICK_SPACING) * TICK_SPACING;
const tickLower = tickUpper - 2 * TICK_SPACING;
const diemAmount = 9743025575026647905n; // full wallet balance
const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

console.log('Simulating mint with tick:', currentTick, 'range:', tickLower, tickUpper);

try {
  const result = await client.simulateContract({
    address: NFPM,
    abi: NFPM_MINT_ABI,
    functionName: 'mint',
    account: WALLET,
    args: [{
      token0: WETH, token1: DIEM, fee: 10000,
      tickLower, tickUpper,
      amount0Desired: 0n, amount1Desired: diemAmount,
      amount0Min: 0n, amount1Min: 0n,  // relaxed to isolate STF
      recipient: WALLET, deadline,
    }],
  });
  console.log('Simulation SUCCESS:', result.result);
} catch(e) {
  console.log('Simulation FAILED:', e.message);
  if (e.cause) console.log('Cause:', e.cause.message ?? e.cause);
}
