# 2026-10-05e — SEO / AEO audit of production (after SEO v2), nothing changed

## Why
User: audit what we can still improve in SEO and AEO; "AEO should be attached to the actual content
and the relevant content that is on the page. We should have a very detailed AEO schema."

## Method
Crawled all 81 sitemap URLs on `www.drnahlah.com` (body minus header/nav/footer): headings, word
count, accordion questions, images, Vimeo ids, tables, prices, and the one JSON-LD graph. Script
kept in the session scratchpad only (audit.mjs/report.mjs; re-creatable from this description).

## Verdict
The SEO v2 graph is valid and clean, but it is **entity boilerplate, not page content**. On every
treatment page the Service and the procedure node carry only name + the meta description; nothing
the page actually says (types, steps, timelines, candidacy, recovery, materials, comparisons,
cases, videos) is in the schema. Only the accordions became FAQPage.

## Findings — schema vs content (AEO)
1. **Service / MedicalProcedure have no page content.** `/dental-implants` shows four options
   (single, implant bridge, implant dentures, full arch), a four-step timeline (consultation + 3D
   scan → surgery in one visit → ~4 months integration → final teeth), an implants-vs-dentures
   comparison and a before/after case; its graph has `description` = meta description and nothing
   else. Same pattern on /all-on-4 (FP1/FP2/FP3, 4 visits, immediate load, warranty, second
   opinion), /implant-supported-dentures (3 tiers, 4 stages), /crowns-and-bridges, /teeth-whitening
   (3 methods + a comparison table), /implant-cost (5 cost factors, 3 lenders), /smile-makeover,
   /oral-surgery, /cosmetic-dentistry. Fix: per page, from the visible copy — `howPerformed`,
   `preparation`, `followup`, `procedureType`, `bodyLocation`, `expectedPrognosis`/`outcome`,
   Service `hasOfferCatalog` of the sub-options, `ItemList`/`HowTo`-style steps with durations,
   `MedicalTherapy`/`Drug`-free alternatives as `relevantSpecialty`/`mentions`, Wikidata `sameAs`
   on the treatment entity. Text must be lifted from the page, not written for the schema.
2. **FAQ only where accordions exist (7 pages).** 7 treatment pages have no FAQPage; 5 posts are
   question-led (h2 ending in "?": dental-implants-everything-you-need-to-know 13,
   all-on-four-your-questions 9, porcelain-veneers 5, multiple-missing-teeth 3, revamp-your-smile 3)
   and their Q/A is not marked up.
3. **Three FAQ answers end with a link label**: /dental-implants "…What drives the cost",
   /dental-implant-faq "…Sedation options", "…Cost and financing". The 'Read more →' stripper
   misses links without an arrow.
4. **BlogPosting is thin**: no `articleBody`/`wordCount`, `about`, `mentions`, `articleSection`,
   `keywords`, `speakable`; typed `["Article","BlogPosting"]` (fine). Posts link no Service.
5. **Videos not marked up**: 6 Vimeo films on /patient-stories and /video-library, 2 on the home
   page, 1 on /meet-dr-nahlah; no `VideoObject` (name, description, thumbnailUrl, uploadDate,
   duration, embedUrl, transcript — the West LA pattern keeps transcripts in descriptions).
6. **Before/after cases**: ImageGallery only on /smile-gallery; the slider cases on each treatment
   page are not `ImageObject`s tied to that Service.
7. **No `speakable`, no page `dateModified`/`datePublished` on non-post pages**, `lastReviewed`
   is today's date on all of them.
8. **BreadcrumbList last item = the full SEO title** ("Dental Implants in McLean & Alexandria, VA |
   Dr. Nahlah") on every page; should be the short page name.
9. **Org/office `image` = the doctor's headshot**; offices should carry their own photos. Both
   offices claim identical hours — confirm with the client. `sameAs` lacks Healthgrades/Yelp/
   Alexandria GBP for the org; Alexandria `hasMap` is a directions link, not its GBP cid.
10. Testimonials: no Review markup. Correct as is — Google ignores self-serving reviews on a
    LocalBusiness; do not add AggregateRating from on-site quotes.

## Findings — classic SEO
11. **H1s carry no keyword** on any service page ("A tooth that is attached to you again.").
    Client copy decision (already in Next of 2026-10-05d).
12. **Every post has two H1s** (the template's title + the body's own H1).
13. **robots.txt has no rules and no `Sitemap:` line** — only Cloudflare's content-signal
    preamble. Add `Sitemap: https://www.drnahlah.com/sitemap.xml`. AI crawlers (GPTBot, ClaudeBot,
    PerplexityBot, OAI-SearchBot) all get 200: good.
14. **No `/llms.txt`** (404). Low value, cheap to add.
15. `/dental-implants/` (trailing slash) serves 200 with canonical to the bare URL — acceptable;
    a 301 would be cleaner. `drnahlah.com` → www 301 fine.
16. Thin pages: service pages 480–1,100 words (WordPress versions ~35% longer); /contact 166,
    /doctor-referral 235, /video-library 279.
17. Still open from earlier runs: Search Console access, 33 old WordPress post descriptions,
    `sameAs` in seo.json still names the dead `/DentalGroupofTysons/`, 14 posts say "Dental Group
    of Tysons".

## Proposed order
1. Content-derived schema per treatment page (finding 1) + FAQ on question-led posts (2) + the
   truncated answers (3) + breadcrumb names (8): a `seo-v3` pass in `build-schema.mjs` that reads
   each live page's sections instead of meta.json. Production, then staging parity.
2. VideoObject (5) and case ImageObjects (6).
3. robots.txt Sitemap line (13), double H1 on posts (12).
4. Client: H1s + copy depth (11, 16), office hours/photos (9).

## Gotchas
- Git Bash rewrites `/dental-implants` CLI args into Windows paths: `export MSYS_NO_PATHCONV=1`.
