# Portfolio CMS Database: Airtable Schema & Data

This document provides the structured database schema and the raw data extracted from your portfolio design. It is optimized for an Airtable to Webflow CMS integration, keeping your Client-First class structures and component mappings in mind.

## Vercel Preview Integration

The approved static preview in `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-design/` includes an Airtable-backed portfolio renderer for the `index.html` portfolio section.

### Runtime Files
- `api/portfolio.js` is the Vercel serverless function that fetches Airtable records server-side.
- `index.html` calls `/api/portfolio` and renders the featured project, featured tags, and grouped project cards into stable portfolio containers.

### Required Vercel Environment Variables
- `AIRTABLE_TOKEN` — Personal Access Token with `data.records:read` access to this base.
- `AIRTABLE_BASE_ID` — Airtable base ID, not the base display name. It starts with `app...`.
- `AIRTABLE_PROJECTS_TABLE` — optional; defaults to `projects`.
- `AIRTABLE_CATEGORIES_TABLE` — optional; set this only when using a separate categories table for linked category-name sorting.

### API Output Shape
- `featured`: the first project with `Is Featured` checked.
- `groups`: non-featured projects grouped by category using the linked `Categories` records and sorted by `Categories.Sort Order`.
- `generatedAt`: ISO timestamp for debugging cache freshness.

### Cache Behavior
- The Vercel API route sends `Cache-Control: no-store`.
- The browser request uses `{ cache: 'no-store' }`.
- Airtable edits should show on the next page reload after deployment of this integration.

***

## Table 1: Categories (CMS Collection 1)
Create this table first so you can link your projects to it. 

### Fields
* **Category Name** (Primary Field - Single Line Text)
* **Sort Order** (Number)

### Data (Copy/Paste into Airtable)
| Category Name | Sort Order |
| :--- | :--- |
| Featured Capstone | 1 |
| Acquisition & Development Underwriting | 2 |
| Advanced Finance — Case Studies | 3 |
| Planning & Site Analysis | 4 |

***

## Table 2: Projects (CMS Collection 2)
This table holds the dynamic content for each bento card and the main featured section.

### Fields
* **Project Name** (Primary Field - Single Line Text)
* **Subtitle** (Single Line Text)
* **Overline Type** (Single Line Text) *(e.g., "VALUE-ADD RESIDENTIAL")*
* **Category** (Link to another record -> "Categories" Table)
* **Description** (Long Text)
* **Tags** (Multiple Select)
* **Is Featured** (Checkbox)
* *-- Below fields are specific to the Featured Project layout --*
* **Featured Context** (Single Line Text) *(e.g., "SENIOR CAPSTONE...")*
* **Featured Metric 1 - Label** (Single Line Text) *(e.g., "HOLD")*
* **Featured Metric 1 - Value** (Single Line Text) *(e.g., "10 yr")*
* **Featured Metric 2 - Label** (Single Line Text)
* **Featured Metric 2 - Value** (Single Line Text)
* **Featured Metric 3 - Label** (Single Line Text)
* **Featured Metric 3 - Value** (Single Line Text)
* **Featured Metric 4 - Label** (Single Line Text)
* **Featured Metric 4 - Value** (Single Line Text)
* **Analysis & Design List** (Rich Text)
* **Financial & Deliverables List** (Rich Text)

### Data (Copy/Paste into Airtable)

*(Note: Ensure your Multiple Select tags are comma-separated when pasting so Airtable creates the pills automatically).*

