import json, io, os, subprocess, urllib.request, urllib.parse

BASE = "https://residentevil.fandom.com/api.php"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(io.open(os.path.join(root, "games.json"), encoding="utf-8"))
out_dir = os.path.join(root, "public", "games")
os.makedirs(out_dir, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) tierlist-assets/1.0"}
CANVAS = "480x640"


def api(params):
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def find_image(candidates):
    for title in candidates:
        q = api({
            "action": "query", "prop": "pageimages", "piprop": "original",
            "redirects": 1, "format": "json", "titles": title,
        })
        pages = q.get("query", {}).get("pages", {})
        for p in sorted(pages.values(), key=lambda p: p.get("index", 99)):
            if "original" in p:
                return p["original"]["source"], p.get("title")
    return None, None


def to_jpeg(src, dest):
    subprocess.run(
        ["magick", src, "-resize", CANVAS + ">", "-auto-orient",
         "-background", "#101014", "-flatten",
         "-gravity", "center", "-extent", CANVAS, "-quality", "85", dest],
        check=True,
    )


results, failures = {}, []
for g in data["games"]:
    dest = os.path.join(out_dir, g["id"] + ".jpg")
    if os.path.exists(dest):
        continue
    try:
        src, resolved = find_image(g["fandom"])
    except Exception as e:
        failures.append((g["id"], "api: " + str(e)))
        continue
    if not src:
        failures.append((g["id"], "no pageimage"))
        continue
    ext = os.path.splitext(urllib.parse.urlparse(src).path)[1].lower() or ".png"
    if ext not in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        ext = ".png"
    tmp = os.path.join(out_dir, "_" + g["id"] + ext)
    try:
        req = urllib.request.Request(src, headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r, open(tmp, "wb") as f:
            f.write(r.read())
        to_jpeg(tmp, dest)
        os.remove(tmp)
        results[g["id"]] = {"page": resolved, "src": src}
    except Exception as e:
        failures.append((g["id"], "dl: " + str(e)))
        if os.path.exists(tmp):
            os.remove(tmp)

print("ok:", len(results), "skip:", len(data["games"]) - len(results) - len(failures), "fail:", len(failures))
for fid, why in failures:
    print("FAIL", fid, "-", why)
