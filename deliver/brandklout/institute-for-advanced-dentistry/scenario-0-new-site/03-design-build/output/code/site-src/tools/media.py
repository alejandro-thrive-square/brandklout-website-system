"""
media.py — cut every photograph the pages ask for, from the practice's own library, into site-src/media/img/.

  in:  data/media/*.json   one spec per page group, merged (parallel builders never share a file):
                            { "<out name>.jpg": { "src": "<library id>" | "path:<relative to the client folder>",
                                                  "w": 1600, "crop": [x0, y0, x1, y1] (fractions, optional),
                                                  "note": "what it shows (for the ledger)" } }
       ../../library/library.json   (library id -> source file; see library/make-library.py)
  out: media/img/<out name>       JPEG q82 progressive, never upscaled
       ../../images.csv           the ledger IMAGES.md asks for: out name, source file, size, note

Refuses (exit 1) when:
  - a source original feeds more than TWO output files (IMAGES.md: a photo on at most two pages; a second cut
    of the same frame counts as the same photo). The home's cuts are listed in HOME below and count too.
  - a library id or path does not exist.
Re-running skips files already cut unless the entry changed (the spec is stored next to the ledger).
A RE-CUT needs a NEW out name: Instatic's media upload skips by basename.

Usage: python tools/media.py                       every spec; rewrites the ledger   (from site-src)
       python tools/media.py data/media/x.json    cut only that spec's files (the reuse check still reads all)
"""
import csv, hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(__file__).resolve().parents[1]
CLIENT = SRC.parents[4]
LIB = json.loads((SRC.parents[1] / 'library/library.json').read_text(encoding='utf-8'))
SPEC, OWNER = {}, {}
for f in sorted((SRC / 'data/media').glob('*.json')):
    for k, v in json.loads(f.read_text(encoding='utf-8')).items():
        if k in SPEC:
            raise SystemExit(f'{k} is named in both {OWNER[k]} and {f.name}')
        SPEC[k], OWNER[k] = v, f.name
ONLY = Path(sys.argv[1]).name if len(sys.argv) > 1 else None
STATE_D = SRC.parents[1] / 'images.state'
STATE_D.mkdir(exist_ok=True)
states = {f.stem: json.loads(f.read_text(encoding='utf-8')) for f in STATE_D.glob('*.json')}
OUT = SRC / 'media/img'

# The approved home's cuts (workflows/04-design/.tmp/prototypes/build-media.py), by original.
W = 'workflows/03-graphic-resources/.tmp/drive/web/'
HOME = {W + f'{g}/Bensoussan_Photos-{n}.jpg' for g, n in [
    ('interactions', 47), ('interactions', 81), ('dr-portrait', 165), ('dr-portrait', 174), ('interactions', 43),
    ('interactions', 39), ('technology', 27), ('interactions', 92), ('interactions', 87), ('interactions', 141),
    ('pt-helen', 32), ('pt-mark', 57), ('pt-lisa', 105), ('pt-philip', 119), ('office', 196), ('office', 191), ('office', 198)]}
HOME |= {W + 'case-lori/DSC_4232.jpg', W + 'case-lori/DSC_3795.jpg', W + 'case-lori/DSC_4225.jpg'}

def resolve(src):
    if src.startswith('path:'):
        return src[5:]
    if src not in LIB:
        raise SystemExit(f'unknown library id {src}')
    return LIB[src]['src']

problems, uses = [], {}
for f in HOME:
    uses.setdefault(f, []).append('(home)')
rows = []
for name, e in sorted(SPEC.items()):
    rel = resolve(e['src'])
    uses.setdefault(rel, []).append(name)
    p = CLIENT / rel
    if not p.exists():
        problems.append(f'{name}: {rel} is not on disk')
        continue
    key = hashlib.sha1(json.dumps(e, sort_keys=True).encode()).hexdigest()[:12]
    out = OUT / name
    group = OWNER[name].replace('.json', '')
    if ONLY and OWNER[name] != ONLY:
        if out.exists():
            with Image.open(out) as im:
                rows.append([name, rel, f'{im.width}x{im.height}', e.get('note', '')])
        continue
    state = states.setdefault(group, {})
    if not (out.exists() and state.get(name) == key):
        with Image.open(p) as im:
            im = ImageOps.exif_transpose(im).convert('RGB')
            if e.get('crop'):
                x0, y0, x1, y1 = e['crop']
                im = im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))
            w = min(int(e.get('w', 1600)), im.width)
            if w < im.width:
                im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            im.save(out, 'JPEG', quality=82, progressive=True, optimize=True)
        state[name] = key
        print('cut ', name, '<-', rel)
    with Image.open(out) as im:
        rows.append([name, rel, f'{im.width}x{im.height}', e.get('note', '')])

for rel, names in uses.items():
    if len(names) > 2:
        problems.append(f'{rel} feeds {len(names)} outputs ({", ".join(names)}); at most two')

for g, st in states.items():
    if not ONLY or g + '.json' == ONLY:
        (STATE_D / f'{g}.json').write_text(json.dumps(st, indent=1) + '\n', encoding='utf-8')
if not ONLY:
    with open(SRC.parents[1] / 'images.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['file', 'source', 'size', 'shows'])
        w.writerows(rows)
print(f'{len(rows)} images in the ledger')
if problems:
    print('\n'.join(['PROBLEMS:'] + problems), file=sys.stderr)
    sys.exit(1)
