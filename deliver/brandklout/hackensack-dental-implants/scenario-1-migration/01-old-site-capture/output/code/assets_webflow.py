# Client wrapper, 2026-09-30. Runs the step's extract_assets.py / catalogue_assets.py unchanged
# except for two things the Webflow CDN and this worktree's path length need:
#
# 1. Short local paths. The step output folder is already ~180 characters deep and this machine has
#    LongPathsEnabled = 0, so `downloads/_external/cdn.prod.website-files.com/<site>/<id>_<name>`
#    passes 260 and every write fails with Errno 2 (623 of 681 on the first run). Files land flat in
#    `downloads/wf/<last 6 of the file id>_<stem, 30 chars><-p-NNN><ext>`; `asset-manifest.csv`
#    keeps the URL beside each local path.
# 2. Webflow variants. Responsive copies are `name-p-500.jpg`, not WordPress `name-800x600.jpg`,
#    and nothing here is plugin chrome.
"""Usage (from the step's output/ folder):
  python code/assets_webflow.py extract --site https://www.old.com --out assets --html-dir scrape/html --site-data scrape/site-data.json
  python code/assets_webflow.py catalogue --dir assets --site old.com
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

WF_ID_RE = re.compile(r"^(?P<id>[0-9a-f]{24})_(?P<name>.+)$")
WF_VARIANT_RE = re.compile(r"^(?P<stem>.+?)(?P<variant>-p-\d{3,4})$")
STEM_MAX = 30
_taken: dict[str, str] = {}


def short_name(url: str) -> str:
    p = urlparse(url)
    name = unquote(p.path).replace("\\", "/").rsplit("/", 1)[-1] or "index"
    m = WF_ID_RE.match(name)
    tag = m.group("id")[-6:] if m else hashlib.sha1(url.encode()).hexdigest()[:6]
    if m:
        name = m.group("name")
    stem, dot, ext = name.rpartition(".")
    if not dot:
        stem, ext = name, ""
    v = WF_VARIANT_RE.match(stem)
    variant = v.group("variant") if v else ""
    if v:
        stem = v.group("stem")
    stem = re.sub(r'[<>:"|?*]+', "-", stem)[:STEM_MAX].rstrip(" .")
    out = f"{tag}_{stem}{variant}{'.' + ext if ext else ''}"
    if p.query:
        out = f"{hashlib.sha1(p.query.encode()).hexdigest()[:4]}-{out}"
    key = out.lower()
    if _taken.setdefault(key, url) != url:
        out = f"{hashlib.sha1(url.encode()).hexdigest()[:4]}-{out}"
    return out


def run_extract() -> None:
    import extract_assets as ea

    def local_path(url: str) -> Path:
        host = urlparse(url).netloc.lower()
        bucket = "wf" if host.endswith("website-files.com") else "ext"
        return ea.CFG["downloads"] / bucket / short_name(url)

    ea.local_path = local_path
    ea.main()


def run_catalogue() -> None:
    import catalogue_assets as ca

    ca.WP_SIZE_RE = WF_VARIANT_RE
    ca.PLUGIN_MARKERS = ("/wp-content/plugins/", "/wp-includes/", "/wp-content/themes/")
    ca.main()


if __name__ == "__main__":
    mode = sys.argv.pop(1) if len(sys.argv) > 1 else ""
    if mode == "extract":
        run_extract()
    elif mode == "catalogue":
        run_catalogue()
    else:
        sys.exit(__doc__)
