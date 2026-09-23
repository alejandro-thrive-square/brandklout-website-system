# Livewell Dental — Existing Site Audit (Pass 1: public HTML)

- **Crawled**: 2026-07-27, 57 URLs from `https://www.livewelldentalva.com/sitemap.xml`, all HTTP 200
- **Staging**: `https://livewelldentalva.webflow.io` (last published Mon Jul 27 2026 16:17 UTC)
- **Site ID** (from `data-wf-site`): `69d03fdbe999e9907724a69d`
- **Method**: `crawl.mjs` → `site-inventory.json`. Every figure below is machine-counted from raw HTML, not sampled.
- **Scope of this pass**: public HTML only. Webflow-internal findings (client comments, class system, unpublished changes, CMS schema, form submissions) require MCP auth and land in Pass 2.

> [!WARNING]
> **Pass-1 correction note**: an early run of the crawler reported "0 meta descriptions,
> 0 canonicals site-wide". That was a regex bug — Webflow emits `content="…" name="…"`
> in the reverse attribute order. The extractor now tries both orders and the figures
> below are verified against raw HTML. Do not quote the earlier numbers.

---

## P0 — Live defects (broken for real users right now)

### 1. Two published city pages are completely blank
`/city-pages/dentist-lorton-va` and `/city-pages/dentist-newington-forest-va`

Both render an empty body — 0 words, no H1, no header, no nav, no footer. After stripping
scripts the entire body is 454 characters: an Elfsight reviews div and the GTM noscript tag.
Both are **in the sitemap**, indexable, no `noindex`. These are local-SEO landing pages that
ship nothing — Google is being handed two empty pages, and any ad or GBP link pointing here
dead-ends.

### 2. Wrong phone number on the blog post
`/post/no-prep-veneers-vs-traditional-veneers-whats-the-difference` has a floating call
button wired to `tel:+16306138942`. Area code **630 is Illinois**; the practice is
Fairfax Station, **VA (703-690-0102)**. Anyone tapping call from that page reaches the
wrong number. One-attribute fix, but it is live lead loss.

### 3. Blog canonical points to a URL that does not exist
`/blog` declares `<link rel="canonical" href="https://www.livewelldentalva.com/new-patient/blog">`.
That path is not in the sitemap and is not a real page. A canonical pointing at a non-existent
URL tells Google to drop `/blog` from the index. This is the only canonical mismatch on the site
— the other 56 are correct and self-referencing.

### 4. Blog post has no `<title>` and no meta description
The single published post ships with no title tag at all — the SERP entry falls back to
whatever Google infers. It also carries **two H1s**.

---

## P1 — SEO and shareability

| Finding | Count | Detail |
| :--- | :--- | :--- |
| Pages missing `og:image` | **56 of 57** | Only the homepage has one. Every link shared to Facebook/iMessage/WhatsApp renders as a blank card — for a practice whose main social channel is Facebook, this is the highest-leverage cheap fix. |
| Pages missing meta description | 4 | The 2 blank city pages, `/cosmetic-smile-virtual-consult`, and the blog post. The other 53 are written and non-duplicated. |
| Titles over 60 chars | 16 | e.g. `Comprehensive Dental Evaluation in Fairfax Station, VA \| Livewell Dental` (72). Truncated in SERPs — the brand suffix is what gets cut, or the keyword is. |
| Meta descriptions over 160 chars | 4 | `/about-us/technology` (166), `/about-us/office-tour` (169), `/services/wisdom-teeth-removal` (167), `/services/implant-bridges` (163). |
| Pages with no structured data | 6 | `/about-us/about-dr-chris`, `/about-us/livewell-difference`, `/about-us/meet-the-team`, both city pages, `/cosmetic-smile-virtual-consult`. |
| Heading-order jumps (h2→h4 etc.) | 8 pages | |

**What is already good and should not be touched:** schema coverage is genuinely strong on the
service pages — `Dentist`, `PostalAddress`, `GeoCoordinates`, `OpeningHoursSpecification`,
`BreadcrumbList`, and `FAQPage` on 39 pages, plus `MedicalProcedure` on 7. Titles and
descriptions are hand-written per page with local keywords. Whoever did the on-page SEO for
the service pages knew what they were doing. The gaps are concentrated in the About section,
the city pages, and the blog.

---

## P1 — Accessibility

**1,424 of 2,392 images (60%) have no alt attribute.** This is site-wide, not isolated:

| Page | Missing alt |
| :--- | :--- |
| `/about-us/technology` | 55 / 77 |
| `/services/all-on-x` | 45 / 67 |
| `/services` | 43 / 62 |
| `/services/implant-bridges` | 42 / 63 |
| `/` (home) | 40 / 85 |
| `/services/dental-implant` | 40 / 63 |
| `/services/cosmetic-dentistry` | 39 / 53 |
| `/services/orthodontics` | 38 / 58 |

