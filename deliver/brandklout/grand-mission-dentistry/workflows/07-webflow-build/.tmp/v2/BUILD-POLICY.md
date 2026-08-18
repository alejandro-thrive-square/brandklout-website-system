# v2 build policy — binding rules for the Grand Mission v2 rebuild

Read `PLAN.md` first. This file resolves the conflicts between "v2 equals the reference" and
what the captures found on the live pages. It is the Grand Mission instance of
`bk-mason-park/.../07-webflow-build/.tmp/v2/BUILD-POLICY.md`.

## Parity target

The visual / layout / responsive spec per page is the capture set in
`workflows/08-qa/.tmp/v2-reference/<slug>/` (screenshots 1440 / 768 / 390 + `content.json` +
`metrics.json` + `page.html`). **Work from the screenshots and the content inventory, not from
the live pages' markup or class names** — that markup is converter output (`imp-*`, `csm-*`,
`landing-*`, `ty-*`, `qz-*`) and importing its names or structure defeats the whole task.
`page.html` is kept only to look up asset URLs, hrefs and exact copy strings.

## Practice facts — the only values allowed on these pages

Verified from the client's own site JSON-LD (`01-content-intake/.tmp/live-site/home.html`) and
the approved campaign package (`docs/grand-mission-campaigns/`):

| Fact | Value |
| :--- | :--- |
| Practice | Grand Mission Dentistry (alt: Grand Mission Dentistry of Richmond) |
| Address | 8620 Grand Mission Blvd Ste E, Richmond, TX 77407 |
| Phone | (281) 789-8836 · `tel:+12817898836` |
| Map | https://www.google.com/maps?cid=18290029559889421670 |
| Doctors | Dr. William Sung, DMD · Dr. Van Nguyen, DDS · Dr. Tam Nguyen, DMD |
| Hours | Mon 9:00–19:00 · Tue–Wed 10:00–20:00 · Thu–Fri 8:00–18:00 · Sat 8:00–15:00 · Sun closed |
| Areas served | Richmond, Sugar Land, Katy, Fulshear, Rosenberg TX; Mission Bend; 77407 |

## Content-correction policy (overrides pixel parity)

These six pages are a **Livewell Dental** template (Fairfax Station, VA) rebranded for Grand
Mission and incompletely adapted — the same lineage as Mason Park's six. v2 keeps the DESIGN
and corrects the leakage. Rules:

1. NEVER invent facts, testimonials, statistics, pricing or credentials. Every substitution
   must come from a verifiable Grand Mission source in this repo:
   - `docs/grand-mission-campaigns/` — approved campaign copy (offers, doctor, address, FAQ).
   - `01-content-intake/.tmp/live-site/home.html` + `.tmp/originals/` — the practice's own site.
   - `04-design/.tmp/{implant,cosmetic,thank-you}-landing-page/` — approved Grand Mission
     journey copy (different design, but the FACTS in it are client-approved).
2. Measured leakage to correct (from the 2026-08-18 captures):

   | Page | Leak | Replace with |
   | :--- | :--- | :--- |
   | both thank-you | `tel:(703)844-2975` / "Call (703) 844-2975" ×3 | (281) 789-8836 / `tel:+12817898836` |
   | both thank-you | "9027 Silverbrook Rd Ste F, Fairfax Station VA 22039" + its maps link | 8620 Grand Mission Blvd Ste E, Richmond TX 77407 + the cid map link |
   | both thank-you | "our Fairfax Station practice" | "our Richmond practice" |
   | both consultation | portrait `alt="Dr. Chris Kim, Livewell Dental"` (the asset is already Dr. William Sung DMD) | `alt="Dr. William Sung, DMD at Grand Mission Dentistry in Richmond, TX"` |
   | both consultation | "Every case shown is a real Livewell Dental patient." | "Every case shown is a real Grand Mission Dentistry patient." |
   | both landing | before/after `alt="Smile before/after treatment at Livewell Dental"` | the Grand Mission equivalent |
   | all six | malformed `tEl: ` / `tel:(281)789-8836` hrefs (3 per page) | `tel:+12817898836` |

   Re-scan before declaring a page done: `grep -oiE "livewell\|fairfax\|silverbrook\|chris kim\|703\) 844-2975" ` over the published v2 HTML must return **zero**.
3. Every substitution gets one line in the page's build report: reference said X → v2 says Y →
   source of Y.

## Forms — no custom code allowed

The reference pages' lead capture is an Elfsight/LeadConnector embed
(`elfsight-app-6e983c99-…`). v2 pages may NOT contain HtmlEmbeds or custom code. Therefore:

