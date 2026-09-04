import os, posixpath
from PIL import Image
root = 'google-drive-images'
rows = []
for r, d, fs in os.walk(root):
    for f in fs:
        if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.avif')):
            continue
        p = os.path.join(r, f)
        rel = os.path.relpath(p, root).replace(os.sep, '/')
        try:
            im = Image.open(p)
            rows.append((im.width * im.height, im.width, im.height, os.path.getsize(p) // 1024, rel))
        except Exception:
            rows.append((0, 0, 0, 0, rel + '  ERR'))
rows.sort(reverse=True)
print('total images:', len(rows))
print('  >=1600w:', sum(1 for x in rows if x[1] >= 1600))
print('  1200-1599w:', sum(1 for x in rows if 1200 <= x[1] < 1600))
print('  800-1199w:', sum(1 for x in rows if 800 <= x[1] < 1200))
print('  <800w:', sum(1 for x in rows if x[1] < 800))
print()
for a, w, h, kb, p in rows[:40]:
    print(f'{w}x{h}\t{kb}KB\t{p}')
