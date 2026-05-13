import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { Address, Hex } from 'viem';

export interface AgentRegistryEntry {
  id: string;
  name: string;
  wallet: Address;
  walletId: string;
  tokenAddress: Address;
  deployTxHash: Hex;
  repoUrl: string;
  createdAt: string;
}

export function writeRegistryEntry(path: string, entry: AgentRegistryEntry): void {
  const existing: AgentRegistryEntry[] = existsSync(path)
    ? (JSON.parse(readFileSync(path, 'utf8')) as AgentRegistryEntry[])
    : [];

  existing.push(entry);
  writeFileSync(path, JSON.stringify(existing, null, 2) + '\n', 'utf8');
}

export function readRegistry(path: string): AgentRegistryEntry[] {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8')) as AgentRegistryEntry[];
}
