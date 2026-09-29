"""Build home/assets/uploads/ from the practice's own photographs.

    python prep-images.py

Every photograph the eleven core pages use comes from the practice's OWN media
library, recovered over SSH in workflow 01 (the mirror under
01-site-recovery/.tmp/recovered/mirror/wp-content/uploads). Two frames from the
parent practice's folder were tried and dropped: both turned out to be stock,
not the building. Nothing is downloaded, nothing is generated.

Each source is written as webp at a short list of widths, named
`<key>-<width>.webp`, plus `<key>.webp` at the largest width. That is the
whole srcset vocabulary the pages use, so the exporter and the check gate can
find every candidate on disk. The five credential marks and the logo are copied
as they are: they are artwork, not photographs, and re-encoding them softens
the edges.

The pool is deliberately small and named by WHAT THE FRAME SHOWS, so a page
author can pick a picture without opening it, and so a caption is never written
for a picture that does not show what it says. Notes per key:

  team        the whole team in the waiting room. The practice's own.
  knee        an infant on a parent's lap, the knee-to-knee exam. The practice's own.
  operatory   a hygienist at the sink in a treatment room. The practice's own.
  waiting     the waiting room, 2.33:1 banner. The practice's own.
  knee-2      a second frame of the knee-to-knee exam. The practice's own.
  smile       Dr. Nguyen beside a smiling child in a treatment room. The practice's own.
  dr-nguyen   Dr. Tam Nguyen, the 2023 shoot. dr-nguyen-2 is the older portrait.
  dr-cho      Dr. Dave Cho, the 2023 shoot.
  staff-*     the nine members of staff the practice's own team page names.
  chair       a masked clinician with a patient, TV on the wall. From the
              practice's blog library; NOT to be captioned as a named patient.
  toddler, baby, highfive, mother
              editorial frames from the practice's blog library. Stock. Used
              uncaptioned, never presented as this practice's patients or rooms.
"""
import os
import shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
# abspath, not normpath, and abspath again on every file below. Windows applies
# MAX_PATH to the string BEFORE it resolves the "..", so a path that is 252
# characters once collapsed is 323 on the way in from this worktree's root, and
# every open() of the three longest filenames in the mirror fails with "no such
# file" rather than anything that names the real problem. It cost a round of
# "the source is missing" on 2026-09-08; the sources were all there.
OUT = os.path.abspath(os.path.join(HERE, "..", "home", "assets", "uploads"))
KIDS = os.path.abspath(os.path.join(HERE, "..", "..", "01-site-recovery", ".tmp", "recovered", "mirror", "wp-content", "uploads"))
# Magnific's output, written by upscale-images.mjs. When a key has one, it is
# a better source than the mirror and is used instead. See its header.
UPSCALED = os.path.abspath(os.path.join(HERE, "_upscaled"))

WIDE = [480, 960, 1440, 1920]
TALL = [480, 960, 1400]
SMALL = [320, 640]
# Widths for the keys that GAINED resolution through Magnific. A key only gets
# a wider list once _upscaled/<key>.png actually exists; the fallback below
# still clamps every width to the source, so a missing upscale silently emits
# the old, narrower set rather than a stretched one.
PORTRAIT_UP = [320, 640, 960]

