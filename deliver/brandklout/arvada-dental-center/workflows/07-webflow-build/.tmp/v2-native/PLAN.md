# Arvada v2 native rebuild — plan and running state

Rebuild all 18 paid-traffic pages as **new `… v2` Webflow pages**, natively, with client-first /
Relume classes. No Custom Code elements, no page-settings code, no verbatim HTML/CSS/JS embeds.

## Recon (done)

**MCP.** The 2026-07-28 stateless Webflow MCP has two argument shapes and mixing them up produces a
Zod wall, not a helpful error:

| shape | tools | where the site id goes |
|---|---|---|
| Designer | `data_style_tool`, `data_element_tool`, `data_variable_tool`, `data_element_builder`, `data_whtml_builder`, `data_component_*` | **top level** `siteId` + `pageId` (both required, even when the action is site-wide) |
| Data API | `data_pages_tool`, `data_assets_tool`, `data_sites_tool`, `data_scripts_tool`, … | `site_id` **inside** each action; a top-level `siteId` is rejected |

`v2-native/wf.mjs` injects whichever the tool wants. It drives `../wfmcp.mjs`, which uses the
`webflow-brandklout` grant on the TEAM profile — no second OAuth.

**Sites.** arvada `693c51e685b19f0d0c149cab` · masonpark `6a60bdc0340e5f1784b4d553` ·
kit-foundation `6a7a804cfed7e6e46272c6b0`.

**Arvada already has the client-first / Relume vocabulary.** 2,899 styles (1,954 base + 945 combo),
including the whole Relume utility layer: `page-wrapper`, `main-wrapper`, `padding-global`,
`padding-section-{small,medium,large}`, `container-{small,medium,large}`, `heading-style-h1…h6`,
`text-size-*`, `text-weight-*`, `text-color-*`, `margin-*`, `max-width-*`, `icon-*`, `form_*`,
`button` + `is-*` combos. **Reuse these; do not re-create them.**

> Trap: prior messy pastes forked duplicates — `button 2`…`button 8`, `padding-global 4/7/9`,
> `container-large 4/6`, `text-size-medium 31/32/33`, `page-wrapper 2`. Always target the
> canonical, unsuffixed name.

**Variables** (4 Relume collections, really bound):

- Primitives — brand: `gold #c8b282`, `brown 800 #403830`, `brown 500 #8c6946`,
  `silver 500 #b3b6b5`, `silver 700 #8e8d8d`, `silver 900`, `light #fcfcfc`; plus the 8 neutrals
  and the white/black opacity ramps.
- Color Schemes — Scheme 1 only: Background `#fdf8ef`, Text/Foreground/Border/Accent bound to
  neutral shades.
- Typography — Heading `area extended`, Body `Centurygothic`, taglines `Garnetta`.
- UI Styles — Radius L/M `0px`, S `4px`, xlarge `48px`; Stroke 1px.

Bind colours with `variable_as_value`, never hex, so a re-theme propagates.

**Target pages** (all 18 exist; no v2 page exists yet) — ids in `page-map.json`.

## Design source

`01-content-intake/.tmp/reference-captures/arvada-emergency-v2-grand-mission-close.html` — the
client-supplied v2 design, 35KB, **one `<style>` block, zero `<script>`**. Split for working use
into `ref-emergency-v2.css` + `ref-emergency-v2.body.html`.

It is already shaped like a Webflow client-first build: 113 classes, all
`campaign-<block>_<element>` with `is-*` modifiers (`is-navy`, `is-sand`, `is-blue`, `is-mist`,
`is-light`, `is-outline`, `is-small`, `is-center`, `is-video`, `is-result`, `is-provider`,
`is-faq`). The `is-*` set becomes Webflow **combo classes**; everything else a base class.

Section arc: announce · header · hero · proof · 9 × section · cta · footer.

## Build route — PROVEN end to end 2026-08-18

`data_whtml_builder` (HTML + raw CSS → **native** elements and **native** classes) section by
section, not `data_element_builder` call-by-call. Probed on the real page; everything below is
measured, not assumed.

**What it produces.** Real `Section` / `Block` / `Span` / `Link` / `String` elements carrying real
Webflow classes with real properties, fully editable in the Designer. Zero embeds, zero custom code.

**The rule that shapes the whole build: a class survives if it already exists on the site, OR if
the fragment's own CSS defines it.** A brand-new class name with no rule is silently dropped from
the element. So:

