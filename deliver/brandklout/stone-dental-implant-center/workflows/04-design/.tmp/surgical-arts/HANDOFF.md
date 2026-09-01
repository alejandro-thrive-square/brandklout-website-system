# Stone Surgical Arts — handoff

Seven pages, built locally, ready to go into Instatic. Written 2026-08-30, **content expansion
2026-08-31**.

> [!IMPORTANT]
> **What changed on 2026-08-31.** The Wayback block lifted, so the practice's own retired site was
> recovered as text — 49 pages, of which 28 are treatment pages, about 26,000 words and 60 of its
> own FAQ pairs. The seven pages were then expanded against it. **No page was redesigned**; the
> design system is untouched and one stylesheet was added (`css/40-proof.css`) for the new blocks.
>
> | | |
> | :--- | :--- |
> | New sections | 12 — proof row, testimonials ×2, press ×2, home FAQ, service area, four treatment category bands, treatments comparison FAQ, training timeline, personal band, sedation prep, recovery |
> | Rewritten | NAP everywhere (see below), Brooke's bio, the MyEllevate longevity answer, financing providers |
> | Imagery | 18 images: 4 searched, 14 generated with Magnific Mystic. Rooms, objects, instruments and materials, never a face. Re-bound 2026-08-31 so each depicts what its section says |
> | Structured data | `FAQPage` on treatments, `aggregateRating` 4.8/142, 20-city `areaServed` |
> | Audit | `node site-src/audit.mjs` — **FAIL none, WARN none**; no horizontal overflow at 390px on any page |
>
> **Three of the ten launch blockers below are now closed or reduced** — items 4 (NAP), and parts
> of 3 (team credentials) and 6 (reviews). They are marked inline.

> [!IMPORTANT]
> **HOME PAGE REBUILT 2026-08-31 (v2, the journey).** Brandklout's team reviewed the first build and
> called the design *"very ugly and simple"*, with drnahlah.com set as the quality bar. The home page
> is now eleven editorial chapters on three grounds, with pinned horizontal travel and a stone-textured
> material system. **Read [`style-direction-v2.md`](../style-direction-v2.md) first** — it carries the
> diagnosis, what was and was not borrowed from Nahlah, and why each image exists.
>
> | | |
> | :--- | :--- |
> | Changed | `pages/home.body.html` (rewritten), `css/50-journey.css` (new), `js/10-journey.js` (new), `js/vendor/` (GSAP, new) |
> | v1 | kept verbatim at `pages/_home-v1.body.html`, not built, there to diff against |
> | Content | **nothing invented.** Every figure, quote, credential, fee, town and press item is the same sourced string v1 carried |
> | Tokens | `01-tokens.css` **untouched**. Palette and typefaces are the client's board, exactly as briefed |
> | Other 17 pages | markup unchanged; they gain the CTA texture fix below and nothing else |
> | New gate | `node journey-test.mjs` — **47/47** |
> | **For review** | https://claude.ai/code/artifact/8b745715-0d68-4bbc-af0c-d2214396b0b6 |
> 
> The review link is the real page packed into one self-contained file: stylesheet, GSAP and
> every image inlined, so it scrolls on a phone with no server and without pushing an
> unapproved design over the client's live Instatic site. Links to the other seventeen pages
> are inert and say so when clicked. Rebuild it with `node site-src/make-preview.mjs` after any
> change; the output is gitignored because it is 1.6MB of base64 and regenerates in a second.
>
> **A bug this surfaced, fixed, and worth knowing about.** `38-cta.css` and `30-hero.css` said
> `url("assets/texture-stone.jpg")`. `site.css` is served FROM `assets/`, so a relative `url()` in it
> resolves against `assets/` and the browser was asking for `assets/assets/…`. **The closing CTA band
> and every inner-page hero have been flat ivory on all eighteen pages since the first build**, when
> they were designed to sit on stone. `audit.mjs` resolved CSS `url()` against the site root, so it
> could never have caught it; it now resolves against the stylesheet, and strips comments first.
>
> **A second one, also on all eighteen pages.** The navbar overflowed from 992 to about 1150:
> everything in it is `nowrap`, the actions group is `flex: 0 0 auto`, and the burger did not arrive
> until 991, so "Book a consultation" was clipped at the viewport edge on any small laptop. Gaps
> tighten at 1279 and the phone number drops at 1199. `journey-test.mjs` now asserts that no visible
> control sits past the right edge, which is the check that catches it.

