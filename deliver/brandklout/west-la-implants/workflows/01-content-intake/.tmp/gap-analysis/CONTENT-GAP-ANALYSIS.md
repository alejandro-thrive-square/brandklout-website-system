# Content Gap Analysis: West LA Implants vs Wilshire Oral Surgery

| Field | Value |
| :--- | :--- |
| **Client** | West LA Implants, `westlaimplants.com` (Dr. Tony Barriere, DDS) |
| **Client address** | 12301 Wilshire Blvd #205, Los Angeles CA 90025 |
| **Competitor** | Wilshire Oral Surgery & Implant Center, `wilshireoralsurgery.com` |
| **Competitor address** | 12300 Wilshire Blvd #326, Los Angeles CA 90025 (**across the street**) |
| **Competitor 2** *(added 2026-09-10)* | Santa Monica Center for Oral Surgery, `santamonicaoms.com`, 2001 Wilshire Blvd, Santa Monica |
| **Competitor 3** *(added 2026-09-10)* | Implant Center Los Angeles / Wilshire Smile Studio, `implantcenterlosangeles.com`, 6200 Wilshire Blvd #1609 |
| **Pulled** | Client + competitor 1: 2026-08-20. Competitors 2 and 3: 2026-09-10 |
| **Method** | Full sitemap crawl of both sites, text + structure extracted per page |
| **Feeds** | `01-content-intake`, `02-wireframe` (IA), `06-content-seo` |

## Update 2026-09-10: two more benchmarks

Two further competitors were crawled on 2026-09-10 to widen the benchmark from one
neighbour to three. The rest of this document still reads client vs Wilshire; this section
puts all four on one table. A homepage-level comparison of the same four sites is in
[`HOMEPAGE-GAP-ANALYSIS.md`](./HOMEPAGE-GAP-ANALYSIS.md).

| | **West LA Implants** | **Wilshire Oral Surgery** | **Santa Monica OMS** | **Implant Center LA** |
| :--- | ---: | ---: | ---: | ---: |
| Domain | `westlaimplants.com` | `wilshireoralsurgery.com` | `santamonicaoms.com` | `implantcenterlosangeles.com` |
| Distance from 12301 Wilshire | — | across the street | ~3.5 mi west | ~7 mi east |
| URLs crawled | 91 | 79 | 91 | **69** |
| Designed pages | 42 | **66** | 36 | 51 |
| Blog posts | 46 | 13 | **53** | 17 |
| Category / archive pages | 3 | 0 | 2 | 1 |
| Total words | 66,775 | 105,475 | **143,546** | **28,943** |
| Average words per page | 734 | 1,335 | **1,577** | **419** |
| Median words per page | 755 | 1,527 | 1,465 | 354 |
| Homepage words | 1,118 | 1,162 | 6,757 † | **421** |
| Homepage images | 17 | 21 | **50** | 30 |
| Service lines owned | **9** | 8 | 7 | 7 |
| Neighbourhood landing pages | **0** | **31** | 1 | **0** ‡ |
| Pages with an FAQ block | **1** | **44** | 12 | 1 |
| Pages carrying a treatment price | 0 § | **1** (the implant hub price menu) | 3 (blog posts only) | **0** ¶ |
| Pages with any JSON-LD | 90 of 91 | **79 of 79** | **1 of 91** | 69 of 69 |
| Distinct media URLs | **219** | 59 | 142 | 35 |
| Pages with a form | 8 | 5 | 2 | **66** |

† SMOMS's homepage word count is inflated by a visually hidden testimonial carousel that
repeats the same six reviews twelve times. Their visible homepage copy is roughly 900 words.

‡ ICLA has no neighbourhood pages, but names its catchment in a homepage `h2`: "Serving Los
Angeles, Santa Monica, Beverly Hills, West Hollywood, and More."

§ The client's two flagged pages are a blog post about affordable implants and
`/financing-los-angeles-ca/`, where every dollar figure is a **lender credit limit**, not a
treatment price. The conclusion in §2 below stands: the client publishes no price.

¶ ICLA's headline offer — **"$99 Special — Dental Implant Consult + CT Scans"** — runs as an
announcement bar and as a baked JPEG. It never reaches indexable body text, so a search
engine, a screen reader and an answer engine all see nothing.

**What the two new benchmarks change, and what they do not.**

