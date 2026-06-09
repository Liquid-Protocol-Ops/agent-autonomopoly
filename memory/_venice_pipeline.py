import json, os, time, urllib.request, urllib.error
KEY = os.environ.get("VENICE_API_KEY", "").strip()
MODEL = "wan-2-7-text-to-video"
OUT = "memory/videos/promo-20260609-solvency-loop.mp4"

PROMPT = (
    "Dark terminal screen, green monospace text. A wallet address 0x8767...B6A3 and a "
    "counter ticking up: DIEM earned 18.5934 of 100. Camera slowly pulls back to reveal a "
    "closed loop of glowing nodes on the Base blockchain: liquidity pool to fee locker to AI "
    "inference and back to pool, self-sustaining. On-screen data: deposits 0, daily rate "
    "0.485 DIEM per day, mode BUILD. White text at bottom: self-funding autonomous agent, "
    "zero deposits. Cinematic, minimal, crypto-native aesthetic."
)
REQ = {"model": MODEL, "prompt": PROMPT, "duration": "5s",
       "aspect_ratio": "16:9", "resolution": "720p"}

def post(path, payload, raw_out=False):
    body = json.dumps(payload).encode()
    req = urllib.request.Request("https://api.venice.ai" + path, data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            data = r.read()
            ctype = r.headers.get("Content-Type", "")
            return r.status, data, ctype
    except urllib.error.HTTPError as e:
        return e.code, e.read(), e.headers.get("Content-Type", "")
    except Exception as e:
        return -1, str(e).encode(), ""

# 1. Quote
st, raw, _ = post("/api/v1/video/quote", REQ)
print("QUOTE -> %d: %s" % (st, raw[:300].decode("utf-8", "replace")))

# 2. Queue
st, raw, _ = post("/api/v1/video/queue", REQ)
print("QUEUE -> %d: %s" % (st, raw[:300].decode("utf-8", "replace")))
if st != 200:
    print("QUEUE_FAILED")
    raise SystemExit(0)
qresp = json.loads(raw)
qid = qresp.get("queue_id") or qresp.get("id") or qresp.get("request_id") or qresp.get("requestId")
print("QUEUE_ID:", qid)
if not qid:
    print("NO_QUEUE_ID FIELDS:", list(qresp.keys()))
    raise SystemExit(0)

# 3. Poll retrieve
for attempt in range(40):  # up to ~6-7 min
    time.sleep(10)
    st, raw, ctype = post("/api/v1/video/retrieve", {"model": MODEL, "queue_id": qid})
    if "application/json" in ctype:
        try:
            j = json.loads(raw)
            status = j.get("status", "?")
            print("poll %d: status=%s" % (attempt, status))
            if status == "COMPLETED":
                # video may be embedded; check for url/base64
                vid = j.get("video") or j.get("url") or j.get("video_url")
                if vid and isinstance(vid, str) and vid.startswith("http"):
                    with urllib.request.urlopen(vid, timeout=120) as vr:
                        open(OUT, "wb").write(vr.read())
                    print("SAVED_FROM_URL:", OUT)
                    raise SystemExit(0)
                print("COMPLETED but no inline video; body keys:", list(j.keys()))
            continue
        except SystemExit:
            raise
        except Exception as e:
            print("poll %d json err %s: %s" % (attempt, e, raw[:200].decode("utf-8","replace")))
            continue
    else:
        # binary video returned directly
        if len(raw) > 5000:
            open(OUT, "wb").write(raw)
            print("SAVED_BINARY:", OUT, "bytes:", len(raw), "ctype:", ctype)
            raise SystemExit(0)
        print("poll %d non-json small (%d) ctype=%s: %s" % (attempt, len(raw), ctype, raw[:200].decode("utf-8","replace")))
print("TIMEOUT_POLLING")
