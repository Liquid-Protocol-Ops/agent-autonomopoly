import json, os, urllib.request, urllib.error
KEY = os.environ.get("VENICE_API_KEY", "").strip()
req = urllib.request.Request("https://api.venice.ai/api/v1/models?type=video",
    headers={"Authorization": "Bearer " + KEY})
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read())
    ms = d.get("data") or d.get("models") or []
    print("VIDEO MODELS:", len(ms))
    for m in ms:
        print("  ", m.get("id") if isinstance(m, dict) else m)
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:300].decode("utf-8", "replace"))
except Exception as e:
    print("ERR", e)
