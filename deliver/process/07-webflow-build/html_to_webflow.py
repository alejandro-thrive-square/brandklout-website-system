#!/usr/bin/env python3
"""
html_to_webflow.py  —  EXPERIMENTAL

Convert HTML + CSS into Webflow's clipboard paste format (@webflow/XscpData)
so a generated component can be pasted directly into the Webflow Designer.

Reverse-engineered from real clipboard captures inspected with
https://evercoder.github.io/clipboard-inspector/:
    .tmp/webflow_navbar.json
    .tmp/webflow_section_hero.json
    .tmp/webflow_combo_class.json

The Webflow clipboard payload is a FLAT graph that the Designer re-hydrates:

    { "type": "@webflow/XscpData",
      "payload": {
          "nodes":  [ ... element + text nodes, referenced by _id ... ],
          "styles": [ ... one per CSS class, CSS lives in `styleLess` ... ],
          "assets": [ ... <img> metadata ... ],
          "ix1": [], "ix2": {interactions, events, actionLists} },
      "meta": { ...counters... } }

Webflow's class model is FLAT: one class == one style block, no descendant or
compound selectors. Hand-authored designs lean heavily on descendant selectors
(`.hero-meta .cell`, `.hero h1 .l1`, `a:hover`). The CASCADE RESOLVER computes
each element's effective declarations from the full stylesheet (descendant,
compound, pseudo-state, media query) and bakes them into that element's own
class, so styling survives the paste.

Two things go on the clipboard cooperatively: this script builds the JSON; a
BROWSER puts it on the clipboard under the `application/json` MIME type that
Webflow's paste handler reads (see write_copy_page / --copy-page). The OS `clip`
command can only write text/plain, which Webflow ignores.

Dependencies: beautifulsoup4 (HTML + soupsieve selector matching). CSS is parsed
by a small built-in parser, so no extra packages are required.

Usage:
    python html_to_webflow.py --html page.html --css styles.css --copy-page paste.html
    python html_to_webflow.py --html page.html --root "section.hero" --copy-page paste.html
    python html_to_webflow.py --html page.html --css styles.css --out out.json --indent 2
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import uuid
from dataclasses import dataclass, field
from typing import NamedTuple, Optional

try:
    from bs4 import BeautifulSoup, Comment, NavigableString, Tag
except ImportError:  # pragma: no cover
    sys.exit("beautifulsoup4 is required:  pip install beautifulsoup4")


# --------------------------------------------------------------------------- #
# Mappings
# --------------------------------------------------------------------------- #

# HTML tag -> Webflow element `type`. Unknown tags fall back to "Block".
TAG_TO_TYPE = {
    "div": "Block", "section": "Block", "header": "Block", "footer": "Block",
    "main": "Block", "article": "Block", "aside": "Block", "nav": "Block",
    "figure": "Block", "figcaption": "Block", "details": "Block", "summary": "Block",
    "span": "Block", "em": "Block", "strong": "Block", "b": "Block", "i": "Block",
    # NOTE: <button> is intentionally NOT here — `tag:"button"` is not a valid
    # Webflow Block tag and crashes the Designer on reload. It falls through to
    # the HtmlEmbed safety path (see add_element).
    "h1": "Heading", "h2": "Heading", "h3": "Heading",
    "h4": "Heading", "h5": "Heading", "h6": "Heading",
    "p": "Paragraph",
    "a": "Link",
    "img": "Image",
    "ul": "List", "ol": "List",
    "li": "ListItem",
    "blockquote": "Blockquote",
}

# Tags rendered as a raw HTML embed rather than a Webflow element tree.
EMBED_TAGS = {"svg", "iframe", "canvas", "video", "audio"}
# Void / skip.
VOID_TAGS = {"img", "br", "hr", "input", "source"}
SKIP_TAGS = {"script", "style", "br"}
# Inline-flow tags: a whitespace-only text node adjacent to one of these is a
# meaningful word separator and must survive as a " " text node. Whitespace
# between block-level siblings is layout noise and is still dropped.
INLINE_TAGS = {"a", "abbr", "b", "code", "em", "i", "mark", "small", "span",
               "strong", "sub", "sup", "time", "u"}

# @media (max-width: N) -> Webflow breakpoint variant key.
MAXWIDTH_TO_BREAKPOINT = {991: "medium", 767: "small", 479: "tiny"}
MINWIDTH_TO_BREAKPOINT = {1280: "large", 1440: "xl", 1920: "xxl"}
# A `min-width` below this is a MOBILE-FIRST enhancement that is already true on
# Webflow's desktop base, not a large-screen addition. Above it, the query really
# does target Webflow's xl/xxl breakpoints.
MOBILE_FIRST_CUTOFF = 1280

# Pseudo-classes that represent interactive STATES -> Webflow variant suffixes.
STATE_PSEUDOS = {"hover", "focus", "active", "visited",
                 "focus-visible", "focus-within", "target"}
# Pseudo-ELEMENTS Webflow cannot represent as class styles (reported, skipped).
PSEUDO_ELEMENTS = {"before", "after", "first-line", "first-letter",
                   "placeholder", "selection", "marker", "backdrop"}


def new_id() -> str:
    return str(uuid.uuid4())


def normalize_href(href: str) -> str:
    """Rewrite static-export page links to Webflow's root-relative format.

    Designs are authored as a folder of `.html` files (`sell.html`,
    `index.html#about`), but a Webflow site serves slugs at the root
    (`/sell`, `/#about`, `/` for the homepage). A pasted `<a>` keeps its raw
    href, so without this the published nav points at non-existent
    `…/sell.html` URLs. Anchors, protocols (tel:/mailto:/http(s)), protocol-
    relative, and already-rooted hrefs are left untouched.
    """
    if not href:
        return href
    h = href.strip()
    if h.startswith(("#", "/", "tel:", "mailto:", "http://", "https://", "//")):
        return href
    m = re.match(r"^([^?#]*?)\.html(\?[^#]*)?(#.*)?$", h)
    if not m:
        return href
    base = m.group(1).rsplit("/", 1)[-1]      # filename without dir
    query, frag = m.group(2) or "", m.group(3) or ""
    path = "/" if base in ("", "index") else "/" + base
    return path + query + frag


# Attributes handled elsewhere (class/style/id/links/images) — not copied to xattr.
_ATTR_SKIP = {"class", "style", "id", "href", "src", "srcset", "sizes",
              "width", "height", "alt", "loading"}


def _custom_attrs(tag) -> list:
    """Carry data-*/aria-*/role/title-style custom attributes into Webflow's
    `xattr` list. Inline event handlers (on*) are intentionally dropped."""
    out = []
    for k, v in tag.attrs.items():
        if k in _ATTR_SKIP or k.startswith("on"):
            continue
        if isinstance(v, list):
            v = " ".join(v)
        out.append({"name": k, "value": v if v is not None else ""})
    return out


# --------------------------------------------------------------------------- #
# CSS tokenizing
# --------------------------------------------------------------------------- #

def _strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)


def _iter_rule_blocks(css: str):
    """Yield (selector-or-at-rule, body) pairs at the current nesting level."""
    i, n = 0, len(css)
    while i < n:
        brace = css.find("{", i)
        if brace == -1:
            break
        selector = css[i:brace].strip()
        depth, j = 1, brace + 1
        while j < n and depth:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        yield selector, css[brace + 1:j - 1]
        i = j


def _parse_decls(body: str) -> list[tuple[str, str]]:
    """Declaration block -> ordered list of (property, value). `;` inside ()
    (e.g. url(), gradients) is respected."""
    out, depth, buf = [], 0, []
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == ";" and depth == 0:
            _push_decl("".join(buf), out)
            buf = []
        else:
            buf.append(ch)
    _push_decl("".join(buf), out)
    return out


def _push_decl(part: str, out: list):
    part = part.strip()
    if part and ":" in part:
        prop, _, val = part.partition(":")
        out.append((prop.strip(), val.strip()))


def _decls_to_styleless(decls) -> str:
    if isinstance(decls, dict):
        decls = decls.items()
    return " ".join(f"{p}: {v};" for p, v in decls)


def _expand_box(val: str):
    """1-to-4 value box shorthand -> (top, right, bottom, left)."""
    p = val.split()
    if len(p) == 1:
        return p[0], p[0], p[0], p[0]
    if len(p) == 2:
        return p[0], p[1], p[0], p[1]
    if len(p) == 3:
        return p[0], p[1], p[2], p[1]
    return p[0], p[1], p[2], p[3]


def _expand_box_paren_aware(val: str):
    """Like _expand_box but respects parentheses (for calc(), var(), etc.)."""
    tokens, buf, depth = [], [], 0
    for ch in val:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == " " and depth == 0:
            if buf:
                tokens.append("".join(buf))
                buf = []
        else:
            buf.append(ch)
    if buf:
        tokens.append("".join(buf))
    if not tokens:
        return val, val, val, val
    if len(tokens) == 1:
        return tokens[0], tokens[0], tokens[0], tokens[0]
    if len(tokens) == 2:
        return tokens[0], tokens[1], tokens[0], tokens[1]
    if len(tokens) == 3:
        return tokens[0], tokens[1], tokens[2], tokens[1]
    return tokens[0], tokens[1], tokens[2], tokens[3]


def _parse_border_value(val: str) -> tuple[str, str, str]:
    """Parse border shorthand -> (width, style, color).
    Tokenizes respecting parentheses for var(), rgba(), etc."""
    val = val.strip()
    if val in ("0", "none", "initial", "inherit", "unset"):
        return ("0px", "none", "transparent")
    tokens, buf, depth = [], [], 0
    for ch in val:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == " " and depth == 0:
            if buf:
                tokens.append("".join(buf))
                buf = []
        else:
            buf.append(ch)
    if buf:
        tokens.append("".join(buf))
    border_styles = {"none", "hidden", "dotted", "dashed", "solid",
                     "double", "groove", "ridge", "inset", "outset"}
    width, style, color = "", "", ""
    for token in tokens:
        if token in border_styles:
            style = token
        elif re.match(r"^[\d.]", token) or token in ("thin", "medium", "thick"):
            width = token
        else:
            color = token
    return (width or "1px", style or "solid", color or "black")


def _expand_grid_tracks(val: str) -> str:
    """Expand `repeat(N, tracks)` -> explicit track list; Webflow's styleLess
    stores explicit tracks, not the repeat() function."""
    def rep(m):
        return " ".join([m.group(2).strip()] * int(m.group(1)))
    return re.sub(r"repeat\(\s*(\d+)\s*,\s*([^()]+)\)", rep, val)


def _expand_shorthands(d: dict) -> dict:
    """Translate properties Webflow's styleLess parser doesn't accept into the
    longhands/aliases it stores:
      - `gap`/`row-gap`/`column-gap` -> `grid-row-gap`/`grid-column-gap`
        (Webflow uses these for BOTH grid AND flex; modern `gap` is ignored)
      - `inset` -> top/right/bottom/left
      - `repeat()` grid tracks -> explicit track lists
    Webflow only registers an element as a grid when `grid-template-columns`,
    `grid-template-rows` and `grid-auto-columns` are all present, so those
    defaults are injected for any `display: grid` element (mirrors real Webflow
    grid captures — e.g. a rows-only grid still needs an explicit column)."""
    out: dict = {}
    for prop, val in d.items():
        if prop == "inset":
            t, r, b, l = _expand_box(val)
            out["top"], out["right"], out["bottom"], out["left"] = t, r, b, l
        elif prop in ("gap", "grid-gap"):
            if "(" in val:                      # calc()/min() etc. — don't split
                out["grid-row-gap"] = out["grid-column-gap"] = val
            else:
                parts = val.split()
                out["grid-row-gap"] = parts[0]
                out["grid-column-gap"] = parts[1] if len(parts) > 1 else parts[0]
        elif prop == "row-gap":
            out["grid-row-gap"] = val
        elif prop == "column-gap":
            out["grid-column-gap"] = val
        elif prop in ("grid-template-columns", "grid-template-rows") and "repeat(" in val:
            out[prop] = _expand_grid_tracks(val)
        elif prop == "padding":
            t, r, b, l = _expand_box_paren_aware(val)
            out["padding-top"] = t
            out["padding-right"] = r
            out["padding-bottom"] = b
            out["padding-left"] = l
        elif prop == "margin":
            t, r, b, l = _expand_box_paren_aware(val)
            out["margin-top"] = t
            out["margin-right"] = r
            out["margin-bottom"] = b
            out["margin-left"] = l
        elif prop == "flex":
            if val in ("none",):
                out["flex-grow"] = "0"
                out["flex-shrink"] = "0"
                out["flex-basis"] = "auto"
            elif val in ("auto",):
                out["flex-grow"] = "1"
                out["flex-shrink"] = "1"
                out["flex-basis"] = "auto"
            else:
                tokens = list(filter(None, _expand_box_paren_aware(val)[:3]))
                parts = [t for t in tokens if t]
                if len(parts) == 1:
                    if re.match(r"^[\d.]+$", parts[0]):
                        out["flex-grow"] = parts[0]
                        out["flex-shrink"] = "1"
                        out["flex-basis"] = "0"
                    else:
                        out["flex-grow"] = "1"
                        out["flex-shrink"] = "1"
                        out["flex-basis"] = parts[0]
                elif len(parts) == 2:
                    out["flex-grow"] = parts[0]
                    out["flex-shrink"] = parts[1]
                    out["flex-basis"] = "0"
                else:
                    out["flex-grow"] = parts[0]
                    out["flex-shrink"] = parts[1]
                    out["flex-basis"] = parts[2]
        elif prop == "border-radius":
            clean = val.split("/")[0].strip()
            t, r, b, l = _expand_box_paren_aware(clean)
            out["border-top-left-radius"] = t
            out["border-top-right-radius"] = r
            out["border-bottom-right-radius"] = b
            out["border-bottom-left-radius"] = l
        elif prop == "border":
            w, s, c = _parse_border_value(val)
            for side in ("top", "right", "bottom", "left"):
                out[f"border-{side}-style"] = s
                out[f"border-{side}-width"] = w
                out[f"border-{side}-color"] = c
        elif prop in ("border-top", "border-right", "border-bottom", "border-left"):
            side = prop.split("-")[1]
            w, s, c = _parse_border_value(val)
            out[f"border-{side}-style"] = s
            out[f"border-{side}-width"] = w
            out[f"border-{side}-color"] = c
        else:
            out[prop] = val
    if out.get("display") == "grid":
        # Emit grid tracks in Webflow's canonical order: grid-auto-columns FIRST,
        # then grid-template-columns, then grid-template-rows LAST. If
        # grid-auto-columns trails the templates, Webflow's Designer parser
        # treats the grid as auto-flow (Columns: 0) and lays children out
        # horizontally, even though a browser honors grid-template-columns.
        ac = out.pop("grid-auto-columns", "1fr")
        tc = out.pop("grid-template-columns", "1fr")
        tr = out.pop("grid-template-rows", "auto")
        out["grid-auto-columns"] = ac
        out["grid-template-columns"] = tc
        out["grid-template-rows"] = tr
    return out


def _breakpoint_for_media(condition: str) -> Optional[str]:
    m = re.search(r"max-width\s*:\s*(\d+)", condition)
    if m:
        px = int(m.group(1))
        # Nearest Webflow breakpoint, not a blanket "medium": a source
        # `max-width: 640px` block is phone styling and must land on small
        # (<=767), not medium (<=991) where it would restyle tablets.
        return min(MAXWIDTH_TO_BREAKPOINT.items(),
                   key=lambda kv: abs(kv[0] - px))[1]
    m = re.search(r"min-width\s*:\s*(\d+)", condition)
    if m:
        px = int(m.group(1))
        if px < MOBILE_FIRST_CUTOFF:
            # A mobile-first enhancement, NOT a large-screen one. Webflow's
            # model is desktop-base + max-width overrides, so `min-width:720px`
            # belongs at BASE with the pre-media value pushed DOWN to the
            # breakpoints below it (handled by _invert_mobile_first).
            # Nearest-matching it to xl (1280) filed the footer's 4-column
            # grid under XL and left the live desktop page single-column.
            return None
        return min(MINWIDTH_TO_BREAKPOINT.items(),
                   key=lambda kv: abs(kv[0] - px))[1]
    return None


# --------------------------------------------------------------------------- #
# Cascade resolver
# --------------------------------------------------------------------------- #

@dataclass
class Rule:
    selector: str                 # cleaned for soupsieve matching
    decls: list                   # [(prop, val), ...]
    specificity: tuple            # (ids, classes, types)
    order: int                    # source order (later wins on ties)
    breakpoint: Optional[str]     # None | medium | small | tiny | xl ...
    state: Optional[str]          # None | hover | focus ...
    pseudo: Optional[str] = None  # None | before | after (pseudo-element host rule)
    media: Optional[str] = None   # raw @media condition when it maps to NO
                                  # Webflow breakpoint (pointer: coarse,
                                  # prefers-reduced-motion, ...). Such rules are
                                  # excluded from class baking — treating them
                                  # as base CSS applied touch-only/motion-only
                                  # styling to everyone (the desktop drag cursor
                                  # pasted display:none). They ship via the
                                  # runtime-state CSS artifact instead.
    min_width: Optional[int] = None  # source `min-width` px when the rule came
                                  # from a mobile-first block that maps onto
                                  # Webflow's base (see _invert_mobile_first).


def _specificity(selector: str) -> tuple:
    ids = len(re.findall(r"#[\w-]+", selector))
    classes = (len(re.findall(r"\.[\w-]+", selector))
               + len(re.findall(r"\[[^\]]+\]", selector))
               + len(re.findall(r"(?<!:):[\w-]+", selector)))
    types = (len(re.findall(r"(?:^|[\s>+~])([a-zA-Z][\w-]*)", selector))
             + len(re.findall(r"::[\w-]+", selector)))
    return (ids, classes, types)


def _pseudo_element(selector: str) -> Optional[str]:
    """Return any pseudo-element name or None.

    Only before/after are materialized. Unsupported pseudo-elements must be
    skipped; otherwise selectors like `.track::-webkit-scrollbar` get cleaned to
    `.track` and scrollbar-only declarations collapse the real element.
    """
    m = re.search(r"::([\w-]+)(?:\([^)]*\))?", selector)
    if m:
        return m.group(1)
    m = re.search(r":(" + "|".join(PSEUDO_ELEMENTS) + r")\b", selector)
    return m.group(1) if m else None


def _state(selector: str) -> Optional[str]:
    m = re.search(r":(" + "|".join(STATE_PSEUDOS) + r")\b", selector)
    return m.group(1) if m else None


def _clean_selector(selector: str) -> str:
    """Strip state pseudo-classes / pseudo-elements so soupsieve can match the
    underlying element; structural pseudos (:nth-child, :not) are preserved."""
    selector = re.sub(r"::[\w-]+(?:\([^)]*\))?", "", selector)
    selector = re.sub(r":(" + "|".join(STATE_PSEUDOS | PSEUDO_ELEMENTS) + r")\b",
                      "", selector)
    return selector.strip()


def _variant_key(bp: Optional[str], state: Optional[str]) -> Optional[str]:
    if not bp and not state:
        return None
    return f"{bp or 'main'}_{state}" if state else bp


def expand_vars(value: str, varmap: dict, depth: int = 0) -> str:
    """Resolve `var(--name[, fallback])` against a custom-property map. Repeated
    passes resolve vars nested inside fallbacks."""
    if depth > 12 or "var(" not in value:
        return value

    def repl(m):
        name, _, fallback = m.group(1).partition(",")
        val = varmap.get(name.strip())
        if val is None:
            val = fallback.strip()
        return val if val else ""

    new = re.sub(r"var\(\s*(--[\w-]+(?:\s*,\s*[^()]*)?)\)", repl, value)
    return expand_vars(new, varmap, depth + 1) if new != value else new


def _normalize_css_var_name(name: str) -> str:
    name = str(name or "").strip()
    m = re.fullmatch(r"var\(\s*(--[\w-]+)\s*\)", name)
    if m:
        name = m.group(1)
    return name if name.startswith("--") else f"--{name}"


def rewrite_var_names(value: str, css_name_map: dict) -> str:
    """Rewrite source var() references to Webflow's actual CSS variable names."""
    if not css_name_map or "var(" not in value:
        return value

    def repl(m):
        name = _normalize_css_var_name(m.group(1))
        fallback = m.group(2) or ""
        mapped = css_name_map.get(name) or css_name_map.get(name.removeprefix("--"))
        if not mapped:
            return m.group(0)
        return f"var({_normalize_css_var_name(mapped)}{fallback})"

    return re.sub(r"var\(\s*(--[\w-]+)\s*(,\s*[^()]*)?\)", repl, value)


