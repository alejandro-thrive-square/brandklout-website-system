#!/usr/bin/env python3
"""
retheme-moodboard.py — re-theme the Mason Park design package onto the brand
direction a Brandklout team member published on the site's Home page.

Source Asana task GID: 1217040406855582
Moodboard: https://mason-park-dental.webflow.io/ — "Bright Cyan, Charcoal & White"

WHY THIS EXISTS
---------------
The first design pass sampled the client's live site for colour and read its
PHOTOGRAPHY: warm sand, sage and a near-black ink. The team member sampled the
same site and read its BRAND UI: bright cyan on charcoal. Both are honestly
"from the current site"; only one is the brand. This migration moves the
package onto the moodboard.

It runs ONCE and is committed as the record of what changed and why. After it,
`mpd.css` and the three page sources are the moodboard's, and the Webflow build
is regenerated from them — the live styles carry baked hex, so re-theming the
source and re-running the pipeline is the only route that leaves the approved
package and the published site saying the same thing.

WHAT THE MOODBOARD MANDATES (its own words)
-------------------------------------------
  Charcoal #26292F   the anchor: nav, footer, headings, dark UI
  Charcoal-deep #1B1E23
  Bright Cyan #00B4D8  the signal: CTAs, icons, links, booking band.
                       "Always paired with dark text, never white."
  Deep Cyan #007E9B    the accessible partner for cyan as text on light
  Slate #5A6472        secondary text, captions, borders
  Ice #E8F6FA          doctor and card sections
  Ink #20242A / #525A64 / page #F4F7F9
  Type: Fraunces headings (52/38/26), Inter body (18/14)
  Avoid: white text on bright cyan; bright cyan as small text on white;
         a fifth brand hue; pure black.

TWO JUDGEMENT CALLS, BOTH DOCUMENTED
------------------------------------
1. `--ink-soft` (#2F343C) is a lifted charcoal for RAISED PANELS on a dark
   ground. The moodboard has no such value — its own dark hero is a
   charcoal -> charcoal-deep gradient, which gives no raised surface. This is
   a tint of charcoal, not a new hue, so it does not breach "no fifth brand
   hue"; without it, cards on the dark chapters are invisible.
2. Gold review stars (#e3b341), the error red (#c0523f) and the Google "G"
   brand hexes are NOT touched. They are third-party marks and functional
   states, not brand colour.
"""

from __future__ import annotations

import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, ".tmp")
FILES = [
    "shared/mpd.css",
    "invisalign/index.html",
    "new-patient-special/index.html",
    "thank-you/index.html",
]

# --- colour, old -> new -----------------------------------------------------
# Ordered longest-first so an rgba( prefix never eats a hex.
COLOURS = [
    # dark ground / anchor
    ("#1b2224", "#26292F"),   # ink        -> charcoal
    ("#2c3538", "#2F343C"),   # ink-soft   -> lifted charcoal (raised dark panel)
    ("#121719", "#1B1E23"),   # ink-deep   -> charcoal-deep
    # text ramp
    ("#4e585b", "#525A64"),   # slate      -> ink-soft   (body copy)
    ("#778386", "#5A6472"),   # mist       -> slate      (meta, captions)
    # accent — the identity
    ("#c3a98e", "#8FDCEC"),   # sand       -> light cyan (accent on dark)
    ("#a8875f", "#00B4D8"),   # sand-deep  -> bright cyan
    ("#8a6c46", "#007E9B"),   # sand-ink   -> deep cyan  (AA-safe on light)
    ("#7f9a8b", "#00B4D8"),   # sage       -> cyan       (no fifth brand hue)
    ("#d8c3ab", "#CDEFF7"),   # gradient tail
    # grounds
    ("#f4ece2", "#E8F6FA"),   # sand-wash  -> ice
    ("#fbf9f7", "#F4F7F9"),   # paper      -> page
    ("#eff2f3", "#E8F6FA"),   # cloud      -> ice
    # hairlines
    ("#dfe4e6", "rgba(32, 36, 42, 0.12)"),   # line       -> the moodboard's own
    ("#e6dccf", "rgba(0, 126, 155, 0.16)"),  # line-warm  -> cyan-tinted, for ice panels
    # alpha forms, both spacings
    ("rgba(27, 34, 36,", "rgba(32, 36, 42,"),
    ("rgba(27,34,36,", "rgba(32,36,42,"),
    ("rgba(195, 169, 142,", "rgba(0, 180, 216,"),
    ("rgba(195,169,142,", "rgba(0,180,216,"),
    ("rgba(168, 135, 95,", "rgba(0, 180, 216,"),
    ("rgba(168,135,95,", "rgba(0,180,216,"),
]

# --- the token block --------------------------------------------------------
OLD_BRAND = """  /* Brand — read off the client's live site and photography. Unchanged. */
  --ink: #1b2224;
  --ink-soft: #2c3538;
  --ink-deep: #121719;
  --slate: #4e585b;
  --mist: #778386;
  --sand: #c3a98e;
  --sand-deep: #a8875f;
  --sand-ink: #8a6c46;      /* AA-safe sand for text on light grounds */
  --sand-wash: #f4ece2;
  --sage: #7f9a8b;
  --paper: #fbf9f7;
  --cloud: #eff2f3;
  --white: #ffffff;"""

