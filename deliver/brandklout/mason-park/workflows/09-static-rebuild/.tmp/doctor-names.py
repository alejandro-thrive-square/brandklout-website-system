# One name per doctor, everywhere (client, 2026-09-25): "Sometimes we name them with
# first name and last name and other times it's just the last name and that can be
# confusing to patients."
#
#   Dr. Dave Cho      Dr. William Sung      Dr. Tam Nguyen
#   with a credential: "Dr. Dave Cho, DMD" (comma, never "Dr. Dave Cho DMD")
#   lists: "Dr. Dave Cho and Dr. William Sung", never "Drs. Cho & Sung"; Cho first.
#
# Patients' own words are never edited: reviews live in <blockquote>, in
# p.pr-chip / p.cp-review, and in the `const R = {` block of the ad generator.
#
#   python doctor-names.py --check      list every short form outside a review (exit 1 if any)
#   python doctor-names.py --apply      rewrite pages, the ad generator and the article rows
#   python doctor-names.py --live <base> check the published site (every row + every article)
#
# Scope: home/**/index.html, build-ads-landing-pages.mjs, blog/cms-rows.json (the article
# rows import-articles.mjs reads). blog/posts.json and blog/bodies/ are older sources that
# the CMS rows superseded; they are not touched.
import glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FULL = {"Cho": "Dr. Dave Cho", "Sung": "Dr. William Sung", "Nguyen": "Dr. Tam Nguyen"}
ORDER = ["Cho", "Sung", "Nguyen"]
AMP = r"(?:&amp;|&|and)"

def plural(m):
    names = re.findall(r"Cho|Sung|Nguyen", m.group(0))
    names = [n for n in ORDER if n in names]
    full = [FULL[n] for n in names]
    return full[0] + " and " + full[1] if len(full) == 2 else ", ".join(full[:-1]) + " and " + full[-1]

RULES = [
    # "Drs. Cho, Sung, & Nguyen" / "Drs. Sung & Cho"
    (re.compile(r"\bDrs\.?\s+(?:Cho|Sung|Nguyen)(?:\s*,\s*(?:Cho|Sung|Nguyen))*,?\s*" + AMP + r"\s*(?:Cho|Sung|Nguyen)\b"), plural),
    # "Dr. Cho", "Dr Cho", "Dr. Dave Cho" -> the full name (idempotent)
    (re.compile(r"\bDr\.?\s+(?:Dave\s+)?Cho\b"), lambda m: FULL["Cho"]),
    (re.compile(r"\bDr\.?\s+(?:William\s+)?Sung\b"), lambda m: FULL["Sung"]),
    (re.compile(r"\bDr\.?\s+(?:Tam\s+)?Nguyen\b"), lambda m: FULL["Nguyen"]),
    # "Dr. Dave Cho DMD" -> "Dr. Dave Cho, DMD"
    (re.compile(r"(Dr\. (?:Dave Cho|William Sung|Tam Nguyen)) (DMD|DDS)\b"), lambda m: m.group(1) + ", " + m.group(2)),
]
SHORT = re.compile(r"\bDrs\.?\s+(?:Cho|Sung|Nguyen)|\bDr\.?\s+(?:Cho|Sung|Nguyen)\b|\bDr\s+(?:Dave|William|Tam)\b|(?:Dave Cho|William Sung|Tam Nguyen) (?:DMD|DDS)\b")

def fix(text):
    for pat, rep in RULES:
        text = pat.sub(rep, text)
    return text

# Protected spans in HTML: reviews. Everything else (text, alt, meta, JSON-LD) is copy.
PROTECT_HTML = re.compile(
    r"<blockquote\b[\s\S]*?</blockquote>"
    r"|<p\b[^>]*class=\"[^\"]*\b(?:pr-chip|cp-review)\b[^\"]*\"[^>]*>[\s\S]*?</p>")
PROTECT_GEN = re.compile(r"^const R = \{[\s\S]*?^\};", re.M)

