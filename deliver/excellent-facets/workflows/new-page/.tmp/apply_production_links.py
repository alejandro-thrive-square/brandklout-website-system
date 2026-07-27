"""Apply final public PDF URLs to the design sources before regenerating Webflow payloads."""

from pathlib import Path
import json
from bs4 import BeautifulSoup

BASE = Path(__file__).parent
LINK_MAP = BASE / "production-link-map.json"
SOURCE_FILES = [BASE / "final-design" / "index.html", BASE / "final-design" / "webflow-source.html"]

mapping = json.loads(LINK_MAP.read_text(encoding="utf-8"))["production_urls"]
missing = sorted(key for key, url in mapping.items() if not url)
if missing:
    raise SystemExit("Missing production URLs:\n- " + "\n- ".join(missing))

for source_file in SOURCE_FILES:
    soup = BeautifulSoup(source_file.read_text(encoding="utf-8"), "html.parser")
    links = soup.select("a[data-file-key]")
    seen = set()
    for link in links:
        key = link.get("data-file-key")
        if key not in mapping:
            raise SystemExit(f"{source_file.name}: no URL mapping for {key}")
        link["href"] = mapping[key]
        seen.add(key)
    absent = sorted(set(mapping) - seen)
    if absent:
        raise SystemExit(f"{source_file.name}: mapped keys absent from HTML: {absent}")
    source_file.write_text(str(soup), encoding="utf-8")
    print(f"Updated {len(links)} links in {source_file}")

print("Regenerate the Webflow payloads, rerun wf_tools.py qa, then paste all components in order.")
