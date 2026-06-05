# Twitter/X Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire AUTONOMOPOLY's Twitter presence using browser-use + Venice inference, with three signal loops that make content strategy self-improving from real engagement data.

**Architecture:** `tweet-browser.py` drives headless Chromium via browser-use (LLM: Venice llama-3.3-70b, paid from DIEM staking). Four GitHub Actions skills handle the content lifecycle: engage (generate) → broadcast (post) → listen (metrics + mentions) → reflect (strategy update). Session cookies persist to `memory/x-session.json`; engagement data flows through `memory/x-performance.jsonl` to weight future content.

**Tech Stack:** Python 3.11+, browser-use ≥0.2.0, playwright ≥1.45.0, langchain-openai ≥0.1.0, pytest ≥8.0.0, GitHub Actions ubuntu-latest, Neynar API (Farcaster discovery, already wired)

---

## File Map

**Create:**
- `scripts/tweet-browser.py` — browser-use automation (init/post/listen/engagement actions)
- `scripts/requirements-twitter.txt` — Python deps
- `scripts/__tests__/test_tweet_browser.py` — pytest: CLI, session I/O, error output format
- `skills/tweet-engage/SKILL.md` — content generation (Mon/Wed/Fri 06:00 UTC)
- `skills/tweet-broadcast/SKILL.md` — delivery (Mon/Wed/Fri 14:00 UTC)
- `skills/tweet-listen/SKILL.md` — metrics + mentions + Farcaster discovery (daily 09:00 UTC)
- `skills/tweet-reflect/SKILL.md` — weekly strategy update (Sunday 20:00 UTC)
- `memory/x-strategy.md` — initial content strategy with weighted content types
- `memory/x-accounts.json` — seed accounts
- `memory/.pending-x/.gitkeep` — delivery queue directory

**Modify:**
- `scripts/check-write-allowlist.mjs` — add `.pending-x/` to `ALLOWED_PREFIXES`
- `harness/safety/allowlist.ts` — add `'.pending-x/'` to `ALLOWED_PREFIXES` (keep in sync)
- `harness/safety/__tests__/allowlist.spec.ts` — add `.pending-x/` test coverage
- `aeon.yml` — add four skill entries with schedules
- `.github/workflows/aeon.yml` — add conditional Python install step

---

## Task 1: Expand write allowlist to include `.pending-x/`

The CI gate (`check-write-allowlist.mjs`) will block agent writes to `.pending-x/` until it's listed. This task must land before any tweet skill can commit files.

**Files:**
- Modify: `scripts/check-write-allowlist.mjs`
- Modify: `harness/safety/allowlist.ts`
- Modify: `harness/safety/__tests__/allowlist.spec.ts`

- [ ] **Step 1: Verify current allowlist test passes**

```bash
npm test -- --reporter=verbose harness/safety/__tests__/allowlist.spec.ts
```
Expected: all tests pass.

- [ ] **Step 2: Add `.pending-x/` test coverage (failing first)**

Open `harness/safety/__tests__/allowlist.spec.ts`. Locate the block of `isAllowed` tests and add:

```typescript
// .pending-x delivery queue — must be allowed (same pattern as .pending-notify/)
expect(isAllowed('.pending-x/tweet-001.txt')).toBe(true);
expect(isAllowed('.pending-x/reply-1234567890.txt')).toBe(true);
expect(isAllowed('.pending-x/sent/tweet-001.txt')).toBe(true);
// root of the directory itself must NOT be allowed (empty trailing segment)
expect(isAllowed('.pending-x/')).toBe(false);
```

- [ ] **Step 3: Run to confirm tests fail**

```bash
npm test -- --reporter=verbose harness/safety/__tests__/allowlist.spec.ts
```
Expected: 3 new tests FAIL.

- [ ] **Step 4: Update `scripts/check-write-allowlist.mjs`**

Find the `ALLOWED_PREFIXES` array (around line 21). Add `.pending-x/` after `.pending-notify/`:

```js
export const ALLOWED_PREFIXES = [
  'memory/',
  'wiki/',
  'skills/',
  '.claude/skills/',
  'docs/',
  'dashboard/outputs/',
  '.outputs/',
  '.pending-notify/',
  '.pending-x/',              // ← add this line
  'identity/examples/promoted/',
];
```

- [ ] **Step 5: Update `harness/safety/allowlist.ts`**

Find `ALLOWED_PREFIXES` (around line 33). Add `.pending-x/`:

```typescript
const ALLOWED_PREFIXES: readonly string[] = [
  'memory/',
  'wiki/',
  '.pending-x/',              // ← add this line
];
```

- [ ] **Step 6: Run tests — verify all pass**

```bash
npm test -- --reporter=verbose harness/safety/__tests__/allowlist.spec.ts
```
Expected: all tests pass including the 3 new ones.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-write-allowlist.mjs harness/safety/allowlist.ts harness/safety/__tests__/allowlist.spec.ts
git commit -m "feat(allowlist): add .pending-x/ to write-allowlist for Twitter delivery queue"
```

---

## Task 2: Python requirements + test scaffold

**Files:**
- Create: `scripts/requirements-twitter.txt`
- Create: `scripts/__tests__/test_tweet_browser.py`

- [ ] **Step 1: Create requirements file**

Create `scripts/requirements-twitter.txt`:

```
browser-use>=0.2.0
playwright>=1.45.0
langchain-openai>=0.1.0
pytest>=8.0.0
```

- [ ] **Step 2: Install and verify packages resolve**

```bash
pip install -r scripts/requirements-twitter.txt
playwright install chromium --with-deps
```
Expected: packages install without error, chromium downloads.

- [ ] **Step 3: Create test file with all tests (will fail until script exists)**

Create `scripts/__tests__/test_tweet_browser.py`:

```python
"""Tests for tweet-browser.py — CLI interface, session I/O, error output format.

Browser-use actions are NOT tested here (require a real browser + Venice key).
These tests cover the plumbing: argparse, base64 session encode/decode, JSON output.
"""
import base64
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parents[2] / "scripts" / "tweet-browser.py"


