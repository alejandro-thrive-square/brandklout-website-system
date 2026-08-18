# v2 rebuild — client-first / Relume rebuild of the 6 Grand Mission ads landing pages

Task source: user /loop directive 2026-08-18. Site: Grand Mission Dentistry
`698111847e9608eb30ee21c6` · staging https://grandmissiondentistry.webflow.io
Folder: **Ads Landing Pages** `6a7f60323b62b4b8c03fb499` (all six live pages sit inside it,
so their public path is `/ads-landing-pages/<slug>`).
Reference kit: Kit Foundation V1 `6a7a804cfed7e6e46272c6b0` (READ-ONLY — analyze, never modify).
Client-first reference build: Mason Park Dental v2 (`bk-mason-park` worktree,
`07-webflow-build/.tmp/v2/`) — the same task, already completed. Its PLAN / BUILD-POLICY /
QA-REPORT are the playbook; this plan is the Grand Mission instance of it.

## Target pages (existing → new v2 page)

| live page (the spec) | page id | v2 page to create | slug |
| :--- | :--- | :--- | :--- |
| Cosmetic Dentist | `6a723ad5534774f35f17d119` | Cosmetic Dentist v2 | `cosmetic-v2` |
| Cosmetic Consultation | `6a7f28ebb879883a87ba3fc8` | Cosmetic Consultation v2 | `cosmetic-consultation-v2` |
| Cosmetic Thank you | `6a7268a862a728c1cd4df73b` | Cosmetic Thank you v2 | `cosmetic-thank-you-v2` |
| Dental Implants | `6a724b6977f9b0019d2a03f8` | Dental Implants v2 | `dental-implants-v2` |
| Dental Implant Consultation | `6a7f297530c987406bc2100d` | Dental Implant Consultation v2 | `dental-implants-consultation-v2` |
| Dental Implants Thank You | `6a7a539d70073de244bf67a9` | Dental Implants Thank You v2 | `dental-implants-thank-you-v2` |

SEO titles to carry over verbatim (read from `get_page_metadata`, 2026-08-18):

| slug | SEO title |
| :--- | :--- |
| cosmetic | Cosmetic Dentist in Richmond, TX \| Grand Mission Dentistry |
| cosmetic-consultation | Cosmetic Consultation |
| cosmetic-thank-you | Thank you — your request is in \| Grand Mission Dentistry |
| dental-implants | Dental Implants in Richmond, TX \| Grand Mission Dentistry |
| dental-implants-consultation | Dental Implant Consultation |
| dental-implants-thank-you | Thank you — your implant request is in \| Grand Mission Dentistry |

## THE SPEC IS THE LIVE PAGE — there is no local HTML package for these six

Checked before planning (do not re-derive):

- `04-design/.tmp/{implant,cosmetic,thank-you}-landing-page/` is the **awwwards journey
  redesign** — different copy, GSAP pinned chapters, `gm-*` classes. NOT the source of these six.
- `docs/grand-mission-campaigns/` is the **new campaign package** (five campaigns ×
  landing/consult/thank-you), already rebuilt natively into the same folder as
  `new-dental-implants*` / `emergency-dentistry` (see `campaign-rebuild/PLAN.md`). Also not it.
- `01-content-intake/.tmp/originals/gmd-{cosmetic,implant}-lp.html` are the client's
  PRE-redesign pages ("Your Trusted Destination for…", "$3,499"). Not it either.
- Nothing in this repo or the sibling worktrees contains `imp-header-1`, `csm-ba__foot`,
  `landing-hero-h1` or `ty-hero__h1` — the classes these six pages are built from. They are a
  **Livewell Dental template** rebranded for Grand Mission: the same lineage Mason Park's six
  pages came from (`bk-livewell/.../04-design/.tmp/final-design/livewell-thank-you.html`
  carries the identical "Let's talk about…" hero).

So "the pages on Webflow need to be equal to the local version" is satisfied by capturing the
live pages LOCALLY first and building against that capture — exactly what Mason Park did for
the four of its six pages that also had no local design file. The capture set in
`08-qa/.tmp/v2-reference/<slug>/` **is** the local version.

## Rules (from the user, binding)

- NEW blank pages named "<Original Title> v2"; the originals are never written to.
- Client-first naming (finsweet.com/client-first) + Relume conventions as used by Kit
  Foundation V1 and by mason-park-dental.webflow.io/new-patient-special*.
