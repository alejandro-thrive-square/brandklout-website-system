"""Turns the raw graphic resources into what the site loads.

  03-graphic-resources/.tmp/scenes/ai/*.jpg      -> assets/scenes/<name>.webp   (max 2400 wide)
  03-graphic-resources/.tmp/scenes/stock/*.jpg   -> assets/scenes/stock-<slug>.webp
  03-graphic-resources/.tmp/scenes/video/*.mp4   -> assets/scenes/<name>.mp4    (copied)
  each product's `photos` in data/products.json  -> assets/products/<id>/N.webp

Product photos are the client's own, from the WhatsApp catalogue (since
2026-10-09; the harvested shots in 03-graphic-resources/.tmp/product-images/ are
no longer read). products.json lists them relative to its `photoRoot`.

A shot on a white or near-white ground is knocked out (flood fill from the
corners, feathered) and set on a square transparent canvas, so it floats on the
site's coffee ground instead of sitting in a white box. A shot with a real
background is kept as a photo and recorded as such in assets/products/index.json
so the card can show it edge to edge. So is a shot carrying the client's own
"EN CAMINO" / "AGOTADO" corner ribbon: cut out, the ribbon would float beside the
product like a sticker.

Idempotent: skips a product whose outputs are newer than its photos. `--force`
redoes everything. index.json is rewritten for the current products only.
Usage: python prepare-assets.py [--force] [--only <id>]
"""
import json, os, shutil, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

HERE = Path(__file__).resolve().parent
GR = HERE.parents[2] / '03-graphic-resources' / '.tmp'
SCENES = GR / 'scenes'
CMS = HERE / 'data' / 'products.json'
OUT_SCENES = HERE / 'assets' / 'scenes'
OUT_PRODUCTS = HERE / 'assets' / 'products'
FORCE = '--force' in sys.argv
ONLY = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
Image.MAX_IMAGE_PIXELS = None


def fresh(src: Path, dst: Path) -> bool:
    return not FORCE and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime


def save_webp(im: Image.Image, dst: Path, quality=82):
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=6)


# ---------------------------------------------------------------- scenes
def scenes():
    OUT_SCENES.mkdir(parents=True, exist_ok=True)
    n = 0
    for src in sorted((SCENES / 'ai').glob('*.jpg')):
        if '.rejected' in src.name:
            continue
        dst = OUT_SCENES / (src.stem + '.webp')
        if fresh(src, dst):
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if im.width > 2400:
            im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
        save_webp(im, dst, 80)
        n += 1
    for src in sorted((SCENES / 'stock').glob('*.jpg')):
        stem = src.stem.split('-', 1)[1] if '-' in src.stem else src.stem
        dst = OUT_SCENES / f'stock-{stem}.webp'
        if fresh(src, dst):
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if im.width > 2400:
            im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
        save_webp(im, dst, 78)
        n += 1
    for src in sorted((SCENES / 'video').glob('*.mp4')):
        dst = OUT_SCENES / src.name
        if fresh(src, dst):
            continue
        shutil.copyfile(src, dst)
        n += 1
    print(f'scenes: {n} written')


# -------------------------------------------------------------- products
MAGENTA = (255, 0, 255)


def near_white(px, tol=34):
    return all(c >= 255 - tol for c in px[:3])


def knockout(im: Image.Image, tol=30):
    """Flood the white ground from every near-white corner; return RGBA or None."""
    rgb = im.convert('RGB')
    w, h = rgb.size
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
    seeds = [c for c in corners if near_white(rgb.getpixel(c))]
    if len(seeds) < 5:
        return None
    work = rgb.copy()
    for s in seeds:
        if work.getpixel(s) != MAGENTA:
            ImageDraw.floodfill(work, s, MAGENTA, thresh=tol)
    diff = ImageChops.difference(work, Image.new('RGB', (w, h), MAGENTA)).convert('L')
    mask = diff.point(lambda v: 255 if v > 8 else 0)          # 255 = keep (subject)
    # Did the fill actually reach a meaningful area? (guards against a white-ish subject)
    ground = 1 - (sum(mask.histogram()[255:]) / (w * h))
    if ground < 0.12:
        return None
    # Soft drop shadows on a white ground are light grey, past the flood tolerance, and read as
    # a puddle under the product on the dark site. Grow the ground into adjacent pixels that are
    # near-white AND unsaturated — a white product under studio light has more variation than that.
    # Three tests: unsaturated, not dark, and SMOOTH — a shadow is a soft gradient, a product
    # has an outline, so the growth walks through the shadow and stops at the product's edge.
    r, g, b = rgb.split()
    lo = ImageChops.darker(ImageChops.darker(r, g), b)
    hi = ImageChops.lighter(ImageChops.lighter(r, g), b)
    grey = ImageChops.subtract(hi, lo).point(lambda v: 255 if v < 20 else 0)
    light = lo.point(lambda v: 255 if v > 150 else 0)
    edges = rgb.convert('L').filter(ImageFilter.GaussianBlur(1)).filter(ImageFilter.FIND_EDGES)
    flat = edges.point(lambda v: 255 if v < 10 else 0)
    candidate = ImageChops.multiply(ImageChops.multiply(grey, light), flat)  # 255 where growth is allowed
    # ...and only under the product: a drop shadow lives in the lower part of the subject's box,
    # while a light-grey flat panel (a charging case lid) sits above it and must survive.
    bbox = mask.getbbox() or (0, 0, w, h)
    cutoff = int(bbox[1] + (bbox[3] - bbox[1]) * 0.55)
    below = Image.new('L', (w, h), 0)
    ImageDraw.Draw(below).rectangle([0, cutoff, w, h], fill=255)
    candidate = ImageChops.multiply(candidate, below)
    ground_mask = ImageChops.invert(mask)                        # 255 = ground
    for _ in range(140):
        grown = ImageChops.multiply(ground_mask.filter(ImageFilter.MaxFilter(3)), candidate)
        new = ImageChops.lighter(ground_mask, grown)
        if ImageChops.difference(new, ground_mask).getbbox() is None:
            break
        ground_mask = new
    mask = drop_top_band(ImageChops.invert(ground_mask))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    out.putalpha(mask)
    return out