class ParsedCss(NamedTuple):
    """`var_scopes` carries the selector each custom-property block was declared
    on, which the flat `var_map` cannot express — see the note at the scope
    recording site below."""
    rules: list
    skipped: list
    var_map: dict
    var_scopes: list


def parse_rules(css: str) -> "ParsedCss":
    """Parse a stylesheet into a flat list of Rule objects. Returns
    (rules, skipped_pseudo_element_selectors, custom_property_map)."""
    css = _strip_comments(css)
    rules: list[Rule] = []
    skipped: list[str] = []
    var_map: dict[str, str] = {}
    var_scopes: list[tuple[str, dict, tuple, int]] = []
    order = 0

    def handle(group: str, body: str, bp, media: Optional[str] = None,
               min_width: Optional[int] = None):
        nonlocal order
        decls = _parse_decls(body)
        if not decls:
            return
        custom = {p: v for p, v in decls if p.startswith("--")}
        for prop, val in decls:                       # collect design tokens
            if prop.startswith("--") and bp is None and media is None:
                var_map[prop] = val
        for sel in group.split(","):
            sel = sel.strip()
            if not sel:
                continue
            pe = _pseudo_element(sel)
            if pe and pe not in ("before", "after"):
                skipped.append(sel)            # ::first-line etc. unrepresentable
                continue
            cleaned = _clean_selector(sel)
            if not cleaned:
                continue
            # A rule that declares custom properties defines a VARIABLE SCOPE.
            # Recorded per selector, because custom properties inherit from the
            # nearest ancestor that sets them — collapsing them all into the flat
            # `var_map` above makes whichever block comes last in the file win
            # for the whole document. This design declares `:root`,
            # `[data-theme="dark"]` and `[data-theme="light"]`, so `light` won
            # everywhere and every dark chapter baked light-theme colours: the
            # Proof and Invitation headings shipped as #141416 on #141416.
            if custom and bp is None and media is None:
                var_scopes.append((cleaned, custom, _specificity(sel), order))
            rules.append(Rule(cleaned, decls, _specificity(sel), order, bp,
                              _state(sel), pseudo=pe, media=media,
                              min_width=min_width))
            order += 1

    for selector, body in _iter_rule_blocks(css):
        if selector.startswith("@media"):
            bp = _breakpoint_for_media(selector)
            # A block whose ONLY condition is a sub-cutoff min-width is
            # mobile-first: bake it at base and invert (see
            # _invert_mobile_first). Anything with a second condition
            # (`and (pointer:fine)`) stays media-locked — dropping that
            # condition would apply pointer/motion styling to everyone.
            only_min = re.fullmatch(
                r"@media\s*\(\s*min-width\s*:\s*(\d+)px\s*\)", selector.strip())
            mobile_first = bool(
                bp is None and only_min
                and int(only_min.group(1)) < MOBILE_FIRST_CUTOFF)
            media = None if (bp or mobile_first) else selector[len("@media"):].strip()
            mw = int(only_min.group(1)) if mobile_first else None
            for s2, b2 in _iter_rule_blocks(body):
                if not s2.startswith("@"):
                    handle(s2, b2, bp, media, mw)
        elif selector.startswith("@"):
            continue
        else:
            handle(selector, body, None)
    rules = _invert_mobile_first(rules)
    # resolve token-to-token references within the map itself
    for k in list(var_map):
        var_map[k] = expand_vars(var_map[k], var_map)
    # Scoped tokens resolve against their OWN scope first, then the global map,
    # so `[data-theme="dark"]{--accent:var(--gold)}` picks up the dark values
    # rather than the ones that happened to land in `var_map` last.
    for _sel, decls, _spec, _ord in var_scopes:
        merged = {**var_map, **decls}
        for k in list(decls):
            decls[k] = expand_vars(decls[k], merged)
    return ParsedCss(rules, skipped, var_map, var_scopes)


def _invert_mobile_first(rules: list) -> list:
    """Translate mobile-first `@media (min-width: X)` blocks into Webflow's
    desktop-first model, for X below MOBILE_FIRST_CUTOFF.

    Source CSS written mobile-first says "narrow gets 1 column; from 720px up
    get 4". Webflow has no min-width breakpoints: base IS the wide view and
    every breakpoint is a max-width override. So the min-width declarations
    belong at BASE (already handled — `_breakpoint_for_media` returns None for
    them, and later source order makes them win), and the value they replaced
    must be re-asserted on the breakpoints BELOW X, or those inherit the wide
    value and the mobile layout is lost.

    Approximation: Webflow can only switch at 991/767/479, so X snaps to the
    nearest of those boundaries. For `min-width: 720px` that is 767, making the
    narrow value apply to 0-767 instead of 0-719 — a 48px band, versus the
    alternative of losing the desktop layout entirely (the footer's 4-column
    grid, live 2026-07-30).

    The re-asserted value is resolved PER TARGET BREAKPOINT, at the widest width
    that breakpoint covers (991/767/479), against every earlier rule that still
    applies there — including lower `min-width` tiers. Reading only the original
    base declaration collapses a THREE-tier ladder: `.grid--3` (1col / 2col from
    768 / 3col from 992) put 1col back on `medium`, losing the tablet's two
    columns, because the 768 tier was never considered."""
    inverted: list = []
    for r in rules:
        if r.media or r.breakpoint is not None or not r.min_width:
            continue
        boundary = min(MAXWIDTH_TO_BREAKPOINT.items(),
                       key=lambda kv: abs(kv[0] - r.min_width))[0]
        targets = [(px, bp) for px, bp in MAXWIDTH_TO_BREAKPOINT.items()
                   if px <= boundary]
        props = {p for p, _ in r.decls}
        for px, bp in targets:
            # The value each property holds at `px` once this rule is removed:
            # the last earlier rule that applies at that width wins.
            prior: dict = {}
            for earlier in rules:
                if earlier is r:
                    break
                if (earlier.selector != r.selector or earlier.media
                        or earlier.breakpoint is not None):
                    continue
                if earlier.min_width and earlier.min_width > px:
                    continue
                for p, v in earlier.decls:
                    if p in props:
                        prior[p] = v
            if not prior:
                continue
            inverted.append(Rule(r.selector, list(prior.items()), r.specificity,
                                 r.order, bp, r.state, pseudo=r.pseudo,
                                 media=None))
    return rules + inverted


# Webflow's published base stylesheet is NOT a plain browser reset — it styles
# some tags opinionatedly. The design was authored against browser defaults, so
# wherever the design leaves one of these properties unset, Webflow's value
# leaks in and the pasted page silently diverges.
#
# `li { margin-top: .25rem; margin-bottom: .25rem; padding-left: .5rem }` alone
# made the credentials list 64px taller (8 rows x 8px of margin, which adds to
# grid row size without changing any item's own height) and narrowed its content
# column by 8px — while every `li` measured byte-identical to the design
# (Dr. Nahlah, live 2026-07-30).
#
# Only tags whose BROWSER default is unambiguous belong here: the counter-value
# has to be correct without running a browser.
WEBFLOW_TAG_DEFAULT_RESETS = {
    "li": {"margin-top": "0", "margin-bottom": "0", "padding-left": "0"},
}


def _neutralize_webflow_defaults(tag_name: str, base: dict) -> dict:
    """Re-assert the browser default for properties Webflow's base stylesheet
    overrides, but only where the design's own cascade says nothing."""
    resets = WEBFLOW_TAG_DEFAULT_RESETS.get((tag_name or "").lower())
    if not resets:
        return base
    out = dict(base)
    for prop, value in resets.items():
        # A shorthand in the design (`margin`, `padding`) already covers it.
        shorthand = prop.split("-")[0]
        if prop in out or shorthand in out:
            continue
        out[prop] = value
    return out


_HIDDEN_AT_REST = {"visibility": "hidden", "opacity": "0"}


def _js_gated_initial_state(rules: list, dom_classes: set,
                            toggled: Optional[set] = None) -> set:
    """ids of rules that hide an element ONLY until the page JS reveals it.

    The design writes anti-FOUC pairs:

        [data-anim="hide"]      { visibility: hidden }   <- A
        .wz-ready [data-anim="hide"] { visibility: visible }   <- B

    Baking A into the class records is what made the whole hero INVISIBLE IN
    THE DESIGNER: Webflow does not run site custom code on the canvas, so
    `.wz-ready` never appears there and B can never fire. The team opened the
    page and could not see — let alone edit — the hero (2026-07-30).

    Shipping A through the runtime-state CSS artifact instead fixes both ends
    at once: the Designer has no custom code, so the element is visible and
    editable; the published page does, so it still hides until GSAP reveals it.

    A rule qualifies when it sets a hidden-at-rest value AND another rule
    un-sets that property with a selector that is this one plus tokens the
    markup never carries (`wz-ready`) or that the JS toggles (`on`)."""
    gated: set = set()
    hidden = [r for r in rules
              if not r.media and any(p in _HIDDEN_AT_REST
                                     and v.strip() == _HIDDEN_AT_REST[p]
                                     for p, v in r.decls)]
    if not hidden:
        return gated
    for a in hidden:
        props = {p for p, v in a.decls
                 if p in _HIDDEN_AT_REST and v.strip() == _HIDDEN_AT_REST[p]}
        for b in rules:
            if b is a or b.media:
                continue
            if not any(p in props and v.strip() != _HIDDEN_AT_REST[p]
                       for p, v in b.decls):
                continue
            # Strip B's runtime-only class tokens; what remains must be A.
            # "Runtime-only" is either a token the markup never carries
            # (`wz-ready`) OR one the JS toggles (`on`) — the latter DOES
            # appear in markup, on whichever element starts active, so a
            # dom_classes test alone misses the carousel's `.slide`/`.slide.on`
            # pair and leaves all three slides invisible on the canvas.
            runtime_only = (set(re.findall(r"\.([A-Za-z_][\w-]*)", b.selector))
                            - dom_classes) | set(toggled or ())
            stripped = b.selector
            for tok in set(re.findall(r"\.([A-Za-z_][\w-]*)", b.selector)):
                if tok in runtime_only:
                    stripped = re.sub(rf"\.{re.escape(tok)}(?![\w-])", "", stripped)
            if re.sub(r"\s+", " ", stripped).strip() == \
                    re.sub(r"\s+", " ", a.selector).strip():
                gated.add(id(a))
                break
    return gated


