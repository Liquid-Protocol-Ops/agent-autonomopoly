import json, os, urllib.request, urllib.error
KEY = os.environ.get("VENICE_API_KEY", "").strip()

def get(url, auth=True):
    h = {"Authorization": "Bearer " + KEY} if auth else {}
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()

for url in ("https://api.venice.ai/api/v1/swagger.yaml",
            "https://api.venice.ai/doc/api/swagger.yaml",
            "https://api.venice.ai/api/v1/openapi.json"):
    st, raw = get(url, auth=False)
    print("GET %s -> %d (len %d)" % (url, st, len(raw)))
    if st == 200:
        txt = raw.decode("utf-8", "replace")
        # Find video-related paths
        import re
        for line in txt.splitlines():
            l = line.strip()
            if ("video" in l.lower() and ("/api" in l or l.endswith(":"))) or "/generate" in l.lower():
                print("  ", l[:120])
        break
