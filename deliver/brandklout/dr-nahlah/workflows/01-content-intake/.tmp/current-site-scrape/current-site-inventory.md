# Current Site Inventory — drnahlah.com

Full content extract of the existing site, captured 2026-07-30. Source of truth for
the rebuild's IA, copy migration, redirect map, and SEO baseline.

- **Platform**: WordPress + Yoast SEO, behind Cloudflare
- **Practice**: Dr. Esam Nahlah, D.D.S., M.S., FACP — Implants & Prosthodontics Specialists
- **Brand names in use**: "Dr. Nahlah", "Dental Group of Tysons", "Dr. Nahlah Implants & Prosthodontics Specialists"
- **Locations**: 2 (McLean/Tysons Corner + Alexandria, VA)
- **URLs captured**: 78 / 78 (0 failures) — 33 pages, 43 blog posts, 2 category archives
- **Distinct media assets**: 284

## Artifacts

| File | What it holds |
| :--- | :--- |
| `pages/<slug>.md` | Per-URL readable extract: SEO block, heading outline, body copy, image list, forms |
| `data/<slug>.json` | Per-URL structured record (meta, headings, images, links, forms, JSON-LD, phones) |
| `site-data.json` | All 78 records in one file |
| `media-manifest.csv` | Image URLs + alt text per page — **superseded, see note below** |
| `scrape_site.py` | The scraper (re-runnable) |
| `scrape-run.log` | Crawl log for this run |

> [!IMPORTANT]
> **`media-manifest.csv` is superseded.** It lists 284 image URLs and downloads
> nothing, because this scraper reads only `<img>`/`<source>` tags. It therefore
> misses `srcset` variants, CSS `background-image` refs, stylesheet-referenced
> artwork, favicons, `<video>`/`poster`, documents, and video embeds.
> A complete extraction — **911 files, 156 MB, actually downloaded** — lives in
> [`03-graphic-resources/.tmp/`](../../../03-graphic-resources/.tmp/ASSETS.md).
> Use that for anything asset-related; keep this file only for per-page alt text.

## Page Inventory (33 pages)

| URL | Words | H1s | Imgs | Title tag |
| :--- | ---: | ---: | ---: | :--- |
| `/` | 1122 | 1 | 19 | Top Rated Prosthodontist in McLean, VA for Restorative Care |
| `/about/` | 967 | 2 | 7 | Why Choose Us for Dental Care in McLean, VA |
| `/dr-esam-nahlah/` | 1044 | 2 | 6 | Meet Dr. Esam Nahlah \| A Prosthodontist You Can Trust |
| `/our-team/` | 511 | 2 | 10 | Friendly Dental Team in McLean, VA Committed to You |
| `/our-dental-facility/` | 507 | 0 | 6 | Our Facility \| Dental Group of Tysons \| McLean, VA |
| `/dental-implants/` | 1399 | 1 | 17 | Reliable Dental Implants in McLean, VA for Lasting Results |
| `/all-on-4/` | 1662 | 1 | 13 | Advanced All-on-4 Implants in McLean, VA for Full Smiles |
| `/implant-supported-dentures/` | 1343 | 1 | 13 | Secure Implant Dentures in McLean, VA for Confident Smiles |
| `/cost-of-dental-implants/` | 1020 | 2 | 7 | Dental Implant Cost \| McLean, VA \| Dental Group of Tysons |
| `/dental-implant-faq/` | 1304 | 2 | 4 | Dental Implant FAQ \| McLean, VA \| Dental Group of Tysons |
| `/cosmetic-dentistry/` | 1002 | 2 | 15 | Cosmetic Dentistry Services in McLean, VA for a New Smile |
| `/veneers/` | 970 | 2 | 13 | Natural-Looking Veneers in McLean, VA to Enhance Your Smile |
| `/smile-makeover/` | 1124 | 2 | 13 | Complete Smile Makeover in McLean, VA to Transform Looks |
| `/teeth-whitening/` | 874 | 2 | 11 | Teeth Whitening Services in McLean, VA for Brighter Smiles |
| `/dental-crowns-and-bridges/` | 1087 | 2 | 8 | Durable Crowns & Bridges in McLean, VA to Restore Teeth |
| `/oral-surgery/` | 915 | 2 | 8 | Expert Oral Surgery Services in McLean, VA with Care |
| `/sedation-dentistry/` | 1042 | 2 | 8 | Gentle Sedation Dentistry in McLean, VA for Stress-Free Visits |
| `/emergency-dentistry/` | 1167 | 3 | 7 | Emergency Dentist Available in McLean, VA for Fast Relief |
| `/dental-conditions/` | 2118 | 2 | 5 | Dental Conditions - McLean, VA - Dr Esam Nahlah |
| `/smile-gallery/` | 585 | 2 | 110 | Before & After Photos - Dr Esam Nahlah - McLean, VA |
| `/video-gallery/` | 589 | 2 | 18 | Video Library \| Dental Group of Tysons \| McLean, VA |
| `/testimonials/` | 645 | 2 | 12 | Patient Stories \| Dental Group of Tysons \| McLean, VA |
| `/patient-center/` | 1096 | 2 | 5 | Patient Center \| Dental Group of Tysons \| McLean, VA |
| `/financing/` | 812 | 2 | 5 | Insurance & Financing \| Dental Group of Tysons \| McLean, VA |
| `/contact/` | 592 | 1 | 3 | Contact Our Dental Office in McLean, VA to Schedule Today |
| `/doctor-referral/` | 574 | 1 | 4 | Doctor Referral - Dr. Esam Nahlah \| Dental Group of Tysons |
| `/tysons-study-club/` | 856 | 0 | 5 | Tysons Study Club \| Dental Group of Tysons \| McLean, VA |
| `/blog/` | 677 | 1 | 8 | Dental Blog - Dr Esam Nahlah - McLean, VA |
| `/free-event/` | 574 | 0 | 3 | Dr Nahlah - Your Perfect Smile Starts Here - Built on Relationships |
| `/veneer-survey-thank-you/` | 978 | 1 | 8 | Thank You! \| Dr. Esam Nahlah, D.D.S., M.S., FACP \| McLean, VA |
| `/implant-survey-thank-you/` | 978 | 1 | 8 | Thank You! \| Dr. Esam Nahlah, D.D.S., M.S., FACP \| McLean, VA |
| `/privacy-policy/` | 1114 | 0 | 3 | Privacy Policy \| McLean, VA \| Dental Group of Tysons |
| `/terms-conditions/` | 1705 | 0 | 3 | Terms & Conditions \| McLean, VA \| Dental Group of Tysons |

