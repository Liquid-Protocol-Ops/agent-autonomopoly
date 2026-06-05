#!/usr/bin/env python3
"""
generate-session.py — one-time local script to log into Twitter with a real
browser window and save the session to memory/x-session.json.

Run this LOCALLY (not in CI):
  python3 scripts/generate-session.py

A Chrome window will open. Log in normally. The script detects /home and saves
the session automatically. Then commit memory/x-session.json and push.
"""
import asyncio
import base64
import json
import sys
from pathlib import Path


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("playwright not installed. Run: pip3 install playwright && playwright install chromium")
        sys.exit(1)

    print("Opening browser — please log in to X/Twitter manually...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"],
        )
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
        )
        page = await ctx.new_page()
        await page.goto("https://x.com/i/flow/login", wait_until="domcontentloaded", timeout=30000)
        print("Waiting for you to log in (2 min timeout)...")
        try:
            await page.wait_for_url("**/home**", timeout=120000)
        except Exception:
            print("Didn't detect /home — saving whatever session exists anyway...")

        state = await ctx.storage_state()
        Path("memory").mkdir(exist_ok=True)
        encoded = base64.b64encode(json.dumps(state).encode()).decode()
        Path("memory/x-session.json").write_text(encoded)
        print("Session saved to memory/x-session.json")
        print("Next steps:")
        print("  git add memory/x-session.json")
        print('  git commit -m "chore(twitter): add browser session"')
        print("  git push origin main")
        await browser.close()


asyncio.run(main())
