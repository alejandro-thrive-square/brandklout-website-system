# BrandKlout → Instatic Import Guide (V17)

This package is prepared for a page-by-page import into a visual site builder such as Instatic, Framer, or Webflow.

## CSS structure

- Every HTML page now loads exactly **one local stylesheet**.
- That stylesheet lives at `assets/pages/<page-name>.css`.
- Every page stylesheet is **standalone**: the former shared CSS files are concatenated into that page CSS in the same cascade order.
- There are **no CSS `@import` dependencies** inside the page files.
- A duplicate flat copy of all page CSS files is in `instatic-css/` for easy upload/copy-paste.

## Suggested Instatic workflow

1. Create/import the page HTML.
2. Import or paste the matching CSS file from `instatic-css/`.
3. Upload the `/assets/` media folders and preserve relative paths, or replace them with Instatic-hosted media URLs.
4. Keep the listed JS files for interactive components (forms, charts, story video controls, hero carousel, assessment).
5. After the visual import is stable, you can optionally consolidate repeated typography/nav/footer styles into Instatic global styles.

## Page mapping

| HTML page | CSS file |
|---|---|
| `ai-growth-engine.html` | `assets/pages/ai-growth-engine.css` |
| `ai-search-authority.html` | `assets/pages/ai-search-authority.css` |
| `authority-score.html` | `assets/pages/authority-score.css` |
| `book.html` | `assets/pages/book.css` |
| `conversion-websites.html` | `assets/pages/conversion-websites.css` |
| `cosmetic-dentist-marketing.html` | `assets/pages/cosmetic-dentist-marketing.css` |
| `customer-stories.html` | `assets/pages/customer-stories.css` |
| `customer-story-ava-dental-launch.html` | `assets/pages/customer-story-ava-dental-launch.css` |
| `customer-story-legacy-dental-pasadena.html` | `assets/pages/customer-story-legacy-dental-pasadena.css` |
| `customer-story-oceanic-ai-search-growth.html` | `assets/pages/customer-story-oceanic-ai-search-growth.css` |
| `customer-story-oceanic-future-ready.html` | `assets/pages/customer-story-oceanic-future-ready.css` |
| `customer-story-ocpao-ai-authority.html` | `assets/pages/customer-story-ocpao-ai-authority.css` |
| `customer-story-omnia-ai-search-growth.html` | `assets/pages/customer-story-omnia-ai-search-growth.css` |
| `dental-implant-marketing.html` | `assets/pages/dental-implant-marketing.css` |
| `full-arch-marketing.html` | `assets/pages/full-arch-marketing.css` |
| `general-dentistry-marketing.html` | `assets/pages/general-dentistry-marketing.css` |
| `guarantee.html` | `assets/pages/guarantee.css` |
| `hipaa.html` | `assets/pages/hipaa.css` |
| `index.html` | `assets/pages/index.css` |
| `lead-to-collection.html` | `assets/pages/lead-to-collection.css` |
| `local-seo-maps.html` | `assets/pages/local-seo-maps.css` |
| `market-opportunity.html` | `assets/pages/market-opportunity.css` |
| `multi-location-dental-marketing.html` | `assets/pages/multi-location-dental-marketing.css` |
| `oral-surgery-marketing.html` | `assets/pages/oral-surgery-marketing.css` |
| `orthodontics-invisalign-marketing.html` | `assets/pages/orthodontics-invisalign-marketing.css` |
| `periodontist-marketing.html` | `assets/pages/periodontist-marketing.css` |
| `privacy.html` | `assets/pages/privacy.css` |
| `prosthodontist-marketing.html` | `assets/pages/prosthodontist-marketing.css` |
| `reputation-engine.html` | `assets/pages/reputation-engine.css` |
| `revenue-attribution.html` | `assets/pages/revenue-attribution.css` |
| `solutions.html` | `assets/pages/solutions.css` |
| `specialties.html` | `assets/pages/specialties.css` |
| `terms.html` | `assets/pages/terms.css` |

## Notes

- The design is unchanged from V16; this update only restructures CSS delivery for easier framework import.
- Google Fonts remain externally loaded in the HTML. You can map Manrope and DM Sans to Instatic typography styles after import.
- JavaScript is still shared because interactive behavior is better maintained centrally; CSS is page-specific as requested.