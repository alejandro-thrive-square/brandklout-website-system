# Stone Surgical Arts — handoff

**One page.** The home page, built locally, live on the client's Instatic instance. Written
2026-08-30; content expansion 2026-08-31; **cut to the home page alone 2026-09-01.**

> [!IMPORTANT]
> **WHAT HAPPENED ON 2026-09-01, AND WHY THIS FILE IS A THIRD OF ITS PREVIOUS LENGTH.**
>
> The client reviewed the eighteen-page site and kept the home page. Nothing else. The other
> seventeen pages, and every piece of source and documentation that existed to serve them, were
> deleted rather than left in the tree — an unbuilt page is dead weight, but an unbuilt page that
> still has stylesheets, a data collection, a renderer, an seo entry, nav links pointing at it and
> five hundred lines of handoff describing it is worse than dead weight. It is a false picture of
> the project that the next reader has to spend an afternoon disproving.
>
> **The assets were kept.** All forty-two images stay in the library, including the twenty-one that
> only the deleted pages used. They are generated or licensed work, remaking them is the expensive
> part, and the pages may come back. `audit.mjs` knows about them by name and counts them instead
> of warning on each one.
>
> | | |
> | :--- | :--- |
> | Deleted | 17 `pages/*.body.html` · 17 built pages · `treatments-data.mjs` · `render-treatments.mjs` · `link-treatment-rows.mjs` · `seed-treatment-seo.mjs` · `add-faq-schema.py` · 8 stylesheets · 17 `seo.json` entries · `_home-v1.body.html` |
> | Trimmed | the navbar's Treatments dropdown and mega-menu · the drawer's treatment list · the footer's category ribbon · 5 dead JS modules · 119 dead rule blocks in `50-journey.css` |
> | Rewritten | every link on the home page that pointed at a deleted page (11 targets) |
> | Verified | screenshots at 390 and 1440 are **byte-identical** before and after the CSS cut; `journey-test.mjs` 47/47; `audit.mjs` FAIL none WARN none; `all-pages.mjs` clean |
> | Bundle | `site.css` 116.2KB → **98.5KB**; `00-runtime.js` 275 → 136 lines |
>
> **Where the deleted work went.** Nowhere — it is in git history and nothing else. If a page comes
> back, recover its `.body.html` and its `seo.json` entry from the commit before this one, put its
> row back in the `PAGES` table, and expect its stylesheet to need recovering too. The treatment
> pages additionally need `treatments-data.mjs` and `render-treatments.mjs`, which were a
> collection and a renderer, not twelve hand-written files.

> [!IMPORTANT]
> **THE HOME PAGE IS v2, "the journey", rebuilt 2026-08-31.** Brandklout's team reviewed the first
> build and called the design *"very ugly and simple"*, with drnahlah.com set as the quality bar.
> The page is now eleven editorial chapters on three grounds, with pinned horizontal travel and a
> stone-textured material system. **Read [`style-direction-v2.md`](../style-direction-v2.md)
> first** — it carries the diagnosis, what was and was not borrowed from Nahlah, and why each image
> exists.
>
> | | |
> | :--- | :--- |
> | Content | **nothing invented.** Every figure, quote, credential, fee, town and press item is a sourced string |
> | Tokens | `01-tokens.css` **untouched**. Palette and typefaces are the client's board, exactly as briefed |
> | Gate | `node journey-test.mjs` — **47/47** |

