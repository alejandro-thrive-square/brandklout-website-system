# Client script, 2026-09-30. Cuts every image the home page uses from its source (the client's
# shared drive first, then the old-site capture) into site-src/media/img, and writes the ledger
# IMAGES.md section 4 asks for (output/images.csv).
#
# One row per slot: target name, source, crop box as fractions of the source (left, top, right,
# bottom), the longest edge to ship, and what the photo shows. A re-cut image gets a NEW target name
# (Instatic's media upload skips by basename).
"""Usage (from the step's output/ folder): python code/prep-images.py"""

from __future__ import annotations

import csv
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[1]
DRIVE = OUT / "assets" / "drive"
OLD = OUT.parents[2] / "scenario-1-migration" / "01-old-site-capture" / "output" / "assets" / "downloads" / "wf"
DEST = OUT / "code" / "site-src" / "media" / "img"

# target, source kind, source file, crop (l, t, r, b), longest edge, quality, shows
SLOTS = [
    ("mirror.webp", "drive", "office/Hackensack Action Shots_2.17.1.png", (0.30, 0, 1, 1), 1600, 84,
     "A patient sees her new smile in a hand mirror in the treatment chair"),
    ("mirror-m.webp", "drive", "office/Hackensack Action Shots_2.17.1.png", (0.47, 0.06, 1, 1), 1100, 82,
     "The same frame cut tall for phones"),
    ("chair.webp", "drive", "office/Hackensack Still 2025-04-29 110557_1.3.1.png", (0.22, 0, 0.98, 1), 1500, 84,
     "A patient smiling in the treatment chair, hand mirror in hand"),
    ("meskin.webp", "drive", "office/Dr.Alan-Meskin.png", (0.06, 0, 0.94, 1), 1500, 86,
     "Dr. Alan Meskin in a white coat"),
    ("srour.webp", "old-site", "5595ac_Dr.-Srour-Cutout-1024x833.webp", (0, 0, 1, 1), 1024, 86, "Dr. Maurice Srour"),
    ("lee.webp", "old-site", "e157a3_Dr.-Lee-cutout-faded-905x1024.webp", (0, 0, 1, 1), 1024, 86, "Dr. Won-Sang Lee"),
    ("klass.webp", "old-site", "5a7b8b_Hackensack Center.png", (0.08, 0, 0.92, 0.84), 1100, 86, "Dr. Dmitriy Klass"),
    ("case-1-before.webp", "old-site", "e9054d_before 1.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient one before implant treatment"),
    ("case-1-after.webp", "old-site", "343c65_after 1.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient one after implant treatment"),
    ("case-2-before.webp", "old-site", "a2981a_before 2.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient two before implant treatment"),
    ("case-2-after.webp", "old-site", "03c010_after 2.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient two after implant treatment"),
    ("case-3-before.webp", "old-site", "608bd8_before 3.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient three before implant treatment"),
    ("case-3-after.webp", "old-site", "343c19_after 3.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient three after implant treatment"),
    ("isaac.webp", "drive", "office/Hackensack Still 2025-04-29 110557_1.2.1.png", (0, 0, 1, 1), 1600, 84,
     "Isaac, a patient, in the still from his testimonial film"),
    ("daniel.webp", "drive", "office/Hackensack Still 2025-04-29 110557_1.1.1.png", (0, 0, 1, 1), 1600, 84,
     "Daniel, a patient, holding the photograph of his teeth before treatment"),
    ("lounge.webp", "drive", "root/WhatsApp Image 2026-09-14 at 14.27.18 (1).jpeg", (0.02, 0.04, 1, 0.98), 1800, 82,
     "The patient lounge: sofa, flowers and paintings"),
    ("reception.webp", "drive", "root/WhatsApp Image 2026-09-14 at 14.27.33.jpeg", (0, 0.1, 1, 0.98), 1800, 82,
     "The reception desk under the round ceiling"),
    ("cbct.webp", "drive", "office/Hackensack Action Shots_2.5.1.png", (0, 0, 1, 1), 1600, 84,
     "A patient positioned in the 3D CBCT scanner"),
    ("lab.webp", "old-site", "5b05b4_Dental-Lab.webp", (0, 0, 1, 1), 900, 86,
     "The lab bench: a scanner, an articulated model and the design on screen"),
    ("operatory.webp", "drive", "office/Hackensack Action Shots_2.12.1.png", (0, 0, 1, 1), 1600, 84,
     "A treatment room with its chair"),
    ("exterior.webp", "drive", "office/Hackensack office Shot 1.png", (0, 0, 1, 1), 1600, 84,
     "The Aesthetic Dental Center building on Main Street, where the practice is"),
    ("logo-stacked.png", "drive", "logos/Hackensack Center Logo Stacked-3.png", (0, 0, 1, 1), 900, 0, "Logo, black on transparent, horizontal"),
    ("logo-circle.png", "drive", "logos/Hackensack Center Logo Circle-3.png", (0, 0, 1, 1), 640, 0, "Logo, black on transparent, round seal"),
    ("favicon.png", "old-site", "4d4cc3_ hackensack logo.png", (0, 0, 1, 1), 192, 0, "Site icon, as on the current site"),
    ("webmd.svg", "old-site", "bcebd2_WebMD_logo.svg", None, 0, 0, "WebMD logo"),
    ("vitals.svg", "old-site", "dfb6ad_vitals-logo.svg", None, 0, 0, "Vitals logo"),
    ("healthgrades.webp", "old-site", "83e143_channels4_profile.webp", (0, 0, 1, 1), 200, 88, "Healthgrades mark"),
    ("carecredit.webp", "old-site", "0032d8_Care-Credit-1024x133.webp", (0, 0, 1, 1), 600, 90, "CareCredit logo"),
    ("cherry.webp", "old-site", "982522_CherryLogo-MidnightBlue-1024x2.webp", (0, 0, 1, 1), 500, 90, "Cherry logo"),
    ("proceed.webp", "old-site", "a7c097_Proceed-Finance-Logo-2-1024x23.webp", (0, 0, 1, 1), 500, 90, "Proceed Finance logo"),
    ("hfd.svg", "old-site", "b8c199_imgi_1_hfd-logo-4.svg", None, 0, 0, "HFD logo"),
]


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    rows = []
    for target, kind, src, box, edge, q, shows in SLOTS:
        f = (DRIVE if kind == "drive" else OLD) / src
        if not f.exists():
            raise SystemExit(f"missing source for {target}: {f}")
        out = DEST / target
        if box is None:
            out.write_bytes(f.read_bytes())
            size = ""
        else:
            im = Image.open(f)
            w, h = im.size
            im = im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))
            if max(im.size) > edge:
                im.thumbnail((edge, edge), Image.LANCZOS)
            if target.endswith(".png"):
                im.save(out, optimize=True)
            else:
                im.save(out, "WEBP", quality=q, method=6)
            size = f"{im.size[0]}x{im.size[1]}"
        rows.append([target, kind, ("drive 0ADqUKcTkH0SxUk9PVA / " if kind == "drive" else "old-site capture / ") + src,
                     "client's own", "index", 2 if target == "reception.webp" else 3, size, out.stat().st_size // 1024, shows])
        print(f"{target:22s} {size:10s} {out.stat().st_size // 1024:5d} KB  <- {kind}: {src}")
    with (OUT / "images.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["file", "source", "source id or path", "licence", "pages", "fit score", "pixels", "kb", "shows"])
        w.writerows(rows)
    print(f"\n{len(rows)} images -> {DEST}\nledger -> {OUT / 'images.csv'}")


if __name__ == "__main__":
    main()
