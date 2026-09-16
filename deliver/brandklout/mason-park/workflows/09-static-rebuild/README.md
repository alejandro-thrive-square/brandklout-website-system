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
| `home/about-us/index.html` | **About the Practice.** Asana `1217892732561689`. See "The core pages" below. |
| `home/our-doctors/index.html` | **Meet the Doctors.** Asana `1217892732561690`. |
| `home/our-team/index.html` | **Meet the Team.** Asana `1217892732561691`. |
| `home/our-services/index.html` | **Services Overview.** Asana `1217892732561693`. |
| `home/new-patients/index.html` | **New Patients.** Asana `1217892732561695`. Carries the pinned first-visit scene. |
| `home/financing/index.html` | **Insurance and Financing.** Asana `1217892732561697`. |
| `home/dental-savings-plan/index.html` | **Membership Plan.** Asana `1217892732561698`. |
| `home/patient-reviews/index.html` | **Patient Reviews.** Asana `1217892732561699`. |
| `home/thank-you/index.html` | **General Thank You.** Asana `1217894480351481`. `noindex`. |
| `home/assets/site.css` | The whole stylesheet, one file. Fluid root first, then the layout, then the journey layer. |
| `home/assets/site.js` | Mobile menu, deferred map. |
| `home/assets/journey.js` | The GSAP scroll layer — the three scenes described in [JOURNEY-2026-09-01.md](./JOURNEY-2026-09-01.md). |
| `home/assets/gsap/` | GSAP 3.13 + ScrollTrigger + SplitText, vendored. Never a CDN: a dental site must not hand a third party the ability to run script on its pages. |
| `home/assets/uploads/` | The 166 images the page references, at every srcset width. |
| `.tmp/check.mjs` | **The gate that reads the HTML.** Assets resolve, braces balance, no control bytes, no walls of text, ids unique, anchors land, alts present. `node .tmp/check.mjs`. |
| `.tmp/shot.mjs` | **The gate that renders it.** Four widths, full-page PNGs plus overflow / broken images / never-revealed elements / console errors. `cd .tmp && npm i` once, then `node shot.mjs ../home/services/invisalign/index.html`. |
| `.tmp/measure.mjs` | How long the page is and where the length went — px, screens, visible words and list heights per chapter. Run it before deciding what to cut. |
| `.tmp/probe-scene.mjs` | Drives the pinned path scene and asserts it does work: the track travels, the bar fills, every card reveals. A screenshot cannot tell you any of that. |
| `.tmp/probe-heights.mjs` | **The freeze gate.** Renders the homepage and the Invisalign page at four widths with reduced motion on and diffs every section height against a saved baseline. `--save base` before touching `site.css`, `--diff base` after; exits 1 if either approved page moved. |
| `.tmp/probe-hooks.mjs` | **Drives the generic runtime hooks, motion on.** Steps every `data-write` to 10 / 50 / 90% of its own trigger range and asserts a different number of written words at each; checks every `data-count` reached its value, every `data-rail` travelled, every `data-wipe` finished, the pin fits, and the console stayed clean. |
| `.tmp/probe-wall.mjs` | Opens every cell of the team page's name wall and clicks every link in the About page's spec index, then checks the index actually pins. A `<details>` photographs shut and a sticky column photographs as a list. |
| `.tmp/probe-tag.mjs` | Every `.chapter-tag`'s computed opacity, transform and box after a scroll-through. Tells "the reveal never fired" apart from "it is behind the header", which look identical in a PNG. |
| `.tmp/probe-map.mjs` | Whether the deferred map actually loaded — request statuses and the iframe's box, not its pixels. A map that is merely slow to paint and a map that is broken are the same screenshot. |
| `.tmp/backup-site.mjs` | Dumps a whole instance -- shell, every page's node graph, media records -- to one local JSON. **Run it before anything destructive.** |
| `.tmp/list-site.mjs` | Read-only inventory: which instance, who we are, pages, media, publish state. |
| `.tmp/run-converter.mjs` | Ships `container-convert.ts` into the container, sha-verified, and runs it under bun. |
| `.tmp/diff-live.mjs` | **Diffs a local page against its published twin** — head tags, every element signature, semantic tags, the attributes that get dropped, the visible text, and the box of every classed element. This is what finds the silent losses; run it after every import. |
| `.tmp/apply-image-alt.mjs` | Restores `alt` and the `loading`/`fetchpriority` hints, which the converter drops. **Run it before `import-styles.mjs`.** |
| `.tmp/apply-body-class.mjs` | Puts each page's `<body>` classes on its converted root node. Without it the homepage loses `has-journey` and comes up with a solid white header. **Run it before `import-styles.mjs`.** |
| `.tmp/import-fonts.mjs` | Installs Karla, Newsreader and Nunito Sans through Instatic's own font store. Without it the live pages render in Georgia and Segoe UI. |
| `.tmp/import-scripts.mjs` | The JS half of the code assets: gsap + site.js + journey.js as one registered script. |
| `.tmp/reset-to-deliverable.mjs` | Reduces an instance to what `home/` holds plus `KEEP`. Staging only, dry-run by default. |
| `.tmp/verify-live.mjs` | Checks the PUBLISHED pages: 200, styles applied, GSAP booted, images resolve, no overflow. |
| `.tmp/to-instatic.mjs` | Turns `home/` into what Instatic should hold. |
| `.tmp/upload-media.mjs` | Uploads the media manifest, writes the local → uploaded path map. |
| `.tmp/apply-stock.mjs` | The page→stock-frame map for the 31 treatment pages and Dr. Sung's portrait swap. Idempotent; `--check` reports. |
| `.tmp/stock-search.mjs` | Reads Unsplash search results through the installed Chrome (playwright-core) — ids, alts, links — for a contact sheet. |
| `.tmp/frame.mjs` | Crops and resizes one image (any format Chrome decodes) into the four-width JPEG set and registers it in `album-manifest.json`. `--probe` writes a labelled grid to find the crop box. For a frame that did not come from the album. |
| `.tmp/crop-tree.mjs` | The tree out of the logo as a transparent PNG (`mp-tree-mark.png`), the seals' mark. |
| `.tmp/bugherd/` | One review round: the BugHerd export (`tasks-<date>.json`), the scripts that applied its structural edits, and the push logs. |
| `.tmp/bugherd/pull.mjs` | Every task by id with its comments and attachments, screenshots and attachments downloaded (`screens-<date>/`). The list endpoint hides page, selector, browser and attachments. |
| `.tmp/bugherd/diff-rounds.mjs` | What moved on the board between two exports: description, status, selector, screenshot, comments, attachments. |
| `.tmp/bugherd/shot-tasks.mjs` / `shot-sel.mjs` | Each note re-shot where the reviewer stood (their page, `requester_browser_size`, their selector), in `webkit` or `chromium`; `shot-sel` takes named selectors. |
| `.tmp/bugherd/serve.mjs` / `shot-at.mjs` | `home/` served on :8089 like staging; one page at one size and scroll (or selector), with `--hover` / `--click`, in WebKit by default. `TASKS=tasks-<date>.json` points `shot-tasks.mjs` at a round's export. |
| `.tmp/bugherd/probe-fold.mjs` / `probe-split.mjs` | `probe-split`: after scrolling a page through, no heading may still be frozen in `.jr-line`s. `probe-fold`: opens every "read more" fold by click, then reads the opacity of later chapter headings and the split portrait's size: the stale-ScrollTrigger check (round three, #71/#77). |
| `.tmp/bugherd/logo-rows.mjs` / `logo-pad.mjs` | How close the logo artwork runs to its file's edges, and the re-export with margin inside the file (#3). |
| `.tmp/bugherd/apply-<date>.mjs` | The round's page edits, idempotent. Team portraits and other client images go in through `frame.mjs` first (`frame: "external"`). |
| `.tmp/bugherd/reply-<date>.mjs` | The round's replies on the board: one comment per task, `done` only for notes verified live. Dry run by default, `--send` posts. |
| `.tmp/album-sheet/render-cands.mjs` | Candidate album frames at 900 px with number and orientation, for choosing replacements by eye. |
| `.tmp/album-sheet/` | The client's Google Photos album as a numbered contact sheet (`render-sheet.mjs`), so "the photo with X" can be found by eye. Numbers match `album-urls.txt`. |
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

