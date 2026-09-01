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
`www.bugherd.com` (the loader, which 302s to `sidebar.bugherd.com/embed.js`, plus a
communication `<iframe>`) and `sidebar.bugherd.com` (the sidebar bundles). Those go into the
embed-origins plugin, and **`set-origins.mjs` replaces all three boxes on every call**, so the
Google Maps frame origin has to be repeated or the map dies:

```bash
cd ../../../../process/18-instatic-embeds
INSTATIC_BASE_URL=https://staging.masonparkdental.com node set-origins.mjs \
  --frame "https://www.google.com https://www.bugherd.com" \
  --script "https://www.bugherd.com https://sidebar.bugherd.com" \
  --connect "https://notify.bugsnag.com https://sessions.bugsnag.com"
```

Plugin settings take effect at the next publish, so the order is: origins, then
`import-bugherd.mjs --publish`. `probe-bugherd.mjs <url>` reads the live CSP, loads the page in
Chrome and lists every bugherd request and CSP refusal. **A cookieless browser gets a `204` from
BugHerd and no sidebar** — the sidebar is served only to a viewer logged into BugHerd, which is
how the public never sees it. So the probe proves the policy and the loader; only a logged-in
browser proves the mount.

Two refusals the probe reports are older than BugHerd and unrelated to it: the Webflow icon
font is a `data:` URI and `font-src` has no `data:`, and Cloudflare's own Web Analytics beacon
(`static.cloudflareinsights.com`) is injected at the edge and refused by `script-src`.

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
