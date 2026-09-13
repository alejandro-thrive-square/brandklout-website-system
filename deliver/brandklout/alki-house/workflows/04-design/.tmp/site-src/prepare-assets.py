"""Turns the raw graphic resources into what the site loads.

  03-graphic-resources/.tmp/scenes/ai/*.jpg      -> assets/scenes/<name>.webp   (max 2400 wide)
  03-graphic-resources/.tmp/scenes/stock/*.jpg   -> assets/scenes/stock-<slug>.webp
  03-graphic-resources/.tmp/scenes/video/*.mp4   -> assets/scenes/<name>.mp4    (copied)
  03-graphic-resources/.tmp/product-images/<slug>/NN.* -> assets/products/<slug>/N.webp

Product photos: a shot on a white or near-white ground is knocked out (flood fill
from the corners, feathered) and set on a square transparent canvas, so it floats
on the site's coffee ground instead of sitting in a white box. A shot with a real
background is kept as a photo and recorded as such in assets/products/index.json
so the card can show it edge to edge.

Idempotent: skips outputs newer than their source. `--force` redoes everything.
Usage: python prepare-assets.py [--force] [--only <slug>]
"""
import json, os, shutil, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

HERE = Path(__file__).resolve().parent
GR = HERE.parents[2] / '03-graphic-resources' / '.tmp'
SCENES = GR / 'scenes'
PRODUCTS = GR / 'product-images'
OUT_SCENES = HERE / 'assets' / 'scenes'
OUT_PRODUCTS = HERE / 'assets' / 'products'
FORCE = '--force' in sys.argv
ONLY = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
# --shard i/n processes every n-th product folder and writes index.<i>.json; --merge folds the shards.
SHARD = tuple(int(x) for x in sys.argv[sys.argv.index('--shard') + 1].split('/')) if '--shard' in sys.argv else None
MERGE = '--merge' in sys.argv
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
    mask = ImageChops.invert(ground_mask)
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    out.putalpha(mask)
    return out


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


def products():
    if not PRODUCTS.exists():
        print('products: no harvest yet')
        return
    index_path = OUT_PRODUCTS / (f'index.{SHARD[0]}.json' if SHARD else 'index.json')
    main_index = OUT_PRODUCTS / 'index.json'
    index = json.loads(main_index.read_text(encoding='utf8')) if main_index.exists() else {}
    if SHARD and index_path.exists():
        index.update(json.loads(index_path.read_text(encoding='utf8')))
    n = 0
    folders = sorted(p for p in PRODUCTS.iterdir() if p.is_dir())
    for k, folder in enumerate(folders):
        slug = folder.name
        if ONLY and slug != ONLY:
            continue
        if SHARD and k % SHARD[1] != SHARD[0]:
            continue
        shots = sorted(f for f in folder.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'))
        if not shots:
            continue
        entries = []
        for i, src in enumerate(shots, 1):
            dst = OUT_PRODUCTS / slug / f'{i}.webp'
            prev = next((e for e in index.get(slug, []) if e['file'] == dst.name), None)
            if fresh(src, dst) and prev:
                entries.append(prev)
                continue
            try:
                im = ImageOps.exif_transpose(Image.open(src))
                # Flood-filling a 7000 px image takes a minute; nothing above 1600 px survives anyway.
                if max(im.size) > 1600:
                    im.thumbnail((1600, 1600), Image.LANCZOS)
            except Exception as e:  # noqa
                print(f'  skip {src}: {e}')
                continue
            cut = knockout(im)
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
        # cut-outs first: the card wants the cleanest shot on top
        entries.sort(key=lambda e: (not e['cutout'], e['file']))
        index[slug] = entries
    OUT_PRODUCTS.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, indent=1), encoding='utf8')
    print(f'products: {n} written, {len(index)} slugs indexed -> {index_path.name}')


def merge():
    main = OUT_PRODUCTS / 'index.json'
    index = json.loads(main.read_text(encoding='utf8')) if main.exists() else {}
    for f in sorted(OUT_PRODUCTS.glob('index.*.json')):
        index.update(json.loads(f.read_text(encoding='utf8')))
        f.unlink()
    # Keep only slugs whose folder still exists.
    index = {k: v for k, v in index.items() if (OUT_PRODUCTS / k).is_dir()}
    main.write_text(json.dumps(dict(sorted(index.items())), indent=1), encoding='utf8')
    print(f'merged: {len(index)} slugs')


if __name__ == '__main__':
    if MERGE:
        merge()
    elif SHARD:
        products()
    else:
        scenes()
        products()
