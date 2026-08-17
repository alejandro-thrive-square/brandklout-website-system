# v2 rebuild — client-first / Relume rebuild of all 6 Mason Park landing pages

Task source: user /loop directive 2026-08-17. Asana GID 1217040406855582 (never write to Asana).
Site: Mason Park Dental `6a60bdc0340e5f1784b4d553` · staging https://mason-park-dental.webflow.io
Reference kit: Kit Foundation V1 `6a7a804cfed7e6e46272c6b0` (READ-ONLY — analyze, never modify).

## Target pages (existing → new v2 page)

| live page (reference) | page id | v2 page to create | local source |
| :--- | :--- | :--- | :--- |
| /new-patient-special | 6a75f468bfddad669aaf8321 | New Patient Special v2 · `new-patient-special-v2` | 04-design/.tmp/new-patient-special |
| /new-patient-special-consultation | 6a7f1882b7aaf05bf6f69c5d | … v2 | NONE — live page is the spec |
| /new-patient-thank-you | 6a75f468c490cc1bb6fa6a8c | … v2 | 04-design/.tmp/thank-you |
| /invisalign | 6a75f467c7c9e1a0c133edd1 | … v2 | 04-design/.tmp/invisalign |
| /invisalign-consultation | 6a7f18cd26274c520455c672 | … v2 | NONE — live page is the spec |
| /invisalign-thank-you | 6a7a4f3d7d446f7564911a62 | … v2 | NONE — live page is the spec |

Also on site: Home (brand moodboard, untouched), Style Guide draft `6a7f58bc25329234377bb1cf`
(created 2026-08-14 — audit before assuming anything).

## Rules (from the user, binding)

- NEW blank pages named "<Title> v2"; do not touch the originals.
- Client-first naming (finsweet.com/client-first) + Relume conventions as used by Kit Foundation V1.
- Reusable classes and components; variables for the token layer.
- NO custom-code elements (HtmlEmbed) and NO page-settings custom code. (Site-level code already
  installed predates this task; do not add to it.)
- Responsive parity with the reference at Webflow's canonical breakpoints.
- All assets uploaded/mapped (most already exist on the site — reuse by asset id, never re-upload dupes).
- Double-check grid components — known weak spot.
- v2 pages must visually equal the reference pages.

## Phases

0. RECON (parallel agents) → kit-foundation-spec.md, mason-park-audit.md, reference/ captures. DONE-when: all three artifact sets exist.
1. FOUNDATION: variable collection + base client-first class system on Mason Park (mirroring Kit
   Foundation patterns, themed to the moodboard palette already live). Style Guide draft page may
   already hold this — audit decides create vs adopt.
2. BUILD: one page at a time via data_element_builder onto the v2 pages; shared classes only;
   components for repeating sections (footer, offer rail, form block…) with client-editable props.
3. QA: per-page screenshot diff vs reference at 1440/991/767/478 + grid inspection + publish staging.

### Phase 3 procedure (decided 2026-08-17)

Draft pages are EXCLUDED from publishing, so a staging screenshot diff requires flipping each v2
page to `draft:false` first. Order:
1. Flip the 6 v2 pages draft:false.
2. `publish_site` with `publishToWebflowSubdomain: true` and `customDomains: []` — staging only,
   never a custom domain (there is none on this site).
3. Capture each v2 page at 1440/768/390 with the same reduced-motion CDP harness as the reference
   run (`08-qa/.tmp/v2-reference/capture.mjs`), 60-75s between pages — the CDN throttles
   back-to-back runs and a throttled load looks exactly like a broken page (0x0 images, ~1000px
   body). Diff each against `08-qa/.tmp/v2-reference/<slug>/`.
4. LEGACY REGRESSION GATE (mandatory): re-capture the 6 ORIGINAL pages and diff them against the
   same reference captures — those captures are the pre-Phase-1 state, so they are the only
   before-picture of the shared body/h1 style changes. Any drift → weigh against
   `theme-rollback.json`.
5. Report + commit. Publishing is orchestrator-only; build agents never publish.

**API trap found doing step 1**: `bulk_update_pages` SILENTLY NO-OPS on `draft` — it echoed the
six pages back with `draft:true` unchanged and reported success. `update_page_settings`
(single-page) works. Read the flag back with `get_page_metadata` before trusting either; the
echo is not proof.

## State log

