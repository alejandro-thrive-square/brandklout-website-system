# Client script, 2026-10-09. Lists every image slot the built pages ask for (dist/**/*.html) and
# marks the ones media/img does not have yet, with the alt text the page carries.
# Usage (from the step's output/ folder): python code/image-slots.py [--missing]
import glob
import os
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1]
DIST = OUT / "code" / "site-src" / "dist"
IMG = OUT / "code" / "site-src" / "media" / "img"
have = set(os.listdir(IMG))
only_missing = "--missing" in sys.argv
uses = {}
for f in sorted(glob.glob(str(DIST / "**" / "*.html"), recursive=True)):
    page = Path(f).relative_to(DIST).as_posix()[:-5]
    html = Path(f).read_text(encoding="utf-8")
    for m in re.finditer(r'<img[^>]*src="/media/img/([^"]+)"[^>]*>', html):
        alt = re.search(r'alt="([^"]*)"', m.group(0))
        size = re.search(r'width="(\d+)" height="(\d+)"', m.group(0))
        uses.setdefault(m.group(1), []).append((page, alt.group(1) if alt else "", f"{size.group(1)}x{size.group(2)}" if size else "?"))
for name, us in sorted(uses.items()):
    missing = name not in have
    if only_missing and not missing:
        continue
    pages = ", ".join(sorted({u[0] for u in us}))
    print(f"{'MISSING ' if missing else 'ok      '}{name:<48} {us[0][2]:>10}  [{pages}]  {us[0][1][:120]}")
