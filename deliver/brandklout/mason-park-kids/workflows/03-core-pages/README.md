# 03 — The core pages of Mason Park Dental for Kids

> [!IMPORTANT]
> **Every page is a plain HTML file. Open `home/index.html` by double-clicking it.**
> No server, no build step. Every path is relative, so it renders from `file://` exactly as
> it renders on Instatic, **and the navigation works from disk**: the links are root-relative
> for Instatic, and on `file://` only, `site.js` rewrites each one to this page's own folder
> depth and points it at the folder's `index.html`. `node .tmp/nav-probe.mjs <page>` proves it. `home/` is the site root: `home/index.html` is `/`,
> `home/about-us/index.html` is `/about-us/`, `home/services/comprehensive-pediatric-dentistry/`
> is that route.

> [!NOTE]
> **Live since 2026-09-02 at <https://mason-park-kids.up.railway.app>**, the pediatric
> practice's own Instatic instance, alongside the 43 pages the 02 migration imported. The
> public domain `pediatricdentistkatytx.com` does not point here yet (see the runbook: the
> registrar transfer, then Cloudflare, then Railway). Until it does, this host is the review link.

The Asana brief is **Build New Mason Park Pediatric Site** `1218009803778905` →
**Build Core Pages** `1218057689730298`, eleven subtasks, all built here:

| Route | Asana | What the page does |
| :--- | :--- | :--- |
| `/` | Home Page | Arrival, The First Tooth (written statement), Growing Up Here (the growth chart), The Comfort, The People, The First Visit (pinned path), The Proof, The Invitation |
| `/about-us/` | About the Practice | The Promise (written, counted figures), The Building (mosaic), Two Practices (diptych), Pay It Forward (ribbon), The Word |
| `/our-doctors/` | Meet the Doctor or Doctors | The Specialist (split ground, her words written), The Generalist (dossier), The Training, The Measure (counted), The Voices |
| `/our-team/` | Meet the Team | The Roster (ticker, the wall of nine), The Named (reviews beside the people they name), The Reason (written on ink), The Doctors (bylines) |
| `/our-services/` | Services Overview | The Map (departments sized by count), The Finder (problem → where we start), By Age (rail), The Offers (price list) |
| `/services/comprehensive-pediatric-dentistry/` | Standalone Individual Service Page Starter Template | Is This You, The Visit (sticky head, re-tagged prose), Why Here (overlap), The Path (pinned), Questions, Proof |
| `/new-patients/` | New Patients | The Offer (ticket), Before You Come (checklist beside the rooms), The Visit (timeline), Pay It Forward, Questions (open Q and A) |
| `/financing/` | Insurance and Financing | The Rule (three stepped statements), In Network (twelve tiles), Ways to Pay (a real table), The Plan, Questions |
| `/dental-saving-plan/` | Membership Plan | The Plan (a membership card that straightens), Inside (ledger, plan against insurance), Who It Is For, Join |
| `/patient-reviews/` | Patient Reviews and Testimonials | The Word, The Count (ticker, counted), The Wall (columns, nothing trimmed), Write One |
| `/thank-you/` | General Thank you Page | Right Now (the number), What Happens Next, Meanwhile. `noindex`. |

## What is here