Plus **43 blog posts** (heavily dental-implant focused, McLean VA local SEO) and
**2 category archives** (`/category/dental-care/`, `/category/dental-implants/`).
Full list in `site-data.json`.

## Business Data (verbatim from the live site)

**Tysons Corner / McLean**
7901 Jones Branch Dr., Suite 220, McLean, VA 22102
New Patients: (571) 619-9442 · Current Patients: (703) 448-3312

**Alexandria**
2855 Duke St, Alexandria, VA 22314
New Patients: (571) 410-3430 · Current Patients: (703) 940-5410

**Hours**: Mon–Thu 8:00 AM–5:00 PM · Fri 8:00 AM–2:00 PM · Sat–Sun closed

## Third-Party Integrations to Carry Over

| Service | Usage | Notes |
| :--- | :--- | :--- |
| **Flexbook** (`flexbook.me`) | Online booking — 157 links sitewide | Three different URLs in use: `/DrNahlahTy`, `/drnahlah`, `www.flexbook.me/DrNahlahTy`. Needs consolidation. |
| **YouTube** | 142 embeds — video gallery + testimonials | Confirm which are owned vs. embedded |
| **Google** | Reviews widget + Maps links (40) | Two GBP listings |
| **Gravity/WP Forms** | Contact form + 2 survey funnels | Posts to `/contact/` and `/` |
| **CareCredit / Proceed Finance / LendingClub** | Financing partners | Linked from `/financing/` |
| **Facebook / Instagram** | Social, sitewide footer | |

## Findings to Fix in the Rebuild

These are defects on the **current** site, captured so the rebuild does not inherit them.

1. **48 of 78 pages have no `<h1>`** — including `/our-dental-facility/`, `/tysons-study-club/`, both legal pages, `/free-event/`, and all 43 blog posts (post titles are marked up as `h2`). Significant SEO liability.
2. **19 pages have multiple `<h1>`s** — most service pages carry 2, `/emergency-dentistry/` has 3.
3. **Broken `tel:` link on all 78 pages** — the footer "Current Patients" number renders as `http://(703)%20448-3312` instead of `tel:+17034483312`. Sitewide dead link.
4. **Phone-number inconsistency** — `/contact/` lists Tysons "Current Patients" as (703) 493-1358 while the sitewide footer lists (703) 448-3312. Client must confirm which is correct.
5. **Copy typos live on the homepage** — "Affordable Payment Optionsr" (×2), "Suit 220" (should be "Suite 220").
6. **Schema is minimal** — a single `LocalBusiness`/`WebPage` graph on the homepage only. No per-service, FAQ, or second-location schema despite a large FAQ page and 2 offices.
7. **Two missing meta descriptions** — both category archives.
8. **Brand naming is inconsistent** — "Dr. Nahlah" vs "Dental Group of Tysons" vs "Dr. Nahlah Implants & Prosthodontics Specialists" appear across title tags. Needs one decision before content/SEO.
9. **Booking URL fragmentation** — three Flexbook URLs across the site.

## Rebuild Implications

- **43 blog posts + 33 pages = 78 URLs need a redirect map.** The blog carries real
  local-SEO equity for "dental implants McLean VA"; it must migrate, not be dropped.
- **`/smile-gallery/` holds 110 images** — the heaviest asset page and a core sales
  asset. Needs a proper before/after component (likely CMS-driven).
- **Content is long-form** (507–2118 words/URL; most service pages 900–1700). The
  reference template is far more visual and carries much less copy per page; expect a
  content-reduction and restructuring pass, not a straight copy-paste.
- **Two locations** must be first-class in the new IA. The current site buries
  Alexandria; the reference template handles multi-location well.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- Markdown/JSON/CSV artifacts here are lightweight and committed. No media binaries are stored in this folder — only URLs in `media-manifest.csv`.
