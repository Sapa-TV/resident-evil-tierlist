import json, io, os, sys, glob, urllib.request, urllib.parse

BASE = "https://residentevil.fandom.com/api.php"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(io.open(os.path.join(root, "characters.json"), encoding="utf-8"))
raw_dir = os.path.join(root, "raw")
os.makedirs(raw_dir, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) tierlist-assets/1.0"}


def api(params):
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def find_image(candidates):
    q = api({
        "action": "query", "prop": "pageimages", "piprop": "original",
        "redirects": 1, "format": "json", "titles": "|".join(candidates),
    })
    pages = q.get("query", {}).get("pages", {})
    for p in sorted(pages.values(), key=lambda p: p.get("index", 99)):
        if "original" in p:
            return p["original"]["source"], p.get("title")
    return None, None


results, failures = {}, []
for ch in data["characters"]:
    if not ch.get("fandom"):
        failures.append((ch["id"], "no fandom candidates"))
        continue
    if glob.glob(os.path.join(raw_dir, ch["id"] + ".*")):
        continue
    try:
        src, resolved = find_image(ch["fandom"])
    except Exception as e:
        failures.append((ch["id"], "api: " + str(e)))
        continue
    if not src:
        failures.append((ch["id"], "no pageimage"))
        continue
    ext = os.path.splitext(urllib.parse.urlparse(src).path)[1].lower() or ".png"
    if ext not in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        ext = ".png"
    dest = os.path.join(raw_dir, ch["id"] + ext)
    try:
        req = urllib.request.Request(src, headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            f.write(r.read())
        results[ch["id"]] = {"page": resolved, "src": src, "file": os.path.basename(dest)}
    except Exception as e:
        failures.append((ch["id"], "dl: " + str(e)))

report_path = os.path.join(raw_dir, "_report.json")
old = {}
if os.path.exists(report_path):
    try:
        old = json.load(io.open(report_path, encoding="utf-8"))
    except Exception:
        old = {}
merged_ok = dict(old.get("ok", {}))
merged_ok.update(results)
report = {"ok": merged_ok, "fail": failures}
with io.open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)

print("ok:", len(results), "fail:", len(failures))
for fid, why in failures:
    print("FAIL", fid, "-", why)
