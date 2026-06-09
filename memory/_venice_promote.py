#!/usr/bin/env python3
"""tweet-promote: Venice video gen (falls back to image). Reads VENICE_API_KEY from env."""
import json, os, sys, urllib.request, urllib.error

KEY = os.environ.get("VENICE_API_KEY", "").strip()
if not KEY:
    print("RESULT:NO_KEY")
    sys.exit(0)

PROMPT = (
    "Dark terminal screen, green monospace text. A wallet address 0x8767...B6A3 and a "
    "counter ticking up: DIEM earned 18.5934 of 100. Camera slowly pulls back to reveal a "
    "closed loop of glowing nodes on the Base blockchain: liquidity pool to fee locker to AI "
    "inference and back to pool, self-sustaining. On-screen data: deposits 0, daily rate "
    "0.485 DIEM per day, mode BUILD. White text at bottom: self-funding autonomous agent, "
    "zero deposits. Cinematic, minimal, crypto-native aesthetic."
)

def call(model, w, h):
    body = json.dumps({"model": model, "prompt": PROMPT, "width": w, "height": h, "steps": 30}).encode()
    req = urllib.request.Request(
        "https://api.venice.ai/api/v1/image/generate",
        data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()

# Attempt video first
status, raw = call("wan-2.1-t2v-480p", 854, 480)
mode = "video"
if status != 200:
    # Fallback to image
    fb_status, fb_raw = call("flux-dev-uncensored", 1200, 675)
    print("RESULT:VIDEO_FAIL")
    print("VIDEO_STATUS:%d" % status)
    print("VIDEO_BODY:%s" % raw[:400].decode("utf-8", "replace"))
    print("IMAGE_STATUS:%d" % fb_status)
    status, raw, mode = fb_status, fb_raw, "image"

ext = "mp4" if mode == "video" else "png"
out = "memory/videos/promo-20260609-solvency-loop.%s" % ext
saved = False
if status == 200:
    # Venice image/generate returns JSON with base64 image(s)
    try:
        data = json.loads(raw)
        b64 = None
        if isinstance(data, dict):
            if "images" in data and data["images"]:
                b64 = data["images"][0]
            elif "data" in data and data["data"]:
                d0 = data["data"][0]
                b64 = d0.get("b64_json") or d0.get("url")
        if b64 and not b64.startswith("http"):
            import base64
            with open(out, "wb") as f:
                f.write(base64.b64decode(b64))
            saved = True
        elif b64:
            print("URL_RESPONSE:%s" % b64)
    except Exception as e:
        # Maybe raw bytes already (binary image/video)
        if raw[:4] in (b"\x89PNG", b"\x00\x00\x00\x18", b"\x00\x00\x00 ", b"RIFF") or len(raw) > 5000:
            with open(out, "wb") as f:
                f.write(raw)
            saved = True
        else:
            print("PARSE_ERR:%s BODY:%s" % (e, raw[:300].decode("utf-8", "replace")))

print("FINAL_MODE:%s" % mode)
print("FINAL_STATUS:%d" % status)
print("SAVED:%s" % (out if saved else "NONE"))