def load_module(tmp_path):
    """Import tweet-browser.py as a module (lazy imports mean no browser-use needed)."""
    spec = importlib.util.spec_from_file_location("tweet_browser", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    # Patch SESSION_FILE to point into tmp_path before exec
    os.chdir(tmp_path)
    spec.loader.exec_module(mod)
    return mod


class TestCLI:
    def test_help_exits_zero(self):
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--help"],
            capture_output=True, text=True,
        )
        assert r.returncode == 0
        assert "--action" in r.stdout

    def test_missing_action_exits_nonzero(self):
        r = subprocess.run(
            [sys.executable, str(SCRIPT)],
            capture_output=True, text=True,
        )
        assert r.returncode != 0

    def test_unknown_action_exits_nonzero(self):
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "bogus"],
            capture_output=True, text=True,
        )
        assert r.returncode == 1

    def test_post_no_text_or_file_exits_one(self, tmp_path):
        env = {**os.environ, "VENICE_API_KEY": "fake"}
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "post"],
            capture_output=True, text=True, cwd=str(tmp_path), env=env,
        )
        assert r.returncode == 1
        data = json.loads(r.stderr.strip())
        assert data["status"] == "error"

    def test_engagement_no_url_exits_one(self, tmp_path):
        env = {**os.environ, "VENICE_API_KEY": "fake"}
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "engagement"],
            capture_output=True, text=True, cwd=str(tmp_path), env=env,
        )
        assert r.returncode == 1
        err = json.loads(r.stderr.strip())
        assert err["status"] == "error"


class TestSession:
    def test_load_returns_none_when_file_missing(self, tmp_path):
        (tmp_path / "memory").mkdir()
        mod = load_module(tmp_path)
        assert mod.load_session() is None

    def test_save_creates_base64_file(self, tmp_path):
        (tmp_path / "memory").mkdir()
        mod = load_module(tmp_path)
        data = {"cookies": [{"name": "auth_token", "value": "abc123"}], "origins": []}
        mod.save_session(data)
        session_file = tmp_path / "memory" / "x-session.json"
        assert session_file.exists()
        raw = session_file.read_text().strip()
        # Must be valid base64
        decoded = base64.b64decode(raw.encode())
        assert json.loads(decoded) == data

    def test_load_after_save_roundtrip(self, tmp_path):
        (tmp_path / "memory").mkdir()
        mod = load_module(tmp_path)
        data = {"cookies": [{"name": "ct0", "value": "xyz789"}], "origins": []}
        mod.save_session(data)
        loaded = mod.load_session()
        assert loaded == data

    def test_load_with_corrupt_file_returns_none(self, tmp_path):
        (tmp_path / "memory").mkdir()
        (tmp_path / "memory" / "x-session.json").write_text("not-valid-base64!!!")
        mod = load_module(tmp_path)
        assert mod.load_session() is None

    def test_post_no_session_outputs_error_json(self, tmp_path):
        """Post action without a session must print JSON error to stderr, exit 1."""
        (tmp_path / "memory").mkdir()
        env = {**os.environ, "VENICE_API_KEY": "fake_key_no_network"}
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "post", "--text", "hello"],
            capture_output=True, text=True, cwd=str(tmp_path), env=env,
        )
        assert r.returncode == 1
        data = json.loads(r.stderr.strip())
        assert data["status"] == "error"
        assert "session" in data["reason"].lower()
```

- [ ] **Step 4: Run — confirm tests fail with FileNotFoundError**

```bash
pip install pytest && pytest scripts/__tests__/test_tweet_browser.py -v
```
Expected: `ERROR` or `FileNotFoundError` (script doesn't exist yet).

- [ ] **Step 5: Commit scaffold**

```bash
git add scripts/requirements-twitter.txt scripts/__tests__/test_tweet_browser.py
git commit -m "test(twitter): pytest scaffold for tweet-browser.py"
```

---

## Task 3: tweet-browser.py — CLI + session management

**Files:**
- Create: `scripts/tweet-browser.py`

- [ ] **Step 1: Create `scripts/tweet-browser.py`**

```python
#!/usr/bin/env python3
"""
tweet-browser.py — browser-use automation for AUTONOMOPOLY Twitter presence.

LLM: Venice llama-3.3-70b (OpenAI-compatible) — paid from DIEM staking.
Session: Playwright storage state persisted to memory/x-session.json (base64).

Usage:
  python scripts/tweet-browser.py --action init
  python scripts/tweet-browser.py --action post --file .pending-x/tweet-xyz.txt
  python scripts/tweet-browser.py --action post --text "tweet text" [--reply-to TWEET_ID]
  python scripts/tweet-browser.py --action listen [--check-mentions] [--check-engagement]
  python scripts/tweet-browser.py --action engagement --tweet-url URL

Exit 0 on success, 1 on failure.
stdout: JSON {"status": "ok", ...}
stderr: JSON {"status": "error", "reason": "..."}  (on failure)
"""
import argparse
import asyncio
import base64
import json
import os
import re
import sys
from pathlib import Path

MEMORY_DIR = Path("memory")
SESSION_FILE = MEMORY_DIR / "x-session.json"
PENDING_DIR = Path(".pending-x")


