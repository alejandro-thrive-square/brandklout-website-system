# 09 — The Mason Park site

> [!IMPORTANT]
> **Every page is a plain HTML file. Open `home/index.html` by double-clicking it.**
> No server, no build step, no `npm install`. Every path in it is relative, so it renders
> from `file://` exactly as it will render on Instatic.

> [!NOTE]
> **`home/` is the site root, not "the homepage folder".** `home/index.html` is `/`, and
> `home/services/invisalign/index.html` is `/services/invisalign/`. A page one folder deeper
> reaches the shared assets with `../../assets/…`; the exporter collapses any depth of `../`
> on the way to Instatic. **Add a page by copying the nearest existing one and editing it** —
> the head, the topbar, the header, the footer and the five script tags are identical on
> every page and are meant to stay that way.

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
| `home/services/invisalign/index.html` | **The service page**, and the pattern every other treatment page follows. ~50KB. |
| `home/assets/site.css` | The whole stylesheet, one file. Fluid root first, then the layout, then the journey layer. |
| `home/assets/site.js` | Mobile menu, deferred map. |
| `home/assets/journey.js` | The GSAP scroll layer — the three scenes described in [JOURNEY-2026-09-01.md](./JOURNEY-2026-09-01.md). |
| `home/assets/gsap/` | GSAP 3.13 + ScrollTrigger + SplitText, vendored. Never a CDN: a dental site must not hand a third party the ability to run script on its pages. |
| `home/assets/uploads/` | The 166 images the page references, at every srcset width. |
| `.tmp/check.mjs` | **The gate that reads the HTML.** Assets resolve, braces balance, no control bytes, no walls of text, ids unique, anchors land, alts present. `node .tmp/check.mjs`. |
| `.tmp/shot.mjs` | **The gate that renders it.** Four widths, full-page PNGs plus overflow / broken images / never-revealed elements / console errors. `cd .tmp && npm i` once, then `node shot.mjs ../home/services/invisalign/index.html`. |
| `.tmp/measure.mjs` | How long the page is and where the length went — px, screens, visible words and list heights per chapter. Run it before deciding what to cut. |
| `.tmp/probe-scene.mjs` | Drives the pinned path scene and asserts it does work: the track travels, the bar fills, every card reveals. A screenshot cannot tell you any of that. |
| `.tmp/backup-site.mjs` | Dumps a whole instance -- shell, every page's node graph, media records -- to one local JSON. **Run it before anything destructive.** |
| `.tmp/list-site.mjs` | Read-only inventory: which instance, who we are, pages, media, publish state. |
| `.tmp/run-converter.mjs` | Ships `container-convert.ts` into the container, sha-verified, and runs it under bun. |
| `.tmp/import-fonts.mjs` | Installs Karla, Newsreader and Nunito Sans through Instatic's own font store. Without it the live pages render in Georgia and Segoe UI. |
| `.tmp/import-scripts.mjs` | The JS half of the code assets: gsap + site.js + journey.js as one registered script. |
| `.tmp/reset-to-deliverable.mjs` | Reduces an instance to what `home/` holds plus `KEEP`. Staging only, dry-run by default. |
| `.tmp/verify-live.mjs` | Checks the PUBLISHED pages: 200, styles applied, GSAP booted, images resolve, no overflow. |
| `.tmp/to-instatic.mjs` | Turns `home/` into what Instatic should hold. |
| `.tmp/upload-media.mjs` | Uploads the media manifest, writes the local → uploaded path map. |
| `.tmp/insta.mjs` | Minimal Instatic admin client. Points at Mason Park, deliberately not shared with another client's workflow. |

## Editing the design

Open `home/index.html` in an editor and in a browser side by side. The markup is the
Client-First class vocabulary (`padding-global`, `container-xlarge`, `section_*`), and the
chapter system is `data-chapter` sections styled in `site.css`. Read
[JOURNEY-2026-09-01.md](./JOURNEY-2026-09-01.md) before changing a chapter — it records why
each one exists and which four bugs are easy to reintroduce.

### The service page pattern

`home/services/invisalign/index.html` is the canary for the other 34 treatment pages. It runs
the beats the client's own team called the right information flow for a service page, in this
order, each one a `data-chapter` section:

