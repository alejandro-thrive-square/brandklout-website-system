import os
from PIL import Image, ImageDraw, ImageOps
D = os.path.dirname(os.path.abspath(__file__))
fs = sorted(f for f in os.listdir(D) if f.lower().endswith(('.jpg', '.jpeg')))
W, H, C = 420, 300, 4
for i in range(0, len(fs), 12):
    grp = fs[i:i+12]
    sheet = Image.new('RGB', (W*C, (H+24)*((len(grp)+C-1)//C)), 'white')
    d = ImageDraw.Draw(sheet)
    for j, f in enumerate(grp):
        im = ImageOps.exif_transpose(Image.open(os.path.join(D, f))).convert('RGB')
        sz = im.size
        im.thumbnail((W-6, H-6))
        x, y = (j % C)*W, (j//C)*(H+24)
        sheet.paste(im, (x+3, y+3))
        d.text((x+4, y+H+4), f"{f[:28]} {sz[0]}x{sz[1]}", fill='black')
    sheet.save(os.path.join(D, 'sheets', f'sheet{i//12}.jpg'), quality=80)
print(len(fs))
