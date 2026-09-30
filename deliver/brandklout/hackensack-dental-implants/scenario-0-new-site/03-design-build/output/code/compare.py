# Client script. Side-by-side strips of the chosen concept (left) and the build (right), both full
# page at the same width, so section-by-section differences can be read off.
# Usage (from the step's output/ folder): python code/compare.py [width] -> look/compare-<width>/NN.jpg
import sys
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
w = int(sys.argv[1]) if len(sys.argv) > 1 else 1440
ref = Image.open(f"assets/reference/concept-04/{w}-full.png").convert("RGB")
own = Image.open(f"look/{w}-full/full.png").convert("RGB")
out = Path(f"look/compare-{w}")
out.mkdir(parents=True, exist_ok=True)
scale = 0.66 if w > 700 else 1.0
seg = 1900 if w > 700 else 2400
cw = int(w * scale)
n = 0
for top in range(0, max(ref.size[1], own.size[1]), seg):
    sheet = Image.new("RGB", (cw * 2 + 30, int(seg * scale) + 10), (200, 40, 40))
    for k, im in enumerate((ref, own)):
        bottom = min(im.size[1], top + seg)
        if bottom <= top:
            continue
        part = im.crop((0, top, w, bottom))
        sheet.paste(part.resize((cw, int(part.size[1] * scale))), (10 + k * (cw + 10), 5))
    sheet.save(out / f"{n:02d}.jpg", quality=82)
    n += 1
print(f"concept {ref.size[1]}px, build {own.size[1]}px, {n} strips in {out}")