- Reusable classes; variables for the token layer.
- **NO Webflow Components are to be CREATED in this pass** — the user's reference note says
  "don't build webflow components yet". Sections are built from shared classes and shaped so
  they can be componentized later without restructuring. The one exception is *instancing* the
  site's existing **Global Styles** component, which the Relume kit's spacing/hide system
  requires as the first child of `page-wrapper`; instancing is not creating.
- NO custom-code elements (HtmlEmbed) and NO page-settings custom code. The site-level head/
  footer code already installed predates this task — leave it, add nothing.
- Responsive parity with the reference at Webflow's canonical breakpoints.
- All assets uploaded/mapped; reuse existing site assets by id, never re-upload duplicates.
- Double-check grids — known weak spot; read every grid style back at every breakpoint.
- Verify on staging before calling any page done.

## Site state (measured 2026-08-18, do not re-derive)

- **2,959 styles** (1,712 global + 1,247 combo). The **Relume Client-First v3 kit is already
  installed and themed**: `page-wrapper`, `main-wrapper`, `container-large/medium/small`,
  `padding-global`, `padding-section-large/medium/small`, `heading-style-h1..h6`,
  `text-size-*`, `text-color-*`, `background-color-*`, `button`, `form_component` /
  `form_form` / `form_input` / `form_checkbox` / `form_radio`, the full `margin-*` / `padding-*`
  spacing pairs, `max-width-*`, `hide-*`. Reuse these before creating anything.
- **Variables exist in all four Relume collections** (unlike Mason Park, which had them
  stripped):
  - Primitives `collection-0220e3ad-eb86-03ea-3026-8a5979301dd2` — 40 vars: neutrals, the
    White / Neutral-Darkest opacity ladders, and `brand/*`: light `#fcfcfc`, bleu 900 `#002241`,
    bleu 700 `#04669c`, bleu 500 `#abd6ff`, brown 800 `#403830`, brown 500 `#8c6946`,
    puple `#6f4885`, navy 950 `#041a34`, gold 500 `#c98b46`, sand `#fdf8ee`, mist `#f3f8fb`,
    ink `#20272b`, muted `#5d6c7b`, line `#dbe5ec`, danger `#a9332c`.
  - Color Schemes `collection-139f4ef2-8521-8181-4a7f-fc90894e2d6f` — 5 (Scheme 1 only).
  - Typography `collection-3c6a4911-12c4-e415-7fe0-514cefa2d46d` — Heading/Body =
    Montserrat Variablefont Wght, taglines = Greatvibes.
  - UI Styles `collection-08964abb-b13c-a798-071a-663d82b7f0a6` — Radius 4/8/24/48, strokes.
- **49 components**, incl. `Global Styles` `ab488b17-f25a-fbf8-5f54-4a3955eb57e5` and the four
  `Campaign *` components from the August rebuild. None of them are for these six pages.
- **Legacy LP palette, read from the served stylesheet** (977 rules match `.imp-|.csm-|.ty-|
  .landing-|.qz-`) — the colours the v2 pages must hit:
  `#0b2c41` (dominant navy, 34 uses) · `#002241` (deep navy) · `#04669c` (blue) ·
  `#d3aa5a` (gold, 23) · `#abd6ff` (sky) · `#f6f3ee` (cream) · `#d8e0e4` / `#e7ecf1` (lines) ·
  `#376b7b` (slate) · `#fff`. Fonts: **Lato** (body/UI) and **Montserrat**.
  → Primitives is missing `#0b2c41`, `#d3aa5a`, `#f6f3ee`, `#d8e0e4`, `#e7ecf1`, `#376b7b`.
    Phase 1 adds them as `brand/lp-*` tokens rather than hardcoding hexes.
- The site head carries a shared inline layer from the awwwards build (`.ch[data-theme]`,
  `--tx`, `.lightbox`) that loads on every page. Do not touch it; confirm it does not bleed onto
  the v2 pages (none of its selectors are class names v2 will use).

## Phases

0. **RECON** — reference captures of all six live pages (`08-qa/.tmp/v2-reference/`), site
   audit (above), theme extraction. DONE-when: six capture dirs + this plan.
1. **FOUNDATION** — add the missing `brand/lp-*` Primitives tokens; confirm the kit classes the
   build leans on resolve to the right values at 1440/991/767/478.
