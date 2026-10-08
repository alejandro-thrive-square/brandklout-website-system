# Institute for Advanced Dentistry · site build kit

How every page after the approved home is built. The client approved the home page on 2026-10-01; its
system (tokens, type, chrome, motion core) is **frozen**. Later pages vary in content, composition and
layout, never in system. The complete exemplar is
[`pages/dental-services/dental-implants.html`](pages/dental-services/dental-implants.html): read it first.

## Rules that are not negotiable

- **Light grounds only.** Graphite ink, gold as fills and rules, gold *text* only via `--accent-text`
  (`#74560f`). Grounds: `background-color-bone`, `background-color-paper`, `background-color-sand`, `background-color-white`, `background-color-mist`. No two neighbouring
  sections share a ground.
- **Elevated, not static** (Brandklout rejects calm text-led pages): every page opens on a photograph
  (legal and articles on type), **a photograph in every chapter**, a sentence per idea, and **at least
  three scroll-driven moves** (pin, scrub, count, draw, parallax) per page.
- **No wall of text.** At most ~110 words of consecutive paragraphs; fold the rest into
  `<details class="disclosure_component">`. Never rewrite clinical meaning; trim and split only.
- **Copy comes from the client**, never invented: the scrape
  (`workflows/01-content-intake/.tmp/current-site-scrape/pages/<slug>.md`), the approved home, and
  [`docs/facts.md`](../../../../../docs/facts.md). Figures exactly as facts.md. No "100% satisfaction",
  no prices, no new claims. **No em dashes** (the build refuses them). "Dr. Jonathan Bensoussan" in full
  on first mention in the hero or first section, "Dr. Bensoussan" after.
- **Chapter tags are named, never numbered** (`<p class="tag"><span>Name</span><em>line</em></p>`).
- **Every photo shows what its heading says** (IMAGES.md, relevance 3). Real people, patients and
  results are never stock or AI. A photo on **at most two pages**; each page's hero is its own.
- **Never pin or move an iframe.** Forms and widgets are Embeds on the live site.
- **SEO:** one `<h1>` per page (the build refuses otherwise); `title` 50-60 characters, keyword first,
  ending `| Institute for Advanced Dentistry`; `description` 140-160 characters.
- **URLs are the WordPress URLs**, with the trailing slash: `/dental-services/tmj-treatment/`.

## Page anatomy

```html
<!--@page {"title": "...", "description": "...", "label": "Short name"}-->
<section class="section_chapter section_hero is-split" data-chapter="0" data-chapter-name="..." data-theme="light" data-intro> ... </section>
<section class="section_chapter background-color-white padding-section-large" data-chapter="1" data-chapter-name="..." data-theme="light"> ... </section>
...
<!--@invite {"chapter": "9", "tagline": "...", "h2": "... <em>...</em>.", "lede": "..."}-->
  <!--@faq {"tagline": "...", "h2": "..."}-->
    <!--@faq-item {"id": "unique-1", "q": "..."}--><p>answer</p><!--@/faq-item-->
  <!--@/faq-->
<!--@/invite-->
```

- File path = URL: `pages/dental-services/tmj-treatment.html` serves `/dental-services/tmj-treatment/`.
- Every section is `class="section_chapter ..."` with `data-chapter` (any number) `data-chapter-name` and
  `data-theme="light"`. The hero has `data-intro` (its own entrance on load).
