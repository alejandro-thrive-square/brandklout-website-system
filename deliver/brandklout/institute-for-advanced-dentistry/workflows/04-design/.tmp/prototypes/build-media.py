#!/usr/bin/env python
"""Rebuilds prototypes/home/media/ — every file in it is gitignored, so a fresh worktree has none.

Run from the repository root, after the Drive pulls below (python -m pip install pillow; ffmpeg on PATH):

  D=deliver/brandklout/institute-for-advanced-dentistry/workflows/03-graphic-resources/.tmp/drive
  node scripts/drive.mjs thumbs 1yONELejHTZTKQQFLeEdDns8Kaw0K1REh $D/web/dr-portrait  --size 2000
  node scripts/drive.mjs thumbs 1i7wNK1MiMsGbeiE9yRuVpAspnLnxIGUW $D/web/office       --size 2000
  node scripts/drive.mjs thumbs 1fOGFqibJA3DljhoAK416qtm5y-yknMXs $D/web/interactions --size 2000
  node scripts/drive.mjs thumbs 1QENhf2fiBbF5MEsT7VvDcmh92z3x2YDX $D/web/technology   --size 2000
  node scripts/drive.mjs thumbs 1H6lxMNNPTQ_WJjxY3-Paf0K3E26UlPJa $D/web/pt-helen     --size 2000
  node scripts/drive.mjs thumbs 1HtvFpKXN1NYLJQ_zPkUNdrP2OR90lhXV $D/web/pt-mark      --size 2000
  node scripts/drive.mjs thumbs 1K_CgajRl0wF-84oeXDtIqAtq4NKiXYPZ $D/web/pt-lisa      --size 2000
  node scripts/drive.mjs thumbs 1umjG6pMqo9zPUsFXFmLIBKIzCVUtpnGq $D/web/pt-philip    --size 2000
  node scripts/drive.mjs thumbs 1iRdJMV3JNkUlQe4KrdMJ8KdYpfcY85fc $D/web/case-lori    --size 2000
  node scripts/drive.mjs pull   1tq9mHGZw4i4zEDr7tFilLXErAInv3YwP $D/logo-png
  node scripts/drive.mjs get    1-KV6rPkvi0WjIRfZL8Uzcp3ZDezf3aLq $D/broll        # Web Broll_Main.mp4
  # BugHerd round 1 (2026-09-23): the four photos the reviewer named, by file name on the Drive
  node scripts/drive.mjs get    1C4H1JSvrt5jOZa7H_36II6k3d86QEChd $D/bugherd-r1   # DSC_3137.jpg
  node scripts/drive.mjs get    1DnJlQrQqX4NADmKPmepjzWwjis2y97jK $D/bugherd-r1   # DSC_3102.jpg
  node scripts/drive.mjs get    1O8GyXcKwtRrcWBkbRjDj8CsRJC-Whmk6 $D/bugherd-r1   # DSC_3084-Edit.jpg
  node scripts/drive.mjs get    1l_-Q-JAoNA5UORXFHxGBBo5BACgViANz $D/bugherd-r1   # Using technology to create smiles.png

  python deliver/brandklout/institute-for-advanced-dentistry/workflows/04-design/.tmp/prototypes/build-media.py

The four patient stories come from the intake scrape (media-library/vimeo); rebuild that with
01-content-intake's scrapers/vimeo.mjs if it is missing.
"""
import glob
import os
import subprocess

from PIL import Image, ImageEnhance

WF = 'deliver/brandklout/institute-for-advanced-dentistry/workflows/'
D = WF + '03-graphic-resources/.tmp/drive/'
W = D + 'web/'
ML = WF + '01-content-intake/.tmp/current-site-scrape/media-library/'
M = WF + '04-design/.tmp/prototypes/home/media/'
os.makedirs(M, exist_ok=True)


def shot(folder, n):
    return f'{W}{folder}/Bensoussan_Photos-{n}.jpg'


