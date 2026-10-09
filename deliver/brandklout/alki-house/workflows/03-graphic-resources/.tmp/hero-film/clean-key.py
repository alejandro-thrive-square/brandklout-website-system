"""Paint pseudo-lettering out of a keyframe's raw render (OpenCV inpaint), keeping the original.

Mystic still prints fake brand marks on cameras now and then; the video model then carries them
through every frame. Regions are boxes in raw-render pixels, found by zooming into the render.
Usage: python clean-key.py <shot>     (then: node make-hero-film.mjs --stage crop)
cv2 comes with rembg (see 04-design/.tmp/site-src/prepare-assets.py for the install).
"""
import os, sys
from pathlib import Path

LOCAL = Path(os.environ.get('LOCALAPPDATA', Path.home())) / 'webzite' / 'pydeps-rembg'
sys.path.insert(0, str(LOCAL))
import cv2  # noqa: E402
import numpy as np  # noqa: E402

REGIONS = {
    # "CAINO" on the prism, "ARO" on the lens barrel (2026-10-09, round 3 rig)
    'rig': [(1338, 395, 1416, 425), (1255, 634, 1302, 655)],
    # the bezel's pseudo-logo, the line under it and the button labels (round 2 monitor)
    'monitor': [(1274, 698, 1334, 725), (1256, 732, 1370, 750), (1478, 744, 1624, 770)],
}
ZOOM = {'rig': (1075, 304, 860, 608), 'monitor': (1021, 608, 645, 194)}

shot = sys.argv[1]
here = Path(__file__).resolve().parent
raw = here / 'keys' / f'{shot}.raw.jpg'
orig = here / 'keys' / f'{shot}.raw.orig.jpg'
if not orig.exists():
    orig.write_bytes(raw.read_bytes())
img = cv2.imread(str(orig))
mask = np.zeros(img.shape[:2], np.uint8)
for x0, y0, x1, y1 in REGIONS[shot]:
    cv2.rectangle(mask, (x0, y0), (x1, y1), 255, -1)
out = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
cv2.imwrite(str(raw), out, [cv2.IMWRITE_JPEG_QUALITY, 95])
x0, y0, zw, zh = ZOOM[shot]
cv2.imwrite(str(here / f'{shot}-clean-zoom.jpg'), out[y0:y0 + zh, x0:x0 + zw])
print('cleaned', shot, len(REGIONS[shot]), 'regions')