class CascadeResolver:
    """Match every rule against the document and compute each element's
    effective declarations, bucketed by (breakpoint, state)."""

    def __init__(self, soup, rules, toggled_tokens: Optional[set] = None,
                 runtime_vars: Optional[set] = None,
                 dom_classes: Optional[set] = None,
                 var_map: Optional[dict] = None,
                 var_scopes: Optional[list] = None):
        self.base_vars: dict = dict(var_map or {})
        # elementId -> the custom properties declared ON that element, highest
        # specificity last. Custom properties INHERIT, so an element's effective
        # map is built by walking its ancestor chain (see vars_for).
        self._scope_decls: dict[int, dict] = {}
        self._vars_cache: dict[int, dict] = {}
        for sel, decls, spec, order in sorted(var_scopes or [],
                                              key=lambda s: (s[2], s[3])):
            try:
                found = soup.select(sel)
            except Exception:
                continue
            for el in found:
                self._scope_decls.setdefault(id(el), {}).update(decls)
        self.matches: dict[int, list[Rule]] = {}
        self.pseudo: dict[int, dict[str, list[Rule]]] = {}
        self.toggled_tokens: set = set(toggled_tokens or ())
        self.runtime_vars: set = set(runtime_vars or ())
        self.gated_initial: set = _js_gated_initial_state(
            rules, dom_classes or set(), self.toggled_tokens)
        self.rules = [r for r in rules if not self._is_runtime_state(r)]
        self.bad_selectors: list[str] = []
        for r in self.rules:
            if r.media:
                # media-locked (pointer/hover/motion conditions): never baked
                # into classes; shipped via the runtime-state CSS artifact.
                continue
            try:
                found = soup.select(r.selector)
            except Exception:
                self.bad_selectors.append(r.selector)
                continue
            for el in found:
                if r.pseudo:
                    self.pseudo.setdefault(id(el), {}).setdefault(r.pseudo, []).append(r)
                else:
                    self.matches.setdefault(id(el), []).append(r)

    def vars_for(self, el) -> dict:
        """The custom properties in effect ON this element.

        Walks el -> ancestors, taking each property from the NEAREST ancestor
        that declares it, which is what makes a scoped theme layer work:
        `[data-theme="dark"]` overrides `:root` for its subtree only, and a
        nested `[data-theme="light"]` island comes back to the light values.
        """
        key = id(el)
        hit = self._vars_cache.get(key)
        if hit is not None:
            return hit
        out: dict = {}
        node = el
        while node is not None and getattr(node, "name", None):
            for prop, val in (self._scope_decls.get(id(node)) or {}).items():
                out.setdefault(prop, val)      # nearest declaration wins
            node = node.parent
        for prop, val in self.base_vars.items():
            out.setdefault(prop, val)
        self._vars_cache[key] = out
        return out

    def _is_runtime_state(self, r) -> bool:
        if id(r) in self.gated_initial:
            return True
        """A rule gated on a JS-toggled class describes RUNTIME state, not
        markup state, and must never be baked into a class record.

        `<div class="slide on">` marks only the first slide, so baking
        `.cmp .slide.on{opacity:1}` pins `opacity:1` onto that element
        permanently — toggling `on` off then cannot hide it, and the carousel
        stays stuck on slide 1 no matter what the JS does. These rules ship
        via the runtime-state CSS artifact instead (extract_runtime_state_css
        boosts them so they outrank any baked chain)."""
        if self.runtime_vars:
            # A declaration reading a JS-written custom property must stay a
            # live var(); baking freezes it at the fallback.
            for _prop, val in r.decls:
                if any(v in val for v in self.runtime_vars):
                    return True
        if not self.toggled_tokens:
            return False
        toks = set(re.findall(r"\.([A-Za-z_][\w-]*)", r.selector))
        return bool(toks & self.toggled_tokens)

    @staticmethod
    def _compute(rules: list):
        """Merge rules (specificity + source order) into (base, variants)."""
        buckets: dict = {}
        for r in sorted(rules, key=lambda r: (r.specificity, r.order)):
            d = buckets.setdefault((r.breakpoint, r.state), {})
            for prop, val in r.decls:
                d[prop] = val
        base = buckets.get((None, None), {})
        variants = {_variant_key(bp, st): d
                    for (bp, st), d in buckets.items() if (bp, st) != (None, None)}
        return base, variants

    def computed(self, el):
        """Effective (base, variants) for an element."""
        return self._compute(self.matches.get(id(el), []))

    def computed_pseudo(self, el, which: str):
        """Effective (base, variants) for an element's ::before/::after."""
        return self._compute(self.pseudo.get(id(el), {}).get(which, []))

    @staticmethod
    def _selector_class_chain(selector: str) -> Optional[tuple[Optional[str], list[str]]]:
        """Return (optional tag, classes) for simple `.a` / `tag.a.b` selectors.

        Webflow combo classes map cleanly to element-owned class stacks. Selectors
        with descendants, ids, attributes, states, or combinators still use the
        computed resolver path.
        """
        m = re.fullmatch(r"(?:(?P<tag>[A-Za-z][\w-]*)|)(?P<classes>(?:\.[A-Za-z_][\w-]*)+)", selector)
        if not m:
            return None
        return m.group("tag"), re.findall(r"\.([A-Za-z_][\w-]*)", m.group("classes"))

    def class_computed(self, class_stack: list[str], index: int,
                       tag_name: Optional[str] = None,
                       include_tag_qualified: bool = True,
                       simple_only: bool = False):
        """Declarations for one native Webflow class in a source class stack.

        The base class receives simple `.base` rules. Combo classes receive their
        own simple `.combo` rules plus compound `.base.combo` / `tag.base.combo`
        rules whose class chain is a subset of the element's classes and includes
        this combo.

        `include_tag_qualified=False` restricts matching to unqualified `.class`
        rules. Shared-utility records require this: a tag-qualified rule like
        `nav.top` would make the `top` record fat on <nav> and empty on <div>,
        and Webflow's merge-by-name would then apply one element's styles to the
        other (a card header becoming position:fixed). With it off, the
        tag-qualified declarations stay on the per-element content class.

        `simple_only=True` further restricts a combo to its own simple `.combo`
        rules (no compound `.base.combo` chains). Contested combo names require
        this: a name whose compound declarations differ per stack context (e.g.
        `.sample-line.sub{color}` vs the thin `sub` inside `.scene-head`) would
        otherwise emit non-identical records under one name, and Webflow's
        site-wide merge-by-name silently drops all but one of them.
        """
        target = class_stack[index]
        matched = []
        stack_set = set(class_stack[:index + 1])
        for r in self.rules:
            if r.pseudo or r.media:
                continue
            simple = self._selector_class_chain(r.selector)
            if not simple:
                continue
            selector_tag, chain = simple
            if selector_tag and not include_tag_qualified:
                continue
            if selector_tag and tag_name and selector_tag.lower() != tag_name.lower():
                continue
            chain_set = set(chain)
            if index == 0 or simple_only:
                if chain == [target]:
                    matched.append(r)
            elif target in chain_set and chain_set.issubset(stack_set):
                matched.append(r)
        return self._compute(matched)


# --------------------------------------------------------------------------- #
# Builder
# --------------------------------------------------------------------------- #