1. Build the `campaign-*` class layer **once** (P4), with CSS.
2. Every later page insert is **markup-only** — no CSS re-sent, classes resolve by name.

That is what makes 18 pages affordable, and it is why the class layer has to be right first.

**Confirmed working:** combo classes (`class="campaign-button is-light"` → `.campaign-button.is-light`,
`isComboClass:true`) · `:hover` and the other base pseudo-*classes* · breakpoint overrides
(land on `medium` / `small` correctly) · CSS grid (real `grid-template-columns`/`-rows`, gap split
into row+column gap) · `<details>`/`<summary>` (arrive as `DOM` elements with the tag preserved —
the reference FAQ is JS-free and depends on this).

**Hard constraints, each one an outright error, not a warning:**

- **No pseudo-ELEMENTS.** `:after`, `:before`, `::-webkit-details-marker` are all rejected with
  *"Add a real child element and style that class instead."* The reference uses 6 of them
  (`campaign-button:after` ›, `campaign-header_status:before` ◷, `campaign-header_phone:before` ☎,
  `campaign-text-link:after` ›, `campaign-credential-text:before`). Each becomes a real child
  `<span>` with its own class — which is also the client-first way.
  For the `<summary>` marker use `list-style:none` plus `display:flex`, not the webkit pseudo.
- **Media queries must be spelled exactly**: `screen and (max-width: 991px)`,
  `screen and (max-width: 767px)`, `screen and (max-width: 479px)`,
  `screen and (min-width: 1280px)`, `screen and (min-width: 1440px)`,
  `screen and (min-width: 1920px)`. `@media (max-width:991px)` is refused. Note **479**, not 478.
- **CSS functions are stored verbatim and break the style panel.** `width:min(1180px,calc(100% - 48px))`
  came back stored as that literal string — the Designer shows `0` and the value is uneditable
  (the known `clamp()` trap). Resolve every `min`/`max`/`clamp`/`calc` to concrete values before
  sending.
- **Font families must be the names Webflow has installed**, or the build returns
  `partial_success` + `missing_font` and the declaration is dropped. Installed here:
  `area extended` (100/400/700/800/900), `Centurygothic` (400/700), `Garnetta`, `Lato`, `Didot`,
  `Didot Title`, `Nexa`, `Playfairdisplay Variablefont Wght`. So `AreaExtended` → `area extended`,
  `CenturyGothic` → `Centurygothic`.
- Max **5 actions per call**; no `<style>` tags in either field.

**Reading results.** `wfmcp.mjs` prints **one JSON object per action, newline-delimited** — a
multi-action response is not a JSON array. `wf.mjs` parses both shapes.

### Consequence for the local source

Because the design has to be re-expressed in this dialect anyway, the **local v2 source is authored
directly in Webflow-safe CSS** — canonical breakpoints, no CSS functions, no pseudo-elements,
installed font names. Then design and build match by construction instead of by reconciliation,
which is what cost the last build ~15 gates and several hundred corrections.

The reference's own breakpoints (`max-width:900px`, `max-width:640px`) are re-authored at **991**
and **767**.

## Phases

- [x] **P0 Recon** — MCP shapes, vocabulary, variables, page ids.
- [x] **P0b Pipeline proof** — `data_whtml_builder` validated on the real page; findings above.
      Probe elements and `probe-*` styles removed afterwards; the `campaign-announce*` /
      `campaign-container` styles created during the probe are kept and will be overwritten by the
      real class layer in P4.
      **`Dental Implants v2` page created: `6a83e962d17d0bfe618c49f7`, slug
      `dental-implants-ads-landing-v2`, body element `6a83e962d17d0bfe618c49fd`. Body is empty.**
- [x] **P4 Class layer — DONE and gated.** `04-design/.tmp/v2/_shared/camp.css` is the single
      source; **109 base classes + 18 combos, 128 selectors, 781 declarations, all verified present
      on the site at every breakpoint** (`node verify-classes.mjs`). Page body is empty again.
- [x] **P5 First page BUILT and on staging.** `Emergency Dentist v2`
      (`6a83f5128cf531bbb68af94a`, `/emergency-dentist-ads-landing-v2`) — 469 native elements,
      **126/126 classes applied, each on the right number of elements**. Live at
      `https://arvadadentalcenter.webflow.io/emergency-dentist-ads-landing-v2`.
      Screenshots + probe in `shots-em-v2/`. **Zero horizontal overflow at 1440/991/767/479**, and
      the h1 ramp measures 74 / 53 / 48 / 42 px — exactly the authored steps.
      Remaining on this page: 2 of 7 images still to bind (see the toggle note), and the YouTube
      URL (see below).