NEW_BRAND = """  /* Brand — the moodboard published on the site's Home page by Brandklout,
     "Bright Cyan, Charcoal & White". Names kept from the first pass so the
     theme layer below is unchanged; only the values move. */
  --ink: #26292F;           /* charcoal — the anchor */
  --ink-soft: #2F343C;      /* lifted charcoal — RAISED panels on a dark ground.
                               Derived, not a new hue: see the header note. */
  --ink-deep: #1B1E23;      /* charcoal-deep */
  --slate: #525A64;         /* body copy */
  --mist: #5A6472;          /* slate — meta, captions, borders */
  --sand: #8FDCEC;          /* light cyan — accent on dark grounds */
  --sand-deep: #00B4D8;     /* bright cyan — the signal: CTAs, icons, rules */
  --sand-ink: #007E9B;      /* deep cyan — the AA-safe cyan for text on light */
  --sand-wash: #E8F6FA;     /* ice */
  --paper: #F4F7F9;         /* page */
  --cloud: #E8F6FA;         /* ice — image placeholders */
  --white: #ffffff;
  /* Text that sits ON bright cyan. The moodboard is explicit: dark ink, never
     white — white on #00B4D8 is ~2.5:1 and fails, which the current site does.
     Ink on cyan reaches 6.3:1. */
  --on-accent: #20242A;"""

OLD_TYPE = """  --display: "Outfit", "Segoe UI", system-ui, sans-serif;
  --body: "DM Sans", "Segoe UI", system-ui, sans-serif;"""

NEW_TYPE = """  --display: "Fraunces", Georgia, "Times New Roman", serif;
  --body: "Inter", "Segoe UI", system-ui, sans-serif;"""

# Type scale. The moodboard fixes H1 52 / H2 38 / H3 26 / body 18 / small 14.
# --t-statement and --t-price are this design's own beats and are not in the
# moodboard, so they keep their ratio to h1 (x0.867) rather than being invented.
SCALE = [
    ("  --t-small: 0.875rem;      /* 14px — meta, captions, fine print */",
     "  --t-small: 0.875rem;      /* 14px — moodboard 'Small 14' */"),
    ("  --t-body: 1.0625rem;      /* 17px */",
     "  --t-body: 1.125rem;       /* 18px — moodboard 'Body 18' */"),
    ("  --t-lead: 1.25rem;        /* 20px */",
     "  --t-lead: 1.3125rem;      /* 21px — holds its step above body */"),
    ("  --t-h3: 1.5rem;           /* 24px */",
     "  --t-h3: 1.625rem;         /* 26px — moodboard 'H3 26' */"),
    ("  --t-h2: 2.75rem;          /* 44px */",
     "  --t-h2: 2.375rem;         /* 38px — moodboard 'H2 38' */"),
    ("  --t-h1: 3.75rem;          /* 60px */",
     "  --t-h1: 3.25rem;          /* 52px — moodboard 'H1 52' */"),
    ("  --t-statement: 3.4rem;    /* 54.4px */",
     "  --t-statement: 2.95rem;   /* 47.2px — h1 x 0.907, ratio preserved */"),
    ("  --t-price: 5.5rem;        /* 88px */",
     "  --t-price: 4.75rem;       /* 76px — h1 x 1.462, ratio preserved */"),
]

# Display ladder — same ratios to the new base as before, so the steps still
# land where the old ones did relative to the headline.
LADDER = [
    ("    --t-h1: 3.3rem;         /* 52.8 (50.2) */",
     "    --t-h1: 2.86rem;        /* 45.8 — h1 x 0.88, as before */"),
    ("    --t-h2: 2.5rem;         /* 40.0 (37.8) */",
     "    --t-h2: 2.16rem;        /* 34.6 — h2 x 0.909, as before */"),
    ("    --t-statement: 2.95rem; /* 47.2 (44.2) */",
     "    --t-statement: 2.56rem; /* 41.0 — statement x 0.868, as before */"),
    ("    --t-h1: 2.9rem;         /* 46.4 (44.0) */",
     "    --t-h1: 2.51rem;        /* 40.2 — h1 x 0.773, as before */"),
    ("    --t-h2: 2.25rem;        /* 36.0 (33.9) */",
     "    --t-h2: 1.94rem;        /* 31.0 — h2 x 0.818, as before */"),
    ("    --t-statement: 2.55rem; /* 40.8 (37.6) */",
     "    --t-statement: 2.21rem; /* 35.4 — statement x 0.75, as before */"),
    ("    --t-price: 4.8rem;      /* 76.8 (70.4) */",
     "    --t-price: 4.15rem;     /* 66.4 — price x 0.873, as before */"),
    ("    --t-h1: 2.5rem;         /* 34.4 (35.0) */",
     "    --t-h1: 2.17rem;        /* 29.9 — h1 x 0.667, as before */"),
    ("    --t-h2: 2.05rem;        /* 28.2 (28.3) */",
     "    --t-h2: 1.77rem;        /* 24.4 — h2 x 0.745, as before */"),
    ("    --t-statement: 2.05rem; /* 28.2 (27.7) */",
     "    --t-statement: 1.78rem; /* 24.5 — statement x 0.603, as before */"),
    ("    --t-price: 4rem;        /* 55.0 (51.5) */",
     "    --t-price: 3.45rem;     /* 47.5 — price x 0.727, as before */"),
]