| Project Name | Subtitle | Overline Type | Category | Description | Tags | Is Featured | Featured Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 4855 College Ave | 3.05-Acre Multifamily Development | Full Offering Memorandum · presented to industry judges | Featured Capstone | A complete Offering Memorandum for a 3.05-acre site zoned single-family, with proposed rezone to multifamily (RS-1-7 to RM-4-10). Every stage of development evaluation — from zoning and demographics through proforma and exit — in the same format institutional firms use to evaluate where to commit millions of dollars. <br><br>Presented at UCSD Urban Planning EXPO with a charrette board and an investor video pitch. | Offering Memorandum, 3.05 Acres, Multifamily, College Area, Rezone, 10-Yr Proforma, Investor Pitch, CoStar | TRUE | SENIOR CAPSTONE · UCSD URBAN PLANNING EXPO |
| 6966 Amherst St | 14-Unit Acquisition | VALUE-ADD RESIDENTIAL | Acquisition & Development Underwriting | Value-add acquisition with 10-year proforma, CapEx schedule, and exit modeling. 6% cash-on-cash, 14% levered return, 12% IRR, 2x equity multiple. | 14 Units, IRR & NPV, 10-Yr Hold | FALSE | |
| 4616 El Cajon Blvd | Strip Center | COMMERCIAL REPOSITIONING | Acquisition & Development Underwriting | Repositioning analysis on a Transit Priority Area asset. NNN vs. full-service comparison, 60/40 JV structure, 16% IRR investor hurdle. | Retail/Office, 16% IRR, JV | FALSE | |
| College Area | Growth Projections to 2035 | DEMOGRAPHICS | Acquisition & Development Underwriting | Population, income, rent, and tenure projections benchmarked against San Diego County and the competitive submarket. | Census, CAGR | FALSE | |
| College Area | Residential & Commercial | MARKET ANALYSIS | Acquisition & Development Underwriting | Vacancy, rents, absorption, pipeline, comps, and forecasting using CoStar institutional data. | CoStar, Comps | FALSE | |
| 80-Lot Subdivision | Phased Feasibility & Monthly Cash Flow | GROUND-UP DEVELOPMENT | Acquisition & Development Underwriting | $3.7M land basis, $68K per finished lot, $150/SF construction, 3-lot/month absorption. 10% gross margin, 18% IRR target. Phased build vs. single-phase impact analysis on returns and capital deployment. | 80 Lots, Monthly CF, 18% IRR, Phasing | FALSE | |
| 311-Unit Downtown SD Highrise | | HIGHRISE PROFORMA | Advanced Finance — Case Studies | Full development proforma with JV waterfall: 10% preferred return, 60/40 GP/LP split, refinance and disposition modeling. | 311 Units, Waterfall | FALSE | |
| 280-Unit Condo Conversion | | DISTRESSED REPOSITIONING | Advanced Finance — Case Studies | Audited financials review and rental pivot analysis on a stalled condo project. Equity recovery scenarios. | 280 Units, Workout | FALSE | |
| 256-Bed Student Housing | | JOINT VENTURE | Advanced Finance — Case Studies | JV structure: 8% preferred dividend, 50/50 split post-pref, capital recovery sequencing. | JV, 50/50 | FALSE | |
| 925 B St — 64K SF Downtown Office | | OFFICE JV | Advanced Finance — Case Studies | Acquisition JV: GP/LP 20/80 split, 10-year hold modeling, NOI sensitivity. | 64K SF, 10-Yr Hold | FALSE | |
| 2,000-Acre Land Recap | | LAND RECAPITALIZATION | Advanced Finance — Case Studies | Distressed recap: $4M new equity, subordinated debt, IRR hurdles, option payments to landowner. | Recap, $4M Equity | FALSE | |
| 210-Unit Condo — 4 Scenarios | | AFFORDABLE HOUSING | Advanced Finance — Case Studies | Market-rate, AMI-restricted, subsidy, and TIF financing scenarios — comparative IRR and feasibility. | AMI, TIF | FALSE | |
| LQ & Shift-Share Analysis | | ECONOMIC ANALYSIS | Planning & Site Analysis | NAICS-based economic base analysis for a San Diego submarket, with planning memo recommendations. | LQ, Shift-Share | FALSE | |
| Pacific Beach — Windshield Survey | | SITE ANALYSIS | Planning & Site Analysis | Field survey with TOD analysis, neighborhood resource mapping, and development opportunity identification. | TOD, Field Survey | FALSE | |
| San Diego Site — Investor-Ready Concept| | FEASIBILITY | Planning & Site Analysis | Full feasibility analysis on an active San Diego site — design vision, proforma, and presentation evaluated by industry judges. | Feasibility, Proforma | FALSE | |

***

## Table 3: Featured Project Details (Extension)
*To keep the main copy/paste block clean, here are the detailed Rich Text and Metric fields for the single **Featured Project (4855 College Ave)** row.*

**Metrics:**
* **Featured Metric 1 - Label:** HOLD | **Value:** 10 yr
* **Featured Metric 2 - Label:** PAGES | **Value:** 30
* **Featured Metric 3 - Label:** SITE | **Value:** 3.05 ac
* **Featured Metric 4 - Label:** REZONE | **Value:** RM-4-10

**Analysis & Design List (Rich Text / Markdown):**
* Land use & zoning (RS-1-7 to RM-4-10 rezone)
* Demographics with projections through 2035
* Market analysis — vacancy, rents, absorption, comps (CoStar)
* Development program, site plan, parking
* Design vision, massing, amenities, tenant mix
* Community benefits & SWOT analysis

**Financial & Deliverables List (Rich Text / Markdown):**
* 10-year proforma with full cash flow
* IRR, cash-on-cash, equity multiple, levered returns
* Financing assumptions, cost basis, cap rates
* Marketing & branding identity
* 30-page investor-ready Offering Memorandum
* EXPO charrette board + investor video pitch