- [x] **P6 Content model + second page.** The template is split into structure and content:
      `page-template.tokens.html` (205 `{{slot}}` markers) + `content/<topic>.json`.
      `extract-content.mjs` produced it and proves the split is **byte-for-byte lossless** on a
      round trip. `render-page.mjs <topic>` fills it and refuses to emit an unfilled slot.
      **`Dental Implants v2` is BUILT and on staging** (`6a83e962d17d0bfe618c49f7`,
      `/dental-implants-ads-landing-v2`) — 469 elements, 126/126 classes, 7 images linked,
      zero leftover tokens, no copy leaked from emergency. Hero verified by eye at 1440.
      Implants copy carries the real facts forward from the previous build: the published
      **$18,795** fixed-arch figure and its comparison claim, Dr Bennett's credentials,
      "in Arvada since 2003", and the three real Google reviews (Willcox / Hoffner / Brancucci).
      Nothing clinical invented, no outcome promised.
- [ ] **P1 Reference spec** — screenshots + section-by-section spec from the client reference.
- [x] **P2 Mason Park pattern** — read and adopted; see "Naming and structure" below.
- [ ] **P3 Local v2 source** — author the three Dental Implants pages locally in the reference's
      language, carrying existing copy/offers/numbers unchanged. This is the "local version" the
      Webflow build is graded against.
- [ ] **P4 Class layer** — create the `campaign-*` base + `is-*` combo classes in Webflow, bound to
      variables.
- [ ] **P5 Build implants v2** — 3 pages via `data_whtml_builder`.
- [ ] **P6 Verify on staging** — publish to the **Webflow subdomain only**
      (`publishToWebflowSubdomain:true`, `customDomains:[]`) and diff against local.
- [ ] **P7 Replicate** — the other 5 topics × 3 pages, same structure, content swapped.

## The class layer, and the four traps found building it

`camp.css` → `build-classes.mjs` → `sync-combos.mjs` → `verify-classes.mjs`. Run them in that
order; all three are idempotent and the last one is the gate.

**The whole stylesheet goes up in one call.** `data_whtml_builder` creates a Webflow style for
**every rule in the `css` field, not only the ones the markup uses** (measured: three rules, one
element, three classes created). So the class layer is one action attached to a throwaway div,
which is then removed. 17KB of CSS, 109 classes, one round trip.

### 1. A combo name can only attach to ONE base class per build

`.camp_button.is-navy` was created; `.camp_section.is-navy` was not. Same for `is-on-dark`
(`camp_text-link` won, `camp_h2` and `camp_text` lost) and `is-center` (`camp_text` won,
`camp_heading` lost). First in source order wins, the rest vanish **with a `success` status and no
warning** — the element then renders with only its base class, which usually looks *almost* right.

`data_style_tool create_style` with `parent_style_names` has no such collision. `sync-combos.mjs`
reconciles all of them and re-verifies. 18/18.

### 2. A bare `0` before a negative length is silently corrupted

`box-shadow: 0 -8px 25px rgba(...)` is stored as `0-8px 25px rgba(...)` — the separating space is
eaten, the value is invalid CSS, and the shadow simply never paints. Proved by bisecting:

| written | stored |
|---|---|
| `0 8px 25px …` | `0 8px 25px …` ✓ |
| `0 -8px 25px …` | `0-8px 25px …` ✗ |
| `0px -8px 25px …` | `0px -8px 25px …` ✓ |
| `top:-40px`, `margin-top:-12px` | fine — single-value props are unaffected |

**Write `0px`, never a bare `0`, in any multi-value property.** `lint-css.mjs` now fails the build
on it.

### 3. `missing_font` is a false alarm for the site's own fonts

The class-layer build returned `partial_success` with *"Font 'area extended' could not be installed
or is unavailable"* for both brand fonts — and then stored `font-family: area extended` correctly
anyway. The warning means "I could not *install* this from Webflow's font library", not "I dropped
your declaration". **Read the style back rather than trusting the status**; that is the same lesson
as the `partial_success` skip-link incident in the old build.

Webflow does keep only the **first** family and drops the fallback stack (`Arial, sans-serif` →
`Arial`).

### 4. Webflow does not store what you wrote — it expands and normalises