1. **The neighbourhood gap is Wilshire's alone.** Neither new competitor runs a
   service x neighbourhood matrix — SMOMS has one location page, ICLA has none. Local
   coverage stays the largest single opportunity, but it is now clear that it is one
   competitor's strategy rather than the market norm. It is still worth taking; the client
   would be second into open ground, not ninth.
2. **Page depth is not a market standard either.** SMOMS averages 1,577 words a page and ICLA
   averages 419. The client sits between them at 734. Wilshire's 1,335 is a choice, not a
   floor.
3. **Nobody in the market publishes implant prices properly.** Wilshire has a price menu on
   one hub page, SMOMS gives ranges only inside blog posts, ICLA hides a $99 offer in an
   image. "Implant cost as an owned, indexable destination page" remains unclaimed across all
   four sites.
4. **Structured data: the client's lead has narrowed sharply.** See the correction in §4 below.
5. **The client's media library is still the widest moat.** 219 distinct assets against 142,
   59 and 35, and the client is the only one of the four with named patient story films.
6. **Nothing here changes the build range.** The 28–34 designed-page estimate at the foot of
   this document holds.

Numbers produced by [`../scrapers/compare_four.py`](../scrapers/compare_four.py), output at
[`four-site-summary.csv`](./four-site-summary.csv). Re-run with:

```bash
cd deliver/brandklout/west-la-implants/workflows/01-content-intake/.tmp
python scrapers/compare_four.py --out gap-analysis/four-site-summary.csv
```

## Why this competitor

Six candidates were screened on geography, service focus and content footprint:
`wilshireoralsurgery.com`, `westlosangelesperio.com`, `brentwooddentalcare.net`,
`ladentist.com` (Wilshire Smile Studio), `implantcenterlosangeles.com` and
`santamonicaoms.com`.

Wilshire Oral Surgery wins the comparison on every axis that matters:

- **Same block.** 12300 Wilshire Blvd vs the client's 12301 Wilshire Blvd. Same ZIP, same
  intersection, same catchment. Nobody else screened is closer than half a mile.
- **Same money procedure.** Implants and full-arch are their lead offer, not a sideline.
- **Comparable footprint.** 79 indexed URLs against the client's 91, so differences read as
  strategy rather than as one site simply being bigger.

`westlosangelesperio.com` leads with periodontics (87 homepage mentions against 36 for
implants) and `brentwooddentalcare.net` is a general and cosmetic practice, so both were
dropped on specialty mismatch. `ladentist.com` and `implantcenterlosangeles.com` are the same
operator at the same suite in mid-Wilshire, not West LA. `santamonicaoms.com` was the
runner-up: right specialty, wrong catchment.

The full screen, its criteria and the per-candidate evidence are in
[`COMPETITOR-SELECTION.md`](./COMPETITOR-SELECTION.md) and `competitor-screen.csv`.

## Headline numbers

| Metric | West LA Implants | Wilshire Oral Surgery |
| :--- | ---: | ---: |
| URLs crawled | 91 (100% success) | 79 (100% success) |
| Designed pages | 42 | 65 |
| Blog posts | 46 | 13 |
| Category / archive pages | 3 | 1 |
| Total words | 66,775 | 105,475 |
| **Average words per page** | **734** | **1,335** |
| Median page | 755 words | ~1,540 words |
| Neighborhood landing pages | **0** | **31** |
| Pages with exactly one `h1` | **9 of 91** | **78 of 79** |
| Distinct media URLs referenced | 219 | 59 |

The competitor publishes **58% more words across 12 fewer URLs**. Their pages are roughly
**1.8x deeper** than the client's. The client's advantage is breadth of service line and a
much richer media library; the competitor's is depth per page and local coverage.

## The five gaps that matter

### 1. Local coverage: 31 neighborhood pages against 0

This is the largest single gap and the one with the clearest revenue line.

The competitor runs a **service x neighborhood matrix**: nine Westside neighborhoods
(Brentwood, Century City, Culver City, Mar Vista, Palms, Santa Monica, Sawtelle, West Los
Angeles, Westwood) crossed against four services.

| Service | Neighborhood pages | Avg words |
| :--- | ---: | ---: |
| `dental-implants-{city}-ca` | 9 | 1,568 |
| `oral-surgeon-{city}-ca` | 9 | 1,760 |
| `wisdom-teeth-removal-{city}-ca` | 9 | 1,604 |
| `sedation-dentistry-{city}-ca` | 3 | 1,526 |
| `all-on-x-dental-implants-west-los-angeles-ca` | 1 | 1,577 |
| **Total** | **31** | **1,631** |

