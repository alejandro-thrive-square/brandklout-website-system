#!/usr/bin/env python3
"""
payload_to_whtml.py — serialize an XscpData clipboard payload back to HTML + flat
CSS that `data_whtml_builder` (Webflow Data API, headless) will accept.

Source Asana task GID: 1217040406855582

WHY THIS EXISTS
---------------
The clipboard payload is the only artifact that carries the cascade resolver's
work: descendant/compound CSS flattened into per-class definitions, `var()`
tokens resolved, `::before`/`::after` materialised as real nodes. WHTML refuses
descendant selectors outright ("StyleParser drops descendant selectors"), so the
source stylesheet cannot be handed to it directly — but the payload's flat class
definitions can.

So: build the payload as usual, then serialise it back to (a) HTML carrying the
payload's post-conversion class STACKS and (b) flat CSS keyed by those same
names. WHTML then creates real, Designer-editable Webflow styles.

WHAT THE WEBFLOW SIDE WILL AND WILL NOT TAKE (measured 2026-08-07, MCP 2.0.1)
----------------------------------------------------------------------------
* `css` must be flat single-class selectors. `.a .b` and `.a > .b` are refused.
* No `<` or `>` ANYWHERE in the css string — that also kills the child
  combinator and any `content: ">"`.
* Only the four canonical breakpoints as max-width media queries
  (991 / 767 / 479). `xl`/`xxl`/`large` are min-width and cannot be expressed —
  they are written to `late-variants.json` for a `data_style_tool update_style`
  pass instead.
* Combo classes work: `.card.card--alt` becomes a real Webflow combo.
* `:hover` / `:active` / `:focus` pseudos survive.
* A space between a `%` value and a following bare `0` is EATEN:
  `inset(0 0 100% 0)` is stored as `inset(0 0 100%0)`, which is invalid CSS and
  therefore dropped by the browser. Giving every term a unit
  (`inset(0% 0% 100% 0%)`) round-trips correctly, so `pct_space_fix()` rewrites
  bare zeros that follow a percentage inside a function.
* HtmlEmbeds cannot ride WHTML. Most of this payload's embeds only exist because
  the CLIPBOARD format has no node type for `<svg>`/`<sup>` — WHTML maps both to
  native DOM elements, so they are inlined here and only the genuinely opaque
  ones (the lead form, the map iframe) stay embeds, emitted as
  `<div data-embed-slot="N">` placeholders for the caller to swap.

OUTPUT (all under --out)
------------------------
  styles.css          flat CSS for the `css` parameter
  late-variants.json  xl/xxl/large overrides for a data_style_tool pass
  chunks.json         ordered insert plan: {key, parent, html} per WHTML action
  embeds.json         the real HtmlEmbeds, keyed by placeholder slot
  report.json         counts, for the build log
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import OrderedDict

# ---------------------------------------------------------------------------
# Webflow breakpoints. `main` is the base rule; the three max-width queries are
# the only media queries WHTML accepts. Anything in LATE is a min-width
# breakpoint and has to be applied through data_style_tool afterwards.
# ---------------------------------------------------------------------------
MEDIA = {
    "main": None,
    "medium": "@media screen and (max-width: 991px)",
    "small": "@media screen and (max-width: 767px)",
    "tiny": "@media screen and (max-width: 479px)",
}
LATE = ("large", "xl", "xxl")

PSEUDO = {
    "hover": ":hover",
    "active": ":active",
    "focus": ":focus",
    "focus-visible": ":focus-visible",
    "focus-within": ":focus-within",
    "visited": ":visited",
    "placeholder": "::placeholder",
    "empty": ":empty",
    "first-child": ":first-child",
    "last-child": ":last-child",
    "before": "::before",
    "after": "::after",
}

VOID = {"img", "input", "br", "hr", "source", "track", "wbr", "meta", "link"}

# Tag to fall back on when a payload node carries a type but no explicit tag.
TYPE_TAG = {
    "Paragraph": "p",
    "Heading": "h2",
    "Link": "a",
    "List": "ul",
    "ListItem": "li",
    "Blockquote": "blockquote",
    "Image": "img",
    "Block": "div",
    "Section": "section",
}

# Rules the converter prepends to every embed that are either already covered by
# the flat classes or are resets we do not want leaking into synthetic classes.
EMBED_CSS_IGNORE = {"*", "*::before", "*::after", "p", "button", "input", "a", "h1",
                    "h2", "h3", "h4", "figure", "blockquote", "ul", "li"}


# ---------------------------------------------------------------------------
# small helpers
# ---------------------------------------------------------------------------
def esc_text(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def esc_attr(s: str) -> str:
    return esc_text(s).replace('"', "&quot;")


_PCT_ZERO = re.compile(r"(?<=%)\s+(?=[0-9.]+(?:[,)\s]|$))")


def pct_space_fix(decls: str) -> str:
    """Give bare terms that follow a `%` an explicit unit.

    Webflow's style parser drops the space after a percentage, so
    `inset(0 0 100% 0)` is stored as `inset(0 0 100%0)` and the whole
    declaration dies. Only values INSIDE a function are affected (a top-level
    `background-position: 0% 100%` survives), but unitising unconditionally is
    harmless and much easier to reason about.
    """
    def fix_fn(m):
        head, body = m.group(1), m.group(2)
        parts = re.split(r"(\s+)", body)
        out = []
        for tok in parts:
            if re.fullmatch(r"0+(\.0+)?", tok.strip()) and tok.strip():
                out.append("0%")
            else:
                out.append(tok)
        return head + "".join(out) + ")"

    # only rewrite functions that actually contain a percentage
    def maybe(m):
        if "%" not in m.group(2):
            return m.group(0)
        return fix_fn(m)

    return re.sub(r"(\b[a-zA-Z-]+\()([^()]*)\)", maybe, decls)


def clean_decls(decls: str) -> str:
    d = pct_space_fix(decls.strip())
    if not d.endswith(";"):
        d += ";"
    # angle brackets are rejected outright by the endpoint
    return d.replace("<", "").replace(">", "")


# ---------------------------------------------------------------------------
# payload loading
# ---------------------------------------------------------------------------
def load_payload(path: str) -> dict:
    raw = open(path, encoding="utf-8").read()
    m = re.search(r'<script type="application/json"[^>]*>(.*?)</script>', raw, re.S)
    if not m:
        sys.exit(f"no embedded payload found in {path}")
    doc = json.loads(m.group(1))
    return doc["payload"] if "payload" in doc else doc


class Styles:
    def __init__(self, styles):
        # The resolver dedupes identical definitions onto whichever name it saw
        # first, so the box-sizing-only carrier class ends up called
        # `skip-link-before` and then shows up as the base of `.brand`,
        # `.chapter-readout` and friends. Same definition, meaningless name —
        # rename it once, here, so the client's Designer reads sensibly. It is
        # identical across all three pages, so Webflow merges it by name.
        for s in styles:
            if (s.get("comb") == ""
                    and not s.get("variants")
                    and s.get("styleLess", "").replace(" ", "").strip(";")
                    == "box-sizing:border-box"):
                s["name"] = "mpd-box"
        self.by_id = {s["_id"]: s for s in styles}
        self.parent = {}
        for s in styles:
            for c in s.get("children", []) or []:
                self.parent[c] = s["_id"]
        self.all = styles

    def chain(self, sid):
        # `--wrap` adds a page-wrapper Block whose `classes` entry is the literal
        # class NAME, not a style id — there is no style record to look up.
        if sid not in self.by_id:
            return [sid]
        names, seen = [], set()
        while sid and sid not in seen:
            seen.add(sid)
            names.append(self.by_id[sid]["name"])
            sid = self.parent.get(sid)
        return list(reversed(names))

    def ancestor_styles(self, sid):
        """The combo chain above this style, nearest first."""
        out, seen = [], set()
        cur = self.parent.get(sid)
        while cur and cur not in seen:
            seen.add(cur)
            if cur in self.by_id:
                out.append(self.by_id[cur])
            cur = self.parent.get(cur)
        return out

    def selector(self, sid):
        return "." + ".".join(self.chain(sid))

    def name(self, sid):
        s = self.by_id.get(sid)
        return s["name"] if s else sid


def parse_min_width_thresholds(paths):
    """class name -> the `min-width` px at which the source turns on its desktop
    layout.

    The design is MOBILE-FIRST: `.next-steps` is one column in the base rule and
    three inside `@media (min-width: 760px)`. Webflow inverts that — `main` IS
    desktop and the breakpoints subtract going down — so the converter has
    nowhere honest to put a min-width rule and files all of them under `xl`,
    i.e. 1440 and up. Left alone, every page publishes its PHONE layout from 768
    to 1439: one-column team grids, one-column footer, and (worst) the sticky
    call bar visible where the design hides it.

    So the thresholds are read back out of the source and each rule is re-hung
    on the nearest Webflow breakpoint. See `late_breakpoint()` for the choice.
    """
    out = {}
    for path in paths:
        text = open(path, encoding="utf-8").read()
        if path.endswith((".html", ".htm")):
            text = "\n".join(m.group(1) for m in
                             re.finditer(r"<style[^>]*>(.*?)</style>", text, re.S))
        for m in re.finditer(
                r"@media\s*\(min-width:\s*(\d+)px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}", text):
            px = int(m.group(1))
            for sel in re.findall(r"([^{}]+)\{", m.group(2)):
                for one in sel.split(","):
                    classes = re.findall(r"\.([A-Za-z0-9_-]+)", one)
                    if not classes:
                        continue
                    # Index the ANCESTOR classes too. The resolver folds a
                    # combo like `.find-grid` into the element's own auto-named
                    # style (`ty-div-6`), so the styled class often no longer
                    # exists by name — but the chapter class it sits under
                    # (`.ch-find`) is still on an ancestor element, and that is
                    # what the ancestor walk in threshold_for() can see.
                    for c in classes[:-1]:
                        out.setdefault(c, px)
                    out[classes[-1]] = px
    return out


# DISPLAY TYPE LADDER. `mpd.css` steps the display tokens down as the viewport
# narrows by overriding `:root` inside media queries. The cascade resolver
# evaluates `var()` ONCE, at the base, so none of those steps reach the payload:
# every heading publishes at its 1440 size all the way down, ~29% too large at
# 768. Rebuilt here from the token values, keyed by the base size each token
# resolves to.  base -> {1439, 991, 767}
DISPLAY_TIER = {
    "3.75rem": {"1439": "3.3rem", "991": "2.9rem", "767": "2.5rem"},    # --t-h1
    "2.75rem": {"1439": "2.5rem", "991": "2.25rem", "767": "2.05rem"},  # --t-h2
    "3.4rem":  {"1439": "2.95rem", "991": "2.55rem", "767": "2.05rem"}, # --t-statement
    "5.5rem":  {"991": "4.8rem", "767": "4rem"},                        # --t-price
}

AUTO_INITIAL = {"top", "right", "bottom", "left", "width", "height",
                "min-width", "min-height", "max-width", "max-height",
                "margin-top", "margin-right", "margin-bottom", "margin-left",
                "inset-block-start", "inset-block-end"}


def late_breakpoint(px):
    """Which Webflow breakpoint restores the pre-threshold (mobile) values.

    Only 991 / 767 / 479 exist, so a 760px or an 860px threshold has to round.
    It rounds UP — mobile stays a little longer rather than desktop arriving a
    little early — because arriving early is the failure that hurts: the 860px
    rule is the one that HIDES the sticky call bar, and hiding it at 768 on a
    paid landing page costs conversions, while showing it up to 991 costs
    nothing.
    """
    return "small" if px <= 767 else "medium"


def split_decls(decls):
    out = OrderedDict()
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
                out[k.strip()] = v.strip()
            buf = ""
        else:
            buf += ch
    if ":" in buf:
        k, _, v = buf.partition(":")
        out[k.strip()] = v.strip()
    return out


def join_decls(d):
    return "".join(f"{k}: {v}; " for k, v in d.items()).strip()


_PB = re.compile(r"(?:^|;)\s*padding(?:-bottom|-block)\s*:\s*([^;]+)")


def strip_runtime_bar_clearance(base_decls: str, variant_decls: str, log):
    """Remove the `padding-bottom: 0px` the page-base carry invents.

    `mpd.css` reserves room for the mobile call bar with
    `@media (max-width: 859px) { body { padding-bottom: var(--bar-h) } }`, and
    `--bar-h` is MEASURED AND WRITTEN BY THE RUNTIME — it does not exist when
    the resolver runs, so it resolves to `0px`. The converter then carries the
    body's declarations onto every root-level element, and that zero lands on
    `.skip-link`, `.sticky-bar` and `.site-foot` as a breakpoint override that
    wipes out their real bottom padding below 768.

    The clearance itself is not lost: it is reinstated as a real `body` rule in
    the page's head custom code, which is where a runtime-driven value belongs.
    """
    m = re.search(r"padding-bottom\s*:\s*0(?:px)?\s*;?", variant_decls)
    if not m:
        return variant_decls
    have_base = _PB.search(";" + base_decls)
    if not have_base or have_base.group(1).strip().rstrip(";") in ("0", "0px"):
        return variant_decls
    log.append(have_base.group(1).strip())
    return (variant_decls[:m.start()] + variant_decls[m.end():]).strip()


def emit_css(st: Styles, prefix: str, used=None, thresholds=None, resolve_px=None):
    """Return (css_text, unresolved_late). Rules are grouped per media query so a
    style's base and its breakpoint overrides land in the right blocks.

    `large`/`xl`/`xxl` variants are min-width rules the converter had nowhere to
    put (see parse_min_width_thresholds). They are folded INTO the base and the
    pre-threshold values are re-emitted as a max-width restore, so the desktop
    layout starts where the design says it does instead of at 1440.
    """
    blocks = OrderedDict((k, []) for k in MEDIA)
    unresolved = []
    bar_fix = []
    tier_1439 = []
    thresholds = thresholds or {}

    # Pass 1: fold every late variant into its style's base FIRST. A combo's
    # restore reads the folded value off its parent (`.grid.grid--3` falls back
    # to `.grid`), so the parent has to be folded before anyone looks at it —
    # done inline, `.grid--3` restored to `.grid`'s PRE-fold one-column value
    # and the review grid collapsed to a single column below 992.
    folded = {}
    for s in st.all:
        d = split_decls(s.get("styleLess", ""))
        for key, var in (s.get("variants") or {}).items():
            if key.partition("_")[0] in LATE and not key.partition("_")[2]:
                d.update(split_decls((var or {}).get("styleLess", "")))
        folded[s["_id"]] = d

    for s in st.all:
        if used is not None and s["_id"] not in used:
            continue
        sel = st.selector(s["_id"])
        base = split_decls(s.get("styleLess", ""))
        variants = dict(s.get("variants") or {})

        # --- fold the min-width (late) variants into the base -------------
        restores = {}
        for key in [k for k in variants if k.partition("_")[0] in LATE]:
            var = variants.pop(key)
            decls = split_decls((var or {}).get("styleLess", ""))
            if not decls:
                continue
            bp, _, ps = key.partition("_")
            px = resolve_px(s) if resolve_px else None
            if px is None:
                unresolved.append({"style": st.name(s["_id"]), "breakpoint": bp,
                                   "declarations": (var or {}).get("styleLess", "")})
                px = 992          # safest default: desktop from the medium edge
            target = late_breakpoint(px)
            suffix = PSEUDO.get(ps, "") if ps else ""
            for k, v in decls.items():
                # Where the base is silent, restore the property's initial
                # value. Box offsets and sizes get the literal `auto` rather
                # than `initial` — same computed result, but the Designer's
                # style panel can show it.
                # A combo (`.grid.grid--3`) usually does not redeclare what its
                # base (`.grid`) already sets, so the restore has to read
                # through the chain — otherwise `grid-template-columns` came
                # back as `initial`, i.e. `none`, and the two-column grid
                # underneath it collapsed at that breakpoint.
                fallback = "auto" if k in AUTO_INITIAL else "initial"
                inherited = base.get(k)
                if inherited is None:
                    for anc in st.ancestor_styles(s["_id"]):
                        got = folded.get(anc["_id"], {}).get(k)
                        if got is not None:
                            inherited = got
                            break
                restores.setdefault((target, suffix), OrderedDict())[k] = (
                    inherited if inherited is not None else fallback)
                if not suffix:
                    base[k] = v
            if suffix:
                variants.setdefault(f"main_{ps}", {"styleLess": ""})
                variants[f"main_{ps}"]["styleLess"] = (
                    variants[f"main_{ps}"]["styleLess"] + ";" + join_decls(decls))

        # --- display type ladder ------------------------------------------
        tier = DISPLAY_TIER.get((base.get("font-size") or "").strip())
        if tier:
            if "991" in tier:
                blocks["medium"].append(f"{sel} {{ font-size: {tier['991']}; }}")
            if "767" in tier:
                blocks["small"].append(f"{sel} {{ font-size: {tier['767']}; }}")
            if "1439" in tier:
                # no Webflow max-width breakpoint exists between 992 and 1920,
                # so this step has to ride in the page's head custom code
                tier_1439.append(f"{sel}{{font-size:{tier['1439']}}}")

        if base:
            blocks["main"].append(f"{sel} {{ {clean_decls(join_decls(base))} }}")
        for (target, suffix), decls in restores.items():
            blocks[target].append(f"{sel}{suffix} {{ {clean_decls(join_decls(decls))} }}")

        for key, var in variants.items():
            decls = (var or {}).get("styleLess", "").strip()
            decls = strip_runtime_bar_clearance(s.get("styleLess", ""), decls, bar_fix)
            if not decls:
                continue
            bp, _, ps = key.partition("_")
            if bp not in blocks:
                continue
            suffix = PSEUDO.get(ps, "") if ps else ""
            blocks[bp].append(f"{sel}{suffix} {{ {clean_decls(decls)} }}")

    out = []
    for key, rules in blocks.items():
        if not rules:
            continue
        if MEDIA[key] is None:
            out.extend(rules)
        else:
            out.append(MEDIA[key] + " {")
            out.extend("  " + r for r in rules)
            out.append("}")
    if bar_fix:
        print(f"[payload_to_whtml] dropped {len(bar_fix)} phantom "
              f"`padding-bottom: 0` override(s) from the --bar-h carry "
              f"(bases: {', '.join(sorted(set(bar_fix)))})", file=sys.stderr)
    head_css = ("@media (max-width:1439px){" + "".join(tier_1439) + "}\n") if tier_1439 else ""
    return "\n".join(out) + "\n", unresolved, head_css


def split_known(css_text, known):
    """Drop rules whose exact text a previous page already sent.

    Webflow reconciles pasted classes by NAME site-wide, so a shared class only
    has to be created once — the second page's WHTML insert resolves the name to
    the style that already exists. `--vocab` is what makes that safe: it forces
    one canonical definition for every class used on more than one page. A rule
    whose selector matches but whose declarations DIFFER is a vocabulary miss
    and is reported, not silently dropped — dropping it would publish page two
    styled by page one's values.
    """
    kept, conflicts = [], []
    media = None
    for line in css_text.splitlines():
        st = line.strip()
        if st.startswith("@media"):
            media = st
            kept.append(line)
            continue
        if st == "}" and media:
            media = None
            kept.append(line)
            continue
        m = re.match(r"^(.*?)\s*\{\s*(.*?)\s*\}$", st)
        if not m:
            kept.append(line)
            continue
        key = (media or "", m.group(1))
        decls = m.group(2)
        prev = known.get(json.dumps(key))
        if prev is None:
            known[json.dumps(key)] = decls
            kept.append(line)
        elif prev != decls:
            conflicts.append(f"{key[1]}{(' in ' + key[0]) if key[0] else ''}")
            kept.append(line)
    # drop media blocks left empty
    out, buf = [], []
    for line in kept:
        if line.strip().startswith("@media"):
            buf = [line]
        elif buf and line.strip() == "}":
            if len(buf) > 1:
                out.extend(buf + [line])
            buf = []
        elif buf:
            buf.append(line)
        else:
            out.append(line)
    return "\n".join(l for l in out if l.strip()) + "\n", conflicts


# ---------------------------------------------------------------------------
# embeds
# ---------------------------------------------------------------------------
RULE_RE = re.compile(r"([^{}]+)\{([^{}]*)\}")


class SyntheticClasses:
    """Classes minted for CSS that only existed inside an embed's <style> prefix
    (svg sizing, dash offsets). Deduped by declaration set so the same rule does
    not fork per embed."""

    def __init__(self, prefix):
        self.prefix = prefix
        self.by_decls = OrderedDict()

    def get(self, decls):
        key = clean_decls(decls)
        if key not in self.by_decls:
            self.by_decls[key] = f"{self.prefix}-emb-{len(self.by_decls) + 1}"
        return self.by_decls[key]

    def css(self):
        return "\n".join(f".{n} {{ {d} }}" for d, n in self.by_decls.items())


def embed_prefix_rules(css_text):
    """Split an embed's <style> prefix into (target_kind, target_value, decls).

    target_kind is 'tag' or 'class'; only the LAST simple selector matters
    because the embed's own subtree is the scope.
    """
    out = []
    for sel, decls in RULE_RE.findall(css_text or ""):
        for one in sel.split(","):
            one = one.strip()
            if not one or one in EMBED_CSS_IGNORE:
                continue
            tail = one.split()[-1]
            if tail in EMBED_CSS_IGNORE:
                continue
            if tail.startswith("."):
                out.append(("class", tail[1:], decls))
            elif re.fullmatch(r"[a-zA-Z][\w-]*", tail):
                out.append(("tag", tail, decls))
    return out


def inline_embed(html, prefix_css, synth):
    """Inline an svg/sup embed as raw HTML, folding its prefix CSS into
    synthetic flat classes attached to the elements the rules targeted."""
    rules = embed_prefix_rules(prefix_css)
    if not rules:
        return html

    # group declarations per target so one element gets one synthetic class
    per_target = OrderedDict()
    for kind, value, decls in rules:
        per_target.setdefault((kind, value), []).append(decls.strip().rstrip(";"))

    for (kind, value), decl_list in per_target.items():
        cls = synth.get("; ".join(decl_list))
        if kind == "tag":
            pattern = re.compile(rf"<{re.escape(value)}\b([^>]*)>")
        else:
            pattern = re.compile(
                rf'<([a-zA-Z][\w-]*)([^>]*\bclass="[^"]*\b{re.escape(value)}\b[^"]*"[^>]*)>')

        def add_class(m):
            if kind == "tag":
                attrs = m.group(1)
                head = f"<{value}"
            else:
                attrs = m.group(2)
                head = f"<{m.group(1)}"
            cm = re.search(r'class="([^"]*)"', attrs)
            if cm:
                attrs = attrs[:cm.start(1)] + (cm.group(1) + " " + cls) + attrs[cm.end(1):]
            else:
                attrs = f' class="{cls}"' + attrs
            return head + attrs + ">"

        html = pattern.sub(add_class, html)
    return html


# ---------------------------------------------------------------------------
# HTML emission
# ---------------------------------------------------------------------------
class Serializer:
    def __init__(self, payload, prefix, asset_map, chunk_limit):
        self.nodes = {n["_id"]: n for n in payload["nodes"]}
        self.order = [n["_id"] for n in payload["nodes"]]
        self.st = Styles(payload["styles"])
        self.prefix = prefix
        self.assets = asset_map or {}
        self.chunk_limit = chunk_limit
        self.synth = SyntheticClasses(prefix)
        self.embeds = []
        # node id -> slot. The chunker renders the same subtree more than once
        # (to measure it, then again per split level); without this the same
        # form was registered five times and would have been pasted five times.
        self.embed_slots = {}
        self.chunks = []
        # Style ids actually referenced by a surviving node. Dropping the empty
        # pseudo carriers leaves their class orphaned; emitting it anyway would
        # litter the client's project with a class nothing uses.
        self.used_styles = set()
        self.parent_of = {}
        for n in payload["nodes"]:
            for c in n.get("children") or []:
                self.parent_of[c] = n["_id"]
        self.unmapped_assets = set()

    # -- classes -----------------------------------------------------------
    def classes_of(self, node):
        out = []
        for cid in node.get("classes", []) or []:
            self.used_styles.add(cid)
            n = self.st.name(cid)
            if n:
                out.append(n)
        return out

    def meaningful_classes(self, node):
        """Drop the box-sizing-only carrier class the converter reuses for
        materialised pseudo elements — on an inlined <sup> it is pure noise."""
        keep = []
        for cid in node.get("classes", []) or []:
            s = self.st.by_id.get(cid)
            if not s:
                keep.append(cid)
                continue
            trivial = (s.get("styleLess", "").replace(" ", "").strip(";") == "box-sizing:border-box"
                       and not s.get("variants"))
            if not trivial:
                keep.append(s["name"])
        return keep

    # -- pseudo-element carriers -------------------------------------------
    def is_noise(self, nid):
        """True for a materialised ::before/::after that carries nothing.

        `mpd.css` opens with `*, *::before, *::after { box-sizing: border-box }`,
        so the resolver mints a carrier Block for BOTH pseudos of EVERY element
        — 1327 payload nodes for a page with roughly 450 real ones. Empty in
        Webflow's own model, but serialised back to HTML they are `<div>`s, and
        a `<div>` inside a `<p>`/`<span>`/`<b>` closes it: the parser would
        shred half the page's text flow. Carriers with real declarations
        (`content`, a rule, a variant) are kept — those are load-bearing.
        """
        n = self.nodes.get(nid)
        if not n or n.get("text") or n.get("type") != "Block":
            return False
        if n.get("children"):
            return False
        d = n.get("data", {}) or {}
        if (d.get("attr", {}) or {}).get("id") or d.get("xattr"):
            return False
        cls = n.get("classes") or []
        if not cls:
            return False
        for cid in cls:
            s = self.st.by_id.get(cid)
            if not s:
                return False
            if s.get("variants"):
                return False
            if s.get("styleLess", "").replace(" ", "").strip(";") != "box-sizing:border-box":
                return False
        return True

    def threshold_for(self, style, thresholds):
        """The source `min-width` px behind this style's late variant.

        Tried in order: the style's own name, the names in its combo chain,
        then the nearest ANCESTOR element's classes. The ancestor step is what
        resolves converter auto-names — `.ch-next .next-spine i` becomes a style
        called `ty-i-3`, which no source selector mentions, but its parent is
        `.next-spine` and that does.
        """
        for name in reversed(self.st.chain(style["_id"])):
            if name in thresholds:
                return thresholds[name]
        for nid, n in self.nodes.items():
            if style["_id"] in (n.get("classes") or []):
                cur = self.parent_of.get(nid)
                while cur:
                    for cid in self.nodes[cur].get("classes") or []:
                        nm = self.st.name(cid)
                        if nm in thresholds:
                            return thresholds[nm]
                    cur = self.parent_of.get(cur)
                break
        return None

    def kids(self, nid):
        return [c for c in (self.nodes[nid].get("children") or []) if not self.is_noise(c)]

    # -- one node ----------------------------------------------------------
    def node_html(self, nid):
        n = self.nodes[nid]
        if n.get("text"):
            return esc_text(n.get("v", ""))
        if n.get("type") == "HtmlEmbed":
            return self.embed_html(n)

        tag = n.get("tag") or TYPE_TAG.get(n.get("type"), "div")
        data = n.get("data", {}) or {}
        attrs = []

        cls = self.classes_of(n)
        if cls:
            attrs.append(f'class="{esc_attr(" ".join(cls))}"')

        attr = data.get("attr", {}) or {}
        el_id = attr.get("id") or ""
        if el_id:
            attrs.append(f'id="{esc_attr(el_id)}"')

        if n.get("type") == "Image":
            src = attr.get("src", "")
            mapped = self.map_asset(src)
            if mapped:
                attrs.append(f'src="{esc_attr(mapped)}"')
            for k in ("alt", "width", "height", "loading"):
                if attr.get(k):
                    attrs.append(f'{k}="{esc_attr(str(attr[k]))}"')

        link = data.get("link") or {}
        if link.get("url"):
            attrs.append(f'href="{esc_attr(link["url"])}"')

        for x in data.get("xattr", []) or []:
            attrs.append(f'{x["name"]}="{esc_attr(x.get("value", ""))}"')

        head = f"<{tag}{(' ' + ' '.join(attrs)) if attrs else ''}>"
        if tag in VOID:
            return head
        inner = "".join(self.node_html(c) for c in self.kids(nid))
        return f"{head}{inner}</{tag}>"

    def map_asset(self, src):
        if not src:
            return src
        base = os.path.basename(src)
        if base in self.assets:
            return self.assets[base]
        self.unmapped_assets.add(src)
        return src

    def embed_html(self, n):
        raw = n.get("v", "")
        m = re.match(r"^<style>(.*?)</style>(.*)$", raw, re.S)
        prefix_css, body = (m.group(1), m.group(2)) if m else ("", raw)

        opaque = body.lstrip().startswith("<form") or "<iframe" in body
        if opaque:
            cls = self.meaningful_classes(n)
            slot = self.embed_slots.get(n["_id"])
            if slot is None:
                slot = len(self.embeds)
                self.embed_slots[n["_id"]] = slot
                self.embeds.append({"slot": slot, "code": raw, "classes": cls})
            attr = f' class="{esc_attr(" ".join(cls))}"' if cls else ""
            return f'<div data-embed-slot="{slot}"{attr}></div>'

        html = inline_embed(body, prefix_css, self.synth)
        cls = self.meaningful_classes(n)
        if cls:
            # attach the node's own classes to the inlined root element
            html = re.sub(r"^\s*<([a-zA-Z][\w-]*)([^>]*)>",
                          lambda mm: self._merge_class(mm, " ".join(cls)),
                          html, count=1)
        return html

    @staticmethod
    def _merge_class(m, extra):
        tag, attrs = m.group(1), m.group(2)
        cm = re.search(r'class="([^"]*)"', attrs)
        if cm:
            attrs = attrs[:cm.start(1)] + (cm.group(1) + " " + extra) + attrs[cm.end(1):]
        else:
            attrs = f' class="{extra}"' + attrs
        return f"<{tag}{attrs}>"

    # -- chunking ----------------------------------------------------------
    def shell_html(self, nid):
        """The node's own open/close tags with no children — used when its
        subtree is too big for one WHTML action."""
        n = self.nodes[nid]
        kids = n.get("children")
        n["children"] = []
        try:
            open_only = self.node_html(nid)
        finally:
            n["children"] = kids
        return open_only

    def plan(self, root_id):
        self._chunk(root_id, parent=None, key="c0")
        return self.chunks

    def _chunk(self, nid, parent, key):
        html = self.node_html(nid)
        kids = [c for c in self.kids(nid) if not self.nodes[c].get("text")]
        if len(html) <= self.chunk_limit or not kids:
            self.chunks.append({"key": key, "parent": parent, "html": html,
                                "split": False})
            return
        # too big: insert the shell, then each child separately
        self.chunks.append({"key": key, "parent": parent,
                            "html": self.shell_html(nid), "split": True})
        for i, c in enumerate(kids):
            self._chunk(c, parent=key, key=f"{key}.{i}")


# ---------------------------------------------------------------------------
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--payload", required=True, help="paste_00_full-page.html")
    ap.add_argument("--out", required=True, help="output folder")
    ap.add_argument("--prefix", required=True, help="page prefix for synthetic classes")
    ap.add_argument("--asset-map", help="JSON {filename: hostedUrl}")
    ap.add_argument("--chunk-limit", type=int, default=45000)
    ap.add_argument("--known", help="JSON ledger of rules already sent to the "
                                    "site by earlier pages (read AND written)")
    ap.add_argument("--source", action="append", default=[], metavar="FILE",
                    help="source CSS/HTML to read min-width thresholds from "
                         "(repeatable; pass the shared stylesheet and the page)")
    args = ap.parse_args(argv)

    payload = load_payload(args.payload)
    assets = json.load(open(args.asset_map, encoding="utf-8")) if args.asset_map else {}

    ser = Serializer(payload, args.prefix, assets, args.chunk_limit)
    root = payload["nodes"][0]["_id"]
    chunks = ser.plan(root)

    thresholds = parse_min_width_thresholds(args.source)
    css, late, head_css = emit_css(ser.st, args.prefix, ser.used_styles, thresholds,
                                   lambda s: ser.threshold_for(s, thresholds))
    synth_css = ser.synth.css()
    if synth_css:
        css = css + "\n/* embed-derived flat classes */\n" + synth_css + "\n"

    conflicts = []
    full_bytes = len(css)
    if args.known:
        known = (json.load(open(args.known, encoding="utf-8"))
                 if os.path.exists(args.known) else {})
        css, conflicts = split_known(css, known)
        json.dump(known, open(args.known, "w", encoding="utf-8"), indent=1)

    os.makedirs(args.out, exist_ok=True)
    w = lambda name, text: open(os.path.join(args.out, name), "w",
                                encoding="utf-8", newline="\n").write(text)
    w("styles.css", css)
    w("page-head.css", head_css)
    w("unresolved-min-width.json", json.dumps(late, indent=1))
    w("chunks.json", json.dumps(chunks, indent=1))
    w("embeds.json", json.dumps(ser.embeds, indent=1))

    report = {
        "nodes": len(payload["nodes"]),
        "styles": len(payload["styles"]),
        "css_bytes": len(css),
        "css_bytes_before_dedupe": full_bytes,
        "css_conflicts_with_earlier_page": conflicts,
        "chunks": len(chunks),
        "largest_chunk": max(len(c["html"]) for c in chunks),
        "embeds_kept": len(ser.embeds),
        "synthetic_classes": len(ser.synth.by_decls),
        "min_width_thresholds_found": len(thresholds),
        "unresolved_min_width_variants": len(late),
        "unmapped_assets": sorted(ser.unmapped_assets),
    }
    w("report.json", json.dumps(report, indent=1))
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
