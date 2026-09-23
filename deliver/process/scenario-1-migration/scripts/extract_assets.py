# Promoted 2026-09-23 from bk-west-la-implants west-la-implants/workflows/01-content-intake/.tmp/scrapers/extract_assets.py
# (itself generalized from the bk-dr-nahlah 2026-07-30 pass). No client values: pass --site/--out.
"""Extract and DOWNLOAD every asset from a site. Generalized from the Dr. Nahlah pass.

A URL inventory is not the deliverable; the binaries on disk are. This covers the
classes an <img>-only pass structurally misses:

  * <img> src + every srcset variant + data-src / data-lazy-src / data-original
  * <picture><source> srcset variants
  * <video> src + poster, <audio> src
  * <link rel="icon|apple-touch-icon|mask-icon|manifest">
  * meta og:image / twitter:image
  * inline style="...url(...)..." background images
  * <style> blocks in the page
  * every linked stylesheet, resolved for url() refs (sprites, icons, art, webfonts)
  * inline <svg> elements, saved as standalone .svg files
  * document links (.pdf/.doc/.docx)
  * YouTube / Vimeo embeds, found by scanning EVERY attribute value, not just src
    (Elementor/ElementsKit hide IDs in href, data-elementor-lightbox-video and
    HTML-escaped JSON in data-settings)

For WordPress resized variants (name-800x600.jpg) it also derives and fetches the
full-size original (name.jpg).

Files land under <out>/downloads/ mirroring the remote path.

Usage:
  python extract_assets.py --site https://old-site.com \
      --out ../../03-graphic-resources/.tmp \
      --html-dir ../current-site-scrape/html
  ... --dry-run   discover only, write the manifest, download nothing
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
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

try:
    import truststore

    SSL_CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except ImportError:
    SSL_CTX = ssl.create_default_context()

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126 Safari/537.36")

ASSET_EXT = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".ico", ".bmp",
    ".mp4", ".webm", ".mov", ".m4v", ".ogg", ".mp3", ".wav",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".pdf", ".doc", ".docx",
}
WP_SIZE_RE = re.compile(r"^(?P<stem>.+?)-\d{2,4}x\d{2,4}(?P<ext>\.[a-z0-9]+)$", re.I)
URL_FUNC_RE = re.compile(r"url\(\s*['\"]?([^)'\"]+?)['\"]?\s*\)", re.I)
YT_RE = re.compile(r"(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=)|youtu\.be/)([\w-]{6,})", re.I)
VIMEO_RE = re.compile(r"player\.vimeo\.com/video/(\d+)", re.I)

CFG: dict = {}


def fetch_text(url: str, tries: int = 3) -> str:
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45, context=SSL_CTX) as r:
                raw = r.read()
            cs = "utf-8"
            m = re.search(rb'charset=["\']?([\w-]+)', raw[:4000], re.I)
            if m:
                cs = m.group(1).decode("ascii", "ignore")
            return raw.decode(cs, errors="replace")
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                print(f"  ! text fetch failed {url}: {e}", flush=True)
                return ""
            time.sleep(1.5 * (i + 1))
    return ""


class AssetParser(HTMLParser):
    def __init__(self, base: str):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.assets: set[tuple[str, str]] = set()
        self.stylesheets: set[str] = set()
        self.embeds: set[tuple[str, str]] = set()
        self.svgs: list[str] = []
        self._svg_depth = 0
        self._svg_buf: list[str] = []
        self._in_style = False
        self._style_buf: list[str] = []

    def _add(self, raw: str, kind: str) -> None:
        raw = (raw or "").strip()
        if not raw or raw.startswith(("data:", "javascript:", "#", "about:")):
            return
        url = urljoin(self.base, raw)
        if not url.startswith(("http://", "https://")):
            return
        self.assets.add((url.split("#")[0], kind))

    def _add_srcset(self, value: str, kind: str) -> None:
        for part in (value or "").split(","):
            cand = part.strip().split(" ")[0]
            if cand:
                self._add(cand, kind)

    def _scan_css_text(self, text: str, kind: str = "css-url") -> None:
        for ref in URL_FUNC_RE.findall(text or ""):
            self._add(ref, kind)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        a = {k.lower(): (v or "") for k, v in attrs}

        if self._svg_depth:
            self._svg_buf.append(self.get_starttag_text() or "")
            if tag == "svg":
                self._svg_depth += 1
            return

        if tag == "svg":
            self._svg_depth = 1
            self._svg_buf = [self.get_starttag_text() or ""]
            return

        if tag == "style":
            self._in_style = True
            self._style_buf = []

        if a.get("style"):
            self._scan_css_text(a["style"], "inline-style-bg")

        for val in a.values():
            if "youtu" in val or "vimeo" in val:
                for m in YT_RE.finditer(val):
                    self.embeds.add(("youtube", m.group(1)))
                for m in VIMEO_RE.finditer(val):
                    self.embeds.add(("vimeo", m.group(1)))

        if tag == "img":
            for key, kind in (("src", "img"), ("data-src", "img-lazy"),
                              ("data-lazy-src", "img-lazy"), ("data-original", "img-lazy")):
                if a.get(key):
                    self._add(a[key], kind)
            for key in ("srcset", "data-srcset", "data-lazy-srcset"):
                if a.get(key):
                    self._add_srcset(a[key], "img-srcset")
        elif tag == "source":
            if a.get("srcset"):
                self._add_srcset(a["srcset"], "source-srcset")
            if a.get("src"):
                self._add(a["src"], "source")
        elif tag in {"video", "audio"}:
            if a.get("src"):
                self._add(a["src"], tag)
            if a.get("poster"):
                self._add(a["poster"], "video-poster")
        elif tag == "link":
            rel = a.get("rel", "").lower()
            href = a.get("href", "")
            if "stylesheet" in rel and href:
                self.stylesheets.add(urljoin(self.base, href))
            elif any(k in rel for k in ("icon", "manifest", "mask-icon")):
                self._add(href, "icon")
        elif tag == "meta":
            prop = (a.get("property") or a.get("name") or "").lower()
            if prop in {"og:image", "og:image:secure_url", "twitter:image"}:
                self._add(a.get("content", ""), "social-image")
        elif tag in {"iframe", "embed"}:
            src = a.get("src", "") + " " + a.get("data-src", "")
            for m in YT_RE.finditer(src):
                self.embeds.add(("youtube", m.group(1)))
            for m in VIMEO_RE.finditer(src):
                self.embeds.add(("vimeo", m.group(1)))
        elif tag == "a":
            href = a.get("href", "")
            if Path(urlparse(href).path).suffix.lower() in {".pdf", ".doc", ".docx"}:
                self._add(href, "document")
        elif tag == "object":
            if a.get("data"):
                self._add(a["data"], "object")

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self._svg_depth:
            self._svg_buf.append(f"</{tag}>")
            if tag == "svg":
                self._svg_depth -= 1
                if self._svg_depth == 0:
                    self.svgs.append("".join(self._svg_buf))
            return
        if tag == "style" and self._in_style:
            self._in_style = False
            self._scan_css_text("".join(self._style_buf), "style-block-url")

    def handle_data(self, data):
        if self._svg_depth:
            self._svg_buf.append(data)
            return
        if self._in_style:
            self._style_buf.append(data)
            return
        for m in YT_RE.finditer(data):
            self.embeds.add(("youtube", m.group(1)))
        for m in VIMEO_RE.finditer(data):
            self.embeds.add(("vimeo", m.group(1)))


def local_path(url: str) -> Path:
    p = urlparse(url)
    rel = unquote(p.path).lstrip("/") or "index"
    host = p.netloc.replace(":", "_")
    base = CFG["downloads"] if host.lower().endswith(CFG["host"]) else CFG["downloads"] / "_external" / host
    out = base / rel
    if p.query:
        digest = hashlib.sha1(p.query.encode()).hexdigest()[:8]
        out = out.with_name(f"{out.stem}.{digest}{out.suffix}")
    # Windows MAX_PATH is 260 and plugin asset trees nest deeply enough to blow it
    # (premium-addons-for-elementor/assets/plugins/premium-addons-for-elementor/...).
    # Those are theme chrome anyway, so flatten rather than lose them.
    if len(str(out)) > 235:
        digest = hashlib.sha1(url.encode()).hexdigest()[:12]
        name = Path(rel).name[-60:]
        out = CFG["downloads"] / "_long" / f"{digest}-{name}"
    return out


def download(url: str) -> tuple[bool, int, str]:
    out = local_path(url)
    if out.exists() and out.stat().st_size > 0:
        return True, out.stat().st_size, "cached"
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": CFG["site"]})
        with urllib.request.urlopen(req, timeout=60, context=SSL_CTX) as r:
            data = r.read()
        if not data:
            return False, 0, "empty"
        out.write_bytes(data)
        return True, len(data), "ok"
    except Exception as e:  # noqa: BLE001
        return False, 0, str(e)[:90]


def page_sources(args) -> list[tuple[str, str]]:
    """Returns [(page_url, html)]. Prefers HTML already on disk from the content pass."""
    site_data = Path(args.site_data) if args.site_data else None
    urls: list[str] = []
    if site_data and site_data.exists():
        urls = [r["url"] for r in json.loads(site_data.read_text(encoding="utf-8")) if r.get("url")]
    if not urls:
        idx = fetch_text(f"{CFG['site']}/sitemap_index.xml")
        for cm in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", idx):
            urls += re.findall(r"<loc>\s*([^<]+?)\s*</loc>", fetch_text(cm))
    urls = list(dict.fromkeys(urls))

    html_dir = Path(args.html_dir) if args.html_dir else None
    out: list[tuple[str, str]] = []
    for u in urls:
        html = ""
        if html_dir and html_dir.exists():
            slug = re.sub(r"[^a-z0-9._-]+", "-", urlparse(u).path.strip("/").lower()) or "home"
            f = html_dir / f"{slug[:120]}.html"
            if f.exists():
                html = f.read_text(encoding="utf-8", errors="replace")
        out.append((u, html))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", required=True)
    ap.add_argument("--out", required=True, help="dir that receives downloads/ and the manifests")
    ap.add_argument("--html-dir", default=None, help="reuse HTML saved by scrape_site.py --save-html")
    ap.add_argument("--site-data", default=None, help="site-data.json from scrape_site.py")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--delay", type=float, default=0.35)
    args = ap.parse_args()

    site = args.site.rstrip("/")
    host = urlparse(site).netloc.lower()
    CFG["site"] = site
    CFG["host"] = host[4:] if host.startswith("www.") else host
    here = Path(args.out).resolve()
    here.mkdir(parents=True, exist_ok=True)
    CFG["downloads"] = here / "downloads"

    pages = page_sources(args)
    reused = sum(1 for _, h in pages if h)
    print(f"Scanning {len(pages)} pages for assets ({reused} from saved HTML)\n")

    assets: dict[str, dict] = {}
    embeds: dict[tuple[str, str], list[str]] = {}
    stylesheets: set[str] = set()
    svg_count = 0
    (here / "inline-svg").mkdir(parents=True, exist_ok=True)

    for i, (page, html) in enumerate(pages, 1):
        if not html:
            html = fetch_text(page)
            time.sleep(args.delay)
        if not html:
            continue
        p = AssetParser(page)
        p.feed(html)
        slug = (urlparse(page).path.strip("/") or "home").replace("/", "-")

        for url, kind in p.assets:
            rec = assets.setdefault(url, {"kinds": set(), "pages": set()})
            rec["kinds"].add(kind)
            rec["pages"].add(slug)
        for e in p.embeds:
            embeds.setdefault(e, []).append(slug)
        stylesheets |= p.stylesheets

        for svg in p.svgs:
            if len(svg) < 40:
                continue
            digest = hashlib.sha1(svg.encode()).hexdigest()[:10]
            f = here / "inline-svg" / f"{digest}.svg"
            if not f.exists():
                f.write_text(svg, encoding="utf-8")
                svg_count += 1
        print(f"[{i}/{len(pages)}] {slug[:44]:44s} +{len(p.assets):3d} assets, "
              f"{len(p.svgs)} svg, {len(p.embeds)} embeds", flush=True)

    print(f"\nResolving {len(stylesheets)} stylesheets for url() references")
    for i, css_url in enumerate(sorted(stylesheets), 1):
        css = fetch_text(css_url)
        if not css:
            continue
        found = 0
        for ref in URL_FUNC_RE.findall(css):
            if ref.startswith("data:"):
                continue
            full = urljoin(css_url, ref).split("#")[0].split("?")[0]
            if Path(urlparse(full).path).suffix.lower() in ASSET_EXT:
                rec = assets.setdefault(full, {"kinds": set(), "pages": set()})
                rec["kinds"].add("stylesheet-asset")
                rec["pages"].add(f"css:{Path(urlparse(css_url).path).name}")
                found += 1
        if found:
            print(f"  [{i}/{len(stylesheets)}] {Path(urlparse(css_url).path).name[:52]:52s} +{found}")
        time.sleep(0.15)

    # WordPress resized variants -> also grab the full-size original.
    for url in list(assets):
        path = urlparse(url).path
        m = WP_SIZE_RE.match(Path(path).name)
        if m:
            orig = url.replace(Path(path).name, m.group("stem") + m.group("ext"))
            if orig not in assets:
                assets[orig] = {"kinds": {"wp-original"}, "pages": set(assets[url]["pages"])}

    keep = {u: r for u, r in assets.items()
            if Path(urlparse(u).path).suffix.lower() in ASSET_EXT}
    print(f"\nDiscovered {len(keep)} downloadable assets "
          f"({len(assets) - len(keep)} non-asset URLs dropped)")
    print(f"Inline SVGs saved: {svg_count}")
    print(f"Video embeds: {len(embeds)}")

    rows = []
    if not args.dry_run:
        print("\nDownloading...")
        okc = failc = 0
        total = 0
        for i, url in enumerate(sorted(keep), 1):
            ok, size, note = download(url)
            total += size
            okc, failc = (okc + 1, failc) if ok else (okc, failc + 1)
            rows.append({
                "url": url,
                "local": str(local_path(url).relative_to(here)) if ok else "",
                "bytes": size,
                "status": note,
                "kinds": "|".join(sorted(keep[url]["kinds"])),
                "pages": "|".join(sorted(keep[url]["pages"])[:12]),
            })
            if i % 25 == 0 or not ok:
                print(f"  [{i}/{len(keep)}] ok={okc} fail={failc} "
                      f"{total / 1048576:.1f}MB" + (f"  <- {note} {url[:70]}" if not ok else ""))
            time.sleep(0.12)
        print(f"\nDownloaded {okc}/{len(keep)} assets, {total / 1048576:.1f} MB, {failc} failures")
    else:
        rows = [{"url": u, "local": "", "bytes": 0, "status": "dry-run",
                 "kinds": "|".join(sorted(r["kinds"])),
                 "pages": "|".join(sorted(r["pages"])[:12])} for u, r in sorted(keep.items())]

    with (here / "asset-manifest.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["url", "local", "bytes", "status", "kinds", "pages"])
        w.writeheader()
        w.writerows(rows)

    with (here / "video-embeds.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["provider", "id", "watch_url", "used_on_count", "used_on"])
        for (prov, vid), pages in sorted(embeds.items()):
            watch = (f"https://www.youtube.com/watch?v={vid}" if prov == "youtube"
                     else f"https://vimeo.com/{vid}")
            w.writerow([prov, vid, watch, len(set(pages)), " | ".join(sorted(set(pages)))])

    print(f"\nManifests: asset-manifest.csv ({len(rows)}), video-embeds.csv ({len(embeds)})")


if __name__ == "__main__":
    main()