| | |
| :--- | :--- |
| **Source** | [`site-src/`](./site-src/) — edit here |
| **Output** | [`final-site/`](./final-site/) — generated, never hand-edit |
| **Build** | `cd site-src && node build-site.mjs` |
| **Check** | `cd site-src && node audit.mjs` — links, images, a11y, SEO. Exits non-zero on any failure |
| **Copy gate** | `cd site-src && node check-copy.mjs` — **no em dashes in copy** ([SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md)). Runs on the BUILT output |
| **Motion gate** | `cd site-src && node journey-test.mjs` — 47 headless checks on the chapters: overflow at six widths, that the pin really travels, and that reduced motion produces zero pins |
| **Screenshot** | `node site-src/shot.mjs "$PWD/final-site" index.html out.png 1440` |
| **Packed preview** | `cd site-src && node make-preview.mjs` — the page in one self-contained file, every asset and GSAP inlined. Then `node check-standalone.mjs` |
| **Sanity sweep** | `cd site-src && node all-pages.mjs` — no sideways scroll, no clipped control, clean console, no off-origin request, both typefaces loaded, at 390/1024/1440. Built for eighteen pages and now runs one; **keep running it after touching anything in `css/`** |
| **Weight** | `cd site-src && node weight.mjs` — transferred bytes, LCP, per-image over-delivery against the painted size at 2x |
| **Perf** | `cd site-src && node perf.mjs` — drives the scroll through CDP at 4x CPU throttle, reports dropped frames and long tasks per zone. An unthrottled desktop is always smooth, which is why janky sites ship |
| **Pin review** | `node site-src/pin-shot.mjs "$PWD/final-site" <outdir> 1440 800 laptop` — the pinned chapter at the start, middle and end of its travel. A full-page screenshot cannot show it |
| **Measure** | `cd site-src && node measure.mjs` — per screen size: which chapters exceed the viewport, whether every reveal fired, what the gutter and content width resolve to |
| **Fonts** | `cd site-src && node get-fonts.mjs` — **REQUIRED ON A FRESH CLONE.** The `.woff2` files are gitignored like every other binary, so `assets/fonts/` is empty until this is run and the site silently falls back to Georgia and Arial. `css/03-fonts.css` and the generator ARE committed. Self-hosted, latin subset; **there is no request to fonts.googleapis.com** and `journey-test.mjs` asserts there is none |
| **Imagery** | `node site-src/get-stock.mjs` (searched) · `node site-src/generate-images.mjs` (generated) |
| **Live** | <https://stone-surgical-arts-production.up.railway.app> — see [`05-instatic-upload`](../../../05-instatic-upload/05-instatic-upload.md) |
| **Preview harness** | `node ../../../01-content-intake/.tmp/serve.mjs . 8792` then open `http://localhost:8792/preview.html` |
| **Asana** | [Give Jess the core pages for Aesthetic - Stone](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1217846850268874) |
| **Design** | "Stone Surgical Arts Website Redesign — 01 Sculpted Ivory", attached to that task |
| **Content sources** | [`01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md`](../../../01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md) — every fact, and where it came from |

## The page

| Page | File | What it does |
| :--- | :--- | :--- |
| Home | `index.html` | positions the practice: arrival, the idea, the four categories, the surgeon, the path, the standard, the proof, results, memberships, questions, the invitation |

**It no longer routes anywhere.** That is the shape of the change, and it is worth being explicit
about, because the page was designed as a hub. Eleven links left the page — four category cards, a
treatments hub, an about page, a results page twice, a memberships page and a booking page twice —
and there was nothing on the other end of any of them. What replaced them:

- **The four category cards are `<div>`s now, not links.** They keep their photograph, their
  numeral, their name and their line of copy, so the section still says what the practice does. The
  "Explore →" affordance was removed with the link; a card that looks clickable and is not is worse
  than a card that does not.
- **Every "book" and "schedule" CTA points at `#contact`**, the invitation chapter at the foot of
  the page, which carries the address, the phone number and the hours. That is a real destination
  and it always existed; it just was not the one the buttons used.
- **Secondary buttons whose only job was to leave the page were deleted** — "See treatments &
  fees", "More about Dr. Stone", "Read more reviews", "See results & reviews", "See the three
  tiers", "More answers on the booking page". Each sat alone in its section's action row, so the
  row went with it.
- **The nav is the logo, a Contact link, the phone and one button.** The mega-dropdown is gone. The
  drawer survives because at 991px and below the navbar hides both its menu and its phone number,
  which makes the drawer the only place a phone gets the number without scrolling to the footer. It
  is not a menu any more; it is the mobile contact card.

> [!NOTE]
> **One anchor points backwards, and it was left that way on purpose.** The shared closing CTA band
> sits immediately *after* the invitation section, so its "Schedule a consultation" scrolls up one
> screen rather than down. It lands on the right content, and the band's other button is a direct
> `tel:`, so the alternative — deleting the primary button from the closing band — costs more than
> the oddity does. Every other CTA on the page (nav, hero, drawer) scrolls forward correctly.

## Before this goes live

The list was ten items when there were eighteen pages. Five of those were about a page that no
longer exists — the fee tables, the membership tiers, the consultation form, the reviews embed and
the results gallery — and they are **not** dead work, they are dormant: recover the page and
recover the blocker with it from git history. What follows still applies to what is actually built.

### 1. Photography · **client**

- **Home hero.** The board's hero is a studio portrait. The page currently opens on
  `hero-arrival.webp`, a generated room. Honest, and not the intended shot.
