# Clifton Exteriors — Staging Section Inventory (Published Snapshot)

**Site:** https://clifton-exteriors-lutum.webflow.io (staging redesign of https://www.cliftonexteriors.com)
**Captured:** 2026-07-10, via WebFetch (rendered content) + raw HTML pull (class/section analysis)
**Purpose:** current-state inventory for redesign gap analysis.

> [!IMPORTANT]
> **Caveat — published snapshot only.** This inventory reflects the PUBLISHED staging site. The Webflow Designer may hold newer unpublished work; per Webflow page metadata, **windows, doors, and roofing were edited 2026-07-09**, so those pages in particular may be ahead of what is documented here.

---

## Status Summary Table

| Page | URL path | Verdict | Page-specific real content | Nav | Notes |
|---|---|---|---|---|---|
| Home | `/` | **BUILT** | Yes — full custom page | NEW mega-nav | No placeholders anywhere |
| Windows | `/windows` | **BUILT** | Yes — full custom page (win-* sections) | NEW mega-nav | The design reference page |
| Doors | `/doors` | **PARTIAL** | Shared scaffold only; window leftovers | OLD template navbar | Clone of generic service scaffold |
| Roofing | `/roofing` | **PARTIAL** | Shared scaffold only; window leftovers | OLD template navbar | Identical clone of doors |
| Siding | `/siding` | **PARTIAL** | Shared scaffold only; window leftovers | OLD template navbar | Identical clone of doors |
| Gutters | `/gutters` | **PARTIAL** | Shared scaffold only; window leftovers | NEW mega-nav | Same clone body, new nav installed |
| Insurance Claims | `/insurance-claims` | **PLACEHOLDER** | None (shared components only) | OLD template navbar | No insurance-specific content |
| Our Process | `/our-process` | **PARTIAL** | Real 4-step process section (topical) | NEW mega-nav | Placeholder hero + CTA |
| About Us | `/about-us` | **PLACEHOLDER** | None — zero "about" content | OLD template navbar | Scaffold shell |
| Portfolio | `/portfolio` | **PLACEHOLDER** | None — 5 duplicate galleries, 30 placeholder images | OLD template navbar | All gallery tiles are `image-placeholder` |
| Pricing | `/pricing` | **PARTIAL** | Real window pricing data, repeated 5x | OLD template navbar | Only windows pricing; other services missing |
| Media | `/media` | **PLACEHOLDER** | Topical heading only; 3 empty video slots | OLD template navbar | No actual video embeds |
| Contact Us | `/contact-us` | **PARTIAL** | Real form + direct-contact block | OLD template navbar | Placeholder hero |
| Employment | `/employment` | **PLACEHOLDER** | None — reuses contact form, nothing job-related | OLD template navbar | Scaffold shell |
| Financing | `/financing` | **PLACEHOLDER** | None — no financing details at all | OLD template navbar | Scaffold shell |
| Testimonials | `/testimonials` | **PARTIAL** | Real 12-review wall (topical) | OLD template navbar | Placeholder hero + CTA |
| Blog | `/blog` | **PARTIAL** | 3 real CMS posts with dates | OLD template navbar | Placeholder hero, CTA, post thumbnails |
| Service Locations | `/service-locations` | **PARTIAL** | Real 17-location grid + price-match section | OLD template navbar | Services slider cards unconfigured |

**Totals: 2 BUILT / 10 PARTIAL / 6 PLACEHOLDER**

### Shared components that appear on nearly every page (all with REAL content)
These make scaffold pages look "half real" — they are global, not page-specific work:
- **Footer** (`cx-foot__*`) — identical on all 18 pages. Contact: (571) 249-1480, info@cliftonexteriors.com, 12644 Chapel Rd #104, Clifton, VA 20124. Columns: Services (5), Company (5), Resources (5). Social: Facebook, Instagram, Yelp, YouTube. Legal: Privacy Policy, Terms of Service, (c) 2026 Clifton Exteriors, LLC.
- **Reviews wall** (`section_reviews`, `review-card`) — "5.0 Based on 55 Google reviews" badge + **12 real Google review cards** (named reviewers) on 16 of 18 pages.
- **Financing banner** (`section_financing-banner`) — "We Offer Financing For Your Project" on most pages.
- **Logo/cert strip** (`section_logo-strip`) — GAF, Google 5.0, ProVia, CertainTeed/ShingleMaster, Nextdoor badges.
- **Trust section** (`section_trust`) — "Feel Confident Working With Us": Lifetime Craftsmanship Warranty / 25+ Years / Award-Winning (3 cards).
- **Process section** (`section_process`) — "A Hassle Free Process", 4 steps (Contact -> Phone Consultation -> On-Site Visit -> We Get To Work).
- **Placeholder page-header hero** (`section_page-header`) — `<h1>This is your headline</h1>` / "This is your subheadline" + 2 CTAs. Present on **all 16 non-BUILT pages** (unconfigured component prop — heading blocks carry `data-wf--heading-text--heading-style` variant attributes).
- **Placeholder closing CTA** (`section_cta`) — "This is a heading" + lorem ipsum + Get Quote, on most non-BUILT pages.

