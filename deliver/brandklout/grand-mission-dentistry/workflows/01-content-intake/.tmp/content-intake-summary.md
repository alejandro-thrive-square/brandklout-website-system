# Content Intake Summary — Grand Mission Dentistry

**Source Asana task**: `1217040406855578` (Landing Page - Grand Mission), workspace `1210572425689866`
**Pulled**: 2026-08-05 via the read-only Brandklout Asana scripts + public research on the client's
own site. No client system was authenticated.

> [!IMPORTANT]
> Everything below is sourced. Nothing here is invented. Where two sources disagree, both values are
> shown and the conflict is listed in [open-questions.md](./open-questions.md) — do **not** pick one
> silently when designing.

## 1. The practice

| Field | Value | Source |
| :--- | :--- | :--- |
| Legal / display name | Grand Mission Dentistry (Google/Yelp: "Grand Mission Dentistry Of Richmond") | live site, Yelp |
| Live website | **https://grandmissiondentistry.com** — built on **Webflow** (Relume-based) | site CSS `cdn.prod.website-files.com/698111847e9608eb30ee21c6/` |
| Address | 8620 Grand Mission Blvd Ste E, Richmond, TX 77407 | live site + both originals |
| Main phone | (281) 789-8836 | live site |
| Campaign tracking numbers | Implant LP (281) 747-5929 · Cosmetic LP (281) 729-4615 | original LPs |
| Online booking | https://www.flexbook.me/gmdent/1 | live site |
| Map | https://maps.app.goo.gl/h8xXwxeF26pKio8n6 | live site |
| Languages spoken | English, Spanish, Vietnamese, Korean, Arabic | live site |
| Smile-preview tool | grandmissiondentistry.dentalsmilestudio.us | live site |

Office hours — **three different published sets**, see open questions:

| Day | Live site | Implant LP | Cosmetic LP |
| :--- | :--- | :--- | :--- |
| Mon | 9:00–19:00 | 8:00–18:00 | 8:00–20:00 |
| Tue | 10:00–20:00 | 10:00–20:00 | 8:00–20:00 |
| Wed | 10:00–20:00 | 10:00–20:00 | 8:00–20:00 |
| Thu | 8:00–18:00 | 8:00–18:00 | 8:00–20:00 |
| Fri | 8:00–18:00 | 9:00–19:00 | 8:00–20:00 |
| Sat | 8:00–15:00 | 8:00–15:00 | 7:00–17:00 |
| Sun | Closed | Closed | (not listed) |

## 2. The doctors (real, verbatim credentials)

| Doctor | Credential / role | Appears on |
| :--- | :--- | :--- |
| **Dr. William Sung, DMD** | General dentist; restorative and implant dentistry | live site, both LPs |
| **Dr. Van Nguyen, DDS** | Doctor of Dental Surgery, U. of Minnesota; restorative + cosmetic | live site, cosmetic LP |
| **Dr. Tam Nguyen, DMD** | Board-certified **pediatric** dentist | live site only |

Bio copy already written by the practice (reusable verbatim, from the cosmetic LP):

> Dr. Van Nguyen, originally from Vietnam and raised in a small town in Minnesota, earned her Doctor
> of Dental Surgery degree from the University of Minnesota. Inspired by her hometown dentist,
> Dr. Nguyen is passionate about building lasting relationships with her patients and guiding them
> on their oral health journeys. With a love for art and precision, Dr. Nguyen excels in restorative
> and cosmetic dentistry and stays current with new techniques through continuing education.

The Dr. Sung bio on both LPs is generic marketing copy ("highly regarded in the field of…"). The
live site's implants page carries stronger, more specific material — prefer it.

> [!NOTE]
> The cosmetic page spec says "Meet the Cosmetic **Doctors**" (plural) = Sung + Van Nguyen.
> Tam Nguyen is pediatric and does not belong on a cosmetic or implant landing page.

## 3. Offers and pricing — the live site and the originals disagree

| Offer | Live site (current) | Original LPs (from the other ad company) |
| :--- | :--- | :--- |
| Single-tooth implant | "starts at **$2,999**" | **$3,499**, plus **extra $500 off** paid in full upfront |
| New patient special | **$189** — exam, X-rays, cleaning, treatment plan | — |
| Invisalign | **$3,799** — aligners, refinements, retainer, whitening | — |
| Free second opinion | yes | yes (cosmetic LP) |
| Free consult bundle | — | "Free Dental Exam & X-Ray Worth **$750**" (implant LP) |

Live-site fine print, carry it if the $189 offer is used:
"Cannot be combined with insurance, new patients only, not valid in cases of periodontal disease."

**Insurance / financing**

- Live site: most major **PPO** plans, **HSA/FSA** accepted; financing via **Cherry** (0% APR for
  qualified patients).
- Original LPs: cash, check, all major credit cards, **Alphaeon**, **LendingClub**, **CareCredit**;
  "0% or low-interest financing", instant approval, in-network with many major carriers.

The implant page spec calls for an "Insurance & Flexible Financing Matrix" — the union of these two
lists is the raw material, but which lenders are current must be confirmed.

## 4. Proof assets that are real (never invent more)

Aggregate proof, live site:
- **1,700+ Google reviews**, 5-star rating badge
- **Nextdoor Neighborhood Favorite 2021–2024** (four consecutive years)
- **Healthgrades 2023 Patient Safety Award**
- Yelp 5-star business badge (Yelp listing itself shows 59 reviews / 41 photos)