2. **BUILD** — one page at a time via `data_element_builder` onto the v2 pages, shared classes
   only, three class families:
   - `lp_`      — both landing pages (Cosmetic Dentist / Dental Implants: near-identical skeletons)
   - `consult_` — both consultation pages
   - `confirm_` — both thank-you pages
   Build the first page of each pair fully, then build its twin reusing the family wholesale.
3. **QA** — flip the v2 pages `draft:false`, publish to webflow.io **staging only**, capture at
   1440/768/390 with the same harness, diff against `v2-reference/`, plus a legacy regression
   gate (re-capture the six originals and diff them against the same reference captures).

## State log

- 2026-08-18: **ALL SIX v2 PAGES ARE BUILT AND LIVE ON STAGING.** Verified on the served HTML:

  | page | sections | images | empty video | em dashes | Webflow defaults | leakage |
  | :--- | ---: | ---: | ---: | ---: | ---: | :--- |
  | cosmetic-v2 | 12 | 32 | 0 | 0 | 0 | none |
  | dental-implants-v2 | 12 | 32 | 0 | 0 | 0 | none |
  | cosmetic-consultation-v2 | 5 | 8 | 0 | 0 | 0 | none |
  | dental-implants-consultation-v2 | 5 | 8 | 0 | 0 | 0 | none |
  | cosmetic-thank-you-v2 | 7 | 4 | 0 | 0 | 0 | none |
  | dental-implants-thank-you-v2 | 7 | 4 | 0 | 0 | 0 | none |

  The leakage scan covers livewell / Livewell / Fairfax / Silverbrook / Chris Kim / Dr. Chris /
  (703) 844-2975 / "Grand Mission Dental?" — **zero hits on any page**.

  `build-thankyou.mjs` carries the corrections as data, not as edits: a `SUBSTITUTIONS` block
  for the values (phone, review count, badge, heading, the Experience card's credentials, the
  address, the hours) plus a `fix()` pass that rewrites any copy taken from the reference. The
  **cosmetic thank-you page takes its FAQ from the cosmetic LANDING page**, because the
  reference's is implant copy with implant pricing; the builder reports which source it used.

  Still to do: visual pass on the four new pages at 1440 and 390, and the legacy regression
  gate (re-capture the six ORIGINALS and diff them against `v2-reference/`).

- 2026-08-18: **BOTH CONSULTATION PAGES ARE BUILT**, and the `confirm_` family (**57 classes,
  zero collisions**) is on the site ready for the two thank-you pages. Class totals: 114 `lp_`
  + 23 hand-authored + 32 `consult_` + 57 `confirm_` = **226**.

  cosmetic-consultation-v2 is complete (copy synced, form wired, 4 poster links, 0 Video
  elements). dental-implants-consultation-v2 has everything except its poster swap.

  **The thank-you pages carry the heaviest leakage of the six — the entire contact card is
  another practice's.** `build-thankyou.mjs` must substitute, not copy:
  phone `(703) 844-2975` -> `(281) 789-8836` / `tel:+12817898836` (appears 3x incl. two
  buttons and a fact link); address `9027 Silverbrook Rd Ste. F, Fairfax Station, VA 22039`
  + its maps href -> `8620 Grand Mission Blvd Ste E, Richmond, TX 77407` + the cid link;
  hours `Mon & Tue 8-5 / Wed & Thu 8-4 / Fri 8-1` -> `Mon 9-7 · Tue-Wed 10-8 · Thu-Fri 8-6 ·
  Sat 8-3`; `Dr. Chris, a Kois Center graduate…` -> Dr. William Sung's own credentials;
  `our Fairfax Station practice` -> `our Richmond practice`; `Why Grand Mission **Dental**?`
  -> `Dentistry`; `320+ five star reviews` -> `1,800+`.
  **And the COSMETIC thank-you page's whole FAQ is implant copy** (including "$1,900 to
  $2,800" pricing) — it must be replaced with the cosmetic FAQ, which is available in the
  cosmetic landing page's own reference tree (section 9, 7 items).