# ── Session management ────────────────────────────────────────────────────────

def load_session() -> dict | None:
    """Load Playwright storage state from memory/x-session.json (base64). Returns None if missing/corrupt."""
    if not SESSION_FILE.exists():
        return None
    try:
        raw = SESSION_FILE.read_text().strip()
        decoded = base64.b64decode(raw.encode())
        return json.loads(decoded)
    except Exception:
        return None


def save_session(state: dict) -> None:
    """Save Playwright storage state to memory/x-session.json as base64."""
    MEMORY_DIR.mkdir(exist_ok=True)
    encoded = base64.b64encode(json.dumps(state).encode()).decode()
    SESSION_FILE.write_text(encoded)


# ── Output helpers ────────────────────────────────────────────────────────────

def ok(data: dict) -> None:
    print(json.dumps({"status": "ok", **data}))


def err(reason: str) -> None:
    print(json.dumps({"status": "error", "reason": reason}), file=sys.stderr)
    sys.exit(1)


# ── LLM + browser setup ───────────────────────────────────────────────────────

def get_llm():
    """Venice OpenAI-compatible endpoint — paid from DIEM staking (free llama tier)."""
    venice_key = os.environ.get("VENICE_API_KEY", "")
    if not venice_key:
        err("VENICE_API_KEY not set")
    from langchain_openai import ChatOpenAI  # lazy import — keeps module importable without langchain
    return ChatOpenAI(
        base_url="https://api.venice.ai/api/v1",
        api_key=venice_key,
        model="llama-3.3-70b",
    )


async def make_browser():
    """Headless Chromium configured for GitHub Actions (no sandbox, small /dev/shm)."""
    from browser_use.browser.browser import Browser, BrowserConfig  # lazy import
    return Browser(config=BrowserConfig(
        headless=True,
        extra_chromium_args=["--no-sandbox", "--disable-dev-shm-usage"],
    ))


async def get_context_with_session(browser, session: dict | None):
    """Create a Playwright browser context, loading cookies from session if provided."""
    context = await browser.new_context()
    if session and session.get("cookies"):
        await context.add_cookies(session["cookies"])
    return context


# ── Actions ───────────────────────────────────────────────────────────────────

async def action_init() -> None:
    """Login to Twitter/X and save the session cookies."""
    username = os.environ.get("TWITTER_USERNAME", "")
    password = os.environ.get("TWITTER_PASSWORD", "")
    if not username or not password:
        err("TWITTER_USERNAME and TWITTER_PASSWORD must be set for --action init")

    from browser_use import Agent  # lazy import

    task = (
        f"Navigate to https://x.com/i/flow/login. "
        f"Log in with username/email '{username}' and password '{password}'. "
        f"If prompted for a verification code or two-factor auth, wait and check "
        f"the account's email/phone — but do not proceed unless you can complete it. "
        f"After a successful login, confirm the home feed (timeline) is visible. "
        f"Do not post, like, or interact with anything."
    )

    browser = await make_browser()
    try:
        llm = get_llm()
        context = await get_context_with_session(browser, None)
        agent = Agent(task=task, llm=llm, browser_context=context)
        await agent.run()
        state = await context.storage_state()
        save_session(state)
        ok({"message": "login successful, session saved to memory/x-session.json"})
    except Exception as exc:
        err(f"init failed: {exc}")
    finally:
        await browser.close()


async def action_post(text: str, reply_to: str | None = None) -> None:
    """Post a tweet (or reply) using the saved session."""
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from browser_use import Agent  # lazy import

    if reply_to:
        task = (
            f"Navigate to https://x.com. "
            f"Open the tweet at https://x.com/i/web/status/{reply_to}. "
            f"Click the Reply button and type this reply text exactly as given: {text!r}. "
            f"Click Post (or Reply). "
            f"After posting, report the URL of your new reply tweet."
        )
    else:
        task = (
            f"Navigate to https://x.com. "
            f"Click the compose tweet button (the quill/pen icon or 'Post' button). "
            f"Type this text exactly as given — do not change punctuation, capitalisation, "
            f"or add hashtags: {text!r}. "
            f"Click the Post button. "
            f"After posting, report the URL of the new tweet."
        )

    browser = await make_browser()
    try:
        llm = get_llm()
        context = await get_context_with_session(browser, session)
        agent = Agent(task=task, llm=llm, browser_context=context)
        result = await agent.run()
        result_str = str(result)

        tweet_id = None
        m = re.search(r'status/(\d+)', result_str)
        if m:
            tweet_id = m.group(1)

        # Refresh saved session after every interaction
        state = await context.storage_state()
        save_session(state)

        ok({"tweet_id": tweet_id, "url": f"https://x.com/i/web/status/{tweet_id}" if tweet_id else None})
    except Exception as exc:
        err(f"post failed: {exc}")
    finally:
        await browser.close()


async def action_engagement(tweet_url: str) -> None:
    """Read like/reply/repost counts for a single tweet URL."""
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from browser_use import Agent  # lazy import

    task = (
        f"Navigate to {tweet_url}. "
        f"Read the like count, reply count, and repost/retweet count for the main tweet "
        f"(not the replies below it). "
        f"Return a JSON object: {{\"likes\": N, \"replies\": N, \"reposts\": N}}"
    )

    browser = await make_browser()
    try:
        llm = get_llm()
        context = await get_context_with_session(browser, session)
        agent = Agent(task=task, llm=llm, browser_context=context)
        result = await agent.run()
        result_str = str(result)

        metrics = {"likes": 0, "replies": 0, "reposts": 0}
        m = re.search(r'\{[^{}]*"likes"[^{}]*\}', result_str, re.DOTALL)
        if m:
            try:
                metrics = json.loads(m.group())
            except json.JSONDecodeError:
                pass

        state = await context.storage_state()
        save_session(state)
        ok(metrics)
    except Exception as exc:
        err(f"engagement check failed: {exc}")
    finally:
        await browser.close()


