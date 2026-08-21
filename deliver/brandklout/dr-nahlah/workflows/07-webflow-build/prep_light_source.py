"""Prepare the light home page for conversion: mark the per-section scripts as
self-contained embeds, and rename classes that would collide with the site's
live Relume style guide.

Webflow attaches a pasted/inserted class to an EXISTING class of the same name.
A design class called `label` therefore does not get its own record — it lands on
the style guide's `.label` and overwrites it, damaging every Relume component
that uses it. The four names below are the full collision set, computed by
intersecting the converted payload's style names against the 288 class names
live on the site (`data_style_tool > get_styles`).

`b` does not collide today, but it is renamed alongside `a` because a
single-letter global class is one careless paste away from colliding with
anything.

Usage:
    python prep_light_source.py \
        --html ../04-design/.tmp/final-site/index.html \
        --out .tmp/source/index-light.html

Every rename asserts its expected hit count, so a design edit that adds or
removes one of these classes fails the build loudly instead of silently
shipping a collision.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

# (description, needle, replacement, expected occurrences)
RENAMES = [
    ("eyebrow class attr",  'class="label"',   'class="eyebrow"',           9),
    ("eyebrow rule",        '.label{',         '.eyebrow{',                 1),
    ("before/after tag a",  'class="tag a"',   'class="ba-tag ba-a"',       1),
    ("before/after tag b",  'class="tag b"',   'class="ba-tag ba-b"',       1),
    ("tag rule",            '.cmp .tag{',      '.cmp .ba-tag{',             2),
    ("tag.a rule",          '.cmp .tag.a{',    '.cmp .ba-tag.ba-a{',        1),
    ("tag.b rule",          '.cmp .tag.b{',    '.cmp .ba-tag.ba-b{',        1),
    # Five pages (all-on-4, dental-implants, smile-gallery, smile-makeover,
    # veneers) already ship the later `ba-tag` name in the source but still pair
    # it with the bare `a`/`b` modifiers, which the index-derived rules above do
    # not reach. `a` and `b` are HTML tag names: left alone they become TAG
    # styles in Webflow and repaint every <a>/<b> on the site. Caught by the
    # survivor invariant, not by a count — which is why that check is
    # unconditional.
    ("ba-tag a attr",       'class="ba-tag a"', 'class="ba-tag ba-a"',      0),
    ("ba-tag b attr",       'class="ba-tag b"', 'class="ba-tag ba-b"',      0),
]

# Class-attribute renames applied per TOKEN, so they hold however the design
# combines them. Enumerating whole attribute values instead missed
# `class="cta section"` on the first pass.
# (description, token, replacement, expected occurrences)
RENAMES_TOKEN = [
    ("site-nav token", "nav",     "site-nav", 1),
    ("sec-pad token",  "section", "sec-pad",  6),
]

# A class whose name equals an HTML tag does not stay a class in Webflow — it
# becomes that TAG's style and repaints every such element site-wide. `nav` and
# `section` are the design's own class names, so they are renamed by selector,
# matching only where the token ends (never `.nav-mid`, never `.tagline`).
#
# The terminator is a NEGATIVE lookahead for name characters, not a list of the
# punctuation that happened to follow. An enumerated set `(?=[{.,: )])` silently
# missed `.nav[data-journey="1"]` — an attribute selector — which left the two
# rules that drive the scrolled nav readout (hide the links, reveal the chapter
# counter) pointing at a class no element carries any more. Dead on the live
# site, invisible to every static check, and the paste gate passed anyway
# because it only asserts that `.solid` repaints the bar.
# (description, pattern, replacement, expected occurrences)
RENAMES_RE = [
    ("site-nav selectors", r"\.nav(?![-\w])",     ".site-nav",  11),
    ("sec-pad selectors",  r"\.section(?![-\w])",  ".sec-pad",    1),
    # Boundary-aware, because a plain string replace of `.ba-tag.b` also matches
    # inside `.ba-tag.ba-b` — the output of the `.cmp .tag.b` rule above — and
    # would rewrite it a second time.
    ("ba-tag.a selectors", r"\.ba-tag\.a(?![-\w])", ".ba-tag.ba-a", 0),
    ("ba-tag.b selectors", r"\.ba-tag\.b(?![-\w])", ".ba-tag.ba-b", 0),
]


# Number of `<script>` blocks that live inside a <section> in the design. Each
# is that chapter's own behaviour and belongs INSIDE the section, not in a
# shared footer bundle.
SECTION_SCRIPTS = 9


def mark_section_embeds(html: str) -> tuple[str, int]:
    """Tag every `<script>` inside a `<section>` with `data-embed`.

    Without the attribute `extract_custom_code` hoists all nine chapter scripts
    into one footer bundle. That bundle came to 21,546 characters — over
    Webflow's 10,000-character custom-code slot, i.e. the build could not be
    installed at all — and it also breaks the packaging rule this workflow
    requires (a pasted section must work on any page with zero page-settings
    changes). `data-embed` makes each one ride the payload as an in-place
    HtmlEmbed, which is what the design's own header comment says it intends:
    "Every section below carries its own <style> and <script>".

    The head scripts and the single global footer block are deliberately left
    alone — the bootstrap must stay in <head> and the register/flush must stay
    in the footer.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    hits = 0
    for script in soup.find_all("script"):
        if script.has_attr("data-embed"):
            continue
        if not any(getattr(a, "name", None) == "section" for a in script.parents):
            continue
        script["data-embed"] = ""
        hits += 1
    return (str(soup), hits) if hits else (html, 0)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--html", required=True, help="built page to transform")
    ap.add_argument("--out", required=True, help="collision-safe copy to write")
    # The hit counts below were derived from index.html. Every page of this site
    # shares the same partials, so the same collisions appear on all of them —
    # but in different quantities. Checking exact counts is a real guard against
    # a silent design change, so it stays ON for the page it was derived from
    # and OFF elsewhere; the INVARIANTS (nothing banned survives) are always
    # enforced, on every page.
    ap.add_argument("--expect-counts", action="store_true",
                    help="assert index.html's exact hit counts (default: off)")
    args = ap.parse_args()

    src = pathlib.Path(args.html)
    html = src.read_text(encoding="utf-8")

    failures = []
    strict = args.expect_counts

    def note(msg):
        (failures.append if strict else lambda m: print("[prep]" + m))(msg)

    html, embeds = mark_section_embeds(html)
    if embeds != SECTION_SCRIPTS:
        note(f"  section embeds: expected {SECTION_SCRIPTS} scripts inside a "
             f"<section>, marked {embeds}")
    for label, needle, repl, expected in RENAMES:
        found = html.count(needle)
        if found != expected:
            note(f"  {label}: expected {expected} of {needle!r}, found {found}")
            if strict:
                continue
        html = html.replace(needle, repl)

    for label, token, repl, expected in RENAMES_TOKEN:
        hits = 0

        def swap(match, token=token, repl=repl):
            nonlocal hits
            classes = match.group(1).split()
            hits += classes.count(token)
            return 'class="%s"' % " ".join(repl if c == token else c for c in classes)

        html = re.sub(r'class="([^"]*)"', swap, html)
        if hits != expected:
            note(f"  {label}: expected {expected} uses of class {token!r}, found {hits}")

    for label, pattern, repl, expected in RENAMES_RE:
        html, found = re.subn(pattern, repl, html)
        if found != expected:
            note(f"  {label}: expected {expected} matches of {pattern!r}, found {found}")

    if failures:
        print("[prep_light_source] rename counts do not match the source:", file=sys.stderr)
        print("\n".join(failures), file=sys.stderr)
        print("\nThe design changed. Re-derive the collision set before shipping.", file=sys.stderr)
        return 1

    # Nothing may survive that still carries a colliding or bare-tag name.
    # Checked against class ATTRIBUTES, not raw text — matching the bare word
    # ` section ` anywhere also hits the page's prose.
    banned = {"label", "tag", "a", "b", "nav", "section"}
    for match in re.finditer(r'class="([^"]*)"', html):
        left = banned.intersection(match.group(1).split())
        if left:
            print(f"[prep_light_source] {sorted(left)} survived in {match.group(0)!r}",
                  file=sys.stderr)
            return 1

    for stale in ('.label{', '.cmp .tag{', '.cmp .tag.'):
        if stale in html:
            print(f"[prep_light_source] rule {stale!r} survived the rename", file=sys.stderr)
            return 1

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    total = sum(e for _, _, _, e in RENAMES)
    print(f"[prep_light_source] {total} renames applied -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