PHOTOS = {
    "team":        (KIDS, "2023/11/g7-scaled.jpg", WIDE),
    "knee":        (KIDS, "2023/12/Action-16-scaled.jpg", TALL),
    "operatory":   (KIDS, "2023/11/MPD-2-scaled.jpg", WIDE),
    "waiting":     (KIDS, "2023/11/Dentist-in-Katy-Office.webp", WIDE),
    "dr-nguyen":   (KIDS, "2023/11/HS-8-scaled.jpg", TALL),
    "dr-nguyen-2": (KIDS, "2020/04/mam.png", PORTRAIT_UP),
    "dr-cho":      (KIDS, "2023/11/HS-7-scaled.jpg", TALL),
    "staff-anabel":    (KIDS, "2023/12/Anabel-Front-Desk.jpeg", SMALL),
    "staff-gia":       (KIDS, "2023/12/Gia-Front-Desk-1.jpg", PORTRAIT_UP),
    "staff-kebra":     (KIDS, "2023/12/Kebra-Front-Desk.jpeg", PORTRAIT_UP),
    "staff-ivon":      (KIDS, "2023/12/Ivon-min-scaled-1.jpg", TALL),
    "staff-caisy":     (KIDS, "2023/12/Caisy-min-scaled-1.jpg", TALL),
    "staff-lizzie":    (KIDS, "2023/12/Lizzie-Dental-Assistant-1-scaled-1.jpg", TALL),
    "staff-genevieve": (KIDS, "2023/12/Genevieve-min-scaled-1.jpg", TALL),
    "staff-karen":     (KIDS, "2023/12/Karen-RDH.jpeg", SMALL),
    "staff-tiffany":   (KIDS, "2023/12/Tiffany-Dental-Hygienist-1-scaled-1.jpg", TALL),
    "chair":       (KIDS, "2026/05/MeltdownstoSmilesWhatReallyHappensInsideaPediatricDentalClinic.jpg", [480, 960, 1200, 1600]),
    "toddler":     (KIDS, "2023/08/44.webp", PORTRAIT_UP),
    "baby":        (KIDS, "2023/08/45.webp", PORTRAIT_UP),
    "highfive":    (KIDS, "2026/01/Why-Pediatric-Dentistry-Matters-A-Parents-Guide.jpeg", [480, 960, 1440]),
    "mother":      (KIDS, "2026/05/TinyTeethBigDealWhyChoosingtheRightKidsDentistMattersMoreThanYouThink.jpg", [480, 960, 1440]),
    "knee-2":      (KIDS, "2024/11/1.png", [480, 960, 1400]),
    "smile":       (KIDS, "2024/11/2.png", [480, 960, 1200, 1600]),
}

# --- the stock pool -------------------------------------------------------
# Downloaded from Magnific by get-stock.mjs into _stock/, encoded here so there
# is still ONE place that owns widths and webp. Read that script's header
# before adding a key: what stock may and may not do on this site is written
# out there, and the short version is that none of these frames may ever be
# captioned as this practice's room, patient, team or result, and none of them
# may appear in a clinical context.
#
# Every one is 3700px or wider, so the widths are the honest full set and the
# `min(w, w0)` clamp below never fires.
STOCKDIR = os.path.abspath(os.path.join(HERE, "_stock"))
STOCK = {
    "st-apple":    (STOCKDIR, "st-apple.jpg", TALL),      # a child with an apple, orchard
    "st-backpack": (STOCKDIR, "st-backpack.jpg", [480, 960, 1440]),
    "st-books":    (STOCKDIR, "st-books.jpg", [480, 960, 1440]),
    "st-brush":    (STOCKDIR, "st-brush.jpg", [480, 960, 1440]),
    "st-brushes":  (STOCKDIR, "st-brushes.jpg", TALL),    # portrait; a white shelf
    "st-calendar": (STOCKDIR, "st-calendar.jpg", [480, 960, 1440]),
    "st-crayons":  (STOCKDIR, "st-crayons.jpg", [480, 960, 1440]),
    "st-desk":     (STOCKDIR, "st-desk.jpg", [480, 960, 1440]),
    "st-family":   (STOCKDIR, "st-family.jpg", [480, 960, 1440]),
    "st-infant":   (STOCKDIR, "st-infant.jpg", [480, 960, 1440]),
    "st-lunchbox": (STOCKDIR, "st-lunchbox.jpg", [480, 960, 1440]),
    "st-nook":     (STOCKDIR, "st-nook.jpg", [480, 960, 1440]),
    "st-play":     (STOCKDIR, "st-play.jpg", [480, 960, 1440]),
    "st-teen":     (STOCKDIR, "st-teen.jpg", [480, 960, 1440]),
    # 2026-09-09, for the forty-six migrated pages. Fourteen slots could not
    # give forty-six more pages a photograph each without `waiting` carrying
    # nine of them. All objects and empty rooms bar st-hands, which is two
    # hands and no face; see get-stock.mjs for what each one is for.
    "st-blocks":   (STOCKDIR, "st-blocks.jpg", [480, 960, 1440]),
    "st-case":     (STOCKDIR, "st-case.jpg", [480, 960, 1440]),
    "st-field":    (STOCKDIR, "st-field.jpg", [480, 960, 1440]),
    "st-floss":    (STOCKDIR, "st-floss.jpg", [480, 960, 1440]),
    "st-hands":    (STOCKDIR, "st-hands.jpg", [480, 960, 1440]),
    "st-laptop":   (STOCKDIR, "st-laptop.jpg", [480, 960, 1440]),
    "st-park":     (STOCKDIR, "st-park.jpg", [480, 960, 1440]),
    "st-sleep":    (STOCKDIR, "st-sleep.jpg", [480, 960, 1440]),
    "st-soda":     (STOCKDIR, "st-soda.jpg", [480, 960, 1440]),
    "st-tube":     (STOCKDIR, "st-tube.jpg", [480, 960, 1440]),
    "st-water":    (STOCKDIR, "st-water.jpg", [480, 960, 1440]),
    "st-window":   (STOCKDIR, "st-window.jpg", TALL),     # portrait; light on a wall
    # 2026-09-09 (evening): fourteen frames that match the words they sit
    # beside, each chosen by eye and pinned by id in get-stock.mjs. Every one
    # is 3000px or wider.
    "st-aligner":  (STOCKDIR, "st-aligner.jpg", [480, 960, 1440]),
    "st-guard":    (STOCKDIR, "st-guard.jpg", [480, 960, 1440]),
    "st-gap":      (STOCKDIR, "st-gap.jpg", [480, 960, 1440]),
    "st-asleep":   (STOCKDIR, "st-asleep.jpg", [480, 960, 1440]),
    "st-phone":    (STOCKDIR, "st-phone.jpg", [480, 960, 1440]),
    "st-video":    (STOCKDIR, "st-video.jpg", [480, 960, 1440]),
    "st-paste":    (STOCKDIR, "st-paste.jpg", [480, 960, 1440]),
    "st-flossbox": (STOCKDIR, "st-flossbox.jpg", [480, 960, 1440]),
    "st-crown":    (STOCKDIR, "st-crown.jpg", [480, 960, 1440]),
    "st-bottle":   (STOCKDIR, "st-bottle.jpg", [480, 960, 1440]),
    "st-piggy":    (STOCKDIR, "st-piggy.jpg", [480, 960, 1440]),
    "st-story":    (STOCKDIR, "st-story.jpg", [480, 960, 1440]),
    "st-wave":     (STOCKDIR, "st-wave.jpg", [480, 960, 1440]),
    "st-milk":     (STOCKDIR, "st-milk.jpg", [480, 960, 1440]),
}