- 2026-08-17: plan written; recon agents launched.
- 2026-08-17: Mason Park audit DONE (see mason-park-audit.md). Verdicts: Relume Client-First v3 kit
  (~361 classes) + genuine Style Guide draft ALREADY INSTALLED 2026-08-14 but UNTHEMED (black
  buttons, default color-scheme-1, body tag still Montserrat 14px legacy). Variables ABSENT (empty
  Base collection). Components ABSENT (only Relume "Global Styles" embed). Live LPs use imp-*
  classes (NOT inv-/nps- — the old runbook is stale); consultations are a Livewell-copied
  patchwork (imp-/qz-/landing-/ty-/lw-*) with cross-client leakage to FIX in v2: portrait alt
  "Dr. Chris Kim, Livewell Dental", invisalign quiz says "Start Your Implant Consultation",
  missing noindex. Site head still has {{GHL_INBOUND_WEBHOOK_URL}} placeholder (report-only).
  Site-wide fluid rem engine + GSAP CDN + MPD runtime apply to v2 pages too — do not remove.
  824 styles total, 592 assets (manifest raw\mp-assets.json — includes other clients' assets,
  verify before mapping). Phase 1 is therefore: THEME the installed kit (create variable
  collection + retheme color/type per the live pages), not install one.
- 2026-08-17: Kit Foundation audit DONE (kit-foundation-spec.md + raw\kit-*.json). Same Relume
  v3.0 kit as Mason Park's install. Conventions: nesting page-wrapper > [Global Styles component,
  FIRST child — spacing/hide system dies without it] > navbar > main-wrapper > section_[page]_[name]
  > padding-global > container-large > padding-section-large; section-scoped classes
  [page]_[section]_[part]; is-* combos override deltas only; spacing = direction+size class pairs
  on wrapper divs; grids are native Grid elements (w-layout-grid) with section-scoped classes,
  3→2@991→1@767, gaps 2rem→1.5rem; variables: Primitives / Color Schemes / Typography / UI Styles,
  styles bind by variable id, retheme = repoint ~18 vars; type scale h1 3.5/3.25/2.5rem … text-size
  large 1.25 → tiny .75rem. Mason Park's kit copy has variables STRIPPED (clipboard paste bakes
  values) — Phase 1 recreates the 4 collections with live-brand values and rebinds core classes.
- 2026-08-17: Phase 1 THEMING agent launched: extract palette/type from the live served CSS,
  create 4 variable collections, rebind/retheme kit classes + button combos. Body-tag theming is
  allowed but flagged RISKY (shared with legacy pages) — post-publish screenshot diff of legacy
  pages is a mandatory gate before calling Phase 3 done. Captures at 4/6 meanwhile.
- 2026-08-17: Phase 1 DONE (see phase1-report.md). Live theme = Montserrat everywhere + cyan
  #00bde0 / ink #2e3634 (Fraunces loaded but consumed by NOTHING; Home moodboard published empty —
  LP CSS won). 46 vars in 4 new collections (ids in raw\mp-variables-created.json); body/h1 tags +
  13 kit classes rebound to vars, all read-back-verified; rollback in theme-rollback.json.
  Gotchas: h2-h6 TAG styles can't be created via API → Phase 2 must class every heading 2+ with
  heading-style-h*; duplicate style names shadow globals in update_style → rename-swap workaround.
- 2026-08-17: BUILD 1/6 DONE — New Patient Special v2 (page 6a830c8ce42f10b98239b594, draft).
  12 blocks, 94 globals + 9 combos created, ~26 kit classes reused, 5 shared components with
  props, 11 grids read-back-verified, zero HtmlEmbeds. Full detail + reuse manifest in
  reports\new-patient-special-v2.md. The agent's own task died on an ACCOUNT session limit after
  the build finished; the build itself is complete. VERIFIED separately: the original pages were
  NOT structurally touched (0 lp_* elements on the original NPS page) — their lastUpdated bumps
  are site-wide style edits, not content edits.
  Deviation to remember: data_element_builder exposes NO Grid element type → grid containers are
  Div Blocks with display:grid classes (CSS-identical). Input placeholders unreachable.
- 2026-08-17: BUILDS 2-6 launched in parallel (3 agents): invisalign-v2 (reuses lp_*), the two
  consultation twins (consult_* namespace), the two thank-you twins (confirm_* namespace).
  Namespace isolation is the concurrency contract: each agent owns exactly one prefix and treats
  the others' classes as read-only.
