# Client script, 2026-10-09. Cuts every image the inner pages use, from code/images.json, into
# site-src/media/img, and appends their rows to the ledger (output/images.csv) after the home page's
# (code/prep-images.py writes those and runs first: it empties the folder).
#
# A manifest row:
#   "out":    target file in media/img (a re-cut image gets a NEW name: Instatic skips by basename)
#   "from":   drive/<sub>/<file> | old/<file in the old-site capture's wf/> | film/<vimeo id>@<seconds>
#             | copy/<file already in media/img> | asset/<file under output/assets/> (legacy/ holds the
#             home page's three hand-cut files of 2026-10-01: logo-stacked, doctor-face, hero-poster)
#   "size":   [w, h] shipped; the source is cropped to that aspect around "focus" [x, y] (0..1) after
#             an optional "box" [l, t, r, b] (fractions) narrows it first
#   "head":   a portrait cut-out (RGBA): ignore "focus"; find the hair line and the head's centre in the
#             transparency and cut so the head is centred left to right with "headroom" (default 0.14
#             of the height) above the hair, extending the plain ground upwards where the source has
#             no room. The face gate (code/face-gate.mjs) then proves no frame or motion cuts it.
#   "shows", "pages", "source", "licence", "fit": the ledger columns (IMAGES.md section 4)
# Film frames come from the 1080p Vimeo downloads (code/vimeo-folder.mjs --download <dir>); pass that
# dir as FILMS=<dir> or the first argument.
"""Usage (from the step's output/ folder): python code/prep-images.py && python code/cut-images.py <films dir>"""

from __future__ import annotations

import csv
import json
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps

OUT = Path(__file__).resolve().parents[1]
DRIVE = OUT / "assets" / "drive"
OLD = OUT.parents[2] / "scenario-1-migration" / "01-old-site-capture" / "output" / "assets" / "downloads" / "wf"
DEST = OUT / "code" / "site-src" / "media" / "img"
FILMS = Path(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("FILMS", ""))
CACHE = OUT / "assets" / "frames"


def source(spec: str) -> Image.Image:
    kind, _, rest = spec.partition("/")
    if kind == "drive":
        return Image.open(DRIVE / rest)
    if kind == "old":
        return Image.open(OLD / rest)
    if kind == "copy":
        return Image.open(DEST / rest)
    if kind == "asset":
        return Image.open(OUT / "assets" / rest)
    if kind == "stock":
        return Image.open(OUT / "assets" / "stock" / rest)
    if kind == "film":
        vid, _, sec = rest.partition("@")
        CACHE.mkdir(parents=True, exist_ok=True)
        frame = CACHE / f"{vid}_{float(sec):06.2f}.png"
        if not frame.exists():
            src = FILMS / f"{vid}.mp4"
            if not src.exists():
                raise SystemExit(f"no film {src}: run code/vimeo-folder.mjs --download <dir> and pass the dir")
            subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", str(sec), "-i", str(src), "-frames:v", "1", str(frame)], check=True)
        return Image.open(frame)
    raise SystemExit(f"unknown source kind: {spec}")


def head_cut(im: Image.Image, size, headroom: float, bg: str) -> Image.Image:
    """A cut-out portrait, the head centred left to right and `headroom` of the height above the hair."""
    im = im.convert("RGBA")
    alpha = im.split()[-1].point(lambda a: 255 if a > 96 else 0)
    l, top, r, b = alpha.getbbox()
    # the head's centre: the opaque span of the rows just under the hair line
    band = alpha.crop((0, top, im.width, min(im.height, top + max(8, round(im.height * 0.08)))))
    hl, _, hr, _ = band.getbbox()
    cx = (hl + hr) / 2
    tw, th = size
    want = tw / th
    # the tallest window that keeps the hair at `headroom` and ends at the bottom of the source
    ch = min(im.width / want, (im.height - top) / (1 - headroom))
    cw = ch * want
    y = top - headroom * ch
    x = min(max(0, cx - cw / 2), im.width - cw)
    pad = max(0, round(-y))
    canvas = Image.new("RGBA", (im.width, im.height + pad), bg)
    canvas.alpha_composite(im, (0, pad))
    y += pad
    out = canvas.crop((round(x), round(y), round(x + cw), round(y + ch))).convert("RGB")
    return out.resize((tw, th), Image.LANCZOS) if out.width > tw else out


def cut(im: Image.Image, size, focus, box, bg="#e7e8df") -> Image.Image:
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        # a cut-out (the doctors' portraits) sits on the portrait ground the page gives it; converting
        # straight to RGB would paint every transparent pixel black and harden the edges
        im = im.convert("RGBA")
        ground = Image.new("RGBA", im.size, bg)
        im = Image.alpha_composite(ground, im)
    im = im.convert("RGB")
    if box:
        l, t, r, b = box
        im = im.crop((round(l * im.width), round(t * im.height), round(r * im.width), round(b * im.height)))
    tw, th = size
    want = tw / th
    have = im.width / im.height
    fx, fy = focus or (0.5, 0.5)
    if have > want:
        cw, ch = round(im.height * want), im.height
    else:
        cw, ch = im.width, round(im.width / want)
    x = min(max(0, round(fx * im.width - cw / 2)), im.width - cw)
    y = min(max(0, round(fy * im.height - ch / 2)), im.height - ch)
    im = im.crop((x, y, x + cw, y + ch))
    if im.width > tw:
        im = im.resize((tw, th), Image.LANCZOS)
    return im


def main() -> None:
    rows = json.loads((OUT / "code" / "images.json").read_text(encoding="utf-8"))
    ledger = OUT / "images.csv"
    seen = set()
    out_rows = []
    for r in rows:
        if r["out"] in seen:
            raise SystemExit(f"duplicate target {r['out']}")
        seen.add(r["out"])
        target = DEST / r["out"]
        spec = r["from"]
        if spec.startswith("old/") and spec.lower().endswith(".svg"):
            target.write_bytes((OLD / spec[4:]).read_bytes())
            px = "vector"
        elif r.get("asis"):
            im = ImageOps.exif_transpose(source(spec))
            im.thumbnail(tuple(r["size"]), Image.LANCZOS)
            im.save(target, quality=r.get("q", 86)) if target.suffix != ".png" else im.save(target)
            px = f"{im.width}x{im.height}"
        elif r.get("head"):
            im = head_cut(ImageOps.exif_transpose(source(spec)), r["size"], r.get("headroom", 0.14), r.get("bg", "#e7e8df"))
            im.save(target, quality=r.get("q", 84), method=6)
            px = f"{im.width}x{im.height}"
        else:
            im = cut(source(spec), r["size"], r.get("focus"), r.get("box"), r.get("bg", "#e7e8df"))
            im.save(target, quality=r.get("q", 84), method=6)
            px = f"{im.width}x{im.height}"
        kb = round(target.stat().st_size / 1024)
        out_rows.append([r["out"], r.get("source", spec.split("/")[0]), spec, r.get("licence", "client's own"), r.get("pages", ""), r.get("fit", 3), px, kb, r.get("shows", "")])
        print(f"{r['out']:<34} {px:>10} {kb:>5} KB  {spec}")
    with ledger.open("a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(out_rows)
    print(f"{len(out_rows)} image(s) cut; ledger {ledger.name} appended")


if __name__ == "__main__":
    main()