- **The category photographs.** Four generated 2:3 images, one per category: a carved marble profile
  for Face, instruments for Neck, the laser platform for Skin, vials for Non-Surgical. Objects and
  materials, never a face.
- **The practice's own material is in.** Six real photographs from the client's 2026-08-31 Drive
  export are imported and recorded in `site-src/client-manifest.json`. Of those, the page uses the
  signage, a consult room and the reception detail. The rest are in the library.

> [!IMPORTANT]
> **A stock model face is the same problem as a generated one.** The rule that keeps faces out of
> `generate-images.mjs` is that a face beside a treatment name reads as that treatment's RESULT.
> Buying the face from a library rather than a diffusion model does not change what the reader
> concludes. The Drive export's ~40 model portraits were not used, and that decision should hold if
> the treatment pages come back.

> [!WARNING]
> **Do not publish before/after photographs from the archive or from the client's Drive export.**
> The retired site published 33 cases of identifiable patients who consented to a website that no
> longer exists, under a brand that has been retired. Consent does not travel to a new site.
> `img/before-after/` in the Drive export is the same class of material.
>
> **One file in it is a trap.** `img/before-after/image1.jpg` is captioned *"3 weeks post
> MyEllevate … Courtesy of G. Mueller MD"*. It is the DEVICE MANUFACTURER'S marketing image of
> ANOTHER SURGEON'S patient. Publishing it as a Stone result would be a fabricated outcome whatever
> the consent position.
>
> This warning outlived the Results page on purpose. The material is still in the intake folder and
> the temptation is still there.

> [!NOTE]
> **The real photographs are off-palette.** They carry the sister brand's neon green (team shoes, a
> cushion, the signage swoosh) against Sculpted Ivory's warm ivory and sage. Real was judged to beat
> on-brand, but it is visible, and it is worth a line to the client.

### 2. Confirm the domain · **Brandklout**

`seo.json` sets the canonical origin to `https://www.stonesurgicalarts.com`. **That domain currently
points at the Stone Dental Implant Center Webflow site** (a custom domain on Webflow site
`6a07d5aac093f0e4521d29bc`). Detaching it and pointing it here is a decision, and it has to happen
before the canonical and the JSON-LD are true.

Legal pages: the footer links to the sister site's Privacy Policy, Terms and SMS Terms. Same legal
entity, so nothing is a dead link, but Surgical Arts needs its own copies in Instatic.

> [!NOTE]
> **The NAP question is closed, and the design board was right.** The archived Surgical Arts site
> publishes **(817) 918-3666**, **72 Andorra Dr #110**, **Mon–Fri 9–5 with Saturday by appointment**
> and **info@stonesurgicalarts.com** on every recovered page — exactly the board's footer mock. The
> first build used the *sister practice's* NAP only because the archive was unreachable. Markup,
> `seo.json` and the JSON-LD all carry the Surgical Arts values now. One loose end: the archived
> `/facial-surgery-southlake` page shows a third number, **(817) 646-8240**. Every other page says
> 918-3666, so that is what is used.

### 3. Decide the button label colour · **design call**

Documented in full at the top of `site-src/css/01-tokens.css`, and it is the one place this build
knowingly departs from the board.

Brand green `#8FBC46` is a light yellow-green. White text on it measures **2.22:1** — a fail at
every size, on the smallest type on the page. The board's button mock is exactly that combination.
This build puts **charcoal** on the green fill instead (6.72:1) and uses a darkened `--green-ink`
`#55731F` wherever green is used as text (4.95:1 on ivory).

The brand green is untouched as a fill, a rule, an icon and a display numeral. If the client wants
white-on-green anyway, that is `--btn-ink` — one line, whole site — but it should be a decision
someone makes, not something that happens by accident.

### 4. Real logo file, if one exists · **client**

The wordmark is set in markup (`.brand_component`), not shipped as an image, because that is what
the board specifies: STONE in wide-tracked Cormorant over a hairline, SURGICAL ARTS beneath. It also
means the client can edit it in Instatic, which they could not do with an SVG.

The practice's **existing** mark — the SSA monogram with the green swoosh, visible on the reception
signage — is the *old* identity that the board replaces. And the file on the client's Webflow CDN
named `SSA_Main Colored 3.avif` is **the Stone Dental Implant Center logo, not Surgical Arts**; it
is fetched under the honest name `_logo-sdic-sister-brand.avif` and is not used anywhere.

### 5. Favicon · **client**

Currently an inline SVG "S" on brand ivory, so the tab is never blank. Replace with the real mark.