# --- the front of house, from the client's own album ------------------------
# Fetched by get-album.mjs into _album/ (gitignored, like _stock/). These are
# the practice's OWN photographs - the front desk and waiting room the two
# practices share - so, unlike the stock, they MAY be captioned as the place.
# Nothing clinical is taken from that album; see get-album.mjs.
ALBUMDIR = os.path.abspath(os.path.join(HERE, "_album"))
ALBUM = {
    "desk-1":      (ALBUMDIR, "desk-1.jpg", TALL),
    "desk-2":      (ALBUMDIR, "desk-2.jpg", TALL),
    "desk-form":   (ALBUMDIR, "desk-form.jpg", TALL),
    "desk-phone":  (ALBUMDIR, "desk-phone.jpg", TALL),
    "gumball":     (ALBUMDIR, "gumball.jpg", WIDE),
    "gumball-2":   (ALBUMDIR, "gumball-2.jpg", WIDE),
    "shelf-kid":   (ALBUMDIR, "shelf-kid.jpg", TALL),
    "shelf-kid-2": (ALBUMDIR, "shelf-kid-2.jpg", TALL),
    "sofa":        (ALBUMDIR, "sofa.jpg", WIDE),
}

# --- the reviewer's own frames, BugHerd round three (2026-09-24) -----------
# Attached to BugHerd notes #44-#168 by Brandklout as the picture they want in
# that slot. Copied out of workflows/.tmp/bugherd/shots/ into _reviewer/
# (gitignored) under a name that says what each shows; where one frame came
# attached at several sizes, the largest copy is the source. Every key is new,
# because the Instatic media upload skips a basename it already has.
REVIEWERDIR = os.path.abspath(os.path.join(HERE, "_reviewer"))
REVIEWER = {k: (REVIEWERDIR, f"{k}.png", WIDE) for k in (
    "rv-tv-chair", "rv-piggy-bank", "rv-clipboard", "rv-tooth-model",
    "rv-girl-brushing", "rv-tablet-consult", "rv-tablet-consult-2",
    "rv-chair-team", "rv-loupes", "rv-lap-exam", "rv-shelf-girls",
    "rv-model-brushing", "rv-building", "rv-boy-toy", "rv-desk-tablet",
    "rv-tooth-question", "rv-operatory", "rv-operatory-wide",
    "rv-front-desk-team", "rv-shelf-smile", "rv-ceiling-tv", "rv-cap-exam",
    "rv-cap-model", "rv-anticavity-kids", "rv-mom-toddler", "rv-baby-paste",
    "rv-scanner", "rv-emergency", "rv-desk-phone", "rv-desk-phone-2",
    # BugHerd #170-#184 (2026-09-24, later): named by the reviewer from the Drive
    "rv-model-girl", "rv-mouth-exam", "rv-high-five", "rv-mirror-exam", "rv-toddler-exam",
    "rv-brushing-lesson", "rv-tooth-calendar", "rv-cap-model-2", "rv-ceiling-tv-2",
)}

