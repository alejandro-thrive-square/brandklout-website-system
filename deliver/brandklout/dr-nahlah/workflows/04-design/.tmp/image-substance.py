"""image-substance.py — find images that render as nothing.

Written after `xray.png` shipped into seven cards looking like an empty box. It
is a 2000x1000 palette PNG whose opaque fraction is 0.00: every pixel is
transparent or near it. Composited onto the cream card ground it is within a few
units of the background, so the card reads as broken rather than as a picture.

A missing file 404s and the site test catches it. A file that loads and shows
nothing passes every gate we have, because "no broken images" only checks that
the bytes arrived. So check the pixels:

  - opaque fraction: how much of the image is actually drawn
  - contrast against the ground it will sit on, as the standard deviation of the
    composite; a near-uniform composite means the image is invisible

Grounds come from the tokens: --bg-3 #F5F2E9 for `.pk-card-fig-pad` and
`.mz-plain`, --mist #F0EDE6 for the default figure box.

  python image-substance.py [assets-dir]
"""
import io, os, sys, glob, re, json
from PIL import Image, ImageStat
import warnings
warnings.filterwarnings('ignore')

SITE = sys.argv[1] if len(sys.argv) > 1 else 'final-site'
ASSETS = os.path.join(SITE, 'assets')
GROUNDS = {'pad': (245, 242, 233), 'plain': (245, 242, 233), 'cover': (240, 237, 230)}

# which images are used where, and on which ground
used = {}
for page in sorted(glob.glob(os.path.join(SITE, '*.html'))):
    html = io.open(page, encoding='utf-8').read()
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    for m in re.finditer(r'<(?:div|figure)[^>]*class="([^"]*(?:pk-card-fig|mz-fig)[^"]*)"[^>]*>\s*<img[^>]+src="(assets/[^"]+)"', html):
        cls, src = m.group(1), m.group(2)
        ground = 'pad' if ('pk-card-fig-pad' in cls or 'mz-plain' in cls) else 'cover'
        used.setdefault(src, set()).add((os.path.basename(page), ground))

print(f'{len(used)} images sit in a card/mosaic figure across the site\n')
bad = []
for src in sorted(used):
    path = os.path.join(SITE, src)
    if not os.path.exists(path):
        bad.append((src, 'MISSING', 0, 0)); continue
    try:
        im = Image.open(path)
    except Exception as e:
        bad.append((src, f'UNREADABLE {e}', 0, 0)); continue
    rgba = im.convert('RGBA')
    alpha = rgba.getchannel('A')
    n = rgba.width * rgba.height
    opaque = sum(1 for p in alpha.getdata() if p > 200) / n
    worst = None
    for _, ground in used[src]:
        bg = Image.new('RGBA', rgba.size, GROUNDS[ground] + (255,))
        comp = Image.alpha_composite(bg, rgba).convert('RGB')
        sd = min(ImageStat.Stat(comp).stddev)
        worst = sd if worst is None else min(worst, sd)
    # A photograph lands well above 20. Under 12 is a flat wash.
    if opaque < 0.05 or worst < 12:
        bad.append((src, 'BLANK/FLAT', opaque, worst))

if not bad:
    print('every figure image has substance')
else:
    print(f'{len(bad)} problem images:')
    for src, why, opaque, sd in bad:
        pages = sorted({p for p, _ in used.get(src, [])})
        print(f'  {src}\n     {why}  opaque={opaque:.2f} contrast_sd={sd:.1f}')
        print(f'     used on: {", ".join(pages)}')
    json.dump([b[0] for b in bad], io.open('blank-images.json', 'w', encoding='utf-8'), indent=1)
    sys.exit(1)
