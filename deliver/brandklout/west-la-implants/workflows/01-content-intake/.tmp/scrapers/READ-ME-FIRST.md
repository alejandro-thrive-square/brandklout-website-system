# West LA Implants: Competitor & Content Gap Research

**Prepared for Brandklout. Crawl date 2026-08-20, package built 2026-08-21.**

Both sites were crawled in full from their sitemaps: **91 of 91 client URLs** and
**79 of 79 competitor URLs**, zero failures. Every number in these documents traces to a
row in one of the CSVs.

## Start here

**`West-LA-Implants-Research.html`**: open it in any browser. It contains the three main
reports in one readable page with a table of contents. Nothing to install, no internet
needed.

## What is in the box

| File | What it is | Read it if you want |
| :--- | :--- | :--- |
| `West-LA-Implants-Research.html` | All three reports, browser-readable | The whole picture in one scroll |
| `01-Content-Gap-Analysis.md` | The main deliverable | The five gaps, where the client already leads, and what it means for page count |
| `02-Competitor-Selection-Report.md` | Why Wilshire Oral Surgery | To defend the benchmark choice to the client |
| `03-Current-Site-Inventory.md` | What the client's site is today | Platform, IA, phone numbers, booking, technical state |
| `04-Client-Asset-Catalogue.md` | The client's media library | What photography and video already exists before buying stock |
| `evidence/` | 12 CSV/JSON tables | To check any single claim yourself |
| `page-text/` | 170 page extracts, both sites | To read the actual copy of any page on either site |

## The headline

The competitor sits at **12300 Wilshire Blvd**. The client sits at **12301 Wilshire Blvd**,
across the street, same ZIP, same catchment, same lead procedure.

- They publish **58% more words across 12 fewer URLs**. Their pages are **1.8x deeper**.
- **31 neighborhood landing pages** against the client's **0**.
- They publish **prices**; the client publishes **none**.
- "Board-certified" appears **192 times** on their site and **0 times** on the client's.
- An **FAQ block on 44 pages** against the client's **1**.

The client's own advantages are real and the rebuild should not spend them: implant
restoration breadth, Yomi robotic surgery (the competitor has none), a cosmetic line, a
**219-asset media library with named patient video**, 46 blog posts, and the only structured
data of the two sites.

## What this settles

The page count. The analysis argues for a **28 to 34 designed-page** build, or back toward
**24** if the neighborhood set ships as one CMS-templated page instead of six designed ones.
That is the number to sign off before design starts.

## Still open

1. **Vector logo.** The only brand mark that exists is a **250 x 200 px, 5 KB PNG**. Design
   cannot start on that.
2. **Patient consent** for Leslie, Emily and Michael (stills and B-roll). Strongest asset the
   practice owns; the competitor has no equivalent.
3. Blog migration scope for the 46 existing posts.

## Two things worth fixing whatever the build scope turns out to be

- **`/schedule/` is a third-party app shell** with the page title "Evspatient". No branding,
  no copy, nothing indexable. Every booking click leaves the brand at peak intent.
- **The site-wide phone CTA points at the current-patient line.** (310) 481-0111 appears on
  all 90 pages; the new-patient number (310) 692-9316 appears on 4. Every new-patient call
  from the website is landing in the wrong queue, and any tracking on that number is
  measuring almost nothing.

## Method and limits

Server-rendered HTML only. Anything a browser injects with JavaScript after load is invisible
to this pass, which is why `/schedule/` reads as zero words. The competitor exposes no publish
dates on their posts, so their publishing cadence cannot be compared to the client's.
Topic coverage keys on URL, title and H1 for "owns a page" and on H2 text for "covers as a
section"; a topic mentioned only in body prose is counted separately and deliberately not
scored as coverage.