- Every page ends with `<!--@invite ...-->` (the consultation chapter with the form, the address, the
  payment logos and the footer). Its FAQ is optional but wanted on service pages (3-5 items, answers
  from the client's copy). `id`s unique per page. JSON inside comments: double quotes, escape `"`,
  no `}` inside strings, never `-->`.
- `{{site.phone}}`, `{{site.tel}}`, `{{site.addressLine}}` etc. come from `data/site.json`.
- Third-party widgets: `<div class="..." data-embed="key"></div>` with a key from `data/embeds.json`
  (`elfsight-reviews`, `google-map`). Never paste an iframe or script tag into a page.
- The home is `pages/index.html`; do not edit it.

## The sections (css/40-pages.css, js/30-pages.js)

Copy the markup from the exemplar; the class lists below are what each one needs.

| Section | Markup root | Motion | Use for |
| --- | --- | --- | --- |
| Hero, split | `section.section_hero.is-split[data-intro] > .hero_layout > .hero_copy + figure.hero_figure > .hero_image img` (+ `.hero_note`, `ul.hero_facts`) | entrance; photo drifts, copy lifts | service pages |
| Hero, wide | `section.section_hero.is-wide[data-intro] > .hero_layout > .hero_copy (breadcrumb, tag, h1) + div (p.hero_intro, .hero_buttons)`, then `.hero_window > img` as the section's second child | entrance; window opens to full width | pages led by one big photograph |
| Hero, index | `section.section_hero.is-index[data-intro] > .hero_layout > .hero_copy` + `.hero_photo-strip` (3 `figure`) + `.hero_footer` | three photographs at three speeds | hubs (services, about, gallery, articles) |
| Hero, plain | `section.section_hero.is-plain[data-intro] > .hero_layout` + `.hero_details` | entrance | legal, articles, thank you, 404 |
| Breadcrumb | `ol.breadcrumb_component` in every hero except the home | | |
| Say | `.container-large.idea_component > p.tag + p.idea_text[data-say]` (`strong` = gold); `.is-with-photo` adds `figure.idea_figure` | words lit by the scroll | one key idea |
| Rows | `.row_list > .row_item(.is-text-first) > figure.row_figure[data-wipe] img[data-parallax] + .row_body` | wipe, parallax, text follows | the substance of a page |
| Stack | `section.section_stack > .stack_component[data-stack] > header.stack_header + .stack_deck > article.stack_card[data-stack-card]` | **pinned**, cards dealt | 3-5 options |
| Case | `.case_component(.is-photo-first) > .case_copy + figure.case_figure > .before-after_component[data-ba]` | divider swept by the scroll, draggable | a real before/after |
| Line | `.timeline_component > .timeline_header + .timeline_track > span.timeline_bar + ol.timeline_list[data-line-list] > li.timeline_item > span.timeline_dot` | rule draws, steps light | visits, process |
| Figs | `dl.stats_component(.is-three-columns) > div > dt[data-count]+dd` | counted | numbers from facts.md only |
| Signs | `.checklist_component(.is-list-first) > figure.checklist_figure[data-wipe] + div > ul.checklist_list > li > svg path + span` | marks drawn | candidacy, symptoms, comfort |
| Pull | `.quote_component(.is-quote-first) > figure.quote_figure[data-wipe] (+ button.quote_play-button[data-story]) + blockquote.quote_text` | lines rise | a patient's words |
| More | `.related_component > ul.related_list[data-more] > li > a.related_link > .related_thumbnail img + .related_title + .related_description + svg`, then `div.related_floating-image[data-more-float] > img` | photo follows the cursor | related pages |
| Prose | `.prose_layout > aside.prose_aside + .text-rich-text` with `details.disclosure_component > summary (+ i) + .disclosure_body` | | long clinical copy, legal |
| Vs | `.comparison_table-wrapper > table.comparison_table` (`tr.is-pick` = the usual recommendation; `td[data-th]` for phones) | | comparing options |
| Mosaic | `.mosaic_component > .mosaic_column x3 > figure img` | three speeds | the office, the team |
| Band | `a.band_component[data-band][href="#invitation"] > span.band_track` | slides with the scroll | a way in, between chapters |
| Film | `button.film_component[data-story="/media/video/x.mp4"][data-story-name] > img + span.film_caption > (span > b + span.film_subtitle) + span.film_play-button > svg` | frame opens | a patient film |
| Tiles | `.tile_grid(.is-two-columns / .is-four-columns) > a.tile_card > .tile_image img + .text-style-label + .tile_title + .tile_description` | dealt in rows | hubs, articles |
| Chipbar | `.filter_bar > button[data-filter][aria-pressed]` | | gallery and article filters |
| Gallery | `.gallery_grid[data-gal] > .gallery_item[data-gal-item][data-tags] > button.gallery_button[data-gal-btn][data-before][data-after][data-title][data-sub]` + `.lightbox_component[data-lb]` lightbox | | the smile gallery |
| Visit | `.visit_layout > div + .visit_map > div[data-embed="google-map"]` | | contact |
| Post | `.post_layout > aside.post_aside + article > .post_lead-image img + .text-rich-text` | | an article |
| Note | `.notice_component > .notice_seal? + div` | | warranty, disclaimers |

Shared reveals from the core work anywhere: `[data-tag]`, `[data-split="lines"]` on headings,
`[data-rise]`, `[data-wipe]` on a figure, `[data-parallax="8"]` on its image, `[data-count]`,
`[data-magnetic]` on buttons, `[data-tilt]` on cards.

A page needs a section the kit does not have? Write it in **your own** files: `css/5N-<group>.css`
and `js/5N-<group>.js` (register with `IFA.module({ init, motion })`, guard on your own elements).
Never edit `css/0*-4*`, `js/0*-3*`, `js/90-boot.js`, `partials/`, `build.mjs`, `serve.mjs`, `tools/`.

## Class names (Client-First, since 2026-10-05)

Every class follows [CLASS-STANDARD.md](../../../../../../../process/tools/client-first-style-guide/CLASS-STANDARD.md):

- **Custom** `folder_element`, one underscore, whole words: `hero_copy`, `timeline_dot`, `tile_card`.
  A component's root is `<folder>_component` (or `_layout`, `_grid`, `_list`); a chapter is
  `section_<beat>`; every chapter also carries `section_chapter`.
- **Combo** `is-<variant>`, only on a base class: `section_hero is-split`, `row_item is-text-first`.
  The CSS writes combos bare (`.is-text-first { … }`), so **each combo name is unique site-wide**:
  never reuse one for a second component. **A new combo that sets a property its base class also sets is
  written compound** (`.path_step.is-closing { width: … }`): two bare classes on one element are decided by
  source order, which the move into Instatic's registry does not keep (`push/cascade-check.mjs` is the gate).
- **Utility** (dashes only) from the library: `container-large`, `padding-section-large`, `button`
  (`is-primary` gold, `is-secondary` outline, `is-alternate` ink), `heading-style-h1`…`h4`,
  `tag` (the chapter tag), `text-style-lede`, `text-style-label` (the mono small caps), `text-rich-text`,
  `background-color-{bone,paper,sand,white,mist}` (the grounds), `text-color-muted`, `hide`, `hide-visually`.
- No abbreviations, no BEM (`a__b`, `a--b`), no bare dash names for custom classes.
- Gate before every push: `node class-audit.mjs --local <site-src> --strict` (in
  `deliver/process/tools/instatic-api-sync/`) must end `IN BOUNDS`. The old names and what each
  became: `../../class-standard/class-map.json`.
- **Spacing and type read the Framework** (CLASS-STANDARD.md §10, since 2026-10-08). A padding, margin or gap
  that equals a house step is written `var(--space-small)` (1rem) … `var(--space-xxhuge)` (12rem); the role
  classes read `var(--size-h1)` … `var(--size-text-label)`, formulas in `01-tokens.css` over the `--size-*-base`
  tokens. Both token sets live in the Instatic Framework panel on the site and in `01-tokens.css` for the
  preview (`push/editable.mjs` moves the `:root` copies, like the colours). Off-scale values (`.9rem`, `1.25rem`)
  stay literal until the snap is decided (phase 2 C). `node ../../../../../../process/tools/instatic-api-sync/scale-tokens.mjs --files css`
  rewrites new literals that equal a step.
- **Never restyle a utility or role class from a context** (`.footer_column .text-style-label { color }`): an edit
  to `text-style-label` in the Styles panel would do nothing there. Put a combo on the element
  (`text-style-label is-footer-column`) and write the rule compound (`.text-style-label.is-footer-column`). The
  17 overrides of the first build became combos this way on 2026-10-08 (`../../class-standard/combo-map.json`;
  `node tools/combo-classes.mjs --check dist` proves the build carries them). Themes and states
  (`[data-theme="light"] .x`, `.panel:not(.is-open) .x`) are legitimate context and stay.
  Gate: `structure-audit.mjs --local <site-src>` (same folder as class-audit) reports the overrides.

## Photographs

1. Look at the contact sheets: `../../library/sheets/<group>-NN.jpg` (every tile labelled with its id).
   `library.json` maps id to file. Groups: `shoot-*` (the 2025 photoshoot), `office`, `extra`,
   `case-*` (before/after cases by treatment, one patient per folder), `oldsite` (the WordPress library:
   some stock, some diagrams, some real).
2. Prefer a frame the home does not use (media.py knows the home's) and one no other page uses.
   Case photos: mouth framing on service pages; full-face portraits only in the gallery. Before and
   after must share framing for a `.before-after_component` slider.
3. Write your spec `data/media/<group>.json`: `{"<prefix>-<what>.jpg": {"src": "<library id>",
   "w": 1400, "crop": [x0,y0,x1,y1], "note": "what it shows"}}` (hero 1400-1600, rows 1400, thumbs 700).
4. `python tools/media.py data/media/<group>.json` cuts them into `media/img/`. It refuses a source used
   by more than two outputs. A re-cut needs a new file name.
5. Alt text says what the photo shows, specifically. Decorative thumbs in `.related_component` take `alt=""`.

## Build, look, fix

```bash
# from site-src/. Your own output dir and port; never build into dist/ while others work.
node build.mjs --out C:/Users/ACER/AppData/Local/Temp/ifa-<group> --only dental-services/tmj,dental-services/sleep > C:/Users/ACER/AppData/Local/Temp/ifa-<group>.log 2>&1
node serve.mjs <port> C:/Users/ACER/AppData/Local/Temp/ifa-<group>        # run in the background
MSYS_NO_PATHCONV=1 node tools/walk.mjs /dental-services/tmj-treatment/ 1440 12 --base=http://localhost:<port> > walk.log 2>&1
MSYS_NO_PATHCONV=1 node tools/walk.mjs /dental-services/tmj-treatment/ 390 14 --base=http://localhost:<port> > walk390.log 2>&1
```

`walk.mjs` writes frames to `../../shots/` and prints console errors, failed requests, overflow and
pin count. **Look at the frames** (tile them with PIL), at 1440 and 390, and fix what you see: text
over a face, a crop that loses the subject, a section that reads as empty, anything that overflows.
Done means: build `ok`, zero console errors, zero failed requests, no overflow at 390, every page
viewed at both widths. Git Bash: `MSYS_NO_PATHCONV=1` before any command with a `/route` argument;
never pipe a Node script's output (redirect to a file).

## Lessons from the first full build (2026-10-01)

- `.tile_image` is a `div` (a `span` ignores the aspect ratio unless forced; the kit now forces `display:block`).
- A lightbox (`.lightbox_component[data-lb]`) must not stay inside `#smooth-content`: ScrollSmoother transforms it and a
  `position:fixed` child opens far down the page. Move it to `<body>` on init (see `js/52-cosmetic.js`).
- **Overlays are closed by default in CSS** (`.menu-drawer_component`, `.modal_component`, `.lightbox_component`:
  `display: none` in the base class) and opened by the `is-open` combo the scripts add (`IFA.setOpen(el, open)`,
  which also toggles `hidden` for assistive tech). Never close one with the `hidden` attribute alone: the Instatic
  editor canvas renders through React, which drops `hidden=""`, and site scripts do not run there, so a
  `[hidden]`-only overlay covers every page in the editor (2026-10-07). In-flow `hidden` toggles that scripts set at
  runtime (FAQ answers, filtered gallery items) are fine: the canvas shows them all open, which helps editing.
  Gate: `tools/instatic-api-sync/editor-canvas.mjs --site institute-for-advanced-dentistry:staging` (in `migration-gates.mjs final`).
- Hidden placeholders (`[data-more-float] img`, the lightbox images) start without a `src`; the script fills
  them. Otherwise every page "repeats" a photo in the reuse gate.
- Whole-site checks: `node tools/sweep.mjs [--base=...]` (console, failed requests, overflow, h1, links) and
  `node ../../../../tools/instatic-site/gates/image-reuse.mjs --dist <dist> --allow data/image-reuse-allow.json`
  (from the step folder).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). Pages, CSS, JS, data and tools are
committed; `media/` and `dist/` are not (R2 backup via `scripts/assets.mjs`).
