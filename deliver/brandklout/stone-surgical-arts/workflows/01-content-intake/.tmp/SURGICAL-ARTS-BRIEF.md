# Content intake — Stone Surgical Arts rebuild

Everything the [Surgical Arts build](../../04-design/.tmp/surgical-arts/) is written from, and where
each fact came from. Gathered 2026-08-30.

> [!IMPORTANT]
> Every figure on this page is **sourced, not invented**. Where a number could not be verified
> against a live source it is marked **UNVERIFIED** and the build renders it behind a review note.
> Nothing marked UNVERIFIED may go live without Brandklout or Dr. Stone confirming it.

## The brief

| | |
| :--- | :--- |
| **Asana task** | [Give Jess the core pages for Aesthetic - Stone](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1217846850268874) `1217846850268874` |
| **Page list** | Sang Huynh, comment 2026-08-27 08:08 UTC |
| **Design** | "Stone Surgical Arts Website Redesign — 01 Sculpted Ivory", attached by Sang 2026-08-27 07:33, marked *"Dr. Mona picked this design"* |
| **Platform** | Instatic. **Not** Webflow. |
| **Build** | `deliver/brandklout/stone-dental-implant-center/workflows/04-design/.tmp/surgical-arts/` |

### The seven pages, verbatim from Sang

1. **Home** — positions the practice, routes to the four categories
2. **Treatments Overview (hub)** — all four categories with prices; the main SEO entry point
3. **Treatment Detail** — the template the individual treatments reuse
4. **Memberships** — three tiers on a banked-credit model
5. **Results** — filterable before/after gallery plus reviews
6. **About** — Dr. Stone, clinical oversight, team, location
7. **Book a consultation** — request form, hours, pre-visit instructions, financing FAQ

### Brand resolved 2026-08-30

Sang's comment is worded for the **med spa** ("positions the med spa as an extension of the surgical
practice"; "Skin & Laser, Body and Wellness"), but the design Dr. Mona picked is titled **Stone
Surgical Arts** and its four categories are **Face / Neck / Skin / Non-Surgical**. Alejandro chose
**Stone Surgical Arts** with the Face/Neck/Skin/Non-Surgical taxonomy, keeping Sang's seven-page
architecture. That also matches the reference image supplied with the task, which strikes out
*Oral Surgery Procedures* and keeps *Cosmetic Facial Surgery* and *Facial Rejuvenation*.

**The med spa is a separate brand and still unbuilt** — Instagram calls it *Westlake Medical
Aesthetics*. It is Asana task `1217160668112180`, not this one.

## Practice facts — verified against the live site

Source: `www.stonedentalimplantcenter.com`, fetched 2026-08-30 (`archive-text/live/`).