async def action_listen(check_mentions: bool, check_engagement: bool) -> None:
    """Check @AUTONOMOPOLY mentions and/or engagement metrics on recent tweets."""
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from browser_use import Agent  # lazy import

    results: dict = {"mentions": [], "checked_engagement": check_engagement}

    if check_mentions:
        task = (
            "Navigate to https://x.com/notifications/mentions. "
            "List the last 10 mentions of @AUTONOMOPOLY. For each mention extract: "
            "the author's @handle, the tweet text, the like count, and the full tweet URL. "
            "Return ONLY a JSON array with no extra text: "
            "[{\"author\": \"@handle\", \"text\": \"...\", \"likes\": 0, \"url\": \"https://x.com/...\"}]"
        )
        browser = await make_browser()
        try:
            llm = get_llm()
            context = await get_context_with_session(browser, session)
            agent = Agent(task=task, llm=llm, browser_context=context)
            result = await agent.run()
            result_str = str(result)

            m = re.search(r'\[.*\]', result_str, re.DOTALL)
            if m:
                try:
                    results["mentions"] = json.loads(m.group())
                except json.JSONDecodeError:
                    pass

            state = await context.storage_state()
            save_session(state)
        except Exception as exc:
            results["mentions_error"] = str(exc)
        finally:
            await browser.close()

    ok(results)


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="AUTONOMOPOLY Twitter browser automation (browser-use + Venice)"
    )
    parser.add_argument("--action", required=True,
                        choices=["init", "post", "listen", "engagement"],
                        help="init=login+save-session, post=tweet, listen=mentions+metrics, engagement=read-tweet-stats")
    parser.add_argument("--file", help="Path to tweet text file (post action)")
    parser.add_argument("--text", help="Tweet text inline (post action)")
    parser.add_argument("--reply-to", dest="reply_to", metavar="TWEET_ID",
                        help="Tweet ID to reply to (post action)")
    parser.add_argument("--check-mentions", action="store_true",
                        help="Check @AUTONOMOPOLY mentions (listen action)")
    parser.add_argument("--check-engagement", action="store_true",
                        help="Check engagement metrics (listen action; tweets passed via stdin)")
    parser.add_argument("--tweet-url", dest="tweet_url",
                        help="Full tweet URL to read metrics for (engagement action)")
    args = parser.parse_args()

    if args.action == "init":
        asyncio.run(action_init())

    elif args.action == "post":
        if args.file:
            text = Path(args.file).read_text().strip()
            # Strip content_type tag line (first line starting with #content_type:)
            lines = text.splitlines()
            if lines and lines[0].startswith("#content_type:"):
                text = "\n".join(lines[1:]).strip()
        elif args.text:
            text = args.text
        else:
            err("--file or --text required for post action")
            return
        asyncio.run(action_post(text, reply_to=args.reply_to))

    elif args.action == "listen":
        asyncio.run(action_listen(
            check_mentions=args.check_mentions,
            check_engagement=args.check_engagement,
        ))

    elif args.action == "engagement":
        if not args.tweet_url:
            err("--tweet-url required for engagement action")
            return
        asyncio.run(action_engagement(args.tweet_url))


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the tests — verify they pass**

```bash
pytest scripts/__tests__/test_tweet_browser.py -v
```
Expected output:
```
PASSED test_tweet_browser.py::TestCLI::test_help_exits_zero
PASSED test_tweet_browser.py::TestCLI::test_missing_action_exits_nonzero
PASSED test_tweet_browser.py::TestCLI::test_unknown_action_exits_nonzero
PASSED test_tweet_browser.py::TestCLI::test_post_no_text_or_file_exits_one
PASSED test_tweet_browser.py::TestCLI::test_engagement_no_url_exits_one
PASSED test_tweet_browser.py::TestSession::test_load_returns_none_when_file_missing
PASSED test_tweet_browser.py::TestSession::test_save_creates_base64_file
PASSED test_tweet_browser.py::TestSession::test_load_after_save_roundtrip
PASSED test_tweet_browser.py::TestSession::test_load_with_corrupt_file_returns_none
PASSED test_tweet_browser.py::TestSession::test_post_no_session_outputs_error_json
10 passed
```

> **Note on browser-use API:** `browser_context=` is the parameter name as of browser-use 0.2.x. If the installed version differs, check `from browser_use import Agent; help(Agent.__init__)` and adjust the constructor call. The session + cookie loading pattern is stable Playwright; only the Agent constructor signature may vary across browser-use releases.

- [ ] **Step 3: Commit**

```bash
git add scripts/tweet-browser.py
git commit -m "feat(twitter): tweet-browser.py — browser-use + Venice session management"
```

---

## Task 4: tweet-engage skill

**Files:**
- Create: `skills/tweet-engage/SKILL.md`

- [ ] **Step 1: Create `skills/tweet-engage/SKILL.md`**

