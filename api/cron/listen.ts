/**
 * Vercel cron job — dispatches tweet-broadcast and tweet-listen every 15 minutes.
 *
 * tweet-broadcast: posts any pending .pending-x/ files to X.
 * tweet-listen: pulls mentions and snapshots engagement on recent tweets.
 * Both run concurrently — posts go out even when the mention endpoint is rate-limited.
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

  // Operator kill switch: when goals.json tweetingPaused is true, skip dispatching
  // entirely. Before this check the skills no-oped *inside* a GHA run on every
  // cron fire (40+ wasted workflow runs/day while paused). Fail open on fetch
  // errors — a broken check must not silently kill the X loop once unpaused.
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/memory/goals.json?ref=main`,
      {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.raw+json',
          'User-Agent': 'AUTONO-cron/1.0',
        },
      },
    );
    if (r.ok) {
      const goals = (await r.json()) as { tweetingPaused?: boolean };
      if (goals?.tweetingPaused === true) {
        console.log('[cron/listen] tweetingPaused=true — skipping dispatches');
        return new Response('paused (goals.json tweetingPaused)', { status: 200 });
      }
    }
  } catch { /* fail open */ }

  async function dispatch(skill: string): Promise<number> {
    const r = await fetch(
      `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'AUTONO-cron/1.0',
        },
        body: JSON.stringify({ ref: 'main', inputs: { skill } }),
      },
    );
    return r.status;
  }

  // Dispatch both skills. tweet-broadcast runs independently of tweet-listen so
  // posts go out even when X READ endpoints are blocked (tier issue).
  const [broadcastStatus, listenStatus] = await Promise.all([
    dispatch('tweet-broadcast'),
    dispatch('tweet-listen'),
  ]);

  const ok = broadcastStatus === 204 || listenStatus === 204;
  console.log(`[cron/listen] tweet-broadcast=${broadcastStatus} tweet-listen=${listenStatus}`);
  return new Response(
    `broadcast=${broadcastStatus} listen=${listenStatus}`,
    { status: ok ? 200 : 500 },
  );
}
