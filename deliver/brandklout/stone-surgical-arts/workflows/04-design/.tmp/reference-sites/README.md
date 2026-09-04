# Four aesthetic-practice home pages, read section by section

Captured 2026-09-01 at 1440×900, desktop, cookie/consent/chat overlays hidden (not accepted).
Re-run with `node capture.mjs <out-dir>` from the repo root — it needs `puppeteer-core` from the
root `node_modules` and Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`.

Per site: `NN.png` are 900px viewport slices top to bottom, `full-page.png` is the whole page in one
image, `text.txt` is the rendered copy, `outline.txt` is the section geometry.

| folder | site | page height |
| :--- | :--- | ---: |
| `nassif/` | drpaulnassif.com | 14,055px |
| `nassifmd-medspa/` | nassifmdmedspa.com | 13,880px |
| `maercks/` | themaercksinstitute.com | 8,042px |
| `nipandtuck/` | drnipandtuck.com | 17,211px |

---

## 1. drpaulnassif.com — the surgeon as the brand

1. **Utility bar** — sibling-brand switcher (Plastic Surgery / Medspa / Español) + location link.
2. **Navbar** — About, Face, Breast & Body, Gallery, Media, Contact, phone.
3. **Hero** — full-bleed portrait of the surgeon, name set enormous over marble, credential line,
   city line, trademarked tagline, and *award badges laid into the bottom of the hero* (Newsweek,
   Castle Connolly). Single CTA: Schedule a Consultation.
4. **Press logo strip** — Extra, NewBeauty, TMZ, Cosmopolitan, E!, People, OK!, CBS. Greyed out.
5. **Pull quote** — "Every facial surgery is a piece of art." attributed to the surgeon.
6. **Category block: Anti-Aging / Facial Harmony** — full-bleed photo, headline left, long body copy
   right, over the image.
7. **Category block: Facial Plastic Surgery** — image left / copy right on white, then a
   **procedure link row** underneath (Neck Lift, Facelift, Rhinoplasty, Brow Lift, Facelift
   Revision, Eyelid Surgery).
8. **Procedure Spotlight: Facelift** — one procedure promoted out of the list, full-bleed, two
   deep-link buttons.
9. **Category block: Body Plastic Surgery** — same image/copy pattern, own procedure link row.
10. **Gallery band** — huge outlined word GALLERY behind a patient photo, "Results speak for
    themselves.", one button into the before/after gallery.
11. **Second pull quote** — "I pride myself on providing… natural looking results."
12. **About the surgeon: Committed To Your Results** — portrait, copy, and a **three-tab switcher**
    (Overview / Experience / Patient Advocate) that swaps the copy in place.
13. **Testimonial carousel** — headline-sized quote left, full review right, arrows, then a Read More
    Testimonials button.
14. **Audience block: Men's Procedures** — its own image/copy/CTA plus its own procedure link row.
15. **Latest Videos carousel** — three video thumbnails on a marble ground.
16. **Educator & Innovator** — credentials/teaching, university seals, About CTA.
17. **Second surgeon** — associate surgeon introduced with a photo of the two of them, three
    paragraphs, no CTA.
18. **Articles carousel** — publication logo above each headline (Yahoo, Fansided, Elle).
19. **Closing CTA** — "Get The Most From Life", portrait, Schedule a Consultation.
20. **Footer** — secondary nav row, socials, star rating with review count, logo, two office
    addresses, legal, an impersonation notice and an accessibility notice.

**The shape:** hero → proof → *category → procedure links* repeated three times, with one procedure
spotlit → gallery → surgeon → reviews → audience segment → media/authority → articles → CTA.
Every category block is the same molecule (image, kicker, headline, rule, paragraph, link row);
the page gets its rhythm from alternating which side the image sits on and whether the ground is
white or a full-bleed photograph.

## 2. nassifmdmedspa.com — the same system, non-surgical

Built from the same kit as the surgical site (same navbar, same press strip, same gallery band, same
pull quote, same footer), re-pointed at treatments instead of procedures.

1. **Utility bar + navbar** — About, Conditions Treated, Treatments Offered, Skincare, Gallery.
2. **Hero** — black-and-white beauty photograph, brand mark centred, one line of positioning.
   No badges, no CTA in the hero itself.
3. **Press logo strip** — identical to the surgical site.
4. **Positioning block** — "Restore. Rejuvenate. Enhance." headline left, three short paragraphs
   right.
5. **Interior/experience block** — "Walk through our doors… Envision a new you." with a photo of the
   reception, i.e. the place is sold, not the surgeon.
6. **Treatment category tiles** — 8 image tiles with a word on each (Body Contouring, Resurfacing,
   Aesthetician Services, Hair, Injectables, …). This is the medspa equivalent of the procedure
   link rows.
7. **Gallery band** — same as the surgical site, but the background is a repeating word-wall
   (REVIVE • REJOICE • REGAIN • YOUTH…) instead of marble.
8. **Surgeon block with a BIO / MEDIA tab switcher** — "A celebrated leader in his field".
9. **Treatment block: Injectables** — kicker ("Beautify on your lunch break"), headline, copy, CTA,
   then a **brand link row** (BOTOX, Juvederm, Restylane, Radiesse).
10. **Testimonial carousel** — quote title left, full review right.
11. **Treatment block: Lasers** — same molecule, link row of device names (IPL Photofacial, Halo,
    ProFractional, BBL).
12. **Conditions Treated** — "Find your concern" + a **carousel of round condition tiles** (Acne,
    Body Fat, Double Chin, Hair Loss, Rosacea). Entry by problem, not by treatment.
13. **Dark quote band** — the surgeon quote on black marble, full width.
14. **Technology block** then **Body Procedures block** — same molecule again.
15. **Skincare product block** — "Doctor formulated. Science based." with a product shot and a Shop
    CTA (retail arm on the home page).
16. **Two-up cards** — Aesthetician Services and Hair Restoration side by side, each with photo,
    copy, CTA.
17. **Latest Articles carousel** — NewBeauty-branded.
18. **Closing CTA** — "Schedule a Consultation" with **two buttons: Virtual and In-Office**.
19. **Footer** — same as the surgical site, dark marble ground.

**The difference that matters:** the medspa site has a **dual index** — you can enter by treatment
(section 6) or by the concern you have (section 12) — and the closing CTA splits the booking by
consult type. The surgical site indexes only by procedure.

## 3. themaercksinstitute.com — the shortest and the most opinionated

8,000px, roughly half the length of the others, and it spends that length on philosophy and video
rather than on a procedure catalogue.

1. **Floating rounded navbar** — Video Hub button left, wordmark centre, Book A Consultation right,
   menu row below, search icon. It sits *over* the hero as a card.
2. **Hero** — cut-out black-and-white portrait on a cream-to-grey gradient, one line:
   "Beauty, Balanced with Artistry." Plus a persistent Book A Consultation button.
3. **Press logo strip** — Yahoo Finance, NYT, Haute Living, Maxim, Shape, AskMen, IBT, Life&Style.
4. **"Why Dr Rian?"** — a **vertical (9:16) captioned video** left, seven paragraphs of training
   pedigree right, then board/university credential logos and a Learn More CTA. The video is the
   surgeon talking, not b-roll.
5. **Signature procedure: MAERCKS Microlyft™** — a trademarked branded procedure with its own
   sub-headline ("The Effortless Lift Experience™") and **three labelled benefit lines**
   (Minimal Downtime / Natural Results / You, Refined). One CTA.
6. **The Zero Experience™** — a trademarked *philosophy of care*, again vertical video left, copy
   right, one CTA. Two trademarked ideas carry the whole middle of the page.
7. **"Artist. Philosopher. Plastic Surgeon."** — a three-word centred statement band.
8. **Areas Of Expertise** — three large image cards with a pill label on each (MAERCKS Microlyft,
   Breast Augmentation, Aesthetic…). Three, not twelve.
9. **Video Hub** — a horizontally scrolling rail of vertical social videos with a Watch Now CTA.
   The video library is treated as a first-class section, not a footnote.
10. **Patient Experiences** — a card with the surgeon's photo pinned left and the review text
    scrolling through it via up/down arrows and a pause control.
11. **Instagram feed** — @themaercksinstitute, a second rail of vertical thumbnails.
12. **Location/booking band** — photo of the clinic with a frosted card over it: phone, Schedule a
    Consultation, hours, Finance Options, and a **Cherry monthly-payments badge**.
13. **Footer** — monogram, accreditation logos, financing badge again, address, hours, phone,
    socials, copyright.

**The shape:** hero → press → who → *branded procedure* → *branded experience* → identity statement
→ three services → video → reviews → social → book. It sells one idea and one signature operation
instead of a catalogue, and money (financing) is put on the home page.

## 4. drnipandtuck.com — the longest, and the most editorial

17,000px, big display typography, a signature script face used as a second voice, and section
headlines built as two-tone word stacks (grey word + cream word).

1. **Header** — socials + city left, wordmark centre, phone + Consultation button, hamburger MENU.
2. **Hero** — three portrait panels of the surgeon side by side with the script word *Atlanta*
   drawn across them and "PLASTIC SURGERY ATLANTA" underneath.
3. **Press logo strip** — VoyageATL, Sheen, WE tv, Beyond the Pole, Rickey Smiley Morning Show.
4. **UNRIVALED RESULTS** — a **photo collage** (surgeon + two patient photos, one captioned
   "Atlanta's Premier Plastic Surgeon") left, oversized two-tone headline and intro copy right.
5. **FIND *Your* PROCEDURE** — the strongest navigation idea on any of the four: a **vertical
   category switcher** (BODY / FACE / BREAST / NON-SURGICAL) with the procedure list for the active
   category revealed to the left and a photo to the right. One interaction, the whole catalogue.
6. **"Atlanta Plastic Surgery WITH A FOCUS ON YOU"** — full-bleed portrait with the headline in the
   two-tone stack.
7. **Actual patient row** — four tall portrait cards, each tagged ACTUAL PATIENT.
8. **Surgeon philosophy** — dark ground, big statement left, credentials right, two CTAs
   (Watch My Video / Continue Reading).
9. **Brand film** — a wide embedded video.
10. **Accreditation logo strip** — ASPS, Total Definer, Northside Hospital, AMA, ABPS, FACS, Top
    Doctors, in gold on black.
11. **BEFORE & AFTER GALLERIES** — three paired before/after thumbnails, one per gallery, each with
    its own button (Body / Breast / Face).
12. **Procedure detail carousel** — a procedure name, its clinical definition, a photo, and a
    scrolling list of every other procedure on the right that swaps the panel.
13. **REAL PATIENTS. *Real Results.*** — quote left on grey, group photo of patients with the
    surgeon right ("Our Testimonials from actual patients").
14. **Review-platform strip** — RealSelf, Vitals, Healthgrades, Google, each with stars.
15. **CARE THAT STAYS *WITH YOU*** — aftercare as a selling section: follow-up schedule at 2 weeks,
    1 month, 6 months, 1 year, 24/7 support, lymphatic massage, no-narcotics recovery. Collage
    right.
16. **THE BEAUTY OF *GIVING BACK*** — community outreach, mentoring, breast cancer support.
17. **TRUSTED WITH THE TOUGH CASES** — revision surgery positioned as a specialism, with its own
    collage.
18. **THE EDGE OF INNOVATION** — the blog, sold as a section with a city-skyline background and its
    own paragraph of rationale.
19. **SCROLLING *WITH JOY*** — a row of vertical social/patient videos, one with a named celebrity
    patient.
20. **Social follow band** — six platform tiles.
21. **READY TO NIP & TUCK?** — a **long inline consultation form** (name, phone, email, timing,
    height, weight, medical problems, procedure of interest, contact preference, how did you hear,
    best time, free text, consent checkbox). The form is on the home page, not behind a link.
22. **Footer** — address, wordmark, phone, 4.7 from 253+ reviews, socials, agency credit.

---

## What all four do the same

1. **Hero = the surgeon's face or the brand mark, one line of positioning, one booking CTA.** Three
   of four put the surgeon's own photograph in the hero; only the medspa uses a model.
2. **Press logo strip immediately under the hero.** All four, greyscale, no commentary.
3. **A "who is this doctor" section with credentials and training**, always with a portrait, always
   with a Learn More. Two of four hang it on a tab switcher or a video.
4. **Procedures are indexed, not listed.** Nobody dumps twelve links in a footer-style list: Nassif
   uses per-category link rows, the medspa uses image tiles plus a concerns carousel, Maercks shows
   only three cards, Nip & Tuck uses a four-category switcher.
5. **Before/after gallery is its own promoted band**, with the word GALLERY or GALLERIES set large,
   and it links out rather than embedding the whole gallery.
6. **Testimonials are a carousel of long-form quotes**, not a grid of star ratings — and the star
   ratings appear separately, either in the footer (Nassif) or as a platform strip (Nip & Tuck).
7. **Video is a section, not an accent.** Three of four have a dedicated video rail; the vertical
   9:16 social format is used at full size on the desktop page by Maercks and Nip & Tuck.
8. **Closing CTA band with the surgeon's photo, then a fat footer** with NAP, socials, review score
   and accreditations.

## Where they diverge — the choices worth stealing

| decision | who does it | what it buys |
| :--- | :--- | :--- |
| Trademarked signature procedure + trademarked experience | Maercks | Half the page becomes proprietary; nothing to price-compare |
| Entry by concern as well as by treatment | NassifMD Medspa | Catches the visitor who knows the problem, not the product |
| One interactive switcher for the whole catalogue | Nip & Tuck | Twelve procedures in one screen without a menu |
| Aftercare written as a selling section | Nip & Tuck | Answers "what happens to me after" before it is asked |
| Financing badge on the home page | Maercks | Removes the cost objection early |
| Consultation form inline at the bottom | Nip & Tuck | No click between intent and lead |
| Second surgeon introduced on the home page | Nassif | Scales the brand past one pair of hands |
| Split CTA: Virtual vs In-Office | NassifMD Medspa | Lowers the commitment of the first step |
| Awards laid into the hero image | Nassif | Proof before the first scroll |
| Community/outreach section | Nip & Tuck | Local trust, not clinical proof |

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
