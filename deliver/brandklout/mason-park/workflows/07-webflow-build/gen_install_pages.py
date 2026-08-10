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


GSAP_CDN = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/{}.min.js"


def _read(folder: str, name: str) -> str:
    p = os.path.join(folder, name)
    return open(p, encoding="utf-8").read().strip() if os.path.exists(p) else ""


def gen(folder: str) -> None:
    css = _read(folder, "webflow-runtime-states.css")
    js = _read(folder, "webflow-custom-code.js")
    head_js = _read(folder, "webflow-custom-code-head.js")

    # GSAP LOADS in the HEAD, exactly where the source design loads it, and is
    # REGISTERED in the footer. Those are two different things and conflating
    # them breaks the page silently:
    #   - loading in the head is required because the bootstrap (also head)
    #     and the inline section embeds test for `window.gsap`. Deferring the
    #     library to the footer made `WZ.ok` false forever, so the flush took
    #     its "GSAP missing" branch, revealed the content and returned — every
    #     animation on all nine chapters silently never ran, on a page that
    #     looked perfectly fine (verified live 2026-07-30).
    #   - registering must stay in the footer: ScrollTrigger initialises
    #     against document.body, and registering before body exists leaves
    #     ScrollSmoother to die in getScrollFunc.
    # All plugins are free as of GSAP 3.13, so no Club token is needed.
    manifest = os.path.join(folder, "animation-manifest.json")
    plugins: list[str] = []
    if os.path.exists(manifest):
        import json
        ext = json.load(open(manifest, encoding="utf-8")).get(
            "externalScripts", [])
        seen = set()
        for src in ext:
            base = os.path.basename(src).replace(".min.js", "")
            if "gsap" in src.lower() and base not in seen:
                seen.add(base)
                plugins.append(base)
    gsap_tags = "\n".join(f'<script src="{GSAP_CDN.format(p)}"></script>'
                          for p in plugins)

    # BOTH pages use the textarea holder. A `<script type="text/plain">` holder
    # cannot carry head code that itself contains a `<script>` block: the HTML
    # parser ends the holder at the first literal `</script>`, silently
    # truncating what gets copied — the same trap that truncated the clipboard
    # payload. html.escape() into a <textarea> has no such failure mode.
    head_parts = []
    # GSAP first — the bootstrap immediately below tests for window.gsap.
    if gsap_tags:
        head_parts.append(gsap_tags)
    if head_js:
        # The bootstrap the body's inline section embeds call into. It MUST be
        # in the head slot: the embeds run mid-parse, so a footer-installed
        # bootstrap is defined too late and every chapter throws
        # "WZ is not defined" (verified by simulate_paste.mjs, 2026-07-30).
        head_parts.append("<script>\n" + head_js + "\n</script>")
    if css:
        head_parts.append("<style>\n" + css + "\n</style>")
    head = FOOTER_TMPL.format(
        js_escaped=html.escape("\n".join(head_parts), quote=False)
    ).replace("Copy FOOTER", "Copy HEAD").replace("Install FOOTER", "Install HEAD")

    js_wrapped = js if js.lstrip().startswith("<script") \
        else "<script>\n" + js + "\n</script>"
    footer = FOOTER_TMPL.format(js_escaped=html.escape(js_wrapped, quote=False))

    with open(os.path.join(folder, "install-head.html"), "w",
              encoding="utf-8") as f:
        f.write(head)
    with open(os.path.join(folder, "install-footer.html"), "w",
              encoding="utf-8") as f:
        f.write(footer)
    print(f"{folder}: install-head.html ({len(head)}b, "
          f"{len(plugins)} gsap tags + {'bootstrap+' if head_js else ''}state-css) + "
          f"install-footer.html ({len(footer)}b, register+flush+page code)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python gen_install_pages.py <wholepage-folder> [...]")
    for folder in sys.argv[1:]:
        gen(folder)
