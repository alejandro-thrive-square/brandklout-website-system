# Paste back only the trousers from the model's edit onto the original frame.
# python composite.py <orig> <edit> <out> <xmax_fraction> <ymin_fraction>
# The mask is the region that is dark in the edit, left of xmax and below ymin,
# closed so it has no holes (a holey mask leaves a ghost of the floral print).
import sys
from PIL import Image, ImageChops, ImageFilter
o = Image.open(sys.argv[1]).convert('RGB'); e = Image.open(sys.argv[2]).convert('RGB').resize(o.size, Image.LANCZOS)
xmax, ymin = float(sys.argv[4]), float(sys.argv[5])
W, H = o.size
dark = e.convert('L').point(lambda v: 255 if v < 85 else 0)
box = Image.new('L', o.size, 0); box.paste(255, (0, int(H * ymin), int(W * xmax), H))
m = ImageChops.multiply(dark, box)
small = m.resize((W // 4, H // 4))
small = small.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11))  # close holes
small = small.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))    # drop specks
m = ImageChops.multiply(small.resize(o.size, Image.BILINEAR).point(lambda v: 255 if v > 127 else 0), box)
m = m.filter(ImageFilter.GaussianBlur(3))
out = Image.composite(e, o, m); out.save(sys.argv[3], quality=94)
t = out.copy(); t.thumbnail((900, 900)); t.save(sys.argv[3].replace('.jpg', '-thumb.jpg'))
mt = m.copy(); mt.thumbnail((450, 450)); mt.save(sys.argv[3].replace('.jpg', '-mask-thumb.png'))
