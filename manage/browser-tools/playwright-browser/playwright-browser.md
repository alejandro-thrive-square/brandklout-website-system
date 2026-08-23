# Workflow: Playwright Browser Tool

## 1. Overview
A shared browser automation utility that uses Playwright (Chromium) to load any URL, capture visual and textual artifacts, and report the results so that agents can **see** what a browser renders. This is the single entry-point for browser-based work across all pillars.

The workflow has two executors:
- `playwright-browser.py` - fast screenshot/snapshot capture for QA and browser-visible text.
- `playwright-style-capture.py` - design-reference capture that records video, extracts dense frames, and saves rendered code artifacts for combined visual/code style analysis.

**Consumers:**
- **Sales** — `scrape-page-to-markdown` (in the `webzite-agentic-workflow` repository) falls back to this tool when a JavaScript-rendered page returns sparse text via urllib.
- **Deliver / QA** — [06-qa](../../../deliver/process/06-qa/06-qa.md) uses it for responsive screenshots and smoke-testing staging URLs.
- **Deliver / Launch** — [07-launch](../../../deliver/process/07-launch/07-launch.md) uses it for post-publish smoke tests.
- **Growth** — `form-scrape-redesign-vercel-email` (in the `webzite-agentic-workflow` repository) uses it as a JS-capable scraper.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## 2. Technical Stack
- **Runtime**: Python 3.13+ on Ubuntu 24.04 LTS (VPS) / Windows 10+ (local dev).
- **Library**: `playwright` (Python, `>=1.48`), declared in the root `requirements.txt`.
- **Optional CLI**: Node Playwright CLI may be installed globally with `npm install -g playwright` for ad hoc browser inspection, screenshots, codegen, traces, and video-capable test runs. The Python executor remains the shared automation entry point for workflows.
- **Style Capture Output**: `playwright-style-capture.py` writes WebM video, dense PNG frames, contact sheets, rendered HTML, fetched CSS/JS resources, JSON manifests, and logs to `.tmp/`.
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

### Style Capture Mode
Use `playwright-style-capture.py` when the goal is to understand a site's design language, animation timing, interaction feel, proportions, colors, and implementation patterns before applying that style to a new site.

```bash
python manage/browser-tools/playwright-browser/playwright-style-capture.py "https://example.com" --fps 5 --scroll-duration 90 --accept-cookies
```

Key flags:
- `--fps 5` - extract dense PNG frames from the recorded video. Use 3-5 FPS for full-page style studies and 8-12 FPS for short animation/interaction studies.
- `--frame-start-offset 2` - skip startup blank/loading seconds when extracting model-facing frames while keeping the original video intact.
- `--scroll-duration 90` - duration of the measured top-to-bottom scroll, in seconds.
- `--accept-cookies` - pre-seed a common consent cookie and try to accept visible cookie/consent banners before recording so overlays do not obscure the visual reference.
- `--wait-until domcontentloaded` - navigation readiness state. Keep `domcontentloaded` for animation-heavy/analytics-heavy sites; use `load` or `networkidle` only when a site needs it.
- `--wait-for "selector"` - wait for a meaningful element or visual asset before recording.
- `--no-scroll` - record the initial viewport for the requested duration, useful for ambient animation studies after the script is extended with custom interactions.
- `--output-dir path/to/run` - choose a deterministic artifact folder.

Style capture outputs a run folder containing:
- `video.webm` - Playwright recording.
- `frames/frame-00001.png` - dense extracted frames.
- `contact-sheets/contact-sheet-001.png` - frame contact sheets for model review.
- `code/source.html` - original server HTML from the navigation response.
- `code/dom-before-interaction.html` - rendered DOM before the scripted scroll/interaction.
- `code/page.html` and `code/dom-after-interaction.html` - final rendered DOM after the scripted scroll/interaction.
- `code/resource-urls.json` - discovered stylesheet, script, image, video, and font references.
- `code/resources/css/` and `code/resources/js/` - fetched CSS/JS resources when small enough.
- `console.log` - browser console, page errors, and failed requests.
- `manifest.json` - machine-readable index of the whole capture.

The intended analysis loop is:
1. Capture video and dense frames with Playwright.
2. Feed representative frames/contact sheets to the model for visual assessment of motion, layout, color, hierarchy, density, and interaction feel.
3. Read `page.html`, CSS, JS, visible text, and console logs for implementation assessment.
4. Combine the visual and code assessments into a reusable style brief for the new site.

