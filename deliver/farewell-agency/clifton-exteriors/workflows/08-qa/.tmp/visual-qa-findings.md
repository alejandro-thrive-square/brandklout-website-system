# Clifton Redesign — Visual QA Findings (Playwright screenshots, 2026-07-10)

Method: headless Playwright, 1440px, auto-scrolled to fire IntersectionObserver reveals, full-page PNGs of 11 published pages → analyzed directly. Shots in `08-qa/.tmp/shots/`.

## PASS (render great)
- **Service pages** (roofing analyzed in full; doors verified live earlier; siding/gutters same template): tall Services Hero + badges, financing, invite, upgrades (roofing 4 cards, siding/gutters 3), curb, portfolio marquee, Confidence (roofing "10 Year Craftsmanship Warranty"), pricing (roofing 3 features/tier), process type-marquee, FAQ, reviews, contact, sunshine. All service-specific content correct.
- **Process Timeline** (our-process): sticky intro, red scroll-progress rail, italic 01–10 numerals + dots turn red on reveal, correct copy. Excellent.
- **Feature Split** (our-process "Setting The Right Expectations", about-us About/Mission): renders well.
- **Media Grid** (media): proper band, real YouTube thumbnails + play buttons, 2×2.
- **Thank-You Hero** (testimonials): dark band, em-accent H1, blockquote, both review buttons.
- **DEDUP-RISK sections all PASS**: media video-grid + testimonials thank-you hero (deduped roots `section_fin-partners`/`section_form-panel`) render as correct full bands (bg, padding, radius) — the paste dedup did NOT break them.
- Reviews wall, CTA bands, Footer: consistent and correct everywhere.

## BUGS TO FIX
1. **[HIGH] Financing Partners — GreenSky (light "is--paper") card text near-invisible.** Light text on the light card background; the SVC dark card is fine. Root cause: the converter flattened per-class styles and dropped the combo-descendant color overrides (`.finpart__card.is--paper .finpart__offer{color:dark}` can't map to a flat Webflow class). Fix: give the light-card text elements (partner-tag, offer "We Have Financing", terms/body) an explicit dark color in the component definition (distinct class or element style), leaving the dark SVC card's white text intact.

2. **[MEDIUM] Page Header hero renders weak/tiny** on the lighter pages that reuse the generic Relume `Section / Page Header` (our-process, media, financing, about-us): the H1 renders at ~body size, not hero scale, and looks cramped under the nav. Service pages don't have this (they use the tall Services Hero). NOT the nav's fault (confirmed on our-process which already has the mega-nav). Fix options: (a) bump the Page Header heading style / add padding+min-height, or (b) swap these heroes to a lighter proper hero. Recommend (a) — style the Page Header component once, all instances inherit.

## KNOWN / SEPARATE (already tracked)
- **Old navbar looks broken** on non-mega-nav pages: broken/missing logo (empty circle), two "BUTTON BUTTON" placeholder buttons, lorem dropdowns, overlaps the hero. our-process/roofing show a clean nav. → mega-nav rollout (finalize) fixes all of it. Higher priority than "cosmetic" — it looks broken to a visitor.
- **siding/gutters show windows photos**; **about-us Badge Wall tiles empty** → asset uploads.
- **JS PAGEERROR** `Cannot read properties of null (reading 'addEventListener')` — ROOT CAUSE FOUND: it fires on exactly the OLD-navbar pages (media, testimonials, financing, about-us, siding = 0 mega-nav markers) and never on mega-nav pages. A nav script queries a mega-nav element absent on old-navbar pages. **The mega-nav rollout fixes this + the broken navbar visuals + lorem dropdowns together** (one root cause).

## FIXED THIS PASS
- **GreenSky card contrast** — made `finpart__offer/terms/partner-tag` inherit color; set `finpart__card` color light (#faf9f7) + `is--paper` combo color dark (#121c32). SVC dark card = light text, GreenSky white card = dark text. Republished.

## Per-page verdict
| Page | Verdict |
|---|---|
| home | PASS (baseline) |
| windows | PASS (reference) |
| doors | PASS |
| roofing | PASS |
| siding | PASS body (windows photos; roofing-artifact pricing bullets pending) + JS error |
| gutters | PASS body (windows photos) |
| our-process | PASS except weak Page Header hero |
| testimonials | PASS (thank-you band great); old navbar broken |
| media | PASS (media grid great); weak Page Header hero; old navbar |
| financing | GreenSky card contrast BUG; weak Page Header hero |
| about-us | PASS (splits + badge wall); weak Page Header hero; empty badges |

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
