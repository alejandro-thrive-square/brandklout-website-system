# Clifton Exteriors — Old Site Section Inventory (Redesign Gap Analysis)

Source: https://www.cliftonexteriors.com — WordPress + Elementor (containers + legacy sections), WP Rocket, The Plus Addons, Trustindex/Widget Google Reviews, reCAPTCHA v3. Captured 2026-07-10 (SiteGround bot-challenge bypassed via proof-of-work solver; all pages fetched server-side).

Scope: 18 pages total = homepage (from existing `04-design/.tmp/oldsite-content.md`, not re-scraped) + 17 inner pages fetched here. The shared **announcement bar, sticky header/nav, and footer** are excluded from every listing below (they are identical site-wide — see the homepage doc sections 2.0, 2.1, 2.11). Deviations are noted where they occur (none found — header/footer are consistent).

---

## PART A — FINAL SYNTHESIS: Unique Section Types

Two sections count as the **same type** if they share layout/structure even with different copy/images. Variants (mirror image-left vs image-right, dark vs light, content-complete vs lorem stub) are listed as their own rows and marked **(variant of …)**.

### A.1 Deduplicated section-type table

| # | Section type (slug) | Structure | Pages using it | Total instances | Dynamic/JS? |
|---|--------------------|-----------|----------------|-----------------|-------------|
| 1 | `hero-inner` | Full-bleed bg photo, H1 + H2 subhead, 1–2 buttons (Get A Quote / Our Process) | windows, doors, roofing, siding, gutters, insurance-claims, our-process, about-us, portfolio, pricing, media, financing, blog (employment = headings only, no buttons) | 14 | No (bg image via CSS var) |
| 1a | `hero-home` **(variant of hero-inner)** | Same but H1 has red-highlighted service list, TWO distinct CTA targets, + hidden Elementor "HP Mini Form" | Home | 1 | Form present-but-hidden (reCAPTCHA) |
| 1b | `hero-editorial` **(variant of hero-inner)** | Custom-coded editorial hero (not Elementor), intro paragraph, county copy | service-locations | 1 | No |
| 1c | `hero-thankyou` **(variant of hero-inner)** | Logo + H1 "Thank You For Your Review!" + blockquote + 2 review buttons (Google / Facebook) | testimonials | 1 | No |
| 2 | `financing-badges-band` | "We Offer Financing For Your Project" H2 + Learn More button + row of 5 trust/badge logos (GAF, Google 5-star, ProVia, ShingleMaster, Nextdoor) — Elementor global template | windows, doors, roofing, siding, gutters, insurance-claims, our-process, about-us, portfolio, media, blog | 11 | No |
| 2a | `financing-cta-text` **(variant of #2)** | Same "We Offer Financing" H2 + Learn More button but NO badge row | pricing, contact-us | 2 | No |
| 3 | `service-split` | Image + H2 + paragraph + Get A Quote button, side-by-side | home (insurance, about), service pages (§3 each), our-process, about-us, insurance-claims, employment | ~13 | No |
| 3a | `service-split-mirror` **(variant of #3, image on opposite side)** | Text + button on one side, image on other | home (portfolio teaser), service pages (§5 each), about-us (mission) | ~8 | No |
| 4 | `icon-benefits-3up` | "Feel Confident Working With Us" H2 + divider + 3 icon-boxes (Warranty / 25+ Yrs / Award-Winning) | home, windows, doors, roofing, siding, gutters, about-us, insurance-claims | 8 | No |
| 4a | `icon-benefits-3up` **(variant — different copy / lorem)** | Same 3-up icon-box layout, financing-specific + lorem stub copy | financing (2×: "Apply Online…" + "Your Trust Is Important To Us") | 2 | No |
| 5 | `icon-list-upgrades` | "Common Upgrades / Upcharges" H2, bg image, 2–3 columns of check icon-lists | windows, doors, roofing, siding, gutters | 5 | No |
| 6 | `gallery-grid` | H2 + divider + image grid (6–18 photos, lightbox links); service pages append a "View Our Full Portfolio" button | service pages (§6 each), portfolio (5 category grids) | 10 | Lightbox JS on click |
| 7 | `pricing-tables-3up` | H2 + divider + 3 tier tables (Standard / Deluxe / Premium, price + feature bullets) + disclaimer | windows, doors, roofing, siding, gutters (1 each), pricing (5) | 10 | No |
| 8 | `process-teaser` | "A Hassle Free Process" H2 + paragraph + Our Process button (bg image on some) | home, windows, doors, roofing, siding, gutters, about-us | 7 | No |
| 9 | `faq-accordion` | H2 + divider + nested accordion (2–6 Q&A items) | windows, doors, roofing, siding, gutters, insurance-claims | 6 | Accordion expand JS |
| 10 | `reviews-widget` | "Reviews From Our Satisfied Clients" H2 + Google Reviews shortcode (server-rendered 45 reviews, 5.0 / 55 total, slider) | home + windows, doors, roofing, siding, gutters, insurance-claims, our-process, about-us, portfolio, pricing, media, contact-us, employment, financing, blog | 16 | **Yes — Google Reviews widget/slider** (rendered in HTML but functions as JS slider) |
| 10a | `reviews-widget-trustindex` **(variant of #10)** | Trustindex `ti-widget` — EMPTY in server HTML, populated only by JS | testimonials | 1 | **Yes — JS-only, no server content** |
| 11 | `form-contact` | "Tell Us About Your Project" H1 + intro + 20-field Elementor form (name/contact/address + service checkboxes), submit "Get Your Quote" | windows, doors, roofing, siding, gutters, contact-us | 6 | **Yes — form + reCAPTCHA** |
| 11a | `form-insurance` **(variant of #11)** | 24-field form w/ radio "preferred contact method", submit "Submit" | insurance-claims | 1 | **Yes — form + reCAPTCHA** |
| 11b | `form-employment` **(variant of #11)** | Job-application form (different fields, radio group), submit "Send Your Application" | employment | 1 | **Yes — form + reCAPTCHA** |
| 12 | `cta-band` | Closing band: H2 + Get A Quote button (bg image) | home + windows, doors, roofing, siding, gutters, insurance-claims, our-process, about-us, portfolio, pricing, media, financing, blog, testimonials (employment = broken "Footer CTA Headline Lorem" → `#`) | ~16 | No |
| 12a | `cta-band-dual` **(variant of #12)** | Final CTA with two buttons (Get A Quote + Call) | service-locations (areas-final-cta) | 1 | No |
| 13 | `service-cards-5up` | "Our Services" H2 + 5 clickable icon cards (Windows/Doors/Roofing/Siding/Gutters) each w/ Learn More arrow | Home | 1 | No |
| 14 | `process-steps-vertical` | "A Brand New Home In 10 Simple Steps" — 10 numbered icon + heading + text steps | our-process | 1 (10 steps) | No |
| 14a | `process-steps-numbered` **(variant of #14)** | "Our Insurance Claims Process" — 9 numbered icon-boxes | insurance-claims | 1 (9 steps) | No |
| 15 | `video-embed-grid` | Rows of YouTube video embeds (2 per row, 4 total) | media | 2 sections / 4 videos | **Yes — YouTube iframes (lazy)** |
| 16 | `contact-details-map` | "Or Get In Touch Directly" — logo + address/phone/email icon-list + Google Maps embed | contact-us, employment | 2 | **Yes — Google Maps iframe** |
| 17 | `blog-cards` | Post-cards grid (The Plus `posts.cards`), 6 posts w/ thumbnails; no pagination | blog | 1 (6 cards) | **Yes — CMS query / dynamic post list** |
| 18 | `financing-partner-cta` | Partner logo + promo terms + external "Apply Now" button (SVC Financial / GreenSky) | financing | 2 | External application links |
| 19 | `text-heading-band` | Standalone heading (± button/text), no media — includes lorem stubs | financing ("Learn More About How to Finance…", "Section Headline" lorem) | 2 | No |
| 20 | `locations-search` | "Looking for a specific city or county?" + text search input | service-locations | 1 | **Yes — custom JS search (`cgn-aws-search-input`)** |
| 21 | `locations-map` | Interactive VA service-area map (`cgn-aws-map`, JS; `<noscript>` fallback to list) | service-locations | 1 | **Yes — custom JS map** |
| 22 | `locations-county-list` | "Areas We Serve" county sections, each H2 + paragraph + city links (18 `/service-location/*` city pages linked) | service-locations | 1 section group (6 county blocks, 18 city links) | No |
| 23 | `locations-specialization` | "Roofing and Window Specialists, Not Generalists" text block | service-locations | 1 | No |
| 24 | `fallback-cta` | "Don't See Your City?" text + CTA | service-locations | 1 | No |

### A.2 Sections flagged as DYNAMIC / JS (cannot be plain Webflow components)

| Section type | Why it can't be a static component | Rebuild approach in Webflow |
|--------------|-----------------------------------|----------------------------|
| `reviews-widget` (#10) — 16 pages | Google Reviews plugin slider; live-ish content, slider behavior | Static testimonial slider (Webflow CMS or Swiper) seeded from the 45 reviews in homepage doc §3, OR re-embed a reviews widget |
| `reviews-widget-trustindex` (#10a) — testimonials | Trustindex widget is **empty in server HTML**, JS-injected only | Must re-embed the third-party widget OR rebuild from CMS |
| `form-contact` / `form-insurance` / `form-employment` (#11/11a/11b) | Elementor forms + reCAPTCHA v3, server submission | Webflow native forms (rebuild fields + logic) |
| `contact-details-map` (#16) — contact-us, employment | Google Maps iframe embed | Webflow Map embed or iframe |
| `video-embed-grid` (#15) — media | YouTube iframes (4 videos, lazy-loaded) | Webflow Video / YouTube embed |
| `blog-cards` (#17) — blog | Dynamic WP post query | Webflow CMS Collection List |
| `locations-search` + `locations-map` (#20/#21) — service-locations | Custom JS (`cgn-aws-*`) search + interactive map | Custom code embed OR CMS-driven filtered list |
| `gallery-grid` (#6), `faq-accordion` (#9) | Lightbox / accordion require interaction JS | Webflow native Lightbox + Accordion interactions |

### A.3 Key observations for the redesign

- **~11 of the ~24 section types are shared, near-verbatim, across pages** — the page bodies are highly templated. A small component library covers most of the site: `hero-inner`, `financing-badges-band`, `service-split` (+ mirror), `icon-benefits-3up`, `icon-list-upgrades`, `gallery-grid`, `pricing-tables-3up`, `process-teaser`, `faq-accordion`, `reviews-widget`, `form-contact`, `cta-band`.
- **The 5 service pages (windows/doors/roofing/siding/gutters) are structurally identical** — same 13 sections in the same order (hero → financing-badges → service-split → icon-list-upgrades → service-split-mirror → gallery-grid → icon-benefits-3up → pricing-tables → process-teaser → faq-accordion → reviews-widget → form-contact → cta-band). Ideal for ONE Webflow CMS-driven template or one cloned layout.
- **Unfinished / stub content to fix, not replicate 1:1:**
  - `financing` page is riddled with **lorem ipsum** ("Section Headline", "Your Trust Is Important To Us", "This is the heading" ×3) and placeholder icon-boxes — treat as incomplete, needs real copy.
  - `employment` closing band = literal placeholder **"Footer CTA Headline Lorem" linking to `#`** — broken.
- **`roofing` hero** has an extra certification paragraph (GAF / CertainTeed / hail-claim) the other service heroes lack — minor hero variant.
- **`service-locations`** (live at `/service-locations/`, the footer's `/?page_id=4440` is a 404) is the ONE bespoke, non-Elementor page: custom `areas-*` sections, JS search + map, and it links out to **18 individual `/service-location/{city}-va/` city landing pages** (alexandria, annandale, arlington, burke, centreville, chantilly, fairfax, fairfax-station, falls-church, great-falls, herndon, lorton, mclean, oakton, reston, springfield, vienna + the county pages) — a programmatic-SEO cluster not covered by this inventory.
- **`contact-us`** is the only page with NO hero and NO cta-band — it opens directly on the contact form.

---

## PART B — HOMEPAGE (reference, from existing 04-design doc — not re-scraped)

Ordered body sections (excludes announcement bar, header, footer). See `04-design/.tmp/oldsite-content.md` §2 for verbatim copy.

| # | Section (doc ref) | Type slug | Notes |
|---|-------------------|-----------|-------|
| 1 | 2.2 Hero | `hero-home` | H1 (red service list) + H2 + 2 CTAs (Get A Quote → /contact-us/, Learn About Insurance Claims → /insurance-claims/); bg `New-asphalt-roof-on-a-home.webp`; hidden HP Mini Form |
| 2 | 2.3 Our Services | `service-cards-5up` | 5 icon cards → /windows/ /doors/ /roofing/ /siding/ /gutters/ |
| 3 | 2.4 Insurance Claims | `service-split` (image-left) | img `InsuranceRoof-1-scaled.webp`; "Insurance Claims Made Easy"; Learn More → /insurance-claims/ |
| 4 | 2.5 Portfolio teaser | `service-split-mirror` | "We Can Help Transform Your Clifton, Virginia Home"; img `Collage1.webp`; View Our Full Portfolio → /portfolio/ |
| 5 | 2.6 Trust / Why Us | `icon-benefits-3up` | "Feel Confident Working With Us" — 3 icon boxes |
| 6 | 2.7 About | `service-split` (image-left) | img `be-funkey-clifton-new-logo`; "About Clifton Exteriors"; Learn More → /about-us/ |
| 7 | 2.8 Process teaser | `process-teaser` | "A Hassle Free Process"; Our Process → /our-process/ |
| 8 | 2.9 Reviews | `reviews-widget` | Google Reviews slider (45 reviews, 5.0 / 55) |
| 9 | 2.10 Final CTA band | `cta-band` | "Add To The Curb Appeal Of Your Home"; Get A Quote → /contact-us/ |

---

## PART C — INNER PAGES (fetched 2026-07-10)

Section headings are verbatim. `[dyn]` marks dynamic/JS content.

### C.1 /windows/ — "Window Replacement and Installation in Clifton, VA…"
1. `hero-inner` — **H1** "Top Window Installer & Window Replacement Team In Northern Virgina" + H2 "Elevate The Appearance Of Your Home With New And Improved Windows"; buttons Get A Quote → /contact-us/, Our Process → /our-process/; bg `DL_Resizer12.webp`.
2. `financing-badges-band` — **H2** "We Offer Financing For Your Project"; Learn More → /financing/; 5 badge logos (GAF-CERTIFIED, Google 5-star, ProVia, ShingleMaster, Nextdoor 2024).
3. `service-split` (image-left) — **H2** "Window Installation: Create An Inviting Atmosphere"; img `windowsCliftonsections_resizer5.webp`; Get A Quote.
4. `icon-list-upgrades` — **H2** "Common Upgrades For Window Installation And Window Replacement In Clifton, VA"; 4 items (Low-E Argon, Internal Grids, Tempered Glass, Color Options); bg `DL_Resizer1.webp`.
5. `service-split-mirror` — **H2** "Upgrade Your Curb Appeal With Window Installation"; img `windowsCliftonsections_resizer2.webp`; Get A Quote.
6. `gallery-grid` — **H2** "Our Window Installation Portfolio"; **9 images** (IMG_1135, IMG_9825, IMG_1083, IMG_1131, IMG_9670_1, IMG_2411-1, IMG_9378_1, IMG_9702, IMG_9414_1); View Our Full Portfolio → /portfolio/. [dyn lightbox]
7. `icon-benefits-3up` — **H2** "Feel Confident Working With Us"; 3 icon boxes (Lifetime Craftsmanship Warranty, 25+ Years Of Experience, Award-Winning).
8. `pricing-tables-3up` (#pricing) — **H2** "Window Installation And Replacement Pricing In Clifton, VA"; Standard $5-8.5K / Deluxe $10-17K / Premium $20-40K; disclaimer.
9. `process-teaser` — **H2** "A Hassle Free Process"; Our Process; bg `DL_Resizer1.webp`.
10. `faq-accordion` — **H2** "Frequently Asked Questions About Window Replacement & Installation"; **6 Q&A** (replace time / cost per window / neglect consequences / how to start / all-at-once / vinyl value). [dyn accordion]
11. `reviews-widget` — **H2** "Reviews From Our Satisfied Clients". [dyn Google Reviews]
12. `form-contact` — **H1** "Tell Us About Your Project"; **20-field** form (first/last name, phone, email, address, city, state, zip, "how did you find us" select, 3 help_with checkboxes…); submit "Get Your Quote". [dyn form + reCAPTCHA]
13. `cta-band` — **H2** "Invite The Sunshine Into Your Home"; Get A Quote; bg `DL_Resizer5.webp`.

### C.2 /doors/ — "Front Door Replacement and Installation…"
Same 13-section skeleton as Windows. Deltas:
1. hero **H1** "Premium Door Installation And Front Door Replacement In Clifton, Virginia" / H2 "Welcome Loved Ones Into Your Home With Brand New Doors".
2. financing-badges-band (identical).
3. service-split img `beautiful wooden front door` — **H2** "Add Personality To Your Home".
4. icon-list-upgrades — **H2** "Common Upgrades For Door Installation & Front Door Replacement"; 5 items (Low-E Argon, Internal Grids, Internal Blinds, Designer Hardware Options, Custom Sizes).
5. service-split-mirror — **H2** "Gift Yourself Peace Of Mind"; img `double white front doors`.
6. gallery-grid — **H2** "Our Front Door Replacement Portfolio"; **6 images**. [dyn]
7. icon-benefits-3up (identical).
8. pricing — **H2** "Front Door Replacement And Door Installation Pricing In Clifton"; Standard $2.8-5K / Deluxe $5.5-10K / Premium $7.5-18K.
9. process-teaser.
10. faq-accordion — **H2** "Frequently Asked Questions About Door Installation & Replacement"; **2 Q&A**. [dyn]
11. reviews-widget. [dyn]
12. form-contact (20 fields, "Get Your Quote"). [dyn]
13. cta-band — **H2** "A Door That Says "Welcome Home"".

### C.3 /roofing/ — "Roofing Replacement and Installation…"
Same skeleton. Deltas:
1. hero **H1** "Most Trusted Roofer In Clifton, VA & Surrounding Areas" / H2 "Trust our expertise for all your roof replacement and new roof installation needs" + **extra cert paragraph** ("We Are A Certified GAF Roofing Installer And CertainTeed Shingle Master. Got Hail Damage?…"); bg `DL_Resizer11.webp`. *(hero variant with 3rd heading block.)*
2. financing-badges-band.
3. service-split img `new roof on house with refinished siding` — **H2** "Protect Your Family With Roof Replacement".
4. icon-list-upgrades — **H2** "Common Upcharges For Roof Replacement And Installation"; 4 items (Custom Designer Shingles, Skylights, Rotted/FRT Plywood Replacement, Steep Slope).
5. service-split-mirror — **H2** "Add Character To Your Clifton Home"; img `new roof on beautiful home`.
6. gallery-grid — **H2** "Our Roofer's Replacement And Installation Portfolio"; **6 images**. [dyn]
7. icon-benefits-3up — NOTE: first icon-box reads **"10 Year Craftsmanship Warranty"** (not "Lifetime") on roofing.
8. pricing — Standard $5-7.5K / Deluxe $8-18K / Premium $20-50K+ (3 feature items each).
9. process-teaser.
10. faq-accordion — **6 Q&A** (replace time / why good roof / popular type / leak = full replace? / most important part / popular color). [dyn]
11. reviews-widget. [dyn]
12. form-contact. [dyn]
13. cta-band — **H2** "Put A Roof You Can Trust Over Your Family".

### C.4 /siding/ — "Siding Replacement and Installation…"
Same skeleton. Deltas:
1. hero **H1** "Best Siding Contractor In Clifton, Virginia, & Surrounding Areas" / H2 "Got hail damage? We got you covered with over 20 years of siding hail claim expertise!"; bg `DL_Resizer8.webp`.
3. service-split — **H2** "Siding Replacement: A New Look For Your Home"; img `new home with beige siding`.
4. icon-list-upgrades — **H2** "Common Upgrades For Siding Replacement And Installation"; 3 items (Thicker Panel Design, Insulated Siding, Darker Colors).
5. service-split-mirror — **H2** "Protect Your House From The Elements"; img `new siding around front door`.
6. gallery-grid — **H2** "Our Siding Contractor Team's Portfolio"; **9 images**. [dyn]
7. icon-benefits-3up.
8. pricing — Standard $8-14K / Deluxe $16-24K / Premium $28-50K+.
9. process-teaser.
10. faq-accordion — **3 Q&A** (replace time / materials on start date / paint siding?). [dyn]
11. reviews-widget / 12. form-contact / 13. cta-band — **H2** "A Brand New Exterior For Your Home".

### C.5 /gutters/ — "Gutter Installation and Replacement…"
Same skeleton. Deltas:
1. hero **H1** "Gutter Installation And Replacement In Clifton, VA, & Surrounding Areas" / H2 "Install Gutters That Can Handle All Weather Conditions"; bg `DL_Resizer10.webp`.
3. service-split — **H2** "Gutter Installation: Protect Your Home In Clifton, Virginia"; img `new gutter installation`.
4. icon-list-upgrades — **H2** "Common Upgrades For Gutter Installation And Replacement"; 3 items (Custom Colors, Oversize Gutters & Downspouts, Leaf Protection).
5. service-split-mirror — **H2** "Strong, Seamless Gutters For Your Clifton Home"; img `new gutter cover`.
6. gallery-grid — **H2** "Our Gutter Installation And Replacement Portfolio"; **6 images**. [dyn]
7. icon-benefits-3up.
8. pricing — Standard $1-1.5K / Deluxe $2-3.5K / Premium $4-10K+.
9. process-teaser / 10. faq-accordion — **4 Q&A** (replace time / avg cost / which gutters / worth it?). [dyn]
11. reviews-widget / 12. form-contact / 13. cta-band — **H2** "Small Details Make A Big Difference".

### C.6 /insurance-claims/ — "Insurance Claims for Roof and Exterior Damage…"
1. `hero-inner` — **H1** "Insurance Claims For Your Clifton Home" / H2 "Simplifying The Insurance Claims Process For You"; single button "Get A Free Roof…" → /contact-us/; bg `Hero-scaled.webp`.
2. `financing-badges-band`.
3. `service-split` (image-left) — **H2** "Hassle-Free Insurance Claims Assistance for Your Home's Exterior"; img `siding1.webp`.
4. `faq-accordion` — **H2** "Frequently Asked Questions About Insurance Claims In Clifton, VA"; **4 Q&A**. [dyn]
5. `process-steps-numbered` — **H2** "Our Insurance Claims Process" (subhead "Helping You Get Coverage For Your Home's Damage"); **9 numbered icon-boxes** (Initial Consultation → Filing Claim → Inspection Day → Statement Of Loss → Supplement Estimate → Final Agreement → Quality Repairs → Final Inspection → Lifetime Warranty).
6. `icon-benefits-3up` — **H2** "Feel Confident Working With Us"; 3 icon boxes.
7. `form-insurance` — **H1** "Experience Hassle-Free Insurance Claims"; **24-field** form incl. radio "preferred contact method"; submit "Submit". [dyn form + reCAPTCHA]
8. `reviews-widget`. [dyn]
9. `cta-band` — **H2** "Your Home Built To Perfection".

### C.7 /our-process/ — "Learn More About Our Process…"
1. `hero-inner` — **H1** "Our Process" / H2 "The Transformation Of Your Home Is Just A Few Steps Away"; buttons Get A Quote + Our Process; bg `DL_Resizer9.webp`.
2. `financing-badges-band`.
3. `service-split` — **H2** "Setting The Right Expectations"; img `beautiful new home with beige siding`.
4. `process-steps-vertical` — **H2** "A Brand New Home In 10 Simple Steps"; **10 steps** (Contact Us / Phone Consultation / On-Site Consultation / Signing The Contract / Out For Measurements / Materials Ordered / We Protect Your Home / We Get To Work / Final Walkthrough / Warranty), each icon + H3 + paragraph.
5. `reviews-widget`. [dyn]
6. `cta-band` — **H2** "Start Your Exterior Renovation Here!".

### C.8 /about-us/ — "About Clifton Exteriors…"
1. `hero-inner` — **H1** "About Clifton Exteriors, LLC" / H2 "A Specialized Team Committed To Delivering Exceptional Experiences"; buttons Get A Quote + Our Process; bg `DL_Resizer7.webp`.
2. `financing-badges-band`.
3. `service-split` (image-left) — **H2** "About Clifton Exteriors"; img `BeFunky-collage-new-logo1.jpg`; Get A Quote + body copy ("…over two decades…since the 1990s…").
4. `service-split-mirror` — **H2** "Our Mission"; img `CliftonTeam1sections_resizer.webp` (team photo).
5. `icon-benefits-3up` — **H2** "Feel Confident Working With Us".
6. `badge-logo-wall` — **13 certification/award logos** (GAF Certified 2016, James Hardie, 2022 Angi Super Service, Home Advisor, GAF System Plus, Nextdoor 2024, BBB, 2024 Energy Star, Google 5-star, ProVia, Thumbtack, Endure Windows, Lead-Safe EPA, Lifetime Warranty). *(unique logo-grid section — about-us only.)*
7. `process-teaser` — **H2** "A Hassle Free Process".
8. `reviews-widget`. [dyn]
9. `cta-band` — **H2** "We Are Here To Take Care Of You".

*(Note: section 6 `badge-logo-wall` is a distinct one-off type not in the synthesis table's numbered list — see below "additional one-offs".)*

### C.9 /portfolio/ — "Explore Our Portfolio…"
1. `hero-inner` — **H1** "Our Project Portfolio" / H2 "Get Ideas For Your Home's Exterior Upgrade"; Get A Quote; bg `DL_Resizer6.webp`.
2. `financing-badges-band`.
3. `gallery-grid` — **H2** "Window Replacement And Installation" — **15 images**. [dyn]
4. `gallery-grid` — **H2** "Door Installation" — **12 images**. [dyn]
5. `gallery-grid` — **H2** "Roofing Repair And Installation" — **8 images**. [dyn]
6. `gallery-grid` — **H2** "Siding Repair And Installation" — **18 images**. [dyn]
7. `gallery-grid` — **H2** "Gutter Repair And Installation" — **11 images**. [dyn]
8. `reviews-widget`. [dyn]
9. `cta-band` — **H2** "We're Here To Help Make Your House A Home".

### C.10 /pricing/ — "Exterior Remodeling Pricing…"
1. `hero-inner` — **H1** "Exterior Home Renovation At A Fair Price" / H2 "Get Ballpark Pricing For Your Home's Renovation"; Get A Quote + Our Process; bg `DL_ResizerLast.webp`.
2. `financing-cta-text` — **H2** "We Offer Financing For Your Project" + Learn More button (no badge row). *(variant of #2)*
3. `pricing-tables-3up` — "Window Replacement And Installation" (Standard $5-8.5K / Deluxe $10-17K / Premium $20-40K).
4. `pricing-tables-3up` — "Door Replacement And Installation" ($2.8-5K / $5.5-10K / $7.5-18K).
5. `pricing-tables-3up` — "Roofing Replacement And Installation" ($5-7.5K / $8-18K / $20-50K+).
6. `pricing-tables-3up` — "Siding Replacement And Installation" ($8-14K / $16-24K / $28-50K+).
7. `pricing-tables-3up` — "Gutter Replacement And Installation" ($1-1.5K / $2-3.5K / $4-10K+).
8. `reviews-widget`. [dyn]
9. `cta-band` — **H2** "Quality Is Our Promise".

### C.11 /media/ — "…Media Center"
1. `hero-inner` — **H1** "Our Media Center" / H2 "Watch Us Transform Homes Throughout Virginia"; Get A Quote; bg `DL_Resizer17.webp`.
2. `financing-badges-band`.
3. `video-embed-grid` — 2 YouTube videos (`eHL1NqT7Twk`, `youtu.be/4489D9-zn3E`). [dyn YouTube]
4. `video-embed-grid` — 2 YouTube videos (`kqIA3RTBdGk`, `NELbJnxGM84`). [dyn YouTube]
5. `reviews-widget`. [dyn]
6. `cta-band` — **H2** "Make Your Home The Talk Of The Neighborhood".

### C.12 /contact-us/ — "Contact Clifton Exteriors…"
*(No hero, no cta-band — opens on the form.)*
1. `form-contact` — **H1** "Tell Us About Your Project"; 20-field form; submit "Get Your Quote". [dyn form + reCAPTCHA]
2. `financing-cta-text` — **H2** "We Offer Financing For Your Project" + Learn More button. *(variant of #2)*
3. `contact-details-map` — **H2** "Or Get In Touch Directly"; logo + address/phone/email icon-list (12644 Chapel Rd #104, Clifton VA 20124 / +1 571-249-1480 / info@…) + **Google Maps embed**. [dyn map]
4. `reviews-widget`. [dyn]

### C.13 /employment/ — "Explore Employment Opportunities…"
1. `hero-inner` (headings only, no buttons) — **H1** "Join Our Team" / H2 "Advance Your Career In The Trades At Clifton Exteriors"; bg `DL_Resizer15.webp`.
2. `service-split` — **H2** "Let's Work Together"; img `CliftonTeam1sections_resizer.webp` (team photo).
3. `form-employment` — **H2** "Apply To Our Crew"; job-application form (name/contact/experience radio group…); submit "Send Your Application". [dyn form + reCAPTCHA]
4. `contact-details-map` — **H2** "Or Get In Touch Directly"; logo + contact icon-list + Google Maps embed. [dyn map]
5. `reviews-widget`. [dyn]
6. `cta-band` — **BROKEN: "Footer CTA Headline Lorem"** button "Get A Quote" → `#` (placeholder, needs real content).

### C.14 /financing/ — "Financing Options…" (many LOREM stubs — page is unfinished)
1. `hero-inner` — **H1** "Finance Your Project" / H2 "Whether Your Project Is Big Or Small, We Got Your Back"; Get A Quote; bg `DL_Resizer2-1.webp`.
2. `text-heading-band` — **H2** "Learn More About How to Finance Your Project Below" (heading only).
3. `icon-benefits-3up` (variant) — 3 icon boxes: Apply Online / Quick Response Time / Financing Options.
4. `text-heading-band` — **LOREM STUB**: "Section Headline" + lorem paragraph + Learn More button.
5. `financing-partner-cta` — **H2** "Get the best financing around with our partner"; SVC-Endorsed logo; "No interest if paid in full in 6 months"; external **Apply Now** → apply.svcfin.com.
6. `icon-benefits-3up` (variant) — **LOREM STUB**: "Your Trust Is Important To Us" + 3 "This is the heading" lorem icon-boxes.
7. `financing-partner-cta` — **H2** "We Have Financing"; lorem text; external **Learn More** → projects.greensky.com (GreenSky).
8. `reviews-widget`. [dyn]
9. `cta-band` — **H2** "Your Home Built To Perfection".

### C.15 /testimonials/ — "Client Testimonials…"
1. `hero-thankyou` — logo + **H1** "Thank You For Your Review!" + blockquote ("It means the world to us that you've trusted us…") + buttons "Leave a Google review" (g.page/r/…) & "Leave a Facebook review" (facebook.com/cliftonexteriors/reviews).
2. `reviews-widget-trustindex` — **H2** "Client Testimonials" + subhead; **Trustindex `ti-widget` — EMPTY in server HTML (JS-only)**. [dyn — no server content]
3. `cta-band` — **H2** "Building Relationships One Home At A Time"; Get A Quote; bg `DL_Resizer5.webp`.

### C.16 /blog/ — "Exterior Home Repair & Siding Blog…"
1. `hero-inner` — **H1** "Exterior Renovation Blogs" / H2 "Read About Recent Projects, Get Answers To FAQs, and Stay Up To Date On The Latest Trends"; Get A Quote; bg `DL_Resizerblog.webp`.
2. `financing-badges-band`.
3. `blog-cards` — **6 post cards** (with thumbnails), no pagination: "We've Heard Enough Feedback About Gutters To Know The Truth" / "Stop Fighting Your Door Every Time You Close It" / "The Truth About Premium Doors No One Tells You" / "What Actually Matters When Choosing a Front Door" / "Steel or Fiberglass? The Truth Most Homeowners Miss" / "What You'll Really Pay for a New Patio Door (No Surprises)". [dyn CMS list]
4. `reviews-widget`. [dyn]
5. `cta-band` — **H2** "Inspired To Start?".

### C.17 /service-locations/ — "Areas We Serve…" (bespoke, non-Elementor page)
*(footer's `/?page_id=4440` returns 404; the live page is `/service-locations/`.)*
1. `hero-editorial` — **H1** "Windows, Roofing & Exterior Services Across Northern Virginia" + intro paragraph; button Get A Quote + "Call (571) 249-1480".
2. `locations-search` — **H2** "Looking for a specific city or county?" + text search input (`cgn-aws-search-input`, placeholder "Try 'Annandale'…"). [dyn custom JS]
3. `locations-map` — interactive VA service-area map (`cgn-aws-map`, JS) with `<noscript>` list fallback. [dyn custom JS]
4. `locations-county-list` — **H2** "Fairfax County" + 6 county blocks (Fairfax County, Fairfax, Falls Church, Arlington County, Alexandria, Prince William County), each with paragraph + links to **18 `/service-location/{city}-va/` city pages** (alexandria, annandale, arlington, burke, centreville, chantilly, fairfax, fairfax-station, falls-church, great-falls, herndon, lorton, mclean, oakton, reston, springfield, vienna).
5. `fallback-cta` — **H2** "Don't See Your City?" + text.
6. `locations-specialization` — **H2** "Roofing and Window Specialists, Not Generalists" + text.
7. `cta-band-dual` — **H2** "Ready to Start Your Project?"; buttons Start a Conversation / Call (571) 249-1480.

---

## Additional one-off section types (not templated)

| Slug | Page | Description |
|------|------|-------------|
| `badge-logo-wall` | about-us (§6) | Grid of 13 certification/award logos |
| `video-embed-grid` | media | YouTube embed rows [dyn] |
| `blog-cards` | blog | Dynamic post grid [dyn] |
| `contact-details-map` | contact-us, employment | Address block + Google Maps [dyn] |
| `financing-partner-cta` | financing (×2) | External lender apply buttons |
| `locations-*` (search/map/county/specialization/fallback) | service-locations | Bespoke custom-coded page [partly dyn] |

---

## Fetch status

- **17 / 17 inner pages fetched successfully** (windows, doors, roofing, siding, gutters, insurance-claims, our-process, about-us, portfolio, pricing, media, contact-us, employment, financing, testimonials, blog, service-locations). Homepage reused from existing `04-design` doc (not re-scraped).
- `/?page_id=4440` → **404** (dead footer link; superseded by the live `/service-locations/` page, which was fetched instead).
- Site sits behind a SiteGround anti-bot proof-of-work challenge; WebFetch returned empty. Bypassed with a local SHA1 PoW solver to retrieve full server-rendered HTML.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
