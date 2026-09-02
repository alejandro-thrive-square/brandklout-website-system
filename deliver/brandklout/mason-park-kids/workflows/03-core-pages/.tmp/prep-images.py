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
OUT = os.path.join(HERE, "..", "home", "assets", "uploads")
KIDS = os.path.normpath(os.path.join(HERE, "..", "..", "01-site-recovery", ".tmp", "recovered", "mirror", "wp-content", "uploads"))

WIDE = [480, 960, 1440, 1920]
TALL = [480, 960, 1400]
SMALL = [320, 640]

PHOTOS = {
    "team":        (KIDS, "2023/11/g7-scaled.jpg", WIDE),
    "knee":        (KIDS, "2023/12/Action-16-scaled.jpg", TALL),
    "operatory":   (KIDS, "2023/11/MPD-2-scaled.jpg", WIDE),
    "waiting":     (KIDS, "2023/11/Dentist-in-Katy-Office.webp", WIDE),
    "dr-nguyen":   (KIDS, "2023/11/HS-8-scaled.jpg", TALL),
    "dr-nguyen-2": (KIDS, "2020/04/mam.png", SMALL),
    "dr-cho":      (KIDS, "2023/11/HS-7-scaled.jpg", TALL),
    "staff-anabel":    (KIDS, "2023/12/Anabel-Front-Desk.jpeg", SMALL),
    "staff-gia":       (KIDS, "2023/12/Gia-Front-Desk-1.jpg", SMALL),
    "staff-kebra":     (KIDS, "2023/12/Kebra-Front-Desk.jpeg", SMALL),
    "staff-ivon":      (KIDS, "2023/12/Ivon-min-scaled-1.jpg", TALL),
    "staff-caisy":     (KIDS, "2023/12/Caisy-min-scaled-1.jpg", TALL),
    "staff-lizzie":    (KIDS, "2023/12/Lizzie-Dental-Assistant-1-scaled-1.jpg", TALL),
    "staff-genevieve": (KIDS, "2023/12/Genevieve-min-scaled-1.jpg", TALL),
    "staff-karen":     (KIDS, "2023/12/Karen-RDH.jpeg", SMALL),
    "staff-tiffany":   (KIDS, "2023/12/Tiffany-Dental-Hygienist-1-scaled-1.jpg", TALL),
    "chair":       (KIDS, "2026/05/MeltdownstoSmilesWhatReallyHappensInsideaPediatricDentalClinic.jpg", [480, 960, 1200]),
    "toddler":     (KIDS, "2023/08/44.webp", SMALL),
    "baby":        (KIDS, "2023/08/45.webp", SMALL),
    "highfive":    (KIDS, "2026/01/Why-Pediatric-Dentistry-Matters-A-Parents-Guide.jpeg", [480, 960, 1440]),
    "mother":      (KIDS, "2026/05/TinyTeethBigDealWhyChoosingtheRightKidsDentistMattersMoreThanYouThink.jpg", [480, 960]),
    "knee-2":      (KIDS, "2024/11/1.png", [480, 960]),
    "smile":       (KIDS, "2024/11/2.png", [480, 960, 1200]),
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
written = 0
for key, (root, rel, widths) in PHOTOS.items():
    src = os.path.join(root, rel)
    im = Image.open(src).convert("RGB")
    w0, h0 = im.size
    done = []
    for w in widths:
        if w > w0 and done:
            break
        w = min(w, w0)
        h = round(h0 * w / w0)
        out = im.resize((w, h), Image.LANCZOS)
        out.save(os.path.join(OUT, f"{key}-{w}.webp"), "WEBP", quality=82, method=6)
        done.append(w)
        written += 1
    big = done[-1]
    shutil.copyfile(os.path.join(OUT, f"{key}-{big}.webp"), os.path.join(OUT, f"{key}.webp"))
    print(f"{key:18s} {w0}x{h0}  -> {', '.join(str(d) for d in done)}")

for name, (root, rel) in COPY.items():
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

print(f"{written} variants written to {os.path.normpath(OUT)}")
