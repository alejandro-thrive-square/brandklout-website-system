# Build report — Invisalign Consultation v2 (`invisalign-consultation-v2`)

Page id **6a834acd0129002247b0be52** · created 2026-08-17 · draft: **true** (verified) · site 6a60bdc0340e5f1784b4d553.
SEO title copied verbatim from original page 6a7f18cd26274c520455c672 ("Invisalign Consultation"); the original has **no** SEO description and none was invented.

**This is the TWIN of `new-patient-special-consultation-v2` (page 6a834acd0129002247b0bdc7).**
The two reference pages are text-identical (0 diffs in every visible text run; only `<title>` differs — see
`08-qa/.tmp/v2-reference/INDEX.md`). This build is therefore an exact structural clone: same 4-block skeleton,
same `consult_*` classes, same reused `lp_*` classes, same 3 component instances, same grids.
**Read `reports/new-patient-special-consultation-v2.md` for the full section table, class manifest, grid table,
substitution rationale, and the API traps.** Nothing there differs except the five items below.

## What differs from the twin (funnel-specific only)

| # | Item | New Patient Special v2 | Invisalign v2 (this page) | Source |
|---|---|---|---|---|
| 1 | Form card **Title** prop | "Start Your New Patient Consultation" | **"Start Your Invisalign Consultation"** | BUILD-POLICY §2 — the reference says "Start Your **Implant** Consultation" on **both** funnels |
| 2 | Proof-section watermark | "smiles · comfort · craft · …" | **"aligners · comfort · craft · …"** | reference said "implants · comfort · craft"; decorative ornament re-pointed at this funnel |
| 3 | LP Footer **Legal Text** prop | component default (= reference disclaimer, new-patient offer terms) | **overridden** with the Invisalign offer terms (see below) | `04-design/.tmp/invisalign/index.html` footer "Offer terms" |
| 4 | Page title / slug / SEO title | New Patient Special Consultation | Invisalign Consultation | original page 6a7f18cd26274c520455c672 |
| 5 | — | — | everything else byte-identical to the twin | reference twins are text-identical |

**Legal Text as set on this page** (every figure traceable to `04-design/.tmp/invisalign/index.html`):

> Individual results vary based on each patient's oral health and treatment needs. Nothing on this page is a diagnosis or a promise of a specific outcome. Offer terms: $1,000 off applies to all-inclusive Invisalign® treatment, reducing the regular $4,800 fee to $3,800. An additional $500 discount applies when treatment is prepaid in full, out of pocket. In-office and third-party payment plans are available. Individual treatment needs are determined at consultation; not all patients are candidates for clear aligners. A member of our team confirms full details when scheduling.

Rationale: the reference twin carries the **new-patient-special** disclaimer on the **Invisalign** funnel — a copy-paste
leak in its own right. Keeping it would have shipped new-patient offer terms under an Invisalign CTA.

## Sections built

Identical to the twin: `lp_header` (header, logo + phone, no CTA pill) → `section_consult_hero` (domId `quiz`) →
`section_consult_stories` → `section_consult_proof` → **LP Footer** instance. Skeleton read back:
`page-wrapper` > Global Styles instance (first child) > header > `main-wrapper` (main) > 3 sections > LP Footer.

## Classes

**Zero new classes created for this page.** It consumes the 18 `consult_*` globals created on the twin plus the same
24 reused kit/`lp_*` classes. No `lp_*` or `confirm_*` definition was read-modified — reuse only.

## Components instanced

| Component | id | Props set on this page |
|---|---|---|
| Global Styles | `f86f2f55-a6b5-a9dc-59f9-37a621e265f2` | — |
| LP Hero Form Card | `6b1624b8-c67b-714c-0d8e-6cc08d26bc44` | Title → "Start Your Invisalign Consultation"; Description → the page's own hero line |
| LP Footer | `e7911d8c-426d-0f93-35df-816cb86cfaa8` | Legal Text → Invisalign offer terms (above) |

Form definition re-verified through the instance: `FormForm` "Smile Consultation Form" with 4 required
`FormTextInput`s (First-Name text, Last-Name text, Phone tel, Email email) + textarea + submit.

## Grids (READ BACK VERIFIED)

Same two classes as the twin, verified at main/medium/small/tiny on the shared definitions:
`consult_hero_grid` `0.9fr 0.75fr` → `1fr` @991; `lp_reviews_grid` 3 → 2 @991 → 1 @767;
`consult_hero_card` overhang `-9rem` → `0` @991.

## Substitution log

Items 1–10 of the twin's report apply verbatim to this page (empty implant-titled card → native form;
Dr. Dave Cho → Dr. William Sung, DMD; Livewell portrait alt → Mason Park asset + alt; `tel:835:` → `tel:+1…`;
Elfsight 4.9/1,036 widget → native 5.0 / 320+ wall with 3 verbatim Mason Park reviews; carousel affordances
dropped; "Mason park" casing fixed; sage accent → Accent cyan; Relume shells replace ad-hoc widths).
Plus this page's own three: the card title, the watermark word, and the footer disclaimer (table above).

Note on the reference's known **invisalign-page image defects** (INDEX.md: doctor portrait and process photo render
as empty white boxes on `/invisalign`): those slots live on the **landing page**, not on this consultation page.
The only two images here are the logo and the doctor chip, both of which resolve.

## Unreachable via API / deliberate deviations

Same list as the twin, and it applies equally here:
- **No `noindex`** — the reference consultation pages lack it and page-settings custom code is forbidden.
  **Client-side follow-up for the orchestrator.**
- **Lead delivery not wired** — `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder is still in the site head (pre-existing
  client blocker). Nothing points at Livewell's LeadConnector form.
- **Card progress meter** and **hero radial glow** dropped (decorative / dead-quiz artefacts; the meter would be
  false UI on a plain form and would require editing another build's component definition).
- **Input placeholders** unreachable at creation (known trap).
- `attributes` cannot be set on a DOM element inside `data_element_builder`'s atomic `settings` — applied
  afterwards via `set_attributes` (watermark `aria-hidden="true"`, read back).

## Verification

- Full tree read back: order, `header`/`main`/`section` tags, `id="quiz"`, and all three component instances confirmed.
- Placeholder sweep: 3 × "Heading" strings removed; re-query returns 0 "Heading", 0 "Lorem ipsum".
- **HtmlEmbed count: 0.** No page-settings custom code added.
- Every heading ≥ h2 carries `heading-style-h2` or the self-styling `consult_proof_h2`.
- Page settings: **draft: true**. Nothing published. Originals and legacy styles untouched.

## New API trap learned on this pair (for later builds)

`data_element_builder`'s inline `settings` array accepts `key:"text"` on a DOM element, but **`key:"attributes"`
is rejected at creation** ("Setting \"attributes\" is not applicable to this element") — and the rejection kills
that child element while the parent still reports `partial_success`. Read the parent's children back after any
`partial_success`, then create the missing child without `attributes` and apply attributes with
`data_element_tool > set_attributes`.