def split_apply(src, protect, fn):
    out, last = [], 0
    for m in protect.finditer(src):
        out.append(fn(src[last:m.start()])); out.append(m.group(0)); last = m.end()
    out.append(fn(src[last:]))
    return "".join(out)

def short_hits(src, protect):
    return [m.group(0) for m in SHORT.finditer(split_apply(src, protect, lambda s: s))
            if not any(p.start() <= m.start() < p.end() for p in protect.finditer(src))]

def read(p): return open(p, encoding="utf-8", newline="").read()
def write(p, s): open(p, "w", encoding="utf-8", newline="").write(s)

def main(mode):
    report, changed = [], 0
    targets = [(p, PROTECT_HTML) for p in glob.glob(os.path.join(HERE, "..", "home", "**", "index.html"), recursive=True)]
    targets.append((os.path.join(HERE, "build-ads-landing-pages.mjs"), PROTECT_GEN))
    for path, protect in targets:
        src = read(path)
        if mode == "--apply":
            new = split_apply(src, protect, fix)
            if new != src: write(path, new); changed += 1
            src = new
        hits = short_hits(src, protect)
        if hits: report.append((os.path.relpath(path, HERE), hits))
    rows_path = os.path.join(HERE, "blog", "cms-rows.json")
    rows = json.loads(read(rows_path))
    SKIP = {"slug", "legacyUrl", "legacyHeroUrl", "dateIso", "publishedAt", "updatedAt"}
    rows_changed = 0
    for r in rows:
        for k, v in r["cells"].items():
            if k in SKIP or not isinstance(v, str): continue
            if mode == "--apply":
                nv = fix(v)
                if nv != v: r["cells"][k] = nv; rows_changed += 1; v = nv
            hits = SHORT.findall(v)
            if hits: report.append((f"article {r['slug']} .{k}", hits))
    if mode == "--apply" and rows_changed:
        write(rows_path, json.dumps(rows, ensure_ascii=False, indent=2))  # the file has no final newline
    if mode == "--apply":
        print(f"rewrote {changed} file(s) and {rows_changed} article cell(s)")
    for where, hits in report:
        print(f"  {where}: {len(hits)} short form(s), e.g. {hits[0]!r}")
    print(f"{len(report)} place(s) with a short form outside a review")
    return 1 if report else 0

def live(base):
    # Every row of the newest backup for that host, plus every article; the published
    # HTML, reviews excluded the same way. Pages the rebuild does not have were patched
    # by bugherd/patch-old-doctor-names.mjs.
    import urllib.request, concurrent.futures
    from urllib.parse import urlparse
    base = base.rstrip("/")
    host = urlparse(base).netloc
    backup = sorted(glob.glob(os.path.join(HERE, f"backup-{host}-*.json")))[-1]
    slugs = [p["cells"]["slug"] for p in json.loads(read(backup))["pages"]]
    urls = ["/" if s == "index" else f"/{s}/" for s in slugs if s and s not in ("blog-article", "404")]
    urls += [f"/blog/{r['slug']}/" for r in json.loads(read(os.path.join(HERE, "blog", "cms-rows.json")))]
    def get(u):
        req = urllib.request.Request(base + u, headers={"User-Agent": "Mozilla/5.0 doctor-names"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r: return u, r.read().decode("utf-8", "replace")
        except Exception as e: return u, f"ERROR {e}"
    bad = 0
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        for u, h in ex.map(get, urls):
            if h.startswith("ERROR"): print(f"  {u}: {h}"); bad += 1; continue
            hits = short_hits(h, PROTECT_HTML)
            if hits: print(f"  {u}: {len(hits)} short form(s), e.g. {hits[0]!r}"); bad += 1
    print(f"{base}: {len(urls)} URLs, {bad} with a problem")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) > 2 and sys.argv[1] == "--live":
        sys.exit(live(sys.argv[2]))
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "--check"))
