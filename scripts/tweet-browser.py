#!/usr/bin/env python3
"""
tweet-browser.py — direct Playwright automation for AUTONOMOPOLY Twitter presence.

No browser-use / LLM navigation. Uses Playwright with Twitter's stable data-testid selectors.
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

LAUNCH_ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]


# ── Session management ────────────────────────────────────────────────────────

def load_session() -> dict | None:
    if not SESSION_FILE.exists():
        return None
    try:
        raw = SESSION_FILE.read_text().strip()
        decoded = base64.b64decode(raw.encode())
        return json.loads(decoded)
    except Exception:
        return None


def save_session(state: dict) -> None:
    MEMORY_DIR.mkdir(exist_ok=True)
    encoded = base64.b64encode(json.dumps(state).encode()).decode()
    SESSION_FILE.write_text(encoded)


# ── Output helpers ────────────────────────────────────────────────────────────

def ok(data: dict) -> None:
    print(json.dumps({"status": "ok", **data}))


def err(reason: str) -> None:
    print(json.dumps({"status": "error", "reason": reason}), file=sys.stderr)
    sys.exit(1)


# ── Browser helpers ───────────────────────────────────────────────────────────

async def make_context(playwright, session: dict | None = None):
    browser = await playwright.chromium.launch(headless=True, args=LAUNCH_ARGS)
    kwargs = {"user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    if session:
        kwargs["storage_state"] = session
    ctx = await browser.new_context(**kwargs)
    page = await ctx.new_page()
    return browser, ctx, page


async def is_logged_in(page) -> bool:
    try:
        await page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(3000)
        return "home" in page.url or await page.query_selector('[data-testid="SideNav_NewTweet_Button"]') is not None
    except Exception:
        return False


# ── Actions ───────────────────────────────────────────────────────────────────

async def action_init() -> None:
    username = os.environ.get("TWITTER_USERNAME", "")
    password = os.environ.get("TWITTER_PASSWORD", "")
    if not username or not password:
        err("TWITTER_USERNAME and TWITTER_PASSWORD must be set for --action init")

    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=LAUNCH_ARGS)
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
            locale="en-US",
            timezone_id="America/New_York",
        )
        # Mask headless signals
        await ctx.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});
        """)
        page = await ctx.new_page()
        try:
            # Hit x.com homepage first, then navigate to login (avoids anti-bot redirect)
            await page.goto("https://x.com", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)
            await page.goto("https://x.com/i/flow/login", wait_until="load", timeout=30000)
            await page.wait_for_timeout(3000)

            print(f"DEBUG: current URL after login nav: {page.url}", file=sys.stderr)

            # Enter username/email — Twitter renders the input via React, give it time
            await page.wait_for_selector('input[autocomplete="username"], input[name="text"]', timeout=30000)
            username_input = await page.query_selector('input[autocomplete="username"]') or await page.query_selector('input[name="text"]')
            await username_input.click()
            await page.wait_for_timeout(500)
            await username_input.type(username, delay=80)
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(2500)

            # Handle potential "Enter phone or username" intermediate step
            unusual = await page.query_selector('input[data-testid="ocfEnterTextTextInput"], input[name="text"]')
            if unusual and await unusual.is_visible():
                await unusual.fill(username)
                await page.keyboard.press("Enter")
                await page.wait_for_timeout(2500)

            # Enter password
            await page.wait_for_selector('input[name="password"]', timeout=15000)
            password_input = await page.query_selector('input[name="password"]')
            await password_input.click()
            await page.wait_for_timeout(500)
            await password_input.type(password, delay=60)
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(6000)

            print(f"DEBUG: current URL after login: {page.url}", file=sys.stderr)

            state = await ctx.storage_state()
            save_session(state)
            ok({"action": "init", "url": page.url, "message": "session saved to memory/x-session.json"})
        except Exception as exc:
            err(f"init failed: {exc}")
        finally:
            await browser.close()


