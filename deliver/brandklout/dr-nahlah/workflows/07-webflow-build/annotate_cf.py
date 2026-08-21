"""Annotate the coded design package with `data-cf` Client-First reuse hints.

Reuse cannot be inferred from CSS similarity (proven: 4% honest coverage), so it
is authored here instead. Each rule maps a CSS selector in the design package to
the Relume/Client-First classes that already exist on the target site.

The converter honours `data-cf` by applying those classes and emitting NO style
of its own, so the element inherits the site's existing definition *and* its
variable bindings — which the Webflow clipboard format cannot carry.

Also renames two authored class names (`label`, `section`) that collide with
tag-level styles in the live style guide.

Usage:
    python annotate_cf.py --in <src.html> --out <dst.html> [--report]
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup

# --- authored class renames -------------------------------------------------
# Webflow merges by NAME site-wide. `.label` already exists on the Dr. Nahlah
# site as a tag-level style; `.section` is close enough to be dangerous.
RENAMES = {
    "label": "eyebrow",
    "section": "sec-pad",
    # `.cmp .tag` collides with a class of the same name in the live Relume
    # style guide. Not an annotation — an accidental match, which would have
    # pulled the site's `tag` styling onto the before/after labels.
    "tag": "cmp-tag",
}

# Single-letter authored classes are too short for the generic word-boundary
# rename (`.a`/`.b` would match far too much), so they are rewritten with exact
# patterns instead. Source: the before/after tags in the Transformation chapter.
EXACT_REWRITES: list[tuple[str, str]] = [
    (".cmp .cmp-tag.b", ".cmp .tag-before"),
    (".cmp .cmp-tag.a", ".cmp .tag-after"),
    ("class=\"cmp-tag b\"", "class=\"cmp-tag tag-before\""),
    ("class=\"cmp-tag a\"", "class=\"cmp-tag tag-after\""),
]

# --- selector -> Client-First classes ---------------------------------------
# Ordered; every matching rule contributes. Selectors are scoped to the design
# package's own markup, never to the GSAP scaffolding.
CF_RULES: list[tuple[str, str]] = [
    # Layout shell
    (".wrap",                       "container-large"),
    (".sec-pad",                    "padding-section-large"),

    # Headings by role
    (".ch-arrival h1",              "heading-style-h1"),
    ("section h2",                  "heading-style-h2"),
    (".cta h2",                     "heading-style-h2"),
    ("section h3",                  "heading-style-h4"),
    (".foot h4",                    "text-size-tiny text-style-allcaps text-weight-semibold"),

    # Eyebrows / labels
    (".eyebrow",                    "text-size-tiny text-style-allcaps text-weight-semibold"),

    # Body copy
    (".ch-arrival .lead",           "text-size-medium text-weight-light"),
    (".ch-reality .after p",        "text-size-regular text-weight-light"),
    (".ch-specialist .bio p",       "text-size-regular text-weight-light"),
    (".ch-standard .head p",        "text-size-regular text-weight-light"),
    (".ch-path .card p",            "text-size-regular text-weight-light"),
    (".std .cap span",              "text-size-regular text-weight-light"),
    (".rv p",                       "text-size-regular text-weight-light"),
    (".vs-head p",                  "text-size-regular text-weight-light"),
    (".foot .blurb",                "text-size-regular text-weight-light"),
    (".cta p",                      "text-size-medium"),

    # Buttons
    (".btn",                        "button"),
    (".actions",                    "button-group"),

    # Credential + location lists
    (".creds li",                   "text-size-regular text-weight-light"),
    (".loc address",                "text-size-regular text-weight-light"),
]


def apply_renames(html: str) -> tuple[str, Counter]:
    """Rename authored classes in both the CSS and the class attributes."""
    counts: Counter = Counter()
    for old, new in RENAMES.items():
        # CSS selectors: `.label` -> `.eyebrow` (word-boundary safe)
        html, n_css = re.subn(rf"\.{re.escape(old)}\b(?![-\w])", f".{new}", html)
        # class="... label ..." occurrences
        def _swap(m):
            classes = m.group(2).split()
            if old not in classes:
                return m.group(0)
            counts[old] += 1
            return f'{m.group(1)}="{" ".join(new if c == old else c for c in classes)}"'
        html = re.sub(r'(class)="([^"]*)"', _swap, html)
        counts[f"{old}:css"] = n_css
    # Runs AFTER the generic renames — these patterns are written against the
    # already-renamed text (`.cmp .cmp-tag.b`, not `.cmp .tag.b`).
    for old, new in EXACT_REWRITES:
        n = html.count(old)
        if n:
            html = html.replace(old, new)
            counts[old] = n
    return html, counts


def annotate(html: str) -> tuple[str, Counter, int]:
    soup = BeautifulSoup(html, "html.parser")
    hits: Counter = Counter()

    for selector, cf in CF_RULES:
        try:
            found = soup.select(selector)
        except Exception as exc:  # noqa: BLE001 - bad selector should be loud
            print(f"  ! bad selector {selector!r}: {exc}", file=sys.stderr)
            continue
        for el in found:
            existing = (el.get("data-cf") or "").split()
            merged = existing + [c for c in cf.split() if c not in existing]
            el["data-cf"] = " ".join(merged)
            hits[selector] += 1

    annotated = len(soup.select("[data-cf]"))
    return str(soup), hits, annotated


def _split_css(css: str) -> tuple[str, str]:
    """Split a section stylesheet into (native, embed).

    Per html-to-webflow-clipboard.md the division of labour is:
      * unmarked <style>  -> folded into the cascade, becomes Designer-editable
                             Webflow classes
      * <style data-embed> -> rides as an HtmlEmbed, excluded from the cascade,
                             and carries ONLY what a class cannot express.

    A rule goes to the embed when it is an at-rule (`@keyframes`, `@media`,
    `@supports`), declares a CSS custom property (`_clean_decls` strips `--*`
    from class records, and `--pos` is what drives the before/after wipe), or
    targets a `::before` / `::after` pseudo-element.
    """
    native, embed = [], []
    i, n = 0, len(css)
    while i < n:
        if css[i].isspace():
            i += 1
            continue
        if css[i] == "@":
            # Copy the whole at-rule, balancing braces.
            j = css.find("{", i)
            if j < 0:
                break
            depth, k = 0, j
            while k < n:
                if css[k] == "{":
                    depth += 1
                elif css[k] == "}":
                    depth -= 1
                    if depth == 0:
                        k += 1
                        break
                k += 1
            embed.append(css[i:k])
            i = k
            continue
        j = css.find("{", i)
        if j < 0:
            break
        k = css.find("}", j)
        if k < 0:
            break
        selector, body, rule = css[i:j].strip(), css[j + 1:k], css[i:k + 1]
        # Only a DECLARATION of a custom property needs the embed. A `var(--x)`
        # reference does not — the resolver expands those into concrete values,
        # and treating them as embed-only would push ordinary styling out of
        # native Webflow classes for no reason.
        declares_custom_prop = re.search(r"(?:^|;|\{)\s*--[\w-]+\s*:", body) is not None
        needs_embed = (
            declares_custom_prop
            or "::before" in selector
            or "::after" in selector
        )
        (embed if needs_embed else native).append(rule)
        i = k + 1
    return "\n".join(native), "\n".join(embed)


def wire_embeds(html: str) -> tuple[str, Counter]:
    """Mark section <script> as data-embed and split each section <style>."""
    soup = BeautifulSoup(html, "html.parser")
    stats: Counter = Counter()

    for section in soup.select("section[data-chapter]"):
        for script in section.find_all("script"):
            script["data-embed"] = ""
            stats["scripts"] += 1

        for style in section.find_all("style"):
            if style.has_attr("data-embed"):
                continue
            native, embed_css = _split_css(style.string or "")
            style.string = native
            if embed_css.strip():
                tag = soup.new_tag("style")
                tag["data-embed"] = ""
                tag.string = embed_css
                section.append(tag)
                stats["style-embeds"] += 1
                stats["embed-chars"] += len(embed_css)

    return str(soup), stats


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--in", dest="src", required=True)
    ap.add_argument("--out", dest="dst", required=True)
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    html = Path(args.src).read_text(encoding="utf-8")
    html, rename_counts = apply_renames(html)
    html, hits, annotated = annotate(html)
    html, embed_stats = wire_embeds(html)
    Path(args.dst).write_text(html, encoding="utf-8")

    print(f"wrote {args.dst}")
    renamed = ", ".join(f"{k}->{RENAMES[k]} ({v})" for k, v in rename_counts.items()
                        if k in RENAMES)
    exact = sum(v for k, v in rename_counts.items() if k not in RENAMES and not k.endswith(":css"))
    print(f"  renamed classes   : {renamed}" + (f"; {exact} exact rewrites" if exact else ""))
    print(f"  elements annotated: {annotated}")
    print(f"  script embeds     : {embed_stats['scripts']}")
    print(f"  style embeds      : {embed_stats['style-embeds']} "
          f"({embed_stats['embed-chars']} chars of rules classes cannot express)")
    if args.report:
        print("  per-rule:")
        for sel, cf in CF_RULES:
            n = hits.get(sel, 0)
            flag = "" if n else "   <- NO MATCH"
            print(f"    {n:4d}  {sel:28s} -> {cf}{flag}")


if __name__ == "__main__":
    main()
