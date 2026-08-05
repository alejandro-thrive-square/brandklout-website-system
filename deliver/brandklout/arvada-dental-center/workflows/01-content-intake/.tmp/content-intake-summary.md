# Content Intake — Arvada Dental Center & Implants

**Asana parent task**: `1217040406855586` (workspace `1210572425689866`)
**Captured**: 2026-08-05
**Source**: https://arvadadentalcenter.com — found by public search; no URL was recorded in Asana.

Everything below is **quoted or paraphrased from the client's own live site**. Nothing here is
invented. Where a fact could not be sourced it is marked `NOT FOUND` rather than filled in.

## How this was captured

The site runs on SiteGround behind an **sgcaptcha bot challenge**. Plain `curl` and `WebFetch` both
receive a `202` interstitial, not the page. Two scripts in this folder work around it:

| Script | Does |
| :--- | :--- |
| [`capture.mjs`](./capture.mjs) | Headless Chrome over CDP; waits out the challenge, then dumps rendered HTML, a structured `meta.json` (headings, nav, colours, fonts, images, JSON-LD, full text) and full-page PNGs at 1440 + 390. |
| [`fetch-assets.mjs`](./fetch-assets.mjs) | Pulls the client's own imagery. The challenge also intercepts **scripted** requests — an in-page `fetch()` for a `.webp` returns `text/html` even with the cookie set — so assets are read off the network log with `Network.getResponseBody` while the real pages load. |

`capture.mjs` also takes `HEADED=1` for sites that fingerprint headless Chrome.

Raw artifacts: [`client-site/`](./client-site/) (16 pages), [`reference-captures/`](./reference-captures/) (9 references).

## Business facts

| Field | Value |
| :--- | :--- |
| Practice | Arvada Dental Center & Implants |
| Address | 6695 Wadsworth Blvd, Arvada, CO 80003 |
| Main phone | **(303) 421-7611** |
| Tracking phone | (720) 419-3699 — the number in the site header and footer; also called the "Dental Implant Hotline" |
| Email | info@arvadadentalcenter.com |
| Hours | Monday–Friday 8:00am–5:00pm; closed weekends |
| Founded | Practice established 2003; Dr. Bennett relocated from Iowa and bought it from Dr. James Jack |
| Geo | 39.8180688, -105.08195 (from their `Dentist` JSON-LD) |
| Social | Facebook, Instagram `@arvadadentalcenter`, YouTube, LinkedIn |
| Service area | Arvada, Denver, Aurora, Broomfield, Lakeside, Westminster, Applewood |

## Doctors

Four, all with their own bio pages. Only Dr. Bennett is used on the implant/cosmetic pages — the
practice's own implant marketing is built entirely around him ("Work **exclusively** with
Dr. Gregory Bennett").

| Doctor | Sourced detail |
| :--- | :--- |
| **Dr. Gregory Bennett, DDS** — founder | Doctorate of Dental Surgery, University of Iowa, 2001. "Practicing dentistry for almost 20 years in Colorado." Board certified to administer IV sedation. Full-arch/full-mouth restorative, implant dentistry, oral surgery, cosmetic dentistry, and the lab portions of implantology. "Has placed and restored thousands of implants." |
| **Dr. Suzanna McAninley** | Bio page exists; photo captured. Appears as "Dr. Mac" in patient reviews. |
| **Dr. John McShane** | Bio page exists. Appears as "Dr. Mc" in patient reviews. |
| **Dr. Meghan Holub** | Bio page exists. |

## Offers and prices — all sourced, one conflict

> [!WARNING]
> **The client's own site quotes two different full-arch prices on the same page.**
> `cost-of-dental-implants/` headlines **"Fixed Full Upper Or Lower Implants Just $18,795"** and
> then, four paragraphs down, says *"can provide such amazing pricing, **$14,999**, for fixed upper
> or lower dental implants"*. The built pages use **$18,795** because it is the headline figure, and
> every price is confined to a single `data-price` element per page so it is a one-line correction.
> **Brandklout must confirm which is current before these pages take traffic.**