async def action_post(text: str, reply_to: str | None = None) -> None:
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser, ctx, page = await make_context(p, session)
        try:
            if reply_to:
                await page.goto(f"https://x.com/i/web/status/{reply_to}", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(2000)
                reply_btn = await page.wait_for_selector('[data-testid="reply"]', timeout=10000)
                await reply_btn.click()
                await page.wait_for_timeout(1500)
            else:
                await page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(2000)
                compose = await page.wait_for_selector('[data-testid="SideNav_NewTweet_Button"]', timeout=10000)
                await compose.click()
                await page.wait_for_timeout(1500)

            # Type tweet text
            textarea = await page.wait_for_selector('[data-testid="tweetTextarea_0"]', timeout=10000)
            await textarea.click()
            await page.keyboard.type(text, delay=30)
            await page.wait_for_timeout(1000)

            # Click post button
            post_btn = await page.wait_for_selector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]', timeout=5000)
            await post_btn.click()
            await page.wait_for_timeout(4000)

            # Try to extract tweet ID from URL or response
            tweet_id = None
            current_url = page.url
            m = re.search(r'status/(\d+)', current_url)
            if m:
                tweet_id = m.group(1)

            state = await ctx.storage_state()
            save_session(state)
            ok({"tweet_id": tweet_id, "text_posted": text[:80]})
        except Exception as exc:
            err(f"post failed: {exc}")
        finally:
            await browser.close()


async def action_engagement(tweet_url: str) -> None:
    session = load_session()
    if not session:
        err("no session found — run --action init first")

    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser, ctx, page = await make_context(p, session)
        try:
            await page.goto(tweet_url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(3000)

            def parse_count(s: str) -> int:
                s = s.strip().replace(",", "")
                if s.endswith("K"):
                    return int(float(s[:-1]) * 1000)
                if s.endswith("M"):
                    return int(float(s[:-1]) * 1_000_000)
                try:
                    return int(s)
                except ValueError:
                    return 0

            metrics = {"likes": 0, "replies": 0, "reposts": 0}
            for testid, key in [("like", "likes"), ("reply", "replies"), ("retweet", "reposts")]:
                try:
                    el = await page.query_selector(f'[data-testid="{testid}"] span[data-testid="app-text-transition-container"]')
                    if el:
                        metrics[key] = parse_count(await el.inner_text())
                except Exception:
                    pass

            state = await ctx.storage_state()
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

    results: dict = {"mentions": []}

    if not check_mentions:
        ok(results)
        return

    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser, ctx, page = await make_context(p, session)
        try:
            await page.goto("https://x.com/notifications/mentions", wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(3000)

            mentions = []
            articles = await page.query_selector_all('article[data-testid="tweet"]')
            for article in articles[:10]:
                try:
                    handle_el = await article.query_selector('[data-testid="User-Name"] a')
                    text_el = await article.query_selector('[data-testid="tweetText"]')
                    link_el = await article.query_selector('a[href*="/status/"]')

                    handle = (await handle_el.get_attribute("href") or "").lstrip("/").split("/")[0] if handle_el else ""
                    text = await text_el.inner_text() if text_el else ""
                    href = await link_el.get_attribute("href") if link_el else ""
                    url = f"https://x.com{href}" if href else ""
                    tweet_id = re.search(r'/status/(\d+)', href or "")

                    mentions.append({
                        "author": f"@{handle}",
                        "text": text[:280],
                        "likes": 0,
                        "url": url,
                        "tweet_id": tweet_id.group(1) if tweet_id else None,
                    })
                except Exception:
                    continue

            results["mentions"] = mentions
            state = await ctx.storage_state()
            save_session(state)
            ok(results)
        except Exception as exc:
            err(f"listen failed: {exc}")
        finally:
            await browser.close()


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AUTONOMOPOLY Twitter Playwright automation")
    parser.add_argument("--action", required=True,
                        help="init | post | listen | engagement")
    parser.add_argument("--file", help="Path to tweet text file (post action)")
    parser.add_argument("--text", help="Tweet text inline (post action)")
    parser.add_argument("--reply-to", dest="reply_to", metavar="TWEET_ID")
    parser.add_argument("--check-mentions", action="store_true")
    parser.add_argument("--tweet-url", dest="tweet_url")
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
        asyncio.run(action_listen(check_mentions=args.check_mentions))

    elif args.action == "engagement":
        if not args.tweet_url:
            err("--tweet-url required for engagement action")
            return
        asyncio.run(action_engagement(args.tweet_url))


if __name__ == "__main__":
    main()
