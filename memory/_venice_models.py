#!/usr/bin/env python3
import json, os, urllib.request, urllib.error
KEY = os.environ.get("VENICE_API_KEY", "").strip()
for path in ("/api/v1/models?type=image", "/api/v1/models"):
    req = urllib.request.Request("https://api.venice.ai" + path,
        headers={"Authorization": "Bearer " + KEY})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
        ids = []
        for m in (data.get("data") or data.get("models") or []):
            mid = m.get("id") if isinstance(m, dict) else m
            mtype = m.get("type") if isinstance(m, dict) else ""
            ids.append("%s [%s]" % (mid, mtype))
        print("PATH %s -> %d models" % (path, len(ids)))
        for i in ids:
            print("  " + i)
        break
    except urllib.error.HTTPError as e:
        print("PATH %s HTTP %d %s" % (path, e.code, e.read()[:200].decode("utf-8","replace")))
    except Exception as e:
        print("PATH %s ERR %s" % (path, e))
