#!/usr/bin/env python3
"""Record a page, extract dense frames, and save rendered code artifacts."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import shutil
import subprocess
import sys
import traceback
from pathlib import Path
from urllib.parse import urlparse

WORKFLOW_DIR = Path(__file__).resolve().parent
TMP_DIR = WORKFLOW_DIR / ".tmp"
DEFAULT_VIEWPORT = "1440x900"
DEFAULT_FPS = 5
DEFAULT_SCROLL_DURATION = 90
DEFAULT_TIMEOUT = 60
DEFAULT_MAX_RESOURCE_BYTES = 1_500_000
DEFAULT_WAIT_UNTIL = "domcontentloaded"
DEFAULT_FRAME_START_OFFSET = 0.0
WAIT_UNTIL_CHOICES = ("commit", "domcontentloaded", "load", "networkidle")

COOKIE_BUTTON_TEXT = re.compile(
    r"^(allow|accept|accept all|agree|ok|got it|i agree|yes)$",
    re.IGNORECASE,
)


def _stamp(url: str) -> tuple[str, str]:
    ts = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    digest = hashlib.sha1(url.encode()).hexdigest()[:10]
    return ts, digest


def _parse_viewport(viewport: str) -> tuple[int, int]:
    try:
        width, height = (int(v) for v in viewport.lower().split("x", 1))
    except ValueError as exc:
        raise ValueError("Viewport must use WxH format, for example 1440x900") from exc
    return width, height


def _safe_name(url: str, index: int, suffix: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/").replace("/", "_") or "root"
    stem = re.sub(r"[^a-zA-Z0-9_.-]+", "-", f"{parsed.netloc}_{path}")[:120]
    digest = hashlib.sha1(url.encode()).hexdigest()[:8]
    return f"{index:03d}-{stem}-{digest}{suffix}"


def _find_ffmpeg() -> Path | None:
    exe = "ffmpeg-win64.exe" if sys.platform.startswith("win") else "ffmpeg"
    local_app_data = Path.home() / "AppData" / "Local" / "ms-playwright"
    candidates = []
    if sys.platform.startswith("win"):
        candidates.extend(local_app_data.glob(f"ffmpeg-*/{exe}"))
    else:
        candidates.extend((Path.home() / ".cache" / "ms-playwright").glob("ffmpeg-*/ffmpeg-linux"))
        candidates.extend((Path.home() / ".cache" / "ms-playwright").glob("ffmpeg-*/ffmpeg"))

    found = shutil.which("ffmpeg")
    if found:
        candidates.append(Path(found))

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def _make_contact_sheets(frames_dir: Path, sheets_dir: Path, columns: int = 5, rows: int = 4) -> list[Path]:
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return []

    sheets_dir.mkdir(parents=True, exist_ok=True)
    frame_paths = sorted(frames_dir.glob("frame-*.png"))
    if not frame_paths:
        return []

    thumb_w, thumb_h = 288, 180
    label_h = 24
    per_sheet = columns * rows
    sheets = []

    for sheet_index in range(0, len(frame_paths), per_sheet):
        chunk = frame_paths[sheet_index : sheet_index + per_sheet]
        sheet = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + label_h)), "white")
        for i, frame_path in enumerate(chunk):
            img = Image.open(frame_path).convert("RGB")
            img.thumbnail((thumb_w, thumb_h))
            tile = Image.new("RGB", (thumb_w, thumb_h + label_h), "white")
            tile.paste(img, ((thumb_w - img.width) // 2, 0))
            draw = ImageDraw.Draw(tile)
            draw.text((8, thumb_h + 5), frame_path.stem, fill=(0, 0, 0))
            x = (i % columns) * thumb_w
            y = (i // columns) * (thumb_h + label_h)
            sheet.paste(tile, (x, y))

        out = sheets_dir / f"contact-sheet-{len(sheets) + 1:03d}.png"
        sheet.save(out)
        sheets.append(out)

    return sheets


def _extract_frames(video_path: Path, frames_dir: Path, fps: int, start_offset: float = 0.0) -> list[Path]:
    ffmpeg = _find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found. Playwright's ffmpeg browser package or system ffmpeg is required.")

    frames_dir.mkdir(parents=True, exist_ok=True)
    output_pattern = frames_dir / "frame-%05d.png"
    cmd = [
        str(ffmpeg),
        "-y",
    ]
    if start_offset > 0:
        cmd.extend(["-ss", str(start_offset)])
    cmd.extend([
        "-i",
        str(video_path),
        "-r",
        str(fps),
        str(output_pattern),
    ])
    completed = subprocess.run(cmd, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(f"ffmpeg frame extraction failed:\n{completed.stderr}")
    return sorted(frames_dir.glob("frame-*.png"))


def _write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", errors="replace")


def _scroll_page(page, duration_ms: int) -> None:
    page.evaluate(
        """async ({ duration }) => {
            await new Promise((resolve) => {
                const start = window.scrollY;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const distance = Math.max(0, maxScroll - start);
                const startedAt = performance.now();

                function step(now) {
                    const progress = Math.min(1, (now - startedAt) / duration);
                    window.scrollTo(0, start + distance * progress);
                    if (progress < 1) requestAnimationFrame(step);
                    else resolve();
                }

                requestAnimationFrame(step);
            });
        }""",
        {"duration": duration_ms},
    )


def _try_accept_cookies(page) -> str | None:
    for locator in [
        page.get_by_role("button", name=COOKIE_BUTTON_TEXT),
        page.get_by_text(COOKIE_BUTTON_TEXT),
    ]:
        try:
            match = locator.first
            if match.count() > 0 and match.is_visible(timeout=1500):
                label = match.inner_text(timeout=1500).strip()
                match.click(timeout=2500)
                page.wait_for_timeout(750)
                return label or "matched cookie control"
        except Exception:
            continue
    return None


def _collect_resource_urls(page) -> dict[str, list[str]]:
    return page.evaluate(
        """() => ({
            stylesheets: [...document.querySelectorAll('link[rel~="stylesheet"][href]')].map(el => el.href),
            scripts: [...document.querySelectorAll('script[src]')].map(el => el.src),
            images: [...document.querySelectorAll('img[src]')].map(el => el.currentSrc || el.src),
            videos: [...document.querySelectorAll('video source[src], video[src]')].map(el => el.src),
            fonts: [...document.fonts].map(font => ({ family: font.family, style: font.style, weight: font.weight }))
        })"""
    )


def _fetch_text_resources(request_context, urls: list[str], out_dir: Path, suffix: str, max_bytes: int) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    saved = []
    for index, url in enumerate(dict.fromkeys(urls), start=1):
        item = {"url": url, "status": None, "path": None, "error": None}
        try:
            response = request_context.get(url, timeout=15000, ignore_https_errors=True)
            item["status"] = response.status
            body = response.body()
            if len(body) > max_bytes:
                item["error"] = f"skipped: resource is {len(body)} bytes, max is {max_bytes}"
            else:
                path = out_dir / _safe_name(url, index, suffix)
                path.write_bytes(body)
                item["path"] = str(path)
        except Exception as exc:
            item["error"] = str(exc)
        saved.append(item)
    return saved


def run(
    url: str,
    viewport: str = DEFAULT_VIEWPORT,
    fps: int = DEFAULT_FPS,
    scroll_duration: int = DEFAULT_SCROLL_DURATION,
    timeout: int = DEFAULT_TIMEOUT,
    wait_until: str = DEFAULT_WAIT_UNTIL,
    frame_start_offset: float = DEFAULT_FRAME_START_OFFSET,
    wait_for: str | None = None,
    output_dir: Path | None = None,
    accept_cookies: bool = False,
    no_scroll: bool = False,
    max_resource_bytes: int = DEFAULT_MAX_RESOURCE_BYTES,
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

    width, height = _parse_viewport(viewport)
    ts, digest = _stamp(url)
    out = output_dir or (TMP_DIR / f"style-capture-{ts}-{digest}")
    video_dir = out / "raw-video"
    frames_dir = out / "frames"
    sheets_dir = out / "contact-sheets"
    code_dir = out / "code"
    resources_dir = code_dir / "resources"
    out.mkdir(parents=True, exist_ok=True)
    video_dir.mkdir(parents=True, exist_ok=True)

    console_lines: list[str] = []
    page_errors: list[str] = []
    failed_requests: list[str] = []
    accepted_cookie_label = None
    fetched_styles = []
    fetched_scripts = []

    timeout_ms = timeout * 1000
    scroll_duration_ms = scroll_duration * 1000

    raw_video_path = None

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": width, "height": height},
            record_video_dir=str(video_dir),
            record_video_size={"width": width, "height": height},
            ignore_https_errors=True,
        )
        if accept_cookies:
            context.add_cookies([{"name": "cookieconsent_status", "value": "allow", "url": url}])
            accepted_cookie_label = "preset cookieconsent_status=allow"
        page = context.new_page()

        page.on("console", lambda msg: console_lines.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        page.on(
            "requestfailed",
            lambda req: failed_requests.append(f"{req.method} {req.url} - {req.failure}"),
        )

        source_html = ""
        try:
            response = page.goto(url, wait_until=wait_until, timeout=timeout_ms)
            if response:
                try:
                    source_html = response.text()
                except Exception as exc:
                    console_lines.append(f"[source-html-error] {exc}")
        except Exception as exc:
            console_lines.append(f"[navigation-error] {exc}")

        if wait_for:
            try:
                page.wait_for_selector(wait_for, timeout=timeout_ms)
            except Exception as exc:
                console_lines.append(f"[wait-for-error] {wait_for}: {exc}")

        page.wait_for_timeout(3000)

        if accept_cookies:
            clicked_cookie_label = _try_accept_cookies(page)
            if clicked_cookie_label:
                accepted_cookie_label = clicked_cookie_label

        final_url = page.url
        title = page.title() or final_url
        visible_text = page.inner_text("body") if page.locator("body").count() else ""
        dom_before_interaction = page.content()

        _write_text(code_dir / "source.html", source_html)
        _write_text(code_dir / "dom-before-interaction.html", dom_before_interaction)
        _write_text(code_dir / "visible-text.md", f"# {title}\n\nSource: {final_url}\n\n{visible_text}\n")

        if no_scroll:
            page.wait_for_timeout(scroll_duration_ms)
        else:
            _scroll_page(page, scroll_duration_ms)

        page.wait_for_timeout(3000)
        dom_after_interaction = page.content()
        resources = _collect_resource_urls(page)
        visible_text_after = page.inner_text("body") if page.locator("body").count() else visible_text
        _write_text(code_dir / "page.html", dom_after_interaction)
        _write_text(code_dir / "dom-after-interaction.html", dom_after_interaction)
        _write_text(code_dir / "visible-text-after-interaction.md", f"# {title}\n\nSource: {final_url}\n\n{visible_text_after}\n")
        _write_text(code_dir / "resource-urls.json", json.dumps(resources, indent=2))

        video = page.video
        page.close()
        context.close()
        raw_video_path = Path(video.path()) if video else None
        browser.close()

        request_context = pw.request.new_context(ignore_https_errors=True)
        try:
            fetched_styles = _fetch_text_resources(
                request_context, resources.get("stylesheets", []), resources_dir / "css", ".css", max_resource_bytes
            )
            fetched_scripts = _fetch_text_resources(
                request_context, resources.get("scripts", []), resources_dir / "js", ".js", max_resource_bytes
            )
        finally:
            request_context.dispose()

    video_path = out / "video.webm"
    if raw_video_path and raw_video_path.exists():
        shutil.copy2(raw_video_path, video_path)
        if raw_video_path.parent == video_dir:
            raw_video_path.unlink(missing_ok=True)
            try:
                video_dir.rmdir()
            except OSError:
                pass
    else:
        raise RuntimeError("Playwright did not produce a video artifact.")

    frame_paths = _extract_frames(video_path, frames_dir, fps, frame_start_offset)
    sheet_paths = _make_contact_sheets(frames_dir, sheets_dir)

    log_path = out / "console.log"
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
    _write_text(log_path, "\n".join(log_lines) if log_lines else "(no console output)")

    manifest = {
        "status": "ok",
        "url": final_url,
        "title": title,
        "viewport": f"{width}x{height}",
        "fps": fps,
        "frame_start_offset_seconds": frame_start_offset,
        "scroll_duration_seconds": scroll_duration,
        "accepted_cookie_label": accepted_cookie_label,
        "output_dir": str(out),
        "video": str(video_path),
        "frames_dir": str(frames_dir),
        "frame_count": len(frame_paths),
        "contact_sheets": [str(path) for path in sheet_paths],
        "code": {
            "source_html": str(code_dir / "source.html"),
            "html": str(code_dir / "page.html"),
            "dom_before_interaction": str(code_dir / "dom-before-interaction.html"),
            "dom_after_interaction": str(code_dir / "dom-after-interaction.html"),
            "visible_text": str(code_dir / "visible-text.md"),
            "visible_text_after_interaction": str(code_dir / "visible-text-after-interaction.md"),
            "resource_urls": str(code_dir / "resource-urls.json"),
            "stylesheets": fetched_styles,
            "scripts": fetched_scripts,
        },
        "log": str(log_path),
    }
    manifest_path = out / "manifest.json"
    _write_text(manifest_path, json.dumps(manifest, indent=2))
    manifest["manifest"] = str(manifest_path)

    print(json.dumps(manifest, indent=2))
    return manifest


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Record a page, extract dense frames, and save rendered code artifacts."
    )
    parser.add_argument("url", help="Absolute page URL to capture.")
    parser.add_argument("--viewport", default=DEFAULT_VIEWPORT, help=f"Viewport as WxH (default: {DEFAULT_VIEWPORT}).")
    parser.add_argument("--fps", type=int, default=DEFAULT_FPS, help=f"Frame extraction FPS (default: {DEFAULT_FPS}).")
    parser.add_argument(
        "--frame-start-offset",
        type=float,
        default=DEFAULT_FRAME_START_OFFSET,
        help="Seconds to skip from the source video before extracting model-facing frames.",
    )
    parser.add_argument(
        "--scroll-duration",
        type=int,
        default=DEFAULT_SCROLL_DURATION,
        help=f"Full-page scroll duration in seconds (default: {DEFAULT_SCROLL_DURATION}).",
    )
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="Navigation timeout in seconds.")
    parser.add_argument(
        "--wait-until",
        default=DEFAULT_WAIT_UNTIL,
        choices=WAIT_UNTIL_CHOICES,
        help=f"Playwright navigation wait state (default: {DEFAULT_WAIT_UNTIL}).",
    )
    parser.add_argument("--wait-for", help="CSS selector to wait for before recording interaction.")
    parser.add_argument("--output-dir", type=Path, help="Override the run output directory.")
    parser.add_argument("--accept-cookies", action="store_true", help="Try to accept cookie/consent banners before scrolling.")
    parser.add_argument("--no-scroll", action="store_true", help="Record the initial viewport without scrolling.")
    parser.add_argument(
        "--max-resource-bytes",
        type=int,
        default=DEFAULT_MAX_RESOURCE_BYTES,
        help="Maximum CSS/JS resource size to save.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    parsed = urlparse(args.url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        print("ERROR: URL must be absolute and start with http:// or https://", file=sys.stderr)
        return 1
    if args.fps < 1:
        print("ERROR: --fps must be 1 or greater", file=sys.stderr)
        return 1
    if args.scroll_duration < 1:
        print("ERROR: --scroll-duration must be 1 or greater", file=sys.stderr)
        return 1
    if args.frame_start_offset < 0:
        print("ERROR: --frame-start-offset must be 0 or greater", file=sys.stderr)
        return 1

    try:
        run(
            url=args.url,
            viewport=args.viewport,
            fps=args.fps,
            scroll_duration=args.scroll_duration,
            timeout=args.timeout,
            wait_until=args.wait_until,
            frame_start_offset=args.frame_start_offset,
            wait_for=args.wait_for,
            output_dir=args.output_dir,
            accept_cookies=args.accept_cookies,
            no_scroll=args.no_scroll,
            max_resource_bytes=args.max_resource_bytes,
        )
    except Exception:
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