These are not thin doorway pages. Each runs about 1,600 words on a consistent template:

```
h1  Dental Implants near Brentwood CA
h2  Dental Implants for Brentwood Patients, Minutes from Wilshire Boulevard
h2  What Makes a Dental Implant the Right Choice
h2  The Implant Process at Wilshire Oral Surgery and Implant Center
h2  IV Sedation Options for Implant Surgery
h2  Understanding the Cost of Dental Implants near Brentwood
h2  Our Surgeons, Board-Certified Implant Expertise Serving Brentwood
h2  Frequently Asked Questions, Dental Implants near Brentwood
h2  Schedule Your Implant Consultation Near Brentwood
      h3  Contact Information
      h3  Hours of Operation
```

The client has **zero** neighborhood pages. Every service page carries a
`-los-angeles-ca` slug and targets the city as one undifferentiated market. In headings,
the competitor mentions Santa Monica 28 times, Westwood 27, Brentwood 21, Culver 21. The
client mentions each of them **zero** times.

### 2. Price and offer are published; the client's are not

The competitor leads their implant hub with a hard, specific commercial offer:

> **New Permanent Teeth in 24 Hours.** Full Upper or Lower set of Zirconia Teeth
> Permanently Secured on 4 Implants. Advanced Digital Technology, 0% Financing Available.
> **Starting at $110 per month.** Limited-Time Offer. Free Consultation.

They publish a full price menu on the implant hub, state 0% financing three times, offer a
free consultation four times, and carry a dedicated "Understanding the Cost of Dental
Implants" `h2` on every implant page including all nine neighborhood variants.

> All-on-4 **from $9,990** · All-on-6 **from $12,990** · Single dental implants **from
> $2,500** · Snap-on dentures **from $4,650**

| Signal | West LA Implants | Wilshire Oral Surgery |
| :--- | :--- | :--- |
| Published treatment price | **none** | 4 procedures priced |
| Monthly payment figure | **none** | $110/month |
| "0% financing" | **0 mentions** | 3 |
| "Free consultation" | **0 mentions** | 4 |
| Financing partners named | **6** + in-house savings plan | 3 |

The client does have a `Cost & Compare` page
(`/dental-implant-surgery-los-angeles-ca/full-mouth-dental-implant-affordability-los-angeles/`),
and the financing page is genuinely strong: six lenders (Lending Club, CareCredit, Proceed
Finance, Alphaeon, Cherry, Sunbit) against the competitor's three, plus an in-house West LA
Implants Dental Savings Plan that the competitor has no equivalent of.

What the client never states is **a price for a procedure**. Every dollar figure on the site
is a lender's credit limit ($60,000 through Proceed Finance, $25,000 through Alphaeon) or a
savings-plan membership fee. A patient can learn how to borrow for treatment and still not
learn what treatment costs. The competitor answers that question in their hero.

### 3. Authority framing: "board-certified" 192 times vs 0

The competitor is two board-certified oral surgeons (DDS, MD) and they say so relentlessly:
**192 occurrences of "board-certified"** across the site, plus "15+ Years Experience",
"5000+ Successful Implants", "5-Star" review proof, and "same-day" 59 times, all of it in
the hero of the implant hub.

The client's site says "board certified" **zero times**, and the homepage `h1` reads
**"General Dentist - Los Angeles, CA"**.

The sharpest illustration is that the two practices make **the same proof claim** and place
it in opposite ways. The competitor's hero reads "5000+ Successful Implants". The client
has the identical credential, "more than 5,000 sets of dental implants" and "more than 10
years of experience", buried in body prose on `/commitment-to-excellence/`, a third-level nav item
under "Who We Are". The asset exists. The placement does not.

This is not a copy gap that can be closed by writing better copy. Dr. Barriere is a general
dentist placing implants; the competitor are surgical specialists. The rebuild has to build
authority on a **different axis**: Yomi robotic-guided surgery (which the competitor does
not offer at all), full restorative and cosmetic capability under one roof, case volume, and
patient-story video. Claiming surgical parity would be both false and losable.

### 4. Answer-engine surface: FAQ blocks and structured data

| | Client | Wilshire | SMOMS | ICLA |
| :--- | :--- | :--- | :--- | :--- |
| Pages with a "Frequently Asked Questions" `h2` | **1** | **44** | 12 | 1 |
| "What to expect / recovery" `h2` sections | 3 | **27** | — | — |
| `FAQPage` schema | none | none | **1 page (homepage)** | none |
| `AggregateRating` schema | **1 page** (`4.9`, 40 reviews) | **79 pages** (`4.9`, 238 reviews) | none | none |
| `VideoObject` schema | **5 pages** | none | none | none |
| Any JSON-LD | 90 of 91 pages | **79 of 79 pages** | 1 of 91 pages | 69 of 69 pages |