- 2026-08-17: Phase 2 builds 3+4 DONE — Consultation twins. New Patient Special Consultation v2 (6a834acd0129002247b0bdc7) + Invisalign Consultation v2 (6a834acd0129002247b0be52), both draft:true, 0 HtmlEmbeds. Shared consult_* family: 18 new globals, 24 kit/lp_* classes reused read-only, 0 new components (Global Styles + LP Hero Form Card + LP Footer instanced). Reference card was EMPTY (zero lead capture) -> native form card; Dr. Dave Cho + implant copy -> Dr. William Sung DMD + per-funnel titles; Livewell portrait alt -> Sung asset; tel:835: fixed; Elfsight 4.9/1,036 widget -> native 5.0/320+ wall. Invisalign footer disclaimer swapped to its own offer terms. FOLLOW-UP: neither page can get noindex headlessly (page-settings custom code forbidden) - set it in Designer before go-live. Reports: reports/new-patient-special-consultation-v2.md + reports/invisalign-consultation-v2.md.
- 2026-08-17: BUILDS 5-6 DONE — the two thank-you twins (Thank You New Patient v2
  6a834a8bf4cdf54280e41e08, Thank You Invisalign v2 6a834a8b1386f26df7743dde; both draft, SEO copied,
  zero HtmlEmbeds, grids read-back-verified). 41 confirm_* globals + 4 combos created on page 1 and
  reused wholesale by page 2, which created NO new classes. 4 new components in group "Thank You"
  (Confirm Header 8e687ba9, Confirm Why Band 996eb083, Confirm FAQ Item 852b1498 with Question/Answer
  props, Confirm CTA Band c973beb4 with Paragraph/CTA Label props); LP Footer reused, lp_*/consult_*
  read-only. Cross-client leakage fixed on both: Livewell phone (703) 844-2975 -> (281) 769-8878,
  Fairfax Station VA address + hours -> 21830 Kingsland Blvd #104A Katy TX + the practice's real hours,
  the implant "treatment delayed" scare column -> 04-design thank-you "The Preparation", and the
  7-item implant FAQ with $1,900-$2,800 pricing -> per-funnel FAQs ($189 special / Invisalign) sourced
  only from 04-design + the client site. Reference has NO map embed, so none was needed. Detail in
  reports\new-patient-thank-you-v2.md and reports\invisalign-thank-you-v2.md.
  NEW TRAP: data_element_builder's partial_success on an unknown class stack still CREATES the whole
  subtree while reporting no child_results -> rebuilding those children silently duplicates them.
  Never stack more than one existing combo pair per element; read the subtree back before rebuilding.
- 2026-08-17: Phase 2 build 2 DONE — Invisalign v2 (page 6a834bd6e2d926262c031aeb, draft) built as an exact
  twin of the nps v2 skeleton: ZERO new classes/components, all 5 LP components instanced with props,
  11 grids read back at 4 breakpoints, 0 HtmlEmbeds. Corrected 2 internal PLACEHOLDER strings (journey
  intro, credential 4), the porcelain-under-Invisalign card copy, and filled the two empty-video-embed
  image slots (doctor portrait, process photo). Flags: invisalign footer has Privacy Policy/Terms links
  the shared LP Footer cannot render without editing the twin; nps v2 dropped the journey eyebrow this
  page keeps. See reports/invisalign-v2.md.
- 2026-08-17: Phase 3 close-out DONE — QA fixes 6-10 applied + STAGING-ONLY republish + re-verify (see
  08-qa/.tmp/v2-verify/VERIFY-REPORT.md). #7 portrait: Action-7 shows a team member not Dr Sung AND the
  nps twin showed Dr Cho under Dr Sung copy — uploaded the practice's own 1920x2560 original
  (asset 6a835bfc77d0c7b6e1171c32) to both LPs, inv team strip restored to the reference arrangement.
  #8 LP Footer gained a legal-links row behind boolean prop 26c8e87c ("Show Legal Links", default false,
  true on inv only) — nps footer verified BYTE-IDENTICAL; Terms of Service ships as text not a link
  because the reference's own href was "#" and no Terms doc exists. #9 journey eyebrow added to nps.
  #10 lp_tour_image had NO aspect-ratio at all — added base 1.011 + combos is-tall 0.605 / is-short
  1.614 (the reference's own ratios): column spread 133px -> 5px, section 1125 -> 1105 on both LPs.
  #6 placeholders BLOCKED and proven so: 4 write routes rejected ("placeholder" not applicable /
  reserved attribute name / set_attributes internal error / element doesn't support text) and the
  settings enumeration exposes only domId, visibility, name, required, type, attributes — Designer edit
  needed on the LP Hero Form Card (fixes all 4 pages at once). Assertions: widest box @390 = 390 with 0
  offenders on all four FAQ pages (was 546/517/557/521) and 390 clipped on both consultation pages;
  consultation h1 white at 6.68:1 (was 1.86:1); zero missing text runs and 0 bad hrefs across all six
  pages. NEW TRAP: the overflow assertion must use documentElement.clientWidth AND intersect each box
  with its overflow-x ancestors — a raw box walk re-reports the intentionally-clipped
  consult_proof_watermark as a 2138px offender. NEW TRAP: publishing invalidates the CDN, so the first
  capture after a publish reports images at 0x0/complete:false and collapses section heights (invisalign
  journey read 726px short) — warm the image URLs and re-capture.
