# Client script, 2026-10-09. Cuts a full-page capture into half-size strips for reading by eye.
# Usage (from the step's output/ folder): python code/strips.py <png> <out-prefix> [strip height px]
import sys
from PIL import Image
im = Image.open(sys.argv[1]); h = int(sys.argv[3]) if len(sys.argv) > 3 else 2600
scale = 0.5 if im.width > 800 else 1.0
n = -(-im.height // h)
for i in range(n):
    c = im.crop((0, i * h, im.width, min(im.height, (i + 1) * h)))
    if scale != 1: c = c.resize((int(c.width * scale), int(c.height * scale)))
    c.save(f"{sys.argv[2]}-{i}.png")
print(n)
