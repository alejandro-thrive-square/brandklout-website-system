# Promoted 2026-09-23 from bk-west-la-implants west-la-implants/workflows/01-content-intake/.tmp/scrapers/scrape_site.py
# (itself generalized from the bk-dr-nahlah 2026-07-30 pass). No client values: pass --site/--out.
"""Full-site content scraper, generalized from the Dr. Nahlah pass (2026-07-30).

Reads every URL a site exposes (robots.txt Sitemap:, then the usual sitemap
paths, then a BFS crawl fallback for sites with no sitemap at all) and writes:

  <out>/pages/<slug>.md     human-readable extract (SEO block + heading outline + body copy)
  <out>/data/<slug>.json    structured record (meta, headings, images, links, forms, JSON-LD)
  <out>/site-data.json      every record in one file
  <out>/media-manifest.csv  distinct image/media URLs with alt text and source pages

Text only. Binaries are the job of extract_assets.py.

Usage:
  python scrape_site.py --site https://old-site.com --out ../current-site-scrape
  python scrape_site.py --site https://example.com --out ./competitor --limit 5 --delay 1.5
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import ssl
import time
import urllib.request
from collections import deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

# This workstation sits behind a TLS-inspecting proxy whose CA lives in the
# Windows cert store but not in the Python bundled roots. truststore reads the OS store.
try:
    import truststore

    SSL_CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except ImportError:  # pragma: no cover
    SSL_CTX = ssl.create_default_context()

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126 Safari/537.36")

SKIP_TAGS = {"script", "style", "noscript", "svg", "iframe", "template"}
BLOCK_TAGS = {
    "p", "div", "section", "article", "header", "footer", "main", "aside",
    "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "br", "blockquote",
    "figcaption", "td", "th", "ul", "ol", "table", "form", "label",
}
NON_PAGE_EXT = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".ico", ".css",
    ".js", ".pdf", ".zip", ".mp4", ".webm", ".mp3", ".xml", ".json", ".woff",
    ".woff2", ".ttf", ".doc", ".docx",
}

STATE: dict[str, str] = {}  # site, host


def fetch(url: str, tries: int = 3) -> str:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
            with urllib.request.urlopen(req, timeout=45, context=SSL_CTX) as resp:
                raw = resp.read()
            charset = "utf-8"
            m = re.search(rb'charset=["\']?([\w-]+)', raw[:4000], re.I)
            if m:
                charset = m.group(1).decode("ascii", "ignore")
            return raw.decode(charset, errors="replace")
        except Exception as exc:  # noqa: BLE001
            if attempt == tries - 1:
                print(f"  ! FAILED {url}: {exc}", flush=True)
                return ""
            time.sleep(2 * (attempt + 1))
    return ""


def same_site(url: str) -> bool:
    net = urlparse(url).netloc.lower()
    if net.startswith("www."):
        net = net[4:]
    return net == STATE["host"]


def kind_for(sitemap_url: str) -> str:
    s = sitemap_url.lower()
    for key, kind in (("post-sitemap", "post"), ("posts-sitemap", "post"),
                      ("page-sitemap", "page"), ("pages-sitemap", "page"),
                      ("category", "category"), ("product", "product"),
                      ("post_tag", "tag"), ("author", "author")):
        if key in s:
            return kind
    return "page"


def discover_sitemaps(site: str) -> list[str]:
    found: list[str] = []
    robots = fetch(f"{site}/robots.txt")
    for m in re.finditer(r"(?im)^\s*sitemap:\s*(\S+)", robots or ""):
        found.append(m.group(1).strip())
    if not found:
        for guess in ("/sitemap_index.xml", "/sitemap.xml", "/wp-sitemap.xml",
                      "/sitemap-index.xml", "/page-sitemap.xml"):
            body = fetch(f"{site}{guess}")
            if "<loc>" in (body or ""):
                found.append(f"{site}{guess}")
                break
    return list(dict.fromkeys(found))


def sitemap_urls(site: str) -> list[tuple[str, str]]:
    """Expand sitemap indexes. Returns [(url, kind)]."""
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    queue = deque(discover_sitemaps(site))
    seen_maps: set[str] = set()
    while queue:
        sm = queue.popleft()
        if sm in seen_maps:
            continue
        seen_maps.add(sm)
        body = fetch(sm)
        if not body:
            continue
        is_index = "<sitemapindex" in body
        for loc in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", body):
            loc = loc.strip()
            if is_index:
                queue.append(loc)
                continue
            if loc in seen or not same_site(loc):
                continue
            if Path(urlparse(loc).path).suffix.lower() in NON_PAGE_EXT:
                continue
            seen.add(loc)
            out.append((loc, kind_for(sm)))
        time.sleep(0.3)
    return out


def crawl_urls(site: str, cap: int = 300, delay: float = 0.8) -> list[tuple[str, str]]:
    """BFS fallback for sites with no usable sitemap."""
    print("  no sitemap found, falling back to a BFS crawl", flush=True)
    seen = {site + "/"}
    queue = deque([site + "/"])
    out: list[tuple[str, str]] = []
    while queue and len(out) < cap:
        url = queue.popleft()
        html = fetch(url)
        if not html:
            continue
        out.append((url, "page"))
        print(f"  crawl [{len(out)}] {url}", flush=True)
        for href in re.findall(r'href=["\']([^"\']+)["\']', html):
            full = urljoin(url, href).split("#")[0].rstrip("/") + "/"
            if not full.startswith("http") or not same_site(full):
                continue
            if Path(urlparse(full).path).suffix.lower() in NON_PAGE_EXT:
                continue
            if any(x in full for x in ("/wp-admin", "/wp-json", "?", "/feed/")):
                continue
            if full not in seen:
                seen.add(full)
                queue.append(full)
        time.sleep(delay)
    return out


class Extractor(HTMLParser):
    """Single-pass extraction of meta, headings, text, images, links and forms."""

    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base = base_url
        self.meta: dict[str, str] = {}
        self.title = ""
        self.headings: list[tuple[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.forms: list[dict[str, str]] = []
        self.jsonld: list[str] = []
        self.blocks: list[str] = []

        self._skip_depth = 0
        self._in_title = False
        self._in_jsonld = False
        self._heading: str | None = None
        self._heading_buf: list[str] = []
        self._link_href: str | None = None
        self._link_buf: list[str] = []
        self._buf: list[str] = []

    def _flush(self) -> None:
        text = re.sub(r"\s+", " ", "".join(self._buf)).strip()
        if text:
            self.blocks.append(text)
        self._buf = []

    @staticmethod
    def _attrs(attrs) -> dict[str, str]:
        return {k.lower(): (v or "") for k, v in attrs}

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        a = self._attrs(attrs)

        if tag == "script" and "application/ld+json" in a.get("type", "").lower():
            self._in_jsonld = True
            self._skip_depth += 1
            return
        if tag in SKIP_TAGS:
            self._skip_depth += 1
            return
        if self._skip_depth:
            return

        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = a.get("name") or a.get("property") or a.get("http-equiv")
            if key and a.get("content"):
                self.meta[key.lower()] = a["content"].strip()
        elif tag == "link" and "canonical" in a.get("rel", "").lower():
            self.meta["canonical"] = a.get("href", "")
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._flush()
            self._heading = tag
            self._heading_buf = []
        elif tag == "img":
            src = a.get("src") or a.get("data-src") or a.get("data-lazy-src") or ""
            if src and not src.startswith("data:"):
                self.images.append({
                    "src": urljoin(self.base, src),
                    "alt": a.get("alt", "").strip(),
                    "title": a.get("title", "").strip(),
                    "width": a.get("width", ""),
                    "height": a.get("height", ""),
                    "loading": a.get("loading", ""),
                })
        elif tag == "source":
            src = a.get("srcset") or a.get("src") or ""
            first = src.split(",")[0].strip().split(" ")[0]
            if first and not first.startswith("data:"):
                self.images.append({"src": urljoin(self.base, first), "alt": "", "title": "",
                                    "width": "", "height": "", "loading": "source-tag"})
        elif tag == "a":
            self._link_href = a.get("href", "")
            self._link_buf = []
        elif tag == "form":
            self.forms.append({
                "action": urljoin(self.base, a.get("action", "")),
                "method": a.get("method", "get"),
                "id": a.get("id", ""),
                "class": a.get("class", ""),
            })
        elif tag in BLOCK_TAGS:
            self._flush()

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self._in_jsonld and tag == "script":
            self._in_jsonld = False
            self._skip_depth = max(0, self._skip_depth - 1)
            return
        if tag in SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
            return
        if self._skip_depth:
            return

        if tag == "title":
            self._in_title = False
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"} and self._heading == tag:
            text = re.sub(r"\s+", " ", "".join(self._heading_buf)).strip()
            if text:
                self.headings.append((tag, text))
                self.blocks.append(f"@@{tag}@@{text}")
            self._heading = None
            self._heading_buf = []
        elif tag == "a" and self._link_href is not None:
            label = re.sub(r"\s+", " ", "".join(self._link_buf)).strip()
            href = self._link_href
            if href and not href.startswith(("javascript:", "#")):
                self.links.append({"href": urljoin(self.base, href), "text": label})
            self._link_href = None
            self._link_buf = []
        elif tag in BLOCK_TAGS:
            self._flush()

    def handle_data(self, data):
        if self._in_jsonld:
            self.jsonld.append(data)
            return
        if self._skip_depth:
            return
        if self._in_title:
            self.title += data
            return
        if self._heading is not None:
            # Heading text is emitted once via the @@h@@ marker on the end tag;
            # keep it out of the body buffer so it is not printed twice.
            self._heading_buf.append(data)
            if self._link_href is not None:
                self._link_buf.append(data)
            return
        if self._link_href is not None:
            self._link_buf.append(data)
        self._buf.append(data)

    def close(self):  # noqa: D102
        super().close()
        self._flush()


def slugify(url: str) -> str:
    """Filename-safe slug. Capped hard: Windows MAX_PATH is 260 and these live several
    folders deep, so a long WP post slug (they run past 100 chars) blows the open()."""
    path = urlparse(url).path.strip("/")
    slug = re.sub(r"[^a-z0-9._-]+", "-", path.lower()).strip("-") or "home"
    if len(slug) > 60:
        slug = slug[:52].rstrip("-") + "-" + hashlib.sha1(slug.encode()).hexdigest()[:7]
    return slug


PHONE_RE = re.compile(r"\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")
EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b")


def build_record(url: str, kind: str, html: str) -> dict:
    ex = Extractor(url)
    ex.feed(html)
    ex.close()

    body_lines: list[str] = []
    seen_line: set[str] = set()
    for block in ex.blocks:
        if block.startswith("@@h"):
            tag, text = block[2:].split("@@", 1)
            body_lines.append(f"\n{'#' * int(tag[1])} {text}\n")
            continue
        if len(block) < 2:
            continue
        key = block[:120]
        if key in seen_line:  # themes repeat nav and footer strings
            continue
        seen_line.add(key)
        body_lines.append(block)

    text_all = " ".join(b for b in ex.blocks if not b.startswith("@@"))
    internal = [l for l in ex.links if same_site(l["href"])]
    external = [l for l in ex.links if l not in internal and l["href"].startswith("http")]

    ld = []
    for chunk in ex.jsonld:
        chunk = chunk.strip()
        if not chunk:
            continue
        try:
            ld.append(json.loads(chunk))
        except json.JSONDecodeError:
            pass

    return {
        "url": url,
        "kind": kind,
        "slug": slugify(url),
        "seo": {
            "title_tag": ex.title.strip(),
            "meta_description": ex.meta.get("description", ""),
            "canonical": ex.meta.get("canonical", ""),
            "robots": ex.meta.get("robots", ""),
            "og_title": ex.meta.get("og:title", ""),
            "og_description": ex.meta.get("og:description", ""),
            "og_image": ex.meta.get("og:image", ""),
            "og_type": ex.meta.get("og:type", ""),
            "twitter_card": ex.meta.get("twitter:card", ""),
            "article_published": ex.meta.get("article:published_time", ""),
            "article_modified": ex.meta.get("article:modified_time", ""),
        },
        "headings": [{"level": h[0], "text": h[1]} for h in ex.headings],
        "h1": [h[1] for h in ex.headings if h[0] == "h1"],
        "word_count": len(text_all.split()),
        "body_markdown": "\n\n".join(body_lines).strip(),
        "images": ex.images,
        "image_count": len(ex.images),
        "internal_links": internal,
        "external_links": external,
        "forms": ex.forms,
        "phones": sorted({p.strip() for p in PHONE_RE.findall(text_all)}),
        "emails": sorted(set(EMAIL_RE.findall(text_all))),
        "jsonld_types": sorted({
            t for obj in ld for t in (
                [obj.get("@type")] if isinstance(obj, dict) and isinstance(obj.get("@type"), str)
                else (obj.get("@type") or []) if isinstance(obj, dict)
                else []
            ) if t
        }),
        "jsonld": ld,
    }


def write_markdown(rec: dict, path: Path) -> None:
    seo = rec["seo"]
    lines = [
        f"# {rec['slug']}",
        "",
        f"- **URL**: {rec['url']}",
        f"- **Type**: {rec['kind']}",
        f"- **Title tag**: {seo['title_tag']}",
        f"- **Meta description**: {seo['meta_description']}",
        f"- **Canonical**: {seo['canonical']}",
        f"- **Robots**: {seo['robots'] or '(default)'}",
        f"- **Word count**: {rec['word_count']}",
        f"- **Images**: {rec['image_count']}",
        f"- **Schema types**: {', '.join(rec['jsonld_types']) or '(none)'}",
        f"- **Phones on page**: {', '.join(rec['phones']) or '(none)'}",
        "",
        "## Heading outline",
        "",
    ]
    for h in rec["headings"]:
        lines.append(f"{'  ' * (int(h['level'][1]) - 1)}- `{h['level']}` {h['text']}")
    lines += ["", "## Page content", "", rec["body_markdown"], "", "## Images", ""]
    for img in rec["images"]:
        lines.append(f"- `{img['src']}` - alt: {img['alt'] or '(empty)'}")
    if rec["forms"]:
        lines += ["", "## Forms", ""]
        for f in rec["forms"]:
            lines.append(f"- {f['method'].upper()} `{f['action']}` (id={f['id'] or '-'} class={f['class'] or '-'})")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", required=True, help="https://host, no trailing slash")
    ap.add_argument("--out", required=True)
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--delay", type=float, default=0.8)
    ap.add_argument("--crawl-cap", type=int, default=300)
    ap.add_argument("--save-html", action="store_true", help="also keep the raw HTML per page")
    args = ap.parse_args()

    site = args.site.rstrip("/")
    STATE["site"] = site
    host = urlparse(site).netloc.lower()
    STATE["host"] = host[4:] if host.startswith("www.") else host

    out = Path(args.out).resolve()
    (out / "pages").mkdir(parents=True, exist_ok=True)
    (out / "data").mkdir(parents=True, exist_ok=True)
    if args.save_html:
        (out / "html").mkdir(parents=True, exist_ok=True)

    urls = sitemap_urls(site)
    if not urls:
        urls = crawl_urls(site, cap=args.crawl_cap, delay=args.delay)
    if args.limit:
        urls = urls[:args.limit]
    print(f"Discovered {len(urls)} URLs on {site}", flush=True)

    records: list[dict] = []
    for i, (url, kind) in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] {kind:9s} {url}", flush=True)
        html = fetch(url)
        if not html:
            records.append({"url": url, "kind": kind, "slug": slugify(url), "error": "fetch failed"})
            continue
        rec = build_record(url, kind, html)
        write_markdown(rec, out / "pages" / f"{rec['slug']}.md")
        (out / "data" / f"{rec['slug']}.json").write_text(
            json.dumps(rec, indent=2, ensure_ascii=False), encoding="utf-8")
        if args.save_html:
            (out / "html" / f"{rec['slug']}.html").write_text(html, encoding="utf-8")
        records.append(rec)
        time.sleep(args.delay)

    (out / "site-data.json").write_text(
        json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")

    media: dict[str, dict] = {}
    for rec in records:
        for img in rec.get("images", []):
            entry = media.setdefault(img["src"], {"alt": img["alt"], "pages": []})
            if not entry["alt"] and img["alt"]:
                entry["alt"] = img["alt"]
            entry["pages"].append(rec["slug"])
    with (out / "media-manifest.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["url", "alt", "used_on_count", "used_on"])
        for src, meta in sorted(media.items()):
            w.writerow([src, meta["alt"], len(meta["pages"]), " | ".join(sorted(set(meta["pages"])))])

    ok = [r for r in records if "error" not in r]
    print(f"\nDone. {len(ok)}/{len(records)} pages scraped, {len(media)} distinct media URLs.")


if __name__ == "__main__":
    main()