Named patient reviews already cleared for use (verbatim from the client's own pages):

| Name | Review | From |
| :--- | :--- | :--- |
| EM M | "This is an amazing dentist and their hospitality is outstanding. They are also financially understanding. The dental assistant Rida made the experience exceptionally great…" | implant LP |
| Jason Kwan | "Amazing dentistry! The entire staff here is fantastic. Due to past experiences I used to be pretty anxious about going to the dentist until I started coming here…" | implant LP |
| Diane C. | "This is the best dental place I've been to since I moved to Texas. Customer service is superb, so kind, friendly, and welcoming." | cosmetic LP |
| Cedaro | "Dr. Van and Hygienist Karen were amazing today! I've got my plan to start a healthier mouth and I'm so excited!" | cosmetic LP |
| Tiffany T. | "Best experience! Very up to date with equipment and the cleanest dental office I've ever been to." | cosmetic LP |

Clinical statistics the practice already publishes (live implants page) — cite as they do, do not
round or restate:
- Up to **25%** of jawbone width can be lost within the first year after tooth loss
- Dental implants have a **96.8%** survival rate at 10 years
- Adults with 6+ missing teeth are at significantly higher risk of depression
- Implant survival documented after nearly **40 years**

## 5. Brand system — from the client's own Webflow site (authoritative)

Pulled from `grandmissiondentistry.shared.*.min.css` (`:root` variables):

| Token | Value |
| :--- | :--- |
| Brand blue (primary) | `#04669c` (`--_primitives---brand--bleu-700`) |
| Brand blue (deep) | `#002241` (`--bleu-900`) |
| Brand blue (light) | `#abd6ff` (`--bleu-500`) |
| Brand brown (dark) | `#403830` (`--brown-800`) |
| Brand brown | `#8c6946` (`--brown-500`) |
| Accent purple | `#6f4885` (`--puple` — misspelt in their file) |
| Light surface | `#fcfcfc` |
| Neutrals | black · `#222` · `#444` · `#666` · `#aaa` · `#ccc` · `#eee` · white |
| Radii | 4 / 8 / 24 / 48px |
| Heading + body type | **Montserrat** (variable) |
| Tagline / script type | **Great Vibes** |
| Also loaded | Garnetta, Libre Franklin, Plus Jakarta Sans, Lato |

> [!WARNING]
> The two original LPs use a **different** palette and type (navy `#061045`, blue `#155eef`, gold
> `#F5A623`, Plus Jakarta Sans + Inter). That is the previous ad company's house style, **not** the
> client's brand. Design against the Webflow tokens above so the landing pages match the site the
> traffic already knows.

Logo: `…/69812a11425065e0beea0877_grand_mission-logo (1).webp` (horizontal) and
`…/6987fe672d873b46836afe27_grand_mission-logo sq.png` (square). Both downloaded.

## 6. Downloaded assets

`.tmp/assets/` — 48 files, catalogued in `.tmp/assets/catalogue.json` (gitignored: media).

**`assets/live-site/`** (18) — horizontal + square logo, Dr. William Sung portrait (×2),
Dr. Tam Nguyen portrait, practice interior photo, implant illustrations (single implant, All-on-X,
implant bridge, failing implant), smile-preview graphic, payment-options graphic, sedation and
full-arch cards, treatment-journey graphic, location + phone icons.

**`assets/originals/`** (30) — logo (white/knockout), 6 service icons (implant LP set) + 6 SVG
service icons (cosmetic LP set), Dr. William Sung portrait, **Dr. Van Nguyen portrait** (only source
we have), implant-model explainer photo, implant-treatment photo, financing-conversation photo,
office-technology photo, cosmetic hero smile, and **8 real patient smile-result photos** for the
"Real Patient Gallery" section.

> [!NOTE]
> No Dr. Van Nguyen portrait exists on the live site — the cosmetic LP original is the only source.
> Confirm it is still current before shipping it.

## 7. Platform reality check

The client's live site is **already Webflow**, on site `698111847e9608eb30ee21c6`, built on Relume
foundations with Swiper 12 for sliders. That means these landing pages should almost certainly be
built **as pages on the existing Webflow site**, not as a standalone package — which needs a
per-client Webflow grant that does not exist yet (see
[mcp-access.md](../../../docs/mcp-access.md)).

The originals were built in **GoHighLevel** (assets on `assets.cdn.filesafe.space`, location id
`0e2uXXYZTFpKGnacy2NF`) and tagged with **GTM-TGSMNX3**. Their footer credits "Digital Presence
Matters" — the outgoing ad company. Both LP forms are plain HTML with a honeypot field and no
visible endpoint, so the GHL form embed is the missing piece the Asana tasks are asking for.

## 8. What the pages must contain (spec + what we now have)

| Page | Asana section spec | Content available |
| :--- | :--- | :--- |
| Implant LP | 7 sections + GHL lead form | Complete — offer, financing matrix, Sung bio, 2 named reviews, 4 FAQs, clinical stats |
| Cosmetic LP | 7 sections + GHL lead form | Complete — 2 doctors, 6 services, 3 why-us pillars, 8 patient photos, 3 named reviews |
| Thank-you LP | 4 sections | Complete — phone, hours, address, map link, booking link |

FAQ copy for the implant page already exists verbatim on the original (preparation / cost /
candidacy / how it works) and can be extended from the live implants page.

## Version Control

Lightweight intake artifact. Media under `.tmp/assets/` is gitignored per
[SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
