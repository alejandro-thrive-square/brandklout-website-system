# Workflow: Scrape Page to Markdown

## 1. Overview
This workflow converts a public web page URL into clean Markdown so agents can review, summarize, rewrite, or reuse the page content inside the Sales Microsystem. It is intended for quick sales research, proposal preparation, offer analysis, and copying page content into agent context.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## 2. Technical Stack
- **Trigger**: Manual CLI execution or agent request with a page URL.
- **Fetcher**: Python standard library `urllib.request`.
- **Parser**: Python standard library `html.parser`.
- **Output Format**: Markdown written to `.tmp/` and optionally printed to stdout.
- **Runtime**: Python 3 on Ubuntu 24.04 LTS.

## 3. Execution Steps

### Step 1: Receive URL
- Accept one absolute URL beginning with `http://` or `https://`.
- Reject missing, relative, or non-web URLs.

### Step 2: Fetch Page HTML
- Request the page with the workflow user agent `WebziteMarkdownWorkflow/1.0`.
- Follow normal HTTP redirects and preserve the final source URL in the Markdown output.
- Fail clearly when the response is unreachable, blocked, or not HTML.

### Step 3: Convert HTML to Markdown
- Strip non-content tags such as scripts, styles, SVGs, canvases, iframes, and noscript blocks.
- Convert headings, paragraphs, blockquotes, lists, links, images with alt text, code, and basic block elements to Markdown.
- Preserve the page title and source URL at the top of the output.

### Step 4: Store Artifact
- Save the generated Markdown to:
  - `sales/scrape-page-to-markdown/.tmp/page-markdown-[timestamp]-[hash].md`
- When an explicit output path is provided with `--output`, write to that path instead.
- Use `--stdout` when the calling agent needs the full Markdown directly in the terminal response.

## 4. Usage
Run from the repository root:

```bash
python sales/scrape-page-to-markdown/scrape-page-to-markdown.py "https://example.com" --stdout
```

Optional flags:
- `--output path/to/file.md`: Write the Markdown to a specific file.
- `--timeout 30`: Set the fetch timeout in seconds.
- `--no-links`: Keep link text but omit destination URLs.
- `--stdout`: Print the complete Markdown after writing the artifact.

## 5. Error Handling
- **Invalid URL**: Stop and report that the URL must be absolute and use HTTP or HTTPS.
- **Blocked or Failed Fetch**: Report the HTTP status or connection failure without creating a partial artifact.
- **Non-HTML Response**: Stop and report the received content type.
- **Sparse Output**: If a JavaScript-rendered page returns little text, rerun with the [Playwright Browser Tool](../../manage/browser-tools/playwright-browser/playwright-browser.md) (`python manage/browser-tools/playwright-browser/playwright-browser.py "URL" --stdout`) before using the content in a proposal.

## 6. Output Artifacts
- `sales/scrape-page-to-markdown/.tmp/page-markdown-[timestamp]-[hash].md`

## 7. Sales Usage Notes
- Use this workflow to capture prospect website copy, competitor landing pages, service descriptions, job posts, and relevant reference pages.
- Do not treat scraped content as owned copy. Use it for analysis, quoting small excerpts, internal context, or rewrite inputs.
- When converting gated, private, or login-only pages, get explicit user confirmation before using credentials or session data.

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/page-markdown-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
