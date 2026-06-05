# Twitter/X Integration — Signal-Loop Design

**Date:** 2026-06-04  
**Status:** Superseded — see [`2026-06-05-twitter-asbuilt.md`](2026-06-05-twitter-asbuilt.md) for the as-built implementation (X API v2 via tweepy, not browser-use)  
**Scope:** AUTONOMOPOLY's self-funded, self-improving presence on Twitter/X via browser-use automation and three signal feedback loops.

---

## Problem

A push-only broadcast schedule produces stiff, undynamic output. Without engagement data flowing back, the agent posts into a void and its content strategy never updates. The design below replaces the push-only model with three closed loops: content quality, network discovery, and reactive engagement.

---

## Core Mechanism: browser-use + Venice

Twitter is accessed through a real Chromium browser driven by [browser-use](https://github.com/browser-use/browser-use), a Python library that uses an LLM to navigate and interact with web UIs. The LLM is Venice (OpenAI-compatible endpoint) — AUTONO pays for browsing from its existing DIEM staking balance. No Twitter API subscription is required at any tier.

```
GitHub Actions runner (ubuntu-latest)
  └── aeon.yml dispatches skill
       └── Claude Code (via ccr → Venice) reads SKILL.md
            └── subprocess: python scripts/tweet-browser.py
                 └── browser-use (Playwright + Chromium)
                      └── LLM: langchain_openai → Venice endpoint
                           └── chromium: twitter.com
```

**Inference cost per browser-use run:** ~5-15 Venice calls (browser-use calls the LLM for each navigation decision). At Venice's llama-3.3-70b rate, this costs negligible DIEM — well within the daily ~0.485 DIEM/day budget.

### Session persistence

Twitter session cookies are stored in `memory/x-session.json` as base64-encoded JSON. On first run, `tweet-browser.py` logs in with `TWITTER_USERNAME` / `TWITTER_PASSWORD` (GitHub Actions secrets) and saves the session. Subsequent runs load the saved session and skip login. Session refresh happens automatically if Twitter returns a logged-out state.

**Security note:** Cookies in `memory/x-session.json` are committed to the repo. For a public agent repo, this is a limited-blast-radius risk (attacker can post as AUTONO). Phase 2 mitigation: AES-encrypt cookies with a `TWITTER_SESSION_KEY` secret. Phase 1 ships with base64 only.

---

## Three Signal Loops

### Loop 1 — Content Quality (24-48h cycle)

**Problem:** AUTONO posts a tweet and forgets it. There is no mechanism to learn whether the audience responded or ignored it.

**Mechanism:**
1. `tweet-broadcast` posts a tweet and records `{tweet_id, content_type, posted_at, text}` in `memory/x-tweet-log.jsonl`
2. `tweet-listen` (daily) reads the log, finds tweets posted 18-48h ago with no engagement snapshot yet, opens each tweet in the browser, reads the like/reply/repost counts, and appends a `{tweet_id, likes, replies, reposts, snapshot_at}` record to `memory/x-performance.jsonl`
3. `tweet-engage` reads `memory/x-performance.jsonl` when generating new content — content types with higher median engagement get higher weight in the prompt

Content types are tagged at write time: `on-chain-report`, `lp-update`, `ecosystem-commentary`, `agent-philosophy`, `reaction`. The performance file is the ground truth for what resonates; `memory/x-strategy.md` holds the live weighted strategy that emerges from it.

### Loop 2 — Network Discovery (weekly)

**Problem:** `x-accounts.json` starts from a seed list and never grows unless manually updated.

**Mechanism:**
1. Neynar API (already wired: `NEYNAR_API_KEY`, `NEYNAR_SIGNER_UUID`) searches Farcaster for casts mentioning "Liquid Protocol", "AUTONO", "DIEM", "Venice AI"
2. Discovered Farcaster profiles that also have Twitter handles (from Farcaster profile metadata) are added to `memory/x-accounts.json` with source `farcaster-discovery`
3. On-chain signal: Dune Q7591697 already returns deployer wallets; when a new token launches on Liquid Protocol, the deployer is flagged in `memory/x-discovery-queue.jsonl` for manual follow-up or automated lookup
4. `tweet-reflect` (weekly) deduplicates and ranks the accounts list by recent engagement

**Seed accounts (hardcoded at launch):** @liquidlauncher, @_proxystudio, @m00npapi, plus any accounts that have engaged with @AUTONOMOPOLY directly

### Loop 3 — Reactive Engagement (same-day)

**Problem:** AUTONO is unresponsive to @mentions, keyword discussions, and ecosystem events. Scheduled posting ignores what is happening.

**Mechanism:**
1. `tweet-listen` (daily) checks @AUTONOMOPOLY mentions via browser search and reads up to 10 recent mentions
2. High-value triggers (mention from a tracked account, mention with >10 likes, mention referencing Liquid Protocol or DIEM by name) are written as reply drafts to `.pending-x/reply-{tweet_id}.txt`
3. Next `tweet-broadcast` run delivers queued replies alongside any scheduled content
4. Notable on-chain events (new LP position, DIEM claim, threshold milestone) write their own content to `.pending-x/` directly from the skill that detected the event

---

## Skills

### `tweet-broadcast` — posts queued content, 3×/week + on-demand

Reads `.pending-x/` for pending tweets and replies. For each file:
- Calls `python scripts/tweet-browser.py --action post --file .pending-x/tweet-xyz.txt`
- On success: moves file to `.pending-x/sent/`, appends to `memory/x-tweet-log.jsonl`
- On failure: leaves file in place, logs error, retries next run

Rate ceiling: max 5 posts per run to avoid spam patterns.

Schedule: Monday / Wednesday / Friday 14:00 UTC (3 days/week = ~12 tweets/month, well within free tier 1,500 cap)

### `tweet-listen` — reads metrics and mentions, daily 09:00 UTC

1. Engagement metrics: for tweets in `x-tweet-log.jsonl` posted 18-48h ago without an engagement snapshot, open each tweet URL in browser, read counts, write to `x-performance.jsonl`
2. Mentions: search `@AUTONOMOPOLY` in Twitter browser UI, collect recent mentions, write high-value ones to `.pending-x/reply-*.txt`
3. Discovery: call Neynar API for recent Farcaster casts mentioning key terms, add new handles to `x-accounts.json`

### `tweet-engage` — generates content, 3×/week 06:00 UTC (before tweet-broadcast)

Claude reads:
- `memory/MEMORY.md` — current on-chain state (balance, mode, LP positions, daily rate)
- `memory/x-performance.jsonl` — content type weights from engagement data
- `memory/x-strategy.md` — current strategy and tone guidance
- `memory/x-accounts.json` — accounts to consider mentioning or engaging
- Last 3 days of `memory/logs/` — recent events worth surfacing

Claude writes 1-2 tweet drafts to `.pending-x/tweet-{timestamp}.txt`, tagged with content type.

### `tweet-reflect` — strategy update, weekly Sunday 20:00 UTC

1. Aggregate `x-performance.jsonl` by content type: compute median engagement per type
2. Update content type weights in `memory/x-strategy.md`
3. Review `x-accounts.json`: flag inactive accounts, promote newly engaged ones
4. Process `x-discovery-queue.jsonl`: add confirmed handles to `x-accounts.json`
5. Write a brief reflection to `memory/logs/{today}.md` noting what shifted and why

---

## Memory Files

| File | Purpose | Written by | Read by |
|------|---------|-----------|---------|
| `memory/x-session.json` | Browser session cookies (base64) | `tweet-browser.py` | `tweet-browser.py` |
| `memory/x-tweet-log.jsonl` | Posted tweets: tweet_id, content_type, text, posted_at | `tweet-broadcast` | `tweet-listen`, `tweet-reflect` |
| `memory/x-performance.jsonl` | Engagement snapshots: tweet_id, likes, replies, reposts, snapshot_at | `tweet-listen` | `tweet-engage`, `tweet-reflect` |
| `memory/x-strategy.md` | Live content strategy with weighted content types | `tweet-reflect` | `tweet-engage` |
| `memory/x-accounts.json` | Tracked accounts: handle, source, last_engaged, engagement_score | `tweet-reflect`, `tweet-listen` | `tweet-engage`, `tweet-listen` |
| `memory/x-discovery-queue.jsonl` | Newly discovered on-chain wallets awaiting Twitter handle lookup | on-chain-monitor, tick | `tweet-reflect` |
| `.pending-x/` | Queued tweets and replies pending delivery | `tweet-engage`, `tweet-listen`, skills | `tweet-broadcast` |

All memory files are within `memory/**` — already on the agent's write allowlist.

---

## GitHub Actions Secrets Required

| Secret | Purpose |
|--------|---------|
| `TWITTER_USERNAME` | Twitter login (email or @handle) |
| `TWITTER_PASSWORD` | Twitter login password |

Venice API key is already available via DIEM staking (no new secret). Neynar secrets already wired.

---

## Python Dependencies (GitHub Actions install step)

```bash
pip install browser-use playwright langchain-openai
playwright install chromium --with-deps
```

Added to the `tweet-broadcast` and `tweet-listen` job steps. No change to `package.json` — these are Python-layer dependencies, not part of the TypeScript harness.

---

## scripts/tweet-browser.py interface

```
python scripts/tweet-browser.py --action post   --file .pending-x/tweet-xyz.txt
python scripts/tweet-browser.py --action post   --text "raw tweet text" --reply-to 1234567890
python scripts/tweet-browser.py --action listen --check-mentions --check-engagement
python scripts/tweet-browser.py --action init   # first-run login, saves session
```

Exits 0 on success, 1 on failure. Prints JSON to stdout:
```json
{ "status": "ok", "tweet_id": "1234567890123456789" }
{ "status": "error", "reason": "session expired — re-run with --reauth" }
```

Venice LLM wiring:
```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(
    base_url="https://api.venice.ai/api/v1",
    api_key=os.environ["VENICE_API_KEY"],
    model="llama-3.3-70b"  # free under VVV staking
)
```

---

## Upgrade Path: Paid Tiers

Phase 1 (this spec): free Twitter tier + Venice inference = $0 incremental cost to AUTONO.

Phase 2: When AUTONO accumulates sufficient DIEM, it signals readiness to upgrade:
- `memory/x-strategy.md` includes an `api_upgrade_ready` flag set by `tweet-reflect` when engagement data shows diminishing returns from the browser approach (rate limits, CAPTCHA friction, engagement data gaps)
- Upgrade to Twitter Basic ($100/month) adds direct API read access → faster engagement metrics, search API
- Upgrade funded from DIEM earnings via operator bridge

Phase 3: AUTONO posts on Farcaster natively via Neynar (casts on the Liquid Protocol ecosystem channel) — same content pipeline, additional channel. Neynar already wired.

---

## Dead Code — Delete Before Implementation

The following scripts are one-shot recovery tools that predate this design:

- `scripts/_check-owed.ts` — temporary: check tokensOwed for tokenId 5218841
- `scripts/_collect-owed.ts` — temporary: collect tokensOwed for tokenId 5218841  
- `scripts/collect-debug.ts` — one-shot: simulate collect for tokenId 5196500
- `scripts/debug/` — 7 dev probe scripts (check-lp.mjs, check-lp2.mjs, check-txns.mjs, check-pool.mjs, check-diem-contract.mjs, check-eth.mjs, check-allowance.mjs)

Delete these in the implementation PR before adding any Twitter skill files.

---

## What Makes This Self-Improving

The current agent has one feedback loop: `tweet-reflect` reads its own output weekly. The stiffness comes from operating on self-generated data rather than world response data.

This design closes three external loops:
1. **World response** (engagement metrics) → content type weights → future content  
2. **World discovery** (Farcaster/Neynar + on-chain) → account list grows → better targeting  
3. **World reaction** (mentions, keyword discussions) → reactive replies → relevance signal  

The agent's identity sharpens over time because its content strategy is derived from what the audience actually responds to, not from what the agent thinks it should say. AUTONO's on-chain history (balance, mode, milestones) is the content that gets richer as the agent runs — every LP reposition, every DIEM claim, every mode transition is a tweet waiting to happen.
