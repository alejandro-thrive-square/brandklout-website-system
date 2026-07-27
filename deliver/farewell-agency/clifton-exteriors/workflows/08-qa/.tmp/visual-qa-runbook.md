# Clifton Exteriors — Visual QA Runbook (Claude-in-Chrome, focused tab)

**For:** the Claude Chrome extension on real logged-in Chrome. **Site:** https://clifton-exteriors-lutum.webflow.io (published staging).

## Rules
- **One tab, focused, foreground.** Background tabs freeze CSS transitions, IntersectionObserver reveals, and marquees — a "broken animation" on a background tab is a false alarm. Bring each page to the front and scroll it slowly top→bottom before judging motion.
- Test at **desktop width first** (~1440px), then repeat the 3 flagged-risk pages at **mobile** (~390px).
- Hard-refresh each page (Ctrl+Shift+R) so you see the latest publish, not cache.
- For each page, report: PASS, or a bulleted list of issues with section name + what's wrong + a screenshot.

## KNOWN / EXPECTED — do NOT report these as bugs
- **Old navbar with "Category One–Five" + lorem dropdown cards** on most pages (mega-nav rollout is pending) — expect it everywhere except home/windows/our-process/gutters. Just note which pages still have the old navbar.
- **siding & gutters show windows photos** (hero bg, invite/curb, portfolio) — asset upload pending.
- **about-us Badge Wall tiles are empty/blank** (13 logos not uploaded yet).
- **testimonials**: a background video may be hotlinked from the old WP host (re-host pending).
- **siding pricing bullets** may read "shingles"-ish (roofing-copy artifact) — content pass pending.

## TOP-PRIORITY CHECK (paste-dedup risk) — do this first
On paste, Webflow merged section-root classes that had identical definitions. Confirm these 3 sections still render as proper full-width bands (correct background color, vertical padding, 1rem corner radius, not visually collapsed/unstyled):
1. **media** page → the video grid section (root class became `section_fin-partners`).
2. **contact/employment** → the "Or Get In Touch Directly" section (root became `section_fin-partners`).
3. **testimonials** → the Thank-You hero (dark band; root became `section_form-panel`).
If any of these looks unstyled (full-bleed white, no padding, no radius) → report it; that's the one thing the dedup could have broken.

## Per-page checklist

### 1. /  (home) — BUILT earlier, baseline
Confirm hero, services carousels, reviews, footer all render. Baseline for "what good looks like."

### 2. /windows — design reference
Hero **word-by-word roll-up reveal** on the H2 (masked words rising) should fire on scroll-in. Portfolio **draggable 2-row marquee** drifts opposite directions; process band has an **oversized type marquee** behind it. Pricing 3 tiers, 2 features each. FAQ accordion opens.

### 3. /doors
- Hero H2 "Welcome Loved Ones Into Your Home With **Brand New Doors**" — red em-accent on the last words, word-reveal fires.
- Upgrades = **5 cards** (doors is the 5-item page).
- Pricing = door prices ($2.8-5K / $5.5-10K / $7.5-18K), 2 features each.
- Portfolio marquee shows door photos (real assets — should NOT be windows).
- Reviews wall present between FAQ and contact. Closing band "A Door That Says Welcome Home".

### 4. /roofing
- Hero shows the **certification paragraph** (GAF / CertainTeed line) under the subheading — confirm it's visible (Cert Visible=true).
- Upgrades = 4 cards ("Custom Designer Shingles", "Skylights", "Rotted or FRT Plywood Replacement", "Steep Slope").
- Confidence card 1 says **"10 Year Craftsmanship Warranty"** (not Lifetime).
- Pricing = **3 features per tier** (roofing is the 3-feature page) — confirm the 3rd bullet shows.
- Sunshine closing "Put A Roof You Can Trust Over Your Family".

### 5. /siding
- Upgrades = **3 cards** (Thicker Panel Design / Insulated Siding / Darker Colors) — confirm only 3 show (cards 4&5 hidden, no empty gaps).
- Pricing $8-14K / $16-24K / $28-50K+.
- Sunshine "A Brand New Exterior For Your Home". (Photos = windows, expected.)

### 6. /gutters
- Upgrades = **3 cards** (Custom Colors / Oversize Gutters & Downspouts / Leaf Protection).
- Pricing $1-1.5K / $2-3.5K / $4-10K+, 3 features.
- Sunshine "Small Details Make A Big Difference". (Photos = windows, expected.)

### 7. /our-process
- Hero "Our Process".
- **Process Timeline**: sticky left intro, a vertical rail whose **red progress line fills as you scroll**, and each step's big italic numeral + dot turns red as it enters view. 10 steps, correct copy.
- Feature Split "Setting The Right Expectations". Reviews. CTA "Start Your Exterior Renovation Here!".

### 8. /testimonials
- **Thank-You hero** (dark band): logo, H1 "Thank You For Your Review!", italic blockquote, two buttons (Leave a Google review / Leave a Facebook review) — click each opens the right external URL in a new tab.
- Reviews wall. CTA "Building Relationships One Home At A Time".

### 9. /media
- Hero "Our Media Center".
- **Media Grid**: 2×2 tiles with YouTube thumbnails + play button; **click a tile → it loads/plays the embedded video** in place. Hover scales the thumb. 4 videos.
- Reviews. CTA "Make Your Home The Talk Of The Neighborhood".

### 10. /financing
- Hero "Finance Your Project".
- **Financing Partners**: benefits trio (Apply Online / Quick Response Time / Financing Options), then SVC card ("No interest if paid in full in 6 months", Apply Now → apply.svcfin.com) + GreenSky card (Learn More → projects.greensky.com). Confirm both external links work.
- Reviews. CTA "Your Home Built To Perfection".

### 11. /about-us
- Hero "About Clifton Exteriors, LLC".
- Two Feature Splits: "About Clifton Exteriors" (image left) + "Our Mission" (image right) — confirm the two splits mirror each other.
- Trust Bar. **Badge Wall** (marquee scrolls; tiles empty — expected). Reviews. CTA "We Are Here To Take Care Of You".

## Global (every page)
- Footer renders with correct contact info + columns.
- No raw `[object Object]`, no visible `undefined`, no leftover "This is a heading / your headline" in the BODY (nav lorem excepted).
- Reduced-motion: not required, but if your OS has it on, reveals should show content immediately (not stay invisible).

## Report format
Per page: `PASS` or issues. End with: (a) which pages still have the old navbar, (b) the 3 dedup-risk sections PASS/FAIL, (c) any animation that didn't fire on a focused tab.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