class WebflowBuilder:
    def __init__(self, resolver: Optional[CascadeResolver] = None,
                 var_map: Optional[dict] = None, asset_base: str = "",
                 preserve_vars: bool = False, page_base: Optional[dict] = None,
                 page_variants: Optional[dict] = None,
                 variable_css_names: Optional[dict] = None,
                 shared_utility_names: Optional[set] = None,
                 contested_combo_names: Optional[set] = None,
                 hook_class_names: Optional[set] = None,
                 page_prefix: str = "", vocab: Optional[dict] = None):
        self.resolver = resolver
        # Shared-class-system mode (see _style_id / _emit_style):
        # - page_prefix: namespaces tag-derived AUTO-NAMES (`div`, `p`, ...) so a
        #   page-specific residual class can never collide with another page's
        #   same-named residual (no Webflow `-2` fork). Source class names are
        #   left untouched so they stay shareable across pages.
        # - vocab: {name: {comb, styleLess, variants}} canonical definitions for
        #   shared SOURCE classes. Emitting the canonical (identical on every
        #   page) lets Webflow merge by name with no duplicate. Applied only in
        #   the concrete pass so the preserve_vars binding pass keeps var().
        self.page_prefix = page_prefix
        self.vocab = vocab or {}
        # data-cf reuse: name -> style id, emitted once with an empty definition
        # so the target site's existing class (and its variable bindings) wins.
        self._cf_ids: dict = {}
        self.cf_reused: set = set()
        self.var_map = var_map or {}
        self.asset_base = asset_base.rstrip("/")
        self.preserve_vars = preserve_vars
        self.page_base = page_base or {}
        self.page_variants = page_variants or {}
        self.variable_css_names = variable_css_names or {}
        # Class names that appear in a multi-class stack somewhere (i.e. are used
        # as combo/utility classes). A single-class element using one of these
        # must NOT bake its full computed cascade under that shared name, or
        # Webflow's paste-time merge-by-name spreads that element's typography to
        # every other element using the utility. See _split_single_utility.
        self.shared_utility_names = shared_utility_names or set()
        # Class names whose per-class emission differs across stack contexts.
        # Their records are demoted to simple `.name` rules everywhere so every
        # record of the name is byte-identical; the compound-rule declarations
        # land on the per-element content class via the residual mechanism.
        self.contested_combo_names = contested_combo_names or set()
        # JS/state-CSS hook tokens: _style_id must never assign these as
        # display names for tag-derived content classes — an anchor content
        # record named `a` would consume the name and force the REAL `.a`
        # hook element's record to uniquify to `a-10`, stripping the literal
        # token the state CSS targets.
        self.hook_class_names = hook_class_names or set()
        self.unsupported_tags: dict[str, int] = {}  # tag -> count, emitted as embeds
        self.nodes: list[dict] = []
        self.styles: list[dict] = []
        self.assets: list[dict] = []
        self._sig_to_id: dict[str, str] = {}   # computed-style signature -> styleId
        self._name_counts: dict[str, int] = {}  # class display-name -> usage count
        self._flat_classes: dict[str, str] = {}  # flat-mode class name -> styleId
        self._native_classes: dict[tuple, str] = {}
        self._style_by_id: dict[str, dict] = {}
        self._active_vars: Optional[dict] = None

    # -- styles -------------------------------------------------------------- #
    def _vars(self) -> dict:
        """The custom-property map to bake against: the current element's scoped
        map when one is parked by `classes_for`, else the document-wide map."""
        return self._active_vars if self._active_vars is not None else self.var_map

    def _clean_decls(self, d: dict) -> dict:
        """Drop custom-property declarations and optionally resolve var() values.

        Default behavior resolves vars to concrete values. When --preserve-vars is
        used, Webflow variables must be imported before paste and var() references
        are left intact.

        Font family variables are special. In the CLIPBOARD payload they are
        resolved to a concrete font stack, because Webflow strips
        `font-family: var(...)` from pasted styleLess on re-copy. But the
        POST-PASTE binding manifest (generated with preserve_vars=True) must keep
        the var() reference so a `font-family` -> Webflow variable binding is
        emitted: MCP `style_tool.update_style` with `variable_as_value` binds the
        font through the Designer API, which the clipboard restriction does not
        affect. Without this, headings paste with a hardcoded stack and never get
        linked to the `--display` font variable as in the source design.
        """
        out = {}
        for prop, val in d.items():
            if prop.startswith("--"):
                continue
            if prop == "font-family" and "var(" in val:
                out[prop] = (rewrite_var_names(val, self.variable_css_names)
                             if self.preserve_vars
                             else expand_vars(val, self._vars()))
            elif self.preserve_vars:
                out[prop] = rewrite_var_names(val, self.variable_css_names)
            else:
                out[prop] = expand_vars(val, self._vars()) if "var(" in val else val
        return _expand_shorthands(out)

    def _emit_style(self, name: str, base: dict, variants: dict,
                    comb: str = "") -> str:
        sid = new_id()
        style = {
            "_id": sid, "fake": False, "type": "class", "name": name,
            "namespace": "", "comb": comb,
            "styleLess": _decls_to_styleless(self._clean_decls(base)),
            "variants": {k: {"styleLess": _decls_to_styleless(self._clean_decls(d))}
                         for k, d in variants.items()},
            "children": [], "origin": None, "selector": None,
        }
        # Shared vocabulary: replace this page's resolved declarations with the
        # canonical (cross-page-identical) ones so Webflow merges by name instead
        # of forking. Concrete pass only — the preserve_vars binding pass must
        # keep var() so font/color variable bindings are still emitted.
        if not self.preserve_vars:
            canon = self.vocab.get(name)
            if canon is not None and comb == canon.get("comb", ""):
                style["styleLess"] = canon["styleLess"]
                style["variants"] = canon.get("variants", {})
        self.styles.append(style)
        self._style_by_id[sid] = style
        return sid

    def _link_combo(self, parent_id: str, combo_id: str) -> None:
        parent = self._style_by_id.get(parent_id)
        if parent is not None and combo_id not in parent["children"]:
            parent["children"].append(combo_id)

    def _sig(self, base: dict, variants: dict) -> str:
        """De-dup key built from the RESOLVED declarations.

        Keying on the raw ones merged elements that only look alike before
        var() expansion: every `<h2>` carries the same literal
        `color: var(--fg)`, so a heading in a `[data-theme="dark"]` section
        deduped onto the light one and the dark chapters shipped with light
        text. Resolving first keeps genuine duplicates merged while letting
        the same declaration in two theme scopes emit two classes.
        """
        return json.dumps(
            [sorted(self._clean_decls(base).items()),
             {k: sorted(self._clean_decls(v).items())
              for k, v in variants.items()}],
            sort_keys=True)

    def _style_id(self, display: str, base: dict, variants: dict,
                  auto: bool = False) -> str:
        """De-duplicate identical computed styles; uniquify display names.

        `auto` marks a tag-derived auto-name (e.g. the `div`/`p` residual content
        class), as opposed to a source class name. In shared-class-system mode
        these get a page prefix so a page-specific residual never collides with
        another page's same-named residual."""
        if auto and self.page_prefix:
            display = f"{self.page_prefix}-{display}"
        if display in self.hook_class_names:
            # content classes must not squat a hook token's name (see
            # hook_class_names in __init__)
            display = f"{display}-el"
        sig = self._sig(base, variants)
        if sig in self._sig_to_id:
            return self._sig_to_id[sig]
        n = self._name_counts.get(display, 0)
        self._name_counts[display] = n + 1
        if n:
            display = f"{display}-{n + 1}"
        sid = self._emit_style(display, base, variants)
        self._sig_to_id[sig] = sid
        return sid

    def _native_class_id(self, name: str, base: dict, variants: dict,
                         parent_id: Optional[str] = None) -> str:
        key = (name, parent_id, self._sig(base, variants))
        if key in self._native_classes:
            return self._native_classes[key]
        sid = self._emit_style(name, base, variants, comb="&" if parent_id else "")
        if parent_id:
            self._link_combo(parent_id, sid)
        self._native_classes[key] = sid
        return sid

    @staticmethod
    def _merge_variants(lower: dict, upper: dict) -> dict:
        keys = set(lower) | set(upper)
        return {k: {**lower.get(k, {}), **upper.get(k, {})} for k in keys}

    def _with_page_base(self, base: dict, variants: dict) -> tuple[dict, dict]:
        return (
            {**self.page_base, **base},
            self._merge_variants(self.page_variants, variants),
        )

    def _cf_class_ids(self, tag: Tag) -> list[str]:
        """Style ids for `data-cf` names — reuse of the target site's existing
        Client-First / Relume classes.

        Emitted with an EMPTY styleLess on purpose. Webflow reconciles pasted
        classes by NAME, and the pasted definition only wins for properties it
        actually sets; setting none means the site's existing definition (and
        its variable bindings, which the clipboard format cannot carry) survives
        untouched. That is what makes reuse work instead of forking.
        """
        raw = tag.get("data-cf") or ""
        out = []
        for name in raw.split():
            if name not in self._cf_ids:
                self._cf_ids[name] = self._emit_style(name, {}, {})
                self.cf_reused.add(name)
            out.append(self._cf_ids[name])
        return out

    def classes_for(self, tag: Tag, include_page_base: bool = False) -> list[str]:
        """Style ids for an element, honouring `data-cf` reuse annotations."""
        # var() values are baked at style-emission time, which has no element in
        # hand — so the element's scoped map is parked here for _clean_decls to
        # pick up. Without it every var() resolves against the flat global map
        # and a scoped theme layer collapses to whichever block came last.
        self._active_vars = (self.resolver.vars_for(tag)
                             if self.resolver is not None else None)
        cf_ids = self._cf_class_ids(tag)
        if not cf_ids:
            return self._classes_for_own(tag, include_page_base)
        if not tag.get("class"):
            # Fully covered by the style guide: emit no style of our own, and in
            # particular no tag-derived auto-name.
            return cf_ids
        # Style-guide base + our own class carrying only the deltas.
        return cf_ids + self._classes_for_own(tag, include_page_base)

    def _classes_for_own(self, tag: Tag, include_page_base: bool = False) -> list[str]:
        names = tag.get("class", [])
        if self.resolver is None:
            # flat mode: one shared style per raw class name
            out = []
            for c in names:
                if c not in self._flat_classes:
                    self._flat_classes[c] = self._emit_style(c, {}, {})
                out.append(self._flat_classes[c])
            return out
        if len(names) > 1:
            # Per-class declarations from UNQUALIFIED `.a` / `.a.b` rules only.
            # Tag-qualified rules (`section.scene`) must not enter these records:
            # the same class name may be emitted from another element's context
            # (e.g. single-class `.scene` via _split_single_utility), and the
            # records must stay byte-identical for Webflow's merge-by-name.
            # Tag-qualified declarations land in the residual/content class.
            per = [self.resolver.class_computed(
                       list(names), i, tag.name,
                       include_tag_qualified=False,
                       simple_only=names[i] in self.contested_combo_names)
                   for i in range(len(names))]
            union_base: dict = {}
            union_variants: dict = {}
            for b, v in per:
                union_base.update(b)
                union_variants = self._merge_variants(union_variants, v)
            # Residual = full cascade (descendant/compound selectors such as
            # `.proforma .row` or `.scene-head .sub`) that no per-class record
            # carries. Previously this was silently dropped, so multi-class
            # elements styled through context selectors pasted unstyled.
            full_base, full_variants = self.resolver.computed(tag)
            raw_inline = tag.get("style")
            if raw_inline:
                full_base = {**full_base, **dict(_parse_decls(raw_inline))}
            # Custom properties (`--*`) are dropped by _clean_decls at emit
            # time, so they must not count as residual — an inherited :root
            # token would otherwise force every clean combo stack into the
            # content-class path.
            resid_base = {k: v for k, v in full_base.items()
                          if union_base.get(k) != v and not k.startswith("--")}
            resid_variants: dict = {}
            for vk, vd in full_variants.items():
                uv = union_variants.get(vk, {})
                rem = {k: v for k, v in vd.items()
                       if uv.get(k) != v and not k.startswith("--")}
                if rem:
                    resid_variants[vk] = rem
            if not resid_base and not resid_variants:
                # Clean native combo stack: the simple rules describe the
                # element fully.
                out = []
                parent_id = None
                for i, name in enumerate(names):
                    base, variants = per[i]
                    if include_page_base and i == 0:
                        base, variants = self._with_page_base(base, variants)
                    sid = self._native_class_id(name, base, variants, parent_id)
                    out.append(sid)
                    parent_id = sid
                return out
            # Context-styled stack: bake the residual onto a content class
            # (named after the tag, sig-deduped) and chain the source classes
            # after it as thin utilities — same shape as _split_single_utility.
            content_base, content_variants = resid_base, resid_variants
            if include_page_base:
                content_base, content_variants = self._with_page_base(
                    content_base, content_variants)
            content_id = self._style_id(tag.name, content_base, content_variants,
                                        auto=True)
            out = [content_id]
            parent_id = content_id
            for i, name in enumerate(names):
                base, variants = per[i]
                sid = self._native_class_id(name, base, variants, parent_id)
                out.append(sid)
                parent_id = sid
            return out
        # A single-class element whose class is a shared utility (used in combo
        # stacks elsewhere) must be split: the bare utility name stays thin and
        # consistent, the element's own typography/layout goes on a separate
        # content class. Otherwise Webflow merges the fat single-class record with
        # the thin combo records of the same name and leaks this element's styles
        # onto every other user of the utility.
        if (len(names) == 1 and names[0] in self.shared_utility_names):
            return self._split_single_utility(tag, include_page_base)
        # resolver mode: a single computed class baked from the cascade,
        # with any inline style="" folded in at highest priority.
        base, variants = self.resolver.computed(tag)
        base = _neutralize_webflow_defaults(tag.name, base)
        raw_inline = tag.get("style")
        if raw_inline:
            base = {**base, **dict(_parse_decls(raw_inline))}
        if include_page_base:
            base, variants = self._with_page_base(base, variants)
        if not base and not variants and not names:
            return []
        return [self._style_id(names[0] if names else tag.name, base, variants,
                               auto=not names)]

    def _split_single_utility(self, tag: Tag, include_page_base: bool) -> list[str]:
        """Emit a shared-utility single-class element as [content, utility].

        The utility class (e.g. `reveal`) keeps ONLY its own simple-rule
        declarations (the animation hook), identical to how it is emitted as a
        combo elsewhere, so Webflow's merge-by-name is a no-op. The element's
        remaining computed style (heading typography, margins, etc.) is baked
        onto a separate content class named after the tag, applied as the base
        with the utility chained as a combo on top.
        """
        name = tag.get("class")[0]
        full_base, full_variants = self.resolver.computed(tag)
        raw_inline = tag.get("style")
        if raw_inline:
            full_base = {**full_base, **dict(_parse_decls(raw_inline))}
        util_base, util_variants = self.resolver.class_computed(
            [name], 0, tag.name, include_tag_qualified=False)
        # content = element style minus the declarations the utility owns
        content_base = {k: v for k, v in full_base.items() if k not in util_base}
        content_variants: dict = {}
        for vk, vd in full_variants.items():
            uv = util_variants.get(vk, {})
            rem = {k: v for k, v in vd.items() if k not in uv}
            if rem:
                content_variants[vk] = rem
        if include_page_base:
            content_base, content_variants = self._with_page_base(
                content_base, content_variants)
        if not content_base and not content_variants:
            # element carries nothing beyond the utility itself; keep the
            # EXACT name (it may be a JS/state-CSS hook token _style_id
            # would deliberately rename)
            return [self._native_class_id(name, util_base, util_variants)]
        content_id = self._style_id(tag.name, content_base, content_variants,
                                    auto=True)
        util_id = self._native_class_id(name, util_base, util_variants, content_id)
        return [content_id, util_id]

    # -- pseudo-elements ----------------------------------------------------- #
    @staticmethod
    def _css_unescape(s: str) -> str:
        """Decode CSS string escapes: `\\2014` -> em dash, `\\"` -> `"`. Without
        this, `content: '\\2014'` pastes as the literal text `\\2014`."""
        s = re.sub(r"\\([0-9a-fA-F]{1,6})[ \t\r\n]?",
                   lambda m: chr(int(m.group(1), 16)), s)
        return re.sub(r"\\(.)", r"\1", s)

    @staticmethod
    def _pseudo_text(content: Optional[str]) -> str:
        """Extract literal text from a CSS `content` value; counter()/attr()/url()
        and the empty/none cases yield no text (decorative box)."""
        if not content:
            return ""
        c = content.strip()
        if c in ("none", "normal"):
            return ""
        m = re.match(r"""^(['"])(.*)\1$""", c, re.DOTALL)
        return WebflowBuilder._css_unescape(m.group(2)) if m else ""

    @staticmethod
    def _generates_box(base: dict, variants: dict) -> bool:
        """Per CSS, a ::before/::after with no `content` (or `content: none`)
        generates NO box at all. Materializing one anyway turns an ordinary
        reset — `*,*::before,*::after{box-sizing:border-box}` — into one empty
        <div> per element: 636 phantom divs across the 9-chapter Dr. Nahlah
        journey page, 54% of all nodes, which broke every flex/grid gap and
        nth-child in the paste. A `content` declared only in a variant
        (`.x:hover::after{content:"->"}`) still counts."""
        for d in (base, *variants.values()):
            c = (d.get("content") or "").strip()
            if c and c not in ("none", "normal"):
                return True
        return False

    def _make_pseudo(self, tag: Tag, which: str) -> Optional[str]:
        """Materialize ::before / ::after as a real child <div> node."""
        base, variants = self.resolver.computed_pseudo(tag, which)
        if not self._generates_box(base, variants):
            return None
        text = self._pseudo_text(base.get("content"))

        # A `content` string declared ONLY inside a media query still generates
        # a box, and `_generates_box` above says so — but reading the literal
        # from `base` alone shipped that box EMPTY. The Dr. Nahlah comparison
        # table lost both of its mobile column labels this way
        # (`@media(max-width:719px){.vs-us::before{content:"Here"}}` → 10 blank
        # divs). Webflow cannot vary TEXT per breakpoint, only `display`, so the
        # text is emitted once and hidden at every width that does not declare
        # it — which is what the media query meant.
        variant_only_text = ""
        if not text:
            for key, decl in variants.items():
                lit = self._pseudo_text(decl.get("content"))
                if lit:
                    variant_only_text = text = lit
                    break

        base = {k: v for k, v in base.items() if k != "content"}
        variants = {k: {p: v for p, v in d.items() if p != "content"}
                    for k, d in variants.items()}

        if variant_only_text:
            declaring = {k for k, d in self.resolver.computed_pseudo(tag, which)[1].items()
                         if self._pseudo_text(d.get("content"))}
            base.setdefault("display", "none")
            for key in declaring:
                variants.setdefault(key, {}).setdefault("display", "block")

        variants = {k: d for k, d in variants.items() if d}
        if not base and not variants and not text:
            return None
        name = (tag.get("class") or [tag.name])[0] + f"-{which}"
        sid = self._style_id(name, base, variants)
        nid = new_id()
        data = self._common_data()
        data["tag"] = "div"
        data["text"] = bool(text)
        node = {"_id": nid, "type": "Block", "tag": "div",
                "classes": [sid], "children": [], "data": data}
        self.nodes.append(node)
        if text:
            node["children"] = [self.add_text_node(text)]
        return nid

    # -- data blocks --------------------------------------------------------- #
    @staticmethod
    def _common_data() -> dict:
        return {
            "devlink": {"runtimeProps": {}, "slot": ""},
            "displayName": "",
            "attr": {"id": ""},
            "xattr": [],
            "search": {"exclude": False},
            "visibility": {"conditions": [], "keepInHtml": {"tag": "False", "val": {}}},
        }

    def _abs_url(self, src: str) -> str:
        """Turn a relative asset URL absolute using --asset-base so it resolves
        once pasted into Webflow."""
        if not src or re.match(r"^(https?:|data:|//)", src):
            return src
        return f"{self.asset_base}/{src.lstrip('/')}" if self.asset_base else src

    # -- nodes --------------------------------------------------------------- #
    def add_text_node(self, text: str) -> str:
        nid = new_id()
        self.nodes.append({"_id": nid, "text": True, "v": text})
        return nid

    _BP_MEDIA = {"medium": "@media (max-width: 991px)",
                 "small": "@media (max-width: 767px)",
                 "tiny": "@media (max-width: 479px)",
                 "large": "@media (min-width: 1280px)",
                 "xl": "@media (min-width: 1440px)",
                 "xxl": "@media (min-width: 1920px)"}

    def _embed_css(self, tag: Tag) -> str:
        """Collect every stylesheet rule that matches the embedded subtree and
        re-emit it (vars resolved) so the embed carries its own styling. Without
        this, embedded subtrees (e.g. the contact <form>) paste completely
        unstyled because their CSS lives in the source <style> block, which is
        never part of the clipboard payload."""
        if self.resolver is None:
            return ""
        seen: set[int] = set()
        rules = []
        els = [tag] + [d for d in tag.descendants if isinstance(d, Tag)]
        for el in els:
            for r in self.resolver.matches.get(id(el), []):
                if id(r) not in seen:
                    seen.add(id(r))
                    rules.append(r)
            for plist in (self.resolver.pseudo.get(id(el)) or {}).values():
                for r in plist:
                    if id(r) not in seen:
                        seen.add(id(r))
                        rules.append(r)
        if not rules:
            return ""
        rules.sort(key=lambda r: r.order)
        grouped: dict = {}
        for r in rules:
            sel = r.selector
            if r.state:
                sel += f":{r.state}"
            if r.pseudo:
                sel += f"::{r.pseudo}"
            decls = ";".join(
                f"{p}:{expand_vars(v, self.var_map) if 'var(' in v else v}"
                for p, v in r.decls if not p.startswith("--"))
            grouped.setdefault(r.breakpoint, []).append(f"{sel}{{{decls}}}")
        css = "".join(grouped.pop(None, []))
        for bp, lst in grouped.items():
            mq = self._BP_MEDIA.get(bp)
            body = "".join(lst)
            css += f"{mq}{{{body}}}" if mq else body
        return css

    def add_html_embed(self, tag: Tag) -> str:
        nid = new_id()
        raw = str(tag)
        css = self._embed_css(tag)
        if css:
            raw = f"<style>{css}</style>{raw}"
        has_script = tag.name == "script" or tag.find("script") is not None
        data = {
            "search": {"exclude": True},
            "embed": {"meta": {"html": raw, "div": False, "script": has_script,
                               "compilable": False, "iframe": tag.name == "iframe"},
                      "type": "html"},
            "insideRTE": False, "content": "",
            **self._common_data(),
        }
        self.nodes.append({
            "_id": nid, "type": "HtmlEmbed", "tag": "div",
            "classes": self.classes_for(tag), "children": [], "v": raw, "data": data,
        })
        return nid

    @staticmethod
    def _renders_inline(item) -> bool:
        """True when a sibling participates in inline text flow (text content or
        an inline-level tag) — i.e. whitespace next to it is a word separator."""
        if isinstance(item, Comment):
            return False
        if isinstance(item, NavigableString):
            return bool(str(item).strip())
        return isinstance(item, Tag) and item.name and \
            item.name.lower() in INLINE_TAGS

    def _emit_children(self, items: list) -> tuple[list[str], bool]:
        """Convert a run of sibling nodes. Whitespace-only text between two
        inline-flow siblings is preserved as a single " " text node; previously
        it was dropped, fusing words around <em>/<strong>/<span> boundaries."""
        ids: list[str] = []
        has_el = False
        prev_inline = False
        for idx, child in enumerate(items):
            if isinstance(child, Comment):
                continue
            if isinstance(child, Tag):
                cid = self.add_element(child)
                if cid:
                    ids.append(cid)
                    has_el = True
                    prev_inline = self._renders_inline(child)
            elif isinstance(child, NavigableString):
                t = re.sub(r"\s+", " ", str(child))
                if t.strip():
                    ids.append(self.add_text_node(t))
                    prev_inline = True
                elif t == " " and ids and prev_inline and any(
                        self._renders_inline(n) for n in items[idx + 1:]):
                    ids.append(self.add_text_node(" "))
        return ids, has_el

    def _add_line_span(self, items: list) -> str:
        """Wrap one post-<br> line in a `display: block` span Block."""
        sid = self._style_id("br-line", {"display": "block"}, {})
        nid = new_id()
        data = self._common_data()
        data["tag"] = "span"
        node = {"_id": nid, "type": "Block", "tag": "span",
                "classes": [sid], "children": [], "data": data}
        self.nodes.append(node)  # parent-first: span precedes its children
        ids, has_el = self._emit_children(items)
        node["children"] = ids
        data["text"] = bool(ids) and not has_el
        return nid

    def add_element(self, tag: Tag, is_root: bool = False) -> Optional[str]:
        name = tag.name.lower()
        # Self-contained section packaging: <style data-embed> / <script
        # data-embed> ride the payload as in-place HtmlEmbeds (the section's
        # CSS/JS embeds), instead of being folded into the cascade or the
        # page custom-code artifact. See html-to-webflow-clipboard.md §D.
        if name in ("style", "script") and tag.has_attr("data-embed"):
            return self.add_html_embed(tag)
        if name in SKIP_TAGS:
            return None
        if name in EMBED_TAGS:
            return self.add_html_embed(tag)
        # SAFETY: any tag we don't have an explicit Webflow type for is emitted
        # as a code embed, never as a native node with an invalid tag. A native
        # node carrying an unsupported tag (e.g. <form>, <input>, <select>) is
        # accepted on paste but CRASHES the Designer on reload. Forms therefore
        # paste as one functional HtmlEmbed until native Form* types are added.
        if name not in TAG_TO_TYPE:
            self.unsupported_tags[name] = self.unsupported_tags.get(name, 0) + 1
            return self.add_html_embed(tag)

        wtype = TAG_TO_TYPE[name]
        nid = new_id()
        # pre-order: append this node before descendants (root-first layout)
        node: dict = {"_id": nid, "type": wtype, "tag": name,
                      "classes": [], "children": [], "data": {}}
        self.nodes.append(node)

        classes = self.classes_for(tag, include_page_base=is_root)

        # interleave element + text children, preserving document order;
        # materialized ::before goes first, ::after last.
        child_ids: list[str] = []
        has_element_child = False
        pseudo_ok = self.resolver is not None and name not in VOID_TAGS
        if pseudo_ok:
            bid = self._make_pseudo(tag, "before")
            if bid:
                child_ids.append(bid)
                has_element_child = True
        if name not in VOID_TAGS:
            # Split children into "lines" at <br>. Webflow's clipboard format has
            # no line-break node, so each line after the first is wrapped in a
            # span Block with `display: block` — visually identical to <br>.
            # Dropping <br> outright fused words ("Move" + "With" -> "MoveWith").
            lines: list[list] = [[]]
            for child in tag.children:
                if isinstance(child, Tag) and child.name and \
                        child.name.lower() == "br":
                    lines.append([])
                else:
                    lines[-1].append(child)
            ids, has_el = self._emit_children(lines[0])
            child_ids.extend(ids)
            has_element_child = has_element_child or has_el
            for line in lines[1:]:
                child_ids.append(self._add_line_span(line))
                has_element_child = True
        if pseudo_ok:
            aid = self._make_pseudo(tag, "after")
            if aid:
                child_ids.append(aid)
                has_element_child = True

        data = self._common_data()
        if wtype == "Block":
            data["text"] = bool(child_ids) and not has_element_child
            data["tag"] = name
        elif wtype == "Heading":
            data["tag"] = name
        elif wtype == "Link":
            data = {"button": False, "block": "",
                    "link": {"mode": "external",
                             "url": normalize_href(tag.get("href", "#"))},
                    "eventIds": [], **self._common_data()}
        elif wtype == "Image":
            # build common data FIRST, then set attr — otherwise the common
            # attr:{id:""} would clobber the src/alt/dimensions.
            data = {**self._common_data(), "srcsetDisabled": False, "sizes": []}
            data["attr"] = {"width": tag.get("width", "auto"),
                            "height": tag.get("height", "auto"),
                            "alt": tag.get("alt", ""),
                            "src": self._abs_url(tag.get("src", "")),
                            "loading": tag.get("loading", "eager"), "id": ""}

        # carry the element id (restores anchor nav / scroll targets) and any
        # data-*/aria-*/role custom attributes
        data["attr"]["id"] = tag.get("id", "")
        xa = _custom_attrs(tag)
        if xa:
            data["xattr"] = xa

        node["classes"] = classes
        node["children"] = child_ids
        node["data"] = data
        return nid

    # -- assembly ------------------------------------------------------------ #
    @staticmethod
    def _envelope(nodes, styles, assets) -> dict:
        return {
            "type": "@webflow/XscpData",
            "payload": {
                "nodes": nodes, "styles": styles, "assets": assets,
                "ix1": [], "ix2": {"interactions": [], "events": [], "actionLists": []},
            },
            "meta": {"droppedLinks": 0, "dynBindRemovedCount": 0,
                     "dynListBindRemovedCount": 0, "paginationRemovedCount": 0,
                     "universalBindingsRemovedCount": 0, "unlinkedSymbolCount": 0,
                     "codeComponentsRemovedCount": 0, "richTextComponentsStripped": False},
        }

    def build(self, roots) -> dict:
        for r in roots:
            self.add_element(r, is_root=True)
        return self._envelope(self.nodes, self.styles, self.assets)

    def build_sliced(self, roots):
        """Build every root in ONE pass (so class names/ids are globally unique
        and consistent — identical styles share a name, different styles get
        distinct names), then return one payload PER root. Pasting the slices in
        order is crash-safe (each is section-sized) AND correctly styled (Webflow
        merges same-named classes; differently-named ones stay distinct)."""
        slices = []
        for r in roots:
            start = len(self.nodes)
            nid = self.add_element(r, is_root=True)
            if nid is not None:
                slices.append((r, self.nodes[start:]))
        out = []
        for root, node_slice in slices:
            used = {c for n in node_slice for c in n.get("classes", [])}
            styles = [s for s in self.styles if s["_id"] in used]  # global order preserved
            out.append((root, self._envelope(node_slice, styles, self.assets)))
        return out


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #

