"""Print the element table Jev would be offered on a page. No model calls.

uv run --project ~/tools/jev-ultrafast python inspect_table.py [--browser vendor|frames|deep] URL_OR_FIXTURE...
Fixture names (iframe, flow, ...) are served by the bench server; without BU_CDP_URL set, the
bench's headless Chrome is used.
"""

import argparse
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("BU_NAME", "bench")
os.environ.setdefault("BU_CDP_URL", "http://127.0.0.1:9333")

import bench  # noqa: E402
import server  # noqa: E402


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", default="deep")
    parser.add_argument("--wait", type=float, default=0)
    parser.add_argument("pages", nargs="+")
    args = parser.parse_args()
    if any(not p.startswith("http") for p in args.pages):
        server.serve()
    proc = bench.chrome() if os.environ["BU_CDP_URL"].endswith(":9333") else None
    import jev_deep
    import jev_frames
    from jev_ultrafast.browser import Browser
    from jev_ultrafast.model import action_space

    cls = {"vendor": Browser, "frames": jev_frames.FramedBrowser, "deep": jev_deep.DeepBrowser}[args.browser]
    try:
        for p in args.pages:
            url = p if p.startswith("http") else bench.HOST + p + ".html"
            b = cls(url)
            try:
                time.sleep(args.wait)
                page = b.observe(screenshot=False)
                elements, targets, controls = action_space(page["actions"])
                print(f"\n== {p} [{args.browser}] {len(elements)} elements, operations "
                      f"{sorted(targets) + sorted(c.upper() for c in controls)}")
                for e in elements:
                    print(f"  [{e['index']}] {e.get('role', ''):9} {e['label'][:90]!r} {'/'.join(e['operations'])}")
                print("  text:", page["text"][:300].replace("\n", " | "))
            finally:
                b.close()
    finally:
        if proc:
            proc.terminate()


if __name__ == "__main__":
    main()
