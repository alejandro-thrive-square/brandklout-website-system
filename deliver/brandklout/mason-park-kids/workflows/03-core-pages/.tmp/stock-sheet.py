"""One contact sheet of everything in _stock/, so the pool is judged by eye.

    python stock-sheet.py

A stock frame that nobody looked at is how a cold blue instrument tray ends up
in a warm sage design, or a clinical shot ends up on a page that must not carry
one. Six across, the key printed under each.
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
STOCK = os.path.join(HERE, "_stock")
OUT = os.path.join(STOCK, "_sheet.png")

CELL_W, CELL_H, PAD, LABEL = 320, 240, 10, 22
files = sorted(f for f in os.listdir(STOCK) if f.lower().endswith((".jpg", ".jpeg", ".png")) and not f.startswith("_"))
cols = 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (CELL_W + PAD) + PAD, rows * (CELL_H + LABEL + PAD) + PAD), (245, 245, 243))
draw = ImageDraw.Draw(sheet)

for i, f in enumerate(files):
    im = Image.open(os.path.join(STOCK, f)).convert("RGB")
    im.thumbnail((CELL_W, CELL_H), Image.LANCZOS)
    x = PAD + (i % cols) * (CELL_W + PAD)
    y = PAD + (i // cols) * (CELL_H + LABEL + PAD)
    sheet.paste(im, (x + (CELL_W - im.width) // 2, y + (CELL_H - im.height) // 2))
    w, h = Image.open(os.path.join(STOCK, f)).size
    draw.text((x + 2, y + CELL_H + 4), f"{os.path.splitext(f)[0]}  {w}x{h}", fill=(40, 46, 50))

sheet.save(OUT)
print(f"{len(files)} frames -> {OUT}")
