import glob, os
from PIL import Image, ImageDraw
paths = sorted(glob.glob('google-drive-images/img/*.jpg') + glob.glob('google-drive-images/img/*.png'))
COLS, TW, TH = 5, 340, 200
rows = (len(paths) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * TW, rows * (TH + 16)), (250, 249, 246))
dr = ImageDraw.Draw(sheet)
for i, p in enumerate(paths):
    im = Image.open(p).convert('RGB')
    w, h = im.size
    im.thumbnail((TW - 8, TH - 8))
    x, y = (i % COLS) * TW, (i // COLS) * (TH + 16)
    sheet.paste(im, (x + 4, y + 4))
    dr.text((x + 4, y + TH + 2), f'{i:02d} {os.path.basename(p)[:32]} {w}x{h}', fill=(20, 20, 20))
sheet.save('contact-sheet-3.png')
print(f'{len(paths)} -> contact-sheet-3.png')
for i, p in enumerate(paths):
    im = Image.open(p)
    print(f'{i:02d} {im.width}x{im.height} {os.path.basename(p)}')
