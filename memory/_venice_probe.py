import json, os, urllib.request, urllib.error
KEY = os.environ.get("VENICE_API_KEY", "").strip()

def get(path):
    req = urllib.request.Request("https://api.venice.ai" + path,
        headers={"Authorization": "Bearer " + KEY})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()

# 1. Full model object for one t2v model
st, raw = get("/api/v1/models?type=video")
d = json.loads(raw)
ms = d.get("data") or []
for m in ms:
    if isinstance(m, dict) and m.get("id") == "wan-2-7-text-to-video":
        print("MODEL OBJECT:")
        print(json.dumps(m, indent=2)[:1500])
        break

# 2. POST image/generate with video model id to see if route accepts it
def post(path, payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request("https://api.venice.ai" + path, data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()

for path in ("/api/v1/image/generate", "/api/v1/video/generations", "/api/v1/generate/video", "/api/v1/videos"):
    st, raw = post(path, {"model": "wan-2-7-text-to-video", "prompt": "test"})
    print("POST %s -> %d : %s" % (path, st, raw[:200].decode("utf-8", "replace")))