- 2026-08-18: **cosmetic-consultation-v2 is BUILT** (7 section roots, copy synced, form wired,
  videos sourced) and the `consult_` family — **32 classes, zero collisions** — is on the site.
  `gen-styles.mjs` now takes `FAMILY=` and `OUT=` so each page family generates into its own
  definition file and regenerating one cannot clobber another; `push-styles.mjs` takes `DONE=`
  and `update-styles.mjs` takes `PUSHED=` to match.

  The consultation pages REUSE the landing pages' header, footer, video row, button and form
  classes; only the hero, form card, stories intro and closing proof band are new.

  **`build-consult.mjs` takes a FUNNEL argument** because this page carries most of the
  cross-client leakage and several strings must be CHOSEN per funnel rather than copied. All
  five substitutions are declared in one `SUBSTITUTIONS` block and echoed by the build:
  card title "Start Your **Implant** Consultation" on the cosmetic funnel -> the funnel's own
  treatment; portrait alt "Dr. Chris Kim, Livewell Dental" -> Dr. William Sung; "…a real
  **Livewell Dental** patient." -> Grand Mission Dentistry; "why others chose **livewell
  dental**" -> Grand Mission Dentistry; and the decorative watermark's words per funnel.

  **RATE LIMIT: `/v2/assets` 429s hard after any run that touches assets**, and
  `data_element_builder` hits it for every Image element — so it blocks BUILDS, not just
  uploads. It cost three separate stalls today. Everything is resumable
  (`built/<slug>.json`); dental-implants-consultation-v2 stopped after its `shell` and the
  cosmetic consultation's poster swap is still pending.

- 2026-08-18: **BOTH LANDING PAGES ARE COMPLETE.** dental-implants-v2's seven video posters
  are placed and live; the page reads correctly end to end at 1440.

  Two defects found by eye on the implant page, both fixed:
  1. **The journey rows rendered white on white in the light column.** `lp_jitem` was generated
     from `li.imp-li-2`, and **measure keeps the FIRST element carrying a class** — that one
     sits in the DARK column, so its white text was baked onto every row. The rows now inherit
     `color` from their column (`lp_jcol` navy / `.is-dark` white). This is the general hazard
     of one-record-per-class measurement: a class used in two contexts takes the first one's.
  2. **The implant hero eyebrow read "Cosmetic Dentistry"** — the reference's own error, logged
     in INDEX.md. Corrected to "Dental Implants · Richmond, TX", and the substitution is wired
     into `build-lp.mjs` (`CORRECTIONS`) so a rebuild cannot reintroduce it.

- 2026-08-18: **dental-implants-v2 is BUILT and live on staging, and it created ZERO new
  classes.** 12 sections, 27 images, 7 native `details` FAQ rows, 1 native form, 123 `lp_`
  classes, 0 em dashes, 0 stray Webflow defaults, 0 leakage strings, correct split h1.

  The three cosmetic build scripts were replaced by one generic **`build-lp.mjs`**:

      node build-lp.mjs <ref-slug> <v2-slug> <consult-path>

  Everything page-specific comes out of the reference — copy, asset ids and nesting from
  `tree-1440.json`, and the split headlines from `headings()`. The two LPs are exact structural
  twins (identical selector counts in every section), which a dry run confirms before any write:
  14 sections, 128 classes, **0 not already created**, 0 em dashes.

  `sync-text.mjs`, `fix-defaults.mjs` and the new generic `form-hero.mjs` finish any page.
  Order matters: **fix-defaults BEFORE sync-text**. A Heading built from child elements keeps
  Webflow's default "Heading" string, which makes the section's live run count one higher than
  the schema's and sends sync-text down its fallback path. 13 stray nodes on this page.
  35 copy runs corrected; a re-run reports 0.

  **REMAINING on this page: 5 of the 7 video posters.** `/v2/assets` has been returning 429
  since the poster uploads — `data_element_builder` hits it to resolve an image asset id — and
  it did not clear within the session. `video-posters.mjs` is resumable: re-run it.

