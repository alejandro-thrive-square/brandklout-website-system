#!/usr/bin/env python3
"""
style_diff.py — diff two payload_to_whtml `styles.css` files and emit the
per-property `data_style_tool > update_style` actions that turn the first into
the second.

Source Asana task GID: 1217040406855582

WHY
---
A re-theme changes VALUES, not structure. Re-inserting the markup to change a
colour would mean deleting and rebuilding three live pages; `update_style`
merges the properties you pass and leaves the rest alone, so pushing only what
actually moved is both smaller and far less destructive.

Emits JSON: [{style, parents, breakpoint, pseudo, properties:{name:value}}, ...]
`parents` is the combo chain above the style, which update_style needs to
address `.a.b` rather than `.b`.

Breakpoint names are Webflow's own; `main` is the base.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys

MEDIA_TO_BP = {
    "": "main",
    "@media screen and (max-width: 991px)": "medium",
    "@media screen and (max-width: 767px)": "small",
    "@media screen and (max-width: 479px)": "tiny",
}
PSEUDO_RE = re.compile(r"(:{1,2}[a-z-]+(?:\([^)]*\))?)$")


def _logical_lines(path):
    """Yield one rule per item, re-joining rules that wrap across lines.

    payload_to_whtml writes one rule per line, EXCEPT where a single value is
    long enough to wrap — a multi-property `transition:` shorthand does it on
    every page. A line-based parser drops those rules from BOTH sides of the
    diff, so their changes are never emitted and never applied, and nothing
    reports a problem. That silently left `.site-head` on the old heading font
    and `.btn--ghost` on the old hairline after a re-theme that otherwise
    verified clean. Balance the braces instead of trusting the newlines.
    """
    buf = ""
    depth = 0
    for raw in io.open(path, encoding="utf-8"):
        line = raw.strip()
        if not line:
            continue
        if not buf and (line.startswith("/*") or line.startswith("@media") or line == "}"):
            yield line
            continue
        buf = f"{buf} {line}" if buf else line
        depth += line.count("{") - line.count("}")
        if depth <= 0:
            yield buf
            buf = ""
            depth = 0
    if buf:
        yield buf


def parse(path):
    """{(breakpoint, selector, pseudo): {prop: value}}"""
    out = {}
    media = ""
    for line in _logical_lines(path):
        if not line or line.startswith("/*"):
            continue
        if line.startswith("@media"):
            media = line.rstrip(" {")
            continue
        if line == "}" and media:
            media = ""
            continue
        m = re.match(r"^(.*?)\s*\{\s*(.*?)\s*\}$", line)
        if not m:
            continue
        sel, decls = m.group(1).strip(), m.group(2)
        pseudo = ""
        pm = PSEUDO_RE.search(sel)
        if pm:
            pseudo = pm.group(1)
            sel = sel[: pm.start()]
        chain = [c for c in sel.split(".") if c]
        props = {}
        depth = 0
        buf = ""
        for ch in decls:
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
            if ch == ";" and depth == 0:
                if ":" in buf:
                    k, _, v = buf.partition(":")
                    props[k.strip()] = v.strip()
                buf = ""
            else:
                buf += ch
        if ":" in buf:
            k, _, v = buf.partition(":")
            props[k.strip()] = v.strip()
        bp = MEDIA_TO_BP.get(media)
        if bp is None:
            print(f"[style_diff] unknown media, skipped: {media}", file=sys.stderr)
            continue
        out[(bp, tuple(chain), pseudo)] = props
    return out


def expand_shorthands(props):
    """Rewrite CSS shorthands to the LONGHANDS Webflow actually stores.

    `update_style` merges by property NAME. Webflow keeps `background-color`,
    `background-image` and the four `border-*-color` separately, so sending the
    shorthand `background:` adds a second property instead of replacing the
    stored one — the style then carries both the old and the new colour and
    which one paints depends on emission order. Measured the hard way: after a
    `background: #26292F` update, `.skip-link` still held `background-color:
    #1b2224`.
    """
    out = {}
    for k, v in props.items():
        if k == "background":
            if "gradient(" in v or v.startswith("url("):
                out["background-image"] = v
            else:
                out["background-color"] = v
        elif k == "border-color":
            for side in ("top", "right", "bottom", "left"):
                out[f"border-{side}-color"] = v
        else:
            out[k] = v
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--old", required=True)
    ap.add_argument("--new", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)

    old = {k: expand_shorthands(v) for k, v in parse(a.old).items()}
    new = {k: expand_shorthands(v) for k, v in parse(a.new).items()}
    actions, added, changed_props = [], 0, 0

    for key, props in new.items():
        bp, chain, pseudo = key
        prev = old.get(key, {})
        if not prev:
            added += 1
        delta = {k: v for k, v in props.items() if prev.get(k) != v}
        if not delta:
            continue
        changed_props += len(delta)
        actions.append({
            "style": chain[-1],
            "parents": list(chain[:-1]),
            "breakpoint": bp,
            "pseudo": pseudo.lstrip(":") or None,
            "new_rule": not prev,
            "properties": delta,
        })

    # a property present before and absent now would silently persist; report it
    stale = []
    for key, prev in old.items():
        gone = [k for k in prev if k not in new.get(key, {})]
        if gone:
            stale.append({"style": ".".join(key[1]), "breakpoint": key[0],
                          "pseudo": key[2], "properties": gone})

    io.open(a.out, "w", encoding="utf-8", newline="\n").write(
        json.dumps({"actions": actions, "stale_properties": stale}, indent=1))
    print(json.dumps({
        "rules_touched": len(actions),
        "properties_changed": changed_props,
        "rules_new": added,
        "rules_with_stale_properties": len(stale),
    }))


if __name__ == "__main__":
    main()