| | |
| :--- | :--- |
| **Source** | [`site-src/`](./site-src/) — edit here |
| **Output** | [`final-site/`](./final-site/) — generated, never hand-edit |
| **Build** | `cd site-src && node build-site.mjs` |
| **Check** | `cd site-src && node audit.mjs` — links, images, a11y, SEO. Exits non-zero on any failure |
| **Copy gate** | `cd site-src && node check-copy.mjs` — **no em dashes in copy** ([SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md)). Runs on the BUILT output |
| **Motion gate** | `cd site-src && node journey-test.mjs` — 47 headless checks on the home page's chapters: overflow at six widths, that the pin really travels, and that reduced motion produces zero pins |
| **Screenshot** | `node site-src/shot.mjs "$PWD/final-site" index.html out.png 1440` |
| **All pages** | `cd site-src && node all-pages.mjs` — 216 assertions across all 18 pages at 390/1024/1440: no sideways scroll, no clipped control, clean console, no off-origin request, both typefaces loaded. **Run this after touching anything in `css/` that is not `50-journey.css`** |
| **Weight** | `cd site-src && node weight.mjs` — transferred bytes, LCP, and per-image over-delivery against the painted size at 2x |
| **Perf** | `cd site-src && node perf.mjs` — drives the scroll through CDP at 4x CPU throttle and reports dropped frames and long tasks per zone. An unthrottled desktop is always smooth, which is why janky sites ship |
| **Pin review** | `node site-src/pin-shot.mjs "$PWD/final-site" <outdir> 1440 800 laptop` — the pinned chapter at the start, middle and end of its travel. A full-page screenshot cannot show it |
| **Measure** | `cd site-src && node measure.mjs` — per screen size: which chapters exceed the viewport, whether every reveal fired, what the gutter and content width resolve to |
| **Fonts** | `cd site-src && node get-fonts.mjs` — **REQUIRED ON A FRESH CLONE.** The `.woff2` files are gitignored like every other binary, so `assets/fonts/` is empty until this is run and the site silently falls back to Georgia and Arial. `css/03-fonts.css` and the generator ARE committed. Self-hosted, latin subset; **there is no request to fonts.googleapis.com any more** and `journey-test.mjs` asserts there is none |
| **Imagery** | `node site-src/get-stock.mjs` (4 searched) · `node site-src/generate-images.mjs` (14 generated) |
| **Live** | <https://stone-surgical-arts-production.up.railway.app> — see [`05-instatic-upload`](../../../05-instatic-upload/05-instatic-upload.md) |
| **Preview** | `node ../../../01-content-intake/.tmp/serve.mjs . 8792` then open `http://localhost:8792/preview.html` |
| **Asana** | [Give Jess the core pages for Aesthetic - Stone](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1217846850268874) |
| **Design** | "Stone Surgical Arts Website Redesign — 01 Sculpted Ivory", attached to that task |
| **Content sources** | [`01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md`](../../../01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md) — every fact, and where it came from |

## The eighteen pages

Six core pages, plus twelve treatment pages.

| Page | File | Sang's line |
| :--- | :--- | :--- |
| Home | `index.html` | positions the practice, routes to the four categories |
| Treatments Overview | `treatments.html` | all four categories with prices; the main SEO entry point |
| Memberships | `memberships.html` | three tiers on a banked-credit model |
| Results | `results.html` | filterable before/after gallery plus reviews |
| About | `about.html` | Dr. Stone, clinical oversight, team, location |
| Book a consultation | `book.html` | request form, hours, pre-visit instructions, financing FAQ |

### The twelve treatment pages

Sang asked for "the treatment detail template; [the other categories] reuse it exactly." Until
2026-08-31 that was ONE page, `treatment-detail.html`, about MyEllevate, linked from ONE fee row.
Every other treatment was a line of text with a price. It is now twelve pages, and **15 fee rows
link to their own page**.

| Category | Pages |
| :--- | :--- |
| Face | `face-and-neck-lift` / `brow-lift` / `blepharoplasty` / `cheek-and-chin-implants` / `buccal-fat-reduction` / `lip-lift` |
| Neck & Jawline | `neck-lift` / `myellevate-neck-lift` *(was `treatment-detail`)* / `jawline-implant` |
| Skin | `laser-resurfacing` / `morpheus8` |
| Non-Surgical | `injectables` |