- 2026-08-18: **cosmetic-v2 measures correct against the reference.** A direct geometry probe
  on the live page (after walking it so every lazy image loads) returns the reference's own
  numbers: gallery images **562x469**, office tiles **378x566 / 378x330 / 378x220**, photo strip
  and chapter banners to ratio. The page is 12 sections, 32 images, 7 poster links, 1 native
  form, 7 native `details` FAQ rows, zero HtmlEmbeds, zero em dashes, zero leakage strings.

  **A whole class of defect came from ONE generator gap: the `box` role copied `display` but
  not `flex-direction`.** Any reference box that happened to be flex silently became a ROW —
  the journey intro, the chapter cards, the chapter bodies and the video cards all rendered
  side-by-side. Fixed at the source (the `box` and `container` roles now carry
  flex-direction/wrap/align/justify/gap), which moved 25 classes at once. Webflow's minifier
  emits these as `flex-flow`, so grep for that, not `flex-direction`, when checking published CSS.

  **Clearing a property with an empty string does NOT remove it — it writes the literal
  `@raw<||>` into the stylesheet.** (An earlier note here said the empty string was the removal
  idiom; it is not.) Write the property's real initial value instead — `aspect-ratio: auto`,
  `height: auto`.

  **Two capture traps, both of which read as missing content.** `capture.mjs` walks the page so
  lazy images start loading, but returned before they finished decoding; WALK now waits for
  `img.complete` on every image. Even then, images with very large originals (up to 3744x5616)
  can still be mid-decode — `complete: false` with correct geometry is a capture artifact, NOT
  a broken image. Measure the boxes before believing a screenshot.

