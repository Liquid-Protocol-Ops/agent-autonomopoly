// wstDIEM / Venice Staking Yield Tracking

import { createPublicClient, http, parseAbi, Address } from 'viem';
import { base } from 'viem/chains';

const VENICE_STAKING_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function stakedDiem(address account) view returns (uint256)',
  'function dailyCreditsPerDiem() view returns (uint256)',
  'function usedCreditsToday(address account) view returns (uint256)',
]);

const WSTDIEM_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getRate() view returns (uint256)', // wstDIEM per DIEM, scaled 1e18
]);

const DIEM_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

export interface WstDiemState {
  stakedDiem: bigint;           // DIEM staked on Venice
  dailyCredits: bigint;         // credits earned per day (1 DIEM = $1/day = credits)
  usedCredits: bigint;          // credits consumed today
  availableCredits: bigint;     // credits available for AskSurplus
  wstDiemBalance: bigint;       // liquid wstDIEM in wallet
  diemBalance: bigint;          // liquid DIEM in wallet
  wstDiemRate: number;          // wstDIEM per DIEM (1e18 scale)
  apy: number;                  // current staking APY
  depegBps: number;             // depeg from 1:1 in bps
}

const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const WALLET = process.env.VHERMES_WALLET as Address || '0x8767Df39eCeeaeB11554642237aC4E08660aB6A3';
const VENICE_STAKING = process.env.VENICE_STAKING_ADDRESS as Address;
const WSTDIEM_TOKEN = process.env.WSTDIEM_ADDRESS as Address;
const DIEM_TOKEN = process.env.DIEM_ADDRESS as Address;

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

export async function syncWstDiemState(): Promise<WstDiemState> {
  let stakedDiem = 0n;
  let dailyCredits = 0n;
  let usedCredits = 0n;
  let wstDiemBalance = 0n;
  let diemBalance = 0n;
  let wstDiemRate = 1e18;
  let apy = 0;

  // Venice staking contract
  if (VENICE_STAKING) {
    try {
      const [staked, creditsPerDiem, used] = await Promise.all([
        client.readContract({
          address: VENICE_STAKING,
          abi: VENICE_STAKING_ABI,
          functionName: 'stakedDiem',
          args: [WALLET],
        }) as Promise<bigint>,
        client.readContract({
          address: VENICE_STAKING,
          abi: VENICE_STAKING_ABI,
          functionName: 'dailyCreditsPerDiem',
        }) as Promise<bigint>,
        client.readContract({
          address: VENICE_STAKING,
          abi: VENICE_STAKING_ABI,
          functionName: 'usedCreditsToday',
          args: [WALLET],
        }) as Promise<bigint>,
      ]);
      stakedDiem = staked;
      dailyCredits = stakedDiem * creditsPerDiem / 1000000000000000000n;
      usedCredits = used;
    } catch (e) {
      console.warn('[wstdiem-staking] Venice staking read failed:', e);
    }
  }

  // wstDIEM balance
  if (WSTDIEM_TOKEN) {
    try {
      const [balance, rate] = await Promise.all([
        client.readContract({
          address: WSTDIEM_TOKEN,
          abi: WSTDIEM_ABI,
          functionName: 'balanceOf',
          args: [WALLET],
        }) as Promise<bigint>,
        client.readContract({
          address: WSTDIEM_TOKEN,
          abi: WSTDIEM_ABI,
          functionName: 'getRate',
        }) as Promise<bigint>,
      ]);
      wstDiemBalance = balance;
      wstDiemRate = Number(rate);
    } catch (e) {
      console.warn('[wstdiem-staking] wstDIEM read failed:', e);
    }
  }

  // DIEM balance
  if (DIEM_TOKEN) {
    try {
      diemBalance = await client.readContract({
        address: DIEM_TOKEN,
        abi: DIEM_ABI,
        functionName: 'balanceOf',
        args: [WALLET],
      }) as bigint;
    } catch (e) {
      console.warn('[wstdiem-staking] DIEM read failed:', e);
    }
  }

  // Calculate APY from rate (simplified)
  // wstDIEM rate increases over time as staking rewards accrue
  // APY ≈ (rate_after_year / rate_now - 1) * 100
  // For now, use a static estimate or fetch from VeniceStats API
  apy = 15; // placeholder, replace with actual calculation

  // Depeg: wstDIEM should trade at rate, but market price may differ
  // depegBps = (market_price / fair_price - 1) * 10000
  // For now, assume small depeg
  const depegBps = 50; // 0.5% placeholder

  const availableCredits = dailyCredits > usedCredits ? dailyCredits - usedCredits : 0n;

  return {
    stakedDiem,
    dailyCredits,
    usedCredits,
    availableCredits,
    wstDiemBalance,
    diemBalance,
    wstDiemRate,
    apy,
    depegBps,
  };
}

// Helper: Convert credits to DIEM equivalent
export function creditsToDiem(credits: bigint, creditsPerDiemPerDay: bigint): bigint {
  // 1 DIEM = creditsPerDiemPerDay credits per day
  // So credits / creditsPerDiemPerDay = DIEM-days of inference
  return credits * 1000000000000000000n / creditsPerDiemPerDay;
}

// Helper: Estimate USD value of credits
export function creditsToUsd(credits: bigint, usdPerCredit: number): number {
  return Number(credits) * usdPerCredit / 1000000000000000000;
}