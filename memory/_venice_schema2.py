import os, urllib.request
KEY = os.environ.get("VENICE_API_KEY", "").strip()
req = urllib.request.Request("https://api.venice.ai/api/v1/swagger.yaml")
with urllib.request.urlopen(req, timeout=60) as r:
    txt = r.read().decode("utf-8", "replace")
lines = txt.splitlines()

def dump_block(anchor, n=60, start=0):
    for i, l in enumerate(lines):
        if i < start: continue
        if anchor in l:
            print("--- line %d (%s) ---" % (i, anchor))
            for j in range(i, min(i + n, len(lines))):
                print(lines[j])
            print()
            return i
    print("NOT FOUND:", anchor)
    return -1

dump_block("/video/retrieve:", 55)
dump_block("RetrieveVideoRequest:", 35)
dump_block("QueueVideoResponse:", 45)
