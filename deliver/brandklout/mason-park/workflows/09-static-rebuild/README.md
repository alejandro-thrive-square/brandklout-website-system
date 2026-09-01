# 09 — The Mason Park homepage

> [!IMPORTANT]
> **The homepage is a plain HTML file. Open `home/index.html` by double-clicking it.**
> No server, no build step, no `npm install`. Every path in it is relative, so it renders
> from `file://` exactly as it will render on Instatic.

> [!IMPORTANT]
> **The generator was retired on 2026-09-01, and every other page was deleted with it.**
> This workflow used to build ~40 pages from scraped WordPress JSON through `build.mjs` and
> `site/*.mjs`. The client reviewed the result and kept the homepage only. The homepage was
> frozen to plain HTML/CSS/JS at that point and **is now the source**, hand-edited. The
> generator, the page templates and the content JSON are gone; `git show a875490` and the
> commits around it still hold them if a rebuild is ever wanted.

## What is here

| Path | What it is |
| :--- | :--- |
| `home/index.html` | **The homepage.** ~58KB. Edit this file to change the page. |
| `home/assets/site.css` | The whole stylesheet, one file. Fluid root first, then the layout, then the journey layer. |
| `home/assets/site.js` | Mobile menu, deferred map. |
| `home/assets/journey.js` | The GSAP scroll layer — the three scenes described in [JOURNEY-2026-09-01.md](./JOURNEY-2026-09-01.md). |
| `home/assets/gsap/` | GSAP 3.13 + ScrollTrigger + SplitText, vendored. Never a CDN: a dental site must not hand a third party the ability to run script on its pages. |
| `home/assets/uploads/` | The 166 images the page references, at every srcset width. |
| `.tmp/to-instatic.mjs` | Turns `home/` into what Instatic should hold. |
| `.tmp/upload-media.mjs` | Uploads the media manifest, writes the local → uploaded path map. |
| `.tmp/insta.mjs` | Minimal Instatic admin client. Points at Mason Park, deliberately not shared with another client's workflow. |

## Editing the design

Open `home/index.html` in an editor and in a browser side by side. The markup is the
Client-First class vocabulary (`padding-global`, `container-xlarge`, `section_*`), and the
chapter system is `data-chapter` sections styled in `site.css`. Read
[JOURNEY-2026-09-01.md](./JOURNEY-2026-09-01.md) before changing a chapter — it records why
each one exists and which four bugs are easy to reintroduce.

Two rules the stylesheet depends on, both load-bearing:

1. **The fluid root is the first rule in `site.css`** and nothing later may set a root
   font-size. See `deliver/process/04-design/fluid-root.md`.
2. **Braces must balance.** CSS error recovery swallows the rules after an unclosed block
   silently — that once left `--t-disp` at its 1440 value on a 360px phone with no error
   anywhere. Check with:
   ```bash
   node -e 'const c=require("fs").readFileSync("home/assets/site.css","utf8").replace(/\/\*[\s\S]*?\*\//g,"");const o=(c.match(/{/g)||[]).length,x=(c.match(/}/g)||[]).length;console.log(o===x?"balanced":"UNBALANCED "+o+"/"+x)'
   ```

### Control characters

Do not write `.mjs`, `.js` or `.css` in this folder through a shell heredoc or a `node -e`
string. A backslash escape (`\b`, `\d`) collapses into a real control byte on the way through;
the file still parses, the regex silently matches nothing, and nothing reports it. It has cost
this workflow two separate rounds. Edit files with an editor, and scan before committing:

```bash
node -e 'for(const f of process.argv.slice(1)){const t=require("fs").readFileSync(f,"utf8");for(let k=0;k<t.length;k++){const c=t.charCodeAt(k);if(c<32&&c!==9&&c!==10&&c!==13){console.log("CTRL",f,k);break}}}' home/assets/*.js home/assets/*.css .tmp/*.mjs
```

## Instatic import

`home/` is already shaped for it: one page, one stylesheet, one script, classic `<script>`
tags and no module or `fetch()` anywhere.

```bash
cd .tmp
node to-instatic.mjs            # -> instatic/  (first pass, media not yet mapped)
node upload-media.mjs           # uploads instatic/media-manifest.json, writes the map
node to-instatic.mjs --media instatic-media-map.json   # second pass, paths rewritten
```

The exporter makes exactly three changes, and only three:

1. **Routes.** `home/index.html` links to `/about-us/`; Instatic is routed, so that becomes
   `/about-us`. `/` stays `/`.
2. **Media.** `assets/uploads/…` becomes `/uploads/<id>-<name>`, and the id is assigned at
   upload — so upload first, then re-run with `--media`.
3. **Body only.** Instatic stores a body, not a document. `site.css` and `site.js` go in
   separately as **site-wide code assets**, not per page.

Add `--lean` to drop the srcset candidates and ship one file per image — 166 files down to
roughly 50, at the cost of phones fetching the full-size image.

### The one import trap

**Instatic's `base.button` takes no child nodes.** An inline `<svg>` inside a `<button>` is
dropped at import with no failure and no warning, and the live button renders as an empty box.
The menu toggle's three bars are therefore drawn in CSS, not as a child `<svg>` — see the
`.navbar_toggle` rule in `site.css`. Every other inline icon on the page survives; this is the
one element that cannot hold one.

## Nav links

The header links to about 55 pages that do not exist yet. That is deliberate: the nav describes
the practice's site, not this folder. Locally those links go nowhere; on Instatic they resolve
as the pages are built.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).

`home/index.html`, `site.css`, `site.js`, `journey.js` and the vendored GSAP are committed.

**`home/assets/uploads/` is NOT, and cannot be.** The root `.gitignore` refuses every image
extension repo-wide, and SYSTEM_RULES §4 says binary media "must not be force-added" — the VPS is
the source of truth for it, reached with `bash scripts/sync.sh` (or `scripts/sync-assets.sh`
directly). That rule was written for media under `.tmp/`, and this folder is not under `.tmp/`,
so the rclone filter set did not cover it: **these 166 images would have lived on one machine
only, untracked and unsynced.** `scripts/sync-assets.sh` gained a `**/home/assets/**` filter block
on 2026-09-01 to close that. Push before you rely on a second machine having them:

```bash
bash scripts/sync-assets.sh push --dry-run   # check the file list first
bash scripts/sync-assets.sh push
```

A fresh clone therefore gets the page and the stylesheet but no photographs until the assets are
pulled. Nothing can regenerate them — the build that selected these 166 files out of the ~2,000 in
the crawl is deleted.

`.tmp/` holds only the Instatic export scripts. Its output (`instatic/`) and the admin session
cookies stay ignored.
