# Current Site Inventory: westlaimplants.com

Full crawl pulled **2026-08-20**. 91 of 91 sitemap URLs fetched, zero failures.

| Field | Value |
| :--- | :--- |
| Platform | WordPress + Elementor, Rank Math SEO, Site Kit by Google, Contact Form 7 |
| Marketing vendor | **Progressive Dental Marketing** (footer credit on all 90 content pages) |
| Patient portal | Oryx (`mychart.myoryx.com`), linked 180 times |
| Booking | Third-party Angular app served at `/schedule/` |
| Address (consistent on 90 pages) | 12301 Wilshire Blvd Suite 205, Los Angeles CA 90025 |
| Phone, current patients | (310) 481-0111 (header and footer, every page) |
| Phone, new patients | (310) 692-9316 (**only 4 URLs**) |
| Email published | **none anywhere on the site** |
| Social | YouTube, Facebook, Instagram, Yelp, Google (footer, every page) |

## What was captured

| Artifact | Contents |
| :--- | :--- |
| `pages/*.md` | 91 human-readable extracts: SEO block, heading outline, body copy, image list, forms |
| `data/*.json` | 91 structured records: meta, headings, images, links, forms, JSON-LD |
| `html/*.html` | Raw server-rendered HTML per page (gitignored) |
| `site-data.json` | All 91 records in one file |
| `media-manifest.csv` | 219 distinct media URLs with alt text and source pages |
| `../../../03-graphic-resources/.tmp/` | The actual binaries, plus `asset-manifest.csv` and `ASSETS.md` |

## URL set

| Set | Count | Total words | Avg |
| :--- | ---: | ---: | ---: |
| Pages | 42 | 30,031 | 715 |
| Blog posts | 46 | 35,188 | 764 |
| Category archives | 3 | 1,556 | 519 |
| **Total** | **91** | **66,775** | **734** |

Word counts are strikingly uniform (median 755, max 1,222). That is the signature of a
templated vendor build, not of pages written to their subject.

## Information architecture as it stands

```
Dental Implants
  Dental Implant Surgery          Cost & Compare
  All-on-4 Dental Implants        What To Expect
  Hybrid Fixed Detachable Denture FAQ
  Zirconia Fixed Bridge
  Implant Supported Dentures
  Robotic Surgery
Aesthetic Dentistry
  Cosmetic Dentistry              Teeth Whitening
  Porcelain Veneers & Lumineers   Smile Makeover
  Invisalign
Services
  IV Sedation        Tooth Extractions
  Bone Grafting      General Dentistry
  Ridge Augmentation Periodontics
  Sinus Augmentation
Conditions We Treat
  Missing Teeth   Failing Dental Implants
  Bone Loss       Loose Dentures
Patient Center
  Insurance & Financing   Patient Stories
  Our Facility            Before & After Photos
Who We Are
  Commitment To Excellence   Meet The Team
  Meet Dr. Tony Barriere     Video Library
Blog | Contact Us | Patient Portal (New Patients / Current Patients)
```

Six top-level groups, 33 nav destinations. The `Conditions We Treat` grouping is genuinely
good positioning and should survive the rebuild; it speaks to the patient's problem rather
than to the procedure name.

## Forms

| Form | ID | Where |
| :--- | :--- | :--- |
| Get in touch | `get_in_touch` | `/contact/` |
| Implant enquiry | `implant_form` | 7 implant pages |

Two Contact Form 7 forms total. Both post back to their own page. No form on any cosmetic,
conditions, financing or practice page.

## Content quality flags found in the crawl

1. **47 of 91 pages have no `h1`.** All 46 blog posts plus one page. Post titles are rendered
   as `h2`.
2. **35 pages carry two `h1`s** (a hidden section label plus the visible title). Only **9 of
   91 pages have exactly one `h1`.**
3. **5 pages have no meta description**, 8 more are duplicates of another page's.
4. **40 title tags exceed 60 characters** and will truncate in results.
5. **`/schedule/` returns 1,449 bytes of Angular shell** with `<title>Evspatient</title>`,
   no copy, no JSON-LD. It is the target of the primary booking call to action.
6. **`/tony-barrier-dds/`** misspells the doctor's surname (Barriere) in the URL.
7. **The blog stopped on 2023-08-20.** 30 posts in 2022, 16 in 2023, none since.
8. **Two thank-you pages** (`/implant-survey-thank-you/`, `/veneer-survey-thank-you/`) are
   indexable pages rather than states, and are the only place the new-patient phone number
   appears alongside the current-patient one.

## Assets on the current site

Extracted separately into `03-graphic-resources/.tmp/`. Headline: **219 distinct media URLs
referenced across the site**, resolving to a much larger download set once `srcset`
variants, stylesheet-referenced artwork, icons and webfonts are followed. The practice has
its own photography, an embedded YouTube video library and a before/after gallery. See
[`ASSETS.md`](../../../03-graphic-resources/.tmp/ASSETS.md) for the catalogue.

## Feeds into

- `02-wireframe` for IA consolidation. The 42-page tree collapses to roughly 22 designed
  pages before any gap-closing additions.
- `06-content-seo` for the 88-URL redirect map, which `14-migration-seo-redirects` will need
  before `09-launch`.
- [`../gap-analysis/CONTENT-GAP-ANALYSIS.md`](../gap-analysis/CONTENT-GAP-ANALYSIS.md) for
  the competitive read against Wilshire Oral Surgery.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
Markdown extracts, JSON records and CSV manifests are committed; raw `html/` and downloaded
binaries are not.
