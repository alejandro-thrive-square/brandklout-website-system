#!/usr/bin/env python3
"""Load a URL in headless Chromium via Playwright and produce agent-readable artifacts."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
import traceback
from pathlib import Path

WORKFLOW_DIR = Path(__file__).resolve().parent
TMP_DIR = WORKFLOW_DIR / ".tmp"
DEFAULT_TIMEOUT = 30
DEFAULT_VIEWPORT = "1440x900"

BREAKPOINTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 375, "height": 812},
}


def _stamp(url: str) -> tuple[str, str]:
    ts = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    digest = hashlib.sha1(url.encode()).hexdigest()[:10]
    return ts, digest


def _build_snapshot_md(title: str, url: str, visible_text: str) -> str:
    return f"# {title}\n\nSource: {url}\n\n## Visible Text\n\n{visible_text}\n"


def _capture_at_viewport(
    page,
    width: int,
    height: int,
    label: str,
    ts: str,
    digest: str,
    out: Path,
    wait_for: str | None,
    timeout_ms: int,
) -> dict:
    page.set_viewport_size({"width": width, "height": height})
    page.wait_for_timeout(500)

    if wait_for:
        try:
            page.wait_for_selector(wait_for, timeout=timeout_ms)
        except Exception:
            pass

    screenshot_path = out / f"screenshot-{label}-{ts}-{digest}.png"
    page.screenshot(path=str(screenshot_path), full_page=True)

    try:
        visible_text = page.inner_text("body")
    except Exception:
        visible_text = "(could not extract visible text)"

    snapshot_path = out / f"snapshot-{label}-{ts}-{digest}.md"
    title = page.title() or page.url
    snapshot_md = _build_snapshot_md(title, page.url, visible_text)
    snapshot_path.write_text(snapshot_md, encoding="utf-8")

    return {
        "label": label,
        "viewport": f"{width}x{height}",
        "screenshot": str(screenshot_path),
        "snapshot": str(snapshot_path),
    }


def run(
    url: str,
    viewport: str = DEFAULT_VIEWPORT,
    responsive: bool = False,
    wait_for: str | None = None,
    timeout: int = DEFAULT_TIMEOUT,
    output_dir: Path | None = None,
    print_stdout: bool = False,
) -> dict:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "ERROR: playwright is not installed.\n"
            "Run: pip install -r requirements.txt && python -m playwright install chromium",
            file=sys.stderr,
        )
        sys.exit(1)

    out = output_dir or TMP_DIR
    out.mkdir(parents=True, exist_ok=True)

    ts, digest = _stamp(url)
    log_path = out / f"console-{ts}-{digest}.log"

    console_lines: list[str] = []
    page_errors: list[str] = []
    failed_requests: list[str] = []

    if responsive:
        viewports = BREAKPOINTS
    else:
        w, h = (int(v) for v in viewport.split("x"))
        viewports = {"desktop": {"width": w, "height": h}}

    first_vp = next(iter(viewports.values()))
    timeout_ms = timeout * 1000

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport=first_vp)
        page = context.new_page()

        page.on("console", lambda msg: console_lines.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        page.on(
            "requestfailed",
            lambda req: failed_requests.append(
                f"{req.method} {req.url} — {req.failure}"
            ),
        )

        try:
            page.goto(url, wait_until="networkidle", timeout=timeout_ms)
        except Exception as exc:
            console_lines.append(f"[navigation-error] {exc}")

        title = page.title() or url
        final_url = page.url

        captures = []
        for label, vp in viewports.items():
            capture = _capture_at_viewport(
                page, vp["width"], vp["height"], label,
                ts, digest, out, wait_for, timeout_ms,
            )
            captures.append(capture)

        browser.close()

    log_lines = []
    if console_lines:
        log_lines.append("=== Console ===")
        log_lines.extend(console_lines)
    if page_errors:
        log_lines.append("\n=== Page Errors ===")
        log_lines.extend(page_errors)
    if failed_requests:
        log_lines.append("\n=== Failed Requests ===")
        log_lines.extend(failed_requests)
    log_path.write_text("\n".join(log_lines) if log_lines else "(no console output)", encoding="utf-8")

    result = {
        "captures": captures,
        "log": str(log_path),
        "url": final_url,
        "title": title,
        "status": "ok",
    }

    print(json.dumps(result, indent=2))

    if print_stdout:
        for cap in captures:
            print(f"\n--- Snapshot ({cap['label']} {cap['viewport']}) ---")
            print(Path(cap["snapshot"]).read_text(encoding="utf-8"))

    return result


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load a URL in headless Chromium and produce agent-readable artifacts."
    )
    parser.add_argument("url", help="Absolute page URL to load.")
    parser.add_argument(
        "--wait-for",
        help="CSS selector to wait for before capturing.",
    )
    parser.add_argument(
        "--viewport",
        default=DEFAULT_VIEWPORT,
        help=f"Viewport as WxH (default: {DEFAULT_VIEWPORT}). Ignored when --responsive is set.",
    )
    parser.add_argument(
        "--responsive",
        action="store_true",
        help="Capture at desktop (1440x900), tablet (768x1024), and mobile (375x812).",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"Navigation timeout in seconds (default: {DEFAULT_TIMEOUT}).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Override default .tmp/ output directory.",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Also print the snapshot markdown to stdout.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    from urllib.parse import urlparse

    parsed = urlparse(args.url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        print("ERROR: URL must be absolute and start with http:// or https://", file=sys.stderr)
        return 1

    try:
        run(
            url=args.url,
            viewport=args.viewport,
            responsive=args.responsive,
            wait_for=args.wait_for,
            timeout=args.timeout,
            output_dir=args.output_dir,
            print_stdout=args.stdout,
        )
    except Exception:
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
