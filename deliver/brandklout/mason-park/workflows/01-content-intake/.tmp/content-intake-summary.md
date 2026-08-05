# Content Intake — Mason Park Dental

**Source Asana parent task**: `1217040406855582` — [Landing Page - Mason Park](https://app.asana.com/1/1210572425689866/task/1217040406855582)
**Captured**: 2026-08-05 via `capture.mjs` (headless Chrome CDP). Raw captures in `client-site/` and
`reference-captures/`.

> Every fact below is sourced from the client's own live site or their own prior ad page. Nothing on
> this page is invented. Items marked **CONFIRM** are unverified and listed in Open Questions.

## Client website — FOUND

**`masonparkdental.com` 302-redirects to `https://bestdentistinkatytx.com/`** — that is the live
practice site. It was not recorded in Asana; this closes the batch-wide gap for Mason Park.

> [!NOTE]
> The site sits behind a SiteGround bot wall (`/.well-known/sgcaptcha/`). `curl` and plain fetchers
> get a `202` challenge page; a real browser passes. Capture with `capture.mjs`, not curl. Requests
> issued in parallel from one IP re-trip the wall — capture pages **sequentially**.

## Practice facts (NAP)

| Field | Value | Source |
| :--- | :--- | :--- |
| Name | Mason Park Dental of Katy | site header/footer |
| Address | 21830 Kingsland Blvd #104A, Katy, TX 77450 | site footer |
| Landmark | Corner of Mason Rd and Kingsland Blvd, behind the Ranch 99 complex | site band |
| Public phone | **(281) 769-8878** | site footer, every page |
| Map | [Google Maps place link](https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450/@29.775949,-95.7512199,17z) | site header |
| Booking | `https://www.flexbook.me/masonpark/1` (FlexBook "Schedule Online") | site header CTA |
| Logo | `/wp-content/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp` | site |

### Office hours — two conflicting sources

| Day | Live site (authoritative) | Old ad-company LP |
| :--- | :--- | :--- |
| Monday | 9am – 6pm | 9am – 6pm |
| Tuesday | **8am – 5pm** | 9am – 6pm |
| Wednesday | 9am – 6pm | 9am – 6pm |
| Thursday | **8am – 5pm** | 9am – 6pm |
| Fri / Sat / Sun | Closed | Closed |

The old LP flattens Tue/Thu to 9–6. **The live site wins** — all three new pages use the live-site
hours.

## Doctors

Photo mapping was confirmed **visually** against `client-site/our-doctors/desktop.png`, not by DOM
order alone, because mislabelling a real person's photo is not a recoverable error.

| Doctor | Title | Photo |
| :--- | :--- | :--- |
| Dr. Dave Cho | General Dentist | `/uploads/2023/11/HS-7-683x1024.jpg` |
| Dr. William Sung, DMD | General Dentist — leads Invisalign | `/uploads/2020/04/DrWilliamSung-230x300-1.webp` |
| Dr. Tam Nguyen | Board Certified Pediatric Dentist | `/uploads/2023/11/HS-8-683x1024.jpg` |

**Bios** for Cho and Sung are lifted verbatim from the client's own prior ad page
(`mpd-invisalign-lp.html`). No bio exists anywhere for Dr. Nguyen beyond her title — so the pages
state her title only rather than inventing a bio.

**Dr. Sung credentials** — Tufts University dental degree (Boston); 10+ years of dental experience;
Fellowship in the Academy of General Dentistry (top 7% in Texas); 100+ hours of continuing education
every year. **CONFIRM**: sourced from the GHL reference page, which is a *Grand Mission Dentistry*
page. Dr. Sung practises at both, and the credentials are his rather than the location's, but they
are not published on Mason Park's own site.

## Offers — from the client's own `/special-offers/` page

This page is the authoritative offer sheet and it resolves the pricing questions completely.

| Offer | Detail |
| :--- | :--- |
| **$189 New Patient Special** | Comprehensive exam, x-rays, cleaning, full treatment plan. *"That's $328 in savings!"* (implied regular value $517) |
| **$129 New Patient Exam** | Children under 13 |
| **$350 New Patient Whitening** | KOR whitening with at-home trays |
| **Invisalign — $1,000 OFF** | Regular **$4,800** → special **$3,800**. Prepay in full for a further **$500 off**. Insurance payments reimbursed back to the patient. In-office and third-party payment plans available. |
| **Dental Implants — $1,000 OFF** | Regular $3,800 → $2,800. Includes consult, radiographs + 3D scan, implant, custom abutment, implant crown. |
| **Complimentary Invisalign consultation** | Listed as a standing offer |
| **Free second opinion** | Standing offer |

Invisalign extras carried from the client's own prior ad page: free set of Vivera retainers, free KOR
teeth whitening gel, free virtual or in-office consultation, free 3D and wellness scan.

**Financing**: Cherry — 0% APR, no hard credit check, pay monthly. The site's Cherry apply link
points at `pay.withcherry.com/grand-mission-dentistry`, i.e. the sibling practice's account.
**CONFIRM** before shipping: leads sent through it may be attributed to the wrong location.

## Reviews — real, 5.0 on Google (Trustindex widget)

Ten verbatim Google reviews were captured with reviewer names and relative dates
(`client-site/home/rendered.html`). Used on the pages:

| Reviewer | Review |
| :--- | :--- |
| Gabriel Sanchez | "Very friendly staff and were willing to help in every way! Felt more comfortable here than at any other dentist office in the past, highly recommend!" |
| Alli Chun | "I've been coming to this dental office ever since childhood and I always have a great experience with Gen and Dr. Cho. Highly recommend" |
| Amber Choate | "This is the best Children's Dentist office I have ever been to." |
| Kristian Ball | "Jen is the best so personable and relatable. Makes the process so smooth. Love this place!" |
| Ammaar Ahmed | "Great, Jenn and Dr Cho are very kind and communicative. Clean and friendly clinic" |
| rizi nepomuceno | "Lola did a great job in my scheduled cleaning today. She is very friendly and makes me feel comfortable during my procedure." |

Each widget card carries `data-rating="5.0"`. **CONFIRM**: the total Google review count is not
exposed by the widget markup, so **no aggregate count is claimed anywhere on the pages** — only the
5.0 rating and the individual reviews. Yelp separately lists 23 reviews, which is a different
platform and is not mixed in.

## Clinical / service copy

Real, client-authored copy is available for reuse and is used verbatim or lightly trimmed:

- **Invisalign service page** — what Invisalign is, who it is for, six benefits, why choose Mason Park.
- **Invisalign FAQ page** — 21 real Q&As in seven groups. The pages use a selected subset. No
  clinical answer has been written by us.
- **Six bite problems** (crossbite, gapped teeth, underbite, overbite, crowded teeth, open bite) —
  from the client's own prior ad page.
- **Free virtual consult, three steps** — snap photos of your smile → write a quick message → get a
  video response from the doctor.
- **Technology** — Cone Beam Imaging, Digital X-Rays, Intra-Oral Camera, Soft Tissue Laser.
- **Accreditations** — AAPD, ABPD (board certified), Academy of General Dentistry, Kois Center,
  Seattle Study Club.

> [!WARNING]
> The client's site runs the "tooth-fairy" WordPress theme and **still carries unreplaced theme demo
> content** — a "Top Dental Clinic 2019 / Dental Awards 2020…" awards table and lorem ipsum service
> blurbs. These are theme placeholders, not the practice's achievements. None of it was used.

## Brand

Read off the live site and the captured screenshots.

| Token | Value | Where it comes from |
| :--- | :--- | :--- |
| Ink | `#1B2224` | footer, headline text |
| Slate | `#4E585B` | top utility bar |
| Sand | `#C3A98E` | the practice's signature warm band and contact panel |
| Sand deep | `#A8875F` | derived emphasis tone |
| Sage | `#7F9A8B` | interior photography |
| Paper | `#FBF9F7` | warm page ground |
| Cloud | `#EFF2F3` | cool section ground |

Type on the live site is **DM Sans** (body) with a wide-tracked geometric sans for display
(`stolzl`, a licensed face). The pages pair **DM Sans** with **Outfit** — both free on Google Fonts,
and Outfit carries the same geometric wide-caps character as stolzl.

The identity is calm, warm-neutral and unhurried: letter-spaced caps, a fine line-art tree mark, real
photography of a bright office. It is deliberately **not** the neon-yellow/black dental-PPC look of
the previous ad company's page.

## Phone numbers — the tracking-number finding

| Number | Status |
| :--- | :--- |
| **(281) 769-8878** | The practice's real public number. On every page of the live site and every directory listing. |
| **(281) 767-8698** | Hard-coded throughout the old ad-company LP. Appears in **no** public listing for this practice. |

That second number is, on the evidence, the **call-tracking number the previous ad company
provisioned**. This is what the thank-you task means by *"check GHL for proper tracking number."*
It cannot be verified from here — there is no GHL grant — so all three pages read their number from a
single constant (`TRACKING_PHONE` in `assets/site.js`) and currently render the public number. See
Open Questions.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only. Screenshot PNGs in these folders are gitignored by the repo-wide asset
rules and stay local.