### Two navigation systems coexist
- **NEW custom mega-nav** (`mega-nav__*`, 17 panel links: Services -> Windows/Doors/Roofing/Siding/Gutters; Company -> Our Process, Project Pricing, Photo Portfolio, Financing Options, Insurance Claims, Our Story, Meet the Team, Our Testimonials, Service Areas, The Exterior Blog, Join Our Team; Get Quote CTA). Installed on: **home, windows, gutters, our-process** (4 pages).
- **OLD template navbar** (`navbar_*` Relume-style) with **unconfigured dropdowns**: "Category One … Category Five" links and lorem-ipsum "collection" cards in both Services and About dropdowns. Still live on the other **14 pages**.

---

## Per-Page Inventory

### 1. Home `/` — **BUILT**
Class style: hybrid — Relume `u-` utilities (`u-section`, `u-heading`, `u-paragraph`) + Client-First-style `section_hero|services|usp|portfolio|feature|reviews|cta` + custom blocks (`slide-property-card`, `slider-gallery-image`, `usp_image`, `button-content-tile`, `cx-foot__*`, `mega-nav__*`).
Nav: NEW mega-nav. Footer: site-wide (yes).

| # | Section | Heading (verbatim) | Summary | Items |
|---|---|---|---|---|
| 1 | hero (`section_hero`) | h1 "Windows, Roofing, Siding, Doors & Gutters In Northern Virginia" / h2 "Transform your house into a place you're proud to come home to." | Value prop + dual CTAs | 2 buttons |
| 2 | services-carousels (`section_services`) | "Our Services" | 5 service sub-blocks, each an image carousel: "Window Replacement And Installation", "Door…", "Roofing…", "Siding…", "Gutter Replacement and Installation"; ends with "Insurance Claims Made Easy" CTA strip | 5 carousels x 5 slides (25 `slide-property-card`) |
| 3 | usp/trust (`section_usp`) | "Feel Confident Working With Us" | Lifetime Craftsmanship Warranty / Award-Winning / 25+ Years Of Experience | 3 blocks |
| 4 | portfolio-preview (`section_portfolio`) | "We Can Help Transform Your Clifton, Virginia Home" | Project gallery teaser + "Rated Neighborhood Fave on NextDoor 4 years in a row" badge | ~5 images + 1 badge |
| 5 | about (`section_feature`) | "About Clifton Exteriors" | Founder story + Learn More link | ~100 words |
| 6 | reviews (`section_reviews`) | "Reviews From Our Satisfied Clients" | Google reviews wall | 12 review cards |
| 7 | cta (`section_cta`) | "A Hassle Free Process" | Process teaser + CTA | 1 button |
| 8 | footer (`section_footer`) | — | Site-wide footer | 3 link cols + 4 social |

### 2. Windows `/windows` — **BUILT** (design reference page)
Class style: heavily custom BEM `win-*__*` blocks (`win-hero__eyebrow-wrap`, `win-fin__img`, `win-faq__*`, `section_win-hero|invite|financing|process|confidence|sunshine`) + `cx-btn__tile`/`cx-btn__arrow` buttons; only the footer uses generic `section_footer`.
Nav: NEW mega-nav. Footer: site-wide (yes).

