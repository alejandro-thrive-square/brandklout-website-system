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
- [ ] **P1 Reference spec** — screenshots + section-by-section spec from the client reference.
- [ ] **P2 Mason Park pattern** — read `new-patient-special` / `-consultation` / `-thank-you`
      structure; that site is the house example of client-first done right.
- [ ] **P3 Local v2 source** — author the three Dental Implants pages locally in the reference's
      language, carrying existing copy/offers/numbers unchanged. This is the "local version" the
      Webflow build is graded against.
- [ ] **P4 Class layer** — create the `campaign-*` base + `is-*` combo classes in Webflow, bound to
      variables.
- [ ] **P5 Build implants v2** — 3 pages via `data_whtml_builder`.
- [ ] **P6 Verify on staging** — publish to the **Webflow subdomain only**
      (`publishToWebflowSubdomain:true`, `customDomains:[]`) and diff against local.
- [ ] **P7 Replicate** — the other 5 topics × 3 pages, same structure, content swapped.

## Hard rules for this build

- Publish **only** to the staging subdomain. The site carries the live custom domain
  `arvadadentalimplants.com`.
- No `HtmlEmbed`, no page/site custom code. If something cannot be a class, redesign it as one.
- Grids get checked explicitly — past builds got grid columns wrong silently.
- Every asset uploaded to Webflow and mapped; resolve assets by `displayName`, never `hostedUrl`.