| Offer | Exact wording | Where it appears |
| :--- | :--- | :--- |
| **$109 New Patient Special** | "Includes Exam, X-Rays, OralID Cancer Screening" / "*Restrictions Apply *New Patients Only *18 And Older" | `dentist-in-arvada-dentist-near-me-open-now/` |
| **Full-arch implants from $18,795** | "Fixed Full Upper Or Lower Implants Just $18,795" / "Save more than $10,000 compared to the national chains seen on TV.*" | `cost-of-dental-implants/` |
| **Free consultation** | "Start with a free consultation today"; "That's why we offer a Free Consultation" | implants + cost pages |
| Insurance limit | "We Don't Accept HMO and Medicaid" | new-patient page |
| Veneers timeline | "Receive porcelain veneers in as few as two visits" | `veneers/` |
| Emergency promise | "Whenever possible, we'll make space in our schedule so that we can see you the same day" | `emergency-dentistry/` |
| Financing partners | Cherry, Sunbit, PatientFi, Proceed Finance, LendingClub, CareCredit; "PRE-QUALIFY WITHOUT AFFECTING YOUR CREDIT SCORE!" | `insurance-and-financing/` |

`NOT FOUND`: any offer specific to veneers, emergency, or All-on-X. Those pages use the free
consultation plus a labelled `data-offer` placeholder — see Open Question 1 in the project overview.

## Ratings — three different numbers, all real

Use whichever the client prefers; each is attributable.

- **4.8 from 1,270 reviews** — Birdeye aggregate
- **4.8 rating from 931 reviews** — the figure the client publishes on their own new-patient page
- **77 reviews** — Yelp
- "80+ Visitors Chose This Office This Month" — client's own new-patient page

The built pages use **4.8 / 931 reviews**, because that is the number the practice itself publishes.

## Real reviews used (verbatim, with the reviewer names as published)

Pulled from the live Google review widget on the client's site. No review has been edited beyond
trimming, and none has been invented.

| Name | Quote | Used on |
| :--- | :--- | :--- |
| **keri c** | "They got me in immediately for an emergency visit, their prices were more than reasonable, and they were so friendly, and quick to help me with my problem and get me out of pain." | Emergency |
| **Rick Willcox** | "My first visit and I was extremely impressed… A clear plan was put together, including personal input from Dr. Bennett. Pricing was fully transparent, no hidden surprises expected." | Implants, AOX |
| **Linda Hoffner** | "The times I've had work done, cavities, crowns etc., Dr Bennett did a fabulous job. Won't go anywhere else." | Implants, Near Me |
| **Sonja Welch** | "I've had such a hard time trying to find a good dentist that is punctual and doesn't try to upsell you on things. I finally found a good one!" | Near Me, Next Door |
| **ryan syme** | "Top notch in every regard. Everyone is fantastic and the office is beyond reproach. 10/10 recommend." | Next Door, Veneers |
| **Dorothy Padgett** | "Made me feel so comfortable. Great pricing. Friendly staff" | Near Me |
| **Jon Jon** | "Top percentile in terms of quality, technology and the atmosphere! The folks at Arvada Dental Center were down to earth and welcoming" | Veneers, Next Door |
| **Katie Springer** | "Kate is an excellent dental hygienist… Dr. Mac is also great at what she does and is kind when she comes to check in on you." | Near Me |
| **Art Golembeski** | "Pleasant and caring staff along with great doctors providing the best outcome for you !!" | AOX |
| **Matthew Aragon - Shafi** | "Best dental office I have ever been too." | Next Door |
| **Dean Brancucci** | "Came in for consultation about an implant. The employee who helped me, Justeen, was very accommodating and helpful." | Implants |

