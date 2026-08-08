#!/usr/bin/env python3
"""gen_minwidth_restores.py — rebuild the mobile side of a mobile-first design
that the Webflow conversion flattened.

    python gen_minwidth_restores.py --design ../04-design/.tmp/<page-dir> \
                                    --out .tmp/<page>/whtml/minwidth-restores.css

WHY THIS IS NEEDED
------------------
These stylesheets are mobile-first: the BASE rule is the phone layout and a
`@media (min-width: N)` block upgrades it for wider screens. Webflow has only
three min-width breakpoints (1280/1440/1920) and the designs use 720, 860, 900,
960, 1000, 1024, 1040 and 1080 — none of which map. `html_to_webflow_wholepage`
therefore folds the min-width declarations INTO the base and drops the query,
which silently applies the desktop value at every width.

`.arrival__inner` is the clearest case: one column in the base, two columns from
1000px up. After conversion the payload carries `grid-template-columns: 1.06fr
0.94fr` in its base and no override anywhere, so the hero renders two columns on
a phone with the form panel overflowing its column. It affects all three pages
INCLUDING the clipboard-built implant, because the damage happens in the payload,
before either build route.

WHAT THIS EMITS
---------------
For every declaration inside a non-canonical min-width block, a matching
`@media (max-width: N-0.02px)` rule carrying the design's own BASE value for that
selector and property — i.e. the restore the converter could not express. Where
the base is silent the property returns to `initial` (or `auto` for box metrics,
which computes the same and reads better in a style panel).

The output belongs in the page's HEAD custom code, appended by
apply_head_residual.mjs. It cannot become Webflow styles: the thresholds are the
whole point and Webflow cannot express them.
"""
import argparse, os, re, sys

CANONICAL = {"1280", "1440", "1920"}
AUTO_INITIAL = {"width", "height", "min-width", "min-height", "max-width", "max-height",
                "top", "right", "bottom", "left", "margin", "margin-top", "margin-right",
                "margin-bottom", "margin-left", "flex-basis"}


def rules(css, media=""):
    """Yield (media, selector, declarations) for every rule, recursing into @media."""
    i = 0
    while i < len(css):
        at = re.compile(r"@media([^{]*)\{").search(css, i)
        rule = re.compile(r"([^{}@]+)\{([^{}]*)\}").search(css, i)
        if at and (not rule or at.start() < rule.start()):
            start = at.end()
            depth, j = 1, start
            while j < len(css) and depth:
                depth += 1 if css[j] == "{" else (-1 if css[j] == "}" else 0)
                j += 1
            yield from rules(css[start:j - 1], at.group(1).strip())
            i = j
            continue
        if not rule:
            return
        yield media, rule.group(1).strip(), rule.group(2).strip()
        i = rule.end()


def decls(text):
    out = {}
    for part in text.split(";"):
        if ":" not in part:
            continue
        k, _, v = part.partition(":")
        k = k.strip()
        if k and not k.startswith("/*"):
            out[k] = v.strip()
    return out


def boost(sel):
    """Raise a design selector's specificity above the Webflow combo it targets.

    The design writes `.arrival__inner`; the conversion turns it into the combo
    `.gm-box.shell.arrival__inner`, which is (0,3,0) and beats a plain (0,1,0)
    restore no matter what order the stylesheets are in. Repeating the subject's
    own class lifts it clear without changing WHAT it matches — the same trick
    the reveal states use. Five repeats beats the longest chain these builds
    produce (four classes).
    """
    parts = sel.strip().split()
    last = parts[-1]
    m = re.match(r"(\.[A-Za-z0-9_-]+)", last)
    if m:
        parts[-1] = last + m.group(1) * 4
    elif last.startswith(":root"):
        parts[-1] = last + ":root" * 4
    return " ".join(parts)


def base_value(base, sel, prop, fallback):
    """The value to go back to below the threshold.

    A combo usually does not redeclare what its base already sets, so the lookup
    has to read through the chain: `.gm-grid.c2` is silent about
    `grid-template-columns`, and answering `initial` there would drop the grid to
    `none` when the design's own mobile value is `.gm-grid`'s single column.
    """
    if prop in base.get(sel, {}):
        return base[sel][prop]
    parts = sel.split(".")
    while len(parts) > 2:                       # ".a.b.c" -> ".a.b" -> ".a"
        parts.pop()
        shorter = ".".join(parts)
        if prop in base.get(shorter, {}):
            return base[shorter][prop]
    return fallback


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--design", required=True, help="the design package directory")
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    css = ""
    for f in ("assets/kit.css", "styles.css"):
        p = os.path.join(args.design, f)
        if os.path.exists(p):
            css += open(p, encoding="utf-8").read() + "\n"
    # Strip comments first. A comment sitting before a rule otherwise lands
    # INSIDE the captured selector, which is legal CSS but unreadable, and a
    # comment containing a brace would break the parse outright.
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)

    # every base declaration, so a restore can look up what to go back to
    base = {}
    for media, sel, body in rules(css):
        if media:
            continue
        base.setdefault(sel, {}).update(decls(body))

    # group the restores by threshold so the output stays one block per width
    by_threshold = {}
    touched = 0
    for media, sel, body in rules(css):
        m = re.search(r"min-width:\s*(\d+)px", media)
        if not m or m.group(1) in CANONICAL:
            continue
        # a query carrying max-width too is a band, not a mobile-first upgrade
        if "max-width" in media:
            continue
        n = m.group(1)
        for prop in decls(body):
            fallback = "auto" if prop in AUTO_INITIAL else "initial"
            value = base_value(base, sel, prop, fallback)
            by_threshold.setdefault(n, {}).setdefault(sel, {})[prop] = value
            touched += 1

    out = ["/* Mobile restores. These stylesheets are mobile-first and Webflow has no",
           "   breakpoint at 720/860/900/960/1000/1024/1040/1080, so the conversion folded",
           "   each min-width upgrade into the base and the desktop layout applied on",
           "   phones. Each block below puts the base value back BELOW its threshold.",
           "   Generated by gen_minwidth_restores.py — do not hand-edit. */"]
    for n in sorted(by_threshold, key=int):
        out.append(f"@media (max-width: {int(n) - 1}.98px){{")
        for sel, props in by_threshold[n].items():
            body = "".join(f"{k}:{v};" for k, v in props.items())
            out.append(f"  {boost(sel)}{{{body}}}")
        out.append("}")
    text = "\n".join(out) + "\n"

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    open(args.out, "w", encoding="utf-8", newline="\n").write(text)
    print(f"{args.out}: {touched} declaration(s) restored across "
          f"{len(by_threshold)} threshold(s), {len(text)} chars")


if __name__ == "__main__":
    main()
