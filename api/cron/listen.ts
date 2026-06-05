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
  // Vercel adds Authorization: Bearer {CRON_SECRET} on cron calls
  const cronSecret = process.env.CRON_SECRET ?? '';
  const authHeader = req.headers.get('authorization') ?? '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('unauthorized', { status: 401 });
  }

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