The competitor attaches an FAQ block to **44 pages**, the client to one. That is the shape
Google's AI Overviews and the LLM answer engines reward, and it remains the clearest
technical gap on the site.

> **Correction, 2026-09-10.** The August pass read only the top-level `@type` of each JSON-LD
> block and missed everything nested inside `@graph`. Re-parsed recursively, two of the three
> claims in the original version of this section were wrong.
>
> - **Wilshire is not weak on structured data.** They emit `LocalBusiness`, `Organization`,
>   `BreadcrumbList`, `PostalAddress`, `EducationalOccupationalCredential` **and
>   `AggregateRating` (`4.9`, `238` reviews) on all 79 pages** — not `BreadcrumbList` on 31.
>   They out-mark the client on review schema completely.
> - **The client already has `AggregateRating` and `VideoObject`.** The homepage carries
>   `AggregateRating` (`4.9`, `40` reviews, static 2022-era markup) and `VideoObject` on five
>   pages, including the homepage `Master-Broll.mp4` clip. No competitor has any `VideoObject`.
> - **SMOMS ships `FAQPage`** on its homepage — the only `FAQPage` markup across all four
>   sites — but nothing at all on its other 90 pages.
>
> **Revised conclusion.** The client's structured-data advantage is real but narrow: it is
> `VideoObject` (uncontested) plus sitewide coverage. It is *not* review markup, where
> Wilshire now leads on every page. The open ground worth taking in `06-content-seo` is
> `FAQPage` on every service page — which only SMOMS has, and only once — combined with the
> `VideoObject` lead the client already holds and should extend to the patient story films.

### 5. Whole service lines the competitor owns and the client does not

| Topic | Client pages | Competitor pages | Competitor words |
| :--- | ---: | ---: | ---: |
| Wisdom teeth removal | **0** | 10 | 15,763 |
| Corrective jaw surgery / TMJ / oral pathology | **0** | 8 | 11,640 |
| Sedation and IV / general anesthesia | 1 page + 1 post (1,428 w) | 6 | 8,724 |
| Cone-beam 3D imaging / technology page | **0** | 2 | 2,867 |
| Zygomatic implants | **0** | 1 (blog post) | 818 |
| Referring-doctor page | **0** | 1 | 362 |
| Pre-op / post-op instructions | **0 pages** (1 PDF) | 3 | 2,418 |
| Accessibility statement | **0** | 1 | 575 |

Wisdom teeth and jaw surgery are genuine specialist scope and are **not** automatically a
recommendation for the client to chase. Note also that the client already *has* post-op
content, as `Post-OP-Instructions-after-a-Tooth-Extraction.pdf` in the media library. It is
trapped in a PDF instead of published as an indexable page. But sedation, technology, pre/post-op instructions,
zygomatic implants (a full-arch differentiator for severe bone loss) and a referring-doctor
page all sit inside what an implant-led general practice legitimately owns, and all are
missing.

## Where West LA Implants is already ahead

Do not rebuild past these. They are the existing moat.

| Strength | Client | Competitor |
| :--- | :--- | :--- |
| Implant restoration breadth (hybrid fixed-detachable, zirconia fixed bridge, implant-supported dentures) | 3 dedicated pages | **0** |
| Yomi robotic-guided surgery | dedicated page | **0** |
| Cosmetic line (hub + veneers/Lumineers, whitening, smile makeover, Invisalign) | 5 pages | **0** |
| "Conditions we treat" framing (missing teeth, bone loss, failing implants, loose dentures) | 4 pages, 3,150 w | **0** |
| Before/after gallery + patient stories + video library | 3 pages | 0 dedicated |
| Media library | **219 distinct media URLs**, 788 files, 102 MB | 59 |
| Video | **12 embedded YouTube clips + 4 self-hosted B-roll MP4s** (33 MB) | 1 mention |
| Named patient stories with stills and footage | Leslie, Emily, Michael | none |
| Blog depth | **46 posts** | 13 |
| Structured data | `Dentist`, `MedicalOrganization`, `BlogPosting`, **`VideoObject` on 5 pages** | `LocalBusiness` + `AggregateRating` sitewide, **no `VideoObject`** |

