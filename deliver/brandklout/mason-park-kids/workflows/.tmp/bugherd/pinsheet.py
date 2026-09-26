import json, sys, os
from PIL import Image, ImageDraw
T = {t["local_task_id"]: t for t in json.load(open("tasks.json", encoding="utf-8"))}
ns = [int(a) for a in sys.argv[2:]]
out = sys.argv[1]
tiles = []
for n in ns:
    t = T[n]; sd = t.get("screenshot_data") or {}
    im = Image.open(f"shots/{n}.jpg").convert("RGB")
    sx = im.size[0] / (sd.get("screenshot_width") or im.size[0])
    x, y = sd.get("screenshot_pin_x", 0) * sx, sd.get("screenshot_pin_y", 0) * sx
    d = ImageDraw.Draw(im)
    r = 14 * sx
    d.ellipse([x - r, y - r, x + r, y + r], outline="red", width=int(5 * sx) or 3)
    im.thumbnail((900, 900))
    lab = Image.new("RGB", (im.size[0], im.size[1] + 22), "white")
    lab.paste(im, (0, 22))
    ImageDraw.Draw(lab).text((4, 4), f"#{n} {t['url']} :: {t['description'][:110]!r}", fill="black")
    tiles.append(lab)
W = max(t.size[0] for t in tiles); H = sum(t.size[1] for t in tiles)
sheet = Image.new("RGB", (W, H), "white"); y = 0
for t in tiles: sheet.paste(t, (0, y)); y += t.size[1]
sheet.save(out, quality=80)
