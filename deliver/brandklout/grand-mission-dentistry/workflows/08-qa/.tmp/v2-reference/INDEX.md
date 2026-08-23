# v2 reference — the six live Grand Mission ads landing pages, captured 2026-08-18

Captured read-only from `https://grandmissiondentistry.webflow.io/ads-landing-pages/<slug>`
with `capture.mjs` (headless Chrome, reduced motion, settle-on-height, 70 s between pages).
**This capture set is the spec for the v2 rebuild** — there is no local HTML package for these
six pages (see `07-webflow-build/.tmp/v2/PLAN.md`).

Per slug: `page.html` · `1440.png` / `768.png` / `390.png` · `content.json` · `metrics.json` ·
`outline.json`. Readable filmstrips of the tall captures are in `../sheets/`.

`outline.json` (from `outline.mjs`) is what the build is authored from: per `<section>`, the
ordered headings / paragraphs / list items / images / links / videos, with the **Webflow asset
id parsed out of every image URL**. Class names in `page.html` are converter output and must
not be carried into v2.

## Capture summary

| slug | sections | text runs | images | videos | body 1440 / 768 / 390 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| cosmetic | 12 | 212 | 23 | 7 | 13734 / 15653 / 21764 |
| cosmetic-consultation | 5 | 43 | 2 | 4 + 1 form iframe | 2912 / 3050 / 4239 |
| cosmetic-thank-you | 7 | 107 | 2 | 0 | 4862 / 5720 / 8080 |
| dental-implants | 12 | 209 | 23 | 7 | 13461 / 15217 / 20925 |
| dental-implants-consultation | 5 | 43 | 2 | 4 + 1 form iframe | 3025 / 3078 / 4239 |
| dental-implants-thank-you | 7 | 107 | 2 | 0 | 4862 / 5720 / 8080 |

All **54 image slots across all six pages resolve to assets already on the site** — no uploads
are needed. `07-webflow-build/.tmp/v2/assets-by-id.json` maps id → name/url (1,091 assets).

The two landing-page captures at 1440 and 768/390 were auto-downscaled 0.5× by Chrome because
of their height (720×6867 for a 1440×13734 page). Layout reads fine; for exact copy use
`outline.json` / `page.html`, not the pixels.

## Page skeletons (identical between each pair — one class family per pair)

**Landing pages** (`cosmetic` ≡ `dental-implants`, 12 sections):

| # | section | what it is |
| ---: | :--- | :--- |
| 0 | header | blue bar: logo · phone · Referring Doctors · "Book Online" pill |
| 1 | hero | blue; eyebrow, 5-star pill, h1 (white + sky accent), lead, 3-item tick list, two CTAs; right = white "Start Your … Consultation" card (the LeadConnector form slot on the live page) |
| 2 | journey | before/after comparison figure, "Life Before" (navy) / "Life After" (white) cards, 4 chapter cards (photo + navy caption 01–04), CTA |
| 3 | difference | cream; 4 value cards + a row of 3 "patient story" YouTube videos + CTA |
| 4 | specialist | doctor video + copy, 4 credentials with check icons, gold-rule pull quote, 4-photo strip |
| 5 | options | cream; 3 treatment cards, each photo + h3 + copy + a 4-row spec table |
| 6 | how it works | copy + video, 3 numbered steps, CTA |
| 7 | gallery | cream; "Real Patients. Real Results." + 4 before/after images + CTA |
| 8 | space | copy + 6-image office collage |
| 9 | faq | 7 accordion rows (native Dropdown in v2) |
| 10 | final CTA | blue; h2, lead, video, CTA, phone + hours line |
| 11 | footer | navy; practice block, Privacy / Terms, copyright, disclaimer |

**Consultation pages** (5 sections): header · hero (blue, eyebrow + rating pill + h1 "Book Your
Free Consultation" + lead + "No cost, no obligation" pill + doctor micro-bio; right = the form
card) · proof ("Hear From Our Patients" + 4 patient videos + CTA + disclaimer) · closing navy
band with a giant watermark word · footer.

**Thank-you pages** (7 sections): header · hero (avatar, eyebrow, h1 "Let's Talk About Your New
Smile", call CTA, star line) · "What happens next" two-column (3 numbered steps | "what can
happen if treatment is delayed") + green reassurance bar · "Why …?" 3 cards · FAQ (7 rows) ·
blue rounded CTA band with CALL / VISIT / HOURS · footer.

## What the reference gets WRONG — correct these in v2 (see BUILD-POLICY.md)

Measured, not inferred:

| Page(s) | Defect | Correction |
| :--- | :--- | :--- |
| both thank-you | `tel:(703)844-2975` and "Call (703) 844-2975" ×3 — Livewell's number | (281) 789-8836 · `tel:+12817898836` |
| both thank-you | VISIT block "9027 Silverbrook Rd Ste. F / Fairfax Station, VA 22039" + its maps link | 8620 Grand Mission Blvd Ste E, Richmond, TX 77407 |
| both thank-you | HOURS "Mon & Tue 8am-5pm / Wed & Thu 8am-4pm / Fri 8am-1pm" — Livewell's | Mon 9–7 · Tue–Wed 10–8 · Thu–Fri 8–6 · Sat 8–3 |
| both thank-you | "Dr. Chris, a Kois Center graduate…", "with Dr. Chris scheduled today" | Dr. William Sung, DMD, with the credentials the LPs already state |
| both thank-you | "our Fairfax Station practice" | "our Richmond practice" |
| both thank-you | "Why Grand Mission **Dental**?" | "Why Grand Mission Dentistry?" |
| both thank-you | "320+ five star reviews" (Livewell's count) | the count the LPs use (1,800+ / 4.9 on Google) |
| cosmetic-thank-you | the whole FAQ is **implant** copy incl. "$1,900 to $2,800" pricing | a cosmetic FAQ sourced from the cosmetic LP |
| both consultation | form-card title "Start Your **Implant** Consultation" on the cosmetic funnel | per-funnel title |
| both consultation | portrait `alt="Dr. Chris Kim, Livewell Dental"` (the asset is already Dr. Sung) | correct alt |
| both consultation | "Every case shown is a real **Livewell Dental** patient." | "…a real Grand Mission Dentistry patient." |
| both consultation | closing band eyebrow "why others chose **livewell dental**" | "why others chose Grand Mission Dentistry" |
| both landing | before/after alts "…at Livewell Dental" | "…at Grand Mission Dentistry" |
| dental-implants | hero eyebrow reads "— COSMETIC DENTISTRY" on the implant page | "— DENTAL IMPLANTS · RICHMOND, TX" |
| all six | `href="tel:(281)789-8836"` (malformed) and bare `#` CTA hrefs | `tel:+12817898836`; CTAs point at the funnel's consultation page |

## Elements that look like custom code and are NOT

- The seven "empty white boxes" on each landing page are **YouTube embeds**
  (`youtube.com/embed/…`), not broken images. `data_element_builder` exposes a native
  `YouTubeVideo` type, so they are rebuilt natively.
- The **only** genuine custom-code embed is the consultation pages' lead form
  (`api.leadconnectorhq.com/widget/form/WFEJsiC2yvdshNv2`). v2 replaces it with a native
  Webflow form — see BUILD-POLICY.md.
