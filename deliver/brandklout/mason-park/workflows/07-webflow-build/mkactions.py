#!/usr/bin/env python3
"""
mkactions.py — turn a `style_diff.py` diff into batches of
`data_style_tool > update_style` actions, ready to send verbatim.

Source Asana task GID: 1217040406855582

WHY
---
The diff says WHICH rules moved; this says HOW to send them. Two of the
transforms are not optional and cost a round trip each when forgotten:

* `font-family` stores ONE family in Webflow, not a stack. Sending
  `"Inter", "Segoe UI", system-ui, sans-serif` stores that whole string as a
  family name. Only the first family is sent, unquoted.
* a rule with no pseudo must OMIT `pseudo` rather than send `noPseudo`-by-guess,
  and a combo chain goes in `parent_style_names`, tail-last.

Shorthand expansion (`background:` -> `background-color`) already happened in
`style_diff.py`; Webflow stores longhands and merges by property NAME, so a
shorthand would land ALONGSIDE the stored longhand and the style would carry
both colours.

Usage:
    python mkactions.py --diff <retheme-diff.json> --out <dir> [--batch 30]

Writes <dir>/<n>.json, each a complete `actions` array.
"""

from __future__ import annotations

import argparse
import io
import json
import os


def first_family(value: str) -> str:
    """`"Inter", "Segoe UI", system-ui, sans-serif` -> `Inter`."""
    return value.split(",")[0].strip().strip("\"'")


def to_action(rule: dict, index: int) -> dict:
    props = dict(rule["properties"])
    if "font-family" in props:
        props["font-family"] = first_family(props["font-family"])

    body = {
        "style_name": rule["style"],
        "breakpoint_id": rule["breakpoint"],
        "properties": [
            {"property_name": k, "property_value": v} for k, v in props.items()
        ],
    }
    if rule["parents"]:
        body["parent_style_names"] = rule["parents"]
    if rule["pseudo"]:
        body["pseudo"] = rule["pseudo"]

    chain = ".".join(rule["parents"] + [rule["style"]])
    label = f"{index:03d} {chain}@{rule['breakpoint']}"
    if rule["pseudo"]:
        label += f":{rule['pseudo']}"
    return {"label": label, "update_style": body}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--diff", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch", type=int, default=30)
    a = ap.parse_args(argv)

    rules = json.load(io.open(a.diff, encoding="utf-8"))["actions"]
    actions = [to_action(r, i) for i, r in enumerate(rules)]

    os.makedirs(a.out, exist_ok=True)
    batches = [actions[i:i + a.batch] for i in range(0, len(actions), a.batch)]
    for n, batch in enumerate(batches, 1):
        path = os.path.join(a.out, f"{n}.json")
        io.open(path, "w", encoding="utf-8", newline="\n").write(
            json.dumps(batch, indent=1))
    print(json.dumps({"rules": len(actions), "batches": len(batches),
                      "out": a.out}))


if __name__ == "__main__":
    main()
