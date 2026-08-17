"""Remove the tag-derived margin resets that out-specify every element class.

`.page_x p{margin:0}` is (0,1,1); `.qz-hero__lede{margin-top:26px}` is (0,1,0), so
the reset silently won and every paragraph and heading margin computed to 0. The
same latent bug exists in the veneers and cosmetic packages.

Fix: drop the tag resets and carry the margin on each element's own flat class,
which is also the 07 directive's going-forward standard (a rule with no element to
attach to, or a tag-derived base rule, costs an auto-named companion class on
conversion). The one shared atom applied to a <p> is `lw-eyebrow`; its CSS must stay
byte-identical to the other payloads, so its elements become <div> instead.
"""
import re, sys, pathlib

TARGETS = {
 "livewell-implant-quiz.html": {"root": "page_quiz", "prefix": "qz"},
 "livewell-thank-you.html":    {"root": "page_ty",   "prefix": "ty"},
}
BASE = pathlib.Path("final-design")

# classes whose rules must carry an explicit margin once the resets are gone
def classed_elements(html, tags):
    out = {}
    for tag in tags:
        for m in re.finditer(r"<" + tag + r"\b[^>]*class=\"([^\"]+)\"", html):
            out.setdefault(m.group(1).split()[0], tag)
    return out

for fname, cfg in TARGETS.items():
    p = BASE / fname
    s = p.read_text(encoding="utf-8")
    root = cfg["root"]

    # 1. eyebrows move off <p> so the shared atom needs no margin declaration
    s = re.sub(r"<p (class=\"lw-eyebrow[^\"]*\")>(.*?)</p>",
               r"<div \1>\2</div>", s, flags=re.S)

    # 2. drop the tag resets
    s = s.replace(f".{root} p{{margin:0}}\n", "")
    s = s.replace(f".{root} figure,.{root} figcaption{{margin:0}}\n", "")
    s = re.sub(r"^\." + root + r" ul\{[^}]*\}\n", "", s, flags=re.M)
    # heading reset keeps typography, loses margin
    s = s.replace(f".{root} h1,.{root} h2,.{root} h3{{\n"
                  f"  font-family:var(--f-head);font-weight:400;margin:0;"
                  f"line-height:1.08;letter-spacing:-.012em;\n}}",
                  f".{root} h1,.{root} h2,.{root} h3{{\n"
                  f"  font-family:var(--f-head);font-weight:400;"
                  f"line-height:1.08;letter-spacing:-.012em;\n}}")

    # 3. every classed p / heading / figure / figcaption carries its own margin
    css_start, css_end = s.find("<style>"), s.find("</style>")
    css, rest_head, rest_body = s[css_start:css_end], s[:css_start], s[css_end:]
    targets = classed_elements(rest_body, ["p", "h1", "h2", "h3", "figure", "figcaption"])
    targets = {c: t for c, t in targets.items() if not c.startswith("lw-")}

    missing, patched = [], []
    for cls in sorted(targets):
        rx = re.compile(r"(?<![\w-])(\." + re.escape(cls) + r")\s*\{([^}]*)\}")
        m = rx.search(css)
        if not m:
            missing.append(cls); continue
        decls = m.group(2)
        mt = re.search(r"margin-top:\s*([^;}]+)", decls)
        auto = "margin-inline:auto" in decls
        top = mt.group(1).strip() if mt else "0"
        shorthand = f"margin:{top} auto 0" if auto else f"margin:{top} 0 0"
        if not mt and not auto:
            shorthand = "margin:0"
        new = decls
        if mt:
            new = re.sub(r"margin-top:\s*[^;}]+;?", "", new, count=1)
        if auto:
            new = new.replace("margin-inline:auto;", "").replace("margin-inline:auto", "")
        new = re.sub(r";\s*;", ";", new).strip().strip(";")
        new = f"{shorthand};{new}" if new else shorthand
        css = css[:m.start()] + f"{m.group(1)}{{{new}}}" + css[m.end():]
        patched.append(cls)

    s = rest_head + css + rest_body
    p.write_text(s, encoding="utf-8")
    print(f"{fname}: patched {len(patched)} rules, missing {missing}")