- 2026-08-18: **The video problem is solved without custom code, and the LP build is now
  generic across both landing pages.**

  A native Webflow `Video` cannot be made to render through this API (see the previous entry),
  and the reference's own visible videos are HtmlEmbed iframes, which this build may not use —
  its seven `Video` elements are all `visibility:false`. So each video is now a POSTER IMAGE
  linking to the YouTube watch URL: `upload-posters.mjs` fetches each film's frame from
  `img.youtube.com/vi/<id>/maxresdefault.jpg` (falling back to `hqdefault`, and rejecting the
  tiny "unavailable" placeholder by byte size), uploads it as a site asset, and
  `video-posters.mjs` reads each Video's stored `{src}`, builds
  `LinkBlock.lp_video_link > Image.lp_video_poster + span.lp_video_play` in its place, and
  deletes it. 7 posters uploaded (`poster-map.json`), 7 links placed, 0 Video elements left.

  **`headings(slug)` makes the split headlines generic.** The reference marks the coloured half
  of a headline with the class `accent`, and it can come SECOND ("Your Dental Work" +
  "Shouldn't Look & Feel Like Dental Work") or FIRST ("The Dentist" + "Richmond Trusts With Its
  Smiles"). The tree collapses a heading to one string, so the helper parses page.html instead
  and returns `{level, head, accent, accentFirst}` per h1/h2 in document order. Verified on both
  pages — the implant build needs no hand-written splits.

- 2026-08-18: **ALL TWELVE cosmetic-v2 sections are built and the page is live on staging**
  (`/ads-landing-pages/cosmetic-v2`, draft:false, staging publish only). 12 sections, 121 lp_
  classes in use, 25 images, 7 FAQ rows as native `details`/`summary`, 1 native form, zero
  HtmlEmbeds, zero em dashes, zero cross-client leakage strings.

  **THE VISUAL GATE FOUND WHAT NOTHING ELSE DID.** Every structural check passed while the page
  rendered wrong:
  1. **`set_text` SILENTLY NO-OPS ON A TextBlock at creation.** 35 runs shipped Webflow's
     default "This is some text inside of a div block." — every header link, every CTA label,
     every tick row, every video caption — and the build reported success on all of them.
  2. **The journey rows had their tick glyph and their sentence swapped**, because `texts()`
     returns [item, mark] there (the text is on the `<li>`, the glyph on its child span) and
     [mark, tail, lead] in the credentials list (the `<li>` is empty). Read by ROLE, not
     position.
  3. **The before/after images escaped their stage**: they are `position: absolute` and
     `lp_compare_stage` had no positioning context, so they resolved against the page and
     rendered full-bleed above the hero, leaving an empty navy box behind.
  4. Six classes generated from a `text` role lost their layout: the tick rows and credential
     rows are flex/grid in the reference, the accent half of a split headline carries its own
     leading padding, and the journey intro collapsed inside a centred flex column.

  `sync-text.mjs` is the durable answer to (1) and (2): it walks the build schema and the live
  subtree in the same depth-first order and writes every run that differs, so it repairs
  no-opped copy AND copy that went to the wrong element, and it is idempotent. Sections whose
  live tree carries runs the schema never asked for (a Form brings its own labels and
  success/error messages) fall back to matching only the nodes still holding the default
  string. 45 runs corrected; a re-run now reports 0.

  **OPEN — the native Video element cannot be made to render through this API.** `Video`
  accepts `{src, title}` (a `YouTubeVideo` does not accept anything at all) and reads back
  correctly, but the published markup is an EMPTY `<div class="w-video w-embed"></div>`:
  Webflow only generates the embed when the Designer fetches oEmbed for the URL. Seven video
  slots on this page render as blank boxes. The fix that stays inside "no custom code" is a
  poster image linking to the YouTube watch URL — the thumbnails need uploading as site assets
  first. Queued as the next step.

  Also open: one form field still shows `placeholder="Example Text"`. `placeholder` is a
  reserved attribute name for `set_attributes` AND `remove_attribute` refuses it, so this is a
  Designer-only fix. The three fields carry visible labels, so the form is usable meanwhile.

- 2026-08-18: Phase 2 — **six of the twelve cosmetic-v2 sections are built**: shell, header,
  hero, journey, difference, specialist, options. All read back with their `lp_` classes, and
  the five embedded videos carry their YouTube sources. 134 classes now exist
  (114 generated + 20 hand-authored).

  **Content is sourced from `tree-1440.json`, not `outline.json`.** The outline is extracted
  from the saved `page.html` with no CSS or JS, so anything the live page reorders or injects
  comes out wrong — the Swiper-driven options cards lost a spec label there, and the specialist
  credentials paired against the wrong strings (the `<strong>` lead-in renders first but sits
  LAST in the DOM). `lib.mjs` gained `tree()` / `byClass()` / `all()` for this.

  **THE VIDEO TRAP, and it is not guessable.** `data_element_builder` offers both `Video` and
  `YouTubeVideo`; the obvious one is wrong. A **`YouTubeVideo` element's `video` setting cannot
  be written** — every value shape answers `Invalid value for setting "video": expected video`
  — while the identical write on a plain **`Video`** succeeds, and the reference pages use
  `Video` too. The builder has NO setter for the source at creation either (`set_video`,
  `set_youtube_video` and friends are accepted and silently ignored, like every unknown key).
  So: build `Video`, then write `{src, title}` with `data_element_settings_tool` key `video`
  + `static_video`. `videos.mjs` does the swap and the write, and reads every one back.

  Divergences logged so far: the before/after slider renders at a fixed 50% split (the drag is
  JS), so the "Drag to compare" hint became a static caption; the options row is a plain
  responsive grid rather than Swiper; the hero card holds a real native form where the
  reference has an empty LeadConnector embed; and the form fields carry visible labels because
  `placeholder` is unreachable.

- 2026-08-18: Phase 2 — the MEASUREMENT was wrong in three ways and all three are fixed. This
  cost a run but every one of them would have shipped as a visible defect:
  1. **Lazy images were measured before they loaded.** The chapter banner came back 46px tall
     (real: 236px) and the doctor photo strip came back 0x0 (real: 281x187). `measure.mjs` and
     `tree.mjs` now walk the whole page, wait for every `<img>` to report `complete`, and
     return to the top before measuring.
  2. **The parameterised class filter had a regex-escaping bug.** In a JS string `"\s"`
     collapses to a literal `s`, so `(^|\s)` became `(^|s)` and every element whose matching
     prefix was not the FIRST class on the attribute was silently dropped — the hero CTA
     (`vnr-a lw-btn lw-btn--gold`) was the one that showed it. The filter now defaults to
     matching every class (190 chains instead of 110), which also recovered the header, the
     "how it works" band, the FAQ chrome and the whole options section (`service_item*`).
  3. **Images were carrying baked pixel heights.** A measured `height` on an image is the USED
     value of `height: auto` — it differs at every width, so seven breakpoints of pixels give a
     layout that is right at exactly seven widths and wrong between them. A `media` class is
     now RATIO-driven: the design's own `aspect-ratio` where it declares one, otherwise the
     ratio of the measured box, plus `width: 100%`.

  `update-styles.mjs` applies changed definitions to classes that already exist. Two API facts
  shape it: **re-asserting a value the style already holds answers "[Conflict] … style block
  store" and aborts the whole call**, and **there is no way to READ a class's stored
  properties** (`query_styles` ignores its filter and returns every style as metadata only). So
  a conflict is treated as "already correct", not an error: the class is tried as one batch and
  falls back to one property per call. Clearing a property needs an EMPTY string — `"auto"` is
  rejected and there is no `remove_properties` action in this MCP build. 8 image classes updated.

- 2026-08-18: Phase 2 STARTED — cosmetic-v2 shell, header and hero are built and their classes
  read back correct (`section_lp_hero` / `lp_container` / `lp_hero_grid` / `lp_hero_content` /
  `lp_form_card`, and `section_lp_header` / `lp_header_bar` / `lp_header_inner`). Section
  elements report as `type: "Block"` with `settings.tag: "section"` — that is a real `<section>`,
  not a div. 19 hand-authored classes were added on top of the 99 generated ones
  (`styles-def.manual.mjs`): the header stack, the "how it works" section, the FAQ accordion
  chrome and the hero form fields. Ids in `built/cosmetic-v2.json`.

  **API facts learned this session, each one a failed call first:**
  1. `type: "Form"` does NOT create an empty wrapper — it creates a COMPLETE Webflow form
     (FormWrapper > FormForm with two LABELLED text inputs and a submit button, plus the
     success and error messages). A Text Field cannot be a child of the wrapper
     ("Text Field can only be placed in a Form"), so a form is built empty and then ADJUSTED.
  2. On `data_element_tool`, `remove_element` / `set_style` / `set_text` / `set_attributes`
     take **`id`**, while `query_elements` takes **`element_id`**. Same tool, different key.
  3. Form input settings keys are `name` / `required` / `type` / `attributes` / `domId`.
     **`placeholder` is a RESERVED attribute name** and is rejected — it cannot be set through
     the API at all. (An earlier note in this file claimed the opposite; it was wrong.)
  4. **`set_settings` reports ACTION-level success while individual OPERATIONS fail.** The
     truth is in `result[].data[].applied_keys` / `.error`. One bad key discards its WHOLE
     operation — a batch carrying the reserved `placeholder` attribute wrote nothing at all and
     still answered `"Applied 1 operation(s)"`. That is why three form fields kept Webflow's
     default names through two runs. `lib.mjs`'s `call()` now inspects those per-operation
     results and throws.
  5. Unknown action names and argument shapes are cheapest to discover by sending a bogus
     action or key and reading the Zod union error.

  Hero form now reads back correct: First name/text, Phone/tel, Email/email, all required,
  submit "Request My Consultation", form name + redirect to the v2 thank-you page. Because the
  placeholder is unreachable, the fields need visible labels rather than placeholder text —
  queued as the first build step of the next section pass.

- 2026-08-18: Phase 1 DONE — the `lp_` class system exists on the site. `measure.mjs` renders
  each live reference page at 1920/1440/1280/1100/991/767/478 and dumps the computed styles of
  every legacy class chain (`v2-reference/<slug>/styles.json`, 110 chains on the landing pages,
  sentinel-guarded). `gen-styles.mjs` carries a hand-authored NAME MAP (legacy chain -> the
  client-first class that replaces it, plus the property set that class owns) and reads the
  VALUES straight out of those measurements — so nothing is transcribed by hand. `push-styles.mjs`
  created all **99** classes (89 globals + 10 `is-*` combos), read back present on the site,
  zero name collisions against the 1,712 existing globals. Six `brand/lp-*` Primitives tokens
  carry the palette; every colour in the generated definitions binds to a variable.

  Breakpoint mapping: 1100 -> **main** (covers 992-1279) · 1280 -> large · 1440 -> xl ·
  991 -> medium · 767 -> small · 478 -> tiny.

  **1920 is measured but deliberately NOT emitted.** The reference's own type multiplier
  misfires there — `.imp-h2` computes 46px at 1440 and **21px** at 1920 — so xl carries every
  width from 1440 up rather than reproducing that.

  Three measurement artifacts the generator now corrects, each of which would have shipped as a
  defect: `margin-left/right: auto` computes as a PX number on a centred box (320px at 1920), so
  horizontal margins are never copied; only the top/left border edges were sampled, so a border
  is expanded to all four sides with an explicit `style: solid`; and an authored `add` value now
  wins at every breakpoint instead of being overridden by the measurement at that width.

- 2026-08-18: Phase 0 started. Six target pages identified and confirmed by SEO metadata;
  established there is no local HTML package for them (see above); site audit done
  (`raw/gm-styles-all.jsonl`, `raw/gm-variables.jsonl`, `raw/gm-components.jsonl`,
  `raw/gm-style-names.txt`); reference capture harness adapted from Mason Park and running.