The blog is a real asset with a real problem: **46 question-format posts** ("Are There
Factors That Determine Which Type Of Dental Implant Procedure I Can Get Treated With?") is
exactly the shape answer engines cite, and 30 of them were published in 2022, 16 in 2023.
**The newest post is 2023-08-20, three years stale.** The archive is worth migrating; the
cadence is worth restarting.

## Where both sites are weak (open ground)

1. **Implant cost as a destination page.** Neither site owns a page titled for implant cost.
   The competitor covers it as a section, the client not at all. High-intent, unclaimed.
2. **`FAQPage` schema at scale.** Across all four sites there is exactly one `FAQPage` block
   (SMOMS's homepage). Wilshire has 44 FAQ *blocks* and no markup on any of them.
3. **Spanish-language content.** Zero on both sites, in a market where it is a live demand.
4. **Named cost comparison** (implants vs bridge vs denture, with figures). Both gesture at
   it, neither commits.

## Technical hygiene deltas found in the crawl

| Check | Client | Competitor |
| :--- | :--- | :--- |
| Pages with **no `h1` at all** | **47 of 91** (all 46 blog posts + 1) | 0 |
| Pages with **two `h1`s** | **35** | 1 |
| Pages with exactly one `h1` | 9 | 78 |
| Missing meta description | 5 | 0 |
| Duplicate meta descriptions | 8 | 1 |
| Title tag over 60 chars | 40 | 32 |
| `og:image` present | 83 of 91 | 37 of 79 |

Two client-specific defects worth carrying into the build brief:

- **`/schedule/` is a 1,449-byte third-party Angular shell.** The primary "Schedule"
  call to action across the whole site lands on an app whose `<title>` is literally
  **"Evspatient"**, with no branding, no copy, no indexable content and no JSON-LD. It is
  the only page on the site with zero words. Every booking click leaks out of the brand at
  the exact moment of highest intent.
- **The doctor's own bio page is at `/tony-barrier-dds/`, misspelling Barriere**, and runs
  411 words. The competitor's two surgeon bios run 694 and 710 words each and their
  `/about-us` runs 1,257.
- **The global phone CTA points new patients at the current-patient line.** The practice
  runs two numbers on purpose: **(310) 692-9316 for New Patients** and **(310) 481-0111 for
  Current Patients**. The new-patient number appears on exactly four URLs (two survey
  thank-you pages and two 2022 blog posts). The header, footer and every service page across
  all 90 crawled pages show **only (310) 481-0111**. Every new-patient call from the site is
  being routed into the existing-patient line, and any call tracking attached to 692-9316 is
  measuring almost nothing.

## What this means for the from-scratch build

The blocking open question in
[`project-overview.md`](../../../../docs/project-overview.md) is the page count. This
analysis gives it a defensible floor rather than a guess.

**Consolidate, then extend.** The 42 existing pages compress to roughly 22 designed pages
(the four cosmetic pages merge into one cosmetic hub with sections; the four "conditions we
treat" pages merge into one; the thank-you and survey pages become states, not pages). The
46 posts become a CMS collection, not designed pages.

Against that, closing the gaps above adds:

| Addition | Pages |
| :--- | ---: |
| Neighborhood landing pages (implants x 6 to 9 Westside neighborhoods) | 6 to 9 |
| Implant cost page (owned, with figures) | 1 |
| Technology page (Yomi + 3D imaging as the authority axis) | 1 |
| Sedation and comfort page | 1 |
| Pre-op / post-op instructions | 1 |
| Referring-doctor page | 1 |
| Accessibility statement | 1 |

A build in the **28 to 34 designed-page** range closes the competitive gap. At
`pages x 2 days` that is 56 to 68 execution days. If Brandklout wants a tighter number, the
neighborhood set is the compressible part: ship the six highest-value neighborhoods as one
CMS-templated page rather than six designed pages and the count drops back toward 24.

**Three build decisions this analysis forces:**

1. **Bring booking in-house.** Replacing the "Evspatient" shell with a branded, indexable
   booking page is the highest-leverage single fix on the site.
2. **Every service page gets an FAQ block and FAQPage schema.** The competitor has the
   blocks and none of the schema. Doing both is a clean win.
3. **Authority is built on technology and restorative breadth, not surgical credentials.**
   Yomi robotics, full-arch prosthetic range and patient-story video are the assets the
   competitor cannot match. Lead with them.

## Evidence files

All produced by the scrapers in `../scrapers/`, re-runnable.

| File | What it holds |
| :--- | :--- |
| `page-inventory-westlaimplants.csv` | 91 rows: URL, title, meta, H1, words, schema, images, forms |
| `page-inventory-wilshireoralsurgery.csv` | 79 rows, same columns |
| `topic-matrix.csv` | 50-topic taxonomy x both sites, with pages/words/H2-sections/body mentions and a verdict per row |
| `heading-terms.csv` | Term frequency across H1-H3, both sites, with delta |
| `blog-topics.csv` | Every post title, URL, word count and publish date |
| `trust-signals.csv` | 22 conversion and trust signals, presence per site |
| `gap-data.json` | All of the above, structured |
| `four-site-summary.csv` | Site-level metrics for all four sites (2026-09-10), from `compare_four.py` |
| `HOMEPAGE-GAP-ANALYSIS.md` | Homepage-only comparison of the same four sites, plus the recommended homepage blueprint |
| `../homepage-screenshots/` | 1440px full-page and above-the-fold PNGs of all four homepages and `concept-03`, with their rendered HTML |
| `../competitor-scrape/santamonicaoms/` | Competitor 2: 91 pages, same shape |
| `../competitor-scrape/implantcenterlosangeles/` | Competitor 3: 69 pages, same shape |
| `../current-site-scrape/` | Client: 91 page extracts (`pages/*.md`), records (`data/*.json`), raw HTML, `site-data.json`, `media-manifest.csv` |
| `../competitor-scrape/wilshireoralsurgery/` | Competitor: same shape, 79 pages |
| `../../../03-graphic-resources/.tmp/` | Downloaded client binaries, `asset-manifest.csv`, `ASSETS.md` |

### Reproducing

```bash
cd deliver/brandklout/west-la-implants/workflows/01-content-intake/.tmp

python scrapers/scrape_site.py --site https://westlaimplants.com \
    --out "$(pwd)/current-site-scrape" --delay 0.7 --save-html

python scrapers/scrape_site.py --site https://wilshireoralsurgery.com \
    --out "$(pwd)/competitor-scrape/wilshireoralsurgery" --delay 0.8

python scrapers/compare_content.py \
    --client current-site-scrape/site-data.json --client-label westlaimplants \
    --competitor competitor-scrape/wilshireoralsurgery/site-data.json \
    --competitor-label wilshireoralsurgery --out "$(pwd)/gap-analysis"

# 2026-09-10 additions
python scrapers/scrape_site.py --site https://santamonicaoms.com \
    --out "$(pwd)/competitor-scrape/santamonicaoms" --delay 0.8

python scrapers/scrape_site.py --site https://implantcenterlosangeles.com \
    --out "$(pwd)/competitor-scrape/implantcenterlosangeles" --delay 0.8

python scrapers/compare_four.py --out gap-analysis/four-site-summary.csv
```

## Caveats

- Both crawls are **server-rendered HTML only**. Content injected by JavaScript after load
  is invisible to this pass. That is why `/schedule/` reads as zero words: it is a real
  finding for SEO, but the app itself does function for a human visitor.
- The competitor's blog posts expose no `article:published_time`, so their publishing
  cadence cannot be compared against the client's directly. Only the client's dates are known.
- Topic matching keys on URL, title tag and H1 for "owns a page", and on H2 text for
  "covers as a section". A topic discussed only in body prose shows in the
  `body_mentions` column and is deliberately not counted as coverage.
- Word counts exclude nav and footer chrome only where the theme does not repeat it as
  headings. Both sites are affected equally, so the ratio holds even if absolute counts
  run slightly high.
- **Schema counts before 2026-09-10 read only the top-level `@type`** of each JSON-LD block
  and therefore missed everything nested inside an `@graph`. `compare_four.py` walks the tree
  recursively. Where the two disagree, the recursive count is correct — see the correction
  box in §4.
- **SMOMS's word counts are not directly comparable.** Their Framer build ships several
  visually hidden duplicate blocks (the homepage testimonial carousel repeats twelve times),
  which the crawler counts as text. Their totals run high by an unknown margin.
- **The client and Wilshire were crawled on 2026-08-20, the two new competitors on
  2026-09-10.** Any change either older site made in that three-week window is not captured,
  with one exception: the JSON-LD figures above were re-parsed from the stored HTML on
  2026-09-10.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). This
analysis and the CSV evidence tables are committed. Downloaded binaries under
`03-graphic-resources/.tmp/downloads/` and the raw HTML under
`current-site-scrape/html/` are not.
