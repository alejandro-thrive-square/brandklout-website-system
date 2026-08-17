# v2 build policy — binding rules for every page-build agent

Read PLAN.md first. This file resolves the conflicts between "v2 equals the reference" and what
the captures found on the live pages.

## Parity target

The visual/layout/responsive spec per page is the capture set in
`workflows/08-qa/.tmp/v2-reference/<slug>/` (screenshots 1440/768/390 + content.json +
metrics.json + INDEX.md). Work from the screenshots and content inventory, NOT from the live
pages' markup/classes (messy converter code; do not import its class names or structure).

## Content-correction policy (overrides pixel parity)

The live pages were cloned from Livewell Dental (a different practice, in Virginia) and
incompletely adapted. v2 keeps the DESIGN but corrects cross-client leakage. Rules:

1. NEVER invent facts, testimonials, statistics, pricing, or credentials. Every substitution must
   come from a verifiable Mason Park source in this repo:
   - `workflows/04-design/.tmp/{invisalign,new-patient-special,thank-you}/index.html` — approved
     Mason Park copy: offers, doctor (Dr. William Sung, DMD), Katy TX address, phones, FAQs.
   - `workflows/01-content-intake/.tmp/client-site/` — the practice's own site content.
2. Known leakage to correct (from capture INDEX.md):
   - Thank-you pages: Livewell phone (703) 844-2975, 9027 Silverbrook Rd Fairfax Station VA,
     "our Fairfax Station practice", implant FAQ with $1,900–$2,800 pricing → replace with Mason
     Park contact block + the "what happens next" / FAQ content from the local thank-you design.
   - Consultation pages: "Dr. Dave Cho" + implant copy on invisalign/new-patient funnels →
     Dr. William Sung, and the funnel's own treatment name in card/CTA copy.
   - "Start Your Implant Consultation" on the invisalign funnel → "Start Your Invisalign
     Consultation" (and the equivalent on the new-patient funnel).
   - Malformed `tel:835:+…` links → correct tel: URIs with the page's Mason Park number.
   - Image alts referencing "Dr. Chris Kim, Livewell Dental" → correct alt for the asset used.
   - Broken images on /invisalign (doctor portrait + process photo render as empty boxes) →
     map working Mason Park assets (see asset manifest; prefer the same asset the
     new-patient-special page uses for the same slot, or the local design's asset).
3. Every substitution gets one line in the page's build report: reference said X → v2 says Y →
   source of Y.

## Forms — no custom code allowed

The reference's only lead capture is a LeadConnector iframe (Livewell's form ID — leads would go
to the wrong practice). v2 pages may NOT contain HtmlEmbeds or custom code. Therefore:
- Build NATIVE Webflow forms styled with the kit's form_* classes to visually match the reference
  form card (same fields as content.json's forms entry; same layout).
- The consultation "quiz card" is empty/broken on the reference; build it as a native form card
  matching the visual design of the card frame.
- Lead delivery is blocked on the client's GHL webhook (site head still has the
  {{GHL_INBOUND_WEBHOOK_URL}} placeholder) — a pre-existing client blocker. Do not wire anything
  to Livewell's LeadConnector form/sub-account. Note it in the report.
- Native-build trap: form field placeholder/options are unreachable via the element tools at
  creation (see traps memory) — set what is reachable, report what is not.

## Structure rules (Relume/Client-First — see kit-foundation-spec.md)

- Page skeleton: `page-wrapper` > [Global Styles component instance — FIRST child, mandatory] >
  `main-wrapper` (main) > sections. Reuse the existing "Global Styles" component on the site.
- Section pattern: `section_[page]_[name]` (semantic tag, marker class) > `padding-global` >
  `container-large` > `padding-section-large` > content. Class-family prefixes:
  - `lp_` — BOTH main LPs (they share an identical 11-section skeleton; one shared family, built
    by the new-patient-special build and reused wholesale by the invisalign build; a class is
    page-specific only if a section genuinely exists on one LP alone).
  - `consult_` — both consultation pages (twins sharing classes).
  - `confirm_` — both thank-you pages (twins sharing classes).
  Heading elements: the h2-h6 TAG styles cannot be themed via the API — put the matching
  `heading-style-h*` class on EVERY heading of level 2+ (h1 tag is themed, class optional).
- Components: componentize the sections that are identical twins across pages — top bar, footer/
  closer, the form card, and any identical band — with client-editable props (text/link/image)
  named per site conventions. Content sections that differ per page stay as shared-class builds.
- Reuse the kit's global classes (heading-style-*, text-size-*, text-weight-*, spacing pairs,
  container-*, padding-*, button + is-*, form_*, text-color-*, background-color-*) before creating
  ANY new class. New classes only for section-scoped layout, named `[prefix]_[section]_[part]`.
- Combos: modifiers are `is-*` and override only deltas. Never fork a kit class.
- GRIDS (known weak spot — double-check): every multi-column layout is a native Webflow Grid
  element (w-layout-grid) with a section-scoped class holding grid-template-columns + gaps, with
  explicit breakpoint collapses (3→2@991→1@767 etc. to match the reference screenshots). After
  building each grid, READ THE STYLE BACK at all breakpoints and verify children placement; a
  create that echoes success is not proof.
- Spacing: `margin-bottom margin-small`-style wrapper pairs, not margins on text elements.
- Colors/typography: use the themed kit classes and variables (see phase1-report.md /
  theme-extract.md). Do not hardcode hex values where a variable exists.
