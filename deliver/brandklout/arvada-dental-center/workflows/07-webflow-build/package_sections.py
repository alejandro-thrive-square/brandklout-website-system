#!/usr/bin/env python3
"""
package_sections.py — turn each chapter of a journey page into a self-contained
Webflow pasteable section.

The requirement (07-webflow-build.md, "Self-contained section packaging") is
that a pasted section renders and behaves correctly on ANY page with zero
page-settings changes, and that it does not touch anything else on that page.
The design pages satisfy neither: they hang off a shared journey.css, a shared
journey.js, a boot script and five vendored GSAP files, and their CSS is full
of unscoped global rules (`.wrap`, `.btn`, `.h2`, a `*` reset, `:root` tokens)
that would repaint a client's whole page the moment they were pasted into it.

So each section is packaged three ways at once:

  STRUCTURE stays real Webflow elements. Not one big HtmlEmbed. The client has
  to be able to open the Designer, see the headings and paragraphs and images,
  and edit the copy. That is the whole point of "Webflow editable".

  CSS is tree-shaken, namespaced and scoped, then carried in a <style> embed
  inside the section root. It cannot be a set of Webflow classes: this design
  is built on `clamp()`, `calc(var(--x))`, `svh`, `aspect-ratio`, container-
  relative media queries and keyframes, and Webflow's style panel cannot hold
  any of those — it reads a clamp() font-size as 0px. Converting would destroy
  the design to gain a style panel nobody could use.

  JS is the chapter's own setup plus WZSR (wz-section-runtime.js), which brings
  GSAP from a CDN once per page and hands the chapter the same `W` surface it
  was written against.

Namespacing is not cosmetic. Webflow merges classes BY NAME site-wide, so a
section pasted with a class called `wrap` or `btn` adopts whatever the client's
`wrap` and `btn` already are, and the embedded CSS would in turn restyle every
`.wrap` and `.btn` on their site. Every source class is therefore renamed to
`<prefix>-<class>`, in the markup and in the CSS together.

  python package_sections.py [--page SLUG ...] [--asset-base URL]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

import tinycss2
from bs4 import BeautifulSoup

HERE = Path(__file__).resolve().parent
DESIGN = HERE.parent / "04-design" / ".tmp"
OUT = HERE / ".tmp" / "sections"
def _strip_comments(js: str) -> str:
    """Drop /* */ blocks and collapse indentation.

    The runtime is carried by EVERY block, because each block has to keep
    working if it is moved to a page on its own — that is the point of
    self-contained packaging. Eleven copies of a heavily commented 18kb file
    is 200kb of a 385kb page, though, and the paste is safer smaller.

    Only block comments and leading whitespace go. Line comments are left
    alone on purpose: stripping `//` correctly means tracking string and regex
    literals, and getting it wrong on a `https://` inside a string would break
    the CDN URL silently. Newlines are preserved so automatic semicolon
    insertion behaves exactly as it does in the source.
    """
    out, i, n = [], 0, len(js)
    while i < n:
        if js.startswith("/*", i):
            end = js.find("*/", i + 2)
            if end == -1:
                break
            # Keep any newlines the comment spanned.
            out.append("\n" * js.count("\n", i, end))
            i = end + 2
            continue
        ch = js[i]
        if ch in "\"'`":
            j = i + 1
            while j < n:
                if js[j] == "\\":
                    j += 2
                    continue
                if js[j] == ch:
                    break
                j += 1
            out.append(js[i:j + 1])
            i = j + 1
            continue
        out.append(ch)
        i += 1
    text = "".join(out)
    lines = [ln.strip() for ln in text.split("\n")]
    return "\n".join(ln for ln in lines if ln)


RUNTIME_SRC = (HERE / "wz-section-runtime.js").read_text(encoding="utf-8")
RUNTIME = _strip_comments(RUNTIME_SRC)

PAGES = ["implants", "aox", "veneers", "emergency", "dentist-near-me", "next-door"]

# Per-page class prefix. Short, because it lands on every class name in the
# Designer's class list and the client has to live with it.
PREFIX = {
    "implants": "imp", "aox": "aox", "veneers": "vnr",
    "emergency": "emg", "dentist-near-me": "dnm", "next-door": "nxd",
}

# Classes that must NOT be renamed: Webflow's own, and the hooks GSAP's
# SplitText writes at runtime (it creates .wz-line/.wz-word itself, so a
# renamed selector would never match them).
KEEP = {"w-embed", "w-richtext", "w-dyn-list", "w-dyn-items", "w-dyn-item",
        "w-form", "w-button", "w-input", "w-checkbox", "w-radio",
        "wz-line", "wz-word", "wz-mask-line-mask"}

# Selector fragments that cannot be tested against a static subtree.
PSEUDO_STATE = re.compile(
    r"::?(?:hover|focus|focus-visible|focus-within|active|visited|target|"
    r"before|after|selection|placeholder|marker|backdrop|first-line|"
    r"first-letter|-webkit-[a-z-]+|-moz-[a-z-]+)(?:\([^)]*\))?")


# ---------------------------------------------------------------------------
# CSS helpers
# ---------------------------------------------------------------------------

def serialize(nodes) -> str:
    return tinycss2.serialize(nodes).strip()


def split_selectors(prelude) -> list[str]:
    """Split a rule prelude into individual selectors on top-level commas."""
    out, cur, depth = [], [], 0
    for tok in prelude:
        if tok.type in ("[] block", "() block", "{} block"):
            cur.append(tok)
            continue
        if tok.type == "literal" and tok.value == "," and depth == 0:
            out.append(tinycss2.serialize(cur).strip())
            cur = []
            continue
        cur.append(tok)
    if cur:
        s = tinycss2.serialize(cur).strip()
        if s:
            out.append(s)
    return out


def rename_classes_in_selector(sel: str, ren: dict[str, str]) -> str:
    """Rewrite `.foo` to `.pfx-foo` for every class in the rename map."""
    def sub(m):
        name = m.group(1)
        return "." + ren.get(name, name)
    return re.sub(r"\.(-?[_A-Za-z][_A-Za-z0-9-]*)", sub, sel)


def matchable(sel: str) -> str:
    """Reduce a selector to the part that can be tested against the STATIC
    document, so tree-shaking can ask "could this rule ever apply here?".

    Pseudo-classes and pseudo-elements go, and so does every piece of the
    selector that only exists once JavaScript has run: `[data-rail="on"]` is
    set by WZSR.rail, `.is-open` by the FAQ, `.solid` by the nav, `.is-on` by
    the action bar, `[data-active]` by the quiz. None of them are in the
    markup, so a strict static match answered "no" and tree-shaking deleted
    the rules — the horizontal rails lost their scroll padding and max-width
    on all six pages, and nothing failed, because the CSS for a state that has
    not happened yet looks exactly like CSS nobody needs.

    Stripping biases toward KEEPING: a rule kept that never matches costs a
    few bytes, a rule dropped that should match is a visual defect.
    """
    s = PSEUDO_STATE.sub("", sel)
    s = re.sub(r":(?:not|is|where)\(([^)]*)\)", r"", s)
    s = re.sub(r":[a-z-]+(?:\([^)]*\))?", "", s)
    # Runtime-set attributes and state classes.
    s = re.sub(r"\[data-(?:rail|active|open|wzsr|wz-chrome|quiz-[\w-]+)"
               r"(?:[~|^$*]?=\s*['\"]?[^\]'\"]*['\"]?)?\]", "", s)
    s = re.sub(r"\.(?:is|has)-[\w-]+", "", s)
    s = re.sub(r"\.(?:solid|in)(?![\w-])", "", s)
    # A compound reduced to nothing would match everything; make it the
    # universal selector explicitly rather than emitting a stray combinator.
    s = re.sub(r"(^|[\s>+~])(?=[\s>+~]|$)", r"\1*", s)
    return s.strip()


def selector_hits(sel: str, section, soup_root) -> bool:
    """Does this selector reach anything inside the section?

    A selector is kept if its own subject matches an element in the section.
    `html`, `body`, `:root` and the page chrome are handled by the caller.
    """
    probe = matchable(sel)
    if not probe:
        return False
    # A descendant selector rooted outside the section (`main .ch .pin`) still
    # applies to the section's contents; test only the right-most compound.
    tail = re.split(r"\s*[>+~]\s*|\s+", probe)[-1].strip()
    for candidate in (probe, tail):
        if not candidate:
            continue
        try:
            if section.select_one(candidate) is not None:
                return True
            # The section element itself can be the subject — and it has to be
            # looked for across ALL matches, not just the first.
            #
            # This was `soup_root.select_one(candidate) is section`, which only
            # ever returned true for whichever element came first in the
            # document. `[data-theme="light"]` therefore survived for exactly
            # one section per page and was tree-shaken out of every other one,
            # so four light chapters per page pasted in the dark palette —
            # #3B4657 body copy rendering as rgba(255,255,255,.76). It was the
            # single largest source of style drift in the packaged pages.
            if any(section is el for el in soup_root.select(candidate)):
                return True
        except Exception:
            # soupsieve cannot parse it — keep the rule rather than lose it.
            return True
    return False


# Properties that a rule on html/body/:root may hand to a section root.
# Everything else on those selectors describes the PAGE, not the section: the
# body's background painted onto every block root turned the nav from
# transparent into a solid slab, because the nav is a block root too.
ROOT_INHERITABLE = {
    "color", "font", "font-family", "font-size", "font-weight", "font-style",
    "font-variant-numeric", "font-feature-settings", "line-height",
    "letter-spacing", "word-spacing", "text-align", "text-transform",
    "text-rendering", "-webkit-font-smoothing", "-moz-osx-font-smoothing",
    "-webkit-text-size-adjust", "tab-size", "hyphens", "quotes", "cursor",
    "visibility", "font-synthesis", "font-optical-sizing",
}


def tokenize_selector(sel: str) -> list[str]:
    """Split a complex selector into alternating compounds and combinators:
    `.a > .b .c` -> ['.a', '>', '.b', ' ', '.c']. Bracket-aware, so
    `[data-x="a b"]` and `:not(.x > .y)` stay intact."""
    parts, cur, depth, i, n = [], [], 0, 0, len(sel)
    while i < n:
        c = sel[i]
        if c in "([":
            depth += 1
        elif c in ")]":
            depth -= 1
        if depth == 0 and c in ">+~":
            if "".join(cur).strip():
                parts.append("".join(cur).strip())
            parts.append(c); cur = []; i += 1
            while i < n and sel[i].isspace():
                i += 1
            continue
        if depth == 0 and c.isspace():
            j = i
            while j < n and sel[j].isspace():
                j += 1
            if j < n and sel[j] in ">+~":
                i = j
                continue
            if "".join(cur).strip():
                parts.append("".join(cur).strip()); parts.append(" "); cur = []
            i = j
            continue
        cur.append(c); i += 1
    if "".join(cur).strip():
        parts.append("".join(cur).strip())
    return parts


def scope_selector(sel: str, root_class: str, root_matches: bool) -> list[str]:
    """Scope a selector to the section, returning the forms that can match.

    The first version always produced `.root <sel>` — a DESCENDANT selector.
    That silently discarded every rule whose subject is the section element
    itself: `.ch-arrival{display:flex;align-items:center;padding-top:...}`
    became `.imp-arrival .imp-ch-arrival`, which matches nothing, because
    `.imp-ch-arrival` IS `.imp-arrival`. The hero stopped being a flex column,
    lost its padding, and `.ch{color:var(--fg-body)}` stopped applying — which
    is where 175 `color` and 173 `borderTopColor` differences per page came
    from, border-color defaulting to currentColor.

    `root_matches` says whether the section element itself is a subject of this
    selector; the caller tests that with a real CSS matcher rather than
    guessing from the text.
    """
    s = sel.strip()
    root = "." + root_class

    s = re.sub(r"^(?:html|body)\s+", "", s)
    s = re.sub(r"^:root\s+", "", s)
    # `main .ch .pin` — the ancestor is the page, which the section is not.
    s = re.sub(r"^main\s+", "", s)
    s = s.strip()
    if not s:
        return [root]

    out = []
    if root_matches:
        # Attach rather than nest. The root carries the section class AND every
        # class it had in the design, so appending the section class to the
        # subject compound is exact.
        subject = re.split(r"\s*[>+~]\s*|\s+", s)[-1]
        out.append(f"{subject}{root}" if not subject.startswith(root) else subject)
    # Descendants can also match `.ch p` etc. — emit both when both apply.
    out.append(f"{root} {s}" if not s.startswith(root) else s)
    return out


def _split_decls(body: str) -> list[tuple[str, str]]:
    """Split a declaration block into (prop, value), respecting nesting so a
    `clamp(1rem, 2vw, 3rem)` or a multi-stop gradient is not cut at its
    commas or its colons."""
    out, depth, cur = [], 0, []
    for ch in body:
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        if ch == ";" and depth == 0:
            out.append("".join(cur)); cur = []
            continue
        cur.append(ch)
    out.append("".join(cur))
    pairs = []
    for chunk in out:
        if ":" not in chunk:
            continue
        # Split on the FIRST colon outside brackets.
        d, idx = 0, -1
        for i, ch in enumerate(chunk):
            if ch in "([{":
                d += 1
            elif ch in ")]}":
                d -= 1
            elif ch == ":" and d == 0:
                idx = i
                break
        if idx < 0:
            continue
        k, v = chunk[:idx].strip(), chunk[idx + 1:].strip()
        if k and v:
            pairs.append((k, v))
    return pairs


def rewrite_declarations(decls: str, ren: dict[str, str], kf: dict[str, str]) -> str:
    """Namespace keyframes names referenced from animation shorthand."""
    for old, new in kf.items():
        decls = re.sub(r"(?<![-\w])" + re.escape(old) + r"(?![-\w])", new, decls)
    return decls


# ---------------------------------------------------------------------------
# Collection
# ---------------------------------------------------------------------------

REM = re.compile(r"(?<![\w.-])(\d*\.?\d+)rem\b")


def rem_to_root_var(css: str) -> str:
    """Rewrite every `Nrem` to `calc(N * var(--wz-root))`.

    A `rem` resolves against the DOCUMENT root's font-size and nothing else, so
    the house fluid-root rule — `html{font-size:calc(...)}`, which this design
    is built on top of from `--d1` down to `--label` — cannot be scoped by
    moving the declaration onto the section. Left alone, every rem length in a
    pasted section silently reverted to the host page's root: measured against
    the design at 1440, headline max-widths came out 10% wide and body copy 8%
    small, consistently, everywhere.

    The fluid expression is captured once as `--wz-root` on the scope root and
    every rem becomes a multiple of it. `var()` resolves at the element and
    custom properties inherit, so the whole subtree gets the design's root
    size without a single declaration escaping the section.

    `--wz-root`'s own definition is exempt: its `1rem` is the browser default
    the design's calc() was written against, substituted as 16px by the caller.
    """
    def sub(m):
        n = m.group(1)
        return f"calc({n} * var(--wz-root, 16px))"
    out = []
    for line in css.split("\n"):
        out.append(line if "--wz-root:" in line else REM.sub(sub, line))
    return "\n".join(out)


STATE_FRAGMENT = re.compile(
    r"(\[data-(?:rail|active|open|wzsr|wz-chrome|quiz-[\w-]+)"
    r"(?:[~|^$*]?=\s*['\"]?[^\]'\"]*['\"]?)?\]"
    r"|\.(?:is|has)-[\w-]+"
    r"|\.(?:solid|in)(?![\w-]))")


def state_parts(compound: str) -> str:
    """The runtime-state fragments `matchable` removes from a compound.

    `matchable` strips them so tree-shaking can ask whether a rule could ever
    apply. That answer must not leak into the structural decision: `.nav.solid`
    matches the nav root only WHEN it is solid, and dropping the whole compound
    as "an ancestor that is the root" discarded the condition — the nav's
    chapter readout, which is meant to fade in once you scroll, was emitted
    permanently visible on all six pages. Whatever was stripped comes back,
    attached to :scope.
    """
    return "".join(m.group(0) for m in STATE_FRAGMENT.finditer(compound))


def _is_root(compound: str, sec, soup) -> bool:
    """Does the section element itself match this single compound?"""
    probe = matchable(compound)
    if not probe:
        return False
    try:
        return any(sec is el for el in soup.select(probe))
    except Exception:
        return False


def scope_complex(sel: str, ren: dict[str, str], root_token: str, sec, soup) -> list[str]:
    """Rewrite one design selector into the form(s) that match inside the
    packaged section.

    Two things have to be got right, and the first two attempts each got one:

      * a rule whose SUBJECT is the section element (`.ch-arrival{...}`) has to
        attach to the root, not nest under it;
      * a rule whose ANCESTOR is the section element (`.ch-arrival .in{...}`)
        has to have that ancestor REMOVED, because prefixing gives
        `.imp-arrival .imp-ch-arrival .imp-in` and asks the root to be its own
        descendant. That one silently un-gridded every hero.

    So the selector is walked compound by compound: page-level ancestors go,
    ancestors that are the root itself go (keeping their combinator), and what
    is left is anchored to the root — attached if it IS the root, nested if it
    is a descendant.

    Inside `@scope`, `root_token` is `:scope`. @scope alone is not enough: a
    bare selector inside it is a RELATIVE selector, implicitly `:scope .x`, so
    it can no more match the scoping root than a prefixed selector could. What
    @scope does buy is confinement without touching specificity, and a token
    (`:scope`, one class's worth) that is far closer to the original weight
    than repeating a section class would be.
    """
    root = root_token
    toks = tokenize_selector(sel.strip())
    if not toks:
        return [root]

    def ren_compound(c: str) -> str:
        return rename_classes_in_selector(c, ren)

    # `html`, `body`, `main`, `:root` as ancestors: the section is not the page.
    #
    # Dropping `main` drops a TYPE selector, and journey.css spends that type
    # selector deliberately: `main .ch .stage` (0,2,1) exists to outrank each
    # chapter's own `.ch-x .stage` (0,2,0) without !important, and the comment
    # in that file says so. Scoped naively both become `:scope .imp-stage` —
    # identical, so source order decided instead and every pinned chapter lost
    # its reserved nav clearance (129.6px of padding-top became 80px).
    #
    # So the type selector is not dropped, it is MOVED: qualifying the scope
    # root with its own tag name restores exactly the weight that was removed.
    dropped_type = 0
    while len(toks) >= 3 and (
            re.sub(r"[:.\[].*$", "", toks[0]) in ("html", "body", "main")
            or toks[0].startswith(":root")):
        if re.sub(r"[:.\[].*$", "", toks[0]) in ("html", "body", "main"):
            dropped_type += 1
        toks = toks[2:]
    if dropped_type:
        root = (sec.name or "div") + root

    # Ancestors that ARE the section root. Any runtime-state fragment on such
    # a compound is a CONDITION, not structure, so it moves onto :scope rather
    # than being dropped with the rest of the compound.
    lead = " "
    while len(toks) >= 3 and _is_root(toks[0], sec, soup):
        root += state_parts(toks[0])
        lead = toks[1]
        toks = toks[2:]

    if not toks:
        return [root]

    subject = toks[-1]
    out = []
    if len(toks) == 1 and _is_root(subject, sec, soup):
        out.append(root + ren_compound(subject))
        # A compound that matches the root may also match descendants
        # (`.ch` on a nested element), so keep the nested form when it does.
        try:
            if sec.select_one(matchable(subject)) is not None:
                out.append(f"{root} {ren_compound(subject)}")
        except Exception:
            pass
        return out

    body = "".join(
        ren_compound(t) if i % 2 == 0 else (" " if t == " " else f" {t} ")
        for i, t in enumerate(toks))
    joiner = " " if lead == " " else f" {lead} "
    return [f"{root}{joiner}{body}"]


def collect_rules(css_text: str):
    """Flatten a stylesheet into (at_rule_prelude | None, selector, body) plus
    the keyframes blocks, preserving source order."""
    sheet = tinycss2.parse_stylesheet(css_text, skip_whitespace=True, skip_comments=True)
    flat, keyframes = [], {}

    def walk(nodes, media):
        for node in nodes:
            if node.type == "qualified-rule":
                body = serialize(node.content)
                for sel in split_selectors(node.prelude):
                    flat.append((media, sel, body))
            elif node.type == "at-rule":
                name = (node.lower_at_keyword or "")
                prelude = serialize(node.prelude)
                if name == "keyframes":
                    keyframes[prelude.strip()] = serialize(node.content)
                elif name in ("media", "supports", "layer") and node.content is not None:
                    inner = tinycss2.parse_rule_list(
                        node.content, skip_whitespace=True, skip_comments=True)
                    combined = f"@{name} {prelude}" if not media else f"{media}||@{name} {prelude}"
                    walk(inner, combined)
                elif name in ("font-face", "import", "charset"):
                    pass  # site-wide concerns, not the section's to carry
        return

    walk(sheet, None)
    return flat, keyframes


def build(page: str, asset_base: str, report: list):
    src = DESIGN / page / "index.html"
    soup = BeautifulSoup(src.read_text(encoding="utf-8"), "html.parser")
    shared_css = (DESIGN / "_shared" / "journey.css").read_text(encoding="utf-8")
    pfx = PREFIX[page]

    shared_rules, shared_kf = collect_rules(shared_css)
    page_head_css = "\n".join(
        t.get_text() for t in soup.head.find_all("style")) if soup.head else ""
    head_rules, head_kf = collect_rules(page_head_css)

    outdir = OUT / page
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = []

    # Every block that has to survive the paste, in document order.
    #
    # ScrollSmoother is gone (a pasted page cannot own a #smooth-wrapper >
    # #smooth-content pair around the whole document), so those two wrappers
    # carry nothing and are dropped — main, the footer, the nav and the action
    # bar become siblings under the single --wrap root instead.
    #
    # The nav and the action bar are packaged like sections even though they
    # are chrome: they have their own CSS and their own behaviour, and the
    # requirement is that the paste needs no page-settings custom code.
    blocks = []
    nav = soup.select_one("header#nav")
    if nav:
        blocks.append(("nav", nav))
    for sec in soup.select("main#main > section.ch"):
        blocks.append((sec.get("id") or "section", sec))
    ftr = soup.select_one("footer.ftr")
    if ftr:
        blocks.append(("footer", ftr))
    ab = soup.select_one("div.actionbar, .actionbar")
    if ab:
        blocks.append(("actionbar", ab))

    for sec_key, sec in blocks:
        sec_id = sec_key
        root_class = f"{pfx}-{sec_id}"

        # -- the section's own <style> and <script> ------------------------
        own_style = sec.find("style")
        own_css = own_style.get_text() if own_style else ""
        if own_style:
            own_style.decompose()
        own_script = sec.find("script")
        own_js = own_script.get_text() if own_script else ""
        if own_script:
            own_script.decompose()
        own_rules, own_kf = collect_rules(own_css)

        # -- rename map from every class actually present ------------------
        classes = set()
        for el in [sec] + sec.find_all(True):
            for c in (el.get("class") or []):
                classes.add(c)
        ren = {c: f"{pfx}-{c}" for c in sorted(classes) if c not in KEEP}

        # The root class is the section's identity: the CSS is scoped to it and
        # the runtime finds every instance by it. It must therefore be unique
        # in the subtree. `<section id="compare">` containing `<table
        # class="compare">` produced two elements called `aox-compare`, so the
        # CSS scope matched the table as well as the section and the runtime
        # armed four "sections" for two pastes.
        if root_class in ren.values():
            root_class = f"{pfx}-sec-{sec_id}"

        # -- which shared rules can reach into this section? ---------------
        kept = []
        for media, sel, body in shared_rules + head_rules + own_rules:
            probe = sel.strip()
            # Token and root-level rules are always carried: the section's
            # every length and colour is a var() reference into them.
            if probe in (":root", "html", "body") or probe.startswith(":root"):
                kept.append((media, sel, body))
                continue
            if probe.startswith("*") or probe.startswith("::selection"):
                kept.append((media, sel, body))
                continue
            if selector_hits(sel, sec, soup):
                kept.append((media, sel, body))

        # -- keyframes: only those an emitted declaration references --------
        all_kf = {**shared_kf, **head_kf, **own_kf}
        body_blob = "\n".join(b for _, _, b in kept)
        kf_ren, kf_out = {}, []
        for name, frames in all_kf.items():
            if re.search(r"(?<![-\w])" + re.escape(name) + r"(?![-\w])", body_blob):
                new = f"{pfx}-{name}"
                kf_ren[name] = new
                kf_out.append((new, frames))

        # -- emit the scoped stylesheet ------------------------------------
        buckets: dict = {}
        root_decls: list[tuple[str, str]] = []
        for media, sel, body in kept:
            probe = sel.strip()
            body2 = rewrite_declarations(body, ren, kf_ren)

            # html / body / :root describe the PAGE. Only what a section can
            # legitimately inherit from them travels — custom properties above
            # all, since every length and colour in the section is a var()
            # reference. Box properties stay behind: `body{background:...}`
            # applied to each block root is what turned the nav into a slab.
            if probe in (":root", "html", "body", "html body") or probe.startswith(":root"):
                decls = [d for d in _split_decls(body2)
                         if d[0].startswith("--") or d[0] in ROOT_INHERITABLE]
                # `html{font-size:calc(...)}` is the house fluid root, and a
                # `rem` NEVER resolves against anything but the document root —
                # so it cannot be scoped by moving the declaration. It is
                # captured as --wz-root instead, and every rem in the section
                # is rewritten to a multiple of it. See rem_to_root_var.
                for k, v in _split_decls(body2):
                    if k == "font-size" and probe in ("html", ":root"):
                        root_decls.append(("--wz-root", v.replace("1rem", "16px")))
                        # Keep a real font-size on the scope root too, so `em`
                        # and unitless line-heights resolve as they did — but
                        # as the captured value, not a second copy of the calc.
                        decls = [d for d in decls if d[0] != "font-size"]
                        decls.append(("font-size", "var(--wz-root)"))
                if decls:
                    buckets.setdefault(media, []).append((":scope", ";".join(f"{k}:{v}" for k, v in decls)))
                continue

            if not body2.strip():
                continue
            # @scope does the confining; scope_complex does the anchoring.
            # Neither alone is sufficient — see scope_complex's docstring.
            for sel2 in scope_complex(sel, ren, ":scope", sec, soup):
                buckets.setdefault(media, []).append((sel2, body2))

        inner = []
        for new, frames in kf_out:
            inner.append("@keyframes %s{%s}" % (new, frames))
        if root_decls:
            inner.append(":scope{%s}" % ";".join(f"{k}:{v}" for k, v in root_decls))
        for media in [None] + [m for m in buckets if m]:
            if media not in buckets:
                continue
            rules = "".join(f"{s}{{{b}}}" for s, b in buckets[media])
            if media is None:
                inner.append(rules)
            else:
                opens = media.split("||")
                inner.append("".join(o + "{" for o in opens) + rules + "}" * len(opens))

        # Fonts. The house directive calls these a site-wide concern, and in
        # Webflow they belong in the Fonts panel — but a section that assumes
        # they are there is not self-contained, and every `ch` length in this
        # design (`max-width:15ch` on the display type, over a hundred of them)
        # silently changes when Cinzel falls back to Georgia. @import is
        # deduplicated by URL, so N sections cost one fetch. Setting the fonts
        # natively in Webflow makes this line redundant, not wrong.
        font_import = ""
        for link in (soup.head.find_all("link", href=True) if soup.head else []):
            href = link["href"]
            # `family=` distinguishes the stylesheet from the two <link
            # rel="preconnect"> tags that precede it and point at the bare
            # host — importing which fetches nothing and loads no font.
            if "fonts.googleapis.com" in href and "family=" in href:
                font_import = f'@import url("{href}");\n'
                break

        css = (
            font_import +
            f"/* {page} · {sec_id}\n"
            f"   Confined to .{root_class} by @scope, so no rule here can reach the\n"
            f"   rest of the page it is pasted into — and, unlike prefixing every\n"
            f"   selector, without altering any of their specificities. This CSS\n"
            f"   is a layered cascade (`main .ch .stage` exists to outrank each\n"
            f"   chapter's own `.ch-x .stage`); flattening it silently changed\n"
            f"   which rule won.\n"
            f"   Class names are namespaced {pfx}- because Webflow merges classes\n"
            f"   by NAME site-wide: an element pasted as `btn` adopts the client's\n"
            f"   `btn`. */\n"
            "@scope (.%s) {\n%s\n}\n" % (root_class, rem_to_root_var("\n".join(inner))))

        # -- rename classes in the markup ----------------------------------
        for el in [sec] + sec.find_all(True):
            cl = el.get("class")
            if cl:
                el["class"] = [ren.get(c, c) for c in cl]
        sec_classes = list(sec.get("class") or [])
        if root_class not in sec_classes:
            sec["class"] = [root_class] + sec_classes

        # -- ids must not collide with the host page ------------------------
        idmap = {}
        for el in [sec] + sec.find_all(True):
            i = el.get("id")
            if i:
                idmap[i] = f"{pfx}-{i}"
        for el in [sec] + sec.find_all(True):
            i = el.get("id")
            if i:
                el["id"] = idmap[i]
            for attr in ("aria-controls", "aria-labelledby", "aria-describedby", "for"):
                v = el.get(attr)
                if v and v in idmap:
                    el[attr] = idmap[v]
            href = el.get("href")
            if href and href.startswith("#") and href[1:] in idmap:
                el["href"] = "#" + idmap[href[1:]]

        # -- images resolve from wherever the assets end up -----------------
        assets = []
        for img in sec.find_all("img"):
            s = img.get("src") or ""
            if s.startswith("../_shared/assets/"):
                name = s.split("/")[-1]
                assets.append(name)
                img["src"] = asset_base.rstrip("/") + "/" + name if asset_base else name
            img["loading"] = img.get("loading") or "lazy"

        # -- rewrite the chapter script into a WZSR section registration ----
        js_body = own_js.strip()
        m = re.search(r"WZ\.add\(\s*function\s*\(\s*(\w+)\s*\)\s*\{(.*)\}\s*\)\s*;?\s*$",
                      js_body, re.S)
        setup = ""
        if m:
            argname, inner = m.group(1), m.group(2)
            # Root every lookup at the section instead of the document, so two
            # copies on one page animate themselves rather than each other.
            inner = re.sub(r"\bdocument\.getElementById\((['\"])([^'\"]+)\1\)",
                           lambda mm: f"__q('#{idmap.get(mm.group(2), mm.group(2))}')",
                           inner)
            inner = re.sub(r"\bdocument\.querySelectorAll\(", "__qa(", inner)
            inner = re.sub(r"\bdocument\.querySelector\(", "__q(", inner)
            inner = re.sub(r"gsap\.utils\.toArray\((['\"])([^'\"]+)\1\)",
                           lambda mm: "gsap.utils.toArray(__qa('%s'))"
                                      % rewrite_sel(mm.group(2), ren, idmap),
                           inner)
            # Any remaining literal selector strings need the same renaming.
            inner = re.sub(r"(['\"])(#[A-Za-z][\w-]*(?:\s[^'\"]*)?|\.[a-z][\w-]*(?:[^'\"]*)?)\1",
                           lambda mm: mm.group(1) + rewrite_sel(mm.group(2), ren, idmap) + mm.group(1),
                           inner)

            # GSAP resolves a selector STRING against the document, not against
            # anything scoped. `tl.from('#arrLead', ...)` therefore reaches
            # every copy of the section on the page, so two instances drove
            # each other's elements and their tweens fought: the arrival hero's
            # lede, buttons and form card all settled at ~0.04 opacity instead
            # of 1. Root every selector-string target at the section.
            inner = re.sub(
                r"\.(fromTo|from|to|set)\(\s*(['\"])([#.][^'\"]*)\2",
                lambda mm: f".{mm.group(1)}(__qa({mm.group(2)}{mm.group(3)}{mm.group(2)})",
                inner)
            # Class names in HTML the chapter BUILDS at runtime.
            #
            # Renaming only covered strings that look like selectors ('.x',
            # '#y'). next-door's year timeline writes its own markup —
            # `notes.innerHTML = '<p class="yr-note">' + ... ` — so those
            # paragraphs arrived carrying the un-namespaced class, matched none
            # of the section's scoped CSS, and rendered as unstyled body text.
            # The fidelity diff is the only gate that saw it: nothing errors,
            # nothing leaks, and the text is present and readable, just wrong.
            inner = re.sub(
                r'class=(\\?["\'])([^"\'<>]*)\1',
                lambda mm: "class=" + mm.group(1) + " ".join(
                    ren.get(c, c) for c in mm.group(2).split()) + mm.group(1),
                inner)

            # Same for a ScrollTrigger `trigger:` given as a string.
            inner = re.sub(
                r"(trigger:\s*)(['\"])([#.][^'\"]*)\2",
                lambda mm: f"{mm.group(1)}__q({mm.group(2)}{mm.group(3)}{mm.group(2)})",
                inner)

            setup = inner.strip()

        # __q / __qa instead of __r.querySelector directly: the chapter scripts
        # look up ids that, after namespacing, can land on the SECTION ROOT
        # itself (`#arrival` inside `section#arrival`). querySelector only
        # searches descendants, so those returned null and the whole chapter
        # threw on the next line. The root has to be part of its own scope.
        # The nav and the action bar have no chapter script of their own — in
        # the design their behaviour lived in journey-boot.js, which a pasted
        # page never gets. Wire them here, and wire them OUTSIDE the GSAP-gated
        # setup: a nav that only turns solid once a CDN has answered, and a
        # sticky call bar that never appears if it does not, are not acceptable
        # on a paid landing page.
        chrome = ""
        if sec_id in ("nav", "actionbar"):
            if sec_id == "nav":
                opts = ("{ nav: true, progress: '#%s', chapterName: '#%s', chapterBar: '#%s' }"
                        % (idmap.get("navProgress", "navProgress"),
                           idmap.get("navChName", "navChName"),
                           idmap.get("navChBar", "navChBar")))
            else:
                opts = "{ actionbar: true }"
            chrome = (
                "\n(function () {\n"
                "  var go = function () {\n"
                "    document.querySelectorAll('.%s').forEach(function (r) {\n"
                "      if (r.getAttribute('data-wz-chrome') === 'on') return;\n"
                "      r.setAttribute('data-wz-chrome', 'on');\n"
                "      WZSR.chrome(r, %s);\n"
                "    });\n"
                "  };\n"
                "  if (document.readyState === 'loading') "
                "document.addEventListener('DOMContentLoaded', go, { once: true });\n"
                "  else go();\n"
                "})();\n" % (root_class, opts))

        js = (RUNTIME + chrome
              + "\nWZSR.section('.%s', function (%s, __r) {\n"
                "  var __q = function (s) { return (__r.matches && __r.matches(s)) ? __r : __r.querySelector(s); };\n"
                "  var __qa = function (s) {\n"
                "    var out = Array.prototype.slice.call(__r.querySelectorAll(s));\n"
                "    if (__r.matches && __r.matches(s)) out.unshift(__r);\n"
                "    return out;\n"
                "  };\n%s\n});\n"
              % (root_class, m.group(1) if m else "W", setup))

        # -- assemble ------------------------------------------------------
        # `data-embed` is the converter's marker for "this rides the payload as
        # an in-place HtmlEmbed" (html_to_webflow.py, add_html_embed). Without
        # it the <style> would be folded into the cascade and turned into
        # Webflow classes, which is the one thing this build must not do — the
        # design is clamp()/calc(var())/svh/aspect-ratio throughout and
        # Webflow's style panel cannot hold any of it.
        st = soup.new_tag("style")
        st["data-embed"] = "section-css"
        st.string = css
        sec.insert(0, st)

        if (setup or chrome or "faq__q" in str(sec) or "data-rv" in str(sec)
                or "data-quiz" in str(sec) or "data-lead" in str(sec)
                or "data-status" in str(sec) or "data-year" in str(sec)):
            sc = soup.new_tag("script")
            sc["data-embed"] = "section-js"
            sc.string = js
            sec.append(sc)

        html = sec.prettify()
        (outdir / f"{sec_id}.html").write_text(html, encoding="utf-8")

        manifest.append({
            "page": page, "section": sec_id, "rootClass": root_class,
            "classes": len(ren), "cssBytes": len(css), "jsBytes": len(js),
            "assets": sorted(set(assets)), "hasScript": bool(setup),
        })
        report.append(manifest[-1])

    # ---- the deliverable: ONE whole-page document -------------------------
    #
    # Per-section files are kept above for inspection and for the hostile-host
    # gate, but they are NOT what gets pasted. A page ships as a single paste
    # with a single root: a multi-root payload is what crashes the Designer
    # (size is not the problem), and 45 separate pastes would be 45 chances to
    # drop one, in the wrong order, into the wrong page.
    #
    # Each block still carries its own scoped <style>/<script> inside itself,
    # so the sections remain independently movable after the paste and the
    # page still needs no page-settings custom code.
    body_html = "\n\n".join(str(b) for _, b in blocks)
    page_doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page} — Arvada Dental Center</title>
<!--
  Whole-page pasteable payload source. Assembled by package_sections.py from
  workflows/04-design/.tmp/{page}/index.html.

  Differences from the design page, all deliberate:
    * every class is namespaced `{pfx}-`, because Webflow merges classes by
      NAME site-wide and an un-prefixed `wrap` or `btn` would both adopt and
      overwrite the client's own;
    * each block carries its CSS and JS inside itself as data-embed nodes,
      scoped to that block's root, so the paste needs no page settings;
    * #smooth-wrapper / #smooth-content are gone with ScrollSmoother — a
      pasted page cannot own a scroll proxy around the whole document;
    * the shared journey.css / journey.js / journey-boot.js / vendored GSAP
      are gone; WZSR pulls GSAP from a CDN once per page.
-->
</head>
<body>
{body_html}
</body>
</html>
"""
    (outdir / "page.html").write_text(page_doc, encoding="utf-8")

    (outdir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"{page:<17} {len(manifest)} blocks -> page.html "
          f"({len(page_doc)//1024}kb)")
    return manifest


def rewrite_sel(sel: str, ren: dict[str, str], idmap: dict[str, str]) -> str:
    s = rename_classes_in_selector(sel, ren)
    def subid(m):
        name = m.group(1)
        return "#" + idmap.get(name, name)
    return re.sub(r"#(-?[_A-Za-z][_A-Za-z0-9-]*)", subid, s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--page", action="append", choices=PAGES)
    ap.add_argument("--asset-base", default="",
                    help="URL prefix for images once uploaded to Webflow; the "
                         "MCP asset-mapping pass rewrites these to real asset ids")
    a = ap.parse_args()
    pages = a.page or PAGES
    OUT.mkdir(parents=True, exist_ok=True)
    report = []
    for p in pages:
        build(p, a.asset_base, report)
    (OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\n{len(report)} sections  ->  {OUT}")
    big = [r for r in report if r["cssBytes"] > 40000 or r["jsBytes"] > 40000]
    for r in big:
        print(f"  ! {r['page']}/{r['section']} css={r['cssBytes']} js={r['jsBytes']} (embed limit ~50k)")


if __name__ == "__main__":
    main()
