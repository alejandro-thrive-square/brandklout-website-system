# Client script, 2026-09-30. Webflow branch of step 11: the blog comes from the CMS, not from
# export-posts.mjs (scrape_site.py marks every Webflow page `page`, so `--scrape` finds 0 posts, and
# the scrape would carry the page chrome anyway).
#
# Input: posts/webflow-cms.json, the raw read of the Blogs, Blog types and Categories collections
# through the webflow-brandklout MCP (get_collection_details + list_collection_items, read-only).
# Output: the same shape export-posts.mjs writes (posts.json, posts/<slug>.md, posts-redirects.csv),
# plus the fields only the CMS has: faq[], metaTitle, metaDescription, blogType, itemId.
"""Usage (from the step's output/ folder):
  python code/posts_from_webflow_cms.py --cms posts/webflow-cms.json --origin https://www.old.com --prefix /blog --out posts
"""

from __future__ import annotations

import argparse
import html as htmllib
import json
import re
from pathlib import Path
from urllib.parse import urlparse


def plain(markup: str) -> str:
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", markup))).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cms", required=True)
    ap.add_argument("--origin", required=True)
    ap.add_argument("--prefix", default="/blog")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    origin = args.origin.rstrip("/")
    host = urlparse(origin).netloc.removeprefix("www.")
    cols = json.loads(Path(args.cms).read_text(encoding="utf-8"))["collections"]
    names = {i["id"]: i["fieldData"]["name"] for k in ("types", "categories") for i in cols[k]["items"]}
    old_prefix = "/" + cols["blog-schema"]["slug"]

    posts = []
    for it in cols["blog-items"]["items"]:
        fd = it["fieldData"]
        body = fd.get("content") or ""
        thumb = (fd.get("thumbnail") or {}).get("url", "")
        images = list(dict.fromkeys(re.findall(r'<img[^>]+src="([^"]+)"', body, re.I) + ([thumb] if thumb else [])))
        links = list(dict.fromkeys(h for h in re.findall(r'href="([^"]+)"', body, re.I) if host in h or h.startswith("/")))
        faq = [{"q": fd[f"faq-question-{n}"], "a": fd.get(f"faq-answer-{n}", "")}
               for n in range(1, 11) if fd.get(f"faq-question-{n}")]
        text = plain(body)
        cats = [names[c] for c in ([fd["category"]] if fd.get("category") else []) if c in names]
        posts.append({
            "slug": fd["slug"], "title": fd["name"],
            "date": (it.get("createdOn") or "")[:10], "modified": (it.get("lastUpdated") or "")[:10],
            "published": (it.get("lastPublished") or "")[:10],
            "oldUrl": f"{origin}{old_prefix}/{fd['slug']}", "author": "",
            "html": body, "excerpt": fd.get("short-description") or text[:170],
            "categories": cats, "tags": [], "featuredImage": thumb,
            "images": images, "oldLinks": links, "words": len(text.split()),
            "newPath": f"{args.prefix}/{fd['slug']}",
            "faq": faq, "metaTitle": fd.get("meta-title", ""), "metaDescription": fd.get("meta-description", ""),
            "blogType": names.get(fd.get("blog-type"), ""), "itemId": it["id"],
            "isDraft": bool(it.get("isDraft")), "isArchived": bool(it.get("isArchived")),
        })
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)

    out = Path(args.out)
    (out / "posts").mkdir(parents=True, exist_ok=True)
    with (out / "posts.json").open("w", encoding="utf-8", newline="") as fh:
        json.dump(posts, fh, indent=1, ensure_ascii=False)
    for p in posts:
        md = [f"# {p['title']}", "",
              f"- Old URL: {p['oldUrl']}", f"- New path: {p['newPath']}",
              f"- Created: {p['date']}  ·  Published: {p['published']}",
              f"- Type: {p['blogType']}  ·  Categories: {', '.join(p['categories']) or 'none'}",
              f"- Words: {p['words']}  ·  FAQ pairs: {len(p['faq'])}",
              f"- Featured image: {p['featuredImage']}",
              f"- Meta title: {p['metaTitle']}", f"- Meta description: {p['metaDescription']}",
              f"- Internal links: {', '.join(p['oldLinks']) or 'none'}", "",
              "## Body (HTML as stored in the CMS)", "", p["html"], ""]
        if p["faq"]:
            md += ["## FAQ", ""]
            for f in p["faq"]:
                md += [f"**{f['q']}**", "", f["a"], ""]
        with (out / "posts" / f"{p['slug']}.md").open("w", encoding="utf-8", newline="") as fh:
            fh.write("\n".join(md))
    rows = ["old path,new path"] + [f"{old_prefix}/{p['slug']},{p['newPath']}" for p in posts
                                    if f"{old_prefix}/{p['slug']}" != p["newPath"]]
    with (out / "posts-redirects.csv").open("w", encoding="utf-8", newline="") as fh:
        fh.write("\n".join(rows) + "\n")

    print(f"{len(posts)} posts, {sum(p['words'] for p in posts)} words, {sum(len(p['faq']) for p in posts)} FAQ pairs, "
          f"{len({i for p in posts for i in p['images']})} images, {len(rows) - 1} redirects")
    for p in posts:
        print(f"  {p['date']}  {p['words']:5d} w  {len(p['faq']):2d} faq  links {len(p['oldLinks'])}  {p['slug']}")


if __name__ == "__main__":
    main()