**Twelve and not thirty.** The hub lists about thirty line items; these twelve are the ones people
search for by name. Anaesthesia by the quarter hour, a second lesion and "package of 3" are line
items on a bill, not destinations, and a page each would be a hundred words of filler. Everything
not listed stays a row on the hub, which keeps its full fee table.

> [!IMPORTANT]
> **These pages are a COLLECTION, not twelve hand-written files.** `site-src/treatments-data.mjs`
> holds the content, `site-src/render-treatments.mjs` emits `pages/<slug>.body.html`, and
> `build-site.mjs` derives its page table from the same data. Adding a treatment is one edit. This
> is deliberately the shape the Instatic migration needs: one page template bound to a treatments
> collection, with the fact panel's five rows as the collection's fields. Edit the DATA, then
> re-render. Editing a generated `.body.html` is lost on the next run.

> [!WARNING]
> **CLINICAL REVIEW IS OUTSTANDING ON ALL TWELVE.** The procedure descriptions are standard,
> textbook accounts. They are not Dr. Stone's protocol. Every "at a glance" row (anaesthesia, time
> off work, when results settle) and every recovery figure is a conventional range and must be
> confirmed or corrected before launch. `reviewNote` on each entry says what specifically to check.
> **Fees are the practice's own**, carried across from the hub's tables, and were not invented.

---

## Before this goes live — ten things

Ordered by what blocks what. Ten items; the first four need someone other than us. Item 4 was
closed on 2026-08-31 and parts of 3 and 6 were reduced — see the inline notes.

### 1. Confirm every fee · **client**

Every price on `treatments.html` and in the `treatment-detail.html` fact panel came off the archived
`stonesurgicalarts.com/patient-resources/pricing` page. **They are two brand generations old.** The
page carries a visible "fees are being confirmed for 2026" notice so nothing misleads a patient
today, but the notice is a holding position, not a launch state.

One figure to query specifically: the archive lists **Chemical Peel $150** and **Chemical Peel
(full face) $3,500**. A 23× gap between the two suggests a data-entry error, or that the second is a
deep phenol peel that should be named differently. Both are on the page as published.

### 2. Confirm or replace the membership tiers · **client**

`memberships.html` carries three tiers — Maintain $125, Refine $250, Sculpt $500 — on the
banked-credit mechanic Sang specified. **The names, amounts and perks are ours, not the client's.**
The practice already runs a membership programme (it is a pinned Instagram highlight) but its terms
are published nowhere public. **This was re-checked against the full archive on 2026-08-31 and there
is genuinely nothing there** — the recovered URL index has no membership page at all, so this is a
real gap in the source material rather than something the earlier Wayback block was hiding. The
page says "draft tiers — for review, not for publishing" in a notice at the top.

The tiers are calibrated against the practice's own published prices, so the worked example on the
page holds up. Swap the numbers and the layout does not change.

### 3. Photography · **Gabby, expected Monday**

- **Home hero** — the board's hero is a studio portrait. It currently uses the real practice
  reception (`assets/office-exterior.webp`), which is honest but not the intended shot.
- **Results gallery** — carries six **labelled placeholders** so the filter and the before/after slider can be reviewed. See the warning below; it must not go live in that state.
- **Team portraits** — **Brooke's is DONE** as of 2026-08-31: the client's Drive export supplied a
  real photograph of her (`img/staff/brooke.jpg`), and her placeholder is gone. **Abby's remains**,
  and it is not an oversight: the export's staff folder holds alexis, breanna, brooke, jennifer, lv,
  diana and lellie, and **no Abby**. Nothing may stand in for her. Both surnames are still needed.
  Brooke's credentials came from the archive (board-certified FNP, advanced aesthetic injector,
  dermatology background, NICU before her master's, 6+ years injecting, has trained other injectors).

#### What arrived in the client's Drive export, 2026-08-31

`01-content-intake/.tmp/google-drive-images`, 187 images. It is the sister site's whole asset tree,
not a fresh shoot, and it splits three ways.

| | |
| :--- | :--- |
| **Imported, 6** | The genuinely real, genuinely Stone material: SSA signage, a treatment room with the actual laser platform, the front desk, the team photograph, a consult room, Brooke's portrait. Recorded in `site-src/client-manifest.json`. These displaced three generated images; two of those were deleted outright. |
| **Not imported, ~40** | A **stock model library** filed under treatment names. `cosmetic-facial-surgery/blepharoplasty.jpg` is a stock model, not a blepharoplasty patient. |
| **Not imported, 10** | `img/before-after/` — **real, identifiable patients.** See the consent warning below. |

> [!IMPORTANT]
> **A stock model face is the same problem as a generated one.** The rule that keeps faces out of
> `generate-images.mjs` is that a face beside a treatment name reads as that treatment's RESULT.
> Buying the face from a library rather than a diffusion model does not change what the reader
> concludes. None of the forty model portraits went onto a treatment page. If the practice wants
> that lifestyle look, it is a decision to take deliberately, on category and lifestyle surfaces.

> [!NOTE]
> **The real photographs are off-palette.** They carry the sister brand's neon green (team shoes, a
> cushion, the signage swoosh) against Sculpted Ivory's warm ivory and sage. Real was judged to beat
> on-brand, but it is visible, and it is worth a line to the client.

**Low-resolution sources: upscale, do not substitute.** Brooke's original is 597x615, the smallest
real asset on the site. It was enlarged to 800x1000 with the Freepik upscaler at creativity 0
(`site-src/upscale-client-images.mjs`), not swapped for a better-lit stranger: a similar-looking
person is not Brooke. The raw upscale and a side-by-side are kept at `assets/_upscaled/` and
`assets/_brooke-compare.png`. Files beginning `_` are build-time aids and are not copied to the site.

- **Eighteen stand-in images are in place, and every one is deliberately faceless.** Four searched
  from the Magnific library (`site-src/get-stock.mjs`, `stock-manifest.json`) and fourteen generated with
  Magnific Mystic to the Sculpted Ivory palette (`site-src/generate-images.mjs`,
  `generated-manifest.json`, prompts and negative prompts recorded per slot). Rooms, objects,
  materials and architectural details only. Replace them with the practice's own photography as it
  lands; the generated set exists so the pages read as designed in the meantime, not to stay.

- **Every image is bound to what its section says, and it was not always.** The first pass chose
  for palette and produced a beautiful set that illustrated nothing: folded spa towels beside the
  eight-hour fasting rules, a massage bed beside "implants are planned to the bone", an abstract
  stone form beside the platysma. Re-shot 2026-08-31 against the copy. If you replace one, match
  the SUBJECT first and the palette second; `generate-images.mjs` names the copy each slot answers.

> [!WARNING]
> **The Results gallery now shows six LABELLED PLACEHOLDER cases, and it must not go live that way.**
>
> They exist so the client can review the gallery, the treatment filter and the before/after slider
> before the practice's photography arrives. Hatched panels, the word PLACEHOLDER on both halves and
> in every card's meta line, and a notice above the gallery. Nothing depicts a patient and nothing
> claims an outcome. Replacing one with a real case is swapping the two `.compare_layer > div`
> panels for `<img>` and deleting `is-placeholder`; delete any card with no real case behind it.
>
> **Two image slots were left empty on purpose, and generating them would be a misrepresentation.**
>
> - **Brooke's and Abby's portraits.** They are real, named people. An AI likeness standing in for a
>   named individual fabricates that person, and no alt text fixes it.
> - **The before/after gallery.** A generated or stock "case" on a surgical practice's Results page
>   is a fabricated clinical outcome. It is the single claim a prospective patient relies on most.
>
> Both need real photography with current written consent. Everything around them is built and
> waiting: the gallery, the filter, the before/after wipe and the team cards all work the moment
> real files exist. See §3 above and `results.body.html`.