def load_variable_map_entries(path: Optional[str]) -> dict:
    """Load source CSS variable -> Webflow metadata mappings.

    Supported shapes:
      {"--canvas": "--base--canvas"}
      {"variables": [{"name": "--canvas", "cssName": "--base--canvas"}]}
      {"variables": [{"sourceName": "--canvas", "binding": "var(--base--canvas)"}]}
    """
    if not path:
        return {}
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    if isinstance(raw, dict) and "variables" not in raw:
        return {
            _normalize_css_var_name(k): {
                "cssName": _normalize_css_var_name(v),
                "variableId": "",
            }
            for k, v in raw.items()
        }
    out = {}
    for item in raw.get("variables", []):
        source = item.get("sourceName") or item.get("source") or item.get("name")
        css_name = (item.get("cssName") or item.get("css_name") or
                    item.get("binding") or item.get("webflowCssName") or source)
        if source and css_name:
            out[_normalize_css_var_name(source)] = {
                "cssName": _normalize_css_var_name(css_name),
                "variableId": (item.get("variableId") or item.get("variable_id") or
                               item.get("id") or ""),
                "collectionId": (item.get("collectionId") or item.get("collection_id") or
                                 item.get("variableCollectionId") or ""),
            }
    return out


def load_variable_css_map(path: Optional[str]) -> dict:
    return {k: v["cssName"] for k, v in load_variable_map_entries(path).items()}


def _setup(html: str, css: str, resolve: bool, asset_base: str,
           preserve_vars: bool = False, variable_css_names: Optional[dict] = None,
           extra_shared_utility_names: Optional[set] = None,
           page_prefix: str = "", vocab: Optional[dict] = None):
    """Shared parse + resolver + builder setup. Returns (soup, builder).

    `extra_shared_utility_names` forces additional class names through the
    thin-utility split — used by --avoid for JS-queried tokens (e.g. `top`)
    that collide with an already-built page: the token must stay on the
    element, so its styling moves to a content class and the thin record can
    merge cleanly with the existing page's definition."""
    soup = BeautifulSoup(html, "html.parser")
    css = collect_css(html, css)
    for style_tag in soup.find_all("style"):
        if style_tag.has_attr("data-embed"):
            continue  # section CSS embed — stays in the tree as an HtmlEmbed
        style_tag.decompose()
    resolver, var_map = None, {}
    page_base, page_variants = {}, {}
    shared_utility_names: set = set(extra_shared_utility_names or ())
    contested_combo_names: set = set()
    hook_class_names: set = set()
    if resolve:
        rules, _skipped, var_map, var_scopes = parse_rules(css)
        resolver = CascadeResolver(
            soup, rules, toggled_class_tokens(html),
            js_set_custom_properties(html),
            {c for el in soup.find_all(True) for c in (el.get("class") or [])},
            var_map=var_map, var_scopes=var_scopes)
        if soup.body:
            page_base, page_variants = resolver.computed(soup.body)
        # Page-level declarations that must NOT be carried onto every pasted
        # section root. Both of these are already emitted as a real `body{...}`
        # rule in the runtime-state CSS artifact, so dropping them here loses
        # nothing — it only stops them being duplicated onto children:
        #
        #   overflow* — any ancestor with non-visible overflow disables
        #     `position: sticky` for everything inside it (the thesis pull
        #     quote / section markers regression).
        #   background* — background is NOT an inherited property, so copying
        #     the body's onto a child is simply wrong. It painted the fixed
        #     header opaque cream at rest, so the nav looked permanently
        #     "solid" instead of transparent-until-scrolled, and it painted the
        #     dark drawer cream underneath its own theme. Caught only by
        #     diffing the published page against the design (2026-08-04).
        _PAGE_ONLY = ("overflow", "background")
        _drop = lambda d: {k: v for k, v in d.items()
                           if not k.startswith(_PAGE_ONLY)}
        page_base = _drop(page_base)
        page_variants = {vk: _drop(vd) for vk, vd in page_variants.items()}
        page_variants = {vk: vd for vk, vd in page_variants.items() if vd}
        # Names that appear in any multi-class stack are utility/combo classes;
        # single-class uses of them are split so the bare name stays thin.
        for el in soup.find_all(True):
            cl = el.get("class")
            if cl and len(cl) >= 2:
                shared_utility_names.update(cl)
        # Class tokens the custom code queries or the runtime-state CSS
        # targets are identity hooks: the literal token must survive on the
        # element. Forcing them through the thin-utility split prevents the
        # sig-dedup/uniquifier from absorbing or renaming them (the invest
        # FAQ regression: the answer `<div class="a">` was emitted as `a-10`
        # because anchor content classes had already taken `a`..`a-9`, so
        # `.faq details[open] .a{opacity:1}` matched nothing and every open
        # answer stayed invisible).
        js_toks, state_toks = protected_class_tokens(html)
        hook_class_names = (js_toks | state_toks) & {
            c for el in soup.find_all(True) for c in (el.get("class") or [])}
        shared_utility_names |= hook_class_names
        # A class name used as the sole class on elements with DIFFERENT
        # computed styles (e.g. the marquee `.track` vs the services rail
        # `.h-stage .track`) must also stay thin. Baking each element's cascade
        # under the same name forces a `track-2` rename, which strips the
        # literal class token that runtime CSS (`.h-stage .track.dragging`) and
        # custom-code hooks rely on. Splitting keeps the token on the element
        # and moves the styling to sig-deduped content classes.
        sole_sig: dict[str, str] = {}
        for el in soup.find_all(True):
            cl = el.get("class")
            if not cl or len(cl) != 1:
                continue
            b, v = resolver.computed(el)
            if el.get("style"):
                b = {**b, **dict(_parse_decls(el["style"]))}
            sig = json.dumps([sorted(b.items()),
                              {k: sorted(d.items()) for k, d in v.items()}],
                             sort_keys=True)
            if sole_sig.setdefault(cl[0], sig) != sig:
                shared_utility_names.add(cl[0])
        # Combo records absorb compound `.base.combo` rules whose class chain is
        # a subset of the element's stack — which makes the SAME name emit
        # DIFFERENT records in different stack contexts (`.sample-line.sub
        # {color}` vs the thin `sub` of a `.scene-head .sub` stack). Webflow
        # merges styles by class name site-wide, so only one of those records
        # survives the paste and the others' declarations are silently lost.
        # Detect such contested names by computing every class's per-class
        # emission signature across all stacks; any name with more than one
        # signature is demoted to simple `.name` rules only (classes_for passes
        # simple_only), which makes all its records byte-identical and pushes
        # the compound declarations onto per-element content classes.
        class_sig: dict[str, str] = {}
        sig_cache: dict[tuple, str] = {}
        for el in soup.find_all(True):
            cl = el.get("class")
            if not cl:
                continue
            for i in range(len(cl)):
                key = (tuple(cl[:i + 1]), cl[i])
                sig = sig_cache.get(key)
                if sig is None:
                    b, v = resolver.class_computed(list(cl), i, el.name,
                                                   include_tag_qualified=False)
                    sig = json.dumps([sorted(b.items()),
                                      {k: sorted(d.items())
                                       for k, d in v.items()}],
                                     sort_keys=True)
                    sig_cache[key] = sig
                if class_sig.setdefault(cl[i], sig) != sig:
                    contested_combo_names.add(cl[i])
    return soup, WebflowBuilder(resolver, var_map, asset_base, preserve_vars,
                                page_base, page_variants, variable_css_names,
                                shared_utility_names, contested_combo_names,
                                hook_class_names, page_prefix=page_prefix,
                                vocab=vocab)