| Field | Value |
| :--- | :--- |
| Surgeon | **Dr. Mona Stone, DDS** — oral & maxillofacial surgeon |
| Address | 72 Andorra Dr #110A, Westlake, TX 76262 |
| Phone | **(817) 383-8361** |
| Hours | Mon 9–5 · Tue 9–5 · Wed 9–3 · Thu 9–5 · Fri 9–4 · Sat & Sun closed |
| Languages | English & Spanish |
| Self-description | "a boutique facial cosmetic surgery clinic in Westlake, Texas" (the practice's own Linktree bio) |

> [!IMPORTANT]
> **NAP resolved 2026-08-31 — and the board was right, not placeholder.**
>
> The table above is the **sister practice's** NAP. It was used in the first build only because
> `web.archive.org` was blocking this IP and the sister site was the only live source. The archive
> is reachable again, and **Stone Surgical Arts' own published footer**, on every one of the 28
> recovered pages, reads:
>
> | Field | Stone Surgical Arts (own) | Stone Dental Implant Center (sister) |
> | :--- | :--- | :--- |
> | Phone | **(817) 918-3666** | (817) 383-8361 |
> | Suite | **#110** | #110A |
> | Hours | **Mon–Fri 9–5, Sat by appointment** | Mon/Tue/Thu 9–5 · Wed 9–3 · Fri 9–4 |
> | Email | **info@stonesurgicalarts.com** | — |
>
> The build now uses the Surgical Arts column throughout — markup, `seo.json` and the JSON-LD.
> This exactly matches the Sculpted Ivory board's footer mock, so that mock was the real NAP all
> along and HANDOFF.md item 4 is closed.
>
> **One anomaly, still open.** The archived `/facial-surgery-southlake` page carries a third number,
> **(817) 646-8240**, in both its header and footer. Every other page says 918-3666, so the build
> uses 918-3666 and 646-8240 is not used anywhere. Worth one question to the client: it may be a
> tracking number, or an old line still forwarding.

### Credentials, as published

- Degree in biomedical engineering before dental school
- Doctorate of Dental Surgery, University of Missouri–Kansas City
- Full residency in Oral & Maxillofacial Surgery, Fort Lauderdale, across **three Level 1 trauma centers**
- Attending surgeon at **Baylor** and **Methodist**
- **Pinnacle Faculty**; **KLS Martin IPS® certified**
- Public speaker, activist, philanthropist; cofounder of *Real Heroes Need Masks*

Her own line, from the live About page — the single best sentence the brand owns:

> "Most surgeons replace what's missing. I design what belongs."

And the live site's framing of what makes her different, which transfers directly to a cosmetic
brand: she "sees the face the way a plastic surgeon does — reading proportion, balance, the way a
jawline frames everything around it."

## Team — from Instagram and Linktree

| Person | Role | Handle |
| :--- | :--- | :--- |
| Dr. Mona Stone | Surgeon | `@drjawline` |
| Brooke | NP injector | `@brooke_aestheticsnp` |
| Abby | Esthetician (laser & skin) | `@laserandskinbyabby` |

## Live integrations — from the practice's own Linktree

| What | Where |
| :--- | :--- |
| **Booking** | Modento — `book.modento.io/stonesurgicalarts/patient-details` |
| **Financing** | **Sunbit** — `apply.sunbit.com/StoneSurgicalArts` |
| Retail / skincare | `shopmy.us/drjawline` |
| Instagram (med spa) | `@westlakeaesthetics` — "Westlake Medical Aesthetics" |
| Instagram (surgical) | `@stonesurgicalart` |
| Facebook | `facebook.com/stonesurgicalarts` |
| TikTok / YouTube | linked from Linktree |
| Reviews on the sister site | Elfsight apps `7b3bee65-…` and `c92f78df-…` |

> The archived site used **Cherry** financing and **Crisalix** simulation. The live Linktree uses
> **Sunbit**. The build uses Sunbit and does not carry Cherry or Crisalix forward.
> The old Shopify store (`stone-surgical-arts.myshopify.com`) is **deactivated**.

Instagram highlight reels are the practice's own taxonomy of what it sells, and they line up with
the four categories: Necklift · Filler · CO2 laser · Skincare · Microneedling · Liposuction ·
Hydrafacial · Lips · Fat grafting · Facial implants · Weight-loss · **Memberships**.
The Memberships highlight confirms the membership programme already exists in some form —
its tiers are not published anywhere public, so the build's tiers are a **proposal**.

## Treatment pricing — UNVERIFIED

Read off the archived `/patient-resources/pricing` page (screenshot `105-…`, captured from a 2026
snapshot). These were the practice's own published prices at the time. **They are two brand
generations old and must be re-confirmed before publishing.**

### Consultation

| | |
| :--- | ---: |
| Texas resident | $175 |
| Out of state | $250 |
| Deposit required to book | $100 |

### Surgical

| Treatment | Fee |
| :--- | ---: |
| Face & Necklift | $18,000 |
| Neck Lift | $11,000 |
| Jawline Implant | $10,000 |
| MyEllevate + FaceTite (neck) | $7,800 |
| MyEllevate Neck Lift | $6,000 |
| Cheek Implants | $5,500 |
| Osteoma Removal | $5,280 |
| Brow & Forehead Lift | $5,000–7,000 |
| Chin Implants | $5,000 |
| Submentoplasty | $3,500–6,500 |
| Surgical Lip Lift | $3,500 |
| Blepharoplasty (upper or lower) | $3,400 |
| Facial Liposuction | $3,000 |
| FaceTite, per area | $3,000 |
| Buccal Fat Pad Reduction | $2,800 |
| Anesthesia, per 15 min | $300 |

### Skin & non-surgical

| Treatment | Fee |
| :--- | ---: |
| Chemical Peel (full face) | $3,500 |
| Laser Resurfacing (full face) | $2,800 |
| Morpheus8 package of 3 | $2,800 |
| Sculptra package of 3 | $2,500 |
| CO2 | $2,000 |
| PRP package of 3 | $1,500 |
| Microneedling + PRP package of 3 | $2,100 |
| Stem Cells | $1,000 |
| Morpheus8 | $1,000 |
| Cosmelan Peel | $800 |
| Microneedling package of 3 | $800 |
| Microneedling + PRP | $750 |
| Mole Removal (first lesion) | $550 |
| PRP (platelet-rich plasma) | $550 |
| Microneedling | $380 |
| Chemical Peel | $150 |
| Neuromodulators (Botox etc.) | call for fee |

### Nurse-injector pricing

| Treatment | Fee |
| :--- | ---: |
| Filler | $800 per syringe · 8-point lift up to 8 syringes $6,000 |
| Sculptra, single session | $900+ |
| Sculptra package of 4 | $3,400 |
| Microneedling, single session | $500 |
| SkinPen | $300 per session |
| HydraFacial | from $189 |
| Botox | $12 per unit |
| Jeuveau | $12 per unit |
| Dysport | $6 per unit |
| Cosmelan Peel | $872 |

Footnote carried on the archived page: prices are face-only, additional areas cost extra, and
microneedling is sold in packages of three.

## Procedure inventory — the four categories

Mapped from the archived `/cosmetic-facial-surgery-southlake/` and `/skin-treatments-southlake/`
sections onto the four categories the Sculpted Ivory board names.

| Category | Board's own line | Treatments |
| :--- | :--- | :--- |
| **Face** | Facial plastic surgery for refined, natural results | Blepharoplasty · Brow & forehead lift · Facelift / Easy Lift · Buccal fat removal · Chin sculpting & reshaping · Facial implants · Facial fat transfer · Surgical lip lift · Male facial enhancement |
| **Neck** | Restore youthful contours and definition | Neck lift · MyEllevate facelift · Neck liposuction · Submentoplasty · FaceTite · Jawline implant |
| **Skin** | Advanced skin rejuvenation for a radiant glow | CO2 laser resurfacing · Morpheus8 · Chemical peels · Cosmelan peel · HydraFacial MD · Microneedling · PRP & regenerative therapy · Skin lesion / mole removal |
| **Non-Surgical** | Enhance your look with minimal downtime | Botox & Xeomin · Dysport & Jeuveau · Dermal & facial fillers · Lip filler · Sculptra · Facial fat transfer (non-surgical protocol) · Hair restoration |

## Before & after — do not scrape

The archived site published **33 before/after cases** of real patients (blepharoplasty, buccal fat,
chin, neck, oral-maxillofacial; lip filler ×5, hair restoration ×3, botox ×2, CO2 ×2).

> [!WARNING]
> Those are identifiable patients whose consent covered a site that no longer exists. The Results
> page ships with an **empty, working gallery** and no recovered photography. Cases go in only when
> the practice supplies them with current consent. Gabby confirmed on 2026-08-29 that photography
> is coming Monday.

## Source access notes

> [!NOTE]
> **The Wayback block lifted. 2026-08-31: the full archive is recovered as text.**
> The screenshot-reading workaround below is history, kept only so nobody repeats it.

- **`web.archive.org` blocked this IP on 2026-08-30** — every request reset, from curl, node and
  Chrome alike. It was **gone by 2026-08-31**, so it was rate limiting, not a ban. If it happens
  again: wait a day before assuming anything.
- `archive-text/fetch-archive.mjs` now recovers **49 pages**; `refetch-stubs.mjs` cleans up after
  it; `extract-treatments.mjs` turns the 28 treatment pages into
  `archive-text/pages/treatments.json` — about **26,000 words** of the practice's own copy, with
  60 of its own FAQ pairs.
- **Two traps in the archive, both now handled in the scripts.**
  1. `fetch-archive.mjs` pins one snapshot timestamp for every URL. Where the nearest capture is a
     301, Wayback returns an ~80-byte redirect stub instead of the page. Eleven pages came back
     that way.
  2. The "closest" snapshot is no better: **every 2026 capture of this domain is a bot-challenge
     interstitial** ("One moment, please…"), archived with status 200 at ~5 KB. The real pages are
     the older captures. `refetch-stubs.mjs` therefore reads the full CDX history and takes the
     **largest** 200 capture, not the newest — length is what separates a real page from an
     interstitial (~140 KB against ~5 KB).
- The old service pages **404 on the live web**. `stonesurgicalarts.com` 301s wholesale to
  `stonedentalimplantcenter.com`, where those paths do not exist, so Google still indexes titles
  it can no longer serve. The archive is the only source.
- The live sister site is reachable and was fetched with `archive-text/fetch-live.mjs`.
- Reading the old screenshots, if ever needed again: `node .tmp/serve.mjs` then
  `http://localhost:8791/shots/<file>.png` — the browser extension refuses `file://` URLs.


---

# Recovered 2026-08-31 — the content expansion

Everything below became available when the Wayback block lifted. It is the material the
[content expansion](../../04-design/.tmp/surgical-arts/HANDOFF.md) is written from, and it is why
the seven pages roughly doubled in length without a single invented fact.

## Reviews — the practice published these itself

The archived testimonials page carries **~35 reviews, each with a patient name**, and the footer of
every page carries **"4.8 from 142+ Reviews"**. That rating is now in the JSON-LD as an
`aggregateRating`, and eight reviews are on the site (six on `index`, eight on `results`).

> [!IMPORTANT]
> **Most of the archive's reviews are the wrong reviews.** They are overwhelmingly *oral surgery* —
> wisdom teeth, jaw cysts, facial trauma, TMJ. All true, all good, and all selling the sister
> practice. Only about eight are cosmetic. Those eight are the ones used; do not "add more reviews"
> by pulling the rest across.

Used on the site: Sarah Routon (lip filler), Darci Wilson (non-surgical, no pressure),
Bahereh Hessari (blepharoplasty), Brittney Culp (a referring provider who is also a patient),
Dia P. (consultation), Saul Rivera (skin), plus two unattributed ones — a consultation review and a
Spanish-language one, both published without a name.

**Still to confirm before launch:** these were published by the practice under a brand that has been
retired, on a site that no longer exists. The names are already public and the legal entity is the
same, so this is a much lighter question than the before/after photographs — but Brandklout should
confirm, and the live Google widget is the better long-term answer either way.

## Press — five items, no surviving links

From `/about-us/facial-surgery-media-articles-southlake`: **D Magazine** ("Mona Stone, D.D.S."),
**CW33 Morning After** (daylight saving and sleep, March 2021), **Real Heroes Need Masks** (she is
a cofounder), **Kelley School of Business** and **McKelvey Engineering** (both on the mask drive).
Also a vodcast, *"If They Can Do It"*, and a YouTube channel.

The archive's "Learn More" targets did not survive, so these are **stated, not linked**. If
Brandklout can supply live URLs they become anchors with no other change.

## Team — Brooke's bio is no longer a gap

The archived About page carries her in full: **board-certified family nurse practitioner and
advanced aesthetic injector**, background in dermatology, several years in the NICU before her
master's, **6+ years injecting**, and she has trained other injecters. Married, two daughters.

Still missing, for Gabby: **surnames and portraits for both Brooke and Abby**, and anything at all
about **Abby** — the archive has nothing.

## Dr. Stone — training, at institution level

The sister site describes the shape; the archive names the places. Internship at **Truman Medical
Center**, then residency in Oral and Maxillofacial Surgery at **Broward General Medical Center**.
Broward General is in Fort Lauderdale and is a Level 1 trauma centre, so this does **not** conflict
with the sister site's "three Level 1 trauma centers in Fort Lauderdale" — same fact, two zoom
levels. Both are on `about.html`.

Also hers, from the archive: mother of two, motor-sport and Formula 1 supporter, TikTok creator.

## Financing — four providers, not one

`/patient-resources/financing`: **Sunbit, CareCredit, Scratchpay and Cherry**, plus
*"preferred provider with all major carriers"* for insurance. The current Linktree points at Sunbit,
so Sunbit leads on the site and CareCredit and Scratchpay are named after it. **Cherry is
deliberately not carried forward** — the brief already recorded it as superseded.

## Pre-op and post-op — the best content in the archive

Two pages, both now on `book.html`:

- **IV sedation preparation** — nine instructions, reproduced in full and marked in the markup as
  clinical text that must not be paraphrased. Eight-hour fast, twelve hours no smoking, a
  responsible adult who stays and drives, no driving for 24 hours, loose sleeves, no contacts or
  jewellery, no makeup or polish, tell them about any illness, check routine medication.
- **Post-operative** — return-to-work windows (a week after eyelid surgery, ten days after CO2, two
  weeks after a facelift), the exercise ramp (10 lb to day 15, 20 lb and non-impact cardio from 15,
  jogging and swimming from 21, six weeks before free head movement after a facelift), makeup at 48
  hours after suture removal, SPF 30+ from two weeks until the pink goes, and follow-up **for up to
  eighteen months**.

> [!TIP]
> **The single best paragraph in the whole archive** is on that post-op page: a frank passage about
> post-operative melancholy, and about family and friends not commenting on the result. No
> competitor in this market says it. It is on `book.html` as the fourth recovery card and it should
> not be cut for length.

## Service area — the practice's own list

From `/facial-surgery-southlake`: Irving · Grapevine · Keller · Fort Worth · Southlake · Roanoke ·
North Richland Hills · Coppell · Trophy Club · Colleyville · Dallas · Watauga · Bedford · Euless ·
Hurst · Flower Mound · Double Oak · Corinth · Argyle · Denton. On `index.html` as plain text, and in
`seo.json` as `areaServed`.

Deliberately **not** links: there are no city landing pages behind them, and inventing twenty would
be doorway pages rather than content.

## Treatments the taxonomy was missing

The archived nav and the "procedure of interest" dropdown list several the first build did not
carry: **SkinPen · Dermaplaning · HydraFacial · Microneedling · Regenerative therapy · Fat transfer
· Cosmelan peel**, plus a **Weight Loss Program** and the whole **Oral Surgery / Jaw & Implants**
tree. The first six are now in the Skin and Non-Surgical category bands.

**Oral surgery and jaw surgery are deliberately excluded.** Alejandro's brand decision was Stone
Surgical Arts with a Face/Neck/Skin/Non-Surgical taxonomy, and the reference image supplied with the
Asana task strikes *Oral Surgery Procedures* out. The weight-loss programme belongs to the med spa
(Westlake Medical Aesthetics), which is a separate brand and a separate task.

## Retail — skinbetter science®

The archived home page says the practice is an authorised **skinbetter science®** stockist, a
physician-dispensed line. It is on `memberships.html` as part of what member pricing covers.
Confirm the relationship still stands. The old Shopify store is deactivated; current retail is
`shopmy.us/drjawline`.

## Stock imagery — Magnific

Eight images, pulled through the Magnific / Freepik API by
[`site-src/get-stock.mjs`](../../04-design/.tmp/surgical-arts/site-src/get-stock.mjs) and recorded
with their ids, authors and licences in `site-src/stock-manifest.json`.

> [!WARNING]
> **Every slot is a room, an object or a texture. None is a face, and none may become one.**
> A stock model on a surgery page reads as a patient; a stock face beside a treatment name reads as
> that treatment's result. Both are misrepresentation on a medical site whatever the alt text says.
> The script asserts `people: exclude`, carries a per-slot `avoid` list, and the reasoning is at the
> top of the file.

The API returns 5,376px originals up to 16 MB, so the script centre-crops to 16:9 and re-encodes to
WebP at 1600px — 8 images, ~730 KB total. Two API quirks worth knowing: the **orientation filter is
not honoured** (a "horizontal" query returned a 1600×2400 flat-lay twice, hence the crop), and
Pillow does the encoding because there is **no ImageMagick on this machine** — `convert` on PATH is
the Windows filesystem utility, not ImageMagick.

The key is `MAGNIFIC` in the repo-root `.env`, copied from the `bk-dr-nahlah` worktree. `.env` is
per-worktree and gitignored, so a fresh worktree needs it copied again.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
Documentation and lightweight artifacts only — no binaries.
