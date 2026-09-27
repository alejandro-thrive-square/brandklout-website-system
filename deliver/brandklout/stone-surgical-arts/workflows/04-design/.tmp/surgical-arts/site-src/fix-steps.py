"""Removes the video play icon from the upscaled steps photograph AFTER the
upscale, at full resolution.

Patching the 702px source before sending it to Magnific did not work: the
upscaler saw a flat, grain-free patch on her top and invented a fold of
fabric there. So upscale-doctor.mjs now sends the photograph with the icon
still on it (levels lifted, nothing else) and this replaces the crisp 4x
icon with fabric: a per-row gradient from the shadowed fabric on its left to
the lit fabric on its right, plus grain matched to the fabric's own noise.

The grain is SYNTHETIC on purpose. The first version of this file sampled
grain from "just below" the icon, which is where her hand is, and the
high-passed fingers were the "fold of fabric" that took an hour to explain.

Input : assets/_upscaled/dr-stone-steps.png    the raw 4x
Output: assets/_upscaled/dr-stone-steps.fixed.png, and assets/dr-stone-steps.webp
        at 2000x1333 (3:2, centre crop), the same emit as upscale-doctor.mjs.
"""
import os
import random
from PIL import Image, ImageDraw, ImageFilter, ImageStat

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "assets", "_upscaled", "dr-stone-steps.png")
im = Image.open(RAW).convert("RGB")
W, H = im.size
# source-to-raw scale. 702 was the Drive export's width; the source in use
# since 2026-09-04 is the asset restored from the published site, 646x431, the
# same frame with 28px off each side, so every x below is 28 less than it was
# and the scale is against 646. Measured on the 4x: the white triangle's dense
# pixels run x 1253..1353, y 763..943, which is 315..340 x 192..237 here.
s = W / 646
px = im.load()


def avg(xs, ys):
    cs = [px[x, y] for x in xs for y in ys]
    return tuple(sum(c[k] for c in cs) / len(cs) for k in range(3))


def patch(rect, seed=7):
    x0, y0, x1, y1 = [round(v * s) for v in rect]
    pw, ph = x1 - x0, y1 - y0
    band = round(8 * s)
    fill = Image.new("RGB", (pw, ph))
    fp = fill.load()
    for j in range(ph):
        y = y0 + j
        rows = range(max(0, y - 3), min(H, y + 4))
        l = avg(range(x0 - band - 4, x0 - 4), rows)
        # the embroidered name sits right of the icon on source rows 208..232;
        # borrow the plain fabric from under it for those rows
        yy = y if not (208 * s <= y <= 233 * s) else round(238 * s) + (j % 12)
        r = avg(range(x1 + 4, x1 + band + 4), range(max(0, yy - 3), min(H, yy + 4)))
        for i in range(pw):
            t = i / (pw - 1)
            fp[i, j] = tuple(round(l[k] * (1 - t) + r[k] * t) for k in range(3))
    # grain matched to the plain fabric left of the icon
    ref = im.crop((x0 - band - 4, y0, x0 - 4, y1))
    sigma = max(1.0, sum(ImageStat.Stat(ref.filter(ImageFilter.GaussianBlur(0)) ).stddev) / 3 * 0.5)
    rnd = random.Random(seed)
    for j in range(ph):
        for i in range(pw):
            n = rnd.gauss(0, sigma)
            c = fp[i, j]
            fp[i, j] = tuple(max(0, min(255, round(c[k] + n))) for k in range(3))
    fill = fill.filter(ImageFilter.GaussianBlur(0.6))
    mask = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mask).rounded_rectangle((3, 3, pw - 4, ph - 4), radius=round(5 * s), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(4))
    im.paste(fill, (x0, y0), mask)


# the white triangle spans source x 315..340, y 192..237 (was 343..365 in the 702px export)
patch((311, 187, 344, 242))
im.save(RAW.replace(".png", ".fixed.png"))

# emit, exactly as upscale-doctor.mjs does: 3:2 centre crop, 2000 wide
aspect = 3 / 2
w, h = im.size
if w / h > aspect:
    nw = round(h * aspect); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
else:
    nh = round(w / aspect); top = (h - nh) // 2; im = im.crop((0, top, w, top + nh))
im = im.resize((2000, round(im.height * 2000 / im.width)), Image.LANCZOS)
im.save(os.path.join(HERE, "assets", "dr-stone-steps.webp"), "WEBP", quality=84, method=6)
im.crop((800, 450, 1400, 1050)).save(os.path.join(HERE, "assets", "_upscaled", "_crop-dr-stone-steps.png"))
print(im.size)