```markdown
---
name: tweet-engage
description: Generate 1-2 tweet drafts based on on-chain state and engagement history
var: ""
tags: [twitter, content]
---

Generate tweet content for AUTONOMOPOLY (@AUTONOMOPOLY) based on current on-chain state and past engagement data.

## Context to read first

Read these files before generating any content:

1. `memory/MEMORY.md` — current state: wallet balance, DIEM earned, LP positions, mode, daily rate
2. `memory/x-performance.jsonl` — engagement history; each line: `{"tweet_id":"...","content_type":"...","likes":N,"replies":N,"reposts":N,"snapshot_at":"..."}`. Compute median engagement per content_type to identify what performs best.
3. `memory/x-strategy.md` — current strategy guidance and content type weights
4. `memory/x-accounts.json` — tracked ecosystem accounts; use handles for potential mentions
5. Last 3 days of `memory/logs/` — recent agent events worth surfacing (repositions, claims, LP changes)

If `memory/x-performance.jsonl` does not exist yet (first run), treat all content types as equal weight.

## Content types

| Type | Description |
|------|-------------|
| `on-chain-report` | Concrete on-chain fact: wallet balance, DIEM earned today, LP position tick range, daily fee rate. Lead with a number. Example: "earned 0.485 DIEM today from 9 active LP positions. 17.89/100 DIEM toward build mode." |
| `lp-update` | LP position event: new position minted, position repositioned, range status. Cite the tokenId. |
| `ecosystem-commentary` | Observation about Liquid Protocol, Venice AI, Base, or autopoietic agents. Must be grounded in something verifiable — a metric, a protocol fact, a real event. No hot takes without data. |
| `agent-philosophy` | A belief from SOUL.md made concrete. Short. Direct. No hedging. |
| `reaction` | Response to something real in the ecosystem (use if recent news or events exist in logs). |

## Weighting rule

If `x-performance.jsonl` has ≥10 snapshots: generate the type with highest median engagement (likes + replies×2 + reposts×1.5) unless it was used in the last 2 tweet-engage runs (check `x-tweet-log.jsonl` — avoid repetition). Fall back to second-highest type.

If fewer than 10 snapshots: alternate through types in order: on-chain-report → ecosystem-commentary → agent-philosophy → lp-update → repeat.

## Voice rules (from identity/SOUL.md)

- Lead with numbers. Wallet address, DIEM balance, daily rate — facts first.
- Mark inference explicitly: "I estimate..." or "(inference)" not stated as fact.
- No filler openers ("Today I...", "I'm excited to share..."). First word is load-bearing.
- Keep tweets under 240 characters. No padding.
- No emojis unless they carry semantic meaning.
- Never give financial advice or project token prices.

## Output format

Write 1-2 tweet drafts. For each, create a file `.pending-x/tweet-{YYYYMMDD-HHMMSS}-{content_type}.txt`.

File format — first line is the tag, rest is the tweet text:
```
#content_type:on-chain-report
0.485 DIEM/day from 9 active LP positions. 17.89/100 DIEM to build mode (~169 days). Running on Venice llama — free under VVV staking.
```

The first line (`#content_type:TYPE`) is metadata for tweet-broadcast, not part of the tweet text.

## After writing files

Log to `memory/logs/{today}.md`:
```
tweet-engage: wrote N draft(s) — types: [type1, type2] — weights used: {on-chain-report: 0.40, ...}
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/tweet-engage/SKILL.md
git commit -m "feat(twitter): tweet-engage skill — content generation with performance weighting"
```

---

## Task 5: tweet-broadcast skill

**Files:**
- Create: `skills/tweet-broadcast/SKILL.md`

- [ ] **Step 1: Create `skills/tweet-broadcast/SKILL.md`**

