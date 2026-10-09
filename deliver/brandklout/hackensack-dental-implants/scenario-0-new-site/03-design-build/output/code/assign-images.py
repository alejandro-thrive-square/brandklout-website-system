# Client script, 2026-10-09. Applies photo assignments to the page slots.
# code/image-assign.json: { "<slot file>": { "from", "size": [w, h], "alt", "shows", "source",
#   "licence", "fit", "focus"?, "box"?, "pages"? } | { "drop": true } }
# For each slot it (1) upserts the row in code/images.json, (2) rewrites the slot in every page module
# (`src: '<slot>', w: .., h: .., alt: '..'`) to the cut size and the alt of the photo actually placed,
# and (3) for "drop", removes the `image: {...}` (or `{ src ... }` list item) from the module, so the
# component renders without it. Run cut-images.py afterwards.
# Usage (from the step's output/ folder): python code/assign-images.py
import glob
import json
import re
from pathlib import Path

OUT = Path(__file__).resolve().parents[1]
PAGES = OUT / "code" / "site-src" / "pages"
assign = json.loads((OUT / "code" / "image-assign.json").read_text(encoding="utf-8"))
rows = json.loads((OUT / "code" / "images.json").read_text(encoding="utf-8"))
by_out = {r["out"]: r for r in rows}


def js_str(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


touched = set()
for slot, a in assign.items():
    alt = r"""alt: (?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")"""
    pat = re.compile(r"src: '" + re.escape(slot) + r"', w: \d+, h: \d+, " + alt)
    if a.get("drop"):
        drop_image = re.compile(r",?\s*image: \{ src: '" + re.escape(slot) + r"', w: \d+, h: \d+, " + alt + r" \}")
        for f in glob.glob(str(PAGES / "**" / "*.mjs"), recursive=True):
            s = Path(f).read_text(encoding="utf-8")
            n = drop_image.sub("", s)
            if n != s:
                Path(f).write_text(n, encoding="utf-8", newline="\n")
                touched.add(Path(f).name)
        by_out.pop(slot, None)
        continue
    w, h = a["size"]
    row = {"out": slot, "from": a["from"], "size": [w, h], "shows": a.get("shows", a["alt"]), "pages": a.get("pages", ""),
           "source": a.get("source", a["from"].split("/")[0]), "licence": a.get("licence", "client's own"), "fit": a.get("fit", 3)}
    for k in ("focus", "box", "asis", "q"):
        if k in a:
            row[k] = a[k]
    by_out[slot] = row
    for f in glob.glob(str(PAGES / "**" / "*.mjs"), recursive=True):
        s = Path(f).read_text(encoding="utf-8")
        n = pat.sub(f"src: '{slot}', w: {w}, h: {h}, alt: '{js_str(a['alt'])}'", s)
        if n != s:
            Path(f).write_text(n, encoding="utf-8", newline="\n")
            touched.add(Path(f).name)
(OUT / "code" / "images.json").write_text(json.dumps(list(by_out.values()), indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(assign)} assignment(s); modules touched: {', '.join(sorted(touched)) or 'none'}")