Capture quality rules learned from testing:
- Use PNG for model-facing frames and contact sheets. PNG preserves UI text, colors, gradients, and subtle shadows better than lossy formats. Convert bulk frames to WebP only as an optional storage optimization after the analysis artifacts are produced.
- Keep `video.webm` as the source recording, but evaluate animations from dense extracted frames. Use 3-5 FPS for long full-page style studies and higher FPS only for short focused interactions.
- Use `--frame-start-offset` to skip startup blank/loading frames in the extracted image set while preserving the original video.
- Use `domcontentloaded` as the default navigation state for animation-heavy or analytics-heavy sites. `networkidle` can delay recording because tracking requests keep the network active.
- Accept or pre-seed cookie consent before the visual pass; persistent consent overlays make style analysis unreliable.
- Capture code after the interaction pass. Animated/lazy sections may remain hidden in an early DOM snapshot, so `page.html` must represent the final post-scroll DOM.
- Fetch CSS/JS resources after closing the video recording context so non-visual network work does not inflate the video duration.
- Treat `page.html` as an analysis artifact, not a guaranteed self-contained local clone. It preserves the rendered DOM and absolute asset URLs; `source.html` preserves the original server response.

### Optional Global CLI Usage
Use the global Node CLI for one-off interactive browser work that does not need this workflow's JSON artifact contract:
```bash
playwright --version
playwright screenshot --browser chromium "https://example.com" "%TEMP%/example.png"
playwright codegen "https://example.com"
```
For full-page video captures, prefer a Playwright Test spec with `video: { mode: "on" }` and a measured `requestAnimationFrame` scroll from `window.scrollY` to `document.documentElement.scrollHeight - window.innerHeight`. Large `page.mouse.wheel()` jumps produce rough recordings and may miss sections.
Before starting the scroll, wait for a meaningful page element or visual asset to appear and handle cookie/consent banners when they would obscure the page. A video that starts immediately after navigation can capture a blank first frame or record persistent overlays across the whole page.

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

**Style capture mode**:
- `.tmp/style-capture-[ts]-[hash]/video.webm`
- `.tmp/style-capture-[ts]-[hash]/frames/frame-[number].png`
- `.tmp/style-capture-[ts]-[hash]/contact-sheets/contact-sheet-[number].png`
- `.tmp/style-capture-[ts]-[hash]/code/page.html`
- `.tmp/style-capture-[ts]-[hash]/code/source.html`
- `.tmp/style-capture-[ts]-[hash]/code/dom-before-interaction.html`
- `.tmp/style-capture-[ts]-[hash]/code/dom-after-interaction.html`
- `.tmp/style-capture-[ts]-[hash]/code/visible-text.md`
- `.tmp/style-capture-[ts]-[hash]/code/visible-text-after-interaction.md`
- `.tmp/style-capture-[ts]-[hash]/code/resource-urls.json`
- `.tmp/style-capture-[ts]-[hash]/code/resources/css/*.css` - local cache only by default; commit only with an explicit need.
- `.tmp/style-capture-[ts]-[hash]/code/resources/js/*.js` - local cache only by default; commit only with an explicit need.
- `.tmp/style-capture-[ts]-[hash]/console.log`
- `.tmp/style-capture-[ts]-[hash]/manifest.json`

Dense frame sets and videos are binary/media artifacts and remain out of Git. Lightweight manifests, text snapshots, rendered DOM/source HTML, and resource URL indexes may be committed when useful. Fetched third-party CSS/JS resource mirrors are ignored by default because they are noisy, can exceed Windows path-length limits, and can be refetched from `resource-urls.json` when needed.

### Artifact Hygiene
Keep `.tmp/` focused on the latest useful capture for the workflow. Remove superseded smoke runs, one-off CLI test specs, duplicate raw video folders, and earlier failed/rough recordings once a final capture exists. The executor copies Playwright's raw recording to `video.webm` and removes the transient `raw-video/` folder after a successful run.

## 6. Error Handling
- **Missing browser binary**: Print instructions to run `python -m playwright install chromium` and exit with code 1.
- **Navigation timeout**: Report the timeout and partial artifacts (screenshot of whatever loaded, console log of errors).
- **Invalid URL**: Stop and report that the URL must be absolute with HTTP or HTTPS scheme.
- **Missing ffmpeg**: Style capture records the WebM but cannot extract frames unless Playwright's cached ffmpeg package or a system `ffmpeg` executable is available.
- **Crash or unexpected error**: Print the traceback to stderr and exit with code 1.

## 7. First-Time Setup

### Local Machine (Windows/macOS)
```bash
pip install -r requirements.txt
python -m playwright install chromium
npm install -g playwright  # optional global Node CLI
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