### The core pages, and what "not equal throughout the site" means

Client note, 2026-09-01: *"Make variations to the sections so we make sure they
are not equal throughout the site."* The nine pages of the Asana **Build Core
Pages** task (`1217892732561687`; pull it fresh with
`node deliver/brandklout/scripts/asana-context.mjs --task 1217892732561687 --out <dir>`,
the cached intake context does not contain it) were built against that note,
locally, for review. Two earlier drafts of About and Team from another session
were discarded on the client's instruction and rebuilt from scratch; their
`ab-`/`tm-` CSS block stays in the sheet as system vocabulary and three of its
parts are reused where they fit (`ab-oneword`, `ab-diptych`, `tm-schools`).

> **The chrome is constant, the chapter bodies vary.** The compact arrival, the
> credential strip, the breadcrumb, the invitation, the header and the footer
> are the same on all eleven pages, and are stamped from the Invisalign page so
> they cannot drift. Varying those is not variety, it is a site that looks like
> eleven different sites. What varies is the *body* of each chapter. Every
> page carries at least two layouts that appear on no other page; the shared
> scrubbed scenes (the pinned path, the proof rail, the written statement)
> are system components and recur, never in the same sequence.

**The runtime binds by attribute now, not only by chapter class.** The homepage's
scenes are tied to `.ch-relay` / `#relayBig`, `.ch-together` / `#mqRow` and so
on, which was right for one page and would have grown a page-specific branch
per page after that. The second IIFE at the end of `journey.js` reads six
hooks off the markup instead, and the two approved pages carry none of them:

| Hook | What it does | Where it is used |
| :--- | :--- | :--- |
| `data-write` | The relay's word-by-word scrub on any element. Unwritten colour from `.ch [data-write]` (0,2,0, so `.ch p` cannot beat it), readable on `jr-fail` and reduced motion. `data-write-to` overrides the target colour. | About, Doctors, Team, Financing |
| `data-count` | Counts up to the value the HTML already states. `data-decimals`, `data-prefix`, `data-suffix`; `data-counters` on the group sets the trigger. Skipped inside `.ch-together`. | Doctors, Reviews |
| `data-rail` | The proof rail's sideways travel on any row, above 900 only. | About |
| `data-marquee` | The velocity-reactive marquee. | Team |
| `data-wipe` | The doctor plates' clip-path reveal on any frame. | About, Services, New Patients, Membership |
| `data-stagger` | Children of a grid arrive one after another. | Most card grids |

`probe-hooks.mjs` is the check: it steps each `data-write` to 10 / 50 / 90%
of its own range and requires three different word counts, which is the
"scrubbing is real" assertion from DESIGN-STANDARD.md. All nine pages pass it.

The layouts, all in the `cp-` block at the end of `site.css`:

| Page | Chapters, in order, and the layout each body uses |
| :--- | :--- |
| **About** | Premise: `cp-manifesto`, the practice's own sentence centred and written word by word, over a `cp-facts` strip. Building: `cp-mosaic`, three photographs at three sizes on a twelve column grid with one caption panel. Our Dental Family: `cp-rail` of `cp-person`, the practice's three verbatim headings on a row the page scrolls sideways. Instruments: `cp-spec`, the technology page as `<details>` rows on ink beside a sticky photograph. The Word: `ab-oneword`, a four word review. |
| **Doctors** | Specialist: `cp-split`, half ink with the portrait edge to edge, half warm with her own words written word by word, facts in `cp-dl`. Generalists: `cp-duo` of two `cp-dossier`, portraits capped to the smallest asset. Training: `tm-schools`. Measure: `cp-figures`, four counted numbers from the bios on ink. Voices: `cp-voices`, one whole review per doctor, no rail. |
| **Team** | Doctors: `cp-bylines`, one strip. Named: `cp-ticker` marquee of first names, then `cp-people` rows, name at statement size beside the review it came from. Reason: `cp-statement`, one sentence written on ink with a watermark. Off Duty: `cp-asides`, six cells on a drop initial, closing on `cp-band`. |
| **Services** | Map: `cp-depts`, eight groups on a twelve column sheet, tiles sized by count, every treatment a chip. Finder: `cp-finder`, problem on the left, where the practice would start on the right. Two Practices: `ab-diptych`. Offers: `cp-menu`, the published offers as a price list with dotted leaders. |
| **New Patients** | Offer: `cp-ticket`, $189 at the arrival headline size with the inclusions as a receipt and two stubs on a dashed edge. First Visit: `ch-path`, pinned, six steps. Bag: `cp-checklist` beside `cp-bring_tour`. Questions: `cp-qa`, open two-column Q and A. Proof: the shared quote and rail. |
| **Financing** | Rule: `cp-promises`, three lines written word by word, each stepped further in. Ways to Pay: `cp-matrix`, a real `<table>` that becomes labelled cards below 768, then the base accordion. Plan: `cp-callout`, a full bleed sand band. |
| **Membership** | Membership: `cp-card`, the plan drawn as a tilted card that straightens on hover. Inside: `svc-ledger` then `vs-table`. Who It Is For: `cp-situations` beside one photograph. Join: `cp-steps` on one hairline. |
| **Reviews** | Number: `cp-score`, 4.9 counted at 1.35 times the arrival size. Proof: the shared quote and rail. Wall: `cp-wall`, CSS columns so no review is trimmed. Kids: `cp-kids` on ink with the sage pill. Write One: `cp-callout`. |
| **Thank You** | Right Now: `cp-callbox`, the number at chapter headline size with the hours. Next: `cp-timeline`, three moments down a rule. Meanwhile: `svc-grid` of linked cards. `noindex`. |

