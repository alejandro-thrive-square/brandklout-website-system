"""The production edge's data: old WordPress URLs -> new paths, and every live route (for sitemap.xml).
    python build-map.py     (from this folder; reads build-blog's --list output and home/)
Writes redirects.json and routes.json, which worker.js is generated from by build-worker.mjs.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.abspath(os.path.join(HERE, "..", ".."))
HOME = os.path.join(WF, "03-core-pages", "home")

m = {}
for line in open(os.path.join(WF, "03-core-pages", ".tmp", "blog-map.log"), encoding="utf-8"):
    x = re.search(r"^\s+(/\S+/)\s+->\s+(/blog/\S+/)", line)
    if x:
        m[x.group(1)] = x.group(2)
blog = len(m)
# the old WordPress pages the new site does not have (13; the other 27 kept their paths)
m.update({
    "/dental-savings-plan/": "/dental-saving-plan/",
    "/our-team-copy/": "/our-team/",
    "/blog-grid/": "/blog/", "/blog-list/": "/blog/", "/blog-masonry/": "/blog/",
    "/blog-portfolio/": "/blog/", "/blog-standard/": "/blog/",
    "/pricing/": "/special-offers/",
    "/cart/": "/", "/shop/": "/", "/my-account/": "/", "/wishlist-page/": "/", "/newsletter-popups/": "/",
})

routes = set()
for root, dirs, files in os.walk(HOME):
    if "assets" in root.split(os.sep) or "index.html" not in files:
        continue
    rel = os.path.relpath(root, HOME).replace(os.sep, "/")
    routes.add("/" if rel == "." else f"/{rel}/")

clash = sorted(k for k in m if k in routes)
if clash:
    raise SystemExit(f"a redirect would shadow a live page: {clash}")
missing = sorted(v for v in set(m.values()) if v not in routes)
if missing:
    raise SystemExit(f"a redirect points at no page: {missing}")
json.dump(m, open(os.path.join(HERE, "redirects.json"), "w", encoding="utf-8", newline=""), indent=1, sort_keys=True)
json.dump(sorted(routes), open(os.path.join(HERE, "routes.json"), "w", encoding="utf-8", newline=""), indent=1)
print(f"{blog} blog + {len(m) - blog} page redirects, {len(routes)} live routes")
