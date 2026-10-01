# Institute for Advanced Dentistry · site build kit

How every page after the approved home is built. The client approved the home page on 2026-10-01; its
system (tokens, type, chrome, motion core) is **frozen**. Later pages vary in content, composition and
layout, never in system. The complete exemplar is
[`pages/dental-services/dental-implants.html`](pages/dental-services/dental-implants.html): read it first.

## Rules that are not negotiable

- **Light grounds only.** Graphite ink, gold as fills and rules, gold *text* only via `--accent-text`
  (`#74560f`). Grounds: `g-bone`, `g-paper`, `g-sand`, `g-white`, `g-mist`. No two neighbouring
  sections share a ground.
- **Elevated, not static** (Brandklout rejects calm text-led pages): every page opens on a photograph
  (legal and articles on type), **a photograph in every chapter**, a sentence per idea, and **at least
  three scroll-driven moves** (pin, scrub, count, draw, parallax) per page.
- **No wall of text.** At most ~110 words of consecutive paragraphs; fold the rest into
  `<details class="fold">`. Never rewrite clinical meaning; trim and split only.
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
<section class="ch hero hero--split" data-chapter="0" data-chapter-name="..." data-theme="light" data-intro> ... </section>
<section class="ch g-white pad" data-chapter="1" data-chapter-name="..." data-theme="light"> ... </section>
...
<!--@invite {"chapter": "9", "tagline": "...", "h2": "... <em>...</em>.", "lede": "..."}-->
  <!--@faq {"tagline": "...", "h2": "..."}-->
    <!--@faq-item {"id": "unique-1", "q": "..."}--><p>answer</p><!--@/faq-item-->
  <!--@/faq-->