Things that cost a round, and will cost the next batch one too:

1. **A chapter tag inside a component that styles `b` takes that component's
   size.** `.cp-score_num b` made the tag read THE NUMBER at 140px. Scope
   numeral rules to `> b`, and keep `.chapter-tag` out of any block that
   styles bare `b`.
2. **`height: 100%` on an image in an auto-height grid cell resolves to auto.**
   The split's portrait left a band of bare ink under itself; above 900 it is
   absolutely positioned inside the cell instead.
3. **A card that is an `<a>` inherits the base underline on every word.**
   `a.svc-card` resets it; the Invisalign page's cards are `<article>` so the
   rule cannot reach them.
4. **A rail that barely overflows does not read as a rail.** Three 26rem
   people fit a 1440 row with 16px to spare, so the travel was invisible; at
   30rem the row is wider than the screen and the scrub has somewhere to go.
5. **shot.mjs's mobile full-page capture repeats the top of the page at the
   bottom.** It does it to the approved homepage too. It is a Playwright
   artefact of full-page capture under `isMobile`, not a duplicate section;
   `probe-heights.mjs` reports the real height.
6. **Five facts on a centred strip orphan the fifth.** Four, or six.

### The named, and why the team page is built this way

**The practice publishes no staff roster** — no names, no roles, no portraits
for anyone but the three doctors, checked across the whole crawl. Both
dishonest ways to fill that gap are already on this client's record: the old
site ran four awards it had not won, and a smile gallery of theme stock
presented as its own results.

