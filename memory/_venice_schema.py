import json, os, re, urllib.request
KEY = os.environ.get("VENICE_API_KEY", "").strip()
req = urllib.request.Request("https://api.venice.ai/api/v1/swagger.yaml")
with urllib.request.urlopen(req, timeout=60) as r:
    txt = r.read().decode("utf-8", "replace")
lines = txt.splitlines()

def dump_block(anchor, n=70):
    for i, l in enumerate(lines):
        if anchor in l:
            print("--- around line %d (%s) ---" % (i, anchor))
            for j in range(i, min(i + n, len(lines))):
                print(lines[j])
            print()
            return
    print("NOT FOUND:", anchor)

# The queue path block
dump_block("/video/queue:", 40)
# The request schema
dump_block("QueueVideoRequest:", 90)
