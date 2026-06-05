#!/usr/bin/env python3
"""
tweet-browser.py — browser-use automation for AUTONOMOPOLY Twitter presence.

LLM: Venice llama-3.3-70b (OpenAI-compatible) — paid from DIEM staking.
Session: Playwright storage state persisted to memory/x-session.json (base64).

Usage:
  python scripts/tweet-browser.py --action init
  python scripts/tweet-browser.py --action post --file .pending-x/tweet-xyz.txt
  python scripts/tweet-browser.py --action post --text "tweet text" [--reply-to TWEET_ID]
  python scripts/tweet-browser.py --action listen [--check-mentions]
  python scripts/tweet-browser.py --action engagement --tweet-url URL

Exit 0 on success, 1 on failure.
stdout: JSON {"status": "ok", ...}
stderr: JSON {"status": "error", "reason": "..."}  (on failure)
"""
# NOTE: from __future__ import annotations is required for Python 3.9 compatibility —
# the `dict | None` and `str | None` union type hints are only natively supported in
# Python 3.10+. The __future__ import makes all annotations lazy strings so they are
# not evaluated at module load time, which allows the test suite to import this file
# under Python 3.9 without a TypeError. browser-use itself requires Python >=3.11 and
# is imported lazily inside each async action function.
from __future__ import annotations

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
    venice_key = os.environ.get("VENICE_API_KEY", "")
    if not venice_key:
        err("VENICE_API_KEY not set")
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        base_url="https://api.venice.ai/api/v1",
        api_key=venice_key,
        model="llama-3.3-70b",
    )


async def make_browser():
    from browser_use.browser.browser import Browser, BrowserConfig
    return Browser(config=BrowserConfig(
        headless=True,
        extra_chromium_args=["--no-sandbox", "--disable-dev-shm-usage"],
    ))


async def get_context_with_session(browser, session: dict | None):
    context = await browser.new_context()
    if session and session.get("cookies"):
        await context.add_cookies(session["cookies"])
    return context


# ── Actions ───────────────────────────────────────────────────────────────────

async def action_init() -> None:
    username = os.environ.get("TWITTER_USERNAME", "")
    password = os.environ.get("TWITTER_PASSWORD", "")
    if not username or not password:
        err("TWITTER_USERNAME and TWITTER_PASSWORD must be set for --action init")

    from browser_use import Agent

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
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from browser_use import Agent

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

        state = await context.storage_state()
        save_session(state)

        ok({"tweet_id": tweet_id, "url": f"https://x.com/i/web/status/{tweet_id}" if tweet_id else None})
    except Exception as exc:
        err(f"post failed: {exc}")
    finally:
        await browser.close()


async def action_engagement(tweet_url: str) -> None:
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from browser_use import Agent

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


async def action_listen(check_mentions: bool) -> None:
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from browser_use import Agent

    results: dict = {"mentions": []}

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
            err(f"listen failed: {exc}")
        finally:
            await browser.close()

    ok(results)


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="AUTONOMOPOLY Twitter browser automation (browser-use + Venice)"
    )
    parser.add_argument("--action", required=True,
                        help="init=login+save-session, post=tweet, listen=mentions+metrics, engagement=read-tweet-stats")
    parser.add_argument("--file", help="Path to tweet text file (post action)")
    parser.add_argument("--text", help="Tweet text inline (post action)")
    parser.add_argument("--reply-to", dest="reply_to", metavar="TWEET_ID",
                        help="Tweet ID to reply to (post action)")
    parser.add_argument("--check-mentions", action="store_true")
    parser.add_argument("--tweet-url", dest="tweet_url",
                        help="Full tweet URL to read metrics for (engagement action)")
    args = parser.parse_args()

    VALID_ACTIONS = {"init", "post", "listen", "engagement"}
    if args.action not in VALID_ACTIONS:
        err(f"unknown action {args.action!r} — must be one of: {', '.join(sorted(VALID_ACTIONS))}")

    if args.action == "init":
        asyncio.run(action_init())

    elif args.action == "post":
        if args.file:
            text = Path(args.file).read_text().strip()
            lines = text.splitlines()
            if lines and lines[0].startswith("#content_type:"):
                text = "\n".join(lines[1:]).strip()
            if not text:
                err("tweet text is empty after stripping #content_type: header")
        elif args.text:
            text = args.text
        else:
            err("--file or --text required for post action")
            return
        asyncio.run(action_post(text, reply_to=args.reply_to))

    elif args.action == "listen":
        asyncio.run(action_listen(
            check_mentions=args.check_mentions,
        ))

    elif args.action == "engagement":
        if not args.tweet_url:
            err("--tweet-url required for engagement action")
            return
        asyncio.run(action_engagement(args.tweet_url))


if __name__ == "__main__":
    main()
