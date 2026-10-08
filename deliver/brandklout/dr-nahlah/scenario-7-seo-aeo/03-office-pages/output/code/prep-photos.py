"""Resize the Alexandria office photos for the web: EXIF orientation applied, 2000 px wide, JPEG q82,
named for what they show. usage: python -I prep-photos.py <source folder> <out folder>"""
import os, sys
from PIL import Image, ImageOps

PICK = {
    "IMG_3086.jpeg": "dr-nahlah-alexandria-office-reception.jpg",
    "IMG_3072.jpeg": "dr-nahlah-alexandria-office-entrance.jpg",
    "IMG_3082.jpeg": "dr-nahlah-alexandria-office-waiting-area.jpg",
    "IMG_3071.jpeg": "dr-nahlah-alexandria-office-treatment-room.jpg",
    "IMG_3090.jpeg": "dr-nahlah-alexandria-office-consultation-room.jpg",
    "IMG_3080.jpeg": "dr-nahlah-alexandria-office-lounge.jpg",
    "IMG_3075.jpeg": "dr-nahlah-alexandria-office-imaging-room.jpg",
    "IMG_3069.jpeg": "dr-nahlah-alexandria-office-treatment-chair.jpg",
}
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for name, target in PICK.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(src, name))).convert("RGB")
    if im.width > 2000:
        im = im.resize((2000, round(im.height * 2000 / im.width)), Image.LANCZOS)
    p = os.path.join(out, target)
    im.save(p, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{name} -> {target} {im.width}x{im.height} {os.path.getsize(p) // 1024} KB")
