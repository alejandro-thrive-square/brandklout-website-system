# Side-by-side strips: an approved capture (left) against the current build (right).
# Usage: python code/ab.py <before.png> <after.png> <out-prefix> [parts]
import sys
from PIL import Image
a = Image.open(sys.argv[1]).convert('RGB'); b = Image.open(sys.argv[2]).convert('RGB')
out = sys.argv[3]; n = int(sys.argv[4]) if len(sys.argv) > 4 else 6
h = max(a.height, b.height); step = -(-h // n)
scale = 0.5 if a.width > 800 else 1.0
for i in range(n):
    y0, y1 = i * step, min(h, (i + 1) * step)
    ca = a.crop((0, y0, a.width, y1)); cb = b.crop((0, y0, b.width, y1))
    im = Image.new('RGB', (a.width + b.width + 20, y1 - y0), (255, 0, 120))
    im.paste(ca, (0, 0)); im.paste(cb, (a.width + 20, 0))
    if scale != 1: im = im.resize((int(im.width * scale), int(im.height * scale)))
    im.save(f'{out}-{i}.png')
print('ok', n)
