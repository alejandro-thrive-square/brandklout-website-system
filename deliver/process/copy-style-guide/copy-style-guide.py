#!/usr/bin/env python3
"""Copy Style Guide — offline diff/report helper.

This executor does NOT touch Webflow. All variable/style copying is performed by
Claude through the Webflow MCP (variable_tool, style_tool, data_sites_tool) per the
Phase A-E protocol in copy-style-guide.md. This helper only compares the source
design system (captured in Phase B) against the target site's current state and
emits a human-readable plan/report so the copy can be reviewed and verified.

Inputs (read from --tmp dir, defaults to ./.tmp):
  source-variables.json   Source variable collections + variables (Phase B).
  source-styles.json      Source styles, all breakpoints (Phase B).
  target-variables.json   Optional: target variable collections + variables.
  target-styles.json      Optional: target styles.

Output:
  copy-report.json        Created/updated/skipped counts, unmapped variable
                          references, and warnings.

Usage:
  python copy-style-guide.py report [--tmp PATH]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

MUTATES_WEBFLOW = False


def _load(path: Path) -> dict | list | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"WARN: could not parse {path.name}: {exc}", file=sys.stderr)
        return None


def _names(payload, key="name") -> set[str]:
    """Best-effort extraction of a set of names from varied MCP shapes."""
    out: set[str] = set()
    if payload is None:
        return out
    items = payload
    if isinstance(payload, dict):
        for candidate in ("variables", "styles", "collections", "items", "data"):
            if candidate in payload and isinstance(payload[candidate], list):
                items = payload[candidate]
                break
    if isinstance(items, list):
        for item in items:
            if isinstance(item, dict):
                name = item.get(key) or item.get("variable_name") or item.get("style_name")
                if name:
                    out.add(name if isinstance(name, str) else json.dumps(name))
    return out


def build_report(tmp: Path) -> dict:
    src_vars = _load(tmp / "source-variables.json")
    src_styles = _load(tmp / "source-styles.json")
    tgt_vars = _load(tmp / "target-variables.json")
    tgt_styles = _load(tmp / "target-styles.json")

    warnings: list[str] = []
    if src_vars is None:
        warnings.append("source-variables.json missing — run Phase B first.")
    if src_styles is None:
        warnings.append("source-styles.json missing — run Phase B first.")

    src_var_names = _names(src_vars, "name") | _names(src_vars, "variable_name")
    src_style_names = _names(src_styles, "name") | _names(src_styles, "style_name")
    tgt_var_names = _names(tgt_vars, "name") | _names(tgt_vars, "variable_name")
    tgt_style_names = _names(tgt_styles, "name") | _names(tgt_styles, "style_name")

    def classify(src: set[str], tgt: set[str]) -> dict:
        return {
            "source_total": len(src),
            "to_create": sorted(src - tgt),
            "to_update_overwrite": sorted(src & tgt),  # source wins
            "target_only_untouched": sorted(tgt - src),
        }

    if tgt_vars is None and tgt_styles is None:
        warnings.append(
            "No target-*.json provided — report lists source items only; "
            "save target reads to compute the overwrite plan."
        )

    return {
        "workflow": "copy-style-guide",
        "mutates_webflow": MUTATES_WEBFLOW,
        "conflict_policy": "source-wins-overwrite",
        "scope": "variables-and-styles-only",
        "variables": classify(src_var_names, tgt_var_names),
        "styles": classify(src_style_names, tgt_style_names),
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Copy Style Guide offline report helper.")
    parser.add_argument("command", choices=["report"], help="Action to run.")
    parser.add_argument("--tmp", default=str(Path(__file__).parent / ".tmp"),
                        help="Directory holding the source/target JSON captures.")
    args = parser.parse_args()

    tmp = Path(args.tmp)
    report = build_report(tmp)
    out = tmp / "copy-report.json"
    tmp.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {out}")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
