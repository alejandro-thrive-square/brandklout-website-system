"""Build one Webflow clipboard copy page per semantic page section."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path


HERE = Path(__file__).resolve().parent
DESIGN = HERE.parent / "04-design" / ".tmp" / "final-design"
OUTPUT = HERE / ".tmp" / "section-components"
CONVERTER = HERE / "html_to_webflow.py"
QA = HERE / "wf_tools.py"

BASELINE_FOLDERS = [
    HERE / ".tmp" / "section-reviews",
    HERE / ".tmp" / "section-cta-quote",
    HERE / ".tmp" / "sections-new",
]

PAGE_ORDER = [
    "page-windows.html", "page-doors.html", "page-roofing.html",
    "page-siding.html", "page-gutters.html", "index.html",
    "page-our-process.html", "page-testimonials.html", "page-media.html",
    "page-financing.html", "page-about-us.html", "page-contact-us.html",
    "page-employment.html", "page-insurance-claims.html", "page-pricing.html",
    "page-blog.html", "page-service-locations.html", "page-portfolio.html",
    "page-privacy-policy.html", "page-terms-of-service.html",
]

STAGING_DERIVED = {
    "index.html", "page-gutters.html", "page-contact-us.html",
    "page-privacy-policy.html", "page-terms-of-service.html",
}

STAGING_CSS_URL = (
    "https://cdn.prod.website-files.com/6a234fcd5732d1f0a674156f/"
    "css/clifton-exteriors-lutum.webflow.shared.e5f8f38d9.css"
)


def fetch_text(url: str) -> str:
    request = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (compatible; Webzite component build)"}
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return response.read().decode("utf-8")
    except (ssl.SSLCertVerificationError, urllib.error.URLError) as error:
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        with urllib.request.urlopen(
            request, timeout=45, context=ssl._create_unverified_context()
        ) as response:
            return response.read().decode("utf-8")


def safe_reset_output() -> None:
    resolved = OUTPUT.resolve()
    expected_parent = (HERE / ".tmp").resolve()
    if resolved.parent != expected_parent or resolved.name != "section-components":
        raise RuntimeError(f"Refusing to reset unexpected output path: {resolved}")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)


def output_name(filename: str) -> str:
    return "home" if filename == "index.html" else Path(filename).stem


def selector_for(filename: str) -> str:
    if filename in STAGING_DERIVED:
        return "main.main-wrapper > section"
    return 'body > div[class^="page_"] > section'


def run(command: list[str]) -> str:
    result = subprocess.run(
        command, cwd=HERE, text=True, encoding="utf-8", errors="replace",
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
    )
    print(result.stdout, end="")
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command)}")
    return result.stdout


def paste_files(folder: Path) -> list[Path]:
    return sorted(folder.glob("paste_*.html"))


def node_count(copy_page: Path) -> int:
    text = copy_page.read_text(encoding="utf-8")
    match = re.search(
        r'<script type="application/json"[^>]*>(.*?)</script>', text, re.DOTALL
    )
    if not match:
        raise ValueError(f"Clipboard payload missing from {copy_page}")
    payload = json.loads(match.group(1))
    return len(payload["payload"]["nodes"])


def main(resume: bool = False) -> None:
    missing = [name for name in PAGE_ORDER if not (DESIGN / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing design pages: {', '.join(missing)}")

    if not resume:
        safe_reset_output()
    else:
        OUTPUT.mkdir(parents=True, exist_ok=True)
    staging_css = OUTPUT / "staging.webflow.css"
    if not staging_css.exists():
        staging_css.write_text(fetch_text(STAGING_CSS_URL), encoding="utf-8")

    completed: list[Path] = []
    manifest_pages = []

    for filename in PAGE_ORDER:
        name = output_name(filename)
        source = DESIGN / filename
        destination = OUTPUT / name
        against = [path for path in BASELINE_FOLDERS if path.exists()] + completed

        qa_command = [sys.executable, str(QA), "qa", str(destination)]
        if against:
            qa_command.extend(["--against", ",".join(str(path) for path in against)])

        files = paste_files(destination) if destination.exists() else []
        if resume and files:
            print(f"\n=== RECHECK {name} ===")
            try:
                run(qa_command)
                print(f"Reusing {len(files)} QA-passed section payloads for {name}.")
            except RuntimeError:
                print(f"Rebuilding {name} because its saved payloads did not pass QA.")
                shutil.rmtree(destination)
                files = []

        if not files:
            destination.mkdir()

            command = [
                sys.executable, str(CONVERTER), "--html", str(source),
                "--root", selector_for(filename), "--split", str(destination),
                "--avoid-suffix", name,
            ]
            if filename in STAGING_DERIVED:
                command.extend(["--css", str(staging_css)])
            if against:
                command.extend(["--avoid", ",".join(str(path) for path in against)])

            print(f"\n=== BUILD {name} ===")
            run(command)
            files = paste_files(destination)
            if not files:
                raise RuntimeError(f"No section payloads generated for {filename}")

            print(f"=== QA {name} ===")
            run(qa_command)

        manifest_pages.append({
            "page": name,
            "source": str(source.relative_to(HERE.parent.parent)),
            "source_type": "staging-derived" if filename in STAGING_DERIVED else "bespoke-design",
            "root_selector": selector_for(filename),
            "component_count": len(files),
            "paste_order": [
                {"position": index, "file": file.name, "nodes": node_count(file)}
                for index, file in enumerate(files, 1)
            ],
        })
        completed.append(destination)

    manifest = {
        "client": "Clifton Exteriors",
        "generated": date.today().isoformat(),
        "packaging": "one Webflow clipboard file per semantic section",
        "baseline_collision_folders": [str(path) for path in BASELINE_FOLDERS],
        "page_count": len(manifest_pages),
        "component_count": sum(page["component_count"] for page in manifest_pages),
        "pages": manifest_pages,
    }
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(
        f"\nBuilt {manifest['component_count']} independently pasteable sections "
        f"across {manifest['page_count']} pages."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", action="store_true", help="reuse existing folders that still pass QA")
    main(resume=parser.parse_args().resume)
