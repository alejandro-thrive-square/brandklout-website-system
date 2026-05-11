# Workflow: Playwright Browser Tool

## 1. Overview
A shared browser automation utility that uses Playwright (Chromium) to load any URL, capture visual and textual artifacts, and report the results so that agents can **see** what a browser renders. This is the single entry-point for browser-based work across all pillars.

**Consumers:**
- **Sales** — [scrape-page-to-markdown](../../../sales/scrape-page-to-markdown/scrape-page-to-markdown.md) falls back to this tool when a JavaScript-rendered page returns sparse text via urllib.
- **Deliver / QA** — [06-qa](../../../deliver/process/06-qa/06-qa.md) uses it for responsive screenshots and smoke-testing staging URLs.
- **Deliver / Launch** — [07-launch](../../../deliver/process/07-launch/07-launch.md) uses it for post-publish smoke tests.
- **Growth** — [form-scrape-redesign](../../../growth/form-scrape-redesign-vercel-email/form-scrape-redesign-vercel-email.md) uses it as a JS-capable scraper.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## 2. Technical Stack
- **Runtime**: Python 3.13+ on Ubuntu 24.04 LTS (VPS) / Windows 10+ (local dev).
- **Library**: `playwright` (Python, `>=1.48`), declared in the root `requirements.txt`.
- **Browser**: Chromium only, installed once per machine via `python -m playwright install chromium`. Browsers live in the OS-wide Playwright cache — **never inside this repository**.
- **Output Format**: PNG screenshot, Markdown snapshot, plain-text log — all written to `.tmp/`.

## 3. Execution Steps

### Step 1: Receive URL and Options
- Accept one absolute URL (`http://` or `https://`).
- Optional: viewport size, wait-for selector, timeout, output directory override.

### Step 2: Launch Browser and Navigate
- Launch headless Chromium via `playwright.sync_api`.
- Attach listeners for console messages, page errors, and failed network requests.
- Navigate to the URL and wait for `networkidle` (or the user-provided selector).

### Step 3: Capture Artifacts
Three files are produced per run inside `.tmp/`:

| Artifact | Filename Pattern | Purpose |
| :--- | :--- | :--- |
| **Screenshot** | `screenshot-[ts]-[hash].png` | Full-page PNG. Agents view it via the multimodal `Read` tool. |
| **Snapshot** | `snapshot-[ts]-[hash].md` | Page title, final URL, and visible text extracted via `page.inner_text("body")`. Agents read it as plain text — cheaper and more reliable than OCR on the PNG. |
| **Console Log** | `console-[ts]-[hash].log` | Captured `console.*` messages, JS errors, and failed network requests. Useful for debugging. |

### Step 4: Report Results
Print a JSON summary to stdout so calling executors can consume the paths programmatically:
```json
{
  "captures": [
    {"label": "desktop", "viewport": "1440x900", "screenshot": "...", "snapshot": "..."},
    {"label": "tablet",  "viewport": "768x1024", "screenshot": "...", "snapshot": "..."},
    {"label": "mobile",  "viewport": "375x812",  "screenshot": "...", "snapshot": "..."}
  ],
  "log": "path/to/console.log",
  "url": "https://final-url.com",
  "title": "Page Title",
  "status": "ok"
}
```
Without `--responsive`, `captures` contains a single entry for the requested viewport.

## 4. Usage

Run from the repository root:

```bash
python manage/browser-tools/playwright-browser/playwright-browser.py "https://example.com"
```

Optional flags:
- `--responsive` — capture at all three breakpoints: desktop (1440x900), tablet (768x1024), and mobile (375x812) in a single run.
- `--wait-for "selector"` — wait for a CSS selector to appear before capturing.
- `--viewport 1440x900` — viewport width x height (default: `1440x900`). Ignored when `--responsive` is set.
- `--timeout 30` — navigation timeout in seconds (default: `30`).
- `--output-dir path/to/dir` — override default `.tmp/` folder.
- `--stdout` — also print the snapshot markdown to stdout after the JSON summary.

### Responsive Testing
Run with `--responsive` to capture desktop, tablet, and mobile in one pass:
```bash
python manage/browser-tools/playwright-browser/playwright-browser.py "https://example.com" --responsive
```
This produces three screenshot/snapshot pairs (labeled `desktop`, `tablet`, `mobile`) plus one shared console log. Agents should `Read` each screenshot to compare how the layout adapts across breakpoints.

### Agent Usage Pattern
After calling this tool, agents should:
1. Parse the JSON output to get artifact paths.
2. `Read` the screenshot PNG to visually inspect the page.
3. `Read` the snapshot `.md` for text-based analysis (content review, SEO checks, accessibility).
4. `Read` the console `.log` if investigating errors or missing resources.

## 5. Output Artifacts

**Single viewport** (default):
- `.tmp/screenshot-desktop-[ts]-[hash].png`
- `.tmp/snapshot-desktop-[ts]-[hash].md`
- `.tmp/console-[ts]-[hash].log`

**Responsive mode** (`--responsive`):
- `.tmp/screenshot-desktop-[ts]-[hash].png` (1440x900)
- `.tmp/screenshot-tablet-[ts]-[hash].png` (768x1024)
- `.tmp/screenshot-mobile-[ts]-[hash].png` (375x812)
- `.tmp/snapshot-desktop-[ts]-[hash].md`
- `.tmp/snapshot-tablet-[ts]-[hash].md`
- `.tmp/snapshot-mobile-[ts]-[hash].md`
- `.tmp/console-[ts]-[hash].log`

Screenshot and log outputs remain ignored by binary/log rules; lightweight text artifacts in `.tmp/` may be committed when useful.

## 6. Error Handling
- **Missing browser binary**: Print instructions to run `python -m playwright install chromium` and exit with code 1.
- **Navigation timeout**: Report the timeout and partial artifacts (screenshot of whatever loaded, console log of errors).
- **Invalid URL**: Stop and report that the URL must be absolute with HTTP or HTTPS scheme.
- **Crash or unexpected error**: Print the traceback to stderr and exit with code 1.

## 7. First-Time Setup

### Local Machine (Windows/macOS)
```bash
pip install -r requirements.txt
python -m playwright install chromium
```

### VPS (Ubuntu 24.04)
```bash
pip install -r requirements.txt
python -m playwright install --with-deps chromium
```
The `--with-deps` flag installs required system libraries (libgbm, libnss3, etc.) on Linux.

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md — Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `manage/playwright-browser-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