PHOTOS = {
    'q-cbct.jpg': (shot('interactions', 47), 1600),
    'disc-cosmetic.jpg': (W + 'case-lori/DSC_4232.jpg', 1400),
    'disc-implant.jpg': (shot('interactions', 81), 1400),
    'dr-portrait.jpg': (shot('dr-portrait', 165), 1600),
    'dr-wall.jpg': (shot('dr-portrait', 174), 1400),
    'dr-model.jpg': (shot('interactions', 43), 1400),
    'path-1.jpg': (shot('interactions', 39), 1200),
    'path-2.jpg': (shot('technology', 27), 1200),
    'path-3.jpg': (shot('interactions', 43), 1200),
    'path-4.jpg': (shot('interactions', 92), 1200),
    'path-5.jpg': (shot('interactions', 87), 1200),
    'path-6.jpg': (shot('interactions', 141), 1200),
    'pt-helen.jpg': (shot('pt-helen', 32), 1200),
    'pt-mark.jpg': (shot('pt-mark', 57), 1200),
    'pt-lisa.jpg': (shot('pt-lisa', 105), 1200),
    'pt-philip.jpg': (shot('pt-philip', 119), 1200),
    'office-wall.jpg': (shot('office', 196), 1600),
    'office-lounge.jpg': (shot('office', 191), 1600),
    'office-door.jpg': (shot('office', 198), 1200),
    # BugHerd round 1: new NAMES, not overwrites. Instatic's media upload skips a file whose basename
    # it already holds, so a replaced photo under the old name would keep serving the old one.
    'dr-lab.jpg': (D + 'bugherd-r1/DSC_3137.jpg', 1400),
    'path-3-lab.jpg': (D + 'bugherd-r1/DSC_3102.jpg', 1200),
    'path-4-print.jpg': (D + 'bugherd-r1/DSC_3084-Edit.jpg', 1200),
    'path-6-design.jpg': (D + 'bugherd-r1/Using technology to create smiles.png', 964),
}
for out, (src, width) in PHOTOS.items():
    im = Image.open(src).convert('RGB')
    im.thumbnail((width, width))
    im.save(M + out, quality=80, optimize=True, progressive=True)


def aligned(src, cx, cy, cw, out):
    """Before and after are cropped so the mouth lands on the same pixels, and both get the SAME
    exposure lift. Nothing is retouched; the clinical originals are simply underexposed."""
    im = Image.open(src).convert('RGB')
    ch = cw * 10 / 16
    im = im.crop((int(cx - cw / 2), int(cy - .55 * ch), int(cx + cw / 2), int(cy + .45 * ch))).resize((1600, 1000), Image.LANCZOS)
    ImageEnhance.Brightness(im).enhance(1.22).save(M + out, quality=82, optimize=True, progressive=True)


aligned(W + 'case-lori/DSC_3795.jpg', 950, 786, 1667, 'design-before.jpg')
aligned(W + 'case-lori/DSC_4225.jpg', 980, 693, 1909, 'design-after.jpg')

for src, out in [('aacd-logo.png', 'aff-aacd.png'), ('acp-logo.png', 'aff-acp.png'), ('ada-logo.png', 'aff-ada.png'),
                 ('az-dental-association-logo-e1749057494815.png', 'aff-azda.png'), ('osseo_logo-e1749057600601.png', 'aff-ao.png'),
                 ('pcsp_logo.png', 'aff-pcsp.png'), ('TopDentists2025.png', 'top-dentists-2025.png'),
                 ('carecredit-logo.png', 'fin-carecredit.png'), ('proceed-finance-logo.png', 'fin-proceed.png'),
                 ('alphaeon-credit-logo.png', 'fin-alphaeon.png')]:
    Image.open(ML + src).save(M + out)

# Logo: the supplied transparent PNG is grey-on-light. The dark-ground variant lifts only the
# neutral pixels (lettering and the silver half of the mark) and leaves the gold alone.
logo = Image.open(D + 'logo-png/Insitute-for-Advance-Dentistry.png').convert('RGBA')
logo = logo.crop(logo.getchannel('A').getbbox())
logo.save(M + 'logo-color.png')
dark = logo.copy()
src_px, dark_px = logo.load(), dark.load()
for y in range(logo.height):
    for x in range(logo.width):
        r, g, b, a = src_px[x, y]
        if a and max(r, g, b) - min(r, g, b) < 28:
            v = min(255, int(178 + (r + g + b) // 3 * .42))
            dark_px[x, y] = (v, v, min(255, v + 2), a)
dark.save(M + 'logo-dark.png')
mark = Image.open(D + 'logo-png/Insitute-for-Advance-Dentistry-Logo-Only.png').convert('RGBA')
mark = mark.crop(mark.getchannel('A').getbbox())
mark.thumbnail((400, 400))
mark.save(M + 'logo-mark.png')


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


broll = D + 'broll/Web Broll_Main.mp4'
ff('-i', broll, '-an', '-vf', 'scale=1600:-2', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', M + 'hero.mp4')
ff('-i', broll, '-an', '-vf', 'scale=720:-2', '-c:v', 'libx264', '-crf', '29', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', M + 'hero-sm.mp4')
ff('-ss', '0.2', '-i', broll, '-frames:v', '1', '-vf', 'scale=1600:-2', '-q:v', '4', M + 'hero-poster.jpg')
for tag, name in [('Helens', 'helen'), ('Marks', 'mark'), ('Lisas', 'lisa'), ('Philips', 'philip')]:
    src = glob.glob(f'{ML}vimeo/*-{tag}-Testimonial*.mp4')[0]
    ff('-i', src, '-vf', 'scale=960:-2', '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart', f'{M}story-{name}.mp4')
print('media rebuilt in', M)
