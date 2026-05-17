// Temporary tick runner — injects known Base mainnet addresses then runs harness/tick.ts
import { spawn } from 'child_process';

const env = {
  ...process.env,
  DIEM_TOKEN_ADDRESS: '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024',
  VVV_STAKING_ADDRESS: '0x321b7ff75154472B18EDb199033fF4D116F340Ff',
};

const proc = spawn('npx', ['tsx', 'harness/tick.ts'], { env, stdio: 'inherit' });
proc.on('exit', code => process.exit(code ?? 0));