- Assets: reuse existing site assets by asset id (manifest raw\mp-assets.json). Match by rendered
  usage in the reference (content.json images list). NEVER use lw-*/jm-* (other clients') assets
  unless the reference page itself displays them AND they depict Mason Park content — if the
  reference shows another practice's photo (e.g. Livewell doctor), substitute the Mason Park
  equivalent and log it. Upload missing assets from local design packages via the assets tool if
  a needed image isn't on the site.
- Components with props: after a shared section is proven on its first page, convert it to a
  Webflow component and add client-editable props (text/link/image) following the site's naming;
  instance it on the sibling page. (Element inside a component def can't be componentized;
  a DOM span is text-bindable where a Webflow Span isn't.)
- SEO: copy each reference page's title/description onto its v2 page (from data_pages_tool
  metadata already captured), set the v2 pages `noindex` equivalent via robots meta only if the
  original had it — v2 pages stay DRAFT until QA passes, so they don't publish prematurely.

## Webflow API traps (paid for on earlier builds — do not rediscover)

- data_element_builder / element tools: TextBlock set_text can no-op at creation — verify text
  landed, write via element_settings key "text" when set_text no-ops. Stacked globals on
  set_style can drop — read the class stack back after setting. Instances can't anchor
  inserts/moves — reorder by re-appending siblings. update_style merges by property name — send
  longhands. get_styles returns base breakpoint only unless include_breakpoints. Write-echo is
  not proof: read back.
- Style tool requires top-level siteId + pageId.
- Do NOT publish the site. Publishing is a Phase 3 gate run by the orchestrator.

## The legacy-page edits — UNRESOLVED, and DO NOT REVERT without the user

The 2026-08-17 publish shipped changes to the legacy pages that no agent logged. Attribution was
chased twice and landed in different places; this is the settled account of the evidence.

**Extent (measured offline, `v2-reference/<slug>/page.html` vs `v2-legacy-after/<slug>/page.html`
— the pre- and post-publish states).** Only THREE pages differ in markup at all:
`/invisalign` (+1087 bytes), `/new-patient-special` (−42), `/new-patient-special-consultation`
(+10). `/invisalign-consultation` and BOTH thank-you pages are **byte-identical**. So R1 (the
missing `.imp-section-label` eyebrows) and R2 (the run-together address) are **CSS-only** — the
markup never moved — and they ride on the shared stylesheet, whose hash changed from
`dd596814c` to `0e3a1b8bc` with this build's styles.

**The markup deltas, verbatim:**
- em dashes deleted mid-sentence ("himself — without" → "himself without", "Katy — modern" →
  "Katy modern", "personally — from" → "personally from", "tray — that" → "tray that"), and in one
  place mangled to "----" ("PLACEHOLDER ---- this section needs")
- `<p class="landing-p1">` → `<p>` (class dropped)
- `code-embed-9` → `google-reviews` (a style RENAME, so it shows on both LPs)
- `<strong>Dental Crowns</strong><br/>` → `Dental Crowns<br/>`
- combos ADDED: `imp-section-label black`, `imp-section-label center white`,
  `landing-section-label version-2`
- `/invisalign` only: the two empty `story-vert w-video w-embed` divs filled with real `<img>`s
  (`dr-cho.jpg`, `Action-13-scaled.jpg`) plus a new `imp-hero-copy block` div
- `w-node-…` ids regenerated (`f6d5577a…` → `efb9cd70…`) — cosmetic, not content

**Why "a build agent did it" is NOT a safe conclusion.** That was inferred from the two filled
assets matching the NPS v2 agent's own choices. Against it:
1. `/new-patient-special` already read `lastUpdated 2026-08-17T12:39:43Z` on the FIRST
   `list_pages` call of this session — **before any build agent existed** (the first started
   13:28 UTC). Something outside this session was editing legacy pages today.
2. The two assets are the obvious ones for those two slots; a *mistargeted* write would not land
   neatly inside the only two empty media divs on the page.
3. Renaming a class to something meaningful, adding `black`/`white`/`version-2` colour combos,
   and dropping a `landing-p1` class are **coherent design work**, not the shape of accidental
   damage. Only the em-dash loss looks like damage (and this project has a documented UTF-8
   corruption gotcha).

**Therefore: do not revert any of it.** Reverting would destroy what is plausibly the user's or a
teammate's deliberate Designer session. It is the user's call, and it is queued for them.

**Rules this adds anyway, binding on every future agent** (the ambiguity is itself the lesson —
concurrent human Designer work and agent writes on one site are indistinguishable after the fact):
1. **Pass the target page id to every single element/style call and re-read it from your own
   notes each time.** Never carry a "current page" in your head across a long run.
2. **Before any write, assert the page id is your v2 page.** If a call needs the ORIGINAL page,
   it is a READ. There is no legitimate write to an original page in this task.
3. **"Originals untouched" is a claim that must be MEASURED, not asserted** — and measured on
   the originals' own content (text/classes/elements they already had), not by searching for
   your new classes.
4. Reading an original page to source an asset id or copy is fine. Writing what you learned back
   into it is not.

## Definition of done per page

- v2 page exists ("<Original Title> v2", slug "<original-slug>-v2", draft:true), full section
  stack built, all assets mapped, forms native, grids verified at all breakpoints by read-back.
- A build report at .tmp/v2/reports/<slug>.md: sections built, classes created (count) vs reused
  (count), grids + their breakpoint definitions, substitutions log, anything unreachable via API.
- PLAN.md State log appended (one line).
