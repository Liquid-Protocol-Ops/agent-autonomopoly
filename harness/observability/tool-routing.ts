import { appendFileSync } from 'node:fs';

export type ToolRoutingEntry = {
  ts: string;
  provider: string;
  variant: string;
  cache_hit: boolean;
  latency_ms: number;
  tokens: {
    input: number;
    output: number;
  };
  cost_usd: number;
};

export function emit(entry: ToolRoutingEntry, logPath: string): void {
  appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
}
