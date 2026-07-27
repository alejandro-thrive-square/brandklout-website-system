# Design ↔ Staging Comparison (acceptance gate) — 2026-07-10

Method: rendered each local design page (`04-design/.tmp/final-design/page-*.html`) on a localhost server + full-page screenshot (auto-scrolled), vs the published staging page screenshot, both at 1440px. Shots: `08-qa/.tmp/design-shots/` (design) and `08-qa/.tmp/shots/` (staging).

Only 4 pages have a local design source: **windows, doors, roofing, siding**. All other staging pages (gutters, our-process, testimonials, media, financing, about-us, home, + form/content pages) have NO local design file — they were built to content spec, so their gate is content-correctness (covered in visual-qa-findings.md), not pixel-match.

## Verdict per page

| Page | Design ↔ Staging | Notes |
|---|---|---|
| **windows** | ✅ MATCH | Reference build. Hero word-reveal, financing, invite, 4 upgrades (Low E Argon/Internal Grids/Tempered Glass/Color Options), curb, portfolio, Lifetime confidence, pricing $5-8.5K/$10-17K/$20-40K, process, 6-item FAQ, contact, "Invite The Sunshine Into Your Home". |
| **doors** | ✅ MATCH | Hero "Welcome Loved Ones...Brand New Doors", 5 upgrades, "Gift Yourself Peace Of Mind", door portfolio, pricing $2.8-5K/$5.5-10K/$7.5-18K, "A Door That Says Welcome Home". Staging ALSO has the reviews wall (design omitted it) — improvement. |
| **roofing** | ✅ MATCH | Hero + cert line, 4 upgrades, "Add Character...", roof portfolio, "10 Year" confidence, pricing $5-7.5K/$8-18K/$20-50K+ (3 features), "Put A Roof You Can Trust Over Your Family". Only delta: FAQ heading word-order ("Roofing Replacement & Installation" vs design "Roofing Installation & Replacement"). |
| **siding** | ⚠️ INTENTIONAL DIVERGENCE — staging is CORRECT, design is DEFECTIVE | The design file is a roofing-derived draft: it shows roofing upgrade cards (Custom Designer Shingles/Skylights/Rotted FRT Plywood/Steep Slope), roofing prices ($5-7.5K…), a roofing cert line, and broken "Put A Siding You Can Trust". STAGING correctly shows genuine siding content: 3 siding upgrades (Thicker Panel Design/Insulated Siding/Darker Colors), Lifetime warranty, siding pricing $8-14K/$16-24K/$28-50K+, "A Brand New Exterior For Your Home". → **Do NOT match the design here; fix the design FILE to match staging.** One residual staging artifact: siding pricing feature bullets still say "high-definition shingles" (roofing copy) — needs true siding bullets from oldsite. |

## Cross-page deltas (all pages, expected / tracked)
- Staging includes **nav + footer**; design files are body-only → not a mismatch.
- **Nav**: broken on old-navbar pages (missing logo, "BUTTON BUTTON", lorem dropdowns) → mega-nav rollout pending. This is the main visual gap vs a finished site.
- **Images**: windows/doors/roofing staging = real per-service photos (match design). siding/gutters staging = substitute/windows photos (asset upload pending) → image mismatch until uploaded.

## Actions to reach full design-parity acceptance
1. **Fix siding**: correct the siding design FILE (roofing artifacts → true siding), and clean the staging siding pricing bullets ("high-definition shingles" → siding). Source verbatim siding bullets from oldsite/siding.html.
2. **Mega-nav rollout** → all pages (removes the biggest design-vs-staging visual gap + the nav JS error).
3. **Asset uploads** → siding/gutters photos, badge-wall 13 logos, thank-you + SVC logos (image parity).
4. Optional: generate design files for the pages that lack them (gutters + the new-component pages) if pixel-match acceptance is wanted there too.

## Bottom line
Of the 4 pages with a design source: **3 match (windows, doors, roofing)** and **1 (siding) correctly diverges because the design itself is wrong**. The remaining gaps to a "finished" look are the shared nav (rollout) and the missing image assets — both already on the finalize list.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