The verifier compares after the same expansion, or it reports dozens of phantom failures:
`overflow` → `overflow-x`/`-y`; `border-radius` → four corners; `border` → 12 props;
`margin`/`padding` → four sides; `gap` → `grid-row-gap` + `grid-column-gap`; and any
`grid-template-columns` silently gains `grid-template-rows: auto`.

Re-sending a value a style already holds is **not** a harmless no-op — the multiplayer server
answers `[Conflict] The operation could not be applied to the style block store`, which reads like
a failure when nothing is wrong. `sync-combos.mjs` diffs before writing.

## Building the markup — what the first page taught

`make-template.mjs` (reference → `page-template.html`) → `check-html.mjs` → `build-page.mjs` →
`map-assets.mjs` → `shoot.mjs`.

**The build sends NO css.** Every camp_ class already exists, and the builder applies an existing
class by name. 19KB of markup, one action, 469 elements.

### One base class per element — and a class that owns combos can never be secondary

`class="camp_container camp_split"` silently lost `camp_split` on all six sections, taking the main
layout grid of half the page with it. Two globals on one element is *usually* fine
(`camp_container camp_announce_inner` works), but **`camp_split` owns combos**
(`is-result`/`is-provider`/`is-video`/`is-faq`), and a class that owns combos cannot also ride as a
secondary class on another base.

Fixed by splitting the concerns, which is the client-first shape anyway:
`.camp_container > .camp_split.is-result`. After that: **126/126 classes applied**.

### `<iframe>` is dropped without a word

Webflow has no iframe element, so the video simply vanished — no warning, an empty card. The native
answer is the **`YouTubeVideo`** element type (not an embed, so it stays inside the rules). The
template leaves a `.camp_video_slot` marker and the builder creates the element into it.

**Its `video` setting is unreachable from the Data API**: `static_text`, `static_video`,
`static_json` and `static_link` are all refused with *"Invalid value for setting video: expected
video"*. Same family as the Text Field placeholder gap. The element is created and native; **the
URL has to be pasted once in the Designer** (`https://www.youtube.com/watch?v=GefKg1nID9w`).

### Bind images at BUILD time by using the asset's own hostedUrl

**This is the fix; everything in the next section is why you should not need it.**

`data_whtml_builder` binds an `<img>` to a real Webflow asset when — and only when — the `src` is
the asset's **`hostedUrl`** (the `s3.amazonaws.com/webflow-prod-assets/…` one from `get_asset`).
Given the `cdn.prod.website-files.com` URL the design carries, it answers *"does not exist in asset
library"* and inserts an unmanaged image.

With the src rewritten the whole page comes back
`status: success` — *"7 image(s) linked to existing assets in the library"*, zero warnings — and
no post-pass is needed at all. `build-page.mjs` does the rewrite itself (asset id from the filename
prefix → `get_asset` → `hostedUrl`), so the design file keeps its readable CDN URLs.

### `set_image_asset` TOGGLES — never write a bound image twice

whtml_builder will not attach an asset from an `<img src>` (*"does not exist in asset library"*) —
it matches by URL, and the CDN URL on an `<img>` never equals the `s3.amazonaws.com` URL
`list_assets` reports. No search is needed though: **Webflow prefixes every filename with the asset
id**, so `…/693fa144…f7_arvada-dentist-1.png.webp` *is* asset `693fa144…f7`.

The dangerous part is the write:

- **It is eventually consistent.** Reading the element straight back says `assetId: unset` even
  when the write was fine.
- **Writing an already-bound image UNBINDS it.**

Together those make the obvious write-then-verify-then-retry loop destructive: it read "unset",
wrote again, and drove the page from 6/7 bound down to 5/7 to 4/7 while reporting 1/7. The old
build's note that "re-running the script is safe and idempotent" is **wrong for this tool**.

So `map-assets.mjs` writes only images whose current `assetId` is not already the wanted one, at
most once per run, and verification is a **separate `--check` run in a fresh process**. Each run
converges. `GET /v2/assets` also 429s under a loop — that is a rate limit, not a missing asset.

### Verify with signals that actually exist

- `get_attributes` returns `[]` for an Image. `assetId` and `altText` are **settings**, read with
  `data_element_settings_tool` `get_settings` `type:"all_raw_settings"`. An alt check built on
  `get_attributes` passes vacuously and proves nothing — this file had one until it was caught.
- The image pairing is checked two ways before any write: the (own class, parent class) sequence
  must match the design element-for-element, and where the alt says before/after the bound file's
  name must agree. An off-by-one here puts the surgeon's portrait in the hero.
