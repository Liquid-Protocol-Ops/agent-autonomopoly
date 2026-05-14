// Stakes all VVV in the agent wallet on the Venice staking contract.
// Venice staking uses stake(address staker, uint256 amount).
import { createPublicClient, encodeAbiParameters, parseAbiParameters, http, formatUnits, type Address, type Hex } from 'viem';
import { base } from 'viem/chains';

const PRIVY_API_BASE = 'https://api.privy.io/v1';
const VVV         = '0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf' as Address;
const VVV_STAKING = '0x321b7ff75154472B18EDb199033fF4D116F340Ff' as Address;
const AGENT       = '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3' as Address;

const ERC20_ABI = [
  { name: 'balanceOf',  type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance',  type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;
const STAKING_ABI = [
  { name: 'balanceOf',  type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

function headers(appId: string, appSecret: string) {
  return { Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`, 'privy-app-id': appId, 'Content-Type': 'application/json' };
}
async function send(appId: string, appSecret: string, walletId: string, to: Address, data: Hex): Promise<Hex> {
  const res = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}/rpc`, { method: 'POST', headers: headers(appId, appSecret), body: JSON.stringify({ method: 'eth_sendTransaction', caip2: 'eip155:8453', chain_type: 'ethereum', params: { transaction: { to, data } } }) });
  if (!res.ok) throw new Error(`Privy send failed: ${await res.text()}`);
  return ((await res.json()) as { data: { hash: Hex } }).data.hash;
}

async function main() {
  const appId = process.env['PRIVY_APP_ID']!;
  const appSecret = process.env['PRIVY_APP_SECRET']!;
  const walletId = process.env['PRIVY_WALLET_ID']!;
  const rpcUrl = process.env['RPC_URL']!;
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });

  const [vvvBalance, allowance] = await Promise.all([
    client.readContract({ address: VVV, abi: ERC20_ABI, functionName: 'balanceOf', args: [AGENT] }),
    client.readContract({ address: VVV, abi: ERC20_ABI, functionName: 'allowance', args: [AGENT, VVV_STAKING] }),
  ]);
  console.log(`VVV to stake: ${formatUnits(vvvBalance, 18)}`);
  console.log(`Allowance:    ${formatUnits(allowance, 18)}`);
  if (vvvBalance === 0n) throw new Error('No VVV to stake');

  if (allowance < vvvBalance) {
    console.log('Approving VVV to staking contract...');
    const approveSig = '0x095ea7b3';
    const approveData = encodeAbiParameters(parseAbiParameters('address,uint256'), [VVV_STAKING, vvvBalance]);
    const approveTx = await send(appId, appSecret, walletId, VVV, `${approveSig}${approveData.slice(2)}` as Hex);
    await client.waitForTransactionReceipt({ hash: approveTx });
    console.log(`approve tx: ${approveTx}`);
  }

  // Venice staking: stake(address staker, uint256 amount)
  console.log('Staking VVV...');
  const stakeData = encodeAbiParameters(parseAbiParameters('address,uint256'), [AGENT, vvvBalance]);
  const stakeTx = await send(appId, appSecret, walletId, VVV_STAKING, `0xadc9772e${stakeData.slice(2)}` as Hex);
  const receipt = await client.waitForTransactionReceipt({ hash: stakeTx });
  console.log(`stake tx: ${stakeTx}`);
  console.log(`status:   ${receipt.status}`);

  const svvv = await client.readContract({ address: VVV_STAKING, abi: STAKING_ABI, functionName: 'balanceOf', args: [AGENT] });
  console.log(`\nsVVV balance: ${formatUnits(svvv, 18)}`);
  console.log('\nAgent now has sVVV — ready to mint Venice API key via harness tick.');
}

main().catch(e => { console.error(e); process.exit(1); });
