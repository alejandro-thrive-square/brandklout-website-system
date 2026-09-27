"""Download chosen Freepik stock at full resolution and resize it for the web.

    python fetch.py picks.json

picks.json: [{"key": "implant-cost-hero", "id": 12345678}]
Writes media/img/stock-<key>.jpg (max 2400px wide, JPEG q82, sRGB), and appends id, key and size to
stock-ledger.json so every licensed asset the site uses can be traced to its Freepik id.
"""
import io, json, os, sys, urllib.request
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *(['..'] * 7)))
IMG = os.path.abspath(os.path.join(HERE, '..', '..', '..', '04-design', '.tmp', 'site-src', 'media', 'img'))
env = {}
for line in open(os.path.join(ROOT, '.env'), encoding='utf8'):
    if '=' in line and not line.lstrip().startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"\'')
KEY = env['MAGNIFIC']

def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

ledger_path = os.path.join(HERE, 'stock-ledger.json')
ledger = json.load(open(ledger_path, encoding='utf8')) if os.path.exists(ledger_path) else []
for p in json.load(open(sys.argv[1], encoding='utf8')):
    name = f"stock-{p['key']}.jpg"
    dst = os.path.join(IMG, name)
    if os.path.exists(dst):
        print('skip (exists)', name); continue
    for attempt in range(3):
        try:
            meta = json.loads(get(f"https://api.freepik.com/v1/resources/{p['id']}/download", {'x-freepik-api-key': KEY}))
            url = meta['data'].get('url') or meta['data'].get('signed_url')
            im = Image.open(io.BytesIO(get(url)))
            break
        except Exception as e:
            print('retry', p['key'], e)
    else:
        raise SystemExit('failed ' + p['key'])
    im = ImageOps.exif_transpose(im).convert('RGB')
    w, h = im.size
    if w > 2400:
        im = im.resize((2400, round(h * 2400 / w)), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)
    ledger.append({'key': p['key'], 'id': p['id'], 'file': name, 'source': [w, h], 'saved': list(im.size)})
    print('ok', name, (w, h), '->', im.size)
    json.dump(ledger, open(ledger_path, 'w', encoding='utf8', newline=''), indent=1)  # after every file: a crash must not lose the record
json.dump(ledger, open(ledger_path, 'w', encoding='utf8', newline=''), indent=1)
