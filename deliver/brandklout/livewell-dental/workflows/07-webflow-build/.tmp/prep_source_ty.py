"""Prepare the thank-you page design package for conversion.

Same shape as prep_source_quiz.py: the `[data-flag]` review blocks and their two
CSS rules are for Brandklout and Dr. Chris, not for the built page. An unused
rule has no element to attach to and would be emitted as head CSS.

This page ships its own minimal header and footer, so there is no site nav to
remove.

Regenerate with:  python .tmp/prep_source_ty.py
"""
import io, re, os, sys

def strip_flags(html, cls):
    r"""Remove every `<span class="{cls}" data-flag>...</span>` block.

    Done by counting <span>/</span> nesting, not by regex: a non-greedy
    `.*?</span>\s*</span>` looks right but expands past the flag's own close
    tag and silently swallowed the whole step-11 form on the first run.
    """
    open_tag = '<span class="%s" data-flag>' % cls
    n = 0
    while True:
        i = html.find(open_tag)
        if i < 0:
            break
        depth, j = 0, i
        while j < len(html):
            if html.startswith("<span", j):
                depth += 1; j += 5
            elif html.startswith("</span>", j):
                depth -= 1; j += 7
                if depth == 0:
                    break
            else:
                j += 1
        else:
            raise SystemExit("prep failed: unbalanced flag span")
        k = i
        while k > 0 and html[k - 1] in " 	":
            k -= 1
        if k > 0 and html[k - 1] == chr(10):
            k -= 1
        html = html[:k] + html[j:]
        n += 1
    return html, n


SRC = "../04-design/.tmp/final-design/livewell-thank-you.html"
OUT = ".tmp/page-ty/source.html"

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)                       # 07-webflow-build/
src = os.path.normpath(os.path.join(root, SRC))
out = os.path.normpath(os.path.join(root, OUT))

html = io.open(src, encoding="utf-8").read()
before = len(html)

html, n_flags = strip_flags(html, "ty-flag")
html, n_css = re.subn(r'/\* review flags:[^*]*\*/\n\.ty-flag\{[^}]*\}\n\.ty-flag__tag\{[^}]*\}\n',
                      '', html)

if not n_flags:
    sys.exit("prep failed: no [data-flag] blocks matched")
if not n_css:
    sys.exit("prep failed: .ty-flag CSS rules not found")
if 'data-flag' in html or 'ty-flag' in html:
    sys.exit("prep failed: flag residue left in output")
if '<div class="page_ty">' not in html:
    sys.exit("prep failed: .page_ty root missing")

os.makedirs(os.path.dirname(out), exist_ok=True)
io.open(out, "w", encoding="utf-8").write(html)
print("wrote %s  (%d -> %d bytes, %d review flags stripped)"
      % (OUT, before, len(html), n_flags))
