/**
 * Vercel cron job — dispatches tweet-listen every minute.
 *
 * Acts as a fast-polling fallback when the X Account Activity API webhook
 * isn't registered (no Enterprise subscription). Once the real webhook is
 * live, this can be disabled in vercel.json.
 *
 * Required Vercel env vars:
 *   GH_DISPATCH_TOKEN  — GitHub fine-grained PAT with actions:write on this repo
 *   CRON_SECRET        — any random string; set as Vercel env var + in vercel.json header
 */

export const config = { runtime: 'edge' };

const GH_REPO = 'Liquid-Protocol-Ops/agent-autonomopoly';
const GH_WORKFLOW = 'aeon.yml';

export default async function handler(req: Request): Promise<Response> {
  // Fail closed: CRON_SECRET must be set — Vercel injects it via Authorization header
  const cronSecret = process.env.CRON_SECRET ?? '';
  if (!cronSecret) return new Response('server misconfigured', { status: 500 });
  const authHeader = req.headers.get('authorization') ?? '';
  // Constant-time compare to prevent timing oracle on the secret
  const expected = `Bearer ${cronSecret}`;
  const enc = new TextEncoder();
  const a = enc.encode(authHeader.padEnd(expected.length, '\0'));
  const b = enc.encode(expected.padEnd(authHeader.length, '\0'));
  let diff = a.length !== b.length ? 1 : 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  if (diff !== 0) return new Response('unauthorized', { status: 401 });

  const ghToken = process.env.GH_DISPATCH_TOKEN ?? '';
  if (!ghToken) return new Response('GH_DISPATCH_TOKEN not set', { status: 500 });

  const res = await fetch(
    `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'AUTONO-cron/1.0',
      },
      body: JSON.stringify({ ref: 'main', inputs: { skill: 'tweet-listen' } }),
    },
  );

  if (res.status === 204) {
    return new Response('dispatched tweet-listen', { status: 200 });
  }

  const text = await res.text();
  console.error(`[cron/listen] dispatch failed ${res.status}: ${text}`);
  return new Response(`dispatch failed: ${res.status}`, { status: 500 });
}
