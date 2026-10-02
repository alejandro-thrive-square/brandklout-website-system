"""Before/after contact sheet for Magnific upscales (or any AI-touched photo of a real person).

Origin: bk-mason-park-kids, workflows/03-core-pages/output/contact-sheet.py (2026-09-09, caught two staff
portraits "replaced" by other people). Generalized 2026-09-23: pairs come from the same jobs JSON that
upscale-images.mjs reads.

    python contact-sheet.py --jobs upscale-jobs.json [--src-dir DIR] [--up output/_upscaled] [--height 620]

Writes <up>/_review/<key>.png: ORIGINAL on the left (nearest-neighbour to the same height, so its real
pixels stay visible) against the UPSCALE on the right. Every one of these is a real, named person: open
every sheet and compare the face before anything ships. A face that drifted gets "skip": true in the jobs
file with the reason; the page keeps the soft original. Requires Pillow (python -m pip install pillow).
"""
import argparse
import json
import os

from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--jobs", required=True)
ap.add_argument("--src-dir")
ap.add_argument("--up", default=os.path.join("output", "_upscaled"))
ap.add_argument("--height", type=int, default=620)
a = ap.parse_args()

jobs = json.load(open(a.jobs, encoding="utf-8"))
src_dir = os.path.abspath(a.src_dir or os.path.dirname(os.path.abspath(a.jobs)))
up_dir = os.path.abspath(a.up)
review = os.path.join(up_dir, "_review")
os.makedirs(review, exist_ok=True)
H = a.height


def fit(im, resample):
    return im.resize((round(im.width * H / im.height), H), resample)


for job in jobs:
    key = job["key"]
    up_path = os.path.join(up_dir, key + ".png")
    src_path = job["from"] if os.path.isabs(job["from"]) else os.path.join(src_dir, *job["from"].split("/"))
    if not os.path.exists(up_path):
        print(f"{key:16s} no upscale")
        continue
    src = Image.open(src_path).convert("RGB")
    up = Image.open(up_path).convert("RGB")
    left = fit(src, Image.NEAREST)
    right = fit(up, Image.LANCZOS)
    sheet = Image.new("RGB", (left.width + right.width + 12, H), (240, 240, 238))
    sheet.paste(left, (0, 0))
    sheet.paste(right, (left.width + 12, 0))
    out = os.path.join(review, f"{key}.png")
    sheet.save(out)
    print(f"{key:16s} {src.width}x{src.height}  ->  {up.width}x{up.height}   {out}")