def _warn_unsupported(builder):
    if builder.unsupported_tags:
        tags = ", ".join(f"{t}x{n}" for t, n in sorted(builder.unsupported_tags.items()))
        print(f"[html_to_webflow] embedded unsupported tags as HtmlEmbed: {tags}",
              file=sys.stderr)


def _body_roots(soup):
    body = soup.body or soup
    roots = [c for c in body.children if isinstance(c, Tag) and c.name not in SKIP_TAGS]
    if not roots and isinstance(body, Tag):
        roots = [body]
    return roots


def collect_css(html: str, css: str = "") -> str:
    """Merge optional external CSS with inline <style> blocks from the HTML."""
    soup = BeautifulSoup(html, "html.parser")
    chunks = [css] if css else []
    chunks.extend(style_tag.get_text() for style_tag in soup.find_all("style")
                  if not style_tag.has_attr("data-embed"))
    return "\n".join(chunks)


def extract_custom_code(html: str) -> tuple[str, dict]:
    """Extract inline and external script references for Webflow custom code."""
    soup = BeautifulSoup(html, "html.parser")
    chunks: list[str] = []
    external: list[str] = []
    inline_handlers: list[dict] = []
    selectors: set[str] = set()
    ids: set[str] = set()
    classes: set[str] = set()

    head_chunks: list[str] = []
    for script in soup.find_all("script"):
        if script.has_attr("data-embed"):
            continue  # section JS embed — rides inside the section payload
        # Head scripts must STAY in the head. The section embeds are inline in
        # the body and call the shared bootstrap (`WZ.add(...)`) as the parser
        # reaches them, so a bootstrap moved to the footer is defined too late
        # and every chapter throws "WZ is not defined" — the page then renders
        # but nothing animates (Dr. Nahlah, 2026-07-30). Merging both halves
        # into one footer bundle is what collapsed the design's own documented
        # head-bootstrap / footer-flush split.
        in_head = any(getattr(a, "name", None) == "head" for a in script.parents)
        sink = head_chunks if in_head else chunks
        src = script.get("src")
        if src:
            external.append(src)
            sink.append(f'// External script from source design: {src}')
        body = script.get_text().strip()
        if body:
            sink.append(body)

    for tag in soup.find_all(True):
        for attr, val in list(tag.attrs.items()):
            if attr.startswith("on"):
                inline_handlers.append({
                    "tag": tag.name,
                    "id": tag.get("id", ""),
                    "classes": tag.get("class", []),
                    "handler": attr,
                    "code": val,
                })
        if tag.get("id"):
            ids.add(tag["id"])
        for c in tag.get("class", []):
            classes.add(c)

    code = "\n\n".join(chunks).strip()
    head_code = "\n\n".join(head_chunks).strip()
    for m in re.finditer(r"querySelector(?:All)?\(\s*(['\"])(.*?)\1\s*\)",
                         code + "\n" + head_code):
        selectors.add(m.group(2))
    manifest = {
        "headCode": bool(head_code),
        "externalScripts": external,
        "inlineHandlers": inline_handlers,
        "querySelectors": sorted(selectors),
        "ids": sorted(ids),
        "classes": sorted(classes),
    }
    manifest["_headCode"] = head_code
    return code, manifest


_RUNTIME_BP_MEDIA = {"medium": "@media (max-width: 991px)",
                     "small": "@media (max-width: 767px)",
                     "tiny": "@media (max-width: 479px)",
                     "large": "@media (min-width: 1280px)",
                     "xl": "@media (min-width: 1440px)",
                     "xxl": "@media (min-width: 1920px)"}


def extract_runtime_state_css(html: str, css: str = "") -> str:
    """Collect CSS the clipboard payload cannot carry, for the site's
    <head> custom code:

    1. Rules whose selectors reference a class that never appears in the
       source markup — i.e. classes toggled at runtime by the page JS
       (`.reveal.in`, `.h-stage .track.dragging`, `.svc-drag-cursor.active`,
       `nav .links.open`). Pasted class records only describe markup-time
       state, so without this CSS the JS toggles do nothing.
    2. Rules whose class COMBINATION matches no element at markup time even
       though every token exists somewhere in the markup (`.pin-step.active`
       when the nav also has an `a.active`): the bake drops them and the
       token-based check above missed them (the invest pin-step regression,
       2026-06-12).
    3. Rules gated on runtime-toggled ATTRIBUTE state — `details[open]` —
       which can never be class-baked (the invest FAQ regression).
    4. `@keyframes` blocks (no Webflow class representation).
    5. The source body overflow rules, re-homed from the per-section page-base
       carry (see _setup) to an html/body selector where they belong.

    `::before`/`::after` in shipped selectors are rewritten to the
    materialized child div the converter creates (`.bar::before` ->
    `.bar > .bar-before`): the pasted DOM has no real pseudo-elements, so a
    verbatim pseudo selector matches nothing (the invest compare-bars
    regression).

    Install the result in Site Settings -> Custom Code -> Head as a <style>
    block (replaces any hand-written reveal-fix block).
    """
    soup = BeautifulSoup(html, "html.parser")
    css = collect_css(html, css)
    rules, _skipped, var_map, var_scopes = parse_rules(css)
    dom_classes: set[str] = set()
    toggled_toks: set[str] = toggled_class_tokens(html)
    # JS-written custom properties are shielded exactly like inline-declared
    # ones: the artifact must keep `var(--pos,0%)` live so the runtime writes
    # take effect, instead of freezing the fallback.
    runtime_vars: set[str] = js_set_custom_properties(html)
    gated_ids: set = set()
    inline_vars: set[str] = set(runtime_vars)
    for el in soup.find_all(True):
        dom_classes.update(el.get("class", []))
        st = el.get("style")
        if st:
            inline_vars.update(p for p, _ in _parse_decls(st)
                               if p.startswith("--"))
    gated_ids = _js_gated_initial_state(rules, dom_classes, toggled_toks)

    def _expand_keep_inline(v: str) -> str:
        """Expand :root vars but keep references to INLINE-defined custom
        properties (`--w` on the compare rows) as live var() — the custom-code
        artifact re-applies those tokens at runtime, and resolving them here
        would freeze every element at the CSS fallback value."""
        if "var(" not in v:
            return v
        shielded: dict = {}

        def shield(m):
            name = m.group(1).partition(",")[0].strip()
            if name in inline_vars and name not in var_map:
                key = f"\x00{len(shielded)}\x00"
                shielded[key] = m.group(0)
                return key
            return m.group(0)

        v2 = re.sub(r"var\(\s*(--[\w-]+(?:\s*,\s*[^()]*)?)\)", shield, v)
        v2 = expand_vars(v2, var_map)
        for key, orig in shielded.items():
            v2 = v2.replace(key, orig)
        return v2

    def _resolve(decls) -> str:
        return ";".join(
            f"{p}:{_expand_keep_inline(v)}"
            for p, v in decls if not p.startswith("--"))

    def _markup_matches(selector: str) -> bool:
        try:
            return soup.select_one(selector) is not None
        except Exception:
            return True   # soupsieve can't parse it: assume markup-time

    def _strip_token(selector: str, tok: str) -> str:
        out = re.sub(rf"\.{re.escape(tok)}(?![\w-])", "", selector)
        return out if out.strip() and not out.strip().startswith((">", "+", "~")) \
            else selector

    def _pseudo_to_child(base_sel: str, pseudo: str) -> str:
        """The converter materializes ::before/::after as real child divs
        named `<first-class-or-tag>-<pseudo>`; point the selector at them."""
        if pseudo not in ("before", "after"):
            return f"{base_sel}::{pseudo}"
        last = re.split(r"[\s>+~]+", base_sel.strip())[-1]
        m = re.search(r"\.([A-Za-z_][\w-]*)", last)
        if not m:
            m = re.match(r"([A-Za-z][\w-]*)", last)
        name = m.group(1) if m else "div"
        return f"{base_sel} > .{name}-{pseudo}"

    grouped: dict = {}
    grouped_media: dict = {}
    for r in rules:
        sel = r.selector
        if r.state:
            sel += f":{r.state}"
        if r.pseudo:
            sel = _pseudo_to_child(sel, r.pseudo)
        if r.media:
            # media-locked rules (pointer/hover/motion conditions) are excluded
            # from class baking entirely — they ship here, in their original
            # condition, regardless of which classes they mention.
            grouped_media.setdefault(r.media, []).append(
                f"{sel}{{{_resolve(r.decls)}}}")
            continue
        toks = set(re.findall(r"\.([A-Za-z_][\w-]*)", r.selector))
        has_unknown_token = bool(toks - dom_classes)
        has_attr_state = "[open]" in r.selector
        runtime_combo = (not has_unknown_token and not has_attr_state and toks
                         and not _markup_matches(r.selector))
        # A token the JS toggles must ship even when it DOES match markup: the
        # match is only the initial state (`<div class="slide on">` = slide 1),
        # and baking it freezes that state while leaving the toggled class
        # empty. Cases 1-3 above all miss this because the selector looks
        # perfectly markup-time.
        js_toggled = bool(toks & toggled_toks)
        # Same for a rule reading a JS-written custom property: it is excluded
        # from the bake (CascadeResolver._is_runtime_state), so this artifact
        # is the only place it can ship from.
        reads_runtime_var = any(v in val for _p, val in r.decls
                                for v in runtime_vars)
        # The anti-FOUC "hidden until JS" half of a pair. Excluded from the
        # bake so the element stays visible/editable on the Designer canvas
        # (which never runs this artifact); shipped here so the published page
        # still hides it until GSAP takes over.
        gated_initial = id(r) in gated_ids
        if not (has_unknown_token or has_attr_state or runtime_combo
                or js_toggled or reads_runtime_var or gated_initial):
            continue
        # Specificity boost: Webflow publishes baked combo chains like
        # `.span-4.contact-grid.reveal{opacity:0}` at (0,3,0), which outranks a
        # verbatim `.reveal.in` (0,2,0) — the element then NEVER reveals (the
        # invisible contact-grid regression). Repeating the runtime-class token
        # (`.in` -> `.in.in.in`) lifts each state rule above any chain the
        # converter can emit without changing what it matches.
        # Boost each qualifying token exactly ONCE — a token can qualify under
        # several of these clauses at the same time, and boosting twice would
        # emit `.on` nine times over.
        boost = set(toks - dom_classes)
        # A JS-toggled token's declarations are also baked into the markup-time
        # element's combo chain; the toggled rule must outrank that chain on
        # every sibling the class later moves to.
        boost |= toks & toggled_toks
        if runtime_combo or has_attr_state:
            # discriminator tokens of a runtime combination: the ones whose
            # removal makes the selector match markup again (`.active` — and
            # `.pin-step` too when the nav has `a.active`)
            boost |= {tok for tok in toks & dom_classes
                      if _markup_matches(_strip_token(r.selector, tok))}
        for tok in boost:
            sel = re.sub(rf"\.{re.escape(tok)}(?![\w-])",
                         f".{tok}.{tok}.{tok}", sel)
        sel = sel.replace("[open]", "[open][open][open]")
        grouped.setdefault(r.breakpoint, []).append(
            f"{sel}{{{_resolve(r.decls)}}}")

    parts: list[str] = []
    # Source webfont stylesheets, re-emitted as @import (must precede all other
    # rules). Webflow's own Google Fonts integration loads upright weights only
    # unless italics are hand-picked in Site Settings — the design's italic
    # Lora then renders as a synthesized slant. Importing the source's exact
    # fonts URL (e.g. Lora:ital,wght@0,400..700;1,400..700) keeps the published
    # fonts identical to the design.
    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href", "")
        if "fonts.googleapis" in href:
            parts.append(f'@import url("{href}");')
    body_overflow = {}
    body_base = {}
    resolver = CascadeResolver(soup, rules, var_map=var_map,
                               var_scopes=var_scopes)
    if soup.body:
        bb, _bv = resolver.computed(soup.body)
        body_overflow = {k: v for k, v in bb.items() if k.startswith("overflow")}
        # Base visual declarations for the Webflow Body element. Pasted
        # components never carry the source <body>'s own styles, so without this
        # the published <body> keeps Webflow defaults (white bg, #333, Arial);
        # any uncovered area or text that inherits from body then diverges from
        # the design (verified 2026-06-18 on Giovanni Serrano home: cream/navy/
        # Inter all missing on staging). These are sticky-safe (only overflow
        # disables sticky), so they ride the same body-only rule below.
        _BASE_PROPS = ("background", "background-color", "color", "font-family",
                       "font-weight", "font-size", "line-height",
                       "-webkit-font-smoothing")
        body_base = {k: v for k, v in bb.items() if k in _BASE_PROPS}
    body_decls = {**body_base, **body_overflow}
    if body_decls:
        # body ONLY — never html. With html left `visible`, body's overflow-x
        # propagates to the viewport and body itself stays a non-clipping box.
        # `html,body{overflow-x:hidden}` makes body its own clip container,
        # which disables position:sticky for the entire page (the thesis pull
        # quote regression, round two).
        parts.append("body{" + _resolve(list(body_decls.items())) + "}")
    parts.extend(grouped.pop(None, []))
    for bp, lst in grouped.items():
        mq = _RUNTIME_BP_MEDIA.get(bp)
        body = "\n".join(lst)
        parts.append(f"{mq}{{\n{body}\n}}" if mq else body)
    for cond, lst in grouped_media.items():
        parts.append("@media " + cond + "{\n" + "\n".join(lst) + "\n}")
    for selector, kf_body in _iter_rule_blocks(css):
        if selector.startswith("@keyframes"):
            parts.append(f"{selector}{{{kf_body}}}")
    return "\n".join(parts)


