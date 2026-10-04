"""Read-only: render widgets the way a visitor sees them and report rating, count, first reviewer.

  uv run python elfsight_render.py http://127.0.0.1:8799/
The page holds one <section data-w="<uuid>"><div class="elfsight-app-<uuid>"></div></section> per widget.
"""

import json
import sys
import time

from browser_harness.admin import ensure_daemon
from browser_harness.helpers import cdp

READ = r"""(() => [...document.querySelectorAll('section[data-w]')].map(s => {
  // Elfsight renders into shadow roots: walk them for text.
  const deep = n => { let out = ''; for (const c of n.childNodes) {
      if (c.nodeType === 3) out += c.textContent + ' ';
      else if (c.nodeType === 1 && !['STYLE','SCRIPT'].includes(c.tagName))
        out += deep(c.shadowRoot || c) + (c.shadowRoot ? deep(c) : ''); }
    return out; };
  const t = deep(s).replace(/\s+/g, ' ');
  const m = t.match(/(\d\.\d|\b5\b) ?\(([\d,]+)\)/) || t.match(/(\d\.\d)\s*[★]*\s*([\d,]+) reviews/i);
  const h = Math.round(s.getBoundingClientRect().height);
  return {w: s.dataset.w, height: h, rating: m ? m[1] : null, count: m ? m[2] : null,
          text: t.replace(/Panel only seen by widget owner.*?(Share|functionality!)/, '').slice(0, 140)};
}))()"""

ensure_daemon()
tab = cdp("Target.createTarget", url=sys.argv[1], background=True)["targetId"]
s = cdp("Target.attachToTarget", targetId=tab, flatten=True)["sessionId"]
cdp("Emulation.setDeviceMetricsOverride", session_id=s, width=1280, height=900, deviceScaleFactor=1, mobile=False)
cdp("Emulation.setFocusEmulationEnabled", session_id=s, enabled=True)
try:
    rows = []
    for _ in range(20):
        time.sleep(2)
        try:
            rows = cdp("Runtime.evaluate", session_id=s, expression=READ, returnByValue=True)["result"]["value"]
        except Exception:
            continue
        if rows and all(r["count"] for r in rows):
            break
    for r in rows:
        print(json.dumps(r), flush=True)
finally:
    cdp("Target.closeTarget", targetId=tab)