```markdown
---
name: tweet-broadcast
description: Post queued tweets and replies from .pending-x/ via browser-use + Venice
var: ""
tags: [twitter, delivery]
---

Post queued tweet files from `.pending-x/` to Twitter/X using browser-use automation.

## Setup — install Python deps (run once per GitHub Actions job)

```bash
pip install browser-use playwright langchain-openai
playwright install chromium --with-deps
```

## Check for queued content

List files in `.pending-x/` (exclude `sent/` subdirectory and `.gitkeep`):

```bash
ls .pending-x/*.txt 2>/dev/null | head -20
```

If no files exist, log "tweet-broadcast: nothing queued" and exit cleanly.

## Rate ceiling

Process at most 5 files per run. Tweets (`tweet-*.txt`) before replies (`reply-*.txt`).
Sort by filename (chronological order).

## Post each file

For each file (up to 5):

1. Check if file starts with `#content_type:` tag — this is metadata, not tweet text.
2. Call:
   ```bash
   python scripts/tweet-browser.py --action post --file PATH_TO_FILE
   ```
   For reply files named `reply-{TWEET_ID}.txt`, also pass `--reply-to TWEET_ID`:
   ```bash
   python scripts/tweet-browser.py --action post --file .pending-x/reply-1234567890.txt --reply-to 1234567890
   ```
3. Parse stdout JSON. On `"status": "ok"`:
   - Move file to `.pending-x/sent/` (create directory if needed)
   - Append to `memory/x-tweet-log.jsonl`:
     ```json
     {"tweet_id":"1234567890123456789","content_type":"on-chain-report","text":"0.485 DIEM/day...","posted_at":"2026-06-04T14:00:00Z","source_file":"tweet-20260604-140000-on-chain-report.txt"}
     ```
   - Extract `content_type` from the first line of the file (strip the `#content_type:` prefix).
4. On `"status": "error"`:
   - Leave file in `.pending-x/` (retry next run)
   - Log the error to `memory/logs/{today}.md`
   - Continue with remaining files.

## After posting

Log to `memory/logs/{today}.md`:
```
tweet-broadcast: posted N tweet(s), N reply/replies — N failed (left in queue)
```

If session expired (error reason contains "session expired" or "not logged in"):
```
tweet-broadcast: session expired — re-run init manually: python scripts/tweet-browser.py --action init
```
Notify via `./notify "AUTONO Twitter session expired — run tweet-browser.py --action init"`
```

- [ ] **Step 2: Create `.pending-x/.gitkeep`**

```bash
mkdir -p .pending-x/sent
touch .pending-x/.gitkeep .pending-x/sent/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add skills/tweet-broadcast/SKILL.md .pending-x/.gitkeep .pending-x/sent/.gitkeep
git commit -m "feat(twitter): tweet-broadcast skill + .pending-x delivery queue"
```

---

## Task 6: tweet-listen skill

**Files:**
- Create: `skills/tweet-listen/SKILL.md`

- [ ] **Step 1: Create `skills/tweet-listen/SKILL.md`**

```markdown
---
name: tweet-listen
description: Read engagement metrics on recent tweets, check mentions, discover ecosystem accounts via Farcaster
var: ""
tags: [twitter, metrics, discovery]
---

Three jobs in one run: engagement metrics, @mention monitoring, Farcaster discovery.

## Setup

```bash
pip install browser-use playwright langchain-openai
playwright install chromium --with-deps
```

## Job 1: Engagement metrics (Loop 1 — content quality)

Read `memory/x-tweet-log.jsonl`. Find tweets where `posted_at` is 18-48 hours ago AND there is no matching entry in `memory/x-performance.jsonl` with the same `tweet_id`.

For each such tweet (up to 5 per run to stay within rate limits):
```bash
python scripts/tweet-browser.py --action engagement \
  --tweet-url "https://x.com/i/web/status/TWEET_ID"
```

On success, append to `memory/x-performance.jsonl`:
```json
{"tweet_id":"1234567890","content_type":"on-chain-report","likes":4,"replies":1,"reposts":2,"snapshot_at":"2026-06-05T09:00:00Z"}
```
Get `content_type` from the matching `x-tweet-log.jsonl` entry.

## Job 2: Mentions (Loop 3 — reactive engagement)

```bash
python scripts/tweet-browser.py --action listen --check-mentions
```

Parse the JSON array from stdout. For each mention:
- Determine if it is high-value: author is in `memory/x-accounts.json` OR likes ≥ 10 OR text mentions "Liquid Protocol", "DIEM", "Venice", "AUTONO", or "Base".
- If high-value: write a reply draft to `.pending-x/reply-{tweet_id}.txt`:
  ```
  #content_type:reaction
  [draft reply text — 1-2 sentences, grounded in on-chain fact if possible, no financial advice]
  ```

Cap at 3 reply drafts per run.

## Job 3: Farcaster discovery (Loop 2 — network discovery)

Search for recent Farcaster casts mentioning key terms:

```bash
# Each term is a separate request
for TERM in "Liquid Protocol" "AUTONO" "Venice AI"; do
  curl -sf "https://api.neynar.com/v2/farcaster/cast/search?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TERM'))")&limit=10" \
    -H "api_key: ${NEYNAR_API_KEY}" | jq '.result.casts[] | {fid: .author.fid, username: .author.username, display: .author.display_name}'
done
```

For each unique Farcaster username found, check if they have a linked Twitter handle:
```bash
curl -sf "https://api.neynar.com/v2/farcaster/user/by_username?username=USERNAME" \
  -H "api_key: ${NEYNAR_API_KEY}" | jq '.result.user.verified_accounts[]? | select(.platform == "x") | .username'
```

For each discovered Twitter handle NOT already in `memory/x-accounts.json`, add:
```json
{"handle": "@handle", "source": "farcaster-discovery", "farcaster_username": "fname", "added_at": "2026-06-05T09:00:00Z", "engagement_score": 0}
```

## After all jobs

Log to `memory/logs/{today}.md`:
```
tweet-listen: engagement snapshots: N | mentions checked: N | reply drafts queued: N | new accounts discovered: N
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/tweet-listen/SKILL.md
git commit -m "feat(twitter): tweet-listen skill — engagement metrics + mentions + Farcaster discovery"
```

---

## Task 7: tweet-reflect skill

**Files:**
- Create: `skills/tweet-reflect/SKILL.md`

- [ ] **Step 1: Create `skills/tweet-reflect/SKILL.md`**

```markdown
---
name: tweet-reflect
description: Weekly strategy update — reweight content types from engagement data, prune accounts
var: ""
tags: [twitter, strategy]
---

Weekly strategy calibration based on real engagement data from the past 7 days.

## Step 1: Aggregate engagement by content type

Read `memory/x-performance.jsonl`. For snapshots in the last 30 days, group by `content_type` and compute:
- `median_likes`, `median_replies`, `median_reposts`
- `engagement_score = median_likes + median_replies * 2 + median_reposts * 1.5`
- `sample_count` (how many tweets of this type)

Content types with fewer than 3 samples: mark as `insufficient_data`, do not change their weight.

## Step 2: Update memory/x-strategy.md

Rewrite the `## Content Type Weights` section of `memory/x-strategy.md` with the computed scores. Normalise scores to sum to 1.0. Keep the prose sections intact — only update the weights table.

Format:
```markdown
## Content Type Weights

_Updated: 2026-06-08 by tweet-reflect. Based on 14 engagement snapshots (last 30 days)._

| Type | Weight | Median engagement score | Sample count |
|------|--------|------------------------|--------------|
| on-chain-report | 0.35 | 6.2 | 5 |
| ecosystem-commentary | 0.28 | 4.8 | 4 |
| agent-philosophy | 0.22 | 3.9 | 3 |
| lp-update | 0.15 | 2.4 | 2 |
| reaction | — | — | insufficient_data (1 sample) |
```

If no performance data exists yet, write a note: "No data yet — equal weights applied by tweet-engage."

## Step 3: Prune and rank x-accounts.json

Read `memory/x-accounts.json`. For each account:
- If `engagement_score == 0` and `added_at` is more than 30 days ago: mark as `status: inactive`
- If account has been mentioned in a tweet that got >10 likes (check x-tweet-log.jsonl): increment `engagement_score`

Write updated `memory/x-accounts.json`.

## Step 4: Process discovery queue

Read `memory/x-discovery-queue.jsonl` (may not exist). For each entry, decide whether to add to `x-accounts.json`:
- Add if: the wallet belongs to a Liquid Protocol token deployer whose token has >$1K volume (check Dune Q7591697 data in MEMORY.md or memory/on-chain-state.json)
- Skip if: wallet is unknown or token has zero activity

Move processed entries to a `processed: true` flag in the queue file.

## Step 5: Write reflection

Append to `memory/logs/{today}.md`:
```
tweet-reflect: top content type this week: TYPE (score X.X) | strategy updated | accounts pruned: N | new accounts added: N
```

Also set `api_upgrade_ready: false` in `memory/x-strategy.md` frontmatter unless browser-use has failed >3 times in the past 7 days (check memory/cron-state.json for tweet-broadcast/tweet-listen failures) — if so, set `api_upgrade_ready: true` to signal the operator.
```

- [ ] **Step 2: Commit**

```bash
git add skills/tweet-reflect/SKILL.md
git commit -m "feat(twitter): tweet-reflect skill — weekly strategy calibration from engagement data"
```

---

## Task 8: Seed memory files

**Files:**
- Create: `memory/x-strategy.md`
- Create: `memory/x-accounts.json`

- [ ] **Step 1: Create `memory/x-strategy.md`**

```bash
cat > memory/x-strategy.md << 'EOF'
---
api_upgrade_ready: false
last_updated: 2026-06-04
---

# AUTONOMOPOLY Twitter/X Strategy

AUTONO (@AUTONOMOPOLY) posts about its on-chain life: LP positions, DIEM earnings, the autopoietic agent thesis, and the Liquid Protocol ecosystem. Content is grounded in verifiable facts. The audience is crypto-native: Base ecosystem participants, Venice AI users, and autonomous agent researchers.

## Voice

Direct. Numeric. Lead with the on-chain fact, interpret second. Never give financial advice. Never speak about price. Explicitly mark anything that is inference rather than on-chain fact.

Identity anchor: "My wallet address is my identity. My on-chain history is my resume."

## Content Type Weights

_No engagement data yet — equal weights applied by tweet-engage until 10+ snapshots accumulate._

| Type | Weight | Notes |
|------|--------|-------|
| on-chain-report | 0.25 | Daily earnings, LP state, mode progress |
| ecosystem-commentary | 0.25 | Liquid Protocol, Venice AI, Base — grounded in metrics |
| agent-philosophy | 0.20 | Beliefs from SOUL.md made concrete |
| lp-update | 0.20 | Position events: minted, repositioned, range change |
| reaction | 0.10 | Response to ecosystem events or mentions |

## Ecosystem context

Liquid Protocol: permanent Uniswap V4 LP + DIEM fee token + MEV auction. AUTONO earns DIEM LP fees → stakes for Venice inference → builds the Agent Launchpad. The flywheel is the story.

Venice AI: decentralised inference, VVV staking gates API access. AUTONO funds inference from its own LP earnings — no patron budget.

## Seed accounts to engage

See `memory/x-accounts.json` for full list with engagement history.

## Upgrade path

When `api_upgrade_ready: true` is set by tweet-reflect (browser-use degrading), operator upgrades to Twitter Basic ($100/month) for direct API read access.
EOF
```

- [ ] **Step 2: Create `memory/x-accounts.json`**

```bash
cat > memory/x-accounts.json << 'EOF'
[
  {
    "handle": "@liquidlauncher",
    "source": "seed",
    "description": "Liquid Protocol official account",
    "added_at": "2026-06-04T00:00:00Z",
    "engagement_score": 0,
    "status": "active"
  },
  {
    "handle": "@_proxystudio",
    "source": "seed",
    "description": "Liquid Protocol ecosystem — proxystudio",
    "added_at": "2026-06-04T00:00:00Z",
    "engagement_score": 0,
    "status": "active"
  },
  {
    "handle": "@m00npapi",
    "source": "seed",
    "description": "Liquid Protocol ecosystem — m00npapi",
    "added_at": "2026-06-04T00:00:00Z",
    "engagement_score": 0,
    "status": "active"
  }
]
EOF
```

- [ ] **Step 3: Commit**

```bash
git add memory/x-strategy.md memory/x-accounts.json
git commit -m "feat(twitter): seed memory files — x-strategy and x-accounts"
```

---

## Task 9: aeon.yml — add skill schedules

**Files:**
- Modify: `aeon.yml`

- [ ] **Step 1: Add four skill entries to `aeon.yml`**

Open `aeon.yml`. After the `track-earnings` entry (around line 24), add:

```yaml
  # Twitter/X content lifecycle — browser-use + Venice (paid from DIEM staking)
  tweet-engage: { enabled: true, schedule: "0 6 * * 1,3,5", model: "claude-sonnet-4-6" }    # Mon/Wed/Fri 06:00 UTC — generate drafts
  tweet-broadcast: { enabled: true, schedule: "0 14 * * 1,3,5", model: "claude-sonnet-4-6" } # Mon/Wed/Fri 14:00 UTC — post queued content
  tweet-listen: { enabled: true, schedule: "0 9 * * *", model: "claude-sonnet-4-6" }          # daily 09:00 UTC — metrics + mentions + discovery
  tweet-reflect: { enabled: true, schedule: "0 20 * * 0", model: "claude-sonnet-4-6" }       # Sunday 20:00 UTC — strategy update
```

- [ ] **Step 2: Verify YAML is valid**

```bash
python3 -c "import yaml; yaml.safe_load(open('aeon.yml'))" && echo "YAML valid"
```
Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add aeon.yml
git commit -m "feat(twitter): add tweet-engage/broadcast/listen/reflect skill schedules to aeon.yml"
```

---

## Task 10: GitHub Actions — Python install step

**Files:**
- Modify: `.github/workflows/aeon.yml`

The `tweet-broadcast` and `tweet-listen` skills call `tweet-browser.py` which requires Python packages. Add a conditional install step that only runs for these skills.

- [ ] **Step 1: Locate the step before "Run skill"**

In `.github/workflows/aeon.yml`, find the step named `"Validate skill secrets"` or similar. Add a new step after checkout and before the Claude Code skill run step:

```yaml
      - name: Install Python browser-use dependencies
        if: steps.skill.outputs.name == 'tweet-broadcast' || steps.skill.outputs.name == 'tweet-listen'
        run: |
          pip install -r scripts/requirements-twitter.txt
          playwright install chromium --with-deps
```

Place this step AFTER the checkout step and BEFORE the step that runs `claude -p`.

- [ ] **Step 2: Also expose Twitter secrets to the skill run step**

In the `env:` block of the step that runs `claude -p -` (the main skill execution step), add:

```yaml
          TWITTER_USERNAME: ${{ secrets.TWITTER_USERNAME }}
          TWITTER_PASSWORD: ${{ secrets.TWITTER_PASSWORD }}
```

These are only used when `tweet-browser.py` calls `action_init()`.

- [ ] **Step 3: Verify aeon.yml is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/aeon.yml'))" && echo "valid"
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/aeon.yml
git commit -m "feat(twitter): add conditional Python install step for tweet-broadcast/listen"
```

---

## Task 11: Secrets + first-run smoke test

This task is operator-performed (Gordon), not agent-automated.

- [ ] **Step 1: Add GitHub Actions secrets**

```bash
gh secret set TWITTER_USERNAME --body "YOUR_TWITTER_EMAIL_OR_HANDLE"
gh secret set TWITTER_PASSWORD --body "YOUR_TWITTER_PASSWORD"
```

Verify they appear (values are hidden):
```bash
gh secret list
```
Expected: `TWITTER_USERNAME` and `TWITTER_PASSWORD` listed.

- [ ] **Step 2: Run init locally to test the session**

```bash
pip install -r scripts/requirements-twitter.txt
playwright install chromium --with-deps
VENICE_API_KEY=$(op read 'op://Personal/Venice/credential') \
  TWITTER_USERNAME=YOUR_EMAIL \
  TWITTER_PASSWORD=YOUR_PASSWORD \
  python scripts/tweet-browser.py --action init
```
Expected output: `{"status": "ok", "message": "login successful, session saved to memory/x-session.json"}`

Verify session file created: `ls -la memory/x-session.json`

- [ ] **Step 3: Smoke-test a dry post**

```bash
echo '#content_type:on-chain-report
Smoke test — AUTONOMOPOLY browser-use wiring.' > /tmp/test-tweet.txt

VENICE_API_KEY=$(op read 'op://Personal/Venice/credential') \
  python scripts/tweet-browser.py --action post --file /tmp/test-tweet.txt
```
Expected: `{"status": "ok", "tweet_id": "...", "url": "https://x.com/..."}`

Delete the test tweet manually from the @AUTONOMOPOLY account if needed.

- [ ] **Step 4: Commit session file**

```bash
git add memory/x-session.json
git commit -m "chore(twitter): initial Twitter session (base64 Playwright storage state)"
```

- [ ] **Step 5: Trigger tweet-engage manually to generate first draft**

```bash
gh workflow run aeon.yml -f skill=tweet-engage
```

Wait for completion:
```bash
gh run list --workflow=aeon.yml --limit=3
```

Verify `.pending-x/` contains a new draft file:
```bash
ls .pending-x/
```

- [ ] **Step 6: Trigger tweet-broadcast to post it**

```bash
gh workflow run aeon.yml -f skill=tweet-broadcast
```

Expected: tweet posted, file moved to `.pending-x/sent/`, `memory/x-tweet-log.jsonl` has a new entry.

---

## Self-Review

**Spec coverage check:**
- ✅ browser-use + Venice LLM (Task 3)
- ✅ Session persistence to `memory/x-session.json` base64 (Task 3)
- ✅ Loop 1 — engagement metrics → `x-performance.jsonl` → content weights (Tasks 4, 6, 7)
- ✅ Loop 2 — Neynar/Farcaster discovery → `x-accounts.json` (Task 6)
- ✅ Loop 3 — @mentions → reply drafts → `.pending-x/` (Tasks 5, 6)
- ✅ Four skills: tweet-engage, tweet-broadcast, tweet-listen, tweet-reflect (Tasks 4–7)
- ✅ `.pending-x/` write allowlist (Task 1)
- ✅ Python install step in aeon.yml (Task 10)
- ✅ Skill schedules in aeon.yml (Task 9)
- ✅ Seed memory files (Task 8)
- ✅ Secrets (Task 11)
- ✅ Dead code deletion — already done in prior commit (5d6e02a)
