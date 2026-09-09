# 2026-09-09 (later) — THE OTHER 46 PAGES, REDESIGNED

The client, this morning:

> <https://mason-park-kids.up.railway.app/services/invisalign> This page has the old design.
> It does not have the updated nav bar or footer. Please make sure all of the pages have the
> updated new design. Do it locally first and then let's upload into Instatic.

It was not one page. It was **every page that was not one of the eleven** — 46 of them — and
the reason they had never been redesigned is the reason the chrome could drift in the first
place.

## Why 46 pages could carry a different nav than their siblings

`stamp.mjs` has been the single source of the chrome since 2026-09-02, and `check.mjs` fails a
page whose chrome has drifted. Both of them read `home/**/index.html`. **The 46 migrated pages
were not in `home/`.** They existed only as Instatic node trees, imported by workflow 02
straight from the recovery mirror, and nothing on this disk could re-render them. So:

- `stamp.mjs` could not stamp them, and never had.
- `check.mjs` reported "all pages have identical chrome" while looking at eleven files.
- `crop-all.mjs` carried the eleven as a **hard-coded list**, so its sweep said clean.

Every gate was honest about what it looked at, and what it looked at was a fifth of the site.

## What was built

**`.tmp/harvest-migrated.mjs`** fetches all 46 live routes and pulls their CONTENT into
`migrated-content.json`: per page, the eyebrow and h1, the breadcrumb, and the prose as
numbered blocks (`p` / `h` / `ul` / `ol` / `table` / `faq` / `img`). It is a small tokenizer,
not a regex and not a dependency. The live pages ARE the recovery mirror's words — workflow 02
imported them verbatim — which matters because `recovered/` is gitignored and is not in this
worktree.

**`.tmp/recipes/*.mjs`** — 46 recipes, four files. A recipe names the page's chapters and, for
each one, which harvested blocks fill it: `b: [0, 1]` is this page's blocks 0 and 1 verbatim,
`b: ['other-slug', 3]` reaches into another page's, which is how a treatment page borrows the
answer that lives on the FAQ page.

**`.tmp/build-pages.mjs`** turns a recipe into `home/<slug>/index.html`, then `stamp.mjs` puts
the chrome on. **It writes a file once and gets out of the way**: the output is committed, the
output is the source, and from then on you edit the page's `<main>` in place exactly like the
eleven. A marker inside `<main>` (inside, so `stamp.mjs` preserves it) makes it refuse to
overwrite a page that has been hand-edited since, unless you pass `--force`.

Twelve chapter kinds, all built from vocabulary already in `site.css`: `prose` (the sticky-head
long-form frame), `cards`, `overlap`, `questions` (accordion), `qa` (open two-column), `table`,
`links`, `statement`, `figures`, `path` (the pinned track), `band`, `invite`.

## What the harvest turned up, which was the real story

Four content faults, none of them design, all of them shipped and live for a week:

1. **The FAQ questions were gone.** The 02 migration imported both topic FAQ pages with the
   ANSWERS intact and the QUESTIONS missing — the WordPress accordion kept its question text in
   a widget the mirror never rendered. Live,
   `/pediatric-dentistry-faqs-katy-tx/` is **30 orphaned answers under six section headings**,
   and `/invisalign-faqs-katy-tx/` is the same. Every question is restored to its own answer in
   the recipes, sitting directly under it where anyone can check the two match. The core service
   page did this for seven of them on 2026-09-02; this finishes it.

2. **The adult practice was all over this site.** `Dr. William Sung` — who is not a doctor of
   this practice; this site's are Nguyen and Cho — was named on `/technology/` and
   `/town-resource/`. `/virtual-consultation/` gave the parent practice's phone number and
   called itself "Mason Park Dental of Katy". `/town-resource/` signed off "BMason Park Family
   Dental", linked twice to `bestdentistinkatytx.com`, and listed teeth whitening, wisdom tooth
   removal and oral cancer screenings as services. **`/faq-page/` was the parent's FAQ start to
   finish**, down to "Where is Dr. Sung located?" and "Who is the best cosmetic dentist in
   Katy?". Every sentence that was re-attributed is written out in full in the recipe rather
   than referenced by block, so the change is visible in the file and not buried in a diff.

3. **`/accessibility-statement/`** was theme boilerplate: dated January 2022, signed with the
   parent practice's name, and describing an accessibility widget with a screen-reader mode and
   a keyboard menu. **There is no such widget on this site.** A false accessibility claim is
   worse than none, so it is now a truthful statement of what the site does (semantic markup,
   skip link, alt text, keyboard operation, the label floor, reduced-motion) and what it does
   not (no overlay, no control of the embedded map, no independent audit yet).

