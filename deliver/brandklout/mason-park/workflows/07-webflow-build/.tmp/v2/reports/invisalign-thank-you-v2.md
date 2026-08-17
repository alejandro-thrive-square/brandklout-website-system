# Build report — Thank You Invisalign v2 (`invisalign-thank-you-v2`)

Page id **6a834a8b1386f26df7743dde** · created 2026-08-17 · draft: **true** (verified) · site 6a60bdc0340e5f1784b4d553.
SEO title/description copied verbatim from original page 6a7a4f3d7d446f7564911a62.
Twin of `new-patient-thank-you-v2` (page 6a834a8bf4cdf54280e41e08). **Read that report first** — it
holds the full `confirm_*` class manifest, the grid table and the component/prop ids. This page
creates **zero new classes and zero new components**: identical design, funnel-correct copy.
**Nothing was published.** Originals untouched.

## Sections built (top to bottom)

| # | Section | Marker / component | Built how |
|---|---|---|---|
| 0 | Sticky top bar | **Confirm Header** instance | reused, props at default |
| 1 | Light hero | `section_confirm_hero` | rebuilt natively with Invisalign copy |
| 2 | What happens next | `section_confirm_expect` | rebuilt natively (call steps differ per funnel; the "Before you come in" list and green banner are identical) |
| 3 | Why Mason Park Dental | **Confirm Why Band** instance | reused verbatim (identical on both pages) |
| 4 | FAQ | `section_confirm_faq` + 7 × **Confirm FAQ Item** instances | shell rebuilt, 7 instances with Invisalign props |
| 5 | Dark closer + contact | **Confirm CTA Band** instance | reused; `Paragraph` prop overridden |
| 6 | Footer | **LP Footer** instance | reused; `Legal Text` prop overridden |

Skeleton identical to the twin: `page-wrapper` > **Global Styles** (FIRST child) > **Confirm
Header** > `main-wrapper` (tag `main`) > sections > **LP Footer**.

## Classes / components

- **Created: none.** Every class on this page is a `confirm_*` or kit class created by the
  new-patient build, plus `lp_*` only inside the reused LP Footer component.
- **Components instanced**: Global Styles `f86f2f55-…`, Confirm Header `8e687ba9-…`,
  Confirm Why Band `996eb083-…`, Confirm FAQ Item `852b1498-…` (×7),
  Confirm CTA Band `c973beb4-…`, LP Footer `e7911d8c-…`.
- **Prop overrides on this page**:
  - Confirm CTA Band › Paragraph `116a2a95…9c4f` → *"Talk to the Mason Park team and get your
    complimentary Invisalign® consultation scheduled today."*
  - LP Footer › Legal Text `891a777d…583d` → Invisalign offer wording (see substitution 8).
  - Confirm FAQ Item › Question/Answer ×7 (see substitution 7).
- `lp_*` and `consult_*` class definitions: **read-only, none edited.**

## Grids

Same six `confirm_*` layout classes as the twin; the definitions were read back once (shared
classes, single source) and match the table in `new-patient-thank-you-v2.md`:
`confirm_expect_grid` 2col → 1fr @767; `confirm_why_grid` 3col → 1fr @991;
`confirm_contact_grid` 3col → 1fr @991. Grid containers are display:grid Div Blocks (no Grid
element type in `data_element_builder`).

## Substitution log (reference said X → v2 says Y → source of Y)

The two reference thank-you pages are **text-identical**, so substitutions 1–6, 11–13, 15 and 17 in
`new-patient-thank-you-v2.md` (phone, malformed tel:, Fairfax Station address, Livewell hours,
"Fairfax Station practice", the delayed-treatment scare column, the three Why cards, the
"Dr. Chris Kim, Livewell Dental" avatar alt, the no-map finding) apply here **identically and were
applied identically** — the shared components carry them. Below are the deltas unique to this page,
i.e. where the two v2 pages deliberately diverge because the reference did not split the funnels.

1. Hero badge **"You may be a candidate for implants"** → **"✦ You may be a candidate for
   Invisalign®"** → this is the Invisalign funnel (04-design/.tmp/invisalign).
2. Hero lead **"…get your complimentary on the calendar"** (broken sentence) → **"…get your
   complimentary Invisalign® consultation on the calendar"** → 04-design invisalign
   ("The consultation costs nothing…"); the free Invisalign® consultation is also listed as a
   standing offer in 04-design new-patient-special.
