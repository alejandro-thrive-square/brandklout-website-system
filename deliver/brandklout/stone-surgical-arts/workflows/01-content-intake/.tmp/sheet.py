# Contact sheet for the client's Drive export.
#
# WHY: filenames in this export do not reliably describe their contents, and a
# treatment page is not a place to discover that. Every candidate gets looked at
# on a labelled grid before it is placed. Same rule the generated imagery has
# (see 04-design/.tmp/surgical-arts/site-src/generate-images.mjs).
#
# usage: python sheet.py <out.png> <path-prefix> [<path-prefix> ...]
import os, sys
from PIL import Image, ImageDraw

ROOT = 'google-drive-images'
out = sys.argv[1]
want = tuple(sys.argv[2:])

paths = []
for r, d, fs in os.walk(ROOT):
    rel = os.path.relpath(r, ROOT).replace(os.sep, '/')
    if not any(rel.startswith(w) for w in want):
        continue
    for f in sorted(fs):
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            paths.append((rel + '/' + f, os.path.join(r, f)))
paths.sort()

if not paths:
    sys.exit(f'no images under {want}')

COLS, TW, TH = 6, 320, 180
rows = (len(paths) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * TW, rows * (TH + 16)), (250, 249, 246))
dr = ImageDraw.Draw(sheet)
for i, (rel, p) in enumerate(paths):
    try:
        im = Image.open(p).convert('RGB')
    except Exception:
        continue
    im.thumbnail((TW - 8, TH - 8))
    x, y = (i % COLS) * TW, (i // COLS) * (TH + 16)
    sheet.paste(im, (x + 4, y + 4))
    dr.text((x + 4, y + TH + 2), f'{i:02d} {rel.split("/")[-1][:34]}', fill=(20, 20, 20))
sheet.save(out)

print(f'{len(paths)} images -> {out}  {sheet.width}x{sheet.height}')
for i, (rel, p) in enumerate(paths):
    im = Image.open(p)
    print(f'{i:02d}  {im.width}x{im.height}\t{rel}')