def drop_top_band(mask: Image.Image, band=0.14):
    """Erase subject pieces that lie entirely in the top band of the shot.

    The client's photos are marketing images with the maker's wordmark ("SmallRig", "K&F CONCEPT",
    "CINEPEER CX100") in the top corner. Cut out, the letters float above the product and their
    white counters show as specks; and they stretch the crop box away from the product. A piece of
    the product itself always reaches below the band."""
    w, h = mask.size
    limit = int(h * band)
    work = mask.point(lambda v: 255 if v > 127 else 0)
    px = work.load()
    for y in range(limit):
        for x in range(w):
            if px[x, y] != 255:
                continue
            ImageDraw.floodfill(work, (x, y), 100)
            region = work.point(lambda v: 255 if v == 100 else 0)
            bottom = region.getbbox()[3]
            work.paste(0 if bottom <= limit else 200, (0, 0), region)
            px = work.load()
    return work.point(lambda v: 255 if v else 0)


def square(im: Image.Image, size=1400, pad=0.07):
    bbox = im.getbbox() if im.mode == 'RGBA' else None
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = int(max(w, h) * (1 + 2 * pad))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im if im.mode == 'RGBA' else None)
    if side > size:
        canvas = canvas.resize((size, size), Image.LANCZOS)
    return canvas


def ribbon(im: Image.Image, status: str) -> bool:
    """The client marks an en-camino or agotado listing with a band across the bottom-right corner.
    The band leaves the corner tip white, so walk the diagonal through it instead."""
    if status == 'disponible':
        return False
    rgb = im.convert('RGB')
    w, h = rgb.size
    return any(not near_white(rgb.getpixel((int(w * t), int(h * t)))) for t in [0.80 + i * 0.01 for i in range(18)])


def products():
    cms = json.loads(CMS.read_text(encoding='utf8'))
    root = (HERE / cms['photoRoot']).resolve()
    main_index = OUT_PRODUCTS / 'index.json'
    old = json.loads(main_index.read_text(encoding='utf8')) if main_index.exists() else {}
    index, n = {}, 0
    for p in cms['products']:
        pid, srcs = p['id'], [root / f for f in p.get('photos', [])]
        srcs = [s for s in srcs if s.exists()]
        if not srcs:
            continue
        out = OUT_PRODUCTS / pid
        done = old.get(pid)
        if (ONLY and pid != ONLY) or (done and len(done) == len(srcs) and all(fresh(s, out / f'{i}.webp') for i, s in enumerate(srcs, 1))):
            if done:
                index[pid] = done
            continue
        # A folder may hold an older product's shots under the same id: start it clean.
        shutil.rmtree(out, ignore_errors=True)
        entries = []
        for i, src in enumerate(srcs, 1):
            dst = out / f'{i}.webp'
            try:
                im = ImageOps.exif_transpose(Image.open(src))
                # Flood-filling a 7000 px image takes a minute; nothing above 1600 px survives anyway.
                if max(im.size) > 1600:
                    im.thumbnail((1600, 1600), Image.LANCZOS)
            except Exception as e:  # noqa
                print(f'  skip {src}: {e}')
                continue
            cut = None if ribbon(im, p['status']) else knockout(im)
            if cut is not None:
                save_webp(square(cut), dst, 84)
                entries.append({'file': dst.name, 'cutout': True})
            else:
                im = im.convert('RGB')
                if max(im.size) > 1400:
                    im.thumbnail((1400, 1400), Image.LANCZOS)
                save_webp(im, dst, 80)
                entries.append({'file': dst.name, 'cutout': False})
            n += 1
        # The client's first photo leads (it is the one they chose for the listing).
        index[pid] = entries
    OUT_PRODUCTS.mkdir(parents=True, exist_ok=True)
    main_index.write_text(json.dumps(index, indent=1), encoding='utf8')
    cut = sum(e['cutout'] for v in index.values() for e in v)
    print(f'products: {n} written, {len(index)} indexed, {cut} of {sum(len(v) for v in index.values())} shots cut out')


if __name__ == '__main__':
    scenes()
    products()
