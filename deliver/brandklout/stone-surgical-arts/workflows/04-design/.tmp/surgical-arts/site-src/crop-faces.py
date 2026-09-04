"""Finds the frames where a face is actually clipped by its crop.

Companion to crop-probe.mjs. Step one runs OpenCV's Haar cascades over every
photograph in assets/ and records each face as a fraction box of the image
(cached in <out>/faces.json; delete it to re-detect). Step two reads the probe's
frames.json and, for every frame whose source carries a face, tests whether the
face box - grown upward for the hairline and downward for the chin - fits inside
the visible region of the crop. A face that does not fit is a finding.

Usage:
    python crop-faces.py <out-dir>            report clipped faces
    python crop-faces.py <out-dir> --all      also list the frames that pass

Tuning: HEAD_UP / CHIN_DOWN are how much of the detected box height to add above
and below it. Haar's frontal box runs from roughly the eyebrows to just under the
mouth, so 0.55 above reaches the hairline and 0.30 below covers the chin.
"""
import json
import os
import sys

import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT = sys.argv[1]
SHOW_ALL = "--all" in sys.argv
HEAD_UP, CHIN_DOWN, SIDE = 0.55, 0.30, 0.10
MIN_FACE_FRAC = 0.04  # ignore faces narrower than 4% of the image: crowd noise

FACES = os.path.join(OUT, "faces.json")


def detect(path):
    im = cv2.imread(path)
    if im is None:
        return None
    h, w = im.shape[:2]
    # Work at a bounded size; Haar is slow and no more accurate on 2000px.
    scale = min(1.0, 1200 / max(w, h))
    small = cv2.resize(im, (round(w * scale), round(h * scale))) if scale < 1 else im
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    sh, sw = gray.shape
    found = []
    for name in ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml", "haarcascade_profileface.xml"):
        casc = cv2.CascadeClassifier(cv2.data.haarcascades + name)
        boxes = casc.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(round(sw * MIN_FACE_FRAC), round(sw * MIN_FACE_FRAC)))
        for (x, y, bw, bh) in boxes:
            found.append({"x0": x / sw, "y0": y / sh, "x1": (x + bw) / sw, "y1": (y + bh) / sh, "via": name.split("_")[1]})
        if name == "haarcascade_profileface.xml":
            flipped = cv2.flip(gray, 1)
            for (x, y, bw, bh) in casc.detectMultiScale(flipped, scaleFactor=1.08, minNeighbors=6, minSize=(round(sw * MIN_FACE_FRAC), round(sw * MIN_FACE_FRAC))):
                found.append({"x0": 1 - (x + bw) / sw, "y0": y / sh, "x1": 1 - x / sw, "y1": (y + bh) / sh, "via": "profile-flipped"})
    # Merge overlapping boxes (the three cascades find the same face).
    merged = []
    for f in sorted(found, key=lambda b: (b["x1"] - b["x0"]) * (b["y1"] - b["y0"]), reverse=True):
        for m in merged:
            ix = max(0, min(f["x1"], m["x1"]) - max(f["x0"], m["x0"]))
            iy = max(0, min(f["y1"], m["y1"]) - max(f["y0"], m["y0"]))
            if ix * iy > 0.3 * (f["x1"] - f["x0"]) * (f["y1"] - f["y0"]):
                break
        else:
            merged.append(f)
    return {"size": [w, h], "faces": merged}


def load_faces():
    if os.path.exists(FACES):
        return json.load(open(FACES, encoding="utf8"))
    faces = {}
    for name in sorted(os.listdir(ASSETS)):
        if not name.endswith((".webp", ".jpg", ".jpeg", ".png")):
            continue
        d = detect(os.path.join(ASSETS, name))
        if d is not None:
            faces[name] = d
            print(f"{name:32} {len(d['faces'])} face(s)")
    json.dump(faces, open(FACES, "w", encoding="utf8"), indent=1)
    return faces


def clipped(face, vis):
    fh = face["y1"] - face["y0"]
    fw = face["x1"] - face["x0"]
    need = {
        "y0": max(0.0, face["y0"] - HEAD_UP * fh),
        "y1": min(1.0, face["y1"] + CHIN_DOWN * fh),
        "x0": max(0.0, face["x0"] - SIDE * fw),
        "x1": min(1.0, face["x1"] + SIDE * fw),
    }
    cuts = []
    if need["y0"] < vis["y0"] - 0.005:
        cuts.append(f"top {round((vis['y0'] - need['y0']) / fh * 100)}% of a head")
    if need["y1"] > vis["y1"] + 0.005:
        cuts.append(f"bottom {round((need['y1'] - vis['y1']) / fh * 100)}% of a head")
    if need["x0"] < vis["x0"] - 0.005:
        cuts.append(f"left {round((vis['x0'] - need['x0']) / fw * 100)}%")
    if need["x1"] > vis["x1"] + 0.005:
        cuts.append(f"right {round((need['x1'] - vis['x1']) / fw * 100)}%")
    return cuts


faces = load_faces()
frames = json.load(open(os.path.join(OUT, "frames.json"), encoding="utf8"))
findings, passes = [], []
for fr in frames:
    src = fr["src"]
    d = faces.get(src)
    if not d or not d["faces"]:
        continue
    vis = fr["visible"]
    worst = []
    for face in d["faces"]:
        c = clipped(face, vis)
        if c:
            worst.append(c)
    row = f"{fr['page']:26} {fr['width']:>4}  {' > '.join(reversed(fr['chain'][:3])):58} {src:24} pos={fr['objectPosition']:10} vis y {vis['y0']:.2f}-{vis['y1']:.2f}  {fr['rendered'][0]}x{fr['rendered'][1]}"
    if worst:
        findings.append(row + "   CUT: " + "; ".join(", ".join(w) for w in worst) + (f"   [{fr.get('shot')}]" if fr.get("shot") else ""))
    else:
        passes.append(row)

print(f"\n{len(findings)} clipped face frames of {len(findings) + len(passes)} frames carrying a face\n")
print("\n".join(findings))
if SHOW_ALL:
    print("\n--- pass ---")
    print("\n".join(passes))