| Chapter | Class | What the beat is for |
| :--- | :--- | :--- |
| Arrival | `ch-arrival is-compact` | The name of the treatment, one sentence, and the booking button. Two thirds height — an inner page has to hand over quickly. |
| — | `pr-badges` + breadcrumb | Trust, then position, before the first chapter. |
| Is this you | `ch-qualify` | Qualify the reader out or in, first. |
| The Treatment | `ch-treatment` | What it is and what is included. |
| Why This One | `ch-why` (warm) | What it does for them, and why here. |
| The Path | `ch-path` | What actually happens, pinned and travelling sideways. The homepage's scene, reused: **the class must be `ch-path`, journey.js binds to it and not to the id.** No photographs on the cards — a picture beside "Step 3: aligner fitting" presents stock photography as showing this treatment. |
| The Alternatives | `ch-compare` (warm) | The `vs-table`, honestly. |
| The Cost | `ch-cost` | The price, before the ask. |
| The Proof | `ch-proof` (warm) | The practice's own Google reviews. |
| Questions | `ch-questions` | The objections, as an accordion. |
| The Invitation | `ch-invitation` (dark) | Everything needed to act. Nothing after it but the footer. |

A beat with nothing behind it is **dropped, not invented** — a thin treatment gets five
chapters, not eleven.

### The service page's own furniture

Client note, 2026-09-01: *"Let's use more cards instead of bullet points. Let's have more
uncommon layouts and more images please. Remember this is for the services page. The home page
is currently great."* Everything below is in the `svc-` block at the end of `site.css`, and
every selector there is either a new `svc-*` class or scoped to `.ch-arrival.is-compact`.
**The homepage uses none of them, and that is the constraint to preserve** — check it by
re-rendering `home/index.html` and confirming its four heights have not moved.

| Part | What it is |
| :--- | :--- |
| `svc-grid` | The card grid. `is-3` / `is-4` set the columns; `is-lead` gives the first card two of them. |
| `svc-grid is-stagger` | **The uncommon one.** Even cards drop 2.75rem so the row reads as two ranks. It is a `transform`, so it costs no layout height, and it is confined to ≥900 because a stagger in one column is just a gap. |
| `svc-card` | Optional `svc-card_media`, then `svc-card_no` / `_name` / `_text`. Reads `--panel`, not `#fff`, so the same card is white on warm and ink on dark — which is why it is not `prop-card_component`. |
| `svc-overlap` | **The other uncommon one.** A 12-column grid where the photograph takes 1–8 and the copy panel takes 7–12 **in the same row**, so the panel sits *on* the image. `is-flipped` mirrors it. Stacks below 900. |
| `svc-ledger` | Hairline-separated tiles on a 1px gap. For a list of short facts — "what's included" is a receipt, not prose. Give it a `svc-ledger-label`, not `lf-lead`. |
| `svc-provider` | Portrait + copy + `svc-stats`. **Sized to the asset**: Dr. Sung is published at 230×300 and nothing larger, so the column caps at 15rem rather than upscaling him across a spread. |
| `svc-card is-price` | The one filled panel on the page, for the money. |

Where prose still runs in a column, two frames carry it: `lf-layout lf-split` puts the chapter
tag and heading in a sticky left column with the sections beside it, and `lf-layout is-solo` is
one column at 72ch. **When you add a new prose container, add it to `HOLDERS` in
`.tmp/check.mjs`** — the wall-of-text gate matched only `lf-section`, and when this page moved
to cards it silently reported "0 words" for a page that still had two-paragraph panels on it.

**Photographs.** Eleven of the practice's own frames are safe on a treatment page; the pool and
what each one shows is recoverable with `git show 0499328:…/site/photos.mjs` plus the alt text
on `home/index.html`. Small supporting imagery is grayscale at rest and colour on hover, the
hero and the overlap frames are colour. Nothing on the page is captioned as showing Invisalign.

**The copy is the practice's, and it is re-tagged rather than rewritten.** Structure the
WordPress editor implied is restored (a bold lead-in becomes `p.lf-lead`, a glyph-prefixed run
becomes `ul.lf-ticks`), dead paragraphs are dropped outright, and anything past the prose
ceiling folds into `details.lf-more`. See **No wall of text** in
[`deliver/brandklout/docs/DESIGN-STANDARD.md`](../../../docs/DESIGN-STANDARD.md); `check.mjs`
measures it.

**Photographs may show the practice. They may not be presented as showing the treatment, its
result, or its patient** — which is why the captions here talk about the building and the
visit. Only the hero uses the page's own featured image.

### Keeping it short, without deleting the practice's copy

Client note, 2026-09-01: *"Users don't scroll to a page that has that much text."* Measure before
cutting — on this page the problem was **repetition, not length**. Four lists were the same list
in different words, and the page made "virtually invisible" 16 times and "no metal, no irritation"
28. Three tools do the whole job, and none of them deletes a word:

