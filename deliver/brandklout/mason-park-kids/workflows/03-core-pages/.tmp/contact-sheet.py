"""Before/after contact sheet for the Magnific upscales.

    python contact-sheet.py            one sheet per pair, into .tmp/_upscaled/_review/

Every pair is the ORIGINAL (left, nearest-neighbour to the same height so the
real pixels stay visible) against the UPSCALE (right). The point is to catch a
face the upscaler reinterpreted: at creativity 1 / resemblance 3 it should not,
but it is a generative model and "should not" is not "does not", and every one
of these is a real, named person.
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UP = os.path.join(HERE, "_upscaled")
REVIEW = os.path.join(UP, "_review")
MIRROR = os.path.abspath(os.path.join(
    HERE, "..", "..", "01-site-recovery", ".tmp", "recovered", "mirror", "wp-content", "uploads"))

SOURCES = {
    "staff-anabel": "2023/12/Anabel-Front-Desk.jpeg",
    "staff-gia": "2023/12/Gia-Front-Desk-1.jpg",
    "staff-kebra": "2023/12/Kebra-Front-Desk.jpeg",
    "staff-karen": "2023/12/Karen-RDH.jpeg",
    "dr-nguyen-2": "2020/04/mam.png",
    "knee-2": "2024/11/1.png",
    "smile": "2024/11/2.png",
    "chair": "2026/05/MeltdownstoSmilesWhatReallyHappensInsideaPediatricDentalClinic.jpg",
    "mother": "2026/05/TinyTeethBigDealWhyChoosingtheRightKidsDentistMattersMoreThanYouThink.jpg",
    "toddler": "2023/08/44.webp",
    "baby": "2023/08/45.webp",
    "waiting": "2023/11/Dentist-in-Katy-Office.webp",
}

H = 620  # each half is this tall in the sheet
os.makedirs(REVIEW, exist_ok=True)

for key, rel in SOURCES.items():
    up_path = os.path.join(UP, key + ".png")
    src_path = os.path.join(MIRROR, *rel.split("/"))
    if not os.path.exists(up_path):
        print(f"{key:14s} no upscale")
        continue
    src = Image.open(src_path).convert("RGB")
    up = Image.open(up_path).convert("RGB")

    def fit(im, resample):
        w = round(im.width * H / im.height)
        return im.resize((w, H), resample)

    # NEAREST on the original so its real resolution is legible next to the
    # upscale rather than smoothed by the preview itself.
    a = fit(src, Image.NEAREST)
    b = fit(up, Image.LANCZOS)
    sheet = Image.new("RGB", (a.width + b.width + 12, H), (240, 240, 238))
    sheet.paste(a, (0, 0))
    sheet.paste(b, (a.width + 12, 0))
    out = os.path.join(REVIEW, f"{key}.png")
    sheet.save(out)
    print(f"{key:14s} {src.width}x{src.height}  ->  {up.width}x{up.height}   {out}")
