# 03 — The core pages of Mason Park Dental for Kids

> [!IMPORTANT]
> **Every page is a plain HTML file. Open `home/index.html` by double-clicking it.**
> No server, no build step. Every path is relative, so it renders from `file://` exactly as
> it renders on Instatic. `home/` is the site root: `home/index.html` is `/`,
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
| `home/assets/uploads/` | The practice's photographs at a few widths each, written by `.tmp/prep-images.py`. **Gitignored**, like the parent's. |
| `.tmp/stamp.mjs` | **The chrome is constant.** Re-stamps every page's head, top line, masthead, footer and script tags from the homepage, keeping each page's own title, description, canonical, og tags, robots and `<main>`. `--check` reports drift. |
| `.tmp/check.mjs` | The static gate: assets resolve, braces balance, no control bytes, nothing Instatic refuses, the prose ceiling, ids and anchors, alt text, **no em dashes**, chrome identical to the homepage. |
| `.tmp/shot.mjs` | The render gate: four widths, overflow, small text, never-revealed elements, broken images, console, **and which face is actually painted**. `--slices desktop` for readable windows. |
| `.tmp/probe-hooks.mjs` | Motion on: every `data-write` at three intermediate states, the growth chart fills and changes hands, counters land, rails travel, wipes finish, the path pins and fits the window. Takes a file path or a live URL. |
| `.tmp/prep-images.py` | Builds `uploads/` from the recovery mirror. The pool is named by what each frame shows, and the notes say which are the practice's own. |
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
- Do not write `.mjs`, `.js` or `.css` here through a shell heredoc or a `node -e` string.
  Backslashes are eaten on the way through and the file still parses. It cost two rounds in
  this workflow alone (a Chrome path, a regex). Use an editor.

## Instatic import

```bash
cd .tmp && npm i                                   # once: playwright-core
node list-site.mjs                                  # what is there
node backup-site.mjs                                # 1. dump the instance. 7 MB.
node to-instatic.mjs --lean                         # 2. -> instatic/  (media not yet mapped)
node upload-media.mjs                               # 3. upload; writes instatic-media-map.json
node to-instatic.mjs --media instatic-media-map.json --lean   # 4. second pass, /uploads paths
node ship-payload.mjs && node run-convert.mjs && node fetch-nodes.mjs   # 5. HTML -> node graphs, inside the container
node apply-body-class.mjs                           # 6. has-journey onto each root node
node apply-image-alt.mjs                            # 7. alt text and the eager hero hints
node import-fonts.mjs                               # 8. Fraunces + Nunito, self-hosted
node import-styles.mjs                              # 9. class rules + site.css as a code asset
node import-scripts.mjs                             # 10. gsap + site.js + journey.js, one bundle
node import-pages.mjs --publish                     # 11. write the eleven rows, publish
node verify-live.mjs && node verify-live.mjs --migrated   # 12. the proof
node diff-live.mjs ../home/index.html https://mason-park-kids.up.railway.app/
node probe-hooks.mjs https://mason-park-kids.up.railway.app/
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
  from the `webzite.open-graph` and `webzite.aeo-schema` plugins, which are not installed here.
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
| 6 | **Where should "write a review" go?** The reviews page sends people to the Google Maps listing. | A `g.page` review link is better. |
| 7 | **Dr. William Sung.** Named on the old technology and special-needs pages; not on these eleven, which name Dr. Nguyen and Dr. Cho as the practice's own contact page does. | Confirm before the treatment pages are rebuilt. |
| 8 | **Office hours.** Mon/Wed 9 to 6, Tue/Thu 8 to 5, Fri to Sun closed, as the old footer published them. | The schema, the top line, the footer and every invitation say so. |
| 9 | **What the thank-you page follows.** It assumes a request form whose reply is a phone call. | If the form confirms by email, the first chapter changes. |

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Every
`index.html` under `home/`, the stylesheet, the two scripts, the vendored GSAP and every script
in `.tmp/` are committed. `home/assets/uploads/` is not (the root `.gitignore` refuses every
image extension); `.tmp/.gitignore` keeps the session cookies, the backups, the converted
graphs and the screenshots out. `instatic-media-map.json` IS committed: it is the only record
of which upload each local file became.