# --- the practice's Drive, BugHerd round five (2026-09-26) ------------------
# Notes #176-#432 name files in the Mason Park shared drive: Adobe Stock the
# practice licensed (AdobeStock_<id>) and its own phone photos (PXL_*, IMG_*).
# Pulled with scripts/drive.mjs into _drive/ (gitignored). Keys are `as-<id>`,
# `px-<date>-<time>` and `img-<n>`, new basenames every one, because the
# Instatic media upload skips a basename it already has. AdobeStock_462171644
# is a clip; _drive holds a still from 1 s in. Phone photos carry an EXIF
# rotation, so these are transposed before they are measured.
DRIVEDIR = os.path.abspath(os.path.join(HERE, "_drive"))
DRIVE = {}
if os.path.isdir(DRIVEDIR):
    import re as _re
    for _f in sorted(os.listdir(DRIVEDIR)):
        _m = _re.fullmatch(r"AdobeStock_(\d+)\.jpe?g", _f) or _re.fullmatch(r"PXL_(\d+_\d+)(?:\.MP)?\.jpe?g", _f) or _re.fullmatch(r"IMG_(\d+)\.jpe?g", _f)
        if _m:
            _k = ("as-" if _f.startswith("Adobe") else "px-" if _f.startswith("PXL") else "img-") + _m.group(1).replace("_", "-")
            DRIVE[_k] = (DRIVEDIR, _f, WIDE)

# --- mirrored variants ------------------------------------------------------
# A frame flipped left-to-right, written from the encoded widths of its source
# so it is the same pixels in the other direction. `smile-flip` is the homepage
# hero: Dr. Nguyen is on the LEFT of `smile`, under the headline's veil, and
# the client asked (2026-09-09, evening) to see a little of the doctor too.
# Mirroring puts her on the visible right. Nothing in the frame reads as text.
#   python prep-images.py --mirror-only    just these, no re-encode
MIRRORED = {
    "smile-flip": "smile",
    # BugHerd #247: the guard sat under the overlap panel; mirrored, it sits in the open.
    "st-guard-flip": "st-guard",
    # BugHerd #470: the aligner sat under the overlap panel; mirrored, it is in the open.
    "as-569098023-flip": "as-569098023",
}

COPY = {
    "logo.png":   (KIDS, "2023/12/Childrens-Dentist-Katy-Logo-1.png"),
    "aapd.webp":  (KIDS, "2023/08/aapd.webp"),
    "abpd.webp":  (KIDS, "2023/08/abpd-1.webp"),
    "agd.webp":   (KIDS, "2023/08/agd-1.webp"),
    "kois.webp":  (KIDS, "2023/08/kois-1.webp"),
    "ssc.webp":   (KIDS, "2023/08/ssc-1.webp"),
}

os.makedirs(OUT, exist_ok=True)
import sys

def mirror_all():
    n = 0
    for key, src in MIRRORED.items():
        for f in sorted(os.listdir(OUT)):
            if not (f == f"{src}.webp" or (f.startswith(src + "-") and f[len(src) + 1:-5].isdigit() and f.endswith(".webp"))):
                continue
            im = Image.open(os.path.join(OUT, f)).transpose(Image.FLIP_LEFT_RIGHT)
            out = f.replace(src, key, 1)
            im.save(os.path.join(OUT, out), "WEBP", quality=82, method=6)
            n += 1
        print(f"{key:18s} mirrored from {src}")
    return n

