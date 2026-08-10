#!/usr/bin/env python3
"""
build_hub.py — collect all six whole-page payloads into ONE copy page.

Six separate copy pages meant six files to find, in an order that matters,
with nothing on screen saying which had already been done. This is the same
mechanism — a copy handler writing the payload under `application/json`, which
is the MIME type Webflow's paste handler reads — with one button per page and
a record of what you have pasted.

It is one FILE, not one PASTE. The six pages stay six pastes: they are six
separate landing pages, and a payload with six roots is exactly the multi-root
shape that crashes the Designer.

  python build_hub.py
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAYLOAD = HERE / ".tmp" / "payload"
SECTIONS = HERE / ".tmp" / "sections"
OUT = PAYLOAD / "PASTE-ALL.html"

# Paste order: the page the client is most likely to want live first.
ORDER = ["implants", "aox", "veneers", "emergency", "dentist-near-me", "next-door"]
TITLE = {
    "implants": "Dental Implants",
    "aox": "All-on-X / Full Arch",
    "veneers": "Porcelain Veneers",
    "emergency": "Emergency Dentist",
    "dentist-near-me": "Dentist Near Me",
    "next-door": "Next Door / Family",
}


def extract(page: str) -> tuple[str, dict]:
    f = PAYLOAD / page / "whole" / "paste_00_full-page.html"
    src = f.read_text(encoding="utf-8")
    m = re.search(r'<script[^>]*id="payload"[^>]*>([\s\S]*?)</script>', src)
    if not m:
        raise SystemExit(f"no payload element in {f}")
    raw = m.group(1).strip()
    data = json.loads(raw.replace("<\\/", "</"))
    nodes = data["payload"]["nodes"]
    child = {c for n in nodes for c in (n.get("children") or [])}
    roots = [n for n in nodes if n["_id"] not in child]
    stats = {
        "roots": len(roots),
        "nodes": len(nodes),
        "embeds": sum(1 for n in nodes if n.get("type") == "HtmlEmbed"),
        "styles": len(data["payload"]["styles"]),
        "kb": round(len(raw) / 1024),
    }
    return raw, stats


cards, blobs = [], []
for i, page in enumerate(ORDER):
    if not (PAYLOAD / page / "whole" / "paste_00_full-page.html").exists():
        continue
    raw, st = extract(page)
    manifest = json.loads((SECTIONS / page / "manifest.json").read_text(encoding="utf-8"))
    warn = "" if st["roots"] == 1 else (
        f'<p class="bad">MULTI-ROOT ({st["roots"]}) — do not paste; '
        f'this is the shape that crashes the Designer.</p>')
    cards.append(f"""
  <article class="card" id="card-{page}">
    <div class="head">
      <span class="n">{i + 1}</span>
      <div>
        <h2>{html.escape(TITLE.get(page, page))}</h2>
        <p class="slug"><code>{page}</code></p>
      </div>
      <button data-page="{page}">Copy</button>
    </div>
    {warn}
    <p class="meta">{len(manifest)} blocks &middot; {st['nodes']} nodes &middot;
       {st['embeds']} embeds &middot; {st['styles']} classes (all empty) &middot; {st['kb']} KB</p>
    <p class="status" data-status="{page}"></p>
  </article>""")
    blobs.append(
        f'<script type="application/json" id="p-{page}">{raw.replace("</", "<\\/")}</script>')

OUT.write_text(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Arvada Dental Center — paste into Webflow</title>
<style>
  :root{{--bg:#0e1219;--card:#161c27;--line:#252d3b;--fg:#e8eef5;--dim:#9fb0c4;
         --cyan:#03c5ec;--amber:#fb8e28;--ok:#38d39f;--bad:#ff6b5b}}
  *{{box-sizing:border-box}}
  body{{margin:0;padding:2.5rem 1.25rem 5rem;background:var(--bg);color:var(--fg);
        font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}}
  .wrap{{max-width:760px;margin:0 auto}}
  h1{{font-size:1.5rem;margin:0 0 .3rem}}
  .lede{{color:var(--dim);margin:0 0 1.5rem}}
  .note{{border-left:3px solid var(--amber);background:rgba(251,142,40,.09);
         padding:.85rem 1.1rem;border-radius:0 8px 8px 0;margin:0 0 1.75rem;color:#f6dcbe}}
  .note b{{color:#fff}}
  .card{{background:var(--card);border:1px solid var(--line);border-radius:12px;
         padding:1.1rem 1.25rem;margin-bottom:.85rem}}
  .card.done{{border-color:rgba(56,211,159,.45)}}
  .head{{display:flex;align-items:center;gap:1rem}}
  .head h2{{font-size:1.05rem;margin:0}}
  .n{{flex:none;width:28px;height:28px;border-radius:50%;background:#222b3a;color:var(--dim);
      display:grid;place-items:center;font-size:.8rem;font-weight:700}}
  .card.done .n{{background:var(--ok);color:#04120c}}
  .head>div{{flex:1;min-width:0}}
  .slug{{margin:.1rem 0 0;color:var(--dim);font-size:.85rem}}
  code{{background:#0b0f16;padding:.1rem .4rem;border-radius:4px;font-size:.85em}}
  button{{flex:none;font:600 .92rem/1 system-ui;padding:.7rem 1.3rem;border:0;border-radius:8px;
          background:var(--cyan);color:#04121a;cursor:pointer}}
  button:active{{transform:translateY(1px)}}
  button:disabled{{opacity:.5;cursor:default}}
  .meta{{margin:.7rem 0 0;color:var(--dim);font-size:.82rem}}
  .status{{margin:.45rem 0 0;font-size:.88rem;font-weight:600;min-height:1.2em}}
  .status.ok{{color:var(--ok)}} .status.err{{color:var(--bad)}}
  .bad{{color:var(--bad);font-weight:600}}
  footer{{margin-top:2rem;color:var(--dim);font-size:.85rem}}
  footer li{{margin:.35rem 0}}
</style>
</head>
<body>
<div class="wrap">
  <h1>Arvada Dental Center — six pages, six pastes</h1>
  <p class="lede">Click <b>Copy</b>, switch to the Webflow Designer, click the canvas,
     press <code>Ctrl/Cmd&nbsp;+&nbsp;V</code>. One page per button.</p>

  <div class="note">
    <b>Paste into a scratch page first.</b> The clipboard format is
    reverse-engineered from real Webflow captures, not a documented API.<br>
    <b>Images will be broken</b> until the 14 assets in <code>assets.json</code>
    are uploaded and mapped — expected, not a defect.
  </div>

{''.join(cards)}

  <footer>
    <ul>
      <li>Each payload has a <b>single root</b>. A multi-root paste is what crashes
          the Designer — size is not the problem.</li>
      <li>Every class ships with an <b>empty</b> style definition. The CSS lives in a
          scoped <code>&lt;style&gt;</code> embed inside each block, because this design is
          <code>clamp()</code>/<code>calc(var())</code>/<code>svh</code> throughout and Webflow's
          style panel cannot hold it.</li>
      <li>Class names are namespaced per page, so nothing merges with the client's
          existing classes.</li>
      <li>Each page includes its own <b>nav and footer</b>. Delete those two blocks
          if the target page already carries the client's.</li>
    </ul>
  </footer>
</div>

{''.join(blobs)}

<script>
  document.querySelectorAll('button[data-page]').forEach(function (btn) {{
    btn.addEventListener('click', function () {{
      var page = btn.getAttribute('data-page');
      var json = document.getElementById('p-' + page).textContent;
      var out = document.querySelector('[data-status="' + page + '"]');
      /* The copy must happen inside the click's own user gesture — deferring it
         behind a promise or a timeout makes execCommand refuse silently. */
      var handler = function (e) {{
        e.preventDefault();
        e.clipboardData.setData('application/json', json);
        e.clipboardData.setData('text/plain', json);
      }};
      document.addEventListener('copy', handler);
      var ok = false;
      try {{ ok = document.execCommand('copy'); }} catch (err) {{ ok = false; }}
      document.removeEventListener('copy', handler);

      out.textContent = ok
        ? '\\u2713 Copied ' + Math.round(json.length / 1024) + ' KB — now paste in Webflow'
        : '\\u2717 Copy failed — click the button again';
      out.className = 'status ' + (ok ? 'ok' : 'err');
      if (ok) document.getElementById('card-' + page).classList.add('done');
    }});
  }});
</script>
</body>
</html>
""", encoding="utf-8")

print(f"wrote {OUT}  ({OUT.stat().st_size // 1024} KB, {len(cards)} pages)")
