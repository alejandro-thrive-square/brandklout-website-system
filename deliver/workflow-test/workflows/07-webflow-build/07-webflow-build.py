#!/usr/bin/env python3
"""
07-webflow-build.py — config-driven orchestrator for the Webflow build.

This is the per-phase executor. It does NOT re-implement the converter; it reads
a small project config (webflow-build.config.json) and drives the converter
(html_to_webflow.py) + diagnostics (wf_tools.py) + vocabulary builder
(build_vocab.py) with the right per-project flags, so a new engagement only fills
in the config once.

The converter is the engine; the full method is in html-to-webflow-clipboard.md.

Config (webflow-build.config.json, relative to this folder):
  {
    "asset_base":  "https://[client-name].vercel.app",
    "css":         "../04-design/.tmp/final-design/site.css",
    "design_dir":  "../05-design-revisions/.tmp/final-design",
    "var_map_seed": ".tmp/webflow-variable-map.json",
    "pages": { "<page>": "<approved source HTML path>", ... }
  }

Subcommands:
  init-config            Scaffold webflow-build.config.json + .tmp/.
  build-page <page>      Convert one page's approved HTML into .tmp/<page>/.
  vocab                  Build the multi-page shared-class vocabulary.
  qa <page>              Payload QA for one page (run right after build-page).
  raw -- <args>          Pass through to html_to_webflow.py (escape hatch).
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_NAME = "webflow-build.config.json"

TEMPLATE_CONFIG = {
    "asset_base": "https://[client-name].vercel.app",
    "css": "../04-design/.tmp/final-design/site.css",
    "design_dir": "../05-design-revisions/.tmp/final-design",
    "var_map_seed": ".tmp/webflow-variable-map.json",
    "pages": {
        "index": "../05-design-revisions/.tmp/final-design/index.html",
    },
}


def config_path() -> str:
    return os.path.join(HERE, CONFIG_NAME)


def load_config() -> dict:
    p = config_path()
    if not os.path.exists(p):
        sys.exit(
            f"{CONFIG_NAME} not found. Run: python {os.path.basename(__file__)} init-config"
        )
    with open(p, encoding="utf-8") as f:
        cfg = json.load(f)
    missing = [k for k in ("asset_base", "css", "pages") if not cfg.get(k)]
    if missing:
        sys.exit(f"{CONFIG_NAME} missing required keys: {', '.join(missing)}")
    return cfg


def run(cmd: list[str]) -> int:
    print("[run] " + " ".join(cmd), flush=True)
    return subprocess.call(cmd, cwd=HERE)


def py(script: str, *args: str) -> int:
    return run([sys.executable, os.path.join(HERE, script), *args])


def cmd_init_config(_: argparse.Namespace) -> int:
    if os.path.exists(config_path()):
        print(f"{CONFIG_NAME} already exists; leaving it untouched.")
    else:
        with open(config_path(), "w", encoding="utf-8") as f:
            json.dump(TEMPLATE_CONFIG, f, indent=2)
            f.write("\n")
        print(f"wrote {config_path()} — fill it in before building.")
    os.makedirs(os.path.join(HERE, ".tmp"), exist_ok=True)
    print("ensured .tmp/ exists.")
    return 0


def seed_var_map(cfg: dict, page: str, out_dir: str) -> str:
    """Copy the shared var-map seed into the page folder if absent, so the
    converter preserves any filled-in Webflow variable IDs across pages."""
    var_map = os.path.join(out_dir, "webflow-variable-map.json")
    seed = cfg.get("var_map_seed")
    if not os.path.exists(var_map) and seed:
        seed_abs = os.path.join(HERE, seed)
        if os.path.exists(seed_abs):
            shutil.copy(seed_abs, var_map)
    return var_map


def cmd_build_page(ns: argparse.Namespace) -> int:
    cfg = load_config()
    page = ns.page
    html = cfg["pages"].get(page)
    if not html:
        sys.exit(
            f"page '{page}' is not in {CONFIG_NAME}.pages. "
            f"Known: {', '.join(cfg['pages'])}"
        )
    html_abs = os.path.join(HERE, html)
    if not os.path.exists(html_abs):
        sys.exit(f"approved source HTML not found: {html_abs}")
    out_dir = os.path.join(HERE, ".tmp", page)
    os.makedirs(out_dir, exist_ok=True)
    var_map = seed_var_map(cfg, page, out_dir)

    cmd = [
        sys.executable, os.path.join(HERE, "html_to_webflow.py"),
        "--html", html,
        "--asset-base", cfg["asset_base"],
        "--var-map", os.path.relpath(var_map, HERE),
        "--split", os.path.relpath(out_dir, HERE),
    ]
    css = cfg.get("css")
    if css:
        cmd += ["--css", css]
    if ns.avoid:
        cmd += ["--avoid", ns.avoid]
    if ns.vocab:
        vocab_file = os.path.join(HERE, ".tmp", "style-vocabulary.json")
        if os.path.exists(vocab_file):
            cmd += ["--vocab", os.path.relpath(vocab_file, HERE)]
        else:
            print("[warn] --vocab set but .tmp/style-vocabulary.json missing; "
                  "run `vocab` first. Continuing without it.")
    rc = run(cmd)
    if rc == 0:
        print(f"\nNext: python wf_tools.py qa {os.path.relpath(out_dir, HERE)}")
    return rc


def cmd_vocab(_: argparse.Namespace) -> int:
    cfg = load_config()
    sources_file = os.path.join(HERE, ".tmp", "build-sources.json")
    os.makedirs(os.path.dirname(sources_file), exist_ok=True)
    with open(sources_file, "w", encoding="utf-8") as f:
        json.dump(cfg["pages"], f, indent=2)
        f.write("\n")
    print(f"wrote {os.path.relpath(sources_file, HERE)} from config.pages")
    print(
        "NOTE: build_vocab reads no-`--avoid` payloads in .tmp/_raw/<page>. "
        "Generate those once per page before running this."
    )
    return py("build_vocab.py", "--sources", os.path.relpath(sources_file, HERE),
              "--raw-dir", ".tmp/_raw", "--out", ".tmp/style-vocabulary.json")


def cmd_qa(ns: argparse.Namespace) -> int:
    cfg = load_config()
    page_dir = os.path.join(HERE, ".tmp", ns.page)
    if not os.path.isdir(page_dir):
        sys.exit(f"page build folder not found: {page_dir} (run build-page first)")
    args = ["qa", os.path.relpath(page_dir, HERE)]
    if ns.against:
        args += ["--against", ns.against]
    return py("wf_tools.py", *args)


def cmd_raw(ns: argparse.Namespace) -> int:
    """Escape hatch: forward args to html_to_webflow.py verbatim."""
    load_config()
    return py("html_to_webflow.py", *ns.args)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    ic = sub.add_parser("init-config", help="scaffold webflow-build.config.json + .tmp/")
    ic.set_defaults(func=cmd_init_config)

    bp = sub.add_parser("build-page", help="convert one page into .tmp/<page>/")
    bp.add_argument("page", help="a key from config 'pages'")
    bp.add_argument("--avoid", metavar="DIRS",
                    help="comma-separated split folders of pages already pasted "
                         "(residual namespace-avoidance pass)")
    bp.add_argument("--vocab", action="store_true",
                    help="apply .tmp/style-vocabulary.json (shared class system)")
    bp.set_defaults(func=cmd_build_page)

    vc = sub.add_parser("vocab", help="build the multi-page shared-class vocabulary")
    vc.set_defaults(func=cmd_vocab)

    qa = sub.add_parser("qa", help="payload QA for one page")
    qa.add_argument("page", help="a key from config 'pages'")
    qa.add_argument("--against", metavar="DIRS",
                    help="comma-separated other built pages for cross-page checks")
    qa.set_defaults(func=cmd_qa)

    raw = sub.add_parser("raw", help="forward args to html_to_webflow.py")
    raw.add_argument("args", nargs=argparse.REMAINDER)
    raw.set_defaults(func=cmd_raw)

    ns = ap.parse_args(argv)
    if ns.cmd == "raw" and ns.args and ns.args[0] == "--":
        ns.args = ns.args[1:]
    return ns.func(ns)


if __name__ == "__main__":
    sys.exit(main())
