"""Strip the preview-chrome reset <style> from the cosmetic-dentistry landing
page so the converter's cascade resolver only sees rules that apply inside
.page_cosmetic. This page ships its own header/footer (stand-alone landing
page, not in the main site nav), so unlike page-no-prep-veneers.html there is
no nav/footer element to remove -- only the head reset stylesheet.
Regenerate with:  python .tmp/prep_source_cosmetic.py
"""
import io, re, os, sys

SRC = "../04-design/.tmp/final-design/livewell-cosmetic-dentistry-landing.html"
OUT = ".tmp/page-cosmetic/source.html"

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)                       # 07-webflow-build/
src = os.path.normpath(os.path.join(root, SRC))
out = os.path.normpath(os.path.join(root, OUT))

html = io.open(src, encoding="utf-8").read()
before = len(html)

html, n1 = re.subn(r'<style data-preview-chrome>.*?</style>\s*', '', html, flags=re.S)

if not n1:
    sys.exit("prep failed: preview-chrome marker not found")
if '<div class="page_cosmetic">' not in html:
    sys.exit("prep failed: .page_cosmetic root missing")

os.makedirs(os.path.dirname(out), exist_ok=True)
io.open(out, "w", encoding="utf-8").write(html)
print("wrote %s  (%d -> %d bytes, chrome stripped)" % (OUT, before, len(html)))
