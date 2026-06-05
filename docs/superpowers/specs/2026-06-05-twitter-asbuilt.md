# Twitter/X Integration — As-Built (2026-06-05)

**Status:** Live  
**Supersedes:** `2026-06-04-twitter-design.md` (original browser-use design, never shipped)  
**Scope:** AUTONOMOPOLY's Twitter/X presence — posting, listening, engaging, and promoting via X API v2.

---

## What Shipped

The original design used browser-use + Playwright + Venice LLM to drive a real Chromium browser against twitter.com. That was replaced by X API v2 via tweepy (OAuth 1.0a User Context) — no browser, no session cookies, direct REST calls. This eliminates all Playwright/CAPTCHA brittleness and decouples Twitter costs from DIEM staking.

---

## Architecture

```
GitHub Actions (ubuntu-latest)
  └── aeon.yml skill dispatch
       └── Claude Code (Opus 4.8, Venice or direct)
            ├── reads SKILL.md instructions
            └── subprocess: python scripts/tweet-browser.py
                 └── tweepy.Client (OAuth 1.0a User Context)
                      └── api.twitter.com/2/...

Near-real-time dispatch path:
  X event (mention, etc.)
    └── [Standard tier: no webhook events from X]
         └── Vercel cron (every 1 minute)
              └── POST /repos/.../actions/workflows/aeon.yml/dispatches
                   └── GH Actions run: skill=tweet-listen
```

### Vercel deployment

Two Edge Functions deployed to `agent-autonomopoly.vercel.app`:

| Route | File | Purpose |
|-------|------|---------|
| `GET /api/webhook/x?crc_token=...` | `api/webhook/x.ts` | CRC challenge response (X webhook registration) |
| `POST /api/webhook/x` | `api/webhook/x.ts` | Incoming event → dispatch tweet-listen |
| `GET /api/cron/listen` | `api/cron/listen.ts` | Vercel cron: fire every minute, dispatch tweet-listen |

**vercel.json:**
```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "crons": [{ "path": "/api/cron/listen", "schedule": "* * * * *" }]
}
```

Both functions are fail-closed: return 500 if secrets are unset, 401 if auth is absent or wrong. Signature comparison is constant-time (XOR accumulation) to prevent timing oracles.

### X webhook registration

- **Webhook URL:** `https://agent-autonomopoly.vercel.app/api/webhook/x`
- **Webhook ID:** `2062982664001564672` (registered 2026-06-05, valid: true)
- **Filtered stream rule:** `@AUTONOMOPOLY -is:retweet` (rule ID: `2062984577371738112`)
- **Note:** X Account Activity API (real-time webhook events) is Enterprise-only. Standard tier does not receive push events. The Vercel 1-min cron provides near-real-time polling as the primary dispatch mechanism.

---

## scripts/tweet-browser.py

All Twitter I/O goes through this script. Claude never calls the Twitter API directly.

```
python scripts/tweet-browser.py --action init
python scripts/tweet-browser.py --action post --file .pending-x/tweet-xyz.txt
python scripts/tweet-browser.py --action post --text "text" [--reply-to TWEET_ID]
python scripts/tweet-browser.py --action listen [--check-mentions]
python scripts/tweet-browser.py --action engagement --tweet-url URL
python scripts/tweet-browser.py --action like --tweet-id TWEET_ID
```

Exit 0 on success, 1 on failure.  
stdout: `{"status": "ok", ...}`  
stderr: `{"status": "error", "reason": "..."}` on failure.

**Actions:**
- `init` — no-op (kept for workflow compat; API auth needs no session file)
- `post` — create tweet or reply (`--reply-to` for replies)
- `listen --check-mentions` — fetch last 20 mentions, return as JSON; caches user ID in `memory/x-user-id.txt`
- `engagement --tweet-url URL` — fetch public metrics (likes, replies, reposts) for a tweet
- `like --tweet-id ID` — like a tweet as the authenticated user

**Required env vars:**
- `TWITTER_API_KEY` — consumer key
- `TWITTER_API_SECRET` — consumer secret
- `TWITTER_ACCESS_TOKEN` — OAuth user access token
- `TWITTER_ACCESS_SECRET` — OAuth user access token secret

**Python dependency:** `tweepy` (installed via `scripts/requirements-twitter.txt` in GH Actions).

---

## Skills

All Twitter skills use model `claude-opus-4-8`.

### `tweet-engage` — daily 06:00 UTC

Generates 1-2 tweet drafts and writes them to `.pending-x/tweet-{timestamp}.txt`. Reads:
- `memory/MEMORY.md` — current on-chain state
- `memory/x-performance.jsonl` — engagement data by content type
- `memory/x-strategy.md` — live content weights and tone
- `memory/x-accounts.json` — ecosystem accounts to reference
- Recent `memory/logs/` entries

### `tweet-broadcast` — daily 14:00 UTC

Posts all pending files from `.pending-x/`. Rules:
- **Never thread** — each `tweet-{timestamp}.txt` is a standalone post (no `--reply-to`)
- `reply-{TWEET_ID}.txt` files use `--reply-to TWEET_ID` (these are explicit reply drafts)
- Moves sent files to `.pending-x/sent/`
- Appends to `memory/x-tweet-log.jsonl`
- Rate ceiling: max 5 posts per run

### `tweet-listen` — every 5 min (GH Actions fallback) + 1 min (Vercel cron dispatch)

