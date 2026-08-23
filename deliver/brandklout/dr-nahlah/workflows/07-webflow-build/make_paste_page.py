"""Build a Webflow paste page from an ALREADY-PROCESSED payload.

`html_to_webflow.py --copy-page` writes the page straight after conversion, so
it cannot be used for payloads that were post-processed (e.g. run through
`webflow-clientfirst > resolve_fluid` to turn clamp() into per-breakpoint px).
This wraps the same, proven `write_copy_page` around any payload file.

Do NOT hand-roll a copy page. Two things must be exactly right and both are easy
to get wrong:

1. **MIME type** — the payload has to reach the clipboard under
   `application/json`, which is what Webflow's paste handler reads. Only the
   `document.execCommand('copy')` + `copy`-event path can set that flavour; the
   async Clipboard API cannot (without a `web ` prefix), so a page that uses
   `navigator.clipboard.write` with `text/plain` produces
   "the clipboard is empty" in the Designer.
2. **`</script>` escaping** — a payload containing script embeds carries the
   literal `</script>` inside `meta.html`, which terminates the host
   `<script type="application/json">` block and silently truncates the JSON.
   `write_copy_page` escapes `</` to `<\\/`; JSON reads `\\/` as `/`, so it
   round-trips.

Usage:
    python make_paste_page.py --payload .tmp/final/transformation.json \\
                              --out .tmp/paste-transformation.html
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from html_to_webflow import write_copy_page


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--payload", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    payload = json.loads(Path(args.payload).read_text(encoding="utf-8"))
    write_copy_page(json.dumps(payload, separators=(",", ":")), args.out)

    # Verify the generated page the way a browser would read it: pull the
    # payload block back out of the HTML and parse it.
    html = Path(args.out).read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="payload">([\s\S]*?)</script>', html)
    if not m:
        raise SystemExit("ERROR: payload block missing from generated page")
    parsed = json.loads(m.group(1))

    styles = parsed["payload"]["styles"]
    nodes = parsed["payload"]["nodes"]
    embeds = [n for n in nodes if n.get("type") == "HtmlEmbed"]
    fns = sum(1 for s in styles
              if re.search(r"\b(clamp|calc|min|max)\(", s.get("styleLess") or ""))

    print(f"wrote {args.out} ({Path(args.out).stat().st_size // 1024} KB)")
    print(f"  round-trips        : yes")
    print(f"  type               : {parsed.get('type')}")
    print(f"  styles/nodes/embeds: {len(styles)} / {len(nodes)} / {len(embeds)}")
    print(f"  CSS functions left : {fns}" + ("  <- should be 0" if fns else ""))
    has_json = "setData('application/json'" in html
    print(f"  application/json   : {has_json}")


if __name__ == "__main__":
    main()