> [!WARNING]
> **Do not recover the old before/after photographs from the archive, and do not publish the ten in
> the client's Drive export either.** The retired site published 33 cases of identifiable patients
> who consented to a website that no longer exists, under a brand that has been retired. Consent
> does not travel to a new site. `img/before-after/` in the 2026-08-31 Drive export is the same
> class of material, including full-face smiling shots, and it was deliberately NOT imported.
>
> **One file in it is a trap.** `img/before-after/image1.jpg` is captioned *"3 weeks post
> MyEllevate ... Courtesy of G. Mueller MD"*. It is the DEVICE MANUFACTURER'S marketing image of
> ANOTHER SURGEON'S patient. Publishing it as a Stone result would be a fabricated outcome whatever
> the consent position. Several others are too small to use anyway (384x327, 498x911). The gallery, the filter and the
> before/after wipe are all built and working; cases drop in as `.case-card_component` blocks and
> the file carries a complete worked example in a comment. Publish only cases the practice supplies
> with current written consent.

### 4. ~~Confirm the NAP~~ · **CLOSED 2026-08-31** — and confirm the domain · **Brandklout**

- **The NAP question is answered, and the design board was right.** The archived Surgical Arts site
  publishes **(817) 918-3666**, **72 Andorra Dr #110**, **Mon–Fri 9–5 with Saturday by
  appointment** and **info@stonesurgicalarts.com** on every recovered page — exactly the board's
  footer mock. The first build used the *sister practice's* NAP only because the archive was
  unreachable. Markup, `seo.json` and the JSON-LD now all carry the Surgical Arts values.
  One loose end, worth a single question: the archived `/facial-surgery-southlake` page shows a
  third number, **(817) 646-8240**. Every other page says 918-3666, so that is what is used.
- `seo.json` sets the canonical origin to `https://www.stonesurgicalarts.com`. **That domain
  currently points at the Stone Dental Implant Center Webflow site** (it is a custom domain on
  Webflow site `6a07d5aac093f0e4521d29bc`). Detaching it and pointing it here is a decision, and it
  has to happen before the canonicals and the JSON-LD are true.
- Legal pages: the footer links to the sister site's Privacy Policy, Terms and SMS Terms. Same legal
  entity, so nothing is a dead link, but Surgical Arts needs its own copies in Instatic.

### 5. Wire the form · **Instatic setup**

`book.html` has a complete consultation form that **posts nowhere**. It is inert on purpose — better
than sending a patient's details into a void. Point it at GHL or Instatic's form handler.

The page also links straight to **Modento** (`book.modento.io/stonesurgicalarts/patient-details`),
which is how the practice already takes bookings, so there is a working path either way.

### 6. Drop in the reviews embed · **Instatic setup** — no longer urgent

`results.html` still reserves a slot for a Google reviews widget. The sister site runs **Elfsight** —
apps `7b3bee65-edf4-4c1d-8120-d7b999aed1ab` and `c92f78df-0615-4ab9-a204-4f7b385011c9`. The toolkit
for wiring embeds into Instatic is [`deliver/process/18-instatic-embeds`](../../../../../../process/18-instatic-embeds).

**The page is no longer empty while you wait.** Eight real reviews are on `results.html` and six on
`index.html`, all published by the practice itself with the patient's name and recovered verbatim
from the archive, plus the 4.8/142+ rating it published in its own footer (now also an
`aggregateRating` in the JSON-LD).

> [!NOTE]
> **When the widget goes in, put it ABOVE the quote grid — do not replace it.** The archive holds
> ~35 reviews and most are *oral surgery* (wisdom teeth, jaw cysts, trauma). The eight on the site
> are the cosmetic ones, hand-picked. An unfiltered live feed is less useful to a cosmetic patient
> than that curated set, so the right answer is both.
>
> One question for Brandklout: these were published under a brand that has been retired, on a site
> that no longer exists. The names are already public and the legal entity is unchanged, so this is
> a far lighter question than the before/after photographs — but it is still worth asking.

### 7. Decide the button label colour · **design call**

Documented in full at the top of `site-src/css/01-tokens.css`, and it is the one place this build
knowingly departs from the board.

Brand green `#8FBC46` is a light yellow-green. White text on it measures **2.22:1** — a fail at
every size, on the smallest type on the page. The board's button mock is exactly that combination.
This build puts **charcoal** on the green fill instead (6.72:1) and uses a darkened `--green-ink`
`#55731F` wherever green is used as text (4.95:1 on ivory).

The brand green is untouched as a fill, a rule, an icon and a display numeral. If the client wants
white-on-green anyway, that is `--btn-ink` — one line, whole site — but it should be a decision
someone makes, not something that happens by accident.

### 8. Real logo file, if one exists · **client**

