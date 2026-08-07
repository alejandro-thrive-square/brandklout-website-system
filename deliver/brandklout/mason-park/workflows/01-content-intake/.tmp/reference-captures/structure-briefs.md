# Reference Structure Briefs — Mason Park Dental

**Source Asana parent task**: `1217040406855582`

Per [ASANA-DISPATCH.md](../../../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing),
the reference URLs are a **wireframe and a content brief only**. What follows is the extracted
section order and copy rhythm. None of the references' visual design — layout, type, colour,
imagery — is reproduced.

## Capture status

| Reference | For | Captured | Notes |
| :--- | :--- | :--- | :--- |
| `tulipdent.com/Beautifulsmile/invisalign-treatment-in-redlands/` | Invisalign | Yes | desktop + mobile + DOM |
| `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC` | New Patient Special | Yes | desktop + mobile + DOM |
| `greenspotcrossingsdentistry.com/lp/59-nps/` | New Patient Special | **No** | Cloudflare "Attention Required!" interstitial blocks headless capture. The GHL reference covers the same archetype, so this is not blocking. |

> [!IMPORTANT]
> The GHL preview reference is **not a generic template — it is a Grand Mission Dentistry page**
> (8620 Grand Mission Blvd, Richmond TX; phone (281) 789-8836). Grand Mission is the sibling client
> in this same Asana batch. Two consequences: its `$189` offer, its insurance list and its hours are
> *Grand Mission's*, not Mason Park's, and must not be copied across; and the thank-you/NPS
> archetypes really are shared across the two clients, which is why they are being built once.

---

## Invisalign — structure brief

Reference section order (tulipdent):

1. Announcement bar — campaign window + headline saving
2. Header — address, phone, aggregate review stars
3. Hero — savings headline, stacked "free" extras, single CTA
4. Aggregate review proof (two platforms)
5. Three value pillars — experience / 3D technology / personalised approach
6. Testimonials
7. Affordability — payment plans, third-party financing, employer benefits
8. Before & after gallery
9. Repeat offer band + **staged qualifying question** ("When do you want to start?")
10. Meet the doctor — long bio, credentials
11. Patient review
12. Why choose Invisalign — eight benefit tiles
13. FAQ accordion
14. Footer

**Copy rhythm**: saving-led headline → free-stack risk reversal → credibility → proof → price
objection handled → low-commitment micro-conversion → authority → objection FAQ → close.

**What carried over to our build**, all populated with Mason Park's own content:

| Reference beat | Our section | Mason Park content used |
| :--- | :--- | :--- |
| Announcement bar | Offer bar | `$1,000 off Invisalign` + prepay `$500` |
| Hero savings | Hero + price card | `$4,800 → $3,800`, real free stack |
| Value pillars | Why Mason Park | Client's own four differentiators |
| Testimonials | Reviews | Real Google reviews with real names |
| Affordability | Investment section | Real price ladder, Cherry 0% APR |
| Before & after | **Dropped** | No real before/after images exist. Fabricating or stock-swapping patient results is out of the question, so the slot is filled by the client's real three-step virtual consult instead. |
| Staged question | Staged form step 1 | "When would you like to start?" gate before contact fields |
| Meet the doctor | Dr. Sung | Real bio + credentials |
| Benefit tiles | Six bite problems + six benefits | Client's own Invisalign copy |
| FAQ | FAQ accordion | 8 of the client's own 21 real Q&As |

---

## New Patient Special — structure brief

Reference section order (GHL preview):

1. Hero — `$189 New Patient Special`, one line of promise, CTA
2. Review bar — rating + count
3. Community award panel
4. Offer card — price, itemised inclusions, exclusion fine print
5. Doctor credibility — photo, short bio, four credential ticks
6. Testimonials (lorem ipsum in the reference)
7. Insurance carriers
8. Services grid
9. Closing CTA
10. Offer terms & conditions (long legal block)
11. Hours / contact / map
12. Sticky offer bar

**Copy rhythm**: price-first hero → social proof → itemised value → who treats you → proof →
"my insurance works here" → breadth of care → close → legal.

**Deviations and why**:

- **Community award panel dropped.** That is Grand Mission's "Voted Neighborhood Favorite" award.
  Mason Park has no such award on record and claiming one would be fabrication.
- **Testimonials replaced with real ones.** The reference ships lorem ipsum; we have six real
  Google reviews.
- **Insurance carrier logos dropped, section kept.** The nine carriers listed are Grand Mission's.
  Mason Park's own site says only that it is an "insurance-friendly office with financing options",
  so the section says exactly that, plus Cherry financing, which is on Mason Park's site.
- **Review count not claimed.** The reference asserts "1,700+ reviews". Mason Park's widget exposes
  a 5.0 rating but no total, so only the rating is shown.
- **Offer T&Cs rewritten** against Mason Park's own stated terms rather than copied — the
  reference's block contains state-specific Delta Dental and Tricare clauses belonging to a
  different practice.

---

## Thank-you page — spec, no reference

No reference URL. Asana gives a verbatim four-section spec, and it is identical to Grand Mission's:

1. Immediate Status Banner
2. Fast-Track Immediate Call Box (High-Intent Prompt)
3. What to Expect (3-Step Timeline)
4. Practice Details & Location Map

Built as the **shared archetype** for both clients: one structure, one stylesheet, client-specific
values isolated to a small constants block at the top of `assets/site.js`. Mason Park's variant
additionally needs the GHL call-tracking number in the call box — see Open Questions.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