For a healthcare provider this carries ADA exposure, not just an SEO cost — dental practice
websites are an active target for ADA web-accessibility demand letters in the US. It is also
2,392 images of unrealized image-search traffic for a visual specialty (smile galleries,
before/afters).

---

## P1 — Conversion architecture

**There are zero native `<form>` elements on the entire site.** All lead capture runs through
third-party iframes:

- `api.leadconnectorhq.com` (GoHighLevel / LeadConnector) — on only **3 pages**: `/contact-us`,
  `/about-us/careers`, `/cosmetic-smile-virtual-consult`
- `reputationhub.site` — 1 page
- `cdn.embedly.com` — 22 pages
- `www.google.com` maps — 55 pages

Consequences worth raising with Brandklout:
- **54 of 57 pages have no form.** Forty-odd service pages — the pages that rank and receive
  the traffic — offer no way to convert except a phone tap or a trip to `/contact-us`.
- Iframe forms are invisible to Webflow's form submissions, and their fields, validation, and
  mobile behavior are outside our control.
- Conversion tracking is dependent on whatever GTM (`GTM-KL36RQV2`) is configured to catch
  cross-origin — worth verifying that form fills are actually being attributed.
- Phone links are inconsistently formatted across the site (`tel:7036900102`,
  `tel:+17036900102`, `tel:703-690-0102`), which fragments click-to-call tracking in GA/GTM.

---

## P2 — Build quality and maintainability

### The site is almost entirely static — CMS is barely used
Only **2 of 57 pages** contain a Collection List (`/blog` and the blog post template).
The 40+ service pages, both city pages, the team page, and the smile gallery are all
hand-built static pages.

This is the single biggest structural cost. Every one of the P0/P1 fixes above — og:image,
alt text, phone number normalization, title lengths, adding a form to service pages —
currently has to be repeated 40+ times by hand instead of once on a template. Any future
service page is a manual duplication. **A Services CMS collection would convert most of this
audit's remediation from 40 edits into 1.**

### Weight and third-party load
- Average page: **87 KB of HTML** (max 141 KB) before assets — heavy for a brochure site
- **1,652 `w-embed` custom-code blocks** across 57 pages (~29 per page)
- Sliders on all 57 pages, lightbox on all 57, tabs on 9
- Elfsight Google Reviews widget (`5dc13b7b-…`) loads on **all 57 pages**, including the two
  blank ones — a third-party render-blocking dependency on every route
- External script hosts: `ajax.googleapis.com` (webfont.js), `cdn.jsdelivr.net` (116 refs),
  `elfsightcdn.com`, `d3e54v103j8qbb.cloudfront.net`, `link.msgsndr.com`
- Positive: **all 2,392 images are lazy-loaded** and served as `.webp` from the Webflow CDN

---

## Recommended remediation sequence

1. **Same-day, no design needed** — wrong phone number, `/blog` canonical, blog post title +
   meta, the two blank city pages (unpublish/`noindex` them today, build them properly later).
2. **Cheap, high-return** — og:image site-wide, 16 over-length titles, 4 over-length
   descriptions, missing schema on the About section, phone-link format normalization.
3. **Alt-text remediation** — 1,424 images. Sequence this *after* the CMS decision, or the work
   gets repeated.
4. **Structural** — Services CMS collection + template, then re-point the service pages at it.
   This is the decision that determines the cost of everything else.
5. **Conversion** — a real form (native Webflow, or a controlled embed) on service page
   templates; verify GTM is capturing the LeadConnector fills.

## Pass 2 — Webflow internals (MCP authenticated 2026-07-27)

**Done:**
- **Client comments pulled** — 191 threads, 164 resolved / 27 open, across 21 pages. Archived in
  `client-comments.json`. Home page analysis in **[home-page-brief.md](./home-page-brief.md)**.
  Comment volume by page: Home 76, About Dr Chris 23, Technology 21, Livewell Difference 14,
  Meet the Team 14, Office Tour 6, dCOE 5, Full Mouth Reconstruction 5.
- **Site confirmed**: `69d03fdbe999e9907724a69d`, workspace `63b4b7393e89b78575e9a9bb`, custom domains
  `www.livewelldentalva.com` + `livewelldentalva.com`. The MCP grant exposes this site only — correct.
- **93 pages exist in Webflow vs. 57 in the sitemap** — ~36 pages are draft/unpublished, including one
  named `ai-grey` (carries 2 comment threads). Needs a sweep to establish what is WIP vs. abandoned.

**Still open:**
- Class-system audit (Client-First? bespoke?) — determines how we build new sections
- CMS collections that exist but are unused
- Unpublished changes sitting in the Designer
- Whether the blank city pages are intentional works-in-progress or an accident
- Site-wide vs. page-level custom code inventory (where the 1,652 embeds actually live)
- Comment threads on the other 20 pages (115 threads) — triage after home is agreed

## Version Control
Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md). `crawl.mjs` and
`site-inventory.json` are committed as lightweight replayable artifacts; the raw HTML cache
stays out of the repo.
