#!/usr/bin/env python3
"""Generate turnkey 'install' copy-pages for a wholepage build folder.

The whole-page converter writes raw `webflow-runtime-states.css` (head) and
`webflow-custom-code.js` (footer). To install them you must wrap the CSS in
`<style>` and the JS in `<script>` and paste into the Webflow page's custom
code slots. This script produces two text/plain copy-pages — install-head.html
and install-footer.html — that hold the correctly-wrapped, copy-ready code
(same format as the verified sell-wholepage install pages).

Usage:
  python gen_install_pages.py .tmp/index-wholepage [.tmp/invest-wholepage ...]
"""
import html
import os
import sys

HEAD_TMPL = """<!doctype html><html><head><meta charset="utf-8"><title>Install HEAD</title>
<style>body{{font:14px system-ui;margin:2rem;max-width:760px}}button{{font-size:1.05rem;padding:.8rem 1.4rem;background:#1463ff;color:#fff;border:0;border-radius:.4rem;cursor:pointer}}.ok{{color:#0a7d28;font-weight:600;margin-left:1rem}}pre{{background:#f5f5f7;padding:1rem;border-radius:.4rem;max-height:300px;overflow:auto;white-space:pre-wrap;font-size:12px}}</style>
</head><body>
<h2>Copy HEAD code (text/plain)</h2>
<p><button id="b">Copy HEAD</button><span id="s"></span></p>
<pre id="p"></pre>
<script id="d" type="text/plain"><style>
{css}
</style>
</script>
<script>
const t=document.getElementById('d').textContent;
document.getElementById('p').textContent=t;
document.getElementById('b').addEventListener('click',()=>{{
  const h=ev=>{{ev.preventDefault();ev.clipboardData.setData('text/plain',t);}};
  document.addEventListener('copy',h);
  const ok=document.execCommand('copy');
  document.removeEventListener('copy',h);
  const s=document.getElementById('s');
  s.textContent= ok ? '✓ Copied '+t.length+' chars' : 'Copy failed';
  s.className= ok ? 'ok':'';
}});
</script></body></html>"""

FOOTER_TMPL = """<!doctype html><html><head><meta charset="utf-8"><title>Install FOOTER</title>
<style>body{{font:14px system-ui;margin:2rem;max-width:760px}}button{{font-size:1.05rem;padding:.8rem 1.4rem;background:#1463ff;color:#fff;border:0;border-radius:.4rem;cursor:pointer}}.ok{{color:#0a7d28;font-weight:600;margin-left:1rem}}textarea{{width:100%;height:280px;font:12px monospace;margin-top:1rem}}</style>
</head><body>
<h2>Copy FOOTER code (textarea holder)</h2>
<p><button id="b">Copy FOOTER</button><span id="s"></span></p>
<textarea id="d" readonly>{js_escaped}</textarea>
<script>
const t=document.getElementById('d').value;
document.getElementById('b').addEventListener('click',()=>{{
  const h=ev=>{{ev.preventDefault();ev.clipboardData.setData('text/plain',t);}};
  document.addEventListener('copy',h);
  const ok=document.execCommand('copy');
  document.removeEventListener('copy',h);
  const s=document.getElementById('s');
  s.textContent= ok ? '✓ Copied '+t.length+' chars' : 'Copy failed';
  s.className= ok ? 'ok':'';
}});
</script></body></html>"""


def gen(folder: str) -> None:
    css = open(os.path.join(folder, "webflow-runtime-states.css"),
               encoding="utf-8").read().strip()
    js = open(os.path.join(folder, "webflow-custom-code.js"),
              encoding="utf-8").read().strip()

    head = HEAD_TMPL.format(css=css)
    # footer textarea holds an HTML-escaped <script>...</script> wrapper
    js_wrapped = "<script>\n" + js + "\n</script>"
    footer = FOOTER_TMPL.format(js_escaped=html.escape(js_wrapped, quote=False))

    with open(os.path.join(folder, "install-head.html"), "w",
              encoding="utf-8") as f:
        f.write(head)
    with open(os.path.join(folder, "install-footer.html"), "w",
              encoding="utf-8") as f:
        f.write(footer)
    print(f"{folder}: install-head.html ({len(head)}b) + "
          f"install-footer.html ({len(footer)}b)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python gen_install_pages.py <wholepage-folder> [...]")
    for folder in sys.argv[1:]:
        gen(folder)
