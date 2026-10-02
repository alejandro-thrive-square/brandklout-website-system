"""
make-og-images.py — a dedicated 1200x630 share image for every indexable page
(QA 2026-09-28, C06: 10 pages below 1200x630, 26 posts on the uncropped photo;
on 2026-10-02 none of the 81 sitemap pages had a true 1200x630).

    python make-og-images.py .tmp/og-current.json .tmp/og        # crops + contact sheet

Source = the page's current og:image ORIGINAL (no -wNNN variant), except where
that original is under 1200x630; those pages take a larger photograph of the same
subject from the page itself (SOURCE_OVERRIDE). The 1.91:1 window is as large as
the photo allows and is centred on the detected faces (OpenCV frontal Haar,
opencv-python-headless < 5 still ships the cascades), else on the photo's
centre, biased slightly upward where people usually are. Output: <slug>.jpg,
q86 progressive, plus contact-sheet.jpg to review every crop at once.
"""
import json, os, sys, urllib.request
import cv2
import numpy as np

SRC_JSON, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129 Safari/537.36'}
BASE = 'https://www.drnahlah.com'
W, H = 1200, 630
SOURCE_OVERRIDE = {
    '/doctor-referral': '/uploads/dGHzWiUkSN74mbqzwtLBr-office-outside.jpg',
    '/five-year-warranty': '/uploads/MfwE83qggWWmZB84YhLOr-pt-hero-4.jpg',
    '/implant-cost': '/uploads/Uam4qX0ckWBg_7V5-bJYh-pt-interaction.jpg',
    '/implant-supported-dentures': '/uploads/MIRVGJdvuXIyjDE5FVBZX-pt-hero-1.jpg',
    '/meet-dr-nahlah': '/uploads/HYHKVrqYuA4_RP6EgDdVD-Dr_Nahlah.jpg',
    '/posts': '/uploads/Uam4qX0ckWBg_7V5-bJYh-pt-interaction.jpg',
    '/smile-makeover': '/uploads/bW-76Yaai4rZeVUk1tJT0-8L6A7602.jpg',
}
face = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def fetch(path):
    url = path if path.startswith('http') else BASE + path
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)
    if img.ndim == 3 and img.shape[2] == 4:  # flatten transparency onto white
        a = img[:, :, 3:4] / 255.0
        img = (img[:, :, :3] * a + 255 * (1 - a)).astype(np.uint8)
    return img

def crop(img):
    h, w = img.shape[:2]
    small = cv2.resize(img, (800, int(800 * h / w))) if w > 800 else img
    k = w / small.shape[1]
    g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    faces = face.detectMultiScale(g, 1.1, 6, minSize=(int(small.shape[1] * .04),) * 2)
    if w / h > W / H:   # wider than 1.91: full height, choose x
        cw, ch = int(h * W / H), h
    else:               # taller: full width, choose y
        cw, ch = w, int(w * H / W)
    if len(faces):
        cx = np.mean([(x + fw / 2) * k for x, y, fw, fh in faces])
        cy = np.mean([(y + fh / 2) * k for x, y, fw, fh in faces])
    else:
        cx, cy = w / 2, h * .42
    x0 = int(min(max(cx - cw / 2, 0), w - cw))
    y0 = int(min(max(cy - ch * .45, 0), h - ch))
    out = cv2.resize(img[y0:y0 + ch, x0:x0 + cw], (W, H), interpolation=cv2.INTER_AREA)
    return out, len(faces)

pages = json.load(open(SRC_JSON))
done, sheet = {}, []
for p in pages:
    path = p['path']
    src = SOURCE_OVERRIDE.get(path) or p['img'].replace(BASE, '')
    import re
    src = re.sub(r'-w\d+(\.\w+)$', r'\1', src)
    if src not in done:
        done[src] = fetch(src)
    img = done[src]
    if img.shape[1] < W or img.shape[0] < H:
        print(f'SMALL SOURCE {path} {img.shape[1]}x{img.shape[0]}'); continue
    out, nf = crop(img)
    slug = 'home' if path == '/' else path.strip('/').replace('/', '--')
    cv2.imwrite(os.path.join(OUT, slug + '.jpg'), out, [cv2.IMWRITE_JPEG_QUALITY, 86, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
    sheet.append((slug, out, nf))
    print(f'{path:70} faces={nf} src={src.split("/")[-1][:50]}')

# contact sheet: 6 across, 300x158 thumbs with labels
tw, th, cols = 300, 158, 6
rows = (len(sheet) + cols - 1) // cols
cs = np.full((rows * (th + 18), cols * tw, 3), 255, np.uint8)
for i, (slug, im, nf) in enumerate(sheet):
    r, c = divmod(i, cols)
    cs[r * (th + 18):r * (th + 18) + th, c * tw:(c + 1) * tw] = cv2.resize(im, (tw, th))
    cv2.putText(cs, f'{slug[:40]} f{nf}', (c * tw + 2, r * (th + 18) + th + 13), cv2.FONT_HERSHEY_SIMPLEX, .33, (0, 0, 0), 1)
cv2.imwrite(os.path.join(OUT, 'contact-sheet.jpg'), cs, [cv2.IMWRITE_JPEG_QUALITY, 80])
print(f'{len(sheet)} images, contact sheet {cs.shape[1]}x{cs.shape[0]}')