1. Fetch last 20 @AUTONOMOPOLY mentions via `--check-mentions`
2. For each unseen mention: **like the tweet** (`--action like --tweet-id ID`), then draft a reply to `.pending-x/reply-{TWEET_ID}.txt`
3. Reply policy:
   - **@_proxystudio only** may request on-chain actions, repo changes, or wallet operations
   - All other accounts get informational replies only — no action triggers
4. For tweets in `x-tweet-log.jsonl` posted 18-48h ago without an engagement snapshot, call `--action engagement` and append to `memory/x-performance.jsonl`

Log format: `mentions checked: N | liked: N | replies drafted: N | already replied: N | engagement snapshots: N`

### `tweet-reflect` — Sunday 20:00 UTC

1. Aggregate `x-performance.jsonl` by content type — compute median engagement per type
2. Update weights in `memory/x-strategy.md`
3. Review `x-accounts.json` — flag inactive, promote engaged
4. Write reflection to `memory/logs/{today}.md`

### `tweet-promote` — Tuesday / Friday 10:00 UTC

1. Load context from `memory/x-strategy.md` and recent on-chain events
2. Reason about promo strategy — what token or milestone to feature
3. Call Venice video generation API:
   - Primary: `POST https://api.venice.ai/api/v1/image/generate` with `model: "wan-2.1-t2v-480p"`
   - Fallback (video fail): `model: "flux-dev-uncensored"` for static image
4. Save output to `memory/videos/`
5. Queue tweet with media reference in `.pending-x/`

---

## Access Control

| Requester | Can request... |
|-----------|---------------|
| `@_proxystudio` | Any action — on-chain ops, repo changes, wallet operations, content |
| Any other account (including follows, ecosystem) | Informational replies only — no action triggers, no repo writes, no wallet ops |

This is enforced in `skills/tweet-listen/SKILL.md`. There is no whitelist of collaborators — @_proxystudio is the sole operator.

---

## Memory Files

| File | Purpose | Written by | Read by |
|------|---------|-----------|---------|
| `memory/x-tweet-log.jsonl` | Posted tweets: tweet_id, content_type, text, posted_at | `tweet-broadcast` | `tweet-listen`, `tweet-reflect` |
| `memory/x-performance.jsonl` | Engagement snapshots: tweet_id, likes, replies, reposts, snapshot_at | `tweet-listen` | `tweet-engage`, `tweet-reflect` |
| `memory/x-strategy.md` | Live content weights and tone | `tweet-reflect` | `tweet-engage` |
| `memory/x-accounts.json` | Ecosystem accounts (reference only — not used for access control) | `tweet-reflect` | `tweet-engage` |
| `memory/x-user-id.txt` | Cached AUTONOMOPOLY user ID (avoids $0.010 get_me call per run) | `tweet-browser.py` | `tweet-browser.py` |
| `memory/videos/` | Venice-generated promo videos and images | `tweet-promote` | `tweet-broadcast` |
| `.pending-x/` | Queued tweets and replies | `tweet-engage`, `tweet-listen`, other skills | `tweet-broadcast` |

---

## Secrets

Stored in 1Password (`Personal` vault), GitHub Actions secrets, and Vercel env vars.

| Secret | Where | Purpose |
|--------|-------|---------|
| `TWITTER_API_KEY` | GH + Vercel + 1Pass | X consumer key |
| `TWITTER_API_SECRET` | GH + Vercel + 1Pass | X consumer secret (also used for webhook HMAC) |
| `TWITTER_ACCESS_TOKEN` | GH + Vercel + 1Pass | OAuth user access token |
| `TWITTER_ACCESS_SECRET` | GH + Vercel + 1Pass | OAuth user access token secret |
| `GH_DISPATCH_TOKEN` | Vercel | GitHub PAT (actions:write) for workflow dispatch from Vercel cron/webhook |
| `CRON_SECRET` | Vercel | Bearer token for Vercel cron endpoint auth |

**Never commit X credentials to the repo.** The original credentials appeared in the session chat log — they have been rotated and stored only in the locations above.

---

## What Diverged from the Original Design

The original spec (`2026-06-04-twitter-design.md`) called for browser-use + Playwright + Venice LLM. The actual implementation:

| Original | Shipped |
|----------|---------|
| browser-use (Playwright + Chromium) | tweepy (X API v2 REST) |
| Venice llama-3.3-70b for browser navigation | No LLM needed for API calls |
| `TWITTER_USERNAME` + `TWITTER_PASSWORD` | `TWITTER_API_KEY/SECRET` + `TWITTER_ACCESS_TOKEN/SECRET` |
| Session cookies in `memory/x-session.json` | Stateless OAuth 1.0a per call |
| Tweet metrics via browser scraping | `client.get_tweet(..., tweet_fields=["public_metrics"])` |
| Mentions via browser search | `client.get_users_mentions(user_id, ...)` |
| Mon/Wed/Fri schedule | Daily schedule (engage 06:00, broadcast 14:00) |
| No operator restriction | @_proxystudio is sole operator for action requests |
| No like behavior | Like every mention before replying |
| No Vercel deployment | Vercel cron + webhook receiver for near-real-time dispatch |
| No tweet-promote skill | tweet-promote (Tue/Fri) using Venice video models |

Loop 2 (Farcaster/Neynar network discovery) from the original design was not implemented. Loop 3 (reactive engagement via mentions) was implemented.