The wordmark is set in markup (`.brand_component`), not shipped as an image, because that is what
the board specifies: STONE in wide-tracked Cormorant over a hairline, SURGICAL ARTS beneath. It also
means the client can edit it in Instatic, which they could not do with an SVG.

Note the practice's **existing** mark — the SSA monogram with the green swoosh, visible on the
reception sign in `assets/office-exterior.webp` — is the *old* identity that the board replaces.

Also: the file on the client's Webflow CDN named `SSA_Main Colored 3.avif` is **the Stone Dental
Implant Center logo, not Surgical Arts**. It is fetched under the honest name
`_logo-sdic-sister-brand.avif` and is not used anywhere.

### 9. Favicon · **client**

Currently an inline SVG "S" on brand ivory, so the tab is never blank. Replace with the real mark.

### 10. Confirm the stock licence is live at launch · **Brandklout**

All eight stock images are **premium** Magnific/Freepik resources, downloaded against the
`MAGNIFIC` key in the repo-root `.env` — a key that belongs to the client. The licence therefore
runs with their subscription and **must still be active when the site goes live**. Per-asset
licence URLs are on each resource's page; ids, authors and licences are in
`site-src/stock-manifest.json`. If the site is ever handed to a third party, re-check the terms
before the handover.

`.env` is gitignored and per-worktree, so a fresh worktree needs the `MAGNIFIC` line copied across
from `bk-dr-nahlah` before `get-stock.mjs` will run.

---

## Taking it into Instatic — DONE, 2026-08-31

> [!NOTE]
> **Re-imported the same day at eighteen pages.** 9 new media uploads (30 in the library), 18 pages
> converted with 0 auto-created classes and 0 warnings, one atomic PUT (`seq: 10`),
> `{"publishedPages":18}`, and `verify-live.mjs` clean at 18 routes with 18 distinct titles.
> `/treatment-detail` 404s as intended. Needed `--force`; see trap 11.

> [!IMPORTANT]
> **The site is live on the client's Instatic instance.**
> <https://stone-surgical-arts-production.up.railway.app>
>
> Seven pages, 2,689 nodes, 509 style rules, 13 images — imported with Instatic's own converters
> and verified end to end (`05-instatic-upload/verify-live.mjs`: 7 routes, 28 URLs, 44 assets,
> FAIL none). The full pipeline, and the ten traps that had to be worked through to get there, are
> in [`05-instatic-upload`](../../../05-instatic-upload/05-instatic-upload.md).
>
> The section below is the ORIGINAL plan, kept because its reasoning about the two CSS layers and
> the tree shake is exactly what the import had to satisfy. Two corrections from doing it:
>
> - **The style registry took the whole design system except the tokens.** `:root` custom
>   properties cannot go in the registry at all — happy-dom drops `--*` declarations during
>   conversion and the `var()` references then resolve to nothing. `00-fluid-root.css` and
>   `01-tokens.css` ship as a code asset; everything else is registry rules the Styles panel can
>   edit. That is a narrower use of the code-asset layer than this workflow warns against, and a
>   necessary one.
> - **The `--cutover` demotion was needed, exactly as predicted here.** 72 class rules the markup
>   never carries — `is-solid`, `is-open`, `is-active`, `is-revealed`, `js` among them — were
>   demoted to `ambient`, which is what kept the six `.navbar_component:not(.is-solid)` rules alive
>   through the publish.

### The original plan

The output is deliberately shaped the way [`15-instatic-api-sync`](../../../../../dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md)
expects — one stylesheet, one script, plain markup:

```
final-site/
├── assets/site.css     one bundle, cascade order = filename order
├── assets/site.js      one bundle, no dependencies, no build step
├── assets/*.{avif,webp,jpg}
└── *.html              seven pages, self-contained markup
```

**Push the CSS into the style registry, not as a code asset.** `15-instatic-api-sync` documents why:
a code asset is served as `userStyles.css`, which loads last, wins every tie, and is invisible to
the Styles panel — the site looks right and cannot be edited. `migrate-css-to-registry.mjs --merge`
then `--cutover` is the path.

Two Instatic behaviours this build is already written for:

- **The publish-time tree shake** drops registry rules whose class never appears in `node.classIds`.
  Classes added at runtime by `site.js` — `is-open`, `is-solid`, `is-active`, `is-revealed`,
  `is-static`, and `js` on `<html>` — appear in no static markup and **will be purged** unless they
  are demoted to `kind: 'ambient'`. That is what `--cutover` does. Check it, or the nav will never
  go solid and the drawer will never open.
- **Origins.** When the domain is pointed at the Instatic app, run
  `deliver/process/20-instatic-domain-origins/check-origins.mjs` before sending anyone the admin
  link. Both `client.com` and `www.client.com` must be listed or the login page renders and then
  refuses the login.

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
├── get-stock.mjs       pulls the 8 stock images from Magnific; crops, resizes, attributes
├── stock-manifest.json what each stock slot is, its id, author and licence — COMMITTED
├── add-faq-schema.py   regenerates the FAQPage node in seo.json from one source
├── seo.json            title, description, OG and JSON-LD per page
├── partials/           head, navbar, drawer, cta, footer — one copy each
├── pages/*.body.html   MARKUP ONLY. No <style>, no <script>.
├── css/                one file per concern; FILENAME ORDER IS CASCADE ORDER
└── js/00-runtime.js    navbar, drawer, tabs, filter, before/after wipe, reveals
```

**`css/40-proof.css` sorts after `39-motion.css`, and that is deliberate.** Motion was written to
be last, but every rule in it is scoped to `.js [data-reveal]` — an attribute selector on a
wrapper — and nothing in 40 touches opacity or transform on those wrappers. No reveal is
overridden and no layout rule is. The reasoning is at the top of the file; read it before
renumbering anything.

**The content the expansion was written from** lives in
`01-content-intake/.tmp/archive-text/`: `fetch-archive.mjs` and `refetch-stubs.mjs` recover the
pages, `extract-treatments.mjs` turns the 28 treatment pages into `pages/treatments.json`. Re-run
those three and the whole source corpus rebuilds from the Wayback Machine.

Every page body opens with a comment saying what the page is for, which of Sang's lines it answers,
and where anything unverified came from. Read those before editing.

### The one JS-related trap

Scroll reveals start at `opacity: 0`, scoped to `.js` on `<html>`. That class is set by an inline
script in the head, which also starts a 2.5-second timer: if `site.js` has not booted by then the
class comes off and the whole page paints, unanimated. Without that timer, a blocked bundle would
leave half the site invisible. Keep both halves — the inline script in `partials/head.html` and
`window.__ssaBooted = true` in `js/00-runtime.js`.

## What was verified, and what was not

**Verified.** `node audit.mjs` passes clean on all seven pages: no broken links, no missing images
or CSS `url()`s, every `aria-controls` and in-page anchor resolves, one `<h1>` per page, every form
control labelled, all JSON-LD parses, no inline styles, titles and descriptions inside SEO limits.
Rendered and read at 390 / 768 / 1280 in Chrome (2026-08-30): navbar, drawer, dropdown, price tabs,
the deep link `treatments.html#neck`, the gallery filter and its empty state, the FAQ disclosures
and the booking form. No console errors.

Re-verified after the 2026-08-31 expansion, in headless Chrome: every page's markup is
tag-balanced; every class in the markup resolves to a rule in `site.css` (only the `section_*`
identifiers are unstyled, which is this build's convention); and `scrollWidth === clientWidth` on
all seven pages at a true 390px viewport, so nothing overflows horizontally. The new blocks were
read at desktop and mobile widths.

**Not verified.** Nothing has been rendered in Instatic. No real-device testing, no screen-reader
pass, and no Lighthouse run. Everything under "Before this goes live" is by definition unverified:
it needs the client.

> [!TIP]
> **Headless Chrome clamps the layout viewport to 500px.** `--window-size=390,N` lays the page out
> at 500 CSS px and then crops the screenshot to 390, which looks exactly like a horizontal-overflow
> bug and is not one. To measure a real 390px viewport, load the page in a 390px-wide `<iframe>`
> from a page on the **same origin** (a `file://` wrapper around an `http://` iframe is cross-origin
> and `contentDocument` comes back null) and read `documentElement.scrollWidth`. `preview.html`
> already does the visual half of this.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
`site-src/assets/` and `final-site/assets/` hold images and are gitignored by the repo's binary-asset
rules — `node site-src/get-assets.mjs` repopulates them from the client's own CDN.
