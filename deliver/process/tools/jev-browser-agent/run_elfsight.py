"""Run Jev on a vendor-dashboard task, log every action, pull any Elfsight install code, close the tab.

uv run --env-file .env python run_elfsight.py --url URL --goal STEP [--goal STEP ...] --out DIR
    [--deep | --frames] [--forbid REGEX ...] [--patience 2] [--limit 180] [--keep-open] [--record]

Each --goal is ONE short step with its own stopping point ("... Stop when X shows"); they run in
order on the same tab. --deep is the default perception (frames at any depth, shadow roots, div
cards, Enter key); --forbid hides matching elements from the model so it cannot click them.
Set BU_NAME / BU_CDP_URL to drive a dedicated automation Chrome instead of the user's own.
"""

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import jev_deep  # noqa: E402
import jev_frames  # noqa: E402
from jev_ultrafast import Agent  # noqa: E402

CODE_JS = r"""(() => {
  const html = document.documentElement.outerHTML;
  const vals = [...document.querySelectorAll('textarea, input, code, pre')].map(e => e.value || e.textContent || '');
  return { url: location.href, title: document.title,
           fields: vals.filter(v => /elfsight/i.test(v)).slice(0, 5),
           ids: [...new Set(html.match(/elfsight-app-[0-9a-f-]{36}/g) || [])] };
})()"""

parser = argparse.ArgumentParser()
parser.add_argument("--url", required=True)
parser.add_argument("--goal", action="append", required=True, help="one step; repeat in order")
parser.add_argument("--out", required=True)
parser.add_argument("--forbid", action="append", default=[], help="regex on element labels, e.g. '^close$'")
parser.add_argument("--patience", type=int, default=2, help="BLOCKED retries per step")
parser.add_argument("--limit", type=float, default=180, help="seconds for the whole run")
parser.add_argument("--record", action="store_true", help="screenshot per step; can time out in background tabs")
parser.add_argument("--keep-open", action="store_true", help="leave the tab open to inspect it")
parser.add_argument("--frames", action="store_true", help="old one-level iframe reader (jev_frames)")
args = parser.parse_args()
if args.frames:
    jev_frames.install()
else:
    jev_deep.install(forbid=args.forbid)
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)

agent = Agent(args.url, args.goal[0], record_dir=out / "frames" if args.record else None)
seen = 0


def log(state):
    global seen
    for entry in state["history"][seen:]:
        print(f"{state['elapsed_ms']:>6} ms  {json.dumps(entry, default=str)[:300]}", flush=True)
    seen = len(state["history"])


status = "error"
try:
    status = jev_deep.drive(agent, args.goal, limit_s=args.limit, patience=args.patience, on_state=log)
finally:
    print("status:", status, "| url:", agent.state["page"]["url"], flush=True)
    found = agent.browser.evaluate(CODE_JS)
    # The install code may sit inside the editor iframe: search the observed text too.
    found["ids"] = sorted(set(found["ids"]) | set(re.findall(r"elfsight-app-[0-9a-f-]{36}", agent.state["page"]["text"])))
    (out / "result.json").write_text(json.dumps({"status": status, "state": agent.snapshot(), "found": found},
                                                default=str, indent=1))
    print("found:", json.dumps({k: found[k] for k in ("url", "title", "ids")}), flush=True)
    for f in found["fields"]:
        print("code:", re.sub(r"\s+", " ", f)[:400], flush=True)
    if not args.keep_open:
        agent.close()
