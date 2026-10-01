"""Benchmark Jev variants on local fixtures that reproduce the traps of real vendor dashboards.

Runs in its own headless Chrome (BU_NAME=bench, port 9333, throwaway profile), so the user's Chrome
is never touched and Chrome's "Allow remote debugging?" prompt never appears.

uv run --project ~/tools/jev-ultrafast --env-file ~/tools/jev-ultrafast/.env python bench.py \
    [--variants vanilla,frames,deep,steps,guarded] [--tasks iframe,flow] [--repeats 3] [--out DIR]

A pass is decided by what the fixture recorded (server events), never by Jev's own DONE.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("BU_NAME", "bench")
os.environ.setdefault("BU_CDP_URL", "http://127.0.0.1:9333")

import server  # noqa: E402

PATIENCE = 2
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
HOST = "http://127.0.0.1:8801/"
LISTING = "Livewell Dental, 12 Main St, Denver, CO, USA"
NAME = "Livewell - Google Reviews"


def evs(events, task, kind=None):
    return [e for e in events.get(task, []) if kind is None or e["ev"] == kind]


def data(events, task, kind):
    return [e["data"] for e in evs(events, task, kind)]


TASKS = {
    "iframe": dict(
        page="iframe.html",
        goal="In the widget editor, open the Theme tab and set the color scheme to Dark. Then stop.",
        steps=["Open the Theme tab in the widget editor. Stop as soon as the Theme panel shows.",
               "Select the Dark color scheme. Stop once Dark is selected."],
        forbid=[r"^close$"],
        score=lambda e: (data(e, "iframe", "scheme")[-1:] == ["dark"] and not evs(e, "iframe", "close"),
                         f"scheme={data(e, 'iframe', 'scheme')} close={len(evs(e, 'iframe', 'close'))}"),
    ),
    "shadow": dict(
        page="shadow.html",
        goal="Search for Bright Smiles and connect the result 'Bright Smiles Dental — 400 Oak Ave, Austin TX'. Then stop.",
        steps=["Type Bright Smiles into the business search field. Stop when results are listed.",
               "Click the result 'Bright Smiles Dental — 400 Oak Ave, Austin TX'. Stop when it shows as connected."],
        forbid=[],
        score=lambda e: (data(e, "shadow", "pick") == ["Bright Smiles Dental — 400 Oak Ave, Austin TX"],
                         f"pick={data(e, 'shadow', 'pick')}"),
    ),
    "divcards": dict(
        page="divcards.html",
        goal="Choose the Carousel template. Then stop.",
        steps=["Choose the Carousel template. Stop when the page says Template: Carousel."],
        forbid=[],
        score=lambda e: (data(e, "divcards", "template") == ["Carousel"], f"template={data(e, 'divcards', 'template')}"),
    ),
    "icons": dict(
        page="icons.html",
        goal="Duplicate the widget named Livewell Reviews. Do not edit or delete anything. Then stop.",
        steps=["Click the duplicate (copy) button on the Livewell Reviews row. Stop when the page says copy: Livewell Reviews."],
        forbid=[r"delete|trash"],
        score=lambda e: ([(x["ev"], x["data"]) for x in evs(e, "icons")] == [("copy", "Livewell Reviews")],
                         f"{[(x['ev'], x['data']) for x in evs(e, 'icons')]}"),
    ),
    "enter": dict(
        page="enter.html",
        goal=f"Rename the widget to: {NAME}. The name must show as saved. Then stop.",
        steps=[f"Type {NAME} into the Widget name field.",
               f"Save the name; it saves on Enter. Stop when Saved name shows {NAME}."],
        forbid=[],
        score=lambda e: (data(e, "enter", "saved")[-1:] == [NAME], f"saved={data(e, 'enter', 'saved')}"),
    ),
    "echo": dict(
        page="echo.html",
        goal="Connect the Google listing for Livewell Dental at 12 Main St, Denver. Then stop.",
        steps=["Type Livewell Dental 12 Main St into the source search field. Stop when results are listed.",
               f"Click the result '{LISTING}' (not the 'Search for' row, not Dental Lab). Stop when it shows as connected."],
        forbid=[r"^search for "],
        score=lambda e: (data(e, "echo", "connect") == [LISTING],
                         f"connect={data(e, 'echo', 'connect')} echo={len(evs(e, 'echo', 'echo'))}"),
    ),
    "nested": dict(
        page="nested.html",
        goal="In the preview, click Load more reviews. Then stop.",
        steps=["In the preview, click Load more reviews. Stop right after clicking it."],
        forbid=[],
        score=lambda e: (len(evs(e, "nested", "more")) >= 1, f"more={len(evs(e, 'nested', 'more'))}"),
    ),
    "flow": dict(
        page="flow.html",
        goal=("Create a new Google Reviews widget: choose the Carousel template, connect the Google listing for "
              f"Livewell Dental at 12 Main St, Denver, CO, name the widget '{NAME}' (the name saves on Enter), "
              "publish it, and stop when the install code is shown. Do not click Upgrade or Close."),
        steps=["Click Create widget. Stop when the templates are shown.",
               "Choose the Carousel template. Stop when the editor has loaded and a source search field is visible.",
               "Type Livewell Dental 12 Main St into the source search field. Stop when results are listed.",
               f"Click the result '{LISTING}' (not the 'Search for' row, not Dental Lab). Stop when Connected shows it.",
               f"Type {NAME} into the widget name field.",
               f"Save the name with Enter. Stop when Saved name shows {NAME}.",
               "Click Publish. Stop when the install code is shown."],
        forbid=[r"^upgrade$", r"^close$", r"^search for "],
        score=lambda e: (data(e, "flow", "publish") == [{"src": LISTING, "name": NAME}]
                         and not evs(e, "flow", "upgrade") and not evs(e, "flow", "close"),
                         " ".join(f"{x['ev']}={x['data']}" if x["data"] else x["ev"] for x in evs(e, "flow"))),
    ),
}

VARIANTS = {
    # name: (browser, use steps, use forbid)
    "vanilla": ("vendor", False, False),
    "frames": ("frames", False, False),
    "deep": ("deep", False, False),
    "steps": ("deep", True, False),
    "guarded": ("deep", True, True),
}


def chrome(port=9333):
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2)
        return None
    except OSError:
        pass
    profile = tempfile.mkdtemp(prefix="jev-bench-")
    proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}", f"--user-data-dir={profile}",
                             "--no-first-run", "--no-default-browser-check", "--window-size=1280,900", "about:blank"])
    for _ in range(50):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2)
            return proc
        except OSError:
            time.sleep(0.2)
    raise RuntimeError("headless Chrome did not start")


def events():
    return json.loads(urllib.request.urlopen(HOST + "events").read())


def reset():
    urllib.request.urlopen(urllib.request.Request(HOST + "reset", method="POST")).read()


def run_one(variant, task, limit_s):
    import jev_deep
    import jev_frames
    import jev_ultrafast.agent as jev_agent
    from jev_ultrafast.browser import Browser

    kind, use_steps, use_forbid = VARIANTS[variant]
    spec = TASKS[task]
    if kind == "vendor":
        jev_agent.Browser = Browser
    elif kind == "frames":
        jev_frames.install()
    else:
        jev_deep.install(forbid=spec["forbid"] if use_forbid else [])
    goals = spec["steps"] if use_steps else [spec["goal"]]
    from browser_harness.admin import ensure_daemon
    ensure_daemon()  # self-heals a daemon that died in the previous run
    reset()
    started = time.perf_counter()
    status, error, agent, actions = "?", None, None, []
    try:
        agent = jev_agent.Agent(HOST + spec["page"], goals[0])
        status = jev_deep.drive(agent, goals, limit_s=limit_s, patience=PATIENCE)
    except Exception as exc:  # a failed run is data, not a crash
        status, error = "error", f"{type(exc).__name__}: {exc}"[:200]
    finally:
        if agent:
            actions = [f"{h['kind']}:{h['action'][:50]}" + (f"={h['text']}" if h.get("text") else "")
                       for h in agent.state["history"]]
            try:
                agent.close()
            except Exception:
                pass
    time.sleep(0.6)  # let the last no-cors report land
    ok, why = TASKS[task]["score"](events())
    infra = bool(error) and any(k in error for k in ("_IPCResponseTimeout", "PermissionError", "Model connection"))
    return dict(variant=variant, task=task, ok=bool(ok), infra=infra and not ok, status=status, steps=len(actions),
                seconds=round(time.perf_counter() - started, 1), why=why, error=error, actions=actions)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--variants", default=",".join(VARIANTS))
    parser.add_argument("--tasks", default=",".join(TASKS))
    parser.add_argument("--repeats", type=int, default=1)
    parser.add_argument("--limit", type=float, default=150)
    parser.add_argument("--patience", type=int, default=2, help="BLOCKED retries per goal (0 = vendor behaviour)")
    parser.add_argument("--out", default=str(HERE / "results"))
    args = parser.parse_args()
    global PATIENCE
    PATIENCE = args.patience
    server.serve()
    proc = chrome()
    from browser_harness.admin import ensure_daemon
    ensure_daemon()  # warm the daemon once; the first cold start raced the port file
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    log = out / f"bench-{stamp}.jsonl"
    rows = []
    try:
        for r in range(args.repeats):
            for task in args.tasks.split(","):
                for variant in args.variants.split(","):
                    row = run_one(variant, task, args.limit)
                    row["repeat"] = r + 1
                    rows.append(row)
                    with log.open("a", encoding="utf-8") as f:
                        f.write(json.dumps(row, ensure_ascii=False) + "\n")
                    mark = "PASS" if row["ok"] else "fail"
                    print(f"{mark} {variant:8} {task:9} {row['status']:7} {row['steps']:>3} steps "
                          f"{row['seconds']:>6}s  {row['why'][:90]}" + (f"  !! {row['error']}" if row["error"] else ""),
                          flush=True)
    finally:
        if proc:
            proc.terminate()
    print("\nvariant    " + "  ".join(f"{t:>9}" for t in args.tasks.split(",")) + "   total")
    for variant in args.variants.split(","):
        cells, total = [], 0
        for task in args.tasks.split(","):
            hits = [x for x in rows if x["variant"] == variant and x["task"] == task]
            hits = [x for x in hits if not x.get("infra")]  # plumbing failures are not agent failures
            passed = sum(x["ok"] for x in hits)
            total += passed
            cells.append(f"{passed}/{len(hits):<7}")
        n = sum(1 for x in rows if x["variant"] == variant and not x.get("infra"))
        print(f"{variant:10} " + "  ".join(f"{c:>9}" for c in cells) + f"   {total}/{n}")
    print("log:", log)


if __name__ == "__main__":
    main()