- Build NATIVE Webflow forms styled with the kit's `form_*` classes, visually matching the
  reference form card (same fields as `content.json`'s `forms` entry, same layout).
- Consultation form action → redirect to the matching v2 thank-you page.
- Lead delivery to the client's CRM is out of scope here; note it in the report.
- Known trap: field **placeholder** text and **select options** are unreachable via the element
  tools; Webflow's default placeholder is the literal string "Example Text", so *unset means
  visibly wrong*. Set what is reachable, list what is not in the report, and flag it for a
  Designer pass.

## Structure rules (Relume / Client-First)

- Page skeleton: `page-wrapper` > [**Global Styles** component instance
  `ab488b17-f25a-fbf8-5f54-4a3955eb57e5` — FIRST child, mandatory; the kit's spacing and hide
  systems die without it] > `main-wrapper` (main) > sections.
- Section pattern: `section_[family]_[name]` (Section tag, marker class) > `padding-global` >
  `container-large` > `padding-section-large` > content.
- Class families — one prefix per page pair, and a class is page-specific only if the section
  genuinely exists on one page alone:
  - `lp_`      — Cosmetic Dentist + Dental Implants
  - `consult_` — both consultation pages
  - `confirm_` — both thank-you pages
- **No Webflow Components are created in this pass** (user instruction). Sections that would
  become components later are built as flat, self-contained class stacks so the conversion is
  mechanical when it is authorised.
- Headings: `h2`–`h6` TAG styles are not creatable via the API, so put the matching
  `heading-style-h*` class on EVERY heading of level 2+.
- Reuse the kit's globals (`heading-style-*`, `text-size-*`, `text-weight-*`, `text-color-*`,
  `background-color-*`, spacing pairs, `container-*`, `padding-*`, `button` + `is-*`, `form_*`,
  `max-width-*`, `hide-*`) before creating ANY new class. New classes only for section-scoped
  layout, named `[family]_[section]_[part]`.
- Combos are `is-*` and override deltas only. Never fork a kit class.
- **GRIDS (known weak spot).** Every multi-column layout gets a section-scoped class carrying
  `grid-template-columns` + gaps with explicit breakpoint collapses matching the reference
  screenshots (typically 3→2 @991 →1 @767). `data_element_builder` exposes no Grid element
  type, so grid containers are Div Blocks with `display:grid` classes (CSS-identical). After
  building each grid, READ THE STYLE BACK at every breakpoint and verify child placement — a
  create that echoes success is not proof.
- Spacing via `margin-bottom margin-small`-style wrapper pairs, not margins on text elements.
- Colours/typography via the themed kit classes and variables. Do not hardcode a hex where a
  Primitives token exists; add the missing `brand/lp-*` tokens (Phase 1) instead.
- Assets: reuse existing site assets by id (the reference `content.json` `images` list gives
  the exact CDN URL per slot; map URL → asset id). Upload only what is genuinely missing.
- SEO: already set on the v2 pages at creation. v2 pages stay `draft:true` until QA.

## Webflow API traps (paid for on earlier builds — do not rediscover)

- `set_style` **drops the whole list silently** when two unrelated GLOBAL classes are stacked.
  Only `[base, its-combo, …]` chains apply, and every exact chain must exist as a style record.
  One layout class per element; merge container props into it.
- `data_element_builder` `set_text` works on Heading/Paragraph but **silently no-ops on
  TextBlock**. Write that copy afterwards with `data_element_settings_tool` `set_settings`
  key `text`.
- `partial_success` on an unknown class stack still CREATES the whole subtree while reporting
  no `child_results` — rebuilding those children silently duplicates them. Read the subtree
  back before rebuilding.
- `update_style` merges by property name — send longhands. `get_styles` returns the base
  breakpoint only unless `include_breakpoints` (an ARRAY of breakpoint ids, never a boolean).
- `data_style_tool` requires top-level `context` + `siteId` + `pageId`.
- Component instances cannot anchor inserts/moves — reorder by re-appending siblings.
- Element writes 429 after ~25 rapid calls — batch ≤10 and back off ~65s.
- `bulk_update_pages` **silently no-ops on `draft`**; use `update_page_settings` per page and
  read the flag back with `get_page_metadata`.
- `-webkit-font-smoothing` is rejected by `create_style` and fails the whole create.

## Writes are scoped to the v2 pages — this is absolute

1. Pass the target page id to every element/style call; re-read it from `v2/pages.json` each
   time. Never carry a "current page" in your head across a long run.
2. Before any write, assert the page id is a v2 page id. If a call needs an ORIGINAL page, it
   is a READ. There is no legitimate write to an original page in this task.
3. "Originals untouched" is a claim that must be MEASURED (the legacy regression gate in
   Phase 3), not asserted.

## Definition of done per page

- v2 page exists ("<Original Title> v2", slug "<original-slug>-v2"), full section stack built,
  all assets mapped, forms native, grids verified at all breakpoints by read-back, zero
  HtmlEmbeds, zero leakage strings.
- A build report at `.tmp/v2/reports/<slug>.md`: sections built, classes created vs reused,
  grids + their breakpoint definitions, substitutions log, anything unreachable via API.
- `PLAN.md` State log appended (one line).
