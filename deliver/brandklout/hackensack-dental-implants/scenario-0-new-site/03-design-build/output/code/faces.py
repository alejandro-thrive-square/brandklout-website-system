# Client script, 2026-10-09. Finds the faces in every photograph in site-src/media/img (OpenCV Haar,
# frontal and profile) and writes code/faces.json: { "<file>": [[x, y, w, h], ...] } as fractions of
# the image, the face box only (forehead to chin). It also writes site-src/js/01-faces.js: the HEAD
# of every subject (the face grown by HEAD below; faces narrower than MIN_FACE of the photo are
# background people), which the runtime reads to keep its motion off those heads. code/face-gate.mjs
# uses the same head and checks each stays visible in every frame, at rest and through the motion.
# Needs opencv-python-headless<5 (5.x has no CascadeClassifier).
# Usage (from the step's output/ folder): python code/faces.py [--sheet]   (--sheet also writes
# look/faces/<file>.png with the boxes drawn, to check the detector by eye)
import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
IMG = HERE / "site-src" / "media" / "img"
OUT = HERE / "faces.json"
JS = HERE / "site-src" / "js" / "01-faces.js"
MIN_FACE = 0.08
HEAD = (0.14, 0.35, 0.10)  # grow the face box: each side by 14% of its width, 35% of its height above, 10% below
SHEET = HERE.parent / "look" / "faces"
SKIP = ("logo-", "case-", "gallery-case-")  # logos; before/after smiles are mouths, not faces

frontal = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
alt = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
profile = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")


def read(path: Path):
    data = np.fromfile(str(path), dtype=np.uint8)  # imread cannot open non-ASCII or long paths
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def overlap(a, b) -> float:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ix = max(0, min(ax + aw, bx + bw) - max(ax, bx))
    iy = max(0, min(ay + ah, by + bh) - max(ay, by))
    return ix * iy / float(min(aw * ah, bw * bh))


def detect(img):
    gray = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    h, w = gray.shape
    least = max(24, int(min(w, h) * 0.06))
    found = []
    # frontal faces must be confirmed by both frontal cascades (cuts texture false positives)
    a = frontal.detectMultiScale(gray, 1.08, 6, minSize=(least, least))
    b = alt.detectMultiScale(gray, 1.08, 4, minSize=(least, least))
    for box in a:
        if any(overlap(box, o) > 0.5 for o in b):
            found.append(tuple(int(v) for v in box))
    for flip in (False, True):
        g = cv2.flip(gray, 1) if flip else gray
        for x, y, bw, bh in profile.detectMultiScale(g, 1.08, 7, minSize=(least, least)):
            box = (w - x - bw, y, bw, bh) if flip else (x, y, bw, bh)
            if not any(overlap(box, f) > 0.3 for f in found):
                found.append(tuple(int(v) for v in box))
    return found, w, h


def main() -> None:
    sheet = "--sheet" in sys.argv
    if sheet:
        SHEET.mkdir(parents=True, exist_ok=True)
    result = {}
    for path in sorted(IMG.iterdir()):
        if path.suffix.lower() not in (".webp", ".png", ".jpg", ".jpeg") or path.name.startswith(SKIP):
            continue
        img = read(path)
        if img is None:
            continue
        boxes, w, h = detect(img)
        if not boxes:
            continue
        result[path.name] = [[round(x / w, 4), round(y / h, 4), round(bw / w, 4), round(bh / h, 4)] for x, y, bw, bh in boxes]
        print(f"{path.name:44} {len(boxes)} face(s)  " + "  ".join(f"x{x / w:.2f} y{y / h:.2f} w{bw / w:.2f}" for x, y, bw, bh in boxes))
        if sheet:
            for x, y, bw, bh in boxes:
                cv2.rectangle(img, (x, y), (x + bw, y + bh), (0, 0, 255), max(2, w // 300))
            ok, buf = cv2.imencode(".png", img)
            buf.tofile(str(SHEET / (path.stem + ".png")))
    OUT.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8", newline="\n")
    side, above, below = HEAD
    heads = {}
    for name, boxes in result.items():
        hs = [[round(x - side * w, 4), round(y - above * h, 4), round(w * (1 + 2 * side), 4), round(h * (1 + above + below), 4)] for x, y, w, h in boxes if w >= MIN_FACE]
        if hs:
            heads[name.rsplit(".", 1)[0]] = hs
    JS.write_text("/* Written by code/faces.py: the head of every subject in the photographs, as fractions of the photo\n"
                  "   [x, y, w, h]. The runtime keeps its wipes, zooms and drift off these heads. Do not edit by hand. */\n"
                  "window.WZFaces = " + json.dumps(heads, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    print(f"\n{len(result)} image(s) with faces -> {OUT.name}")


if __name__ == "__main__":
    main()
