"""Rewrites the width/height attributes on every <img> whose asset was
re-emitted at a new size (upscale-doctor.mjs), in pages/ and partials/.

The attributes carry the intrinsic size so the browser reserves the right
box before the file arrives. The aspect did not change, so the old numbers
were not wrong, only stale; this keeps them honest.

Usage: python fix-dims.py
"""
import os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
changed = 0
for d in ("pages", "partials"):
    for f in sorted(os.listdir(os.path.join(HERE, d))):
        if not f.endswith(".html"):
            continue
        p = os.path.join(HERE, d, f)
        t = open(p, encoding="utf8").read()

        def fix(m):
            global changed
            tag = m.group(0)
            src = re.search(r'src="assets/([^"]+)"', tag)
            if not src:
                return tag
            ap = os.path.join(ASSETS, src.group(1))
            if not os.path.exists(ap) or ap.endswith(".svg"):
                return tag
            w, h = Image.open(ap).size
            new = re.sub(r'\bwidth="\d+"', f'width="{w}"', tag)
            new = re.sub(r'\bheight="\d+"', f'height="{h}"', new)
            if new != tag:
                changed += 1
            return new

        out = re.sub(r"<img\b[^>]*>", fix, t)
        if out != t:
            open(p, "w", encoding="utf8", newline="").write(out)
            print("updated", d, f)
print(changed, "img tags updated")
