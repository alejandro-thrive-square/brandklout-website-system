"""Apply the local preview shell and refresh missing staging-derived routes."""

from __future__ import annotations

import ssl
import re
import urllib.error
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup, Comment


ROOT = Path(__file__).resolve().parent
STAGING = "https://clifton-exteriors-lutum.webflow.io"
SHELL_LINK = '<link rel="stylesheet" href="site-shell.css" data-cx-site-shell>'
SHELL_SCRIPT = '<script src="site-shell.js" defer data-cx-site-shell></script>'

STAGING_ROUTES = {
    "index.html": "/",
    "page-gutters.html": "/gutters",
    "page-contact-us.html": "/contact-us",
    "page-privacy-policy.html": "/privacy-policy",
    "page-terms-of-service.html": "/terms-of-service",
}


def fetch_staging(path: str) -> str:
    request = urllib.request.Request(
        STAGING + path,
        headers={"User-Agent": "Mozilla/5.0 (compatible; Webzite local design sync)"},
    )
    context = ssl.create_default_context()
    try:
        with urllib.request.urlopen(request, timeout=30, context=context) as response:
            return response.read().decode("utf-8")
    except (ssl.SSLCertVerificationError, urllib.error.URLError) as error:
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        # Local Python installations can lack the Windows CA bundle. The source
        # is a fixed public Webflow staging hostname, so retry only that host.
        with urllib.request.urlopen(
            request, timeout=30, context=ssl._create_unverified_context()
        ) as response:
            return response.read().decode("utf-8")


def strip_live_shell(soup: BeautifulSoup) -> None:
    for selector in (
        ".mega-nav",
        ".navbar_component",
        ".navbar1_component",
        ".section_navbar",
        ".section_footer",
    ):
        for node in soup.select(selector):
            node.decompose()


def add_shell_assets(soup: BeautifulSoup) -> None:
    for node in soup.select("[data-cx-site-shell]"):
        node.decompose()
    if soup.head is None:
        head = soup.new_tag("head")
        soup.html.insert(0, head)
    soup.head.append(BeautifulSoup(SHELL_LINK, "html.parser"))
    soup.head.append(BeautifulSoup(SHELL_SCRIPT, "html.parser"))


def refresh_staging_routes() -> None:
    for filename, route in STAGING_ROUTES.items():
        soup = BeautifulSoup(fetch_staging(route), "html.parser")
        strip_live_shell(soup)
        add_shell_assets(soup)
        marker = Comment(
            f" Local design source refreshed from {STAGING}{route}; shared shell injected by site-shell.js. "
        )
        soup.body.insert(0, marker)
        (ROOT / filename).write_text(str(soup), encoding="utf-8")


def update_existing_pages() -> None:
    staging_names = set(STAGING_ROUTES)
    for path in sorted(ROOT.glob("page-*.html")):
        if path.name in staging_names:
            continue
        source = path.read_text(encoding="utf-8")
        source = re.sub(
            r"\s*<(?:link|script)\b[^>]*data-cx-site-shell[^>]*>(?:</script>)?",
            "",
            source,
            flags=re.IGNORECASE,
        )
        assets = f"\n{SHELL_LINK}\n{SHELL_SCRIPT}\n"
        source, replacements = re.subn(
            r"</head>", assets + "</head>", source, count=1, flags=re.IGNORECASE
        )
        if replacements != 1:
            raise ValueError(f"Missing </head> in {path}")
        path.write_text(source, encoding="utf-8")


if __name__ == "__main__":
    refresh_staging_routes()
    update_existing_pages()
    count = len(list(ROOT.glob("page-*.html"))) + int((ROOT / "index.html").exists())
    print(f"Local shell synchronized across {count} routes.")
