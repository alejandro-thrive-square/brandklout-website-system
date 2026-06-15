#!/usr/bin/env python3
"""Fetch a public web page and convert the readable HTML into Markdown."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
from html.parser import HTMLParser
import re
import sys
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


WORKFLOW_DIR = Path(__file__).resolve().parent
TMP_DIR = WORKFLOW_DIR / ".tmp"
DEFAULT_TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (compatible; WebziteMarkdownWorkflow/1.0; "
    "+https://webzite.studio)"
)


class MarkdownHTMLParser(HTMLParser):
    """Small HTML-to-Markdown converter tuned for page-copy extraction."""

    SKIP_TAGS = {"script", "style", "noscript", "svg", "canvas", "iframe"}
    BLOCK_TAGS = {
        "article",
        "aside",
        "blockquote",
        "body",
        "br",
        "dd",
        "div",
        "dl",
        "dt",
        "figcaption",
        "figure",
        "footer",
        "form",
        "header",
        "hr",
        "main",
        "nav",
        "p",
        "section",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
    }
    HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
    INLINE_MARKERS = {
        "strong": ("**", "**"),
        "b": ("**", "**"),
        "em": ("_", "_"),
        "i": ("_", "_"),
        "code": ("`", "`"),
    }

    def __init__(self, base_url: str, include_links: bool = True) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.include_links = include_links
        self.parts: list[str] = []
        self.skip_stack: list[str] = []
        self.list_stack: list[dict[str, int | str]] = []
        self.link_stack: list[str | None] = []
        self.title = ""
        self.in_title = False
        self.in_pre = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_dict = dict(attrs)

        if tag in self.SKIP_TAGS:
            self.skip_stack.append(tag)
            return
        if self.skip_stack:
            return

        if tag == "title":
            self.in_title = True
            return
        if tag in self.HEADING_TAGS:
            self._ensure_blank_line()
            self.parts.append("#" * int(tag[1]) + " ")
            return
        if tag == "pre":
            self._ensure_blank_line()
            self.parts.append("```text\n")
            self.in_pre = True
            return
        if tag in self.BLOCK_TAGS:
            self._ensure_blank_line()
            if tag == "blockquote":
                self.parts.append("> ")
            if tag == "hr":
                self.parts.append("---")
                self._ensure_blank_line()
            return
        if tag in {"ul", "ol"}:
            self._ensure_blank_line()
            self.list_stack.append({"tag": tag, "index": 1})
            return
        if tag == "li":
            self._ensure_new_line()
            depth = max(len(self.list_stack) - 1, 0)
            indent = "  " * depth
            marker = "- "
            if self.list_stack and self.list_stack[-1]["tag"] == "ol":
                marker = f"{self.list_stack[-1]['index']}. "
                self.list_stack[-1]["index"] = int(self.list_stack[-1]["index"]) + 1
            self.parts.append(indent + marker)
            return
        if tag == "a":
            href = attrs_dict.get("href")
            absolute_href = urljoin(self.base_url, href) if href else None
            self.link_stack.append(absolute_href)
            if self._should_link(absolute_href):
                self.parts.append("[")
            return
        if tag == "img":
            alt = clean_text(attrs_dict.get("alt") or "")
            src = attrs_dict.get("src")
            if alt and src:
                self.parts.append(f"![{escape_markdown(alt)}]({urljoin(self.base_url, src)})")
            return
        if tag in self.INLINE_MARKERS:
            self.parts.append(self.INLINE_MARKERS[tag][0])
            return

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.skip_stack:
            if tag == self.skip_stack[-1]:
                self.skip_stack.pop()
            return

        if tag == "title":
            self.in_title = False
            return
        if tag in self.HEADING_TAGS or tag in self.BLOCK_TAGS:
            self._ensure_blank_line()
            return
        if tag in {"ul", "ol"}:
            if self.list_stack:
                self.list_stack.pop()
            self._ensure_blank_line()
            return
        if tag == "li":
            self._ensure_new_line()
            return
        if tag == "a":
            href = self.link_stack.pop() if self.link_stack else None
            if self._should_link(href):
                self.parts.append(f"]({href})")
            return
        if tag in self.INLINE_MARKERS:
            self.parts.append(self.INLINE_MARKERS[tag][1])
            return
        if tag == "pre":
            self.parts.append("\n```")
            self._ensure_blank_line()
            self.in_pre = False

    def handle_data(self, data: str) -> None:
        if self.skip_stack:
            return
        if self.in_title:
            self.title += data
            return
        if self.in_pre:
            self.parts.append(data)
            return

        text = clean_text(data)
        if not text:
            return
        starts_with_space = bool(re.match(r"\s", data))
        ends_with_space = bool(re.search(r"\s$", data))
        if (
            (starts_with_space or self.parts)
            and self.parts
            and not self.parts[-1].endswith((" ", "\n", "(", "[", "`", "_", "*"))
        ):
            self.parts.append(" ")
        self.parts.append(escape_markdown(text))
        if ends_with_space:
            self.parts.append(" ")

    def get_markdown(self) -> str:
        markdown = "".join(self.parts)
        markdown = re.sub(r"[ \t]+\n", "\n", markdown)
        markdown = re.sub(r"\n{3,}", "\n\n", markdown)
        return markdown.strip() + "\n"

    def _ensure_new_line(self) -> None:
        if self.parts and not self.parts[-1].endswith("\n"):
            self.parts.append("\n")

    def _ensure_blank_line(self) -> None:
        if not self.parts:
            return
        joined_end = "".join(self.parts[-3:])
        if joined_end.endswith("\n\n"):
            return
        if joined_end.endswith("\n"):
            self.parts.append("\n")
        else:
            self.parts.append("\n\n")

    def _should_link(self, href: str | None) -> bool:
        return bool(
            self.include_links
            and href
            and not href.startswith(("mailto:", "tel:", "#"))
        )


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def escape_markdown(value: str) -> str:
    value = value.replace("\\", "\\\\")
    return re.sub(r"([*_`])", r"\\\1", value)


def validate_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL must be absolute and start with http:// or https://")
    return url


def fetch_html(url: str, timeout: int) -> tuple[str, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
    try:
        with urlopen(request, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            charset = response.headers.get_content_charset() or "utf-8"
            body = response.read()
            final_url = response.geturl()
    except HTTPError as exc:
        raise RuntimeError(f"HTTP {exc.code} while fetching {url}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not fetch {url}: {exc.reason}") from exc

    if "html" not in content_type and content_type:
        raise RuntimeError(f"Expected HTML but received Content-Type: {content_type}")
    return body.decode(charset, errors="replace"), final_url


def extract_body(html_source: str) -> str:
    match = re.search(r"<body\b[^>]*>(.*?)</body>", html_source, flags=re.I | re.S)
    return match.group(1) if match else html_source


def extract_title(html_source: str) -> str:
    match = re.search(r"<title\b[^>]*>(.*?)</title>", html_source, flags=re.I | re.S)
    return clean_text(match.group(1)) if match else ""


def build_markdown(url: str, html_source: str, include_links: bool) -> tuple[str, str]:
    parser = MarkdownHTMLParser(base_url=url, include_links=include_links)
    parser.feed(extract_body(html_source))
    parser.close()

    title = extract_title(html_source) or clean_text(parser.title) or urlparse(url).netloc
    markdown = parser.get_markdown()
    header = f"# {escape_markdown(title)}\n\nSource: {url}\n\n"
    if markdown.lstrip().startswith("# "):
        return title, f"Source: {url}\n\n{markdown}"
    return title, header + markdown


def artifact_path(url: str) -> Path:
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    return TMP_DIR / f"page-markdown-{stamp}-{digest}.md"


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape a public web page and convert the HTML content to Markdown."
    )
    parser.add_argument("url", help="Absolute page URL to scrape.")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Optional output path. Defaults to this workflow's .tmp folder.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"Network timeout in seconds. Default: {DEFAULT_TIMEOUT}.",
    )
    parser.add_argument(
        "--no-links",
        action="store_true",
        help="Omit destination URLs from Markdown links.",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print the full Markdown to stdout after writing the artifact.",
    )
    return parser.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    try:
        url = validate_url(args.url)
        html_source, final_url = fetch_html(url, timeout=args.timeout)
        title, markdown = build_markdown(final_url, html_source, include_links=not args.no_links)
    except (RuntimeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    output_path = args.output or artifact_path(final_url)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(markdown, encoding="utf-8")

    print(f"Title: {title}")
    print(f"Source: {final_url}")
    print(f"Markdown artifact: {output_path}")
    if args.stdout:
        print()
        print(markdown)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
