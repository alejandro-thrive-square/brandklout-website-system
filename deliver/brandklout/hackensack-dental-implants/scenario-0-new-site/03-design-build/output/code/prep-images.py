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
    # the five photographs the chosen concept (concept-04) holds with stock; here each is the client's own
    ("hero.webp", "drive", "office/Hackensack Action Shots_2.17.1.png", (0.528, 0, 1, 1), 1200, 86,
     "A patient sees her new smile in a hand mirror in the treatment chair"),
    ("story.webp", "drive", "office/Hackensack Still 2025-04-29 110557_1.2.1.png", (0.30, 0, 0.795, 1), 1100, 86,
     "Isaac, a patient, in the still from his testimonial film"),
    ("feature.webp", "drive", "office/Hackensack Still 2025-04-29 110557_1.3.1.png", (0.22, 0, 0.98, 1), 1500, 86,
     "A patient smiling in the treatment chair, hand mirror in hand"),
    ("tech.webp", "drive", "office/Hackensack Action Shots_2.5.1.png", (0.18, 0, 1, 1), 1600, 86,
     "A patient positioned in the 3D CBCT scanner"),
    ("final.webp", "drive", "office/Hackensack Still 2025-04-29 110557_1.1.1.png", (0.36, 0, 0.92, 1), 1100, 86,
     "Daniel, a patient, holding the photograph of his teeth before treatment"),
    ("doctor.png", "old-site", "cdab92_dr alan.png", (0, 0, 1, 1), 500, 0,
     "Dr. Alan Meskin, cut out: the same file the concept uses"),
    ("case-1-before.webp", "old-site", "e9054d_before 1.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient one before implant treatment"),
    ("case-1-after.webp", "old-site", "343c65_after 1.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient one after implant treatment"),
    ("case-2-before.webp", "old-site", "a2981a_before 2.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient two before implant treatment"),
    ("case-2-after.webp", "old-site", "03c010_after 2.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient two after implant treatment"),
    ("case-3-before.webp", "old-site", "608bd8_before 3.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient three before implant treatment"),
    ("case-3-after.webp", "old-site", "343c19_after 3.webp", (0, 0.04, 1, 0.94), 1500, 82, "Patient three after implant treatment"),
    ("logo-round.png", "drive", "logos/Hackensack Center Logo Circle-2.png", (0, 0, 1, 1), 192, 0, "Logo, white on black, round"),
    ("favicon.png", "old-site", "4d4cc3_ hackensack logo.png", (0, 0, 1, 1), 192, 0, "Site icon, as on the current site"),
]


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for old in DEST.iterdir():
        old.unlink()
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
                     "client's own", "index", 3, size, out.stat().st_size // 1024, shows])
        print(f"{target:22s} {size:10s} {out.stat().st_size // 1024:5d} KB  <- {kind}: {src}")
    with (OUT / "images.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["file", "source", "source id or path", "licence", "pages", "fit score", "pixels", "kb", "shows"])
        w.writerows(rows)
    print(f"\n{len(rows)} images -> {DEST}\nledger -> {OUT / 'images.csv'}")


if __name__ == "__main__":
    main()
