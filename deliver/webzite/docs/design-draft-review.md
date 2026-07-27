# Design Draft Review — Webzite Studio Home (First Draft)

Date: 2026-07-17
Workflow: `04-design` · Path: Claude Design (coded HTML/CSS/JS)
Package: `workflows/04-design/.tmp/final-design/` (open `index.html`)
Screenshots: `workflows/04-design/.tmp/screenshots/`

## What was built

A self-contained, awwwards-caliber **home page** — the first application of Design System v2.0 to a real marketing surface. Dark editorial, brand tokens inherited verbatim, motion-led with a full reduced-motion fallback. The old site's "Strategy + Experience + Functionality = Profit" thesis is executed literally as the hero equation.

Positioning is **studio-of-one (hybrid)** as locked: "we" for the practice, Alejandro named as the accountable partner.

## Verification done

- `node --check` on JS: pass.
- All asset references resolve; all 20 JS `data-*` hooks present in HTML.
- Rendered via headless Chrome / CDP (`.tmp/shot.mjs`): desktop 1440 (animated + reduced-motion) and mobile — full page, all sections styled and laid out.
- Reduced-motion path confirmed (dust/grain off, reveals instant, no blank content).
- Progressive enhancement: content is visible without JS (`html.js` guard); a failed script never blanks the page.
- Per-page pricing calculator computes correctly ($400/2d, $2,000/10d, $3,200/16d).

## Decisions the reviewer should confirm

1. **Pricing presentation.** The old public packages ($400 / $1,500 / $3,000+) contradict the canonical `sales/PRICING_TIMELINE_RULES.md` (a 5-page site is $2,000, not $1,500) and were unresolved in `open-questions.md`. This draft publishes the **canonical per-page rate** with a live calculator instead of the stale packages. Confirm this is how we want to show pricing publicly, or switch to "starting at / qualify on the call."
2. **Proof claims.** Work-row tags use only facts found in the site inventory (Mused PageSpeed 100, Ivy RX 80 posts/160 URLs, Verde WordPress 30/30, industries, locations). No conversion percentages were invented. Confirm which outcomes we're cleared to state publicly, and which case studies can show client names/links.
3. **Case-study art.** Fresh cover art is pending; hover previews currently use the approved 3D brand marks as honest stand-ins with a visible "in production" note. Commission real covers before launch.
4. **Michael Sjosten** row has no live link in the inventory — add the URL or drop the row.

## Debt fixed from the old site

No placeholder nav text; one consistent nav + footer; single **2026** copyright; no Upwork-ToS "Terms" link; corrected copy (`portfolio`, `WordPress`, `Webflow`); one canonical "Book a call" path; contradictory/duplicated CMS result bullets dropped.

## Not in this pass (by decision / environment)

- 3D scroll frame-sequence hero — deferred enhancement.
- Figma conversion (Phase 2A step 9) and Vercel review deploy (step 10) — next actions, not run headless here.
- Webflow target — undecided; ships as portable design HTML.

## Version Control
- Follows [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md). Branch: `deliver/webzite-<description>`.
- Package HTML/CSS/JS is committable; brand media stays gitignored and VPS-synced.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
