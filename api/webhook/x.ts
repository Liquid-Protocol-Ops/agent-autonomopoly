/**
 * X Account Activity API webhook receiver.
 *
 * Two responsibilities:
 *  GET  /api/webhook/x?crc_token=... — CRC challenge (required by X to register the webhook)
 *  POST /api/webhook/x              — activity events → dispatch tweet-listen workflow
 *
 * Required Vercel env vars:
 *   TWITTER_API_SECRET   — X consumer secret (for HMAC-SHA256 signature validation)
 *   GH_DISPATCH_TOKEN    — GitHub fine-grained PAT with actions:write on this repo
 *
 * X Account Activity API registration:
 *   1. Enable Account Activity API in X developer portal (Premium/Enterprise required)
 *   2. Register webhook URL: POST /2/webhooks  body: {"url": "https://<your-vercel>.vercel.app/api/webhook/x"}
 *   3. Subscribe account: POST /2/webhooks/{id}/subscriptions/all
 */

export const config = { runtime: 'edge' };

const GH_REPO = 'Liquid-Protocol-Ops/agent-autonomopoly';
const GH_WORKFLOW = 'aeon.yml';

async function hmac256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const raw = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

// Constant-time string comparison — prevents timing oracles on the signature check.
function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

async function dispatchSkill(skill: string, ghToken: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'AUTONO-webhook/1.0',
      },
      body: JSON.stringify({ ref: 'main', inputs: { skill } }),
    },
  );
  return res.status === 204;
}

export default async function handler(req: Request): Promise<Response> {
  const consumerSecret = process.env.TWITTER_API_SECRET ?? '';
  const ghToken = process.env.GH_DISPATCH_TOKEN ?? '';
  const url = new URL(req.url);

  // ── GET: CRC challenge ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    // CRC challenge also requires the secret to be configured
    if (!consumerSecret) return new Response('server misconfigured', { status: 500 });
    const crcToken = url.searchParams.get('crc_token');
    if (!crcToken) return new Response('missing crc_token', { status: 400 });
    const responseToken = `sha256=${await hmac256(consumerSecret, crcToken)}`;
    return Response.json({ response_token: responseToken });
  }

  // ── POST: activity event ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // Fail closed: secret must be configured before we read anything else
    if (!consumerSecret) return new Response('server misconfigured', { status: 500 });

    const body = await req.text();

    // Require and verify the X signature unconditionally
    const sig = req.headers.get('x-twitter-webhooks-signature');
    const expected = `sha256=${await hmac256(consumerSecret, body)}`;
    if (!sig || !constantTimeEqual(sig, expected)) {
      return new Response('invalid signature', { status: 401 });
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(body);
    } catch {
      return new Response('invalid JSON', { status: 400 });
    }

    // Dispatch tweet-listen on any mention event
    const hasMentions =
      Array.isArray(data.tweet_create_events) && (data.tweet_create_events as unknown[]).length > 0;

    if (hasMentions && ghToken) {
      const ok = await dispatchSkill('tweet-listen', ghToken);
      console.log(`[webhook/x] mention event → tweet-listen dispatch: ${ok ? 'ok' : 'failed'}`);
    }

    return new Response('ok', { status: 200 });
  }

  return new Response('method not allowed', { status: 405 });
}