So the team page names **only the people the practice's own patients name in
their own Google reviews**, each row carrying the review it came from whole,
and asserts a role only where a review gives one ("Genevieve is a great dental
hygienist" — Abi O). The disclosure is in the chapter, not just in a commit
message.

**Deliberately not merged: "Gen", "Jen" and "Jenn."** Five further reviews use
them and they may be Genevieve spelled by ear. The page says so. Publishing a
colleague's name at a guess is not a recoverable error. **Ask the practice** —
see the open items below.

**The reviews come from two places and both are the practice's own.** The
homepage and the Invisalign page carry six reviews from the intake; the
Trustindex widget the old site embedded (`01-content-intake/.tmp/site-scrape/
assets/cdn.trustindex.io/.../richsnippet.json`) carries twenty more, with
dates, and the 4.9 / 1,037 aggregate the reviews page states. Everything is
shown whole, spelling and all, and the one Spanish review is shown in Spanish
with `lang="es"`.

**Chrome is stamped, bodies are authored.** The nine pages were produced by a
scratch stamper that took the head, header, footer and script tags from the
Invisalign page, rewrote the asset prefix, expanded an `{{img key=…}}` macro
into `src`/`srcset`/`sizes` from what is actually on disk under `uploads/`,
and wrapped a hand-written body. The stamper is not in the repo, on purpose:
`home/<slug>/index.html` is the source from here on, exactly as the homepage
is. If the chrome changes on all eleven pages at once, write a new one.

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

> [!IMPORTANT]
> **A closed `<details>` is not shown, wherever it sits — `check.mjs` now strips
> folds before measuring.** The ceiling is on what the reader is *shown*, and
> `lf-more-in` was left out of `HOLDERS` for exactly that reason. That only
> worked while every fold sat OUTSIDE a holder, which is where the service page
> happens to put them. Put one inside a holder, as About's spec entries do, and
> its hidden paragraphs were measured as a run of their own: the page was
> reported at 131 words for prose nobody sees until they open it — **penalised
> for applying the fix.** Four new holders were registered at the same time
> (`ab-open_col`, `ab-spec_item`, `tm-row_body`, `tm-note`); a new prose
> container still has to be added by hand, or the gate silently reports 0 words
> for a page full of prose.

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

### The elevation, and the practice's own photographs

Client note, 2026-09-02, reviewing staging: *"There is too much text overall in the
staging site. If you can make a design improvement like we did on the stone site ...
More images, less text and more animations."* The Stone Surgical Arts elevation of the
day before is the model (`bk-stone/.../site-src/css/52-elevate.css`, `js/12-elevate.js`);
this is the same set of components in Mason Park's vocabulary, applied to all eleven
pages, and fed with the practice's **own** photographs.

**The photographs.** The 2026-08-28 handoff pointed at a Google Photos album
(`photos.app.goo.gl/k9MzHrudUfh4QhpW9`, "MARKETING PHOTOS", 212 frames) that nothing
had used. It is the practice itself: the front desk, the treatment rooms, the sterilizer,
the scanner, the team in their own scrubs, real families on the waiting room sofa.
`.tmp/import-album.mjs` fetches sixty of them at the four srcset widths straight from
Google (`=w<px>` on the frame URL) into `home/assets/uploads/2026/09/` as
`mp-<what-it-shows>-<w>x<h>.jpg`, and `.tmp/recompress.mjs` runs them through Chrome's
canvas at quality .8 (54 MB to 40 MB; no sharp in this folder). `album-manifest.json`
carries the alt text and sizes. **The folder is gitignored like every other upload**, so
on a fresh clone run `import-album.mjs` then `recompress.mjs` before `check.mjs` will
pass. The rule at the top of `import-album.mjs`: rooms, people at work, and patients who
sat for the practice's own marketing photographs; never the intraoral before/after pairs
(a clinical result is the practice's claim to make) and never frame 187, which is a
patient record with a name and a phone number on it.

> [!IMPORTANT]
> **The first cut of this layer was a port of the Stone components, and the client said so:**
> *"You practically cloned the stone site structure. That's not good. None of our client
> sites should be the same. Make variations of the sections."* The second cut, the same
> day, replaced every Stone-shaped part (catalogue accordion with a sticky photograph,
> cursor-following index, review carousel, filmstrip marquee, ghost words, town ticker,
> veil, hero inset, masked photograph behind a dark chapter) with shapes the Stone build
> does not have. The rule from here: **a component may share a technique with another
> client's build (a mask reveal, a parallax frame); it may not share a shape.** Before
> adding a section, grep the other worktrees' stylesheets for the idea, not the class name.
>
> **And this site is the GENERAL practice.** The pediatric practice, Mason Park Kids, is a
> separate site on its own Railway instance in the `bk-mason-park-kids` worktree. The
> first cut leaned on the album's photographs of child patients and grew a "Pediatric
> Side" chapter and a "For kids" services group; the client called it context
> contamination. The second cut carries no child-patient photograph (`kid-*` slugs are
> unused; `girl-chair-*`, a teenager, appears on the Invisalign page only, which the
> practice markets to teens), no kids chapter, and names Dr. Nguyen as the pediatric
> dentist *across the hall*, because the approved homepage argument, one building for the
> whole family, still needs her to exist. Do not add child photography to this site.

**The layer.** `home/assets/elevate.js` (sixth script tag on every page, sixth part of the
Instatic bundle) and the `el-*` block at the end of `site.css`. Every hidden state is
scoped to `html.el-ready`, which the script sets first, so a page without it is the plain
page; `html.el-reduce` is the reduced-motion branch; GSAP is optional (the scrubbed parts
use it and leave their still state without it; the tabs, finder, sheet and seal run on
CSS and plain listeners). The components, none of which the Stone build has:

| Part | What it is | Where |
| :--- | :--- | :--- |
| `data-el="mask"` | A frame that opens from the bottom as it enters, the photograph settling from a slight over-scale | most photographs |
| `data-parallax` | The photograph drifts inside its frame with the scroll | heroes, mosaics, overlaps |
| `el-stack` | Three fanned frames at the hero's edge that spread as the page starts to scroll; the rating sits in the hero's fact strip as `el-rating` | home |
| `el-columns` | A photo wall in three columns moving at three speeds against the scroll; a snapping row below 900 | home |
| `el-tabs` | Service groups as a row of display-size tabs; the active one shows a big frame and its chips | services (the map) |
| `el-finder` | Rows of what is wrong, and a sticky side panel whose photograph and caption follow the row under the pointer | services |
| `el-deck` | Reviews as cards that pile on each other as the page scrolls (CSS sticky), the covered ones scaled back by GSAP, a photograph in the pile | home |
| `el-pair` | Two half-bleed photographs sliding in from either edge, a line of type between them | home, about, doctors, team, new patients, financing, savings plan |
| `el-pillars` | Three tall portraits revealed left to right on the scroll, a name, a role and one line each | about (the three doctors) |
| `el-pane` | A tall photograph in a narrow column beside a dark chapter's copy | doctors, team, services, reviews |
| `el-sheet` | A contact sheet, grayscale at rest and colour under the pointer, one caption line for the tile under it | about, team |
| `el-seal` | A ring of type built from `data-text`, turning with the scroll, a mark in the middle | about, new patients, reviews, financing, Invisalign |
| `el-mosaic` | Photographs at three sizes on twelve columns, one sentence in the cell that is not a picture. This site's own `cp-mosaic`, elevated | about |
| `el-trio` | Photograph cards with one line each, leaning toward the pointer (`data-el-tilt`) | new patients, financing, thank you |
| `el-fold` | The prose that stayed, folded under a summary. `check.mjs` strips it like `lf-more` | wherever the practice's own paragraphs were |

The homepage's own proof scene (`ch-proof`: the written quote beside a photograph and the
rail that travels with the scroll) is back on the new patients, reviews and Invisalign
pages, because it is Mason Park's, and the doctors page keeps its three `cp-voices`.

**What "less text" measured.** Visible words in `<main>`, folds excluded, before and after:
home 1,489 to 1,383; about 638 to 418; doctors 995 to 858; team 1,085 to 699; services
818 to 764; new patients 1,265 to 778; reviews 1,534 to 1,474 (the wall is the page);
Invisalign 1,302 to 929. Images in `<main>`: 36 to 48, 14 to 27, 10 to 24, 11 to 25, 9 to
38, 9 to 19, 8 to 23, 17 to 22. Nothing the practice wrote was deleted: it is in an
`el-fold` or an `lf-more`.

**How the pages were rewritten.** `.tmp/splice-main.mjs <page> <body>` replaces a page's
`<main>` with an authored file and runs `.tmp/expand-img.mjs`, which turns
`{{img slug="kid-xray-smile" sizes="..."}}` into the full `<img src srcset sizes alt
width height>` from the manifest, with the asset prefix worked out from the page's depth.
Author with macros; never type a srcset.

**The nav.** Client, same day: *"Remove the links that don't exist in the nav bar."*
`.tmp/prune-nav.mjs` rewrites the header menu, the two footer columns and the legal row on
every page to the eleven routes that exist, and reports any other internal href that does
not resolve (`--check` to report only). It passes on all eleven pages. The treatment chips
in the services catalogue are dashed `<span>`s, not links, for the same reason: a chip
becomes a link the day its page exists.

Three things learned, for the next pass:

1. **A full-page capture lies about `data-el="mask"` frames** the same way it lies about
   the scrubbed scenes: the observer never fires for a tile the capture did not scroll
   into, so the mosaic photographs came out as blank boxes. `.tmp/probe-el.mjs <page>
   <selector> [width] [out.png]` parks one element in the middle of a real window, waits,
   screenshots it and reports every image inside it (loaded, natural size, box, opacity,
   clip, and any request that came back 4xx). Use it before believing a blank.
2. **Instatic drops `width`/`height` on images**, which changes what `aspect-ratio: auto`
   resolves to. The home page's pair of photographs measured 975px locally and 604px
   live because the local image kept its attribute ratio and the live one filled its flex
   column. A fixed `aspect-ratio: 5 / 4` on that image makes both agree (`height: 0` on the
   flex item did not; the grid row still took the attribute ratio); look for the same shape
   wherever a rule relies on an image's intrinsic ratio.
3. **A `<button>` may hold text and nothing else** on Instatic, so every control in the
   layer is an `<a>` with a real in-page href (the tabs, the finder rows) or a plain
   element with a `tabindex` (the sheet tiles). Nothing here is a `<button>`.
4. **The word and image counts above are the first cut's.** The second cut kept the
   word counts within a few percent and dropped some images with the child photographs;
   run the counting one-liner in the runbook rather than trusting this paragraph.

### The second elevation, 2026-09-10: the messy layouts, the blog, and Dr. Sung's portrait

Client note, 2026-09-10: *"Elevate the design on the services pages, the blog overview page
and articles pages ... There are some layouts that look messy. Look for a Dr. William photo
with higher resolution ... If you need to add images use stock photos related to the
content."* Everything below is the `sv-`/`bl-` block at the **end** of `site.css` (after the
`el-` layer and the first `bl-` block), and it is scoped so the homepage's four heights do
not move; the Invisalign page moves deliberately and the height baseline was re-saved.

