"""Parse Checklist_FR_actualizaciones_ES.md into exact-byte text records.

Usage: python parse_checklist.py <checklist.md> <out.json>

Emits one record per checklist item with the verbatim source bytes of the
TEXTO ACTUAL and NUEVO TEXTO blocks. Nothing is retyped anywhere downstream --
set_text payloads are read from this file so accents, apostrophe variants and
double spaces survive untouched.

Markdown escaping applied by the doc converter (\\#, \\+, \\-, \\. after digits)
is reversed, because those backslashes are not part of the French text.
"""
import json
import re
import sys

ITEM_RE = re.compile(r"^\u2610\s+\*\*(.+?)\*\*\s*$")
PAGE_RE = re.compile(r"^##\s+\*\*(.+?)\*\*\s+\*(.+?)\*\s*$")
PART_RE = re.compile(r"^#\s+\*\*(Parte \d+.*?)\*\*\s*$")

CUR_MARK = "**TEXTO ACTUAL (franc\u00e9s) \u2014 NO traducir:**"
NEW_MARK = "**NUEVO TEXTO (franc\u00e9s) \u2014 pegar EXACTAMENTE:**"
DEL_MARK = "**TEXTO A ELIMINAR (franc\u00e9s):**"


def unescape(s):
    """Undo the markdown backslash escaping the doc export introduced."""
    return re.sub(r"\\([#+\-.\u00ab\u00bb])", r"\1", s)


def payload(line, mark):
    """Return the text after a marker, preserving internal spacing exactly."""
    body = line[len(mark):]
    # the exporter puts exactly two spaces after the marker; strip only those
    if body.startswith("  "):
        body = body[2:]
    return unescape(body.rstrip("\n"))


def main():
    src, out = sys.argv[1], sys.argv[2]
    lines = open(src, encoding="utf-8").read().split("\n")

    records = []
    part = page = page_url = None
    cur = None

    for line in lines:
        m = PART_RE.match(line)
        if m:
            part = m.group(1)
            continue
        m = PAGE_RE.match(line)
        if m:
            page, page_url = m.group(1).strip(), m.group(2).strip()
            continue
        m = ITEM_RE.match(line)
        if m:
            cur = {
                "part": part,
                "page": page,
                "page_url": page_url,
                "item": unescape(m.group(1).strip()),
                "current_text": None,
                "new_text": None,
                "delete_text": None,
                "notes": [],
            }
            records.append(cur)
            continue
        if cur is None:
            continue
        if line.startswith(CUR_MARK):
            cur["current_text"] = payload(line, CUR_MARK)
        elif line.startswith(NEW_MARK):
            cur["new_text"] = payload(line, NEW_MARK)
        elif line.startswith(DEL_MARK):
            cur["delete_text"] = payload(line, DEL_MARK)
        elif line.startswith("*\u21b3") or line.startswith("*Para localizarlo"):
            cur["notes"].append(unescape(line.strip().strip("*")))

    with open(out, "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=1)

    print(f"{len(records)} checklist items parsed")
    for r in records:
        if r["part"] and r["part"].startswith("Parte 1") and not r["new_text"]:
            print(f"  WARN no NUEVO TEXTO: {r['item']}")


if __name__ == "__main__":
    main()
