"""Run Jev on an Elfsight goal, log every action, pull the install code, close the tab.

uv run --env-file .env python run_elfsight.py --url URL --goal ... [--goal ...] --out DIR
    [--frames] [--keep-open] [--record]
"""

import argparse
import json
import re
from pathlib import Path

import jev_frames
from jev_ultrafast import Agent

CODE_JS = r"""(() => {
  const html = document.documentElement.outerHTML;
  const vals = [...document.querySelectorAll('textarea, input, code, pre')].map(e => e.value || e.textContent || '');
  return { url: location.href, title: document.title,
           fields: vals.filter(v => /elfsight/i.test(v)).slice(0, 5),
           ids: [...new Set(html.match(/elfsight-app-[0-9a-f-]{36}/g) || [])] };
})()"""

parser = argparse.ArgumentParser()
parser.add_argument("--url", required=True)
parser.add_argument("--goal", action="append", required=True)
parser.add_argument("--out", required=True)
parser.add_argument("--record", action="store_true", help="screenshot per step; can time out in background tabs")
parser.add_argument("--keep-open", action="store_true", help="leave the tab open to inspect it")
parser.add_argument("--frames", action="store_true", help="read cross-origin iframes (jev_frames)")
args = parser.parse_args()
if args.frames:
    jev_frames.install()
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)

agent = Agent(args.url, args.goal, record_dir=out / "frames" if args.record else None)
seen = 0
state = None
for state in agent.run():
    for entry in state["history"][seen:]:
        print(f"{state['elapsed_ms']:>6} ms  {json.dumps(entry, default=str)[:300]}", flush=True)
    seen = len(state["history"])
print("status:", state["status"], "| url:", state["page"]["url"], flush=True)

found = agent.browser.evaluate(CODE_JS)
(out / "result.json").write_text(json.dumps({"state": agent.snapshot(), "found": found}, default=str, indent=1))
print("found:", json.dumps({k: found[k] for k in ("url", "title", "ids")}), flush=True)
for f in found["fields"]:
    print("code:", re.sub(r"\s+", " ", f)[:400], flush=True)
if not args.keep_open:
    agent.close()