| Path | What it is |
| :--- | :--- |
| `home/**/index.html` | The eleven pages. **The source.** Edit a page's `<main>` in place. |
| `home/assets/site.css` | The whole stylesheet: fluid root first, tokens, chrome, the journey layer, the shared scenes, then one block per page. |
| `home/assets/site.js` | Mobile drawer, current-page marking, the deferred map. Handles the new `masthead_*` chrome and the migration's `navbar_*` chrome, because one script serves both generations of page on Instatic. |
| `home/assets/journey.js` | The motion layer, ported from the parent practice: chrome, reveals, departures, arrival, the pinned path, the growth chart, the generic hooks, continuity. |
| `home/assets/gsap/` | GSAP 3.13 + ScrollTrigger + SplitText, vendored. Never a CDN. |
| `home/assets/uploads/` | Every photograph at a few widths each, written by `.tmp/prep-images.py`. **Gitignored**, like the parent's. |
| `home/assets/fonts/` | Marcellus and Figtree (Fraunces and Nunito before 2026-09-16), self-hosted, self-hosted. **Gitignored** (the root refuses every font extension); `node .tmp/upload-fonts.mjs --fetch` puts them back. |
| `.tmp/stamp.mjs` | **The chrome is constant.** Re-stamps every page's head, top line, masthead, footer and script tags from the homepage, keeping each page's own title, description, canonical, og tags, robots and `<main>`. `--check` reports drift. |
| `.tmp/check.mjs` | The static gate: assets resolve, braces balance, no control bytes, nothing Instatic refuses, the prose ceiling, ids and anchors, alt text, **no em dashes**, chrome identical to the homepage. |
| `.tmp/shot.mjs` | The render gate: four widths, overflow, small text, never-revealed elements, broken images, console, **and which face is actually painted**. `--slices desktop` for readable windows. |
| `.tmp/probe-hooks.mjs` | Motion on: every `data-write` at three intermediate states, the growth chart fills and changes hands, counters land, rails travel, wipes finish, the path pins and fits the window. Takes a file path or a live URL. |
| `.tmp/prep-images.py` | Builds `uploads/` from four sources: the recovery mirror, Magnific's upscales in `_upscaled/`, the bought stock in `_stock/`, and the album's front of house in `_album/`; then the `MIRRORED` variants (`smile-flip`, the homepage hero) from the encoded widths (`--mirror-only` for just those). **One place owns widths and the webp encode.** The pool is named by what each frame shows, and the notes say which are the practice's own. |
| `.tmp/upscale-images.mjs` | The soft photographs, re-emitted through Magnific into `_upscaled/`. `--list` prints the table. **Read its header before re-running it on a face.** |
| `.tmp/get-stock.mjs` | The bought frames, from Magnific into `_stock/`, with `stock-manifest.json` recording what each one is. **Its header is the policy for what stock may and may not do on this site.** |
| `.tmp/contact-sheet.py`, `stock-sheet.py` | Before/after pairs for every upscale, and one sheet of the whole stock pool. Both exist to be LOOKED AT; two upscales were rejected on the first. |
| `.tmp/add-figures.mjs` | Put a `.ch-figure` into the chapters that had no photograph (2026-09-08). **Superseded** by `recompose-figures.py` for placement: it appended plates and insets as their own `.wrap`, which is what left sixteen of them dangling. Kept for the record; do not re-run it. |
| `.tmp/recompose-figures.py` | **The 2026-09-09 evening pass, as one readable plan.** Every image swap, every dropped, banded or side-by-side figure, and every invitation photograph, per page. `--dry-run` prints what it would do. Idempotent. |
| `.tmp/get-album.mjs` | The practice's FRONT OF HOUSE from the client's own Google Photos album into `_album/`: the front desk, the waiting-room sofa, the gumball machine, the product shelf. Nothing clinical is taken from that album; its header says why. |
| `.tmp/probe-stock.mjs` | Twelve Magnific candidates per search term, with preview URLs, so a contact sheet can be looked at BEFORE a credit is spent. Every slot bought on 2026-09-09 (evening) was chosen this way and is pinned by `id` in `get-stock.mjs`. |
| `.tmp/nav-probe.mjs` | Opens a page over `file://`, checks every internal link resolves to a file on disk after `site.js` has rewritten it, and clicks through three of them. The review gate: if this fails, the client cannot click around. |
| `.tmp/build-blog.mjs`, `blog-content.json` | **The blog.** `--harvest` reads the 157 posts out of workflow 01's WordPress export into `blog-content.json` (committed, 1.7 MB, so a worktree without the mirror can still build); a run writes `/blog/` and `/blog/<slug>/` for the nine sample posts, `--all` for every post, `--only a,b` for some. Its header is the record of what the harvest drops (pasted bios, disclaimers, a directions link) and how old links are rewritten. `--list` prints the old-URL to new-URL map for the cutover redirects. |
| `.tmp/hover-probe.mjs` | Hovers one of every button variant on a page and records the label colour, the fill behind it and a crop. Exists because the fill slid up OVER the label on every button for a week and no gate measured a hover. |
| `.tmp/shoot-all.mjs`, `viewport-probe.mjs` | Full-page captures of all 57 pages into one folder, and viewport captures through a pinned scene. The first is how this pass found what the per-page gates could not; the second is how it told a pin spacer from a fault. |
| `.tmp/upload-fonts.mjs` | The self-hosted faces (Marcellus, Figtree VF): `--fetch` downloads them into `_fonts/` and `home/assets/fonts/`, then a run uploads them and writes `font-map.json`. |
| `.tmp/colour-leak.mjs` | **Whose rule is painting this text?** A single-class rule that sets `color` (0,1,0) loses to a contextual one like `.ch p` (0,1,1), so an element can paint an ink its own rule never asked for. That is how the copper sticker on the homepage ended up body-grey at 1.3:1 (BugHerd #33). Reports every element whose winning `color` comes from a rule other than its own class, with the contrast it actually has. Text over a photograph or a fixed layer is reported as unmeasured, not as a failure. |
| `.tmp/btn-line-gate.mjs`, `btn38-sweep.mjs` | The pill buttons, read one pixel column at a time, in WebKit at retina scale: does anything paint a line across the bottom (BugHerd #38)? The sweep answers the general question - across 1032 heights and 8 device scales, can the parked hover fill ever show? Sample the column well left of centre: down the middle it runs through the white label and every button reads as a hit. |
| `.tmp/guard-phone-check.mjs` | Lifts `type()` out of both generators and asserts a phone number survives it. The house rule that turns "6-18 months" into "6 to 18 months" had been turning (281) 578-7100 into "(281) 578 to 7100" on 18 pages. |
| `.tmp/bugherd-0924-images.py`, `bugherd-0924-copy.py` | **BugHerd round three (2026-09-24) as two readable plans.** Every photo swap is a row naming the page, the chapter and the image that was on screen when the note was left (read from the note's own `selector_info.html`, which carries the live src), so a slot is found by what it shows rather than by a card index. The copy edits are exact replacements that must match once. Both are idempotent and write LF. Copy the shape for the next round. |
| `.tmp/bh-shot.mjs` | One chapter of one page as a picture: `node bh-shot.mjs [--live] [--w 1920] services/bonding#arrival about-us#forward ...`. Reduced motion by default, so a reveal is at rest. It is the quickest way to see what one BugHerd note is about, before and after. |
| `.tmp/nav59-probe.mjs` | Drives the Services menu the way a visitor does: hover a category on desktop and click a treatment, then open the drawer on a phone, tap a category once (it must open, not navigate) and tap a treatment. It found the drawer bug where a tap focused the link and the desktop transform slid the opened list half out of the panel. |
| `.tmp/verify-0924.mjs` | The round-three proof against staging. It reads the swap and drop rows out of `bugherd-0924-images.py`, so every photo is checked, then the copy, the menu and the layout rules. |
| `.tmp/crop-probe.mjs`, `crop-all.mjs` | Does any heading lose ink to a clipping ancestor? Takes a file or a URL; `crop-all.mjs --live` sweeps the published site. |
| `.tmp/audit-live.mjs` | **Every live route, not just the eleven.** HTTP, images, overflow, console, head tags, headings, chrome, dead links, tiny text, and any image painted more than 1.35x its own pixels. |
| `.tmp/diff-all.mjs` | `diff-live.mjs` over all eleven pages, with a tally. |
| `.tmp/settle.mjs` | `await settle(page)` — waits for the webfonts and the relayout. Every gate calls it; see its header for why a fixed timeout is not a substitute. |
| `.tmp/configure-seo.mjs`, `populate-seo.mjs` | The practice's values for the two SEO plugins, and a description for all 57 pages. |
| `.tmp/font-axes.mjs`, `split-count.mjs`, `h1-metrics.mjs`, `grid-probe.mjs`, `ch-probe.mjs`, `dump-mask.mjs`, `probe-legacy.mjs`, `probe-abort.mjs`, `peek.mjs` | One-question probes, kept because each one answered a question that cost an hour. What font is really painted; how many lines did SplitText make; what does this heading's ink cost; what did this grid resolve to; what is a `ch` here; what DOM does SplitText build; what is wrong on a migrated page, by selector; who is making that aborted request (Instatic's own anti-bot probe, which `audit-live.mjs` now ignores); and a screenshot of any route. |
| `.tmp/insta.mjs` | The admin client. Refuses any host that is not the pediatric instance; caches its session per host. |
| `.tmp/list-site.mjs`, `backup-site.mjs`, `publish.mjs` | Inventory, a full dump, a bare publish. |
| `.tmp/to-instatic.mjs` … `verify-live.mjs` | The import, in the order below. |

## The design, and why it is not the parent's

The parent practice's site (bk-mason-park, workflow 09) is a copper-and-newsprint editorial
journey for adults. This is the children's brand in the same building, and it has its own
identity: the logo is slate "MASON PARK", sage "DENTAL", a handwritten "for kids". So the
palette is sampled from the logo (`--slate #505860`, `--sage #a3b5aa`, `--sage-deep #587a68`
for anything carrying text), with one warm accent (`--sun`) and one cool tint (`--sky`, from the
mural walls in the staff portraits). The display face is Fraunces, soft and slightly wonky; the
body face is Nunito. Corners are round, buttons are pills, panels are stickers, and the warm
and dark grounds carry a drawn confetti of dots instead of the parent's plaster.

**2026-09-16 (BugHerd #4): colour and type now follow the practices' brand guide**
(`Mason Park_Brand Guide.pdf`, Nikole Culo Designs, Nov 2021, in the Mason Park shared drive; it
covers both the family practice and "Dental for kids"). Palette, exact: slate `#545F62`, sage
`#A0B4AA`, light `#EAE9E6` (the PDF misprints it `EAE936`; its RGB is 234/233/230), copper `#B78668`,
sand `#CCBCA6`, beige `#E2D5C5`. Copper replaced the sun yellow and the sky; the token NAMES `--sun`/
`--sky` were kept because pages carry them as theme names. Copper is too light for text either way
(3.5:1 with ink, 3.2:1 with white), so filled buttons and pills use `--sun-fill #93644a` with white
text and copper text on dark grounds uses `--sun-glow`. Type: the guide's Collier, FreightNeo Pro and
Avenir Next are Adobe-licensed and there is no Adobe Fonts web project, so the site self-hosts
Marcellus (for Collier) and Figtree (for Avenir Next) as "Marcellus MP" / "Figtree VF";
`font-synthesis: none` stops a fake bold or italic Marcellus. If the practice sends an Adobe kit id,
swap the stacks. The paragraph above is the history.

**What is the parent's is the process**, and all of it is kept: the fluid root as the first
rule and no `px` or `clamp()` font-sizes; Client-First naming; the chapter architecture from
`DESIGN-STANDARD.md`; the runtime contract (`has-journey`, `--jr-nav-h`, `data-anim="hide"`,
the attribute hooks); the mechanical lessons (`.ch .wrap` in longhand, `.ch [data-write]` at
(0,2,0), the hamburger drawn in CSS because Instatic's button takes no children, the drawer
hidden with `visibility`); and the three gates.

**The chrome is constant, the chapter bodies vary.** Every page carries at least two layouts
that appear on no other page; the shared scrubbed scenes (the written statement, the rail, the
pinned path, the counted figures) recur, never in the same sequence. The signature scene is the
growth chart on the homepage: a ruler that fills as the page scrolls and an age that changes
as each stage passes the middle of the window, from six months to eighteen.

**The copy is the practice's**, re-tagged and never rewritten: the homepage, the team page,
the FAQ, the service pages recovered from the abandoned install, the doctors' biographies.
Connective sentences are ours and make no clinical claim. Every review is shown whole under
the reviewer's own name; the four marked "Google review" are from the practice's Google
listing (via the parent's intake), the five marked "Patient review" from the practice's own
homepage. **One review was deliberately left out**: a one-star review the old homepage carried
in its own carousel. Photographs are the practice's own (the team, the knee-to-knee exams,
Dr. Nguyen with a child, the rooms, the nine staff portraits) plus four editorial frames from
its blog library, used uncaptioned and never presented as its patients or rooms. Two frames
from the parent's folder were tried and dropped: both were stock.

## The 2026-09-09 pass: the titles, the imagery, and local against live

The client, on 2026-09-08: *"There are a lot of pages that don't have the last
design upgrade but I see a lot of errors on Instatic so I don't want to cascade
those errors to the redesign on rest of the pages. The titles crop. Run a
comparison between local and instatic to fix the errors on instatic. Use more
images and extract stock photos from Magnific. Increase image quality on blurry
images."*

### The titles cropped because a mask is exactly one line box tall

`journey.js` asks SplitText for `{ type: "lines", mask: "lines" }`, and a masked
line is a wrapper div with `overflow: clip` sized to the LINE BOX. Every display
size here runs a line-height at or below 1 and Fraunces' ink overshoots its line
box at both edges, so the mask cut the tops of the caps and every descender.
Not a start state — the wrapper's permanent height, so a screenshot taken after
the reveal still showed it. **131 headings across the eleven pages**, up to 13px
above and 11.8px below on the h1, measured by `crop-probe.mjs`.

The fix moves the CLIP rather than the box: `clip-path: inset(-.18em 0)` on the
mask with `overflow` neutralised, and the reveal travels 150% of a line instead
of 112 so the start state still clears the bleed. Two earlier attempts are
written up in `site.css` because both look right and neither is: padding the
mask leaves the start state visible, and padding the line needs a flex column,
which SplitText then re-measures when the fonts land, turning every word into
its own line. **131 → 0**, and 0 again against the published site.

### The published site was setting every heading in the wrong cut of Fraunces

`diff-live.mjs` had been reporting live headings 10–20% wider than local for a
week and it was read as a rounding difference. `font-axes.mjs` settled it:

| | `opsz` 9 | `opsz` 144 |
| :--- | :--- | :--- |
| local | 1665px | 1340px |
| live (before) | 1657px | 1657px |

Instatic's font installer asks Google for a list of static WEIGHTS, so what it
installed was five static instances, and a static instance ignores
`font-variation-settings` in silence. `"SOFT" 100, "opsz" 144` is on every
display face in `site.css` and is where this brand's soft, slightly wonky
display face comes from; live had none of it. `upload-fonts.mjs` self-hosts the
variable files through the media library instead, `site.css` declares them as
`Fraunces VF` / `Nunito VF` in front of the static names, and `import-styles.mjs`
rewrites the relative `url()` to the upload path on the way in.

### And the line breaks still disagreed, for a different reason

Same font, same 835.4px, same metrics on both sides — and the h1 came out two
lines locally and three live. A line split is a MEASUREMENT and its wrapper
divs are permanent, so splitting before the face arrives bakes the FALLBACK's
line breaks in for good. `document.fonts.ready` is no help and actively
misleading: it resolves when nothing is *pending*, which is true before the
stylesheet that declares the faces has even been parsed. It resolved at 12ms
locally and 1016ms live, both too early. `journey.js` now asks
`document.fonts.load()` for the display face by name before it splits anything,
with a 1200ms cap so a font that never arrives cannot leave the hero headline
hidden. That is the only thing standing between the design and the fallback's
line breaks on the published pages, which cannot carry a `<link rel="preload">`
because their `<head>` is the platform's.

### More images, and where they came from

`waiting` was on nine pages of eleven and `team` on six; financing, services,
reviews and thank-you had two photographs each, the arrival and the invitation,
with nothing in between. There was nothing left in the practice's library.

- **Twelve of the practice's own frames re-emitted through Magnific**
  (`upscale-images.mjs`) — four 300px staff thumbnails, Dr. Nguyen's 2020
  portrait, and the frames under 1400px. **Two were rejected**: at 300px there
  is not enough face left for the upscaler to hold on to, and Karen came back as
  a different woman while Anabel came back slimmed. Both are `skip` in the table
  with the reason, and their pages keep the soft originals. Judge the contact
  sheet, never the settings.
- **Fourteen frames bought from Magnific** (`get-stock.mjs`), every one warm,
  bright and on-brand — objects, rooms with nobody in them, and children and
  families in ordinary life. Two were rejected on the contact sheet and
  re-searched: a grungy concrete wall and a bleak empty corridor, both the
  opposite of this brand. `stock-manifest.json` records the id, title, author,
  licence and page URL of each.
- **28 chapter photographs placed** (`add-figures.mjs`), so the images inside
  `<main>` went **55 → 89** and no page has fewer than five.

The policy for what stock may and may not do here is in the header of
`get-stock.mjs`. The short version: it may be childhood at a remove; it may
never stand in for a named person, be captioned as this practice's room,
patient, team or result, or appear in a clinical context. Which is also why the
two staff portraits Magnific could not upscale were left soft rather than
replaced.

### What the comparison found on Instatic

`audit-live.mjs` walks all fifty-seven routes, not the eleven. On 2026-09-08 it
counted **285 faults on 57 of 57 routes**; every one fell into two groups.

| Fault | Where | Fixed by |
| :--- | :--- | :--- |
| No description, canonical, `og:title` or JSON-LD — 4 per page, 228 total | all 57 | the two plugins in `deliver/process/19-instatic-seo`, configured by `configure-seo.mjs`, with a description per page from `populate-seo.mjs` |
| Six runs of text under 12px at 390 — 276 total | the 46 migrated pages | a floor keyed to the legacy class names, at the end of `site.css` |
| A tan contact band, `rgb(204,188,166)`, in no part of this palette | the 46 migrated pages | re-grounded to `--sage-tint` in the same block |

`diff-live.mjs` across all eleven pages went **163 differences → 71**, and every
one that remains is the published page being equal or richer:

- `jsonLd` — live has `WebPage`, `WebSite` and `BreadcrumbList` that local does not.
- `description` / `ogDescription` — live is the 158-character trim, which is
  what a search result renders anyway.
- `viewport`, `themeColor`, `favicon` — the platform owns those three lines.
- `imgWithSrcset` / `imgWithSizes` on four pages — Instatic derives its own.

Structure, visible text and geometry are now **identical on every page**.

### Two bugs the comparison found in the LOCAL build

Both were cases of the published site being right:

- **`figure` never got a margin reset.** The UA gives it `margin: 1em 40px`;
  eight components had each quietly worked around it with their own `margin: 0`
  and the two that had not sat 80px narrower than their grid track. Instatic's
  own reset zeroes it, so only the local file was wrong.
- **`prep-images.py` could not open three of its sources.** Windows applies
  MAX_PATH to the path string BEFORE it resolves the `..`, so from this
  worktree's root a 252-character path arrives as 323 and fails as "no such
  file". `abspath` first, everywhere.

## The 2026-09-09 pass, part two: the other 46 pages

The client, later the same day: *"<https://mason-park-kids.up.railway.app/services/invisalign>
This page has the old design. It does not have the updated nav bar or footer. Please make sure
all of the pages have the updated new design."*

**It was 46 pages, and the reason they had drifted is the reason nobody had noticed.**
`stamp.mjs` is the single source of the chrome and `check.mjs` fails a page whose chrome has
drifted, but both read `home/**/index.html`, and the 46 migrated pages were not in `home/`.
They existed only as Instatic node trees. Every gate was honest about what it looked at, and
what it looked at was a fifth of the site. `crop-all.mjs` was worse: it carried the eleven as a
hard-coded array. **It walks `home/` now, and so should anything else you add.**

### Getting the source back

| Step | What it does |
| :--- | :--- |
| `node harvest-migrated.mjs` | Fetches all 46 live routes and writes `migrated-content.json`: per page, the eyebrow, the h1, the breadcrumb, and the prose as numbered blocks. A small tokenizer, not a regex, not a dependency. |
| `.tmp/recipes/*.mjs` | 46 recipes in four files. Each names the page's chapters and, per chapter, which blocks fill it. `b: [0, 1]` is this page's blocks verbatim; `b: ['other-slug', 3]` reaches into another page's, which is how a treatment page borrows the answer that lives on the FAQ page. |
| `node build-pages.mjs` | Recipe + harvest -> `home/<slug>/index.html`. **Writes once and gets out of the way**: the output is the source from then on, edited in place like the eleven. A marker inside `<main>` makes it refuse to overwrite a hand-edited page without `--force`. |

Twelve chapter kinds, all built from vocabulary already in `site.css`: `prose` (the sticky-head
long-form frame), `cards`, `overlap`, `questions`, `qa` (the open two-column Q and A),
`table`, `links`, `statement`, `figures`, `path`, `band`, `invite`.

```bash
node build-pages.mjs && node stamp.mjs && node check.mjs   # and it does not commute
```

`build-pages.mjs` emits a page with no chrome at all. Run `check.mjs` before `stamp.mjs` and
you get one error per page that means nothing.

### What the harvest turned up, which was not a design problem

- **Both topic FAQ pages had lost their QUESTIONS.** The 02 migration imported the answers
  intact; the WordPress accordion kept its question text in a widget the mirror never rendered.
  Live, `/pediatric-dentistry-faqs-katy-tx/` is 30 orphaned answers under six headings. Every
  question is restored to its own answer in the recipes, sitting under it where the two can be
  checked against each other.
- **The adult practice was on six pages.** Dr. William Sung on `/technology/` and
  `/town-resource/`; the parent's phone number on `/virtual-consultation/`; "BMason Park Family
  Dental" and a services list with teeth whitening and wisdom tooth removal on
  `/town-resource/`; and `/faq-page/` was the parent's FAQ start to finish. Every re-attributed
  sentence is written out in full in its recipe so the change is visible there.
- **`/accessibility-statement/` described an accessibility widget this site does not have.**
  Replaced with what is true.
- **`/toothpaste-chart/` was Lead Safe Mama LLC's article pasted in whole**, fundraising links
  and reader numbers included. Now credited and linked rather than copied. **A client decision**
  - see Open items.
- `/privacy-policy/` still said the pages load typefaces from Google Fonts.

### Twelve more stock frames

Fourteen slots could not give 46 more pages a photograph each without `waiting` carrying nine of
them. `st-case`, `st-field`, `st-sleep`, `st-floss`, `st-water`, `st-soda`, `st-tube`,
`st-blocks`, `st-hands`, `st-window`, `st-laptop`, `st-park`: all objects and empty rooms bar
`st-hands`, which is two hands and no face. **The treatment pages' hero frames are the
practice's own clinical photographs**, which the policy in `get-stock.mjs` makes the only
pictures allowed beside a treatment name; a page about braces is searched by the object a
parent recognises, never by the appliance. Seven of the first twelve terms returned the wrong
thing and were re-termed before the credits were spent. **Read `--dry-run` first.**

## The 2026-09-09 pass, part three: pictures that match the words

The client, that evening: *"We need to make a design upgrade to the site with
better image selections that match the content they are attached to. There are
a few sections throughout the site that are very unorganized and look very
strange."*

The per-page gates were all clean. What found it was `shoot-all.mjs`: one
full-page capture of every page, looked at in order.

### The sections that looked strange, and why

1. **The overlap panel was painting UNDER its photograph** on all nineteen
   pages that use `.sw-overlap`. The bullets of "What we look at before
   recommending it" were half hidden behind the teenager. The panel is meant
   to sit on the picture; `data-drift` puts a transform on the figure, and a
   transformed element paints above any sibling that is neither positioned nor
   transformed. One line: `.sw-overlap_panel { position: relative; z-index: 1 }`.
2. **Sixteen figures were dangling.** `add-figures.mjs` appended every
   chapter photograph as its own `.wrap` after the body. Under a full-width
   body a band is fine; under a one-column body (the three promises on
   financing, the price list on services) a plate hung alone at the foot of
   the chapter with nothing beside it, and under a centred statement it sat
   off to one side. `recompose-figures.py` gives each one a real place: a
   plate goes BESIDE its column (`.ch-withfig`, and it now holds its place
   while the column scrolls), a full-width body gets a band, and a chapter
   that already carried photographs gets nothing.

### The pictures that did not match

- `waiting` - a 290px crop of a wall with an orchid - was the invitation
  photograph on 45 pages and the hero on five. It is gone. The client's own
  album has the front desk and waiting room the two practices share, and two
  children at the gumball machine and the product shelf in that same front
  area; `get-album.mjs` takes exactly those nine frames and nothing clinical.
- `st-case`, searched as "a case on a shelf", came back as a food container
  and stood for aligners on four pages. `st-floss` and `st-tube` are both
  electric toothbrushes. A laptop and a sunlit curtain illustrated intra-oral
  scanners and lasers. A toddler in the chair opened the Invisalign page.
  `highfive` - a stock dentist who does not work here - sat in the overlap of
  four treatment pages beside "Dr. Nguyen will...".
- Fourteen new frames were bought, every one chosen from a candidate sheet
  and pinned by `id`: an aligner in its case, a mouth guard, a boy with a
  gap, a child asleep, a parent on the phone, a family on a video call,
  toothpaste on a brush, floss, a paper crown, a bottle and a bear, a piggy
  bank, a bedtime story, a toddler waving, a toddler with a cup. The policy
  in `get-stock.mjs` is unchanged with one line made explicit: the OBJECT of
  a treatment is an object and may appear; a procedure, an instrument in a
  mouth, a chair, a result may not.

### What it changed, and what it did not

`check.mjs` 0 errors, `crop-all.mjs` 0 across 57 x 2, `shot.mjs` clean at
390 on the recomposed pages. **Local only, by the client's instruction** - the
Instatic import has not run; when it does, `upload-media.mjs` has 23 new keys
to carry and `import-styles.mjs` must re-export `site.css`.

## The blog

The old site published 157 posts (2021-11 to 2026-06). On 2026-09-09 (evening) the client
asked for a blog overview page and an article page, built locally first, to upload into
Instatic and then populate. `build-blog.mjs` builds both from the recovered export:

| Route | Chapters |
| :--- | :--- |
| `/blog/` | Arrival (the story frame), **The Latest** (a feature spread: one long read beside two short ones), By Topic (five shelves with counts), **Every Post** (one `<details>` per year, a row per post, linked when the post exists on disk), The Invitation |
| `/blog/<slug>/` | Arrival (topic, title, excerpt, published / reading time / written by), **The Article** (the long-form frame with a sticky head carrying a numbered table of contents, a byline and a photograph; a run over the prose ceiling continues in a second section with no rule above it), Read Next (three cards, same topic first), The Invitation with the treatment pages the article links to |

All 157 posts are built and live (2026-09-09, night); the overview links every one. Which posts come across is the practice's editorial
call, made by looking at pages rather than a list; sixty-three of them are Invisalign pieces
and some of those were written for adults. The old URLs were `/<slug>/`; the new ones are
`/blog/<slug>/`, so the domain cutover needs a redirect per post.

## Editing

- **One page:** edit its `<main>` in `home/<slug>/index.html`, then `node .tmp/check.mjs` and
  `node .tmp/shot.mjs ../home/<slug>/index.html` from `.tmp/`.
- **The chrome on every page:** edit the homepage, then `node .tmp/stamp.mjs`. `check.mjs`
  fails any page whose chrome differs from the homepage's.
- **A new page:** copy the nearest page's folder, rewrite its head lines and `<main>`, run
  `stamp.mjs`. A new prose container has to be added to `HOLDERS` in `check.mjs` or the
  prose gate silently reports 0 words for it.
- **A new photograph:** add it to `PHOTOS` in `prep-images.py` under a name that says what it
  shows, run it, reference `<key>-<width>.webp`.
- **A photograph the reviewer attached to a BugHerd note:** copy it from
  `workflows/.tmp/bugherd/shots/<n>-att0.png` into `.tmp/_reviewer/<key>.png` (gitignored), add
  the key to `REVIEWER` in `prep-images.py`, and run `python prep-images.py --only <key>,<key>`.
  Name it by what it shows, and give it a **new** key: the Instatic media upload skips a
  basename it already has. When the same frame comes attached at several sizes, use the largest
  copy, but compare the crops first: two "duplicates" in round three were different frames.
  A reviewer frame narrower than the next standard width is also emitted at its own width.
- **Crop positions** are classes, because the converter drops `style` attributes:
  `.ar-bg.is-y40` / `.is-y55` / `.is-mid` / `.is-top` / `.is-counter` for heroes, `.lf-figure.is-top`,
  `.ch-figure.is-band.is-y72`, `.sw-overlap_shot.is-y60`, `.pe-band.is-low.is-faces`. A new frame
  in a hero needs a look at 1920 wide (`bh-shot.mjs --w 1920 <page>#arrival`): a near-square
  frame in a 2.6:1 header shows less than half its height.
- **A path that should not pin:** add `is-grid` to `section.ch-path`; `journey.js` then keeps it
  static at 900px and up, and the CSS lays the steps out in one row.
- **A number with a unit** in `.figures`: `<b data-count="6"><em class="fig-n">6</em> <em class="fig-unit">months</em></b>`.
  The counter writes only into `.fig-n`, so the smaller unit survives the animation.
- **A BugHerd round** (first run 2026-09-15): `workflows/.tmp/bugherd/fetch.mjs` pulls every
  task BY ID (the list endpoint hides page, selector and screenshot) with comments,
  attachments and screenshots; look at every screenshot before deciding. Fix here, then
  `node section-shots.mjs local` / `live` for viewport crops of every chapter (a 16,000px
  full-page PNG cannot show what one BugHerd note is about), which also reports whether the
  review rail moves on its own and stops under the pointer. `reply.mjs` posts the replies
  from `replies.json` and moves a task to done only when the plan says so; send it only after
  the live crops confirm each fix. A homepage-only push is the import chain below with
  `MSYS_NO_PATHCONV=1 node import-pages.mjs --only / --publish` as the last step: `--only`
  matches the CONVERTED slug (`/`, `/about-us`), not the CMS slug (`index`), and Git Bash
  rewrites a bare `/` argument into a Windows path unless path conversion is off.
- **Update only the pages that changed (since 2026-10-01).** `to-instatic.mjs --only /,/our-team`
  converts just those pages, and every later step (upload-media, ship-payload, run-convert,
  fetch-nodes, apply-*, import-styles, import-pages) works on what it wrote: a three-page round
  shipped 23 KB in 4 chunks instead of 1.4 MB in 205. Pass the SAME list to both `to-instatic`
  passes and to `import-pages --only`; keep it in one `PAGES=` variable (`publish-1001c.sh` is
  the template). It is safe because `import-pages` and `import-styles` are incremental: no page
  is ever deleted and style rules are only added. `backup-site.mjs` still dumps the whole site,
  on purpose. A full chain is only for a change every page carries (the chrome, a site-wide copy
  edit); a code-asset-only change (site.css, site.js) needs `import-styles` / `import-scripts`
  and a publish, no page import at all. An unknown slug in `--only` stops the run.
- **Re-imported pages lose their embeds.** `import-pages` rebuilds a page from `home/`, which
  holds placeholders: re-run `add-elfsight-reviews.mjs --apply --publish` after / or
  /patient-reviews, and `add-ghl-contact-form.mjs --apply --publish` after /contacts or
  /patient-reviews.
- Do not write `.mjs`, `.js` or `.css` here through a shell heredoc or a `node -e` string.
  Backslashes are eaten on the way through and the file still parses. It cost two rounds in
  this workflow alone (a Chrome path, a regex). Use an editor.

## Instatic import

> [!IMPORTANT]
> **Two instances since 2026-09-27.** `INSTATIC_BASE_URL` (from the master `[mason-park-kids]`
> section) is **staging**, `https://staging.masonparkpediatricdental.com`: its own Railway
> environment, volume and database. Every chain below runs against staging by default, and
> `railway-ssh.mjs` picks the matching container. **Production is reached only on purpose:**
> `insta.mjs` refuses a production host unless `PROMOTE=production` is set. To promote, check
> the change on staging, then run the SAME chain with
> `PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app bash publish-XXXX.sh`.
> `upload-media.mjs` rebuilds `instatic-media-map.json` against whichever instance it is pointed
> at, so the map is always right for that run. `configure-seo.mjs` and `populate-seo.mjs` name
> the staging host on staging and turn its canonical off; never copy plugin settings from staging
> to production. See `docs/runbook/2026-09-27-staging-environment.md`.

```bash
cd .tmp && npm i                                   # once: playwright-core
node list-site.mjs                                  # what is there
node backup-site.mjs                                # 1. dump the instance. 7 MB.
node to-instatic.mjs --lean                         # 2. -> instatic/  (media not yet mapped; --only /,/x for a subset)
node upload-media.mjs                               # 3. upload; writes instatic-media-map.json
node to-instatic.mjs --media instatic-media-map.json --lean   # 4. second pass, /uploads paths
node ship-payload.mjs && node run-convert.mjs && node fetch-nodes.mjs   # 5. HTML -> node graphs, inside the container
node apply-body-class.mjs                           # 6. has-journey onto each root node
node apply-image-alt.mjs                            # 7. alt text and the eager hero hints
node import-fonts.mjs                               # 8. the platform's static instances
node upload-fonts.mjs --fetch && node upload-fonts.mjs   #    the VARIABLE files -> font-map.json
node import-styles.mjs                              # 9. class rules + site.css as a code asset
node import-scripts.mjs                             # 10. gsap + site.js + journey.js, one bundle
node import-pages.mjs --publish                     # 11. write every row (215 as of 2026-09-09), publish
node verify-live.mjs && node verify-live.mjs --migrated   # 12. the proof
node diff-all.mjs                                   #     every page under home/, local against live
node audit-live.mjs && node audit-live.mjs --width 390    #     all 57 routes
node crop-all.mjs --live                            #     no heading loses ink
node probe-hooks.mjs https://mason-park-kids.up.railway.app/
```

Step 8 installs BOTH, and both are needed: the platform's static instances stay
registered on the shell (they are what the fallback names in the stacks resolve
to), and `upload-fonts.mjs` puts the variable files in the media library, which
is the only route to a variable face on this platform. **`import-styles.mjs`
reads `instatic/site.css`, not `home/assets/site.css`** — re-run
`to-instatic.mjs` after any stylesheet edit or it ships the previous one, which
it will happily do without a word.

The SEO plugins are a one-off per site, not part of the page import:

```bash
cd ../../../../process/19-instatic-seo                # see 19-instatic-seo.md
node ../18-instatic-embeds/pack-plugin.mjs open-graph .tmp/open-graph.zip
node install-plugin.mjs .tmp/open-graph.zip --apply    # and aeo-schema
cd -                                                   # back to .tmp
node configure-seo.mjs --apply                        # this practice's facts
node populate-seo.mjs                                 # a description for all 57
node publish.mjs                                      # the plugins run at PUBLISH
```

The container half (steps 5) is the 02 migration's, unchanged: `railway-ssh.mjs` addresses
the Mason Park Kids service by id, `container-convert.ts` runs Instatic's own `@core/htmlImport`
under bun in `/app`. The rest is ported from the parent's workflow 09 with the differences below.

### What this site taught the import that the parent's did not

- **Two stylesheets share the site, and the bundle orders them by PATH.** The 43 migrated
  pages keep `src/styles/mason-park-kids.css` and their `navbar_*` chrome; ours is
  `src/styles/mason-park-kids-core.css` with `masthead_*`, so the chrome classes never
  collide. But both declare `:root` tokens, and `mason-park-kids-core.css` sorts BEFORE
  `mason-park-kids.css`, so the old sheet won every tie: the live h1 computed as Figtree,
  the body as DM Sans, the buttons uppercase, while every other check was green. It looked
  exactly like fonts failing to load and it was not. `reorder-styles.mjs` renames the old
  asset to `src/styles/legacy-migration.css` so it sorts first; `import-styles.mjs` appends
  ours to `files`, which turned out to mean nothing. The 11 class names both sheets define
  (`button`, `faq_*`, `embed_component`, `main-wrapper`, `visually-hidden`, `is-ghost`,
  `is-open`, `is-static`, `nav-open`) are restated in full in ours.
- **A consequence, and it is deliberate:** the migrated pages now render in Fraunces and
  Nunito with the sage accent instead of Figtree, DM Sans and the old theme's cyan. Their
  layouts do not depend on those tokens (`verify-live.mjs --migrated` renders two of them),
  and one brand across both generations of page is the better state until the rest are rebuilt.
- **The old script asset never ran.** The 02 import registered `src/scripts/mason-park-kids.js`
  as a file and never gave it a `runtime.scripts` entry, so no page had a mobile menu.
  `import-scripts.mjs` writes the GSAP bundle into that same file and adds the entry, scope
  `all-pages`, so the migrated pages gained a working drawer from the same change.
- **The map needs the embed-origins plugin.** The published CSP is `frame-src 'none'` by
  default. `deliver/process/18-instatic-embeds` was installed (`install-plugin.mjs --apply`,
  built with `pack-plugin.mjs` because the zip lives in the parent's worktree) and
  `set-origins.mjs --frame https://www.google.com` set; the live CSP carries it. The site had
  no plugins before this; it has one now, and `embedPolicy` is the default `compatible`, which
  touches only pages that contain an Embed block, of which there are none.
- **`--lean` ships the `src` file per image and nothing else.** Instatic derives its own
  variants (`imgWithSrcset` is 14 live against 9 local on the homepage). 32 files, 1.1 MB.
- **The converter drops `style` attributes.** No page carries one; the four rhythms that
  wanted them are classes (`.callout h3 + p`, `.ty-callbox_copy`).
- **What does not travel:** the meta description, canonical, og tags, theme colour and the
  JSON-LD. A page row carries a title, a slug and a body, nothing else; the parent emits those
  from the `brandklout.open-graph` and `brandklout.aeo-schema` plugins, which are not installed here.
  Same open item the 02 migration recorded. The favicon stays the migration's upload of the
  same logo.

### Verified live, 2026-09-02

`verify-live.mjs`: all eleven routes 200; 5 to 8 chapters each; `.ch` padded; Fraunces and
Nunito painted (measured against their fallbacks); `has-journey` on the body; `--jr-nav-h`
97px; GSAP booted, `jr-ready`, no `jr-fail`; every image resolves, none still `/assets/`; the
map iframe built; 0 overflow; no empty buttons; console clean. `--migrated`: two of the 43
old pages 200, GSAP running, 0 overflow. `diff-live.mjs` on the homepage and the financing
page: element signatures identical, visible text identical, the `<table>` and every
`<details>` survived. `probe-hooks.mjs` on the live homepage: both statements scrub at
2/15/28 and 6/33/61 words, the ruler fills 0.1/0.5/0.9, the stages change hands, the path
pins at 2961 = 900 + travel. `live-shot.mjs` at 390: 0 overflow, nothing under 12px.

## Open items for the practice

None of these blocks review. All of them need somebody other than an engineer.

| # | Item | Why it matters |
| :--- | :--- | :--- |
| 1 | **Suite and phone.** Every page publishes #104B and (281) 578-7100, the pediatric chrome's set. The old footer said #104A / (281) 769-8878. | It is on every page, the schema and the map link. |
| 2 | **Are the published offers current?** $129 (12 and under), $189 (13+), $85 emergency exam, free second opinion, $1,000 off Invisalign. | New Patients draws them as a ticket; Services lists them as a menu. |
| 3 | **The booking link** is `flexbook.me/masonpark/1`, the parent practice's scheduler, which is what the old site linked. | Every "Book" button goes there. |
| 4 | **The membership plan's fee, and its brochure.** The plan page states what the practice published and no price; the brochure was never recovered. | The Join chapter says "ask the front desk". |
| 5 | **The new patient forms URL.** The old site said forms could be completed online; no link was captured. | New Patients and Thank You say the front desk sends them. |
| 6 | **Where should "write a review" go?** The reviews page sends people to the pediatric Google listing (it went to a bare street address until 2026-09-21). | A `g.page` review link would open the review box directly. |
| 7 | **Dr. William Sung.** RESOLVED 2026-09-09 by removal: he is the parent practice's dentist and every mention on this site was inherited from the 02 migration. Six pages cleaned. | Say so if he should in fact appear here. |
| 10 | **The Lead Safe Mama chart.** A third party's copyrighted, watermarked lab chart, published on `/toothpaste-chart/` as if it were the practice's own. Now credited and linked instead. | If the practice has permission to host it, it goes back as an image with the credit. |
| 11 | **`/faq-page/` lost its content.** Every answer on it was about the adult practice; it is now the pediatric FAQ hub. | The adult questions belong on `bestdentistinkatytx.com`. |
| 12 | **`/services/cosmetic-dentistry/` no longer lists implants, veneers or whitening**, which the migrated page did. | A pediatric practice does not place implants in children. A line points at the parent practice for them. |
| 8 | **Office hours.** ANSWERED 2026-09-21, BugHerd #30/#39: Mon to Thu 9 to 6, Fri to Sun closed. The old footer's Mon/Wed 9-6, Tue/Thu 8-5 split was wrong and is gone from all six places it appeared. | The schema, the top line, the footer, the Contact table, the Call card and every invitation say so. Confirm before production: Google is told this too. |
| 9 | **What the thank-you page follows.** It assumes a request form whose reply is a phone call. | If the form confirms by email, the first chapter changes. |
| 13 | **A GoHighLevel form for this practice.** BugHerd #34 asks for an enquiry form on `/contacts/`; the site has none and Instatic has no form backend, so the submission needs a destination. Brandklout's is GHL and no form is on record here. `.tmp/add-inquiry.mjs` is the whole change, waiting on the URL. | Until it lands there is no written route in; call, email and the booking page are the only ones. |
| 14 | **`--sage-deep` on the paper ground is 4.31:1.** `colour-leak.mjs` measures the savings-plan table's head row (`.mb-vs_a`, 12.5px) below the 4.5:1 minimum. The token is the brand guide's sage, which #4 asked us to honour, so darkening it is the practice's call and not ours. | One table head on one page today, but the token is the site's accent: if it moves, it moves everywhere. |

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Every
`index.html` under `home/`, the stylesheet, the two scripts, the vendored GSAP and every script
in `.tmp/` are committed. `home/assets/uploads/` is not (the root `.gitignore` refuses every
image extension); `.tmp/.gitignore` keeps the session cookies, the backups, the converted
graphs and the screenshots out. `instatic-media-map.json` IS committed: it is the only record
of which upload each local file became.