### 6. Confirm the stock licence is live at launch · **Brandklout**

The stock images are **premium** Magnific/Freepik resources, downloaded against the `MAGNIFIC` key
in the repo-root `.env` — a key that belongs to the client. The licence therefore runs with their
subscription and **must still be active when the site goes live**. Per-asset licence URLs are on
each resource's page; ids, authors and licences are in `site-src/stock-manifest.json`. If the site
is ever handed to a third party, re-check the terms before the handover.

`.env` is gitignored and per-worktree, so a fresh worktree needs the `MAGNIFIC` line copied across
from `bk-dr-nahlah` before `get-stock.mjs` will run.

---

## Taking it into Instatic

> [!IMPORTANT]
> **The site is live on the client's Instatic instance.**
> <https://stone-surgical-arts-production.up.railway.app>
>
> It was last pushed at eighteen pages on 2026-08-31 — 18 pages converted with 0 auto-created
> classes and 0 warnings, one atomic PUT, `{"publishedPages":18}`, `verify-live.mjs` clean at 18
> routes. **That is now ahead of this repository by seventeen pages.** Re-running
> `05-instatic-upload/ship.sh` publishes the home page alone; decide deliberately whether the live
> site should lose the other seventeen at the same time, because the import is an atomic PUT of the
> whole tree and it will.
>
> The full pipeline, and the traps that had to be worked through, are in
> [`05-instatic-upload`](../../../05-instatic-upload/05-instatic-upload.md).

Two corrections from doing it, which still hold:

- **The style registry took the whole design system except the tokens.** `:root` custom properties
  cannot go in the registry at all — happy-dom drops `--*` declarations during conversion and the
  `var()` references then resolve to nothing. `00-fluid-root.css` and `01-tokens.css` ship as a code
  asset; everything else is registry rules the Styles panel can edit.
- **The `--cutover` demotion is needed.** The publish-time tree shake drops registry rules whose
  class never appears in `node.classIds`. Classes added at runtime by `site.js` — `is-open`,
  `is-solid`, `is-revealed`, `is-static`, and `js` on `<html>` — appear in no static markup and
  **will be purged** unless they are demoted to `kind: 'ambient'`. That is what `--cutover` does.
  Check it, or the nav will never go solid and the drawer will never open.

  *(`is-active` was on that list until 2026-09-01. It belonged to the price tabs, which went with
  the treatments hub.)*

**Push the CSS into the style registry, not as a code asset.**
[`15-instatic-api-sync`](../../../../../dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md)
documents why: a code asset is served as `userStyles.css`, which loads last, wins every tie, and is
invisible to the Styles panel — the site looks right and cannot be edited.
`migrate-css-to-registry.mjs --merge` then `--cutover` is the path.

**Origins.** When the domain is pointed at the Instatic app, run
`deliver/process/20-instatic-domain-origins/check-origins.mjs` before sending anyone the admin link.
Both `client.com` and `www.client.com` must be listed or the login page renders and then refuses the
login.

### Client-First, and why it matters here

The whole build is written in [Client-First](./site-src/css/10-client-first.css) — `page-wrapper` >
`main-wrapper` > `section_*` > `padding-global` > `container-large` > `padding-section-large`, with
`heading-style-h*`, `text-size-*`, `text-weight-*`, `button` + combo classes, and custom classes
named `[identifier]_[element]`.

Two payoffs. Presentation lives in classes, so Instatic's Styles panel has real chips to edit rather
than a wall of unnamed rules. And the vocabulary matches the Client-First style guide already on the
Brandklout Webflow account (site `6a2e515ca82829dfe4a72701`), so this site and the Webflow sites
speak the same language if anything ever moves between them.

**No bare tag styling anywhere.** `02-base.css` is a reset and nothing more. This is the failure
mode that damaged the Nahlah conversion — a pasted `img`, `h2` or `p` rule redefines that tag
site-wide. See [CF-MAPPING.md](../../../../../dr-nahlah/workflows/07-webflow-build/.tmp/CF-MAPPING.md).

---

## How the source is organised

```
site-src/
├── build-site.mjs      assembles final-site; fails loudly on an unresolved {{TOKEN}}
├── audit.mjs           link/image/a11y/SEO sweep; exit 1 on any failure
├── get-assets.mjs      re-fetches the client's images (assets/ is gitignored)
├── get-stock.mjs       pulls the stock images from Magnific; crops, resizes, attributes
├── stock-manifest.json what each stock slot is, its id, author and licence — COMMITTED
├── seo.json            title, description, OG and JSON-LD. ONE entry: index
├── partials/           head, navbar, drawer, cta, footer — one copy each
├── pages/home.body.html   MARKUP ONLY. No <style>, no <script>.
├── css/                one file per concern; FILENAME ORDER IS CASCADE ORDER
└── js/00-runtime.js    navbar, drawer, reveals
```