| # | Section | Heading (verbatim) | Summary | Items |
|---|---|---|---|---|
| 1 | hero (`section_win-hero`) | h1 "Top Window Installer & Window Replacement Team In Northern Virginia" | Eyebrow + "5/5 from over 75 reviews" + CTAs | 2 CTAs |
| 2 | intro + cert strip | "Elevate The Appearance Of Your Home With New And Improved Windows" | Credential logos: GAF, Google, ProVia, ShingleMaster, Nextdoor | 5 badges |
| 3 | financing banner (`section_win-financing`) | "We Offer Financing For Your Project" | Link to /financing | 1 CTA |
| 4 | invite feature (`section_win-invite`) | "Window Installation: Create An Inviting Atmosphere" | Image + copy | 1 image |
| 5 | upgrades grid | "Common Upgrades For Window Installation And Window Replacement In Clifton, VA" | Low-E Argon, Internal Grids, Tempered Glass, Color Options | 4 cards |
| 6 | curb-appeal feature | "Upgrade Your Curb Appeal With Window Installation" | Image + copy | 1 image |
| 7 | portfolio | "Our Window Installation Portfolio" | Real project photos | 9 images |
| 8 | trust (`section_win-confidence`) | "Feel Confident Working With Us" | Warranty / 25+ years / awards | 3 cards |
| 9 | pricing | "Window Installation And Replacement Pricing In Clifton, VA" | 3 tiers: Standard $5–8.5K, Deluxe $10–17K, Premium $20–40K | 3 tiers |
| 10 | process (`section_win-process`) | "A Hassle Free Process" | 4 steps + link to /our-process | 4 steps |
| 11 | faq (`win-faq__*`) | "Frequently Asked Questions About Window Replacement & Installation" | Timeline, cost, necessity, process, bulk discount, home value | 6 FAQs |
| 12 | contact form | "Tell Us About Your Project" | Quote form | 1 form |
| 13 | final cta (`section_win-sunshine`) | "Invite The Sunshine Into Your Home" | Closing CTA | 1 CTA |
| 14 | footer | — | Site-wide footer | — |

### 3–6. Doors `/doors`, Roofing `/roofing`, Siding `/siding`, Gutters `/gutters` — **PARTIAL** (identical generic service-page clones)
Byte-identical structure across all four (~86 KB each; only gutters differs by carrying the new mega-nav). Real shared components + **windows-specific leftovers** + placeholder hero/CTA. **Nothing doors/roofing/siding/gutters-specific anywhere.**
Class style: Client-First-style structure (`section_page-header`, `padding-global`, `container-large`, `padding-section-large`) + `u-` utilities + custom blocks (`faq_*`, `pricing_item`, `review-card__*`, `cx-foot__*`, `image-placeholder`).
Nav: doors/roofing/siding = OLD template navbar (Category One–Five dropdowns); **gutters = NEW mega-nav**. Footer: site-wide (yes).

| # | Section | Heading (verbatim) | Summary | Items |
|---|---|---|---|---|
| 1 | hero (`section_page-header`) | h1 "This is your headline" | Placeholder hero + subheadline + 2 CTAs | — |
| 2 | logo-strip | — | Real cert badges (GAF, Google 5.0, ProVia, CertainTeed, Nextdoor) | 5 badges |
| 3 | financing-banner | "We Offer Financing For Your Project" | Real banner | 1 CTA |
| 4 | content block | h1 "This is a heading" | Lorem ipsum + Get Quote CTA; 2 stock images | 2 images |
| 5 | gallery (`section_gallery`) | "Our Window Installation Portfolio" (**windows leftover**) | Gallery of placeholder tiles | 6 `image-placeholder` |
| 6 | trust (`section_trust`) | "Feel Confident Working With Us" | Warranty / 25+ years / awards | 3 cards |
| 7 | pricing (`section_pricing`) | "Window Replacement Pricing In Clifton, VA" (**windows leftover**) | Vinyl $600–1,200 / Fiberglass $900–1,800 / Wood $1,200–2,400 | 3 `pricing_item` |
| 8 | process (`section_process`) | "A Hassle Free Process" | 4 real steps | 4 steps |
| 9 | faq (`section_faq`) | "Frequently Asked Questions" | 3 real but window-topic FAQs | 3 `faq_item` |
| 10 | reviews (`section_reviews`) | "5.0 Based on 55 Google reviews" / "Reviews From Our Satisfied Clients" | Real Google reviews wall | 12 cards |
| 11 | cta (`section_cta`) | h1 "This is a heading" | Lorem ipsum + Get Quote | 1 CTA |
| 12 | footer | — | Site-wide footer | — |

