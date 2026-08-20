# Marvel Dental: brand basis for the campaign layer

Marvel Dental has no written brand guideline and no style guide page in its Webflow site. What
follows is not invented: every value here was **measured off the published site**
(`marveldentaldds.com`) by driving real Chrome and reading computed styles, because the site CSS is
Webflow-generated and grepping selectors lies about what a page renders.

- Probe: `workflows/01-content-intake/.tmp/brand-probe.mjs` → `.tmp/brand/probe.json`
- Reference captures: `.tmp/brand/home-1440.png`, `implants-offer-1440.png`, `emergency-1440.png`
- Scraped copy: `.tmp/client-site/*.txt`

**Scope.** This covers what the emergency funnel needs. It is not a full style guide for the site,
and it is deliberately not installed on the site as one.

## The practice

| | |
| :--- | :--- |
| Name | Marvel Dental |
| Doctor | Dr. Anna Gazu, DMD (founder). Associate: Dr. Ammeema Zubai |
| Address | 1113 Main Avenue, Suite A, Clifton, NJ 07011 |
| Main line | (973) 295-5443 |
| Campaign line | **(973) 264-0928** — the tracking number already running on `/dental-implants-offer` |
| Hours | Tuesday to Friday 9am to 5pm · Saturday 8am to 4pm (closed Sunday and Monday) |
| Languages | English, Arabic, Russian, Spanish |
| Booking | Zocdoc (`zocdoc.com/dentist/anna-gazu-dmd-471732`) |
| Serves | Clifton, Passaic, Paterson, Nutley, Garfield, Montclair |
| Satellites | `/elmwood-park-dentist`, `/montclair-dentist` |

Proof points the site itself claims: 4.8 rating across 200+ reviews · 10k+ patients served · 15+
years · BusinessRate Top 10 Dentist in Clifton, 2026 · transparent pricing, lifetime warranty on
the practice's work, free whitening for life.

## Colour

| Token | Value | Where it comes from, and what it does here |
| :--- | :--- | :--- |
| teal | `#00769D` | The site's `--primary`. Every accent on a light ground: eyebrows, icons, rules, primary buttons, the one saturated section band |
| teal dark | `#00618A` | Hover state and the darker accent |
| deep | `#00394D` | The colour the site puts on step headings (`rgb(0,57,77)`). Used as the dark ground: hero, CTA, footer, header bar |
| pale | `#8ED0E6` | Added. The accent that still reads on the dark ground, where the teal cannot |
| tint | `#F0F9FD` | The pale blue band on `/dental-implants-offer` |
| mist | `#F1F2F2` | The site's `--grey` band |
| ink | `#222222` | The site's `--black`. Body copy and h2 |
| muted | `#5C5C5C` | The site's `--sub-heading` |
| line | `#DCE7EC` | Added. Hairlines and card borders, cooled to match |
| white | `#FFFFFF` | Dominant. The site is white-first and this layer keeps that |

Contrast, checked rather than assumed: white on `#00769D` is 5.1:1 and on `#00394D` is 12.9:1, so
body copy on either dark ground is pure white, not a tinted one (a tinted blue measured 3.9:1 on
the blue band, under AA).

## Type

Two families, both already installed in the Webflow site, both Google fonts.

| Role | Face | Live values |
| :--- | :--- | :--- |
| Headings | **Noto Serif**, weight 500 | h1 69px/1.1 · h2 40px/56px · step headings 24px, uppercase, +1px tracking |
| UI and body | **Karla** | body 16px/1.65 · lead 18px/1.4 · labels 16px weight 300, +0.5px tracking |

Campaign ramp (concrete at each Webflow breakpoint, because the builder stores `clamp()` verbatim
and then reads it as `0`):

| | 1440 | 991 | 767 | 479 |
| :--- | ---: | ---: | ---: | ---: |
| h1 | 69 | 52 | 44 | 36 |
| h2 | 40 | 34 | 30 | 27 |

Eyebrows are Karla 600, 13px, `0.14em` tracking, uppercase, teal — and pale teal on dark grounds
via the `is-on-dark` combo.

## Components

- **Buttons are pills**: `border-radius: 999px`, uppercase, Karla 600 at 14px, 54px tall. Primary
  is teal on white grounds; on the teal hero and CTA band the primary flips to white so the phone
  number stays the loudest thing on the page.
- **Sections** are 112px top and bottom (76px under 767), matching the live site.
- **Cards** take a 16px radius. The container is 1228px wide with 24px gutters.
- **Bands** alternate white → mist → tint → deep → teal. No band repeats twice in a row.

## Photography

Marvel's own library, catalogued at
`workflows/07-webflow-build/.tmp/asset-catalogue.json` (327 assets, with `hostedUrl` and alt text).
Nothing in this build is stock.

Note: five office-interior images referenced by the live site (`OK3_5721 1`, `OOK27249 1`,
`OK3_5652 1`, `OK3_5305 1`, `OOK27258 1`) return **403 AccessDenied** from the CDN. They are
serving on the live page from a cached path but cannot be fetched. The funnel uses different,
verified interiors instead. Worth telling the client: those files are effectively broken.

Every image in the funnel is referenced by its **`hostedUrl`** (`s3.amazonaws.com/...`), not the
`cdn.prod.website-files.com` mirror, because `data_whtml_builder` binds an `<img>` to a real
Webflow asset only when the src is the hosted URL. A CDN URL silently produces an unmanaged image.

## Patient films

Three real testimonials, on Vimeo: `1179298741` (1:26), `1179298921` (1:21), `1179298824` (1:15),
with the practice's own thumbnails in the asset library. They are embedded as poster images that
link out, not as video elements: the native Webflow video element's URL setting is unreachable over
the Data API.

## What is still missing

1. **Written review quotes.** The "Trusted by Smiles Across Clifton" block on the live site is
   rendered by a third-party widget, so no quote text exists in the DOM to reuse. The funnel
   currently carries the aggregate (4.8 from 200+) plus the three patient films. Three real Google
   quotes would be stronger.
2. **The GHL form id.** The consultation page ships a LeadConnector embed with a placeholder id.
3. **Fellowship and Mastership certificates** for Dr. Gazu sit in the asset library but the issuing
   body is not stated anywhere on the site. Not claimed in the copy until confirmed.

## Version Control

Tracked in the Webzite Agentic Workflow repository under the Deliver pillar, per
[SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Regenerate the measured values with
`node workflows/01-content-intake/.tmp/brand-probe.mjs` if the client's site is restyled.
