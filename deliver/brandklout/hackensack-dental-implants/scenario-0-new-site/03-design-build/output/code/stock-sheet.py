# Client script, 2026-10-09. One contact sheet of the stock previews of one or more slots
# (assets/stock/<slot>/p-<id>.jpg), labelled slot/id, to choose from by eye.
# Usage (from the step's output/ folder): python code/stock-sheet.py <out.jpg> <slot> [<slot> ...]
import sys
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1]
STOCK = OUT / "assets" / "stock"
items = []
for slot in sys.argv[2:]:
    for f in sorted((STOCK / slot).glob("p-*.jpg")):
        items.append((f"{slot}/{f.stem[2:]}", f))
cols, tw, th = 6, 300, 220
rows = -(-len(items) // cols)
sheet = Image.new("RGB", (cols * tw, rows * (th + 18)), "white")
d = ImageDraw.Draw(sheet)
for i, (label, f) in enumerate(items):
    im = Image.open(f).convert("RGB")
    im.thumbnail((tw - 6, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 18)
    sheet.paste(im, (x + (tw - im.width) // 2, y))
    d.text((x + 3, y + th + 3), label, fill="black")
sheet.save(sys.argv[1], quality=80)
print(len(items), "previews")
