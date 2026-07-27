"""Generate clipboard-helper pages for pasting custom code into Webflow.

Reads the per-page runtime-states.css and custom-code.js, wraps them in the
<style>/<script> tags Webflow's custom-code fields expect, and writes two tiny
HTML pages whose button copies the wrapped text to the clipboard (text/plain) —
the same trusted-gesture copy mechanism the paste pages use. Loaded over the
local http server, then Ctrl+V into the Webflow code field.
"""
import html
import sys
from pathlib import Path

page = sys.argv[1] if len(sys.argv) > 1 else "index"
base = Path(".tmp") / page

TEMPLATE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Copy {label}</title></head>
<body style="font:15px/1.5 system-ui,sans-serif;max-width:680px;margin:3rem auto;padding:0 1rem">
<h1>Copy {label}</h1>
<p>Click, then focus the Webflow code field and press Ctrl/Cmd+V.</p>
<button id="btn" style="font-size:1.1rem;padding:.9rem 1.6rem;border:0;border-radius:.5rem;background:#1463ff;color:#fff;cursor:pointer">Copy to clipboard</button>
<span id="status" style="margin-left:1rem;font-weight:600"></span>
<textarea id="payload" style="position:absolute;left:-9999px;top:-9999px">{content}</textarea>
<script>
const txt=document.getElementById('payload').value;
document.getElementById('btn').addEventListener('click',()=>{{
  const h=(e)=>{{e.preventDefault();e.clipboardData.setData('text/plain',txt);}};
  document.addEventListener('copy',h);
  const ok=document.execCommand('copy');
  document.removeEventListener('copy',h);
  const s=document.getElementById('status');
  s.textContent=ok?('\\u2713 Copied '+txt.length+' chars'):'copy failed';
}});
</script>
</body></html>
"""

def make(src_name, wrap_open, wrap_close, label, out_name):
    raw = (base / src_name).read_text(encoding="utf-8")
    wrapped = f"{wrap_open}\n{raw}\n{wrap_close}"
    out = TEMPLATE.format(label=label, content=html.escape(wrapped))
    (base / out_name).write_text(out, encoding="utf-8")
    print(f"wrote {base / out_name}  ({len(wrapped)} chars wrapped)")

make("webflow-runtime-states.css", "<style>", "</style>", "HEAD CSS (style)", "copy-head-css.html")
make("webflow-custom-code.js", "<script>", "</script>", "FOOTER JS (script)", "copy-footer-js.html")