**What was messy, and the fix.**

| Where | What was wrong | What it is now |
| :--- | :--- | :--- |
| `svc-grid` (the qualify 4-up and the why 3-up) | Photo cards and text cards each took their own height, so a row read as four boxes at four heights with holes under the short ones; the stagger made it worse. | Rows are equal height (`align-items: stretch`). A card **without** a photograph is a *tonal plate*: sand ground, the numeral at 3.4rem (or a drawn copper diamond where there is no numeral), the copy at the foot. Photo and plate alternate and the set reads as one mosaic. The rule is `:has()`-based, so no markup changed. |
| `svc-card_media` | A fixed 4:3 image left a band of empty panel under itself in a tall row. | The wrapper carries the aspect ratio and grows with the row; the image is absolute inside it. The why grid uses 16:10 so its plates do not tower. |
| `svc-ledger` inside an overlap panel | "Porcelain-fused-to-metal" ran out of its cell and was clipped. | Labels wrap (`overflow-wrap: anywhere`); a ledger inside a panel is two columns, not auto-fit. |
| `svc-provider` | Sized to hide a 230×300 thumbnail. | A 24rem portrait on an offset hairline plate, in colour. |
| `bl-grid` | 161 identical white cards, a WordPress listing. | A topic strip (`bl-topics`: counted numbers, the practice's photographs, and each tile a **filter** for the grid), the newest article as a sand plate across the first row, an ink card every ninth, a numeral on every card (a CSS counter, so the loop needs nothing). |
| The article | A 72ch column with two thirds of the screen empty beside it. | `bl-art`: a sticky rail (contents built from the headings by `elevate.js`, topic, date, reading time, the booking button, one photograph) beside 66ch of prose with a lede, a drop cap, ruled headings; related articles as the same cards the index uses. |

**Dr. Sung's portrait.** The only file the practice ever published was
`DrWilliamSung-230x300-1.webp`, and Wayback has nothing larger under either domain. His
*other* practice, Grand Mission Dentistry (`grandmissiondentistry.com`, a Webflow site),
publishes a 3703×4000 studio portrait of him in a white coat. It is cropped 3:4 at the four
srcset widths as `mp-dr-sung-*.jpg` and registered in `album-manifest.json` as `dr-sung`
with its source. The 459×600 file on the same site named "DrWilliamSung (1)" is **a
different person** — check the face, not the filename.

**The stock photographs.** With the client's leave, every treatment page's Treatment
overlap now carries a photograph *of the treatment* — a crown on a model, an aligner, an
extracted tooth — rather than a generic frame of the practice. They are Unsplash (Unsplash
License), registered as `stock-*` in the manifest with their photo ids, cut 3:2 at the four
widths. Two tools: `.tmp/stock-search.mjs` drives the installed Chrome through
playwright-core to read Unsplash search results (curl gets a 401 and the Chrome extension
blocks the JSON API), and `.tmp/apply-stock.mjs` holds the page→frame map and does the
swap, idempotently, then expands the macros. Pick frames from a contact sheet, never from
the alt text: "a pile of chocolate" is a row of crowns and "a white candle" is the crown on
a black model. Stock rules that still hold: no child patients, and nothing captioned as the
practice's own result.

**The CMS side of the blog.** The article body on Instatic is a `base.outlet` and the index
a `base.loop`, so the design lives in CSS and `elevate.js`, not in per-article markup.
`build-blog-templates.mjs` now shares one `CARD` string with `build-blog.mjs`'s `cardsFor`
— keep them in step — and tokenises the rail's `bl-art_topic` / `bl-art_date` cells, or
every article shows the sample's. The topic filter compares the card's `.bl-card_meta b`
text with the tile's `data-topic`, normalised to letters, and re-applies through a
MutationObserver when "Load more" appends cards.

### The review round, 2026-09-10: 48 BugHerd notes on five pages

The agency reviewed staging on BugHerd (project 539151) and left 48 notes on the home,
About, Doctors, Team and Reviews pages. The export with every note, selector and screenshot
is `.tmp/bugherd/tasks-2026-09-10.json`; the per-number disposition is in the runbook run of
the same date. What changed the *system*, as opposed to a line of copy:

**The inner pages no longer open like the homepage** (#41, "change up the home design from
the rest of the pages"). Every page's arrival was the homepage's: full-bleed photograph, veil,
headline bottom-left. `.ch-arrival.is-compact` is now a **split** — copy on ink in the left
column, the photograph held to the right 46% behind a soft fade, a copper rule under the
band; below 768 the photograph drops under the copy. Pure CSS at the end of `site.css`, no
page markup changed, and the homepage's own arrival (no `is-compact`) is untouched.

**The credential strip is homepage-only** (#37 "we don't need this, it's already on the
other page", #41). It left all 44 inner pages; `.ch-arrival + .padding-global` restates the
rhythm the strip used to set. The two square marks (Seattle Study Club, AAPD) carry
`li.is-mark` and render larger than the wordmarks (#25, #26); the label is readable (#24).

**Dr. Sung's portrait is `dr-sung-standing`**, everywhere (#16, "no arms crossed, we should
have one from Grand Mission without his arms crossed"). Both the 230×300 thumbnail and the
3703×4000 studio portrait have his arms crossed. `grandmissiondentistry.com` publishes
`GrandMissionDentistry(15of28).webp`, 3931×5241, Dr. Sung standing beside Dr. Nguyen with
his arms down; `frame.mjs` cropped it to him (1400 px wide, so the 1536 candidate is a 10%
upscale) at the four widths the srcsets use. The 29 provider bands and the four doctor
pages all point at it; `apply-stock.mjs` writes the new slug. **The old `mp-dr-sung-*`
files stay on disk and on the instance; nothing references them.**

**Dr. Nguyen first, then Dr. Cho, then Dr. Sung** (#15, #34) on the home cards, About's
pillars, Team's bylines and About's manifesto. `.tmp/bugherd/reorder-doctors.mjs` did it
because those blocks carry srcsets; it is idempotent.

**The team page names nobody** (#44, "Google policy is not to use employee names in
reviews"). The Named chapter — the marquee of first names and the rows quoting the reviews
that name them — is gone, with the arrival, the statement and the invitation rewritten to
lead with the doctors (#46). The team portraits the agency mentioned (#43) are in their
Canva; when they arrive, that is the chapter to rebuild. `probe-wall.mjs`'s wall half is
now a no-op.

**The seals carry the tree** (#36, #48). `crop-tree.mjs` cuts the tree out of the logo at
4x as a transparent PNG; the seal `<div>` holds it as a real `<img>` (the exporter only
rewrites media it finds in `src`/`srcset`, so a `data-` attribute would have shipped a
local path) and `seal()` in `elevate.js` keeps an existing `<img>` as the mark. The
treatment pages' seals keep their own marks (`$`, a check, the sun, `0%`) — those mean
something.

**Three new album frames** (`import-album.mjs` PICKS): `team-huddle` (134) for the home's
people band, because the front-desk frame read glum (#21); `team-window-smile` (85) for the
team page's narrow pane, which cropped a landscape frame (#45); `desk-checkin-pair` (33) for
About's 16:9 invitation shot, which cut a head off a portrait frame (#40).

**The pillars reveal together** (#38). The reviewer caught the left-to-right stagger
mid-scroll and read three clip heights as a broken layout; a screenshot cannot tell the two
apart, so the three now rise together, unclipped. **The doctors' dossiers share rows**
(#42) through CSS subgrid, so names, facts and folds align.

**The hero stack is a link and flips** (#2). `<a class="el-stack" href="/our-team/">`, and
`stackCycle()` in `elevate.js` swaps the top frame's photograph every 3.8 s with a fade.
Only the top frame changes, so the GSAP fan is untouched.

**Not done, and why.** #1 wants the hero photograph to be "the one with Dr. Nguyen and Dr.
Sung with their kids": it is in neither the album (212 frames, contact sheet in
`.tmp/album-sheet/`), the old site's uploads, nor Grand Mission's site — the agency has to
send it. #3 ("the bottom of the logo is being cut off") does not reproduce: the logo
renders whole in Chrome at 1440/2x on both the local build and staging (`.tmp/bugherd/
shot-header.mjs`); the artwork has two pixels of margin under DENTAL, which may be what was
seen. Ask for the browser and width.

**Traps this round added.** `frame.mjs` and `crop-tree.mjs` embed the source as a data URI
inside `setContent` — a `file://` image in `setContent` never loads, and `page.goto` on an
image file opens Chrome's viewer, which ignores an inline restyle, so a crop silently comes
out as the whole frame. Several `home/**/index.html` files mix CRLF and LF; a regex anchored
on `\n` matches some pages and not others — use `\r?\n`. And **never export
`RAILWAY_TOKEN` from `.env` before the Railway steps**: the CLI is logged in on its own and
the exported token answers "Unauthorized"; a chain built on `node x | tail` does not stop
there, and the first push of this round published the new stylesheet over the old pages
before the run was caught and redone.

### The review round, 2026-09-15: the same 48 notes, checked in the reviewer's browser

Nothing new was written on the board: no comments, no edited notes, no status moves. The
19:32–19:34Z touches on #1–#33 were the agency **assigning** those notes (the 09-10 export
never recorded assignees, so the change was invisible until each task was pulled whole). What
the whole pull did show was two things the 09-10 round had missed:

**Every note was filed from Safari 26.6.2 on a Mac at 1512×735** (`requester_browser`,
`requester_browser_size` on each task), and the 09-10 round had verified in Chrome at 1440.
So a note that "does not reproduce" has to be tried in WebKit at the reviewer's size before it
is called unreproducible: `node .tmp/node_modules/playwright-core/cli.js install webkit` once,
then `shot-tasks.mjs webkit <origin> <out>`.

**Six notes carry attachments** (#3, #5, #6, #15, #38, #42): the reviewer's own crops, which
the 09-10 export did not fetch. #3's is the logo with the foot of the L gone, which settled
"which browser" without asking.

What changed in the build: the logo has air inside its box (Safari clips a filtered image at
the box's fractional edge, and the artwork has under a CSS pixel under DENTAL); the relay's
closing sentence has a photograph beside it (#6); the home band is a smiling huddle frame
(#21); and **the team page uses its own photographs** (#45) — ten of its frames were swapped
for album shots used nowhere else, one scene per slot, so none of its team photos repeat the
home page. Per-photo framing is keyed on the file (`img[src*="mp-<key>-"]`), which survives
Instatic's `/uploads/<id>-` rename, so the rule follows the picture and not the slot.

**`import-album.mjs` used to delete `frame.mjs`'s entries.** It rebuilt `album-manifest.json`
from `PICKS` alone, so every re-run dropped the `frame: "external"` frames (Dr. Sung's
`dr-sung-standing`, on 33 pages). It now carries them over.

**Answering the board.** `reply-<date>.mjs` writes one comment per task and moves a note to
`done` only once it is verified live; a note that needs the agency (a photo they hold, a
browser we cannot run) gets a question and stays in `todo`. Never write to Asana from here.

### The review round, 2026-09-16: 28 new notes, and the rules they set for the whole site

Filed at **1512×652** this time; the window size changes between rounds, so read it per task.
Four of the notes are general rules rather than fixes to one page, and the build now follows them:

- **Mason Park stands alone as a cosmetic and general practice** (#53). The pediatric practice
  is *referenced* as Mason Park Dental for Kids, never sold as part of this site. The home page and
  the services page were reworked; other inner pages still carry "two practices" copy.
- **Text never waits on scroll to be readable** (#64: "these are going to be ADA issues ... on all
  pages and sites moving forward"). Unwritten words are `--jr-unwritten` (.66 alpha, ≥4.5:1) and the
  write finishes by the time the element's top is past mid-window.
- **Photographs are colour at rest** (#67, #75). No grayscale-to-colour on scroll or hover.
- **Nothing on the page may leave ScrollTrigger stale.** `journey.js` refreshes when the document
  height changes; a fold that grew the page had been fading headings still on screen (#71, #77).

Also: button hover fills sit behind the label (#54/#55), the split portrait is held on "read
more" (#73/#74, measured on click because `toggle` fires late), the header logo is a PNG with
margin inside the file (#3), and the team page has the agency's named portraits (#43). The client's
Drive is a **shared drive** (`drive.mjs roots`), and Asana detail can live in a comment on an
unrelated task (`search_tasks` over the workspace found #65's insurance note).

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
node apply-body-class.mjs                              # 8b. <body class> onto the converted root
node apply-image-alt.mjs                               # 8c. alt text + the eager/high hero hints

node import-fonts.mjs                                  # 9. the three families, self-hosted by Instatic
node import-styles.mjs                                 # 10. class rules + site.css as a code asset
node import-scripts.mjs                                # 11. gsap + site.js + journey.js, bundled
node reset-to-deliverable.mjs                          # 12. dry run: what would be deleted
node reset-to-deliverable.mjs --apply --publish        # 13. one atomic PUT, then publish
node verify-live.mjs $INSTATIC_BASE_URL / /services/invisalign   # 14. check what actually shipped
node diff-live.mjs ../home/index.html $INSTATIC_BASE_URL/         # 15. and diff it against the local page
```

### The BugHerd sidebar is on staging, and only staging

The client reviews on BugHerd, so staging carries their sidebar snippet on every page since
2026-09-01. It is **not** a page edit: `to-instatic.mjs` strips every `<script>`, and a code
asset is inline JS by content with no `src` field, so `src/scripts/bugherd.js` is a four-line
loader (`placement: head`, `timing: immediate`, `scope: all-pages`) that appends the real
`<script src="https://www.bugherd.com/sidebarv2.js?apikey=…">`. `import-bugherd.mjs` registers
it, `--remove` takes it off, and both refuse any host that is not staging.

The other half is the CSP. The published page says `script-src 'self'`, and BugHerd needs
`www.bugherd.com` as a script origin (the loader, which 302s to `sidebar.bugherd.com/embed.js`)
and `sidebar.bugherd.com` as a script origin (the bundles) **and a frame origin** (the
communication `<iframe>` at `sidebar.bugherd.com/sidebar/embed_html` — not `www`, which the
first pass allowed instead). Those go into the embed-origins plugin:

```bash
cd ../../../../process/18-instatic-embeds
INSTATIC_BASE_URL=https://staging.masonparkdental.com node set-origins.mjs \
  --frame "https://www.google.com https://sidebar.bugherd.com" \
  --script "https://www.bugherd.com https://sidebar.bugherd.com" \
  --connect "https://notify.bugsnag.com https://sessions.bugsnag.com"
```

`set-origins.mjs` reads the current record and merges the flags you pass; **the host's settings
`PUT` replaces, it does not merge**, so before that fix a call carrying one box emptied the other
two. Plugin settings take effect at the next publish, so the order is: origins, then
`import-bugherd.mjs --publish` (or a bare publish). `probe-bugherd.mjs <url>` reads the live
CSP, loads the page in Chrome and lists every bugherd request and CSP refusal. **A browser not
logged into BugHerd sees the loader, the communication frame and the `resources` call, and no
sidebar** — the sidebar is served only to a logged-in reviewer, which is how the public never
sees it. So the probe proves the policy, the loader and the frame; only a logged-in browser
proves the mount.

**A short-lived plugin 1.5.0 was reverted the same day.** It added a "compatible policy on every
page" switch to chase a sidebar that would not open; the cause was the VPN below, and the typed
boxes were enough all along. A logged-in sidebar also opens a Pusher websocket and builds `blob:`
previews, which the boxes cannot express; it degrades to no live updates rather than failing.

**This is a staging posture.** Production has no BugHerd. When staging graduates:
`import-bugherd.mjs --remove --publish`, then `set-origins.mjs --frame https://www.google.com
--script "" --connect ""` and publish.

**Two more things that looked like the site and were not.** The key in the snippet is the BugHerd
*project* key: the first one the client sent belonged to the Dr Nahlah project, and the Mason Park
project (`api_v2/projects/539151.json`, key `qvkdzpx4…`) has its own. And on the client's
workstation the sidebar failed with a `204` from `sidebarv2.js` *with the session cookie sent*:
**NordVPN Threat Protection** intercepts Chrome's HTTPS (certificate issuer
`NordVPN S.A. -ThreatProtection`) and blanks the script when a page loads it, while a direct
navigation to the same URL is allowed. Headless Chrome on the same machine is filtered too, so
`probe-bugherd.mjs` reports the 204 as well; node and curl are not. Check the certificate issuer in
DevTools > Security before blaming the page. Fix: allowlist `bugherd.com` in Threat Protection.

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
**The converter keeps four props on an image and throws the rest away.** `base.image` holds
`src`, `loading`, `fetchPriority` and `decoding`. So:

- **`alt` is dropped on every image** — 0 of 38 described on the homepage, against 24 in the
  source, and the 81-page site that was here before had the same hole. `props.alt` is *ignored*
  by the module; it has to go through `htmlAttributes`, the escape hatch the map iframe's node
  uses. The module then emits its own empty `alt=""` as well, so the published tag carries two —
  ours first, which is the one every parser and screen reader takes.
- **`loading` and `fetchPriority` are overwritten with `lazy`/`auto`**, so the hero — the LCP
  element, deliberately eager and high priority — was published lazy along with all 38 images.
- `srcset` and `sizes` go too, and that one is fine: Instatic generates its own srcset at publish,
  in webp and with more breakpoints than we ship.

`apply-image-alt.mjs` restores the first two. It pairs source `<img>` tags to image nodes **by
document order, and verifies the pairing against the src sequence before writing** — keying by
`src` is wrong in both directions, because the homepage's `rg-thumb` thumbnails deliberately reuse
the arc photographs' src with an empty alt.

**An `<iframe>` does not survive publish, and then CSP blocks it anyway.** The converter stores it
correctly as `tag: "custom", customTag: "iframe"`, but the publisher ignores `customTag` and emits
a plain `<div>` carrying the attributes — so the map was a 579×0 hole. (Production has the same
hole; the map has never worked there.) `site.js` builds the real element at runtime now, from
either shape. That is only half the fix: the published CSP is `frame-src 'none'` until the origin
is allowed, and **`autoTrust` cannot help here** because it scans the stored page, where there is
no iframe and no `src` — only a `data-src` on a div. Allow it explicitly, then republish:

```bash
cd ../../../../process/18-instatic-embeds
INSTATIC_BASE_URL=https://staging.masonparkdental.com node set-origins.mjs --frame https://www.google.com
```

**The body's own classes are content, and the exporter throws them away.** `transform()` ships the
body's *children*, so `<body class="has-journey">` becomes an unclassed body on Instatic — and that
one class is the switch for about forty rules: the transparent floating header, the white links,
the inverted logo, and `.main-wrapper`'s negative top margin that pulls the hero up behind the
chrome. `journey.js` checks for it too, so its chrome scene bails and `--jr-nav-h` is never
measured. **Nothing errors.** The page is simply the ordinary white-header version.

`apply-body-class.mjs` fixes it, and **must run before `import-styles.mjs`** — Instatic emits a
class attribute only for a class it holds a style rule for, and import-styles harvests those rules
from the converted pages' `classIds`. Patch after it and the class is in the node graph, missing
from the registry, and missing from the HTML.

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

## Open items for the practice — the core pages

None of these blocks review. All of them need somebody other than an engineer.

| # | Item | Why it matters |
| :--- | :--- | :--- |
| 1 | **A real staff roster: names, roles, and photographs.** | The team page names eight people because patients named them on Google. That is honest and it is not a substitute. Ask for the list, the job titles, and headshots on the same day and the same wall as Dr. Cho's and Dr. Nguyen's. |
| 2 | **Are "Gen", "Jen" and "Jenn" Genevieve?** | Five reviews use those spellings. Not merged, and the page says so. One answer adds a name or confirms a spelling. |
| 3 | **A larger portrait of Dr. Sung.** | His only published headshot is 230×300, from a different shoot to the other two. Every component that shows him is capped to that width and greyscales all three to reconcile it. |
| 4 | **Confirm the office hours, again.** | Every page publishes the live site's hours (Mon/Wed 9–6, Tue/Thu 8–5, Fri–Sun closed). The doctors' old bio pages say Mon 9–7, Tue 7–5, Wed 8–6, Thu 7–5, **Fri 7–5**, and the old landing page says "open on Saturdays as well". See Open Question 9 in the project overview. |
| 5 | **Are the published offers current?** | `/our-services/` and `/new-patients/` restate the $189 / $129 / $350 specials, the Invisalign and implant $1,000 discounts and the free second opinion exactly as the old site published them. Nobody has confirmed they still stand. |
| 6 | **The membership plan's fee, and its brochure.** | The plan page states what the practice published: two exams, two cleanings, discounts, no pre-authorization, no pre-existing exclusions. It does not state a price, because the practice never published one, and the brochure the old page linked was not in the crawl. |
| 7 | **The new patient forms.** | The old site said forms could be completed online but the crawl captured no link. New Patients and Thank You say "ask the front desk to send them". A URL turns that into a button. |
| 8 | **Where should "write a review" go?** | The old blog's "Click here" link was not captured. The reviews page sends people to the Google Maps listing, which carries the review button. A `g.page` review link is better. |
| 9 | **What the thank-you page follows.** | It assumes a request form whose reply is a phone call, which is how the old virtual-consult page worked. If the form redirects somewhere else, or confirms by email, the first chapter's copy changes. |

## The core pages are on staging

**2026-09-02, 13:10Z.** All eleven pages under `home/` are published at
`https://staging.masonparkdental.com` (seq 32, 12 pages: the eleven plus the kept `404`). The
import ran exactly in the order above, plus one step the order did not have: **`import-scripts.mjs`
scopes the bundle to the page ids it can see when it runs**, and it ran before
`reset-to-deliverable.mjs` created the nine new rows, so the first publish shipped the GSAP bundle
to three pages. Run `import-scripts.mjs --publish` again AFTER the pages exist; the scope now lists
all twelve. `verify-live.mjs` on all eleven routes: clean. `diff-live.mjs` on `/about-us` and
`/patient-reviews`: element signatures and visible text identical. `probe-hooks.mjs` takes a live
URL now and the scenes do work on staging. `probe-dropdown.mjs` on `/our-doctors`: every link 6.58:1.

Two things to know from that run. **Git Bash rewrites a leading-slash argument into a
`C:/Program Files/Git/` path**, so `node verify-live.mjs <origin> / /about-us` visited nonsense
URLs and reported every route as flattened; prefix the command with `MSYS_NO_PATHCONV=1`. And
**the BugHerd loader was not on staging when the run began**: the 13:08Z backup, taken before any
write, has no `bugherd.js` in `files` or `runtime.scripts`, so it was removed after the 01:05Z
round 6 publish (the last publish before today was 01:27Z). This import did not touch it and did
not put it back; `import-bugherd.mjs --publish` does, when the client wants it.

## Nav links

The header links to about 55 pages, of which eleven now exist. That is deliberate: the nav
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
