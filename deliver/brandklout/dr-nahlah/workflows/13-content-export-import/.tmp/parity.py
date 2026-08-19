"""Structural parity: local built page vs the Instatic draft document.

Emits a token stream per page and diffs them, so a missing section, a renamed
class, a dropped image, a lost alt or changed copy surfaces as a concrete line
rather than a count that happens to match.

Normalised away as expected platform noise:
  * local `foo.html` links -> `/foo`, `index.html` -> `/`
  * the 21-char Instatic upload id prefixed to every `/uploads/` filename
Everything else is a real difference.
"""
import json, re, sys, os, difflib
from html.parser import HTMLParser

HERE  = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.path.join(HERE, "..", "..", "04-design", ".tmp", "final-site")
INST  = os.path.join(HERE, ".instatic2")
VOID  = {"img","br","hr","input","meta","link","source","use","path","circle","rect","col"}
SKIP  = {"script","style","noscript","svg","template"}
UPLOAD_ID = re.compile(r"^[A-Za-z0-9_-]{21}-")

def norm_href(h):
    if h == "index.html":
        return "/"
    m = re.match(r"^([A-Za-z0-9_-]+)\.html(.*)$", h)
    return "/" + m.group(1) + m.group(2) if m else h

class Tok(HTMLParser):
    def __init__(self, strip_upload_id=False):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skip = 0
        # Only the Instatic side carries the 21-char upload id. Stripping it from
        # the local side too ate real prefixes: "case-veneers-implants" is exactly
        # 21 characters, so four real filenames diffed as false positives.
        self.strip_upload_id = strip_upload_id
    def handle_starttag(self, tag, attrs):
        if self.skip:
            if tag not in VOID: self.skip += 1
            return
        if tag in SKIP:
            self.skip = 1; return
        # FIRST occurrence wins, the way an HTML parser resolves a duplicated
        # attribute. Instatic emits alt twice on any image whose alt was put
        # back through htmlAttributes; the browser reads the first one.
        a = {}
        for k, v in attrs:
            if k not in a: a[k] = v
        cls = " ".join(sorted((a.get("class") or "").split()))
        bits = [tag]
        if cls: bits.append("." + cls)
        if tag == "img":
            src = os.path.basename((a.get("src") or "").split("?")[0])
            bits.append("src=" + (UPLOAD_ID.sub("", src) if self.strip_upload_id else src))
            bits.append("alt=" + (a.get("alt") if a.get("alt") is not None else "<<MISSING>>")[:40])
        if tag == "a" and a.get("href") is not None:
            bits.append("href=" + norm_href(a["href"]))
        for k in ("data-rv","data-drift","data-theme","data-journey","data-ch","id"):
            if k in a: bits.append(f"{k}={a[k] or ''}")
        self.out.append("<" + " ".join(bits) + ">")
    def handle_endtag(self, tag):
        if self.skip:
            if tag in SKIP and self.skip == 1: self.skip = 0
            else: self.skip = max(0, self.skip - 1)
            return
        if tag not in VOID: self.out.append("</" + tag + ">")
    def handle_data(self, d):
        if self.skip: return
        t = " ".join(d.split())
        if t: self.out.append("#" + t)

strip_comments = lambda s: re.sub(r"<!--.*?-->", "", s, flags=re.S)

def local_body(slug):
    s = strip_comments(open(os.path.join(LOCAL, slug + ".html"), encoding="utf-8").read())
    m = re.search(r"<body[^>]*>(.*)</body>", s, re.S)
    return m.group(1) if m else s

def inst_body(slug):
    j = json.load(open(os.path.join(INST, slug + ".json"), encoding="utf-8"))
    return re.sub(r'\suid="[^"]*"', "", strip_comments(j["html"]))

def toks(s, strip_upload_id=False):
    p = Tok(strip_upload_id); p.feed(s); return p.out

def main(slugs):
    for slug in slugs:
        a, b = toks(local_body(slug)), toks(inst_body(slug), strip_upload_id=True)
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        ops = [o for o in sm.get_opcodes() if o[0] != "equal"]
        print(f"\n===== {slug}  local={len(a)} instatic={len(b)} similarity={sm.ratio():.4f} diffs={len(ops)}")
        for tag, i1, i2, j1, j2 in ops:
            la, lb = a[i1:i2], b[j1:j2]
            print(f"  [{tag}] local[{i1}:{i2}] instatic[{j1}:{j2}]")
            for x in la[:10]: print("    - " + x[:170])
            if len(la) > 10: print(f"    - ... +{len(la)-10} more")
            for x in lb[:10]: print("    + " + x[:170])
            if len(lb) > 10: print(f"    + ... +{len(lb)-10} more")

if __name__ == "__main__":
    main(sys.argv[1:] or ["index"])
