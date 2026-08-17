# Reference Briefs — Grand Mission Dentistry landing pages

**Source Asana task**: `1217040406855578`. Captured 2026-08-05.

Per [ASANA-DISPATCH.md](../../../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing),
the references are a **wireframe and a content brief, not a visual target**. Structure and copy
angles come from here; the design is ours and must be built on the client's own brand tokens (see
[content-intake-summary.md](./content-intake-summary.md) §5).

---

## A. The originals from the other ad company

Retrieved from the Asana parent task as attachments (`gmd-implant-lp.html`, `gmd-cosmetic-lp.html`,
in `.tmp/originals/`). These are the closest thing to a brief that exists, and they are the pages
the client's traffic currently lands on. Built in GoHighLevel by "Digital Presence Matters".

### A1. `gmd-implant-lp.html` — single-tooth implant, $3,499

Title: *Single-Tooth Dental Implant $3,499 in Richmond, TX | Grand Mission Dentistry*

| # | Section | What it does |
| :--- | :--- | :--- |
| 1 | Utility bar + header | Address, click-to-call, logo |
| 2 | Hero + inline form | Offer headline "$3,499", 5 benefit ticks (free consult, free exam & X-ray worth $750, same-day implant, financing, PPO accepted), lead form right-hand side |
| 3 | Services grid | 6 icon cards — cosmetic, ortho, general, emergency, preventive, restorative |
| 4 | What implants are | Explainer paragraph + photo + "Schedule a Call" |
| 5 | Why implants win | 5 ticked benefits (look natural, don't hurt, easy care, keep mouth healthy, last a lifetime) |
| 6 | Candidacy | "Do I Need Dental Implants?" — causes of tooth loss, names Dr. Sung |
| 7 | Insurance & financing | 4 bullets + payment methods list (cash, check, cards, Alphaeon, LendingClub, CareCredit) |
| 8 | Doctor spotlight | Dr. William Sung, DMD + portrait + virtual consultation mention |
| 9 | Reviews | 2 five-star reviews, named |
| 10 | FAQ | 4 Q&As (preparation, cost, candidacy, how it works) |
| 11 | Final CTA | Offer restated + call button |
| 12 | Footer | Address, phone, full hours table |
| 13 | Sticky mobile bar | "Call Now" / "Book Now" |

**Lead form fields**: full name*, email*, phone*, message, consent checkbox*, honeypot
(`company_website`). No action endpoint — this is what "create the lead form in GHL" refers to.

Maps onto the Asana 7-section spec: 1→hero, 5→why implants, 6→eligibility, 7→financing matrix,
8+9→doctor spotlight & testimonials, 10→FAQ accordion, 9→reviews. The Asana spec drops the services
grid and the explainer, and asks for **preliminary procedures** (bone graft, gum graft, socket
preservation — currently buried in FAQ #1) to be promoted to its own section.

### A2. `gmd-cosmetic-lp.html` — cosmetic dentistry

Title: *Cosmetic Dentist in Richmond, TX | Grand Mission Dentistry*

| # | Section | What it does |
| :--- | :--- | :--- |
| 1 | Utility bar + header | Address, click-to-call, logo |
| 2 | Hero + inline form | "Your Trusted Destination for Cosmetic Dentistry in Richmond, TX" · "Free Second Opinion Available!" |
| 3 | Meet the doctors | Dr. William Sung, DMD + Dr. Van Nguyen, DDS, portraits + bios |
| 4 | Services grid | 6 SVG-icon cards — preventive, children's, cosmetic, smile makeovers, composite fillings, whitening |
| 5 | Boost your confidence | Local SEO body copy, names composites/veneers/Invisalign/whitening |
| 6 | Why choose us | 3 pillars — state-of-the-art technology, personalized care, experienced team |
| 7 | Patient gallery | "The Results Speak for Themselves…" — 8 real patient photos |
| 8 | Reviews | 3 five-star reviews, named |
| 9 | Final CTA | "Ready for a Confident, Radiant Smile?" + call button |
| 10 | Footer | Address, contact, hours |
| 11 | Sticky mobile bar | "Call Now" / "Book Now" |

Already matches the Asana 7-section spec almost 1:1, including the sticky mobile bar.

---

## B. https://start.smartarchesdental.com/?step=start

The house reference cited on **every** Brandklout landing-page task. A high-intent implant funnel.

| # | Section | Notes worth stealing (structurally) |
| :--- | :--- | :--- |
| 1 | Hero | Benefit headline, not a price. "Join over 20,000 patients…". Trust badge "1,200+ 5-Star Google Reviews", 3 benefit bullets incl. "Leave with Your Smile Same-Day" |
| 2 | **Multi-step qualification quiz** | 8 steps: ZIP → missing teeth count → priority → date → timeline → credit range → financing method → name/email/phone. CTA "See If I Qualify", "It takes less than 2 minutes!" |
| 3 | Credentials | "20,000+ Successful Implants Placed" + award badges + "Talk to a Patient Ambassador" phone CTA |
| 4 | Problem → solution | "You've Been Told No. We Specialize in Yes." — 4 pain points |
| 5 | Before/after gallery | 4 pairs |
| 6 | Why choose us | 3 pillars |
| 7 | **Comparison table** | Us vs "other implant centers" across 6 dimensions (complex cases, same-day, success rate, warranty, appointment count, sedation) |
| 8 | Services | 6 cards |
| 9 | Solutions | 3 cards with 3D renders |
| 10 | Process | 3 steps |
| 11 | Locations | 6 links + map |
| 12 | Stats + 6 named reviews | "Your story could be next." |
| 13 | FAQ | 8 Q&As incl. a 4-step financing application breakdown |
| 14 | Final CTA | "Your Permanent Smile Starts Here" · financing "as low as $9/day" |

**The transferable idea**: the quiz *is* the lead form. Progressive profiling converts far better
than a 4-field block, and it collects the qualification data (missing teeth, timeline, credit band)
that a dental sales team actually needs. Ask before adopting — it changes what the GHL form must
accept.

## C. https://novismilerogers.com/

Same funnel shape, tighter. **7-step quiz**: condition → dentures/partials → primary issue → prior
evaluation → financing interest → credit range → contact. Consent checkboxes live in **step 1**, not
the last step. Then: credentials strip (35+ years / 3,000+ full-arch cases / 95%+ success rate) →
philosophy → before/after gallery (6 cases, "See Close-Up Detail") → 4-step journey → CTA →
location/hours → footer.

Copy angle worth borrowing: *"Free · No pressure · A real conversation about your options"* under
the final submit, and *"The right reconstruction. Not just the popular one."*

## D. https://go.voitdental.com/ *(cited only for Grand Mission)*

Price-anchored, direct-response, heavier. Single-screen 2-question qualification form rather than a
quiz. Sections: hero with struck-through price ($59,990 → $29,900) → "Featured In" logos → form →
package inclusions → **pain points** ("You've Suffered Long Enough. It Ends Now.") → before/after →
3 value props → 4-step process → **provider credibility** (9 specific credentials) → 3 named
testimonials → **urgency/scarcity** ("Why Decide Now? Because Every Day Matters") → financing
("as low as $299/month", lender named, "3 out of 4 approved instantly") → FAQ → final CTA with
scarcity ("Limited Spots Available!") → footer.

**Caution**: this page leans hard on scarcity and struck-through pricing. Grand Mission's own offers
($2,999 / $189 / $3,799) are modest by comparison, and health-claim puffery is a regulatory risk.
Take the *structure* — problem → proof → process → provider → financing → FAQ — and leave the
pressure tactics.

---

## Recommended section plan (synthesis)

**Implant LP** — Asana spec, with the reference funnel's proof rhythm:
hero + form · why implants · eligibility & preliminary procedures (bone graft, gum graft, socket
preservation) · insurance & financing matrix · Dr. Sung spotlight + testimonials · FAQ accordion ·
reviews + aggregate proof (1,700+ Google reviews, Nextdoor 2021–24, Healthgrades 2023) · sticky
mobile call bar · footer.

**Cosmetic LP** — Asana spec as written; the original already matches it. Upgrade: real patient
gallery uses the 8 downloaded photos, and "Why Choose" gets the aggregate award proof rather than
three generic pillars.

**Thank-you LP** — status banner ("Your request is in") · fast-track call box with the campaign
tracking number · 3-step what-to-expect timeline · practice details + map + hours + booking link.
Build once as a shared archetype; Mason Park has the identical 4-section spec.

## Version Control

Lightweight intake artifact. Follows [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
