"""Do one task on any website from a plain instruction. No site-specific steps or lists.

uv run --project ~/tools/jev-ultrafast --env-file ~/tools/jev-ultrafast/.env python jev_do.py \
    --url https://example.com "Open the billing page of the Acme sub-account and stop there." \
    [--read-secret "api key"] [--secrets-out FILE] [--allow publish] [--out DIR] [--keep-open]

* Perception is jev_deep: iframes at any depth, shadow DOM, div cards, icon buttons, scroll panels,
  overlays read first, Enter, echo rows dropped.
* Safety is automatic: delete / regenerate / log out / pay / publish / save / close / copy controls
  are hidden unless the instruction asks for them (jev_deep.auto_forbid). --allow WORD lifts one
  explicitly; --forbid REGEX adds one.
* Anything key-shaped is masked before a model sees the page. --read-secret LABEL reads the value
  in code at the end and prints only its fingerprint; --secrets-out writes the value to a file.
* It runs in a background tab of the Chrome that browser-harness is connected to, and closes it.
  Ends with: done, blocked, loop, stalled or error. A DONE is a claim: check the outcome.
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ghl_keys  # noqa: E402  (read_secret / fingerprint are generic despite the module name)
import jev_deep  # noqa: E402
from jev_ultrafast import Agent  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("instruction")
parser.add_argument("--url", required=True, help="where to start")
parser.add_argument("--allow", action="append", default=[], help="a word the instruction may do anyway, e.g. publish")
parser.add_argument("--forbid", action="append", default=[], help="extra regex on element labels to hide")
parser.add_argument("--read-secret", metavar="LABEL", help="read a key-shaped value labelled LABEL at the end")
parser.add_argument("--secrets-out", help="JSON file for the secret value; keep it outside the repository")
parser.add_argument("--limit", type=float, default=180)
parser.add_argument("--out", help="folder for the run log (no secrets in it)")
parser.add_argument("--keep-open", action="store_true")
args = parser.parse_args()

jev_deep.install(forbid=args.forbid, instruction=args.instruction + " " + " ".join(args.allow))
agent = Agent(args.url, args.instruction)
seen = 0


def log(state):
    global seen
    for h in state["history"][seen:]:
        print(f"{h['elapsed_ms']:>6} ms  {h['kind']:5} {h['action'][:80]}" + (f" = {h['text']!r}" if h.get("text") else ""),
              flush=True)
    seen = len(state["history"])


status, result = "error", {}
try:
    status = jev_deep.drive(agent, [args.instruction], limit_s=args.limit, on_state=log)
finally:
    result = {"instruction": args.instruction, "status": status, "url": agent.browser.evaluate("location.href"),
              "steps": len(agent.state["history"]), "elapsed_ms": agent.state["elapsed_ms"],
              "hidden": jev_deep.DeepBrowser.forbid}
    if args.read_secret:
        values = ghl_keys.read_secret(agent.browser, args.read_secret)
        result["secrets"] = [ghl_keys.fingerprint(v) for v in values]
        if args.secrets_out and len(values) == 1:
            Path(args.secrets_out).write_text(json.dumps({"url": result["url"], "value": values[0]}), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False), flush=True)
    if args.out:
        Path(args.out).mkdir(parents=True, exist_ok=True)
        (Path(args.out) / "run.json").write_text(json.dumps({**result, "history": agent.state["history"]},
                                                            default=str, indent=1), encoding="utf-8")
    if not args.keep_open:
        agent.close()