def extract_inline_var_restorations(html: str) -> list:
    """[[query, index, property, value], ...] for inline CSS custom properties.

    The clipboard payload cannot carry custom-property declarations (Webflow
    strips `--*` from styleLess, and inline style="" is folded into classes
    minus the custom props), so per-element tokens like the compare bars'
    `--w: 100%` vanish on paste — every bar then animates to the stylesheet
    fallback width (the invest compare-bars regression, round two). The
    custom-code artifact re-applies them at runtime via
    `querySelectorAll(query)[index].style.setProperty(property, value)`,
    anchored on the nearest ancestor id (section ids survive the paste) and
    indexed among same-class elements so structural divs the converter adds
    (materialized pseudos, br-line spans) cannot shift the target.
    """
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for el in soup.find_all(True):
        st = el.get("style")
        if not st:
            continue
        decls = [(p, v) for p, v in _parse_decls(st) if p.startswith("--")]
        if not decls:
            continue
        anchor = None
        for anc in el.parents:
            if isinstance(anc, Tag) and anc.get("id"):
                anchor = anc
                break
        cls = (el.get("class") or [None])[0]
        if anchor is None or cls is None:
            print(f"[html_to_webflow] WARNING: cannot anchor inline custom "
                  f"property restoration for <{el.name} style=\"{st}\"> "
                  f"(needs an ancestor id and a class)", file=sys.stderr)
            continue
        query = f"#{anchor['id']} .{cls}"
        idx = anchor.select(f".{cls}").index(el)
        for p, v in decls:
            out.append([query, idx, p, v])
    return out


