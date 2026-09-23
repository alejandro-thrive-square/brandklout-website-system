"""Strip the preview chrome (nav, footer, chrome <style>) from the 04-design
package so the converter sees exactly one top-level root: .page_veneers.
Regenerate with:  python .tmp/prep_source.py
"""
import io, re, os, sys

SRC = "../04-design/.tmp/final-design/page-no-prep-veneers.html"
OUT = ".tmp/page-veneers/source.html"

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)                       # 07-webflow-build/
src = os.path.normpath(os.path.join(root, SRC))
out = os.path.normpath(os.path.join(root, OUT))

html = io.open(src, encoding="utf-8").read()
before = len(html)

# 1. the preview-only stylesheet
html, n1 = re.subn(r'<style data-preview-chrome>.*?</style>\s*', '', html, flags=re.S)
# 2. the site-wide nav component (preview chrome)
html, n2 = re.subn(r'<!-- =+ PREVIEW CHROME: site-wide Webflow nav =+ -->\s*<nav class="shell-nav">.*?</nav>\s*', '', html, flags=re.S)
# 3. the site-wide footer component (preview chrome)
html, n3 = re.subn(r'<!-- =+ PREVIEW CHROME: site-wide Webflow footer =+ -->\s*<footer class="shell-foot">.*?</footer>\s*', '', html, flags=re.S)

if not (n1 and n2 and n3):
    sys.exit("prep failed: chrome markers not found (style=%s nav=%s foot=%s)" % (n1, n2, n3))
if '<div class="page_veneers">' not in html:
    sys.exit("prep failed: .page_veneers root missing")
if 'shell-nav' in html or 'shell-foot' in html:
    sys.exit("prep failed: chrome residue left in source")

os.makedirs(os.path.dirname(out), exist_ok=True)
io.open(out, "w", encoding="utf-8").write(html)
print("wrote %s  (%d -> %d bytes, chrome stripped)" % (OUT, before, len(html)))