- `ul.lf-ticks.is-compact` — the label is the visible row, the practice's own two sentences sit
  under it in a native `<details>`. Six benefits: 622px → 288px.
- `details.lf-more` around a whole section, when two sections are the same argument.
- `ch-path` instead of five stacked `lf-section`s for a process.

2,155 visible words → 1,450; mobile 22.4 screens → 16.9. Everything is still in the HTML and still
indexed. **Never delete ranking copy to shorten a page** — see "No wall of text" in
[`DESIGN-STANDARD.md`](../../../docs/DESIGN-STANDARD.md).

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

`home/` is already shaped for it: one stylesheet, one script, classic `<script>` tags and no
module or `fetch()` anywhere. The exporter walks the folder, so every `index.html` under it is
a page and its route comes from its own directory — nothing to register.

> [!CAUTION]
> **`INSTATIC_BASE_URL` in the repo `.env` is `https://www.masonparkdental.com` — PRODUCTION**,
> which carries six paid-traffic landing pages. **Pass the URL explicitly on every command.**
> `insta.mjs` refuses a host that is not Mason Park and keys its session cache by host, and
> `reset-to-deliverable.mjs` refuses to run anywhere `IS_STAGING` is false — but the read-only
> tools will happily read production if you let them.

The full run order. Steps 5–8 are not optional and **five of these scripts were deleted by the
2026-09-01 freeze and restored on 2026-09-01**; `git show 0499328:…/.tmp/<name>` has the
originals if any goes missing again.

```bash
cd .tmp && npm i
export INSTATIC_BASE_URL=https://staging.masonparkdental.com

node backup-site.mjs                                   # 1. dump the instance first. 20 MB, one file.
node list-site.mjs                                     # 2. what is there now
node to-instatic.mjs                                   # 3. -> instatic/  (media not yet mapped)
node upload-media.mjs                                  # 4. upload, write instatic-media-map.json
node to-instatic.mjs --media instatic-media-map.json   # 5. second pass, /uploads paths

RAILWAY_ENV_NAME=staging node ship-payload.mjs         # 6. HTML -> the container, sha-verified
RAILWAY_ENV_NAME=staging node run-converter.mjs        # 7. HTML -> node graphs, inside the container
RAILWAY_ENV_NAME=staging node fetch-nodes.mjs          # 8. -> converted-pages.json

node import-fonts.mjs                                  # 9. the three families, self-hosted by Instatic
node import-styles.mjs                                 # 10. class rules + site.css as a code asset
node import-scripts.mjs                                # 11. gsap + site.js + journey.js, bundled
node reset-to-deliverable.mjs                          # 12. dry run: what would be deleted
node reset-to-deliverable.mjs --apply --publish        # 13. one atomic PUT, then publish
node verify-live.mjs $INSTATIC_BASE_URL / /services/invisalign   # 14. check what actually shipped
```

**Pages are node graphs, not HTML.** Steps 6–8 exist because the HTML→nodes importer is an MCP
`site_*` tool that proxies a live browser editor and "cannot run headlessly"; calling Instatic's
own importer inside the container sidesteps that. `railway ssh` takes its payload on the command
line and **fails silently past ~10 KB**, so both directions are chunked and sha256-verified.

The exporter makes exactly three changes, and only three:

1. **Routes.** `home/index.html` links to `/about-us/`; Instatic is routed, so that becomes
   `/about-us`. `/` stays `/`.
2. **Media.** `assets/uploads/…` becomes `/uploads/<id>-<name>`, and the id is assigned at
   upload — so upload first, then re-run with `--media`. A page in a subfolder writes
   `../../assets/…`; any run of `../` is collapsed first so both depths reach the same rule.
3. **Body only.** Instatic stores a body, not a document, so every `<script>` and
   `<link rel=stylesheet>` is stripped. They come back as **site-wide code assets** — and
   putting them back is steps 9 and 10, not something the exporter does.

Add `--lean` to drop the srcset candidates and ship one file per image — 166 files down to
roughly 50, at the cost of phones fetching the full-size image.

### Code assets: a file alone is inert

A `SiteFile` needs **both** an `id` (a nanoid, explicitly not the path, which is mutable on
rename) **and** a `path`. An entry missing `id` is dropped silently: the save answers `ok:true`
and `files` comes back empty.

A **script** needs one thing more — an entry in `site.runtime.scripts` keyed by that same file
id, giving `enabled`, `format`, `placement`, `timing` and `scope`. A `type: "style"` file is
bundled into `userStyles-*.css` automatically; **a script with no runtime entry never loads at
all**, with no error anywhere.