def write_text_artifacts(html: str, output_dir: str,
                         class_renames: Optional[dict] = None) -> None:
    import os
    os.makedirs(output_dir, exist_ok=True)
    code, manifest = extract_custom_code(html)
    head_code = manifest.pop("_headCode", "")
    if head_code:
        # Site Settings -> Custom Code -> HEAD. Not IIFE-wrapped: this half is
        # the shared bootstrap the body's inline section embeds call into, so
        # its globals (window.WZ) must stay global.
        with open(os.path.join(output_dir, "webflow-custom-code-head.js"),
                  "w", encoding="utf-8") as f:
            f.write(head_code + "\n")
    restorations = extract_inline_var_restorations(html)
    if restorations:
        for entry in restorations:
            for old, new in (class_renames or {}).items():
                entry[0] = re.sub(rf"\.{re.escape(old)}(?![\w-])",
                                  f".{new}", entry[0])
        code = (code + "\n\n" if code else "") + (
            "// Restore inline CSS custom properties dropped by the Webflow "
            "paste\n// (e.g. the compare bars' per-row --w widths).\n"
            + json.dumps(restorations)
            + ".forEach(([q, i, p, v]) => {\n"
              "  const el = document.querySelectorAll(q)[i];\n"
              "  if (el) el.style.setProperty(p, v);\n"
              "});")
    if code:
        # IIFE wrap: top-level `const`/`let` share ONE global lexical scope
        # across every <script> tag on a page. With two pages' scripts in
        # site-wide footer code, the second one died at parse time with
        # "Identifier 'io' has already been declared" and none of it ran
        # (the invest-page regression, 2026-06-12). Wrapping gives each
        # artifact its own scope so installed scripts can coexist.
        code = "(() => {\n" + code + "\n})();"
        with open(os.path.join(output_dir, "webflow-custom-code.js"),
                  "w", encoding="utf-8") as f:
            f.write(code + "\n")
    with open(os.path.join(output_dir, "animation-manifest.json"),
              "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    state_css = extract_runtime_state_css(html)
    if state_css:
        # --avoid renamed state-CSS-only class tokens (e.g. `bar` ->
        # `bar-invest`) on the pasted elements; the runtime-state selectors
        # must follow or they stop matching.
        for old, new in (class_renames or {}).items():
            state_css = re.sub(rf"\.{re.escape(old)}(?![\w-])",
                               f".{new}", state_css)
        with open(os.path.join(output_dir, "webflow-runtime-states.css"),
                  "w", encoding="utf-8") as f:
            f.write(state_css + "\n")


def write_variable_artifacts(css: str, output_dir: str) -> None:
    import os
    os.makedirs(output_dir, exist_ok=True)
    _rules, _skipped, var_map, var_scopes = parse_rules(css)
    os.makedirs(output_dir, exist_ok=True)
    payload = {
        "source": ":root CSS custom properties",
        "variables": [{"name": k, "value": v} for k, v in sorted(var_map.items())],
    }
    with open(os.path.join(output_dir, "webflow-variable-import.json"),
              "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    map_path = os.path.join(output_dir, "webflow-variable-map.json")
    existing = load_variable_map_entries(map_path) if os.path.exists(map_path) else {}
    map_payload = {
        "source": "Webflow variable map",
        "note": (
            "After MCP import, fill variableId with the Webflow variable ID and "
            "cssName with variable.getCSSName(). style_tool variable binding uses "
            "variableId via variable_as_value."
        ),
        "variables": [
            {
                "sourceName": k,
                "variableId": existing.get(k, {}).get("variableId", ""),
                "collectionId": existing.get(k, {}).get("collectionId", ""),
                "cssName": existing.get(k, {}).get("cssName", k),
                "binding": f"var({existing.get(k, {}).get('cssName', k)})",
            }
            for k in sorted(var_map)
        ],
    }
    with open(map_path, "w", encoding="utf-8") as f:
        json.dump(map_payload, f, indent=2)


def _vars_in_value(value: str) -> list[str]:
    return [_normalize_css_var_name(v) for v in re.findall(r"var\(\s*(--[\w-]+)", value)]


def _variant_options(variant: str) -> dict:
    if variant == "base":
        return {"breakpoint_id": "main", "pseudo": "noPseudo"}
    parts = variant.split("_", 1)
    if len(parts) == 2:
        return {"breakpoint_id": parts[0], "pseudo": parts[1]}
    return {"breakpoint_id": variant, "pseudo": "noPseudo"}


def _direct_variable_property(prop: str, value: str) -> Optional[tuple[str, str]]:
    """Return (longhand_property, css_var_name) when MCP can bind directly.

    style_tool variable_as_value applies to a single property value. Shorthand or
    compound values are only actionable when they can be expressed as one
    longhand property plus one variable, such as `background: var(--canvas)` or
    `border-bottom: 1px solid var(--line)`.
    """
    value = value.strip()
    direct = re.fullmatch(r"var\(\s*(--[\w-]+)\s*\)", value)
    if direct:
        css_name = _normalize_css_var_name(direct.group(1))
        if prop == "background":
            return "background-color", css_name
        if prop in {"color", "background-color", "border-color",
                    "border-top-color", "border-right-color",
                    "border-bottom-color", "border-left-color"}:
            return prop, css_name
        return prop, css_name

    border = re.fullmatch(r"(.+)\s+var\(\s*(--[\w-]+)\s*\)", value)
    if border and prop in {"border", "border-top", "border-right",
                           "border-bottom", "border-left"}:
        return f"{prop}-color", _normalize_css_var_name(border.group(2))
    return None


def write_style_variable_bindings(sections: list, output_dir: str,
                                  variable_css_names: Optional[dict] = None,
                                  variable_entries: Optional[dict] = None) -> None:
    """Write a post-paste MCP binding manifest for Webflow Designer variables.

    Webflow Designer variable mapping is done through style_tool property
    updates with `variable_as_value`, not through raw `var(...)` in clipboard
    styleLess.
    """
    import os
    os.makedirs(output_dir, exist_ok=True)
    css_to_source = {
        _normalize_css_var_name(v): _normalize_css_var_name(k)
        for k, v in (variable_css_names or {}).items()
    }
    entries = variable_entries or {
        k: {"cssName": v, "variableId": ""}
        for k, v in (variable_css_names or {}).items()
    }
    bindings = []
    action_groups: dict[tuple[str, str, str], list[dict]] = {}
    for section_label, payload in sections:
        for style in payload["payload"]["styles"]:
            buckets = [("base", style.get("styleLess", ""))]
            buckets.extend((variant, data.get("styleLess", ""))
                           for variant, data in style.get("variants", {}).items())
            for variant, style_less in buckets:
                for prop, value in _parse_decls(style_less):
                    css_names = _vars_in_value(value)
                    if not css_names:
                        continue
                    direct = _direct_variable_property(prop, value)
                    mcp = None
                    status = "unsupported_compound_value"
                    if direct:
                        property_name, css_name = direct
                        source_name = css_to_source.get(css_name, css_name)
                        variable_id = entries.get(source_name, {}).get("variableId", "")
                        status = "ready" if variable_id else "missing_variable_id"
                        mcp = {
                            "style_name": style["name"],
                            **_variant_options(variant),
                            "property": {
                                "property_name": property_name,
                                "variable_as_value": variable_id,
                            },
                            "sourceName": source_name,
                            "cssName": css_name,
                        }
                        if variable_id:
                            key = (style["name"], mcp["breakpoint_id"], mcp["pseudo"])
                            action_groups.setdefault(key, []).append(mcp["property"])
                    bindings.append({
                        "section": section_label,
                        "className": style["name"],
                        "sourceStyleId": style["_id"],
                        "variant": variant,
                        "property": prop,
                        "value": value,
                        "cssNames": css_names,
                        "sourceNames": [css_to_source.get(v, v) for v in css_names],
                        "status": status,
                        "mcp": mcp,
                    })
    actions = [
        {
            "update_style": {
                "style_name": style_name,
                "breakpoint_id": breakpoint,
                "pseudo": pseudo,
                "properties": properties,
            }
        }
        for (style_name, breakpoint, pseudo), properties in sorted(action_groups.items())
    ]
    payload = {
        "source": "Generated paste payload styleLess var() references",
        "note": (
            "Use Webflow MCP style_tool after paste. Designer variable mapping "
            "requires properties[].variable_as_value = variable_id."
        ),
        "styleTool": {"actions": actions},
        "bindings": bindings,
    }
    with open(os.path.join(output_dir, "webflow-style-variable-bindings.json"),
              "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def convert(html: str, css: str = "", root_selector: Optional[str] = None,
            resolve: bool = True, asset_base: str = "",
            preserve_vars: bool = False,
            variable_css_names: Optional[dict] = None,
            page_prefix: str = "", vocab: Optional[dict] = None) -> dict:
    """Convert HTML+CSS to a Webflow XscpData payload.

    root_selector: if given, only that element (matched in the FULL document so
    ancestor-dependent selectors still resolve) is converted. Otherwise the
    direct children of <body> (or the document root) are used.

    page_prefix: namespaces tag-derived auto-names. Without it a single-root
    conversion emits classes literally called `div`, `h2`, `p` — which Webflow
    merges BY NAME against the target site and can overwrite a style guide's
    tag-level styles site-wide.
    """
    soup, builder = _setup(html, css, resolve, asset_base, preserve_vars,
                           variable_css_names, page_prefix=page_prefix,
                           vocab=vocab)
    roots = soup.select(root_selector) if root_selector else _body_roots(soup)
    payload = builder.build(roots)
    _warn_unsupported(builder)
    return payload


def convert_sections(html: str, css: str = "", resolve: bool = True,
                     asset_base: str = "", preserve_vars: bool = False,
                     variable_css_names: Optional[dict] = None,
                     extra_shared_utility_names: Optional[set] = None,
                     page_prefix: str = "", vocab: Optional[dict] = None):
    """Build the whole page in ONE pass, then return one payload per top-level
    section as a list of (label, payload). Class names are globally consistent
    across sections, so pasting them one-by-one (each small enough not to crash
    the Designer) reproduces the page without style collisions.

    `label` is derived from each root's id / first class / tag name."""
    soup, builder = _setup(html, css, resolve, asset_base, preserve_vars,
                           variable_css_names, extra_shared_utility_names,
                           page_prefix=page_prefix, vocab=vocab)
    sliced = builder.build_sliced(_body_roots(soup))
    _warn_unsupported(builder)
    out = []
    for i, (root, payload) in enumerate(sliced, 1):
        name = root.get("id") or (root.get("class") or [root.name])[0]
        out.append((f"{i:02d}_{re.sub(r'[^A-Za-z0-9_-]', '-', str(name))}", payload))
    return out


def style_signature(style: dict) -> str:
    """Identity of a style record for Webflow's merge-by-name: what the class
    actually declares, across breakpoints."""
    return (style.get("styleLess", "") +
            json.dumps(style.get("variants", {}), sort_keys=True))


def load_reserved_styles(dirs: list[str]) -> dict:
    """name -> set of signatures already pasted into the site, read from other
    pages' generated paste_*.html split folders."""
    import glob
    import os
    reserved: dict[str, set] = {}
    for d in dirs:
        for fp in sorted(glob.glob(os.path.join(d, "paste_*.html"))):
            with open(fp, encoding="utf-8") as f:
                m = re.search(
                    r'<script type="application/json"[^>]*>(.*?)</script>',
                    f.read(), re.S)
            if not m:
                continue
            for s in json.loads(m.group(1))["payload"]["styles"]:
                reserved.setdefault(s["name"], set()).add(style_signature(s))
    return reserved


_TOGGLE_CALL_RE = re.compile(
    r"""classList\s*\.\s*(?:add|remove|toggle|replace)\s*\(([^)]*)\)"""
    r"""|toggleClass\s*:\s*(['"])([\w\s-]+)\2"""
    r"""|className\s*=\s*(['"])([\w\s-]+)\4""")


_SET_PROP_RE = re.compile(
    r"""setProperty\s*\(\s*['"](--[\w-]+)['"]|style\s*\[\s*['"](--[\w-]+)['"]""")


def js_set_custom_properties(html: str) -> set:
    """CSS custom properties the page JS writes at runtime
    (`cmp.style.setProperty('--pos', p + '%')`).

    These are never declared in the stylesheet, so `expand_vars` collapses
    every `var(--pos, 0%)` reference to its FALLBACK and bakes `left: 0%` into
    the class. The scrub handle then cannot move even though the JS is setting
    the property correctly (the Dr. Nahlah before/after wipe, 2026-07-30).
    Rules referencing one must keep a live `var()` and ship as runtime state
    rather than being baked."""
    soup = BeautifulSoup(html, "html.parser")
    props: set = set()
    for script in soup.find_all("script"):
        for m in _SET_PROP_RE.finditer(script.get_text() or ""):
            props.add(m.group(1) or m.group(2))
    return props


def toggled_class_tokens(html: str) -> set:
    """Class tokens the page JS ADDS, REMOVES or TOGGLES at runtime.

    Distinct from `protected_class_tokens`' js_tokens, which are merely
    QUERIED (`.querySelector('.cmp')`) and so are safe to bake. A toggled
    token's markup-time presence is incidental: `<div class="slide on">` marks
    only the FIRST slide, and `classList.toggle('on', i===n)` moves it. Baking
    `.slide.on{opacity:1}` into that one element's class freezes the carousel
    on slide 1 and leaves `on` an empty class, so every later toggle is a
    no-op (the Dr. Nahlah before/after wipe, 2026-07-30).

    Unlike extract_custom_code this DOES scan `<script data-embed>` blocks —
    those ride inside the payload as HtmlEmbeds and still run on the pasted
    page, and on this design they own every chapter's state machine."""
    soup = BeautifulSoup(html, "html.parser")
    toks: set = set()
    for script in soup.find_all("script"):
        for m in _TOGGLE_CALL_RE.finditer(script.get_text() or ""):
            raw = m.group(1) or m.group(3) or m.group(5) or ""
            for lit in re.findall(r"""['"]([\w\s-]+)['"]""", raw) \
                    if m.group(1) else [raw]:
                toks.update(t for t in lit.split() if t)
    return toks


def protected_class_tokens(html: str) -> tuple[set, set]:
    """Class-name identity hooks, split by who consumes them.

    Returns (js_tokens, state_only_tokens):
    - js_tokens: queried by the extracted custom code. NEVER renameable — the
      JS ships verbatim. A colliding js token is instead forced through the
      thin-utility split so the token survives while its styling moves to a
      content class.
    - state_only_tokens: referenced only by the generated runtime-state CSS,
      which is OUR artifact — renameable as long as the artifact's selectors
      are rewritten to match (write_text_artifacts handles that).
    """
    _code, manifest = extract_custom_code(html)
    js_tokens: set = set()
    for sel in manifest.get("querySelectors", []):
        js_tokens.update(re.findall(r"\.([A-Za-z_][\w-]*)", sel))
    state_tokens: set = set()
    state_css = extract_runtime_state_css(html)
    for sel_match in re.finditer(r"([^{}]+)\{", state_css):
        sel = sel_match.group(1)
        if sel.strip().startswith("@"):
            continue
        state_tokens.update(re.findall(r"\.([A-Za-z_][\w-]*)", sel))
    return js_tokens, state_tokens - js_tokens


def apply_namespace_avoidance(sections, reserved: dict, protected: set,
                              suffix: str) -> dict:
    """Rename style records whose name is already used by another built page
    with a DIFFERENT signature. Webflow merges styles by class name SITE-WIDE
    and the existing definition silently wins, so pasting a second page that
    was converted in a separate run breaks every colliding auto-named content
    class (the invest-page regression, 2026-06-12: invest's `.div-33` ledger
    row grid was replaced by the index page's `.div-33` 56px display number).

    Byte-identical records keep their names (the merge is a no-op — that is how
    shared utilities like `reveal` work). Protected hook tokens are never
    renamed; a differing protected name is reported for manual resolution.
    Returns {old_name: new_name}.
    """
    by_name: dict[str, list] = {}
    seen = set()
    for _label, payload in sections:
        for s in payload["payload"]["styles"]:
            if id(s) not in seen:           # dicts are shared across sections
                seen.add(id(s))
                by_name.setdefault(s["name"], []).append(s)
    rename: dict[str, str] = {}
    conflicts: list[str] = []
    taken = set(by_name) | set(reserved)
    for name, records in by_name.items():
        if name not in reserved:
            continue
        ours = {style_signature(s) for s in records}
        if ours <= reserved[name]:
            continue                        # identical definition: safe merge
        if name in protected:
            conflicts.append(name)
            continue
        candidate = f"{name}-{suffix}"
        n = 2
        while candidate in taken:
            candidate = f"{name}-{suffix}-{n}"
            n += 1
        taken.add(candidate)
        rename[name] = candidate
        for s in records:
            s["name"] = candidate
    if rename:
        # HtmlEmbed <style> prefixes scope their rules to ANCESTOR classes
        # that live outside the embed (`.contact-grid form input{...}`).
        # Those ancestors were just renamed, so the embed selectors must
        # follow or the embed pastes completely unstyled (the invest contact
        # form regression, 2026-06-12). Class names used by elements INSIDE
        # the embed are left alone — they are not Webflow classes.
        for _label, payload in sections:
            for node in payload["payload"]["nodes"]:
                if node.get("type") != "HtmlEmbed":
                    continue
                # The embed HTML is duplicated in node["v"] AND the canonical
                # Webflow field node["data"]["embed"]["meta"]["html"] (both set
                # from the same raw string at creation). Webflow's clipboard
                # PASTES from meta.html, so rewriting only "v" leaves the pasted
                # embed with the OLD class names (the invest contact-form stayed
                # unstyled until 2026-06-19). Rewrite BOTH.
                meta = (node.get("data", {}) or {}).get("embed", {}) \
                    .get("meta", {}) if isinstance(node.get("data"), dict) else {}
                v = node.get("v")
                if not isinstance(v, str):
                    v = meta.get("html") if isinstance(meta, dict) else None
                if not isinstance(v, str):
                    continue
                internal = set()
                for m in re.finditer(r'class="([^"]*)"', v):
                    internal.update(m.group(1).split())
                new_v = v
                for old, new in rename.items():
                    if old in internal:
                        continue
                    new_v = re.sub(rf"\.{re.escape(old)}(?![\w-])",
                                   f".{new}", new_v)
                if new_v != v:
                    if isinstance(node.get("v"), str):
                        node["v"] = new_v
                    if isinstance(meta, dict) and isinstance(meta.get("html"), str):
                        meta["html"] = new_v
        print(f"[html_to_webflow] renamed {len(rename)} classes colliding with "
              f"already-built pages: "
              + ", ".join(f"{o}->{n}" for o, n in sorted(rename.items())),
              file=sys.stderr)
    for name in conflicts:
        print(f"[html_to_webflow] WARNING: protected hook class '{name}' "
              f"collides with an already-built page under a DIFFERENT "
              f"definition. It was NOT renamed; resolve manually before "
              f"pasting.", file=sys.stderr)
    return rename


def copy_to_clipboard(text: str) -> bool:
    """text/plain clipboard via Windows `clip`. NOT Webflow-pasteable (Webflow
    reads application/json) — use write_copy_page for the Designer."""
    try:
        subprocess.run("clip", input=text.encode("utf-16-le"), check=True, shell=True)
        return True
    except Exception:
        return False


COPY_PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Paste into Webflow</title>
<style>
  body{{font:15px/1.5 system-ui,sans-serif;max-width:640px;margin:3rem auto;padding:0 1rem;color:#111}}
  button{{font-size:1.1rem;padding:.9rem 1.6rem;border:0;border-radius:.5rem;
          background:#1463ff;color:#fff;cursor:pointer}}
  button:active{{transform:translateY(1px)}}
  .ok{{color:#0a7d28;font-weight:600}}
  code{{background:#f0f0f3;padding:.1rem .3rem;border-radius:.25rem}}
  small{{color:#666}}
</style>
</head>
<body>
<h1>Copy component for Webflow</h1>
<p>Click the button, then switch to the Webflow Designer, click on the canvas,
and press <code>Ctrl/Cmd&nbsp;+&nbsp;V</code>.</p>
<p><button id="btn">Copy to Webflow clipboard</button>
   <span id="status"></span></p>
<p><small>Writes the payload under the <code>application/json</code> MIME type
   Webflow's paste handler reads.</small></p>
<script type="application/json" id="payload">{payload}</script>
<script>
  const json = document.getElementById('payload').textContent;
  document.getElementById('btn').addEventListener('click', () => {{
    const handler = (e) => {{
      e.preventDefault();
      e.clipboardData.setData('application/json', json);
      e.clipboardData.setData('text/plain', json);
    }};
    document.addEventListener('copy', handler);
    const ok = document.execCommand('copy');
    document.removeEventListener('copy', handler);
    const s = document.getElementById('status');
    s.textContent = ok ? '\\u2713 Copied! Now paste in Webflow.' : 'Copy failed \\u2013 try again.';
    s.className = ok ? 'ok' : '';
  }});
</script>
</body>
</html>
"""


def write_copy_page(payload_json: str, path: str) -> None:
    safe = payload_json.replace("</", "<\\/")
    with open(path, "w", encoding="utf-8") as f:
        f.write(COPY_PAGE_TEMPLATE.format(payload=safe))


def main(argv=None):
    ap = argparse.ArgumentParser(description="HTML+CSS -> Webflow clipboard JSON")
    ap.add_argument("--html", required=True, help="HTML file")
    ap.add_argument("--css", help="CSS file (optional; <style> tags also work)")
    ap.add_argument("--root", help="CSS selector of the element to convert "
                                   "(matched in the full document for cascade)")
    ap.add_argument("--no-resolve", action="store_true",
                    help="disable the cascade resolver (flat class mode)")
    ap.add_argument("--asset-base", dest="asset_base", default="",
                    help="base URL prepended to relative image src (so images "
                         "resolve once pasted into Webflow)")
    ap.add_argument("--preserve-vars", action="store_true",
                    help="keep var(--token) references in styleLess for "
                         "debugging raw clipboard behavior")
    ap.add_argument("--var-map",
                    help="JSON map from source CSS variables to Webflow cssName "
                         "and variableId; variableId enables post-paste "
                         "style_tool variable_as_value bindings")
    ap.add_argument("--out", help="write JSON here")
    ap.add_argument("--copy-page", dest="copy_page",
                    help="write a self-contained HTML page that copies the payload "
                         "under application/json (the Webflow-pasteable path)")
    ap.add_argument("--split", metavar="DIR",
                    help="full page only: write one copy page PER top-level section "
                         "into DIR (globally-consistent class names). Paste them "
                         "in order; avoids the crash from one huge paste.")
    ap.add_argument("--avoid", metavar="DIR[,DIR...]",
                    help="split folders of pages ALREADY pasted into the same "
                         "Webflow site. Auto-named classes that collide with "
                         "them under a different definition are renamed "
                         "(Webflow merges styles by name site-wide and the "
                         "existing definition wins).")
    ap.add_argument("--avoid-suffix", default=None,
                    help="suffix for renamed colliding classes "
                         "(default: the --split folder name)")
    ap.add_argument("--clip", action="store_true",
                    help="copy JSON to clipboard as text/plain (NOT Webflow-pasteable)")
    ap.add_argument("--indent", type=int, default=None, help="pretty-print indent")
    ap.add_argument("--page-prefix", dest="page_prefix", default="",
                    help="namespace tag-derived AUTO-NAMES (div, h2, p, ...). "
                         "Without this the payload ships classes named literally "
                         "`h2`/`p`/`img`, which Webflow merges BY NAME against the "
                         "target site and can overwrite a style guide's tag-level "
                         "styles site-wide. Strongly recommended.")
    args = ap.parse_args(argv)

    with open(args.html, encoding="utf-8") as f:
        html = f.read()
    css = ""
    if args.css:
        with open(args.css, encoding="utf-8") as f:
            css = f.read()
    variable_entries = load_variable_map_entries(args.var_map)
    variable_css_names = load_variable_css_map(args.var_map)

    if args.split:
        import os
        os.makedirs(args.split, exist_ok=True)
        rename_map: dict = {}
        state_renames: dict = {}
        reserved: dict = {}
        js_protected: set = set()
        extra_shared: set = set()
        if args.avoid:
            avoid_dirs = [d.strip() for d in args.avoid.split(",") if d.strip()]
            reserved = load_reserved_styles(avoid_dirs)
            js_protected, _state_tokens = protected_class_tokens(html)
            # JS-queried tokens that already exist in the site go through the
            # thin-utility split so their record can merge as a no-op while
            # the element keeps the literal token for the custom code.
            extra_shared = {n for n in js_protected if n in reserved}
        sections = convert_sections(html, css, resolve=not args.no_resolve,
                                    asset_base=args.asset_base,
                                    preserve_vars=args.preserve_vars,
                                    variable_css_names=variable_css_names,
                                    extra_shared_utility_names=extra_shared)
        if args.avoid:
            suffix = args.avoid_suffix or os.path.basename(
                os.path.normpath(args.split))
            rename_map = apply_namespace_avoidance(
                sections, reserved, js_protected, suffix)
            state_renames = {o: n for o, n in rename_map.items()
                             if o in _state_tokens}
        print(f"{'section':20}{'nodes':>6}  file")
        for label, payload in sections:
            fp = os.path.join(args.split, f"paste_{label}.html")
            write_copy_page(json.dumps(payload, separators=(",", ":")), fp)
            print(f"{label:20}{len(payload['payload']['nodes']):6}  {fp}")
        print(f"\nPaste the {len(sections)} pages in order into ONE Webflow page "
              f"(each after the previous).")
        # All companion artifacts go into the page's OWN split folder, so each
        # `.tmp/<page>/` is fully self-contained (components + JS + state CSS +
        # variable artifacts + a copy of the source CSS). Nothing is written to
        # the shared parent `.tmp/` anymore — that previously forced manual
        # `index-artifacts/` backups before every new page.
        artifact_dir = args.split
        write_text_artifacts(html, artifact_dir, state_renames)
        write_variable_artifacts(collect_css(html, css), artifact_dir)
        if args.css:
            import shutil
            site_css_copy = os.path.join(artifact_dir, "site.css")
            shutil.copy(args.css, site_css_copy)
            print(f"copied source CSS -> {site_css_copy}")
        binding_sections = sections
        if not args.preserve_vars:
            binding_sections = convert_sections(
                html, css, resolve=not args.no_resolve,
                asset_base=args.asset_base, preserve_vars=True,
                variable_css_names=variable_css_names,
                extra_shared_utility_names=extra_shared,
            )
            if rename_map:
                # Mirror the avoidance renames (naming is deterministic across
                # the two conversion passes) so binding actions target the
                # class names that actually exist after paste.
                seen_ids = set()
                for _label, payload in binding_sections:
                    for s in payload["payload"]["styles"]:
                        if id(s) not in seen_ids:
                            seen_ids.add(id(s))
                            if s["name"] in rename_map:
                                s["name"] = rename_map[s["name"]]
        write_style_variable_bindings(binding_sections, artifact_dir,
                                      variable_css_names, variable_entries)
        return

    payload = convert(html, css, root_selector=args.root,
                      resolve=not args.no_resolve, asset_base=args.asset_base,
                      preserve_vars=args.preserve_vars,
                      variable_css_names=variable_css_names,
                      page_prefix=args.page_prefix)
    text = (json.dumps(payload, separators=(",", ":")) if args.indent is None
            else json.dumps(payload, indent=args.indent))
    compact = json.dumps(payload, separators=(",", ":"))

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote {args.out}  ({len(payload['payload']['nodes'])} nodes, "
              f"{len(payload['payload']['styles'])} styles)")
    if args.copy_page:
        write_copy_page(compact, args.copy_page)
        print(f"wrote {args.copy_page}  -> open in a browser, click the button, "
              f"then paste into the Webflow Designer")
    if args.clip:
        print("copied (text/plain only -- not Webflow-pasteable; use --copy-page)"
              if copy_to_clipboard(compact) else "clipboard copy failed")
    if not (args.out or args.copy_page or args.clip):
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
