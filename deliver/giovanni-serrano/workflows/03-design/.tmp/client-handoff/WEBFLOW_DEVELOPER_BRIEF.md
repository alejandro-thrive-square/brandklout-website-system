# Giovanni Serrano — Webflow Build Brief

**Project:** giovanniserrano.com — San Diego multifamily real estate advisor website
**Pages:** Home + 4 sub-pages (Invest, Scale, Develop, Sell)
**Goal:** Lead generation across four distinct audience segments
**Brand:** Per existing v4.0 brand guidelines (already in your possession)
**Files provided:** `index.html`, `invest.html`, `scale.html`, `develop.html`, `sell.html` — these are the **source of truth** for copy, structure, and section ordering. Rebuild semantically in Webflow rather than embedding raw HTML.

---

## TL;DR — 30-second version

- **5 pages**, all share the same nav + footer
- **Section order is intentional** (built around conversion logic) — preserve it
- **Build ~10 reusable components** in Webflow once, instance them across pages
- **3 CMS Collections** to scaffold: Testimonials, Case Studies (future), Blog (future)
- **Forms** on every page with **page-specific goal options** (see §7)
- **Section backgrounds alternate** between two cream tones plus occasional dark navy — preserve the rhythm
- **Animation: restrained.** This is an analytical brand, not a flashy one
- Mobile responsive is fully your call — the source HTML is desktop-first

---

## 1. PROJECT CONTEXT

**Audience segmentation drives everything.** The four sub-pages exist because Gio serves four distinct types of clients, each with different needs and conversion logic:

| Sub-page | Audience | What they're hiring for | Form CTA |
|----------|----------|------------------------|----------|
| **Invest** | First-time multifamily buyers (often house-hacking) | Help buying their first 2-4 unit property | "Get a free deal review" |
| **Scale** | Existing investors growing portfolio (4-12 unit acquisitions) | Institutional-grade underwriting on deals they're considering | "Request a full underwrite" |
| **Develop** | Homeowners with developable lots | Adding ADUs / units to property they already own | "Get a free lot review" |
| **Sell** | Homeowners selling (upgrading, downsizing, relocating, including PCS military) | Maximum exit value via developer-grade valuation | "Request a sell strategy session" |

**Brand positioning:** Analytical advisor, not a traditional agent. Gio's differentiation is financial modeling, development expertise, and binational regional knowledge. Voice: direct, declarative, no hype. Specific over general.

**Non-negotiable:** "San Diego" not "Southern California." This shows up consistently in copy.

---

## 2. SITE ARCHITECTURE

```
/                  index.html       (home — overview + about + portfolio)
/invest            invest.html      (first-time buyers)
/scale             scale.html       (scaling investors)
/develop           develop.html     (homeowners with land)
/sell              sell.html        (homeowners selling)
```

**Navigation (same on every page):**
- Logo (links to home)
- Services
- About
- Portfolio
- Sample Analysis
- Reviews
- Let's Talk (CTA button)

Sub-page nav links to home anchors (e.g., `index.html#about`). On rebuild, these become `/#about`. Anchor IDs to preserve: `#services`, `#about`, `#portfolio`, `#sample`, `#reviews`, `#contact`.