<!--@/invite-->
```

- File path = URL: `pages/dental-services/tmj-treatment.html` serves `/dental-services/tmj-treatment/`.
- Every section is `class="ch ..."` with `data-chapter` (any number) `data-chapter-name` and
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
| Hero, split | `section.hero.hero--split[data-intro] > .hero__wrap > .hero__copy + figure.hero__fig > .hero__img img` (+ `.hero__note`, `ul.hero__facts`) | entrance; photo drifts, copy lifts | service pages |
| Hero, wide | `section.hero.hero--wide[data-intro] > .hero__wrap > .hero__copy (crumbs, tag, h1) + div (p.hero__lede, .hero__cta)`, then `.hero__window > img` as the section's second child | entrance; window opens to full width | pages led by one big photograph |
| Hero, index | `section.hero.hero--index[data-intro] > .hero__wrap > .hero__copy` + `.hero__strip` (3 `figure`) + `.hero__foot` | three photographs at three speeds | hubs (services, about, gallery, articles) |
| Hero, plain | `section.hero.hero--plain[data-intro] > .hero__wrap` + `.hero__meta` | entrance | legal, articles, thank you, 404 |
| Crumbs | `ol.crumbs` in every hero except the home | | |
| Say | `.wrap.say > p.tag + p.say__text[data-say]` (`strong` = gold); `.say--split` adds `figure.say__fig` | words lit by the scroll | one key idea |
| Rows | `.rows > .row(.row--flip) > figure.row__fig[data-wipe] img[data-parallax] + .row__body` | wipe, parallax, text follows | the substance of a page |
| Stack | `section.pg-stack > .stack[data-stack] > header.stack__head + .stack__deck > article.stack__card[data-stack-card]` | **pinned**, cards dealt | 3-5 options |
| Case | `.case(.case--flip) > .case__copy + figure.case__fig > .ba[data-ba]` | divider swept by the scroll, draggable | a real before/after |
| Line | `.line > .line__head + .line__track > span.line__bar + ol.line__list[data-line-list] > li.line__item > span.line__dot` | rule draws, steps light | visits, process |
| Figs | `dl.figs(.figs--3) > div > dt[data-count]+dd` | counted | numbers from facts.md only |
| Signs | `.signs(.signs--flip) > figure.signs__fig[data-wipe] + div > ul.signs__list > li > svg path + span` | marks drawn | candidacy, symptoms, comfort |
| Pull | `.pull(.pull--flip) > figure.pull__fig[data-wipe] (+ button.pull__play[data-story]) + blockquote.pull__q` | lines rise | a patient's words |
| More | `.more > ul.more__list[data-more] > li > a.more__link > .more__thumb img + .more__t + .more__d + svg`, then `div.more__float[data-more-float] > img` | photo follows the cursor | related pages |
| Prose | `.prose-wrap > aside.prose__side + .prose` with `details.fold > summary (+ i) + .fold__body` | | long clinical copy, legal |
| Vs | `.vs-wrap > table.vs` (`tr.is-pick` = the usual recommendation; `td[data-th]` for phones) | | comparing options |
| Mosaic | `.mosaic > .mosaic__col x3 > figure img` | three speeds | the office, the team |
| Band | `a.band[data-band][href="#invitation"] > span.band__track` | slides with the scroll | a way in, between chapters |
| Film | `button.film[data-story="/media/video/x.mp4"][data-story-name] > img + span.film__meta > (span > b + span.film__sub) + span.film__play > svg` | frame opens | a patient film |
| Tiles | `.tiles(.tiles--2/--4) > a.tile > .tile__img img + .spec + .tile__t + .tile__d` | dealt in rows | hubs, articles |
| Chipbar | `.chipbar > button[data-filter][aria-pressed]` | | gallery and article filters |
| Gallery | `.gal[data-gal] > .gal__item[data-gal-item][data-tags] > button.gal__btn[data-gal-btn][data-before][data-after][data-title][data-sub]` + `.lb[data-lb]` lightbox | | the smile gallery |
| Visit | `.visit > div + .visit__map > div[data-embed="google-map"]` | | contact |
| Post | `.post > aside.post__aside + article > .post__lead img + .prose` | | an article |
| Note | `.note > .note__seal? + div` | | warranty, disclaimers |

Shared reveals from the core work anywhere: `[data-tag]`, `[data-split="lines"]` on headings,
`[data-rise]`, `[data-wipe]` on a figure, `[data-parallax="8"]` on its image, `[data-count]`,
`[data-magnetic]` on buttons, `[data-tilt]` on cards.

A page needs a section the kit does not have? Write it in **your own** files: `css/5N-<group>.css`
and `js/5N-<group>.js` (register with `IFA.module({ init, motion })`, guard on your own elements,
class prefix of your group). Never edit `css/0*-4*`, `js/0*-3*`, `js/90-boot.js`, `partials/`,
`build.mjs`, `serve.mjs`, `tools/`.

## Photographs

1. Look at the contact sheets: `../../library/sheets/<group>-NN.jpg` (every tile labelled with its id).
   `library.json` maps id to file. Groups: `shoot-*` (the 2025 photoshoot), `office`, `extra`,
   `case-*` (before/after cases by treatment, one patient per folder), `oldsite` (the WordPress library:
   some stock, some diagrams, some real).
2. Prefer a frame the home does not use (media.py knows the home's) and one no other page uses.
   Case photos: mouth framing on service pages; full-face portraits only in the gallery. Before and
   after must share framing for a `.ba` slider.
3. Write your spec `data/media/<group>.json`: `{"<prefix>-<what>.jpg": {"src": "<library id>",
   "w": 1400, "crop": [x0,y0,x1,y1], "note": "what it shows"}}` (hero 1400-1600, rows 1400, thumbs 700).
4. `python tools/media.py data/media/<group>.json` cuts them into `media/img/`. It refuses a source used
   by more than two outputs. A re-cut needs a new file name.
5. Alt text says what the photo shows, specifically. Decorative thumbs in `.more` take `alt=""`.

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

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). Pages, CSS, JS, data and tools are
committed; `media/` and `dist/` are not (R2 backup via `scripts/assets.mjs`).