4. **`/toothpaste-chart/`** was Lead Safe Mama LLC's article pasted in whole — their fundraising
   links, their reader numbers, their first-person voice ("we had nearly 2.3 million unique
   individual readers here on this website"). Read on this domain it is the practice speaking.
   It is now credited to them by name and **linked rather than copied**: the chart is 51 products
   across nine columns, watermarked, unreadable at any width a phone has, and kept current by
   them. **This one is a client decision, not ours** — see Open questions.

And one that had gone stale rather than arrived wrong: `/privacy-policy/` still said pages load
typefaces from Google Fonts. They have been self-hosted since this morning's earlier pass.

## The photography

Fourteen stock slots could not give 46 more pages a photograph each without `waiting` carrying
nine of them, so **twelve more** were pulled from Magnific: `st-case`, `st-field`, `st-sleep`,
`st-floss`, `st-water`, `st-soda`, `st-tube`, `st-blocks`, `st-hands`, `st-window`, `st-laptop`,
`st-park`. All objects and empty rooms bar `st-hands`, which is two hands and no face.

`get-stock.mjs`'s policy did the work here: **stock may not appear in a clinical context**, so
a page about braces is searched by the object a parent recognises (a case on a shelf) and never
by the appliance. `AVOID_ALWAYS` already drops "braces", "orthodont", "x-ray" and "dental". The
seven treatment pages' HERO frames are the practice's own clinical photographs, which are the
only pictures allowed beside a treatment name.

Seven of the first twelve search terms returned the wrong thing (a soap bar for "case", a
mockup for "toothpaste tube", a splash shot for "soda") and were re-termed before download.
**Look at `--dry-run` before you spend the credits.**

## Gotchas

1. **A hard-coded page list in a gate is how a fifth of a site goes unwatched.** `crop-all.mjs`
   carried the eleven as an array. It now walks `home/`. If you add a gate, walk the directory.

2. **`stamp.mjs` eats anything between `<body>` and `<main>`.** It replaces that whole region
   with the homepage's chrome. `build-pages.mjs`'s "this file was generated" marker was there
   first and vanished on the first stamp, after which every page read as hand-edited and the
   builder refused to touch any of them. The marker lives inside `<main>` now.

3. **The build order is `build-pages` → `stamp` → `check`, and it does not commute.**
   `build-pages.mjs` emits a page with no chrome at all; run `check.mjs` before `stamp.mjs` and
   you get 24 errors that mean nothing.

4. **Un-doubling a two-column-pair table row by row interleaves it.** The RDA table is laid out
   as two side-by-side copies of (Toothpaste, RDA) to save vertical space. Flattening it row by
   row gave 0, 91, 4, 93, 7, 94 under a heading that said "lowest first". `chTable` now takes
   `sortBy`.

5. **`check.mjs` fails a prose run over 110 words**, and the migrated pages have several. The
   fix is a second `lf-section` at the point the copy changes subject, not a shorter paragraph.

## Where it is now

- **57 pages built locally**, `node check.mjs`: 0 errors, 2 warnings (both "over the 110 ceiling
  but inside the fold bound", the same class `our-doctors` has always carried).
- Commit `f12e01b4`.
- **The Instatic import was in flight when this was written.** Steps 1 to 4 done (backup,
  convert, 68 media uploaded, second pass); `ship-payload` / `run-convert` / `fetch-nodes` next,
  then `apply-body-class`, `apply-image-alt`, `import-styles`, `import-pages --publish`, then
  the live gates. `import-fonts`/`upload-fonts`/`import-scripts` are one-offs and were skipped.

## Open questions for the client

1. **The Lead Safe Mama chart.** It is a third party's copyrighted, watermarked lab chart that
   was published on this site as if it were the practice's own. It is now credited and linked
   instead of reproduced. If the practice has permission to host it, say so and it goes back in
   as an image with the credit.
2. **`/faq-page/` lost its content.** Every answer on it was about the adult practice. It is now
   the pediatric FAQ hub. If the practice wants the adult questions kept somewhere, they belong
   on `bestdentistinkatytx.com`.
3. **`/services/cosmetic-dentistry/` no longer lists dental implants**, which the migrated page
   did. A pediatric practice does not place implants in children; veneers and whitening went the
   same way, with a line pointing at the parent practice for them.
4. **`/before-after/` is still `noindex`** and still has no gallery, because there are no
   consented patient photographs yet. Unchanged from the 02 migration's decision.

## Version Control

Committed with this worktree. See [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md) section 4.