### 7. Insurance Claims `/insurance-claims` — **PLACEHOLDER** (scaffold shell)
Sections in order: placeholder hero (`section_page-header`, "This is your headline") -> financing-banner -> placeholder content block ("This is a heading" + lorem) -> faq ("Frequently Asked Questions", 3 window-topic FAQs) -> process ("A Hassle Free Process", 4 steps) -> trust ("Feel Confident Working With Us", 3 cards) -> reviews (12 cards) -> placeholder cta -> footer. **Zero insurance-claims content.**
Class style: same Client-First + `u-` + custom-block hybrid as the service clones. Nav: OLD template navbar. Footer: site-wide (yes).

### 8. Our Process `/our-process` — **PARTIAL**
Sections: placeholder hero ("This is your headline") -> financing-banner -> **process ("A Hassle Free Process", real 4 steps — the page's actual topic)** -> reviews ("5.0 Based on 55 Google reviews", 12 cards) -> placeholder cta ("This is a heading" + lorem) -> footer. Process content is real but identical to the shared component used everywhere — no expanded per-step detail yet.
Class style: same hybrid. Nav: **NEW mega-nav**. Footer: site-wide (yes).

### 9. About Us `/about-us` — **PLACEHOLDER** (scaffold shell)
Sections: placeholder hero -> logo-strip (5 real badges) -> financing-banner -> placeholder content block ("This is a heading" + lorem) -> trust (3 cards) -> process (4 steps) -> reviews (12 cards) -> placeholder cta -> footer. **Zero "about"/story/team content** (the home page's "About Clifton Exteriors" blurb does not appear here).
Class style: same hybrid. Nav: OLD template navbar. Footer: site-wide (yes).

### 10. Portfolio `/portfolio` — **PLACEHOLDER**
Sections: placeholder hero -> financing-banner -> **`section_gallery` x5, all headed "Our Window Installation Portfolio"** (windows leftover, duplicated five times) with **30 `image-placeholder` tiles total (6 per gallery) — no real project photos** -> reviews (12 cards) -> placeholder cta -> footer.
Class style: same hybrid; `image-placeholder` is the most frequent class on the page (30). Nav: OLD template navbar. Footer: site-wide (yes).

### 11. Pricing `/pricing` — **PARTIAL**
Sections: placeholder hero -> financing-banner -> **`section_pricing` x5, all identical "Window Replacement Pricing In Clifton, VA"** (15 `pricing_item` = 3 rows x 5 repeats: vinyl/fiberglass/wood ranges — real data, windows only) -> reviews (12 cards) -> placeholder cta -> footer. The 5 repeats look like slots intended for one pricing table per service (windows/doors/roofing/siding/gutters) — only windows data exists, cloned 5x.
Class style: same hybrid. Nav: OLD template navbar. Footer: site-wide (yes).

### 12. Media `/media` — **PLACEHOLDER** (topical heading, empty content)
Sections: placeholder hero -> financing-banner -> video (`section_video`) headed "Watch Us Transform Homes Throughout Virginia" with **3 empty `video_item` boxes containing only a play-icon character — no video embeds** -> reviews (12 cards) -> placeholder cta -> footer.
Class style: same hybrid + `video_*` block. Nav: OLD template navbar. Footer: site-wide (yes).

### 13. Contact Us `/contact-us` — **PARTIAL**
Sections: placeholder hero ("This is your headline") -> financing-banner -> contact (`section_contact`): **real form "Tell Us About Your Project"** + "Or Get In Touch Directly" (phone (571) 249-1480, address, hours Mon–Fri 9am–5pm) -> reviews (12 cards) -> footer (no closing CTA section). Functionally the most complete scaffold page; only the hero is placeholder.
Class style: same hybrid. Nav: OLD template navbar. Footer: site-wide (yes).

### 14. Employment `/employment` — **PLACEHOLDER** (scaffold shell)
Sections: placeholder hero -> placeholder content block ("This is a heading" + lorem) -> contact (`section_contact`): **reused "Tell Us About Your Project" quote form** — not an application form, nothing job-related -> "Or Get In Touch Directly" -> reviews (12 cards) -> footer. **Zero employment content.**
Class style: same hybrid. Nav: OLD template navbar. Footer: site-wide (yes).

### 15. Financing `/financing` — **PLACEHOLDER** (scaffold shell)
Sections: placeholder hero -> placeholder content block ("This is a heading" + lorem, x2) -> trust ("Feel Confident Working With Us", 3 cards) -> reviews (12 cards) -> placeholder cta -> footer. **No financing terms, partners, or plan details anywhere** — the page every "We Offer Financing" banner links to is empty of financing content.
Class style: same hybrid. Nav: OLD template navbar. Footer: site-wide (yes).

### 16. Testimonials `/testimonials` — **PARTIAL**
Sections: placeholder hero -> reviews (topical: "5.0 Based on 55 Google reviews", "Reviews From Our Satisfied Clients", **12 real named review cards**, "5/5 from over 75 reviews" metric + links to read all / leave a Google review) -> placeholder cta -> footer. Topic content is real but identical to the shared reviews wall — no extended/long-form testimonials yet.
Class style: same hybrid (`review-card__*`, `reviews-wall__*`). Nav: OLD template navbar. Footer: site-wide (yes).

### 17. Blog `/blog` — **PARTIAL**
Sections: placeholder hero -> blog-list (`section_blog-list`) headed "Exterior Renovation Blog" with **3 real CMS posts**: "Stop Fighting Your Door Every Time You Close It" (May 28, 2026), "The Truth About Premium Doors No One Tells You" (May 21, 2026), "What Actually Matters When Choosing a Front Door" (May 14, 2026) — thumbnails are `image-placeholder` (3) -> placeholder cta -> footer. Smallest page (~24 KB); no reviews wall.
Class style: same hybrid. Nav: OLD template navbar. Footer: site-wide (yes).

### 18. Service Locations `/service-locations` — **PARTIAL**
Sections: placeholder hero -> locations (`section_locations`) headed "Serving Homeowners Across Northern Virginia" with **17 real `locations_link` entries**: 13 Fairfax County (Annandale, Burke, Centreville, Chantilly, Fairfax Station, Great Falls, Herndon, Lorton, McLean, Oakton, Reston, Springfield, Vienna) + Arlington + 3 independent cities (Alexandria, Fairfax, Falls Church) -> price-match block ("Found a Better Price? We'll Beat It" / h1 "Quality at a fair price") -> services slider (`section_services`, same component as home: 25 `slide-property-card` in 5 carousels) but **all 5 card heading props unconfigured — each renders h1 "This is a heading"** -> reviews (12 cards) -> placeholder cta -> footer.
Class style: same hybrid + `locations_link`, home's slider classes. Nav: OLD template navbar. Footer: site-wide (yes).

---

## Site-Wide Class Naming Observation

One consistent **hybrid system across all pages** (not strict Client-First, not pure Relume):
- **Structure:** Client-First-style `section_<name>` wrappers with `padding-global` > `container-large` > `padding-section-large|medium` nesting.
- **Relume-style utilities:** `u-section`, `u-heading`, `u-paragraph`, `u-rating-component`, `u-header-group`, `u-eyebrow-tag` (no `rl-` classes anywhere).
- **Custom BEM blocks:** `cx-foot__*` (footer), `cx-btn__*`, `mega-nav__*` (new nav), `win-*__*` (windows page), `review-card__*` / `reviews-wall__*`, `faq_*`, `pricing_item*`, `video_*`, `locations_link`, `slide-property-card`, `usp_*`.
- **Old template remnants:** `navbar_*` (Relume-style navbar with `navbar_item-content` etc.), `menu-icon1_*`, `image-placeholder`.
- Heavy Webflow **component/variant usage**: `w-variant-*` classes and `data-wf--heading-text--heading-style` attributes — the recurring literal "This is a heading" is an **unconfigured component heading prop**, and "This is your headline" is the shared unconfigured page-header component.

## Fetch Notes / Failures
- All 18 pages fetched successfully on first attempt (no 404s, no retries needed).
- Local tooling note only: raw-HTML pull via curl required `--ssl-no-revoke` on this machine (Windows schannel revocation check); not a site issue.
- WebFetch's markdown rendering surfaces the OLD navbar's hidden dropdown content ("Category One–Five", lorem collection cards) as if it were page sections — those are nav-component placeholders, not body sections; the per-page tables above use the actual `<section>` order from raw HTML.

## Version Control
Workflow artifact under `.tmp/` (deliver pillar, Clifton Exteriors, 07-webflow-build). Lightweight and safe to commit per SYSTEM_RULES Section 4. Regenerate by re-running the staging inventory (WebFetch + raw HTML pull) against the published staging domain; supersede rather than hand-edit if staging is republished.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