# Reading tier at <=478. Body must still clear 16px at 360, where the root is
# 13.0px: 1.235rem x 13.0 = 16.06. The base moved 17 -> 18px, so lead moves too.
READING = [
    ("    --t-body: 1.235rem;     /* 17.0 (16.1) — body must clear 16px on a phone */",
     "    --t-body: 1.31rem;      /* 18.0 (17.0) — body must clear 16px on a phone */"),
    ("    --t-lead: 1.4rem;       /* 19.3 (18.2) — keeps its step above body */",
     "    --t-lead: 1.47rem;      /* 20.2 (19.1) — keeps its step above body */"),
]

# --- rules the moodboard's Do/Avoid section overrides ------------------------
# These are not colour swaps; they are the rule "dark ink on cyan, never white".
RULES = [
    (".btn--sand { background: var(--sand-deep); color: var(--white); }",
     ".btn--sand { background: var(--sand-deep); color: var(--on-accent); }"),
]

# Fraunces belongs on headings and large numerals. The moodboard's own buttons
# and micro-labels are Inter; a serif at 11-15px uppercase is not what section
# 04 asks for. These selectors move off --display.
TO_BODY_FONT = [
    ".btn",
    ".chapter-readout b",
    ".head-phone span:last-child",
    ".offer-rail .rail-call",
    ".price-save",
    ".rating .score",
]


def swap_colours(text):
    n = 0
    for old, new in COLOURS:
        c = text.count(old)
        if c:
            text = text.replace(old, new)
            n += c
    return text, n


def apply_pairs(text, pairs, label, required=True):
    missed = []
    for old, new in pairs:
        if old in text:
            text = text.replace(old, new)
        else:
            missed.append(old.strip()[:60])
    if missed and required:
        print(f"  !! {label}: {len(missed)} pattern(s) did not match:", file=sys.stderr)
        for m in missed:
            print(f"     {m}", file=sys.stderr)
    return text, missed


def move_off_display(css, selectors):
    """Switch `font-family: var(--display)` to var(--body) inside named rules."""
    moved = []
    for sel in selectors:
        # match the rule block for this exact selector
        pat = re.compile(
            r"(^" + re.escape(sel) + r"\s*\{)(.*?)(^\})",
            re.S | re.M)

        def sub(m):
            body = m.group(2).replace("font-family: var(--display);",
                                      "font-family: var(--body);")
            return m.group(1) + body + m.group(3)

        new = pat.sub(sub, css, count=1)
        if new != css:
            moved.append(sel)
            css = new
    return css, moved


def main():
    total = 0
    for rel in FILES:
        p = os.path.join(TMP, rel)
        t = io.open(p, encoding="utf-8").read()
        before = t

        if rel.endswith("mpd.css"):
            t, _ = apply_pairs(t, [(OLD_BRAND, NEW_BRAND), (OLD_TYPE, NEW_TYPE)], "tokens")
            t, _ = apply_pairs(t, SCALE, "type scale")
            t, _ = apply_pairs(t, LADDER, "display ladder")
            t, _ = apply_pairs(t, READING, "reading tier")
            t, _ = apply_pairs(t, RULES, "moodboard rules")
            t, moved = move_off_display(t, TO_BODY_FONT)
            print(f"  moved off Fraunces: {', '.join(moved)}")
            # h3 is weight 500 in the moodboard, h1/h2 stay 600
            t = t.replace("h1 { font-size: var(--t-h1); }",
                          "h1 { font-size: var(--t-h1); }\n"
                          "/* Moodboard section 04: H3 is weight 500, H1/H2 600. */\n"
                          "h3 { font-weight: 500; }")
            # Fraunces is a variable optical-size face; without this it sets at
            # the wrong optical size and reads spindly at display sizes.
            t = t.replace("h1, h2, h3 {\n  font-family: var(--display);",
                          "h1, h2, h3 {\n  font-family: var(--display);\n"
                          "  font-optical-sizing: auto;")

        t, n = swap_colours(t)
        total += n

        # the fonts the pages load
        t = t.replace(
            "family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Outfit:wght@400;500;600;700",
            "family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Inter:wght@400;500;600")

        if t != before:
            io.open(p, "w", encoding="utf-8", newline="").write(t)
            print(f"  {rel}: {n} colour literal(s) swapped")

    print(f"total colour literals swapped: {total}")


if __name__ == "__main__":
    main()
