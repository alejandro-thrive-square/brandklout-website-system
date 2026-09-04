# Wayback screenshot capture — stonesurgicalarts.com

Full-page screenshots of the archived Stone Surgical Arts site, captured 2026-08-29 as reference
material for the **Build New Stone Surgical Arts website** task
([project overview](../../../../docs/project-overview.md)).

The live site was not touched. Everything here comes from `web.archive.org`.

## Result

| | |
| :--- | :--- |
| Pages enumerated | 119 |
| **Captured** | **112** |
| Unrecoverable | 7 (see below) |
| Total size | 390 MB |
| Capture dates used | 97 from 2026, 12 from 2025, 3 from 2024 |
| Render width | 1440 px, full page (2465–15044 px tall) |

## Files

| Path | What it is |
| :--- | :--- |
| `shots/` | 112 PNGs, `NNN-<slug>.png`. **Gitignored** (`*.png`) — not committed. |
| `manifest.json` | One entry per page: slug, original URL, ranked candidate captures. |
| `results.json` | What was actually captured per page — timestamp, height, text length, bytes. |
| `failures.json` | The 7 pages with no usable capture, and what was tried. |
| `capture-log.jsonl` | Append-only per-attempt log. |
| `capture.mjs` | The capture script. Resumable — re-running skips existing PNGs. |
| `cdx-all.json` | Raw CDX response, all 1466 captures. |

## Re-running

```bash
npm i puppeteer-core@23          # uses the installed Chrome; no browser download
WB_OUT=<this folder> WB_DELAY=7000 node capture.mjs
```

Delete a PNG to force that one page to be re-captured.

## Gotchas — read before touching this

**1. Most snapshots of this site are the site's own bot-block page.** Common Crawl hit
Cloudflare-style protection, so the WARC contains `One moment, please... / Please wait while your
request is being verified` instead of content. This is *baked into the archive* — it is not a live
rate limit, and reloading never clears it. The CDX `length` column separates them cleanly:

| Capture kind | `length` |
| :--- | :--- |
| Bot-block page | ~5.6 KB |
| Renders blank (partial) | 27–40 KB |
| Real page | 135–163 KB |

So do **not** take the newest capture per URL. `manifest.json` carries a *ranked candidate list*
per page and `capture.mjs` walks it until one renders real content.

**2. A size filter alone is not enough.** Captures in the 27–40 KB band pass a naive threshold but
paint nothing. The script also rejects any render that is `<= 1100 px` tall (i.e. no taller than
the viewport) or carries `< 200` characters of visible text, then falls back to the next candidate.
Two pages were only fixed this way, by falling back to Nov-2024 captures.

**3. The theme hides its own content at `opacity: 0.001`.** Content blocks carry class `.animate`
and a scroll script raises them to 1. Where the archived JS is missing the reveal never fires and
the page renders blank *despite* having correct DOM and text. `capture.mjs` forces the end state on
`.animate` elements.

> [!WARNING]
> That fix is deliberately scoped to `.animate`. The `.mega-menu` and `.main-menu` dropdowns also
> sit at `opacity: 0.001` but do **not** carry `.animate` — a blanket opacity override would paint
> every nav dropdown open across all 112 shots.

**4. Use the `if_` URL modifier**, i.e. `web.archive.org/web/<ts>if_/<url>`. It serves the archived
page with rewritten asset URLs but without the Wayback toolbar banner. (`id_` returns the raw
record and breaks relative asset paths.)

**5. Windows `MAX_PATH`.** This folder is deep, and slugs built from full URL paths pushed two
files to 260+ characters — past the limit for tools that don't use extended-length paths (native
Python's `os.path.getsize` fails; Node writes them fine). Slugs are capped at 56 characters in the
filename; the full slug stays in `manifest.json`. Longest path is now 235.

**6. Pacing.** 7 s between pages, sequential, with backoff on 429/503. The full run took ~50 min
and hit **zero** rate limiting. Don't parallelise this to save time.

## The 7 unrecoverable pages

All `/news/` celebrity articles. Every capture across the archive's entire history is the ~5.6 KB
bot-block page — there is no real content archived for them, at any date. Listed in
`failures.json`:

- `celebrities-who-had-breast-surgery-share-their-stories`
- `celebrities-who-underwent-hair-restoration-and-how-it-helped-them`
- `co2-laser-skin-resurfacing-top-details-to-know-about-the-procedure`
- `famous-people-with-sleep-apnea-and-what-they-did-to-handle-the-disorder`
- `leann-rimes-and-her-tmj-disorder-how-she-lived-with-it`
- `tips-on-how-to-protect-yourself-from-facial-trauma`
- `who-did-what-101-a-quick-look-at-chin-sculpting-and-reshaping-celebrities`

If the text of these is needed, try Google cache or ask Brandklout for the client's own export.

## Known imperfections

Individual assets that were never archived render as broken-image placeholders — footer social
icons sitewide, and the before/after photos in `before-after/**` galleries. The page structure,
copy and layout are intact; the photography is not. This is a gap in the archive, not in the
capture.

## Version Control

`shots/` is excluded by the root `.gitignore` binary/media rules (`*.png`); the VPS is the source
of truth for image assets. The JSON manifests, the log, `capture.mjs` and this README are
lightweight workflow artifacts and are committed. See
[SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
