# v2-reference index — mason-park-dental.webflow.io (captured 2026-08-17)

Screenshots are reduced-motion (see README.md). Body heights from `metrics.json`
after the settle loop; sections/images/fields from `content.json` at 1440.

| Page | Body 1440 | Body 768 | Body 390 | Sections | Text runs | Images | Native form fields |
|---|---|---|---|---|---|---|---|
| /new-patient-special | 10976 | 15287 | 17421 | 11 | 202 | 27 | 0 (LeadConnector iframe) |
| /new-patient-special-consultation | 2187 | 2625 | 2870 | 3 | 26 | 2 | 0 (no form at all) |
| /new-patient-thank-you | 5481 | 6420 | 7692 | 5 | 98 | 2 | 0 |
| /invisalign | 10709 | 14948 | 17296 | 11 | 197 | 25 | 0 (LeadConnector iframe) |
| /invisalign-consultation | 2187 | 2625 | 2870 | 3 | 26 | 2 | 0 (no form at all) |
| /invisalign-thank-you | 5481 | 6420 | 7692 | 5 | 98 | 2 | 0 |

## Twin pages — the rebuild must not copy this

- **The two consultation pages are text-identical**, and **the two thank-you pages are
  text-identical** (0 diffs in every visible text run; only the `<title>` differs).
  They are one template each, not four pages — and the shared copy fits NEITHER funnel
  (it is implant copy, see below).

## Per-page notes a rebuilder must not miss

### /new-patient-special ($189 offer, "A Smile You'll Love In Every Photo")
- Sticky top bar: logo, phone, "Book a Consultation" pill (persists at all widths).
- Dark charcoal hero, 2 columns: copy + checkmark bullets left, white **LeadConnector
  form card (iframe)** right — the ONLY lead capture on the page; there is no native
  Webflow form. Iframe title: "Livewell Dental Google Cosmetic - Landing" (cross-client
  artifact from the Livewell partner account).
- Dark credibility stat band under the hero: 320+ reviews / UCSF / 5.0 / FAGD·FICOI / 1,300+.
- "From Hiding Your Smile To Living Well" journey chapter — GSAP-pinned on the live
  page (flattened in these captures): large clinic photo, LIFE BEFORE / LIFE AFTER
  checklist cards, then 4 dark patient-quote cards.
- "Why Patients Drive Past Other Cosmetic Dentists" 4-column differentiator grid.
- Review wall: "Overall Rating 4.9 (1,036)" bar + Write a Review button + Google
  review-card carousel (its off-screen slides are the 0x0 images in content.json).
- Doctor bio: big portrait of Dr. William Sung, credential bullets, pull quote; then a
  5-photo team strip.
- "From One Small Refinement To a Complete Smile": 3 treatment cards WITH PRICES
  (Whitening & Bonding / Dental Crowns / Invisalign).
- "Your Dental Work Shouldn't Look & Feel Like Dental Work": numbered 3-step process
  (Design & Digital Preview → Precision Preparation → Your Finished Smile) + photo.
- **Hidden section**: `imp-gallery` "Real Patients. Real Results." exists in the DOM
  but renders 0x0 (collapsed/hidden). Decide deliberately whether v2 keeps it.
- "A Space Designed For Your Comfort" office-tour photo grid; FAQ accordion
  ("Everything Patients Ask Before Booking"); final dark CTA "Stop Postponing The
  Smile You Actually Want"; footer + long legal disclaimer.
- Copy/alt artifacts: alts referencing "Livewell Dental" and one literal
  "Placeholder image - replace with a real Mason Park…" alt.

### /invisalign ($1,000 off, "Straighter Teeth. Nobody Has To Know.")
- Same 11-section skeleton and components as /new-patient-special with Invisalign
  copy: journey chapter "From Covering Your Mouth To Leading The Room", treatment
  cards = Whitening & Bonding / Invisalign Comprehensive / Smile Makeovers, process
  section "Clear Aligners Should Fix Your Bite, Not Just Your Front Teeth", final CTA
  "Stop Waiting On A Smile — You Could Start This Month".
- **Visual defect on staging**: the doctor-bio portrait frame and the process-section
  photo card render as EMPTY WHITE BOXES (the images never load at any width). The
  new-patient page shows photos in the same slots. v2 must supply real images here.
- Same LeadConnector iframe (same form ID), same hidden `imp-gallery`, same review wall.

### /new-patient-special-consultation and /invisalign-consultation (identical twins)
- Short 3-section page: dark hero "Book Your Free Consultation" with Dr. Dave Cho
  chip — but the white card is titled "Start Your **Implant** Consultation" and is
  **EMPTY: no form fields, no iframe, nothing in the DOM**. The page has no working
  lead capture. (Header phone link is also malformed: `tel:835:+12817698878`.)
- "Hear From Our Patients": rating bar (4.9, 1,036) + review carousel + a marquee
  strip reading "implants · comfort · craft".
- Dark closer "One Dentist, Start To Finish" with giant outline watermark word
  ("implants…") behind it; footer.
- Copy mismatches to fix in v2: implant copy on cosmetic/Invisalign funnels; hero
  names Dr. Dave Cho while the LPs feature Dr. William Sung; portrait alt says
  "Dr. Chris Kim, Livewell Dental"; "Mason park" casing errors.

### /new-patient-thank-you and /invisalign-thank-you (identical twins)
- Light page: avatar chip "You may be a candidate for **implants**", hero "Let's Talk
  About Your New Smile" with a big CALL button — **wrong practice's phone
  (703) 844-2975** (Katy is (281) 769-8878).
- "We Are Dedicated To Getting You Your New Smile": 3 numbered what-happens-on-the-call
  steps beside a red "what can happen if treatment is delayed" warning list; green
  "No cost, no obligation" banner. Mentions "our **Fairfax Station** practice".
- "Why Mason Park Dental?" 3 cards (Experience / Personalized Care / Clear Costs —
  says Dr. Cho, Tufts).
- 7-item **implant** FAQ accordion (pricing $1,900–$2,800 per implant quoted).
- Dark CTA "Ready to take the next step?" with Call / Visit / Hours columns — address
  **9027 Silverbrook Rd Ste. F, Fairfax Station, VA 22039** (another practice
  entirely; the footer below it has the correct Katy address).
- v2 must replace ALL of this: phone, address, implant copy, and split the two
  thank-you pages per funnel.

## Cross-page facts

- Lead capture everywhere is the LeadConnector (GoHighLevel) widget
  `api.leadconnectorhq.com/widget/form/6SUhknD0606Y66ZAgaZI` — zero native Webflow
  forms on any of the six pages. It painted in most captures but shows as a blank
  white card in some (async iframe).
- Mobile pages are 1.6x the desktop height on the LPs (17.4k CSS px at 390) — long
  scroll is part of the design.
- The live pages scroll-animate (GSAP pinning); these captures flatten that on purpose.