if "--mirror-only" in sys.argv:
    print(f"{mirror_all()} mirrored variants written")
    sys.exit(0)

written = 0
missing_stock = []
missing_mirror = []
ONLY = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
for key, (root, rel, widths) in {**PHOTOS, **STOCK, **ALBUM, **REVIEWER, **DRIVE}.items():
    if ONLY is not None and key not in ONLY:
        continue
    src = os.path.join(root, rel)
    # The recovery mirror is workflow 01's `recovered/`, which is gitignored
    # and is therefore absent from a worktree that did not run the recovery.
    # uploads/ is gitignored too but is normally already built, so a missing
    # MIRROR source is a "nothing to do here", not a crash: it would otherwise
    # stop the run before it reached the stock keys, which are the only ones a
    # later session actually adds. A key that is missing from BOTH is caught by
    # check.mjs, which reads the markup and fails on an asset that will 404.
    if root == KIDS and not os.path.exists(src) and not os.path.exists(os.path.join(UPSCALED, f"{key}.png")):
        missing_mirror.append(key)
        continue
    if root in (ALBUMDIR, REVIEWERDIR) and not os.path.exists(src):
        missing_stock.append(key + " (album)")
        continue
    if root == STOCKDIR and not os.path.exists(src):
        # A stock key with no file is a `node get-stock.mjs` away, not a crash:
        # _stock/ is gitignored like uploads/, so a fresh clone has none of it.
        missing_stock.append(key)
        continue
    # Magnific's output when there is one. Same frame, same crop, same aspect -
    # only more pixels - so nothing downstream changes. A key whose upscale was
    # REJECTED on the contact sheet has no PNG here and falls back to the
    # mirror automatically; see upscale-images.mjs for which two, and why.
    up = os.path.join(UPSCALED, f"{key}.png")
    source_note = "  (magnific stock)" if root == STOCKDIR else ("  (album)" if root == ALBUMDIR else "")
    if os.path.exists(up):
        src = up
        source_note = "  (magnific)"
    im = Image.open(src)
    if root == DRIVEDIR:
        from PIL import ImageOps
        im = ImageOps.exif_transpose(im)
    im = im.convert("RGB")
    w0, h0 = im.size
    done = []
    for w in widths:
        # A source narrower than the next width is still emitted once at its
        # own width, so an 899px frame is not served at 480 (2026-09-24).
        if w > w0 and done and (done[-1] == w0 or root != REVIEWERDIR):
            break
        w = min(w, w0)
        h = round(h0 * w / w0)
        out = im.resize((w, h), Image.LANCZOS)
        out.save(os.path.join(OUT, f"{key}-{w}.webp"), "WEBP", quality=82, method=6)
        done.append(w)
        written += 1
    big = done[-1]
    shutil.copyfile(os.path.join(OUT, f"{key}-{big}.webp"), os.path.join(OUT, f"{key}.webp"))
    print(f"{key:18s} {w0}x{h0}  -> {', '.join(str(d) for d in done)}{source_note}")

for name, (root, rel) in ({} if ONLY is not None else COPY).items():
    src = os.path.join(root, rel)
    if name == "logo.png":
        # The logo is published on a WHITE ground, and the masthead inverts it
        # to white over the hero: a white ground inverts to a white block. Lift
        # the ground to alpha, keeping the anti-aliased edges.
        im = Image.open(src).convert("RGBA")
        px = im.load()
        w, h = im.size
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                lum = (r + g + b) / 3
                if lum > 245:
                    px[x, y] = (r, g, b, 0)
                elif lum > 200:
                    px[x, y] = (r, g, b, int(a * (245 - lum) / 45))
        im.save(os.path.join(OUT, name), "PNG", optimize=True)
        print(f"{name:18s} copied, ground lifted to alpha")
        continue
    shutil.copyfile(src, os.path.join(OUT, name))
    print(f"{name:18s} copied")

if ONLY is None:
    written += mirror_all()

if missing_mirror:
    print()
    print(f"no mirror source for {len(missing_mirror)} key(s), left as they are in uploads/: {', '.join(missing_mirror)}")
    print("that is expected outside the worktree that ran 01-site-recovery.")
if missing_stock:
    print("")
    print(f"no _stock file for: {', '.join(missing_stock)}  -  run `node get-stock.mjs`")
print(f"{written} variants written to {os.path.normpath(OUT)}")