3. Call step 1 **"Dr. Cho reviews which path fits, from a single implant through to a full arch"**
   → **"We take down what bothers you about your smile, and the doctor reviews whether clear
   aligners are the right treatment for your bite at all"** → 04-design invisalign
   ("…including whether clear aligners are the right treatment for your bite at all" and
   "Tell us what bothers you about your smile").
4. Call step 2 **kept verbatim** — insurance/financing wording is funnel-neutral and true
   (04-design invisalign: many plans include Invisalign® benefits; flexible financing available).
5. Call step 3 **"A no cost assessment with a 3D scan at our Fairfax Station practice"** →
   **"A no cost Invisalign® consultation at our Katy practice on Kingsland Blvd, with a detailed
   treatment plan and cost breakdown given to you before any treatment begins"** → 04-design
   thank-you Chapter 05 (Katy address) + 04-design invisalign FAQ ("A detailed treatment plan and
   cost breakdown are provided before treatment begins").
6. Section lead **"…and why acting now matters"** → **"…and how to be ready for your visit"** —
   follows from replacing the delayed-treatment column with "Before you come in" (same as the twin).
7. **7-item implant FAQ with $1,900–$2,800 implant pricing** → the practice's **own 8-question
   Invisalign® FAQ**, 7 of which are used to keep the reference's item count:
   treatment length · is it painful · who is a good candidate · eating and drinking ·
   insurance coverage · knowing the cost before starting (merged with the financing answer) ·
   retainers (Vivera® included) → **04-design/.tmp/invisalign/index.html, "The questions we are
   asked most", verbatim**. The 8th source question ("Are payment plans available?") was folded
   into the cost question rather than dropped. **No implant pricing was carried over.**
8. Footer legal (new-patient-special wording on an Invisalign funnel) → Invisalign wording:
   *"…The Invisalign® offer is $1,000 off treatment, with a further $500 off when you prepay; a
   detailed treatment plan and cost breakdown are provided before treatment begins…"* → 04-design
   invisalign ("$1,000 off, and $500 more if you prepay").
9. Closer paragraph **"…complimentary consultation with Dr. Cho scheduled today"** → **"…get your
   complimentary Invisalign® consultation scheduled today"** → same source as 2.
10. Avatar: same asset as the twin (`6a75f6f477131cf728cb0074`, `dr-cho.jpg`, alt "Dr. Dave Cho,
    general dentist at Mason Park Dental in Katy, TX"). Dr. Cho is the doctor the practice's own
    site pairs with Invisalign content (site asset
    `EverythingYouNeedtoKnowAboutInvisalignTreatmentwithDr.DaveCho.jpg`), so the shared chip is
    correct on this funnel too.

Kept verbatim from the reference (Mason Park's own): "320+ five star reviews", "★★★★★",
"A quick two minute call to talk through your options.", the "No cost, no obligation." banner,
h1 "Let's Talk About Your New Smile", h2 "We Are Dedicated To Getting You Your New Smile",
"Why Mason Park Dental?", "Any Questions Before You Call?", "Ready to take *the next step*?",
and the footer's Katy address / serving line / ©.

## Unreachable via API / deviations

Identical to the twin: no Grid element type; h2+ headings carry self-styling classes because h2–h6
tag styles cannot be created headlessly; FAQ is a native Dropdown whose "+" glyph is static; no
form on this page type (reference `forms: []`), so the GHL webhook blocker does not apply; no
element snapshots (Designer-bridge tool) — Phase 3 screenshot diff is the visual gate.

## Verification

- Full tree read back: Global Styles first child of `page-wrapper`; order header → hero → expect →
  why → faq → cta → footer; `main-wrapper` tagged `main`.
- Placeholder sweep: `String "Heading"` → 0, `String "Lorem ipsum"` → 0 (one seeded lorem removed
  from the banner paragraph).
- **HtmlEmbed query returns 0.**
- Duplicate sweep: 1 × steps list, 1 × prep list, 1 × banner, 2 × eyebrows, 2 × h2s, 3 × step
  titles, 7 × FAQ instances — all correct (this page's builds all returned clean `success`, so the
  partial-build duplication trap from the twin did not recur).
- All 7 FAQ instances read back with `hasOverride: true` on both props.
- Page settings: draft **true**, SEO matches the original.
- No publish performed. Originals and `lp_*`/`consult_*` styles untouched.
