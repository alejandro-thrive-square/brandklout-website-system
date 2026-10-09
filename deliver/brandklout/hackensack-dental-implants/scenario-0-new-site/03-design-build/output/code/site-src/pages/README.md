# Writing a page

Every page except the home page is a module here: `pages/<path>.mjs` builds `/<path>`
(`pages/services/all-on-x.mjs` → `/services/all-on-x`). It default-exports `page({...})` from
[`../lib/ui.mjs`](../lib/ui.mjs) over a list of chapters. Read `ui.mjs` (every component and its
props) and [`services/all-on-x.mjs`](./services/all-on-x.mjs), the reference page, before writing one.
Files starting with `_` are shared copy, not pages ([`_shared.mjs`](./_shared.mjs)).

## The copy is the practice's own

Source: the live site capture, `scenario-1-migration/01-old-site-capture/output/`:
`scrape/pages/<slug>.md` (text and heading outline), `scrape/data/<slug>.json` (`seo`, `headings`),
`mirror/raw-html/<path>.html` when the markdown flattened a list or a table, `posts/posts/*.md` for
the blog (HTML bodies and FAQ pairs).

- **Place it, never rewrite it.** No paraphrase, no summary, no new sentences, no new claims. A
  heading is the page's own h2/h3 text.
- **Allowed edits only:** an em dash becomes a comma, colon or full stop (house rule); dead
  paragraphs go (a bare "Call us today", "Learn more", jump menus, repeated address/hours/language
  blocks, navigation and footer text); structure the editor implied comes back (a list typed as
  lines becomes a list, a bold line becomes a heading).
- **Taglines** (the small gold label above a heading) are short neutral labels of one to four words
  ("The Treatment", "Recovery", "Ideal Candidates"), never a claim or a number.
- **No wall of text.** A run of consecutive paragraphs longer than about 110 words is split: the
  first part in `body`, the rest in `more` (it folds behind "Read more"). Clinical detail is never cut.
- **SEO:** `seo.title` and `seo.description` are the live page's title tag and meta description,
  verbatim (fixed only where they name another practice). The hero `title` is the live page's H1.
  `crumbs` is the breadcrumb trail; pass the same array to `hero({ crumbs })`.

## Facts the copy must not carry

- **One phone number:** (551) 368-2476. Marketing copy that prints (201) 488-8866 uses 551 instead;
  legal pages keep their text verbatim and the page's header comment lists the number.
- **No "4.7 stars" and no "1,000+ / 1,104 reviews".** That is the host's Google listing
  (BugHerd #10, #24). The office's own listing is 5.0; never print a review count.
- **"Arvada" is another practice** (the live site was cloned from its template): "Arvada Dental
  Center & Implants" becomes "Hackensack Center for Dental Implants"; "in Arvada" becomes "in
  Hackensack". List every change in the page's header comment.
- **Dead links on the live site:** `/all-on-x-implants` → `/services/all-on-x`, `/what-to-expect`
  → `/first-visit-expectations`, `/implant-supported-dentures` → `/services/dental-implants`,
  `/zygomatic-implants` → `/services/all-on-x`.
- **No images from the live site's blog template** (files named `6a05…` / `6a06…`): they came with
  another practice's template and may show its office.

## Chapters

- Order follows the live page. A treatment page ends with `faq(...)` then `consult(...)` (the
  consultation form); other pages end with `consult(...)` or `cta(...)`.
- **At least three held (pinned) chapters per page** at 1440 (the `check-pages` gate counts them):
  `statement`, `checks`, `index`, `timeline`, `cards`, `quote`, `team`, `specialist`, `films`,
  `financing` hold while their scene plays; `path` holds its counter beside the steps. A block holds
  only when it fits the window (the scene pins its own list when the whole chapter is too tall, and
  plays unpinned when even that is too tall), so a page with long copy can fall short: run the gate.
  `split`, `features`, `links`, `faq`, `numbers`, `compare` never hold. `js/00-scenes.js` gives each
  held element the id `<scene>-<n>`. Text that moves never drops below 0.7 opacity (Brandklout:
  readable before it fills).
- Six to ten chapters. Never the same component twice in a row; alternate `split({ reverse })`.
- Repeated copy comes from `_shared.mjs`: `MESKIN` (the "Why Patients Choose Dr. Meskin" block; the
  page sets `title` to its own heading) and `LENDER_COPY` ("Smile Now, Pay Later"), when the page's
  own text matches them word for word.
- `films()` is "Real Patients, Real Stories" / "Watch Our Patient Video Diaries" (Isaac and Daniel).

## Images

Write a slot as `image: { src: '<page-key>-<role>.webp', w, h, alt: '<what the photo should show>' }`
(`page-key` is the file name, `role` hero / fix / split1 …). The photographs are assigned and cut
afterwards (`code/images.json` → `code/cut-images.py`), and the alt text is rewritten to describe the
photo actually placed. Sizes: hero `1200 x 1200` (`variant: 'wide'`: `2400 x 1100`), split
`1100 x 1300`, statement `1000 x 900`, checks `1100 x 900`, features band `2400 x 1000`, cards
`800 x 600`, links `900 x 700`, team `900 x 1100`, quote and cta `900 x 1100`, articles `1200 x 800`.
Never a stock face beside a treatment; doctors, team, patients and the office are client photos only.

## Breakpoints

Use the house breakpoints (1279 / 991 / 767 / 479) and the other conditions already listed in
`css/00-breakpoints.css` (the fluid root's 1920 and 1440, the tokens' 1439 / 1099 / 419). A new condition goes into that file first,
in cascade order: Instatic publishes every rule's media styles in the order the conditions first
appear in the stylesheet, so a condition first met out of order breaks the published site (and only
the published site).

## Check

`node -e "import('./pages/<path>.mjs').then(m => console.log(m.default.seo.title))"` from `site-src/`
proves a module loads; `node build.mjs` builds everything (one build at a time: it empties `dist/`).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../../SYSTEM_RULES.md). Pages are source: tracked.