- **`captureBeyondViewport` does not load lazy images, and scrolling first does not fix it.**
  The full-page capture renders the whole document in one pass, so every below-the-fold `<img>`
  paints as an empty box and the probe calls it broken. It reported 6 of 7 broken at 1440 and 0 of
  7 at 767 — same page, same URLs, all HTTP 200. A **viewport-sized capture** after a real wait
  shows the truth: the three images above the fold are `complete` with real `naturalWidth`, the
  rest are simply not loaded yet, which is correct browser behaviour.
  So: use the tall capture to judge **layout**, and a viewport capture to judge **images**. Never
  report a lazy image as broken.
- **A probe that returns nothing is a failure, not a pass.** `shoot.mjs` marks the width
  unverified rather than recording a clean result.
- **`get_settings` reads are unreliable right after a write.** The builder reported all 7 images
  linked with `status: success`, while `get_settings` said 2 — and the published page proves the
  images resolve. Prefer the builder's own result and the published page over an immediate read.
- **A probe that returns nothing is a failure, not a pass.** `shoot.mjs` marks the width
  unverified rather than recording a clean result.

## Naming and structure — copied from Mason Park

`mason-park-dental.webflow.io/new-patient-special` is the house example the user named. Read via
`outline.mjs` → `mp-new-patient-special.outline.txt` (603 nodes, 110 classes). The shape:

```
Body
  .page-wrapper
    ComponentInstance          ← nav
    ComponentInstance
    main.main-wrapper
      section.section_lp_hero
        .padding-global
          .container-large
            .padding-vertical.padding-xlarge
              .lp_hero_grid
                .margin-bottom.margin-xsmall > p.lp_eyebrow
                .margin-bottom.margin-small  > .lp_hero_badge
                …
                .button-group > a.button + a.button.is-secondary
```

Two rules do all the work:

1. **Spacing is never a bespoke property.** Every gap is a Relume utility wrapper —
   `margin-bottom margin-small`, `margin-top margin-medium`, `padding-section-large`,
   `padding-global`, `container-large`. Mason Park uses `margin-*` 63 times and defines no custom
   margins at all.
2. **Bespoke classes only where the design is genuinely bespoke** — `lp_hero_grid`, `lp_check-item`,
   `lp_price-card_row`. Everything typographic reuses `heading-style-h2`, `text-weight-bold`,
   `text-color-white`, `text-align-center`; every button is `button` + an `is-*` combo.

**Prefix for this build: `camp_`** (campaign), matching Mason Park's `lp_`. Sections are
`section_camp_<beat>`. So the reference's `campaign-hero_grid` becomes `camp_hero_grid`, its
`campaign-faq_item` becomes `camp_faq_item`, and its `is-*` modifiers carry over unchanged as combo
classes. One shared `camp_` vocabulary serves all 18 pages — that is what makes the later pages
markup-only inserts.

> The probe created six `campaign-*` classes; they have been removed again so the site vocabulary
> stays clean until the real `camp_` layer is authored in P4.

## Open questions for the user

1. **Call tracking rewrites the phone numbers, per page.** The source says `(303) 421-7611`;
   emergency v2 renders `(983) 955-0387` and implants v2 renders `(983) 900-6463`. So the
   site-wide script is assigning a distinct tracking number per page, which is the correct
   behaviour — but someone should confirm the pool covers the new `-v2` slugs and points at the
   right campaign, since the v2 pages are new URLs the tracking config has never seen.
2. **Relume utility values do not match the client's approved design.** `padding-section-large` is
   7rem/112px against the design's 104px; `heading-style-h1` is 3.5rem/56px against the design's
   74px; `padding-global` is 5% against a fixed 24px gutter. The build keeps the **design's**
   values in `camp_` classes and takes client-first for structure, naming and reuse. If the pages
   should instead snap to the existing style guide, that is a different (and visible) decision.
3. **The `YouTubeVideo` URL needs one Designer paste** — the setting is unreachable over the API.
4. The `sienna-accessibility` widget is present on the v2 pages too (it is site-wide).

## Hard rules for this build

- Publish **only** to the staging subdomain. The site carries the live custom domain
  `arvadadentalimplants.com`.
- No `HtmlEmbed`, no page/site custom code. If something cannot be a class, redesign it as one.
- Grids get checked explicitly — past builds got grid columns wrong silently.
- Every asset uploaded to Webflow and mapped; resolve assets by `displayName`, never `hostedUrl`.
