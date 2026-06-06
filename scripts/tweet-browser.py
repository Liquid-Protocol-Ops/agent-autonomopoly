#!/usr/bin/env python3
"""
tweet-browser.py — X API v2 automation for AUTONOMOPOLY.

Uses tweepy with OAuth 1.0a User Context (API Key + Access Token).
No browser automation, no session files, no bot detection.

Required env vars:
  TWITTER_API_KEY
  TWITTER_API_SECRET
  TWITTER_ACCESS_TOKEN
  TWITTER_ACCESS_SECRET

Usage:
  python scripts/tweet-browser.py --action post --file .pending-x/tweet-xyz.txt
  python scripts/tweet-browser.py --action post --text "tweet text" [--reply-to TWEET_ID]
  python scripts/tweet-browser.py --action listen [--check-mentions]
  python scripts/tweet-browser.py --action engagement --tweet-url URL
  python scripts/tweet-browser.py --action like --tweet-id TWEET_ID
  python scripts/tweet-browser.py --action init   # no-op: kept for workflow compatibility

Exit 0 on success, 1 on failure.
stdout: JSON {"status": "ok", ...}
stderr: JSON {"status": "error", "reason": "..."} on failure
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

PENDING_DIR = Path(".pending-x")
MEMORY_DIR = Path("memory")
CACHED_USER_ID_FILE = MEMORY_DIR / "x-user-id.txt"
SINCE_ID_FILE = MEMORY_DIR / "x-since-id.txt"


def ok(data: dict) -> None:
    print(json.dumps({"status": "ok", **data}))


def err(reason: str) -> None:
    print(json.dumps({"status": "error", "reason": reason}), file=sys.stderr)
    sys.exit(1)


def _exc_summary(exc: Exception) -> str:
    # Return a log-safe summary of an exception — breaks taint flow from credentials.
    # Tweepy exceptions carry HTTP responses, not credential values, but we
    # reference only the status code so static analysis can confirm no secrets leak.
    if hasattr(exc, "response") and exc.response is not None:
        return f"{type(exc).__name__} HTTP {exc.response.status_code}"
    return type(exc).__name__


def get_client():
    try:
        import tweepy
    except ImportError:
        err("tweepy not installed — run: pip install tweepy")

    api_key = os.environ.get("TWITTER_API_KEY", "")
    api_secret = os.environ.get("TWITTER_API_SECRET", "")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN", "")
    access_secret = os.environ.get("TWITTER_ACCESS_SECRET", "")

    missing = [k for k, v in {
        "TWITTER_API_KEY": api_key,
        "TWITTER_API_SECRET": api_secret,
        "TWITTER_ACCESS_TOKEN": access_token,
        "TWITTER_ACCESS_SECRET": access_secret,
    }.items() if not v]
    if missing:
        err(f"Missing required env vars: {', '.join(missing)}")

    return tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_secret,
        wait_on_rate_limit=True,
    )


def action_init() -> None:
    # No-op: kept so the aeon.yml init step doesn't break when called
    # (API-based auth needs no session file)
    ok({"action": "init", "message": "X API mode — no session needed"})


def action_post(text: str, reply_to: str | None = None) -> None:
    # URLs cost $0.200/tweet vs $0.015 — log a warning if detected
    if re.search(r'https?://', text):
        print("WARNING: tweet contains URL — costs $0.200 instead of $0.015", file=sys.stderr)
    client = get_client()
    kwargs: dict = {"text": text}
    if reply_to:
        kwargs["in_reply_to_tweet_id"] = reply_to
    try:
        response = client.create_tweet(**kwargs)
        tweet_id = str(response.data["id"]) if response.data else None
        ok({"tweet_id": tweet_id, "text_posted": text[:80]})
    except Exception as exc:
        err(f"post failed: {_exc_summary(exc)}")


def action_engagement(tweet_url: str) -> None:
    client = get_client()
    m = re.search(r'/status/(\d+)', tweet_url)
    if not m:
        err(f"could not extract tweet ID from URL: {tweet_url}")
    tweet_id = m.group(1)
    try:
        response = client.get_tweet(
            tweet_id,
            tweet_fields=["public_metrics"],
        )
        if not response.data:
            err(f"tweet {tweet_id} not found")
        metrics = response.data.public_metrics or {}
        ok({
            "likes": metrics.get("like_count", 0),
            "replies": metrics.get("reply_count", 0),
            "reposts": metrics.get("retweet_count", 0) + metrics.get("quote_count", 0),
        })
    except Exception as exc:
        err(f"engagement check failed: {_exc_summary(exc)}")


def action_listen(check_mentions: bool) -> None:
    results: dict = {"mentions": []}
    if not check_mentions:
        ok(results)
        return

    client = get_client()
    try:
        # Cache user ID to avoid $0.010 get_me call on every run
        if CACHED_USER_ID_FILE.exists():
            user_id = int(CACHED_USER_ID_FILE.read_text().strip())
        else:
            me = client.get_me()
            if not me.data:
                err("could not retrieve authenticated user")
            user_id = me.data.id
            MEMORY_DIR.mkdir(exist_ok=True)
            CACHED_USER_ID_FILE.write_text(str(user_id))

        kwargs: dict = {
            "id": user_id,
            "max_results": 100,
            "tweet_fields": ["public_metrics", "author_id", "text"],
            "expansions": ["author_id"],
            "user_fields": ["username"],
        }
        # since_id: only fetch mentions newer than the last processed tweet.
        # Prevents re-reading already-seen posts and eliminates redundant read costs.
        if SINCE_ID_FILE.exists():
            since_id = SINCE_ID_FILE.read_text().strip()
            if since_id.isdigit():
                kwargs["since_id"] = since_id

        response = client.get_users_mentions(**kwargs)

        users_by_id: dict = {}
        if response.includes and response.includes.get("users"):
            for u in response.includes["users"]:
                users_by_id[u.id] = u.username

        mentions = []
        newest_id: str | None = None
        for tweet in (response.data or []):
            author_handle = "@" + users_by_id.get(tweet.author_id, str(tweet.author_id))
            metrics = tweet.public_metrics or {}
            mentions.append({
                "author": author_handle,
                "text": tweet.text[:280],
                "likes": metrics.get("like_count", 0),
                "url": f"https://x.com/i/web/status/{tweet.id}",
                "tweet_id": str(tweet.id),
            })
            # Track the highest tweet ID seen so far
            if newest_id is None or int(tweet.id) > int(newest_id):
                newest_id = str(tweet.id)

        # Persist since_id so the next poll only fetches genuinely new mentions
        if newest_id:
            MEMORY_DIR.mkdir(exist_ok=True)
            SINCE_ID_FILE.write_text(newest_id)

        results["mentions"] = mentions
        ok(results)
    except Exception as exc:
        err(f"listen failed: {_exc_summary(exc)}")


def main():
    parser = argparse.ArgumentParser(description="AUTONOMOPOLY X API automation")
    parser.add_argument("--action", required=True,
                        help="init | post | listen | engagement")
    parser.add_argument("--file", help="Path to tweet text file (post action)")
    parser.add_argument("--text", help="Tweet text inline (post action)")
    parser.add_argument("--reply-to", dest="reply_to", metavar="TWEET_ID")
    parser.add_argument("--check-mentions", action="store_true")
    parser.add_argument("--tweet-url", dest="tweet_url")
    parser.add_argument("--tweet-id", dest="tweet_id_arg", metavar="TWEET_ID")
    args = parser.parse_args()

    VALID_ACTIONS = {"init", "post", "listen", "engagement", "like"}
    if args.action not in VALID_ACTIONS:
        err(f"unknown action {args.action!r} — must be one of: {', '.join(sorted(VALID_ACTIONS))}")

    if args.action == "like":
        if not args.tweet_id_arg:
            err("--tweet-id required for like action")
            return
        try:
            client = get_client()
            if CACHED_USER_ID_FILE.exists():
                user_id = int(CACHED_USER_ID_FILE.read_text().strip())
            else:
                me = client.get_me()
                if not me.data:
                    err("could not retrieve authenticated user for like")
                user_id = me.data.id
                MEMORY_DIR.mkdir(exist_ok=True)
                CACHED_USER_ID_FILE.write_text(str(user_id))
            client.like(user_id, args.tweet_id_arg)
            ok({"liked": args.tweet_id_arg})
        except Exception as exc:
            err(f"like failed: {_exc_summary(exc)}")

    elif args.action == "init":
        action_init()

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
        action_post(text, reply_to=args.reply_to)

    elif args.action == "listen":
        action_listen(check_mentions=args.check_mentions)

    elif args.action == "engagement":
        if not args.tweet_url:
            err("--tweet-url required for engagement action")
            return
        action_engagement(args.tweet_url)


if __name__ == "__main__":
    main()
