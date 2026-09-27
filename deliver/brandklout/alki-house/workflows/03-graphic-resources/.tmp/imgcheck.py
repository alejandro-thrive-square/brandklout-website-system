"""Verify downloaded image candidates for harvest-product-images.mjs.

Usage: python imgcheck.py <file> [<file> ...]
Prints one JSON object per line: {path, ok, width, height, format, ext, ahash, whiteCorners, converted, error}
- ahash: 8x8 average hash as 16 hex chars (for near-duplicate detection)
- whiteCorners: true when all four corner samples are near-white or transparent (cut-out product shot)
- converted: when the format is not JPEG/PNG/WEBP the file is re-saved as PNG and the new path is returned
"""
import sys, json, os, warnings
warnings.simplefilter("ignore")
from PIL import Image

EXT = {"JPEG": "jpg", "MPO": "jpg", "PNG": "png", "WEBP": "webp"}


def ahash(im):
    g = im.convert("L").resize((8, 8), Image.LANCZOS)
    px = list(g.getdata())
    avg = sum(px) / 64.0
    bits = 0
    for v in px:
        bits = (bits << 1) | (1 if v >= avg else 0)
    return "%016x" % bits


def white_corners(im):
    rgba = im.convert("RGBA")
    w, h = rgba.size
    inset = 3
    pts = [(inset, inset), (w - 1 - inset, inset), (inset, h - 1 - inset), (w - 1 - inset, h - 1 - inset)]
    for x, y in pts:
        r, g, b, a = rgba.getpixel((x, y))
        if a < 16:
            continue
        if r >= 235 and g >= 235 and b >= 235:
            continue
        return False
    return True


def main():
    for p in sys.argv[1:]:
        out = {"path": p, "ok": False}
        try:
            with Image.open(p) as im:
                im.verify()
            im = Image.open(p)
            im.load()
            fmt = im.format or ""
            w, h = im.size
            out.update({"width": w, "height": h, "format": fmt})
            out["ahash"] = ahash(im)
            out["whiteCorners"] = white_corners(im)
            if fmt in EXT:
                out["ext"] = EXT[fmt]
            else:
                # AVIF / GIF / BMP / TIFF ... -> normalise to PNG
                newp = p + ".png"
                im.convert("RGBA").save(newp, "PNG")
                out["ext"] = "png"
                out["converted"] = newp
            out["ok"] = True
        except Exception as e:  # noqa: BLE001
            out["error"] = str(e)[:200]
        print(json.dumps(out))


if __name__ == "__main__":
    main()
