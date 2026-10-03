"""
make-library.py — index every photo the practice has given us, and draw labelled contact sheets so a page
builder chooses a photo by LOOKING at it (IMAGES.md: every photo shows what its heading says).

Sources (all local, gitignored, rebuilt from Drive with scripts/drive.mjs thumbs; see the client RUNBOOK):
  shoot     workflows/03-graphic-resources/.tmp/drive/web/<group>/        the 2025 photoshoot (Drive > Website Content)
  office    workflows/03-graphic-resources/.tmp/drive/photos/Office Photos, Additional Website Photos
  cases     workflows/03-graphic-resources/.tmp/drive/gallery/<treatment>/<patient (procedure)>/   before/after cases
  oldsite   workflows/01-content-intake/.tmp/current-site-scrape/media-library/   the WordPress library (stock, diagrams, logos)

Out (next to this file):
  library.json            id -> {src, group, w, h}          (committed)
  sheets/<group>-NN.jpg   6 x 5 grid, each tile labelled with its id   (gitignored)

Usage: python make-library.py
"""
import json, os, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
CLIENT = HERE.parents[3]  # .../institute-for-advanced-dentistry
DRIVE = CLIENT / 'workflows/03-graphic-resources/.tmp/drive'
OLD = CLIENT / 'workflows/01-content-intake/.tmp/current-site-scrape/media-library'
EXT = re.compile(r'\.(jpe?g|png|webp)$', re.I)

groups = []  # (group name, [files])
for d in sorted((DRIVE / 'web').iterdir()):
    if d.is_dir():
        groups.append(('shoot-' + d.name, sorted(p for p in d.iterdir() if EXT.search(p.name))))
for name, sub in (('office', 'Office Photos'), ('extra', 'Additional Website Photos')):
    d = DRIVE / 'photos' / sub
    if d.is_dir():
        groups.append((name, sorted(p for p in d.iterdir() if EXT.search(p.name))))
for tdir in sorted((DRIVE / 'gallery').iterdir()):
    if not tdir.is_dir():
        continue
    files = []
    for case in sorted(tdir.iterdir()):
        if case.is_dir():
            files += sorted(p for p in case.iterdir() if EXT.search(p.name))
    slug = re.sub(r'[^a-z0-9]+', '-', tdir.name.lower()).strip('-')
    groups.append(('case-' + slug, files))
groups.append(('oldsite', sorted(p for p in OLD.iterdir() if EXT.search(p.name) and not p.name.lower().endswith('.svg'))))

lib = {}
(HERE / 'sheets').mkdir(exist_ok=True)
try:
    font = ImageFont.truetype('arial.ttf', 15)
except OSError:
    font = ImageFont.load_default()
TW, TH, COLS, ROWS = 300, 225, 6, 5
for gname, files in groups:
    ids = []
    for i, p in enumerate(files):
        gid = f'{gname}/{i:03d}'
        try:
            with Image.open(p) as im:
                w, h = im.size
        except Exception as e:
            print('skip', p, e, file=sys.stderr)
            continue
        rel = os.path.relpath(p, CLIENT).replace('\\', '/')
        lib[gid] = {'src': rel, 'group': gname, 'w': w, 'h': h}
        ids.append((gid, p, w, h))
    per = COLS * ROWS
    for s in range(0, len(ids), per):
        chunk = ids[s:s + per]
        sheet = Image.new('RGB', (COLS * TW, ((len(chunk) - 1) // COLS + 1) * (TH + 22)), 'white')
        dr = ImageDraw.Draw(sheet)
        for k, (gid, p, w, h) in enumerate(chunk):
            x, y = (k % COLS) * TW, (k // COLS) * (TH + 22)
            with Image.open(p) as im:
                im = ImageOps.exif_transpose(im).convert('RGB')
                im.thumbnail((TW - 6, TH - 6))
                sheet.paste(im, (x + (TW - im.width) // 2, y + (TH - im.height) // 2))
            label = f"{gid.split('/')[-1]}  {p.parent.name[:22] if gname.startswith('case-') else p.stem[:26]}  {w}x{h}"
            dr.text((x + 4, y + TH + 2), label, fill='black', font=font)
        out = HERE / 'sheets' / f'{gname}-{s // per:02d}.jpg'
        sheet.save(out, quality=72)
    print(f'{gname:28s} {len(ids):4d}')

(HERE / 'library.json').write_text(json.dumps(lib, indent=1) + '\n', encoding='utf-8', newline='\n')
print('total', len(lib))
