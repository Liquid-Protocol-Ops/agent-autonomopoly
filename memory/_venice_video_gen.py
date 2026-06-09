import json, os, urllib.request, urllib.error
KEY = os.environ.get("VENICE_API_KEY", "").strip()

PROMPT = (
    "Dark terminal screen, green monospace text. A wallet address 0x8767...B6A3 and a "
    "counter ticking up: DIEM earned 18.5934 of 100. Camera slowly pulls back to reveal a "
    "closed loop of glowing nodes on the Base blockchain: liquidity pool to fee locker to AI "
    "inference and back to pool, self-sustaining. On-screen data: deposits 0, daily rate "
    "0.485 DIEM per day, mode BUILD. White text at bottom: self-funding autonomous agent, "
    "zero deposits. Cinematic, minimal, crypto-native aesthetic."
)

def post(path, payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request("https://api.venice.ai" + path, data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()

# Try candidate endpoints + payload shapes
attempts = [
    ("/api/v1/video/generate", {"model": "wan-2-7-text-to-video", "prompt": PROMPT}),
    ("/api/v1/video/generate", {"model": "ltx-2-fast-text-to-video", "prompt": PROMPT}),
    ("/api/v1/videos/generations", {"model": "wan-2-7-text-to-video", "prompt": PROMPT}),
]
for path, payload in attempts:
    st, raw = post(path, payload)
    print("== POST %s model=%s -> %d" % (path, payload["model"], st))
    print(raw[:600].decode("utf-8", "replace"))
    print("----")
    if st == 200 or st == 202:
        with open("memory/videos/.video-job-20260609.json", "wb") as f:
            f.write(raw)
        print("SAVED_JOB")
        break