**The build still has a page table, and that is on purpose.** `PAGES` in `build-site.mjs` has one
row. It was not collapsed into a hardcoded single-page build, because the shape is what makes adding
a page one row plus a body plus an seo entry — and the odds that a page comes back are not small.

**The stylesheet numbering has gaps: 30 through 35, 37 and 40 are missing.** Those were the hero,
cards, editorial, pricing, membership, gallery, form and proof sheets, and every component in them
belonged to a deleted page. **Do not renumber to close the gaps.** Filename order is cascade order,
the numbers are load-bearing, and a gap costs nothing while a renumber risks everything. If a page
comes back, its stylesheet comes back at its old number.

**`css/50-journey.css` was cut from 72.8KB to 55.1KB** by removing 119 rule blocks whose selectors
named components no longer in any markup — `svc-head_*`, `svc-lede_*`, `svc-facts_*`,
`svc-reviews_*`, `spec_*`, `suits_*`, `cost_*`, `trust_*`, `proof-note_*`, `category-band_*`,
`hero_*` and the `section_*` wrappers of the hub. The cut was verified by screenshot diff at 390 and
1440: **byte-identical PNGs before and after.** That is the standard to hold anything like it to.

**The content the expansion was written from** lives in `01-content-intake/.tmp/archive-text/`:
`fetch-archive.mjs` and `refetch-stubs.mjs` recover the pages, `extract-treatments.mjs` turns the 28
treatment pages into `pages/treatments.json`. Re-run those three and the whole source corpus
rebuilds from the Wayback Machine. **This is intentionally still here** — it is the raw intake, not
page context, and it is what any recovered page would be written from again.

`home.body.html` opens with a comment saying what the page is for, which of Sang's lines it answers,
and where anything unverified came from. Read it before editing.

### The one JS-related trap

Scroll reveals start at `opacity: 0`, scoped to `.js` on `<html>`. That class is set by an inline
script in the head, which also starts a 2.5-second timer: if `site.js` has not booted by then the
class comes off and the whole page paints, unanimated. Without that timer, a blocked bundle would
leave half the site invisible. Keep both halves — the inline script in `partials/head.html` and
`window.__ssaBooted = true` in `js/00-runtime.js`.

### A CSS bug worth remembering

`38-cta.css` and the deleted `30-hero.css` once said `url("assets/texture-stone.jpg")`. `site.css`
is served FROM `assets/`, so a relative `url()` in it resolves against `assets/` and the browser was
asking for `assets/assets/…`. The closing CTA band and every inner-page hero were flat ivory for the
whole first build, when they were designed to sit on stone. `audit.mjs` resolved CSS `url()` against
the site root, so it could never have caught it; it now resolves against the stylesheet, and strips
comments first.

## What was verified, and what was not

**Verified.** `audit.mjs` FAIL none, WARN none. `check-copy.mjs` clean. `journey-test.mjs` 47/47 —
including the pinned chapter's travel, the counters landing on their published values, every
keyboard stop painting a focus ring, and reduced motion producing zero pins. `all-pages.mjs` clean
at 390/1024/1440: no sideways scroll, no clipped control, clean console, no off-origin request, both
typefaces loaded. `check-standalone.mjs` 7/7 on the packed preview.

**Not verified.** Nothing has been re-rendered in Instatic since the cut. No real-device testing, no
screen-reader pass, no Lighthouse run. Everything under "Before this goes live" is by definition
unverified: it needs the client.

> [!TIP]
> **Headless Chrome clamps the layout viewport to 500px.** `--window-size=390,N` lays the page out
> at 500 CSS px and then crops the screenshot to 390, which looks exactly like a horizontal-overflow
> bug and is not one. To measure a real 390px viewport, load the page in a 390px-wide `<iframe>`
> from a page on the **same origin** (a `file://` wrapper around an `http://` iframe is cross-origin
> and `contentDocument` comes back null) and read `documentElement.scrollWidth`. `preview.html`
> already does the visual half of this.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
`site-src/assets/` and `final-site/assets/` hold images and are gitignored by the repo's
binary-asset rules — `node site-src/get-assets.mjs` repopulates them from the client's own CDN.