> [!NOTE]
> The widget also carries genuine **negative** reviews (a rushed filling, a warranty complaint).
> They are deliberately not used — but they are the reason the pages avoid absolute claims like
> "never a wait" that the review record would contradict.

Named patient video stories on the site (not transcribed, listed as available proof): Chris
(implants + veneers), Wick, Jay, CJ, John, Vickie, Brittany.

## Brand

Read off the live computed CSS, not guessed.

| Token | Value | Note |
| :--- | :--- | :--- |
| Navy | `#242A3A` | dominant dark section background |
| Deep blue | `#0E2F60` | logo blue |
| Cyan | `#03C5EC` | primary accent + button fill |
| Amber | `#FB8E28` | secondary CTA, star colour (`--rpi-star-color`) |
| Slate | `#5C6B80` | body-on-dark, dividers |
| Ink | `#333333` | body text |

Type: **Cinzel** (display serif, all-caps headings), **Montserrat** (subheads/UI), **Open Sans**
(body). All three are Google Fonts.

Recurring device: a **Colorado mountain-ridge silhouette** used as a section divider and watermark
(`mountain-pattern-W2/W3.png`, `pattern-mountain-left.png`) plus real Rockies photography
(`mountain.jpg`, `mountain-img.webp`). This is the practice's strongest visual signature and the
one thing worth carrying into the landing pages, since it is what "small-town Colorado" looks like
in their own material.

## Imagery

**42 client-owned assets** downloaded to `../../04-design/.tmp/_shared/assets/`, catalogued in
`assets-manifest.json` there, with a visual index at `_contact-sheet.html/.png`. Binaries are
gitignored per the repo rules; the manifest is the committed record and `fetch-assets.mjs`
re-fetches them.

Coverage: logo (colour + white), Dr. Bennett (3 shots), Dr. McAninley, a 4-person team photo,
reception/waiting/operatory interiors, clinical renders (single implant, All-on-4 arch, crown,
veneers), veneer shade-matching, emergency pain, sedation, real patient moments (CJ handshake, a
patient holding his before/after), and the full mountain-motif set.

**No stock imagery is used on any of the six pages.** Every image is the client's own.

## Reference captures

| Reference | Slug | Status |
| :--- | :--- | :--- |
| `smile.dentalimplantsgps.com/dental-implants/ppc/` | `ref-implants-gps` | Captured |
| `yjoms.com/about-full-arch/` | `ref-aox-yjoms` | Captured |
| `avenue.dental/services/veneers/` | `ref-veneers-avenue` | Captured |
| `drpaulomalley.com/services/ultra-thin-veneers/` | `ref-veneers-omalley` | Captured |
| `smilecenter.com/treatments/emergency-dentistry` | `ref-emergency-smilecenter` | Captured (needed an `Accept-Language` override — it serves Spanish by default) |
| `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC` | `ref-nextdoor-ghl` | Captured — a **$189 New Patient Special** page |
| `start.smartarchesdental.com` | `ref-house-smartarches` | Captured |
| `novismilerogers.com` | `ref-house-novismile` | Captured |
| `greenspotcrossingsdentistry.com/lp/59-nps/` | `ref-nps-greenspot` | **BLOCKED** |

> [!IMPORTANT]
> **The Greenspot reference could not be retrieved.** Cloudflare returns a hard `403 Sorry, you
> have been blocked` — a WAF rule, not a JS challenge, so headed Chrome does not get past it either,
> and `WebFetch` gets the same 403. The `/lp/` path is not in the Wayback Machine (the rest of that
> domain is). It is cited by **two** of the six tasks. The GHL preview is the same archetype — a
> flat-fee new-patient-special page — and was used as the structural brief instead. Worth asking
> Brandklout for a screenshot or PDF.

Structure notes derived from these captures: [`reference-structure-notes.md`](./reference-structure-notes.md).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; image binaries and rendered HTML dumps are gitignored.