**Footer:** Same on every page. Contains: tagline, contact info (email, phone, DRE license #), nav links, copyright.

---

## 3. PAGE-BY-PAGE BREAKDOWN

Each page below shows: **conversion intent** (what the page is trying to accomplish), **section order** (do not reorder), and **page-specific notes**.

---

### HOME (`index.html`)

**Conversion intent:** Build trust → demonstrate breadth → route visitor to the appropriate sub-page or contact form. Visitor journey: WHO is this guy → WHAT does he do → HOW does he do it.

**Sections in order:**

1. **Hero** — headline, sub, primary CTA
2. **Services** — 4 cards (Invest / Scale / Develop / Sell), each links to its sub-page; 2x2 grid on desktop, single column on mobile
3. **About** — Gio's story, positioning ("real estate professional and developer — not just an agent"), milestones, credentials
4. **Portfolio** — academic and professional work behind the analysis (capstone, 14-unit underwrite, JV waterfalls, etc.)
5. **Sample Analysis** — North Park 4-unit proforma (the "How I Model a Deal" deliverable)
6. **Reviews** — currently a placeholder; will become CMS Collection when testimonials arrive
7. **Contact** — main contact form, goal options below
8. **Footer**

**Page notes:**
- The 4 service cards in section 2 are entry points to the sub-pages. They should be visually distinct from each other (different accent or hover state for each).
- The Sample Analysis (section 5) is the most visually complex component on the entire site. See §6 for anatomy.
- About section currently includes a base64-embedded photo. In Webflow, upload the photo as an asset and reference it normally.

---

### INVEST (`invest.html`)

**Conversion intent:** Educate first-time buyer on multifamily benefits → establish Gio's differentiation from a typical agent → convert via free deal review.

**Sections in order:**

1. **Hero** — page-specific eyebrow, headline, sub, meta row (3 items)
2. **Why Multifamily** — 4 benefit cards (vs single-family ownership)
3. **The Strategy** — house-hacking explainer with owner-occupied financing
4. **Why Work With Me** — 3 differentiator cards
5. **How I Model Your Deal** — 6-step proforma walkthrough
6. **Sample Analysis** — North Park 4-unit (same component as home)
7. **Inline CTA band** — full-width terracotta CTA
8. **How We Work Together** — 6-step engagement process
9. **Background** — dark section (DRE license, UCSD, family ops)
10. **FAQ** — common questions before engaging
11. **Contact form** — see §7 for goal options
12. **Related** — links to Scale, Develop, and Sell pages
13. **Footer**

---

### SCALE (`scale.html`)

**Conversion intent:** Differentiate from a typical multifamily broker → demonstrate underwriting rigor → convert via "underwrite my next deal" request.

**Sections in order:**

1. **Hero** — eyebrow, headline, sub, meta row
2. **The Framework** — 5-stage DCF analysis explainer
3. **Background** — dark section (capstone, 14-unit, JV waterfalls — credibility lands EARLY for this audience)
4. **When the Model Gets Updated** — 4-card grid on iteration
5. **Inline CTA band**
6. **Sensitivity & Risk** — 6-card grid
7. **Why Work With Me** — 4 differentiator cards
8. **How We Work Together** — 6-step engagement process (with fee structure note at end)
9. **Contact form**
10. **Related** — links to Invest, Develop, and Sell
11. **Footer**

**Page notes:**
- This audience is sophisticated — Background is intentionally placed EARLY (section 3) for fast credibility.
- The closing process section includes a paragraph about fee structure ("paid through the transaction, no separate retainer"). Preserve this — it answers an objection scaling investors have.

---

### DEVELOP (`develop.html`)

**Conversion intent:** Surface the unrealized value in the visitor's existing property → show concrete deliverable (Sample Lot Review) → convert via free lot review request. **Highest-converting page** if the visitor is a homeowner.

**Sections in order:**

1. **Hero** — eyebrow, headline, sub, meta row
2. **Early CTA band** — placed high because conversion intent is clear early
3. **Why Build** — 4 benefit cards
4. **What You Can Build** — 4 cards (3 paths + "why this is possible right now" with urgency anchor)
5. **The Refinance Play** — 4-step process explaining the cash-out refi strategy
6. **Sample Lot Review** — Mid-City lot mock-up (uses Sample Card component)
7. **Inline CTA band**
8. **Why Work With Me** — 3 differentiator cards
9. **The Six Stages** — full development process walkthrough
10. **The Team** — 6-card grid (architect, engineer, GC, lender, attorney, developer-me)
11. **Background** — dark section
12. **Contact form**
13. **Related** — links to Invest, Scale, and Sell
14. **Footer**

**Page notes:**
- Two CTAs (Early + Inline) is intentional — homeowners often have a clear intent early; we want to capture them before the dense process content.
- Sample Lot Review (section 6) uses the same component as the Sample Analysis on home/invest, but with different content (zoning + buildable units + indicative refi math).
- The "Why this is possible right now" card (section 4) contains an urgency anchor about CA legislative cycles. Preserve.

---

### SELL (`sell.html`)

**Conversion intent:** Reframe the seller's mental model — most agents price *backward* (comp-only); Gio prices *upward* using a developer's three-approach valuation. Convert via a free in-person sell strategy session.

**Sections in order:**

1. **Hero** — eyebrow, headline ("Most agents price backward. *I price upward.*"), sub, meta row
2. **The Strategy** — 4 cards (lot value / dual-audience marketing / defensible pricing / Military PCS math)
3. **How I Model Your Price** — 4 cards (Sales Comparison / Income Approach / Cost Approach / Highest-and-Best-Use Premium)
4. **The Process** — 5 stages with large editorial Lora numbers (84px desktop / 56px mobile)
5. **Background** — dark section ("The construction site and the spreadsheet, both.")
6. **Contact form** — see §7 for goal options
7. **Related** — links to Invest, Scale, and Develop
8. **Footer**

**Page notes:**
- The Military / PCS framing is **Sell-only** — do not propagate it to other pages' content.
- The Process section uses oversized italic Lora numbering (84px desktop, 56px mobile). Preserve the visual treatment — it's the spine of the page narratively.
- This page does NOT have a Sample Analysis component (Sample Card is used on Home/Invest/Develop only).
- Hero subhead is two sentences (not one) — preserve the period split.

---

## 4. COMPONENT LIBRARY (build once, reuse everywhere)

These patterns repeat across pages. Build them as Webflow Components:

### Navigation
- **Used on:** all 5 pages
- **Anatomy:** logo, 5 nav links, "Let's Talk" CTA button
- **Mobile:** hamburger menu under ~900px

### Footer
- **Used on:** all 5 pages
- **Anatomy:** tagline, 3 columns (contact, nav, legal), copyright row

### Sub-page hero
- **Used on:** Invest, Scale, Develop, Sell (home has its own hero variant)
- **Anatomy:**
  - Eyebrow row (small line + page tag like "01 · Invest — Your first multifamily")
  - Headline with `<em>` accent on the key phrase
  - Sub paragraph
  - Meta row with 3 items (Best For / Typical Property / Strategy)

### Section eyebrow
- **Used on:** every section heading throughout the site
- **Anatomy:** small horizontal line (terracotta) + caps label
- **Variants:** light (default), gold (for dark sections)

### Card grid (`.sp-cards`)
- **Used on:** all sub-pages, multiple times per page
- **Anatomy:** 2-column grid, each card has:
  - Accent number/letter top-left (terracotta — `A.`, `01.`, `·`)
  - Bold card title
  - Body paragraph (sometimes with `<strong>` highlights)
- **Mobile:** collapse to single column under ~768px

### Process steps (`.sp-process`)
- **Used on:** all sub-pages (the engagement process and 6-stages sections)
- **Anatomy:** numbered circle (1, 2, 3...) + step title + body paragraph, vertical stack

### Sample Card (most complex — see §6)
- **Used on:** Home (Sample Analysis), Invest (Sample Analysis), Develop (Sample Lot Review)

### Inline CTA band
- **Used on:** all sub-pages, sometimes twice per page
- **Anatomy:** full-width terracotta background, body text on left, CTA button on right
- **Mobile:** stack text and button vertically

### Dark background section
- **Used on:** all sub-pages (Background sections)
- **Anatomy:** navy background, gold eyebrow accent, lighter card backgrounds within

### FAQ accordion
- **Used on:** Invest (and possibly home in future)
- **Anatomy:** question (clickable) → expands to show answer
- **Notes:** Webflow's native accordion or custom interaction

### Contact form
- **Used on:** all 5 pages
- **Anatomy:** see §7 for fields and goal options per page

### Related sub-pages teaser
- **Used on:** all 4 sub-pages (each links to the other 3)
- **Anatomy:** 3 cards, each linking to a sub-page with title + brief description

---

## 5. SECTION BACKGROUND SYSTEM

Sections alternate between three background tones to create visual rhythm:

- **Canvas** (`#F4F1DE` warm cream) — primary
- **Bone** (slightly darker cream) — alternating
- **Dark navy** (`#3D405B`) — used sparingly for emphasis (Background sections, occasional accent)

**Pattern within a page:**
canvas → bone → canvas → bone → dark → canvas (etc.)

The HTML files have these explicitly assigned. Don't rearrange.

---

## 6. SAMPLE CARD ANATOMY

This is the most visually complex component on the site. It appears 3 times (home, Invest, Develop) with different content. Build it once as a flexible component.

```
┌─────────────────────────────────────────────────────────────┐
│ [HEADER ROW]                                                 │
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │ Sample · [Location] │    │       [Big number]       │   │
│  │ [Property type]     │    │   [Sub: terms / context] │   │
│  │ [details, year, sf] │    │                          │   │
│  └─────────────────────┘    └──────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ [TWO-COLUMN GRID]                                            │
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │ [Block title]       │    │ [Block title]            │   │
│  │                     │    │                          │   │
│  │ Label........ Value │    │ Label........ Value      │   │
│  │ Label........ Value │    │ Label........ Value      │   │
│  │ ─── (subtotal) ──── │    │ ─── (subtotal) ────      │   │
│  │ TOTAL ........ Value│    │ TOTAL ........ Value     │   │
│  └─────────────────────┘    └──────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ [METRICS ROW — 3 stats]                                      │
│                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │ Label   │    │ Label   │    │ Label   │                 │
│  │ BIG #   │    │ BIG #   │    │ BIG #   │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
├─────────────────────────────────────────────────────────────┤
│ [COMMENTARY BLOCK]                                           │
│                                                              │
│  Bordered box with title + body paragraph explaining what    │
│  the numbers mean. Includes inline emphasis (strong, em).    │
└─────────────────────────────────────────────────────────────┘
```

**Mobile:** the two-column grid in the body should stack vertically. Header row should also stack. Metrics row may need to wrap to 2x2 or stay 3-across with smaller text.

**Build approach in Webflow:** Make this a standalone component with content fields for each text element, then use it 3 times across pages with different text inputs.

---

## 7. CONTACT FORM SPECIFICATION

Every page has a contact form with these fields:

| Field | Type | Required |
|-------|------|----------|
| Name | text | yes |
| Email | email | yes |
| Phone | tel | recommended |
| Goal | select dropdown | yes (page-specific options below) |
| Message | textarea | optional |

### Goal options per page

**Home:**
- Buy my first duplex / triplex / fourplex
- Acquire a multifamily investment property
- Build units on property I already own
- Get a maximum-value exit strategy for my home
- Something else

**Invest:**
- Get a free deal review
- Discuss a property I'm considering
- Get pre-approval guidance
- Just exploring multifamily

**Scale:**
- Underwrite a specific property
- Build my acquisition criteria
- Source new deal flow
- Compare two opportunities side-by-side

**Develop:**
- Get a free lot review (what's buildable)
- Get a full feasibility study
- Discuss an ADU or garage conversion
- Discuss a 2-4 unit backyard build
- Discuss a larger infill project

**Sell:**
- Request a sell strategy session
- Talk through whether selling makes sense at all
- Get a three-approach valuation
- PCS / military relocation — sell vs. rent analysis
- Sell and trade up to multifamily
- Coordinate a 1031 exchange (investment property)
- Just exploring the market

### Form submission

- **Email destination:** giovanni@giovanniserrano.com
- **Phone (for SMS notification routing if used):** 619.617.8584
- **Recommended:** Webflow native forms with email notification + integrate Zapier/Make to push to a CRM if Gio adopts one. Alternatively, direct integration with a CRM like Follow Up Boss or Hubspot.

The form CTA button text varies per page — preserve the page-specific copy from the HTML files.

---

## 8. CMS COLLECTIONS

Three Collections to scaffold (build empty schema now, populate later):

### Testimonials
**Status:** Gio is gathering these.
**Schema:**
- Name (plain text)
- Role/Title (plain text, e.g., "First-time buyer, North Park" or "Investor, 12 units")
- Photo (image, optional)
- Quote (rich text)
- Page tag (multi-reference or option: All / Invest / Scale / Develop / Sell)
- Date received (date)

**Display logic:** The home page Reviews section shows testimonials tagged "All" or any. Each sub-page can show testimonials tagged with that page's segment, so visitors see relevant social proof.

### Case Studies (future)
**Status:** Not built yet, but worth scaffolding for future use.
**Schema:**
- Title
- Audience tag (Invest / Scale / Develop / Sell)
- Hero image
- Property type, location, scope
- Summary (rich text)
- Numbers/outcomes (rich text or structured fields)
- Date
- Featured (boolean)

### Blog/Insights (future)
**Status:** Not built but worth scaffolding for SEO and content marketing.
**Standard schema:** title, slug, hero image, excerpt, body (rich text), author (default Gio), publish date, category, featured.

---

## 9. RESPONSIVE DESIGN

The provided HTML is desktop-first and not mobile-optimized. **You have full discretion on responsive layouts.**

**Specific recommendations:**

| Element | Mobile behavior |
|---------|----------------|
| Sub-page hero | Stack meta items vertically |
| 2-up card grids | Single column under ~768px |
| Sample Card | Stack the 2-col body grid vertically; metrics row may wrap |
| Process steps | Keep vertical, tighten spacing |
| Nav | Hamburger under ~900px |
| CTA bands | Stack text + button vertically |
| Footer | Stack columns |

Brand colors and typography stay consistent across breakpoints.

---

## 10. ANIMATION & INTERACTIONS

Brand voice is restrained and analytical, not flashy. **Less is more.**

**Recommended:**
- Soft fade-in on section entry (subtle, not heavy)
- Hover states on cards: minor elevation or border color shift
- CTA buttons: slight darken on hover, optional arrow shift
- Smooth scroll on anchor links

**Avoid:**
- Heavy parallax
- Auto-playing animations or carousels
- Loud entrance animations
- Anything that makes the site feel "designed"

### ⚠️ Known issue to avoid

If you build any scroll-reveal animation using `IntersectionObserver` + `opacity: 0` defaults, opening the page locally (file://) can cause it to render blank. **Fix:** default to `opacity: 1` and add a `.visible` class via JS once the observer fires. (Not a problem on hosted sites, but worth noting if Gio ever wants to preview offline.)

---

## 11. SEO BASICS

Each page needs:
- Unique `<title>` tag
- Unique meta description
- Open Graph image and description for social sharing
- Proper H1/H2/H3 hierarchy (HTML files use these correctly — preserve)

### Suggested meta descriptions

| Page | Meta description |
|------|-----------------|
| Home | Giovanni Serrano — San Diego multifamily investment & development advisor. Buy, sell, invest, and develop with analytical underwriting. |
| Invest | Buying your first multifamily in San Diego? Get a full proforma on every property. Owner-occupied financing strategies, sensitivity analysis, and a model you can actually use. |
| Scale | Scaling your San Diego multifamily portfolio? Full 10-year DCF, sensitivity analysis, JV waterfall structuring on every deal you're considering. |
| Develop | Build on the property you already own — from one ADU to 10 units. Free lot review, full feasibility, end-to-end project management in San Diego. |
| Sell | Selling your San Diego home? Most agents price backward at recent comps. I price upward — three-approach valuation plus a check for ADU / SB 9 development upside on your lot. Free in-person strategy session. |

### Recommended additions
- Schema.org markup for `RealEstateAgent` on home page (with DRE license # in `identifier` field)
- Local business schema with San Diego service area
- FAQ schema on the Invest page (it has an FAQ section)

---

## 12. WHAT'S LOCKED VS. FLEXIBLE

### Locked (do not modify without client approval)
- All copy and headlines
- Section order on every page
- Tagline ("Move with intention.")
- Geographic specificity ("San Diego" not "Southern California")
- Positioning language ("real estate professional and developer — not just an agent")
- DRE license number (#02282434), contact info
- Goal options in contact forms

### Flexible (developer's discretion)
- Responsive breakpoints and mobile layouts
- Animation specifics and microinteractions
- Spacing/padding values within visual system
- Form integration approach (Webflow native vs CRM integration)
- CMS schema details (within the rough schema above)
- Image treatments when images are added
- Internal SEO refinement
- Schema markup additions

---

## 13. SUGGESTED IMPLEMENTATION ORDER

If it helps to phase the build, here's a recommended sequence:

**Phase 1 — Foundation (1-2 days)**
1. Set up Webflow project with brand styles (colors, fonts, type scale)
2. Build Nav and Footer Components
3. Build Section Eyebrow Component
4. Build Card Grid and Process Steps Components
5. Build Inline CTA Band Component

**Phase 2 — Home page (1 day)**
1. Hero
2. Services (4 cards in 2x2 grid linking to sub-pages — these need styling work)
3. About (with photo asset)
4. Portfolio
5. Sample Analysis (build the Sample Card Component here — it's the heaviest lift)
6. Reviews (placeholder bound to Testimonials Collection)
7. Contact form

**Phase 3 — Sub-pages (1-2 days each)**
1. Invest first (it has the FAQ accordion and the longest section list — good template)
2. Scale (similar pattern, simpler)
3. Develop (reuses Sample Card for Sample Lot Review)
4. Sell (no Sample Card; oversized editorial Lora numbering on Process — preserve treatment)

**Phase 4 — Forms & integrations (0.5 day)**
1. Wire up form submissions
2. Test goal-option logic per page
3. Test mobile

**Phase 5 — Polish (1 day)**
1. Responsive review
2. Animation/interaction pass
3. SEO meta + schema markup
4. QA across browsers

**Total estimate:** 6-8 working days for a full first-pass build.

---

## 14. ASSETS

**Provided in HTML files:**
- All copy (final)
- Color system as CSS variables (matches v4.0 brand guidelines)
- Section structure
- Lora Bold + Inter fonts (currently embedded as base64 — replace with Google Fonts in Webflow)
- One photo of Gio (currently embedded as base64 in About section — extract and re-upload to Webflow as a normal asset)

**Coming separately from Gio:**
- Logo files (if any beyond the wordmark)
- Additional photos (if any)
- Testimonials (when gathered)
- Future case study content
- Brand guidelines PDF v4.0 (already in your possession)

---

## 15. CONTACT

**Giovanni Serrano**
Multifamily Investment & Development Advisor
DRE #02282434

📧 giovanni@giovanniserrano.com
📞 619.617.8584

For questions during the build, reach out directly. Gio prefers concise, specific questions and gives short directive answers.

---

## 16. FINAL NOTES

- The five HTML files are the source of truth — when in doubt, the HTML is right.
- The brand guidelines are the source of truth for visual styling — when in doubt about color/font/spacing, brand guide is right.
- If those two ever conflict, brand guidelines win.
- Ask before changing copy or section order. Ask before adding any "stock" agent imagery or generic real estate iconography — this brand intentionally avoids those clichés.
- The site is meant to feel like Gio: analytical, direct, calm, confident. If a design choice would make it feel like a typical real estate agent website, it's probably wrong.

---

*Document version: Webflow build brief, final*
*Files: index.html, invest.html, scale.html, develop.html, sell.html.*

Archived alternate concepts are intentionally excluded from this handoff. Variant A lives in `deliver/giovanni-serrano/workflows/03-design/.tmp/final-design/_ignored/variant-a.html`, and the `_ignored/` folder must not be packaged, linked, or rebuilt in Webflow.