`import-styles.mjs` only ever shipped the CSS, so until 2026-09-01 the imported pages went live
correctly styled and carrying **no JavaScript whatsoever** — dead mobile menu, unloaded map,
and no motion layer. It read as a deliberate static render because `journey.js` is written to
degrade to exactly that. `import-scripts.mjs` is the missing half.

**It ships one concatenated file, not five.** The page needs gsap → ScrollTrigger → SplitText →
site.js → journey.js in that order, and the runtime registry orders scripts by a `priority`
whose direction is undocumented. Guessing wrong gives a silently static page, so the order is
settled at build time instead.

### The import traps
**The three type families are a `<link>` in the `<head>`, and the `<head>` is not shipped.**
`to-instatic.mjs` sends a body and strips every `<link>`, so Karla, Newsreader and Nunito Sans
never reached Instatic and the live pages rendered in **Georgia and Segoe UI** while every other
check passed. It cannot be fixed with an `@import` at the top of `site.css` either — an
`@import` is only valid before any other rule and the fluid root holds that position.

`import-fonts.mjs` uses the platform's own mechanism, which is what Montserrat already uses on
this site: `settings.fonts.items[]` with `source: "google"`. **Instatic fetches and stores the
woff2 files itself** and serves them from `/uploads/fonts/<family>/`, so no third party is handed
the visitor — the same rule the vendored GSAP follows.

Two things about that API. `GET /admin/api/cms/fonts/google` is the **catalogue** and is GET-only;
POSTing to it returns `405 Method not allowed`, which reads like a permissions problem. The
install route is `POST /admin/api/cms/fonts/install`. And **installing is not registering**: the
install fetches the files and returns a fat, complete-looking font object, but the family does not
appear in `settings.fonts.items` until you save the shell with it, and until then no `@font-face`
is emitted. Nothing in that response tells you the site is still unstyled.

**Neither `document.fonts.check()` nor computed `font-family` can tell you which font is being
painted** — the first answers `true` for a fallback, the second reports the stack that was *asked*
for. Measure a string in the family and in its own fallback and compare the widths; identical
widths mean the fallback is what is on screen. `verify-live.mjs` does this now.

**Instatic installs static weight instances, not the variable font.** The local page asks Google
for Newsreader's `opsz` axis; the live page gets discrete 300/400/500. At display sizes that is a
~0.3% width difference and no visible change of design, but it is not byte-identical.


**Instatic's `base.button` takes no child nodes.** An inline `<svg>` inside a `<button>` is
dropped at import with no failure and no warning, and the live button renders as an empty box.
The menu toggle's three bars are therefore drawn in CSS, not as a child `<svg>` — see the
`.navbar_toggle` rule in `site.css`. Every other inline icon on the page survives; this is the
one element that cannot hold one.

**A delete is a write, and it is optimistically locked like any other.** `deletedPageIds`
carries no seq of its own, so each deleted row's current `seq` has to be quoted in `baseSeqs`
exactly as a changed row's is. Omit them and the save returns `409 "Another admin saved a newer
version of content in this save"`, naming every page you are deleting, with no other admin
anywhere near the site — the newer version is each row's own seq, unquoted.

**`publish` bakes the whole draft, not your change.** Check `draftMatchesPublished` before
publishing anywhere that matters, or you ship whatever else was sitting unreviewed in it.

**Instatic generates its `-w64.webp` placeholder variants lazily.** The first request for a
freshly published image can 404 and succeed a moment later; `verify-live.mjs` filters those,
and the Cloudflare bot beacon, so a real miss still stands out.

## Nav links

The header links to about 55 pages, of which two now exist. That is deliberate: the nav
describes the practice's site, not this folder. Locally the rest go nowhere; on Instatic they
resolve as the pages are built.

Because the links are root-absolute, **`/services/invisalign/` does not open from `file://`
via the menu** — open the file directly. The two pages are only reachable from each other
once they are on Instatic. That is the cost of shipping the same href to both, and it is the
right trade: a relative nav would have to be rewritten per folder depth.

The nav carries **no current-page state** — no `aria-current`, no active class, on either
page. That is a site-wide decision to take once, when there are enough pages for it to matter,
not one to make from a single service page.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).

Every `index.html` under `home/`, plus `site.css`, `site.js`, `journey.js` and the vendored
GSAP, are committed. So are `.tmp/check.mjs`, `.tmp/shot.mjs` and `.tmp/package.json`;
`.tmp/node_modules/` and `.tmp/shots/` are not.

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
