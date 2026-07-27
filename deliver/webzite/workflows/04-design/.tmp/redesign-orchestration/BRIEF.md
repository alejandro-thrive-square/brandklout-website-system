# Webzite Homepage Redesign — Orchestration Brief

**Advisor:** Fable (Claude) · **Executors (race):** Sonnet 5 · Codex 5.5 · Opus 4.8
**Task:** Redesign the Webzite Studio own-site **homepage**. The current version is not good enough. Reach award-site quality by borrowing **Isadora Digital Agency's composition and motion** — while staying fully inside the Webzite brand (dark, Inter-only, yellow/blue).

---

## 0. How this race works
Three executors each build a **complete, independent** homepage redesign from this **same brief**, each in its **own Orca worktree**. Do **not** collaborate or converge — diverge in execution and concept. The advisor (Fable) then reviews all three against the judging criteria (§8) and recommends a winner (and may graft the best ideas from the runners-up).

---

## 1. Why the current design fails (diagnosis — do not repeat these mistakes)
Current package: `deliver/webzite/workflows/04-design/.tmp/final-design/` (index.html + css/home.css + js/home.js). It is a coherent brand specimen used as a **hard constraint**, and it hard-copies the tokens under a self-imposed "inherit verbatim, add nothing" rule. Three failures:
1. **Ambient-noise motion.** An always-on `initDust` particle canvas + `grain` overlay run a constant rAF loop under the whole page — a "haze" that competes for GPU budget and muddies any art-directed motion. **Remove it.**
2. **Fragile hero.** A 300svh pinned hero driven by a manual `requestAnimationFrame` lerp (`--hp`) — heavy scroll-jacking, fragile. **Replace with a hardened approach.**
3. **Generic display voice.** "Display" is Inter 800 + tight tracking only, applied timidly. Award feel must come from **dramatic scale, layout, and choreographed motion** (see §4).

---

## 2. Hard constraints — DO NOT VIOLATE
- **Typography: Inter (400–800) + JetBrains Mono ONLY.** No serif, no Fraunces, no third family. (This was tried and deliberately rejected — do not reintroduce serif.) Display = Inter 800, huge scale, tight negative tracking.
- **Palette: dark-first Webzite brand.** Canvas `--wz-ink #111114` / `--wz-ink-2 #19191f`. Text `#ffffff` + white-alpha (`--wz-muted rgba(255,255,255,.6)`, `--wz-faint ~.55`, `--wz-line rgba(255,255,255,.14)`). Accents: **`--wz-yellow #ffec46`** (single primary action/emphasis accent), `--wz-blue #466fff`, `--wz-mist #dce6ff`; `--wz-red #ff4646` reserved. **DO NOT adopt Isadora's cream/purple/coral colors** — borrow its *composition and motion*, not its color world.
- **Positioning & copy (keep, source from current design):** studio-of-one angle ("one senior partner, accountable end to end"; "we" for the practice, Alejandro named for the relationship); the thesis equation **"Strategy + Experience + Function = Profit"** (result in yellow); "A pretty site is a cost. A profitable one is an asset."; tagline **"Webflow Websites Engineered for Profit."**; proof **35+ projects / 4+ years / 25+ clients / 100 PageSpeed**, **4.5★ on Upwork**; three verified named testimonials (Ivy RX etc. from current design); honest project tags (inventory facts only, no invented metrics).
- **Pricing (canonical — from `sales/PRICING_TIMELINE_RULES.md`):** $200/page design + $200/page dev = **$400/page, 2 working days/page**. Calculator points: 1pg $400/2d · 5pg $2,000/10d · 8pg $3,200/16d. Do not resurrect old public packages.
- **Deliverable:** a coded **HTML/CSS/JS design package** (NOT a Webflow paste). Opens offline in a browser. CDN libraries allowed.
- **Accessibility:** WCAG AA contrast; **honor `prefers-reduced-motion`** — all scroll/particle/scrub motion must degrade to a clean static/near-static experience.

---

## 3. Remove
- The `initDust` particle canvas and the `grain` overlay (ambient haze). Motion is art-directed only.
- The manual-lerp 300svh pinned hero, if you keep a pinned hero use a hardened engine (GSAP ScrollTrigger / Lenis).

---

## 4. Borrow from Isadora — COMPOSITION & MOTION ONLY
Reference capture (local, read-only): `manage/browser-tools/playwright-browser/.tmp/style-capture-isadora-final/` — best overview in `contact-sheets/contact-sheet-001.png … 029.png`, full scroll in `video.webm`, source in `code/resources/`. **Translate these ideas into the dark Webzite palette; do not copy Isadora's colors or serif type.**

- **Full-viewport stacked sections, each its own color-field.** Achieve the "field switch" with *variations of the dark brand* (e.g. `#111114` ↔ `#19191f` ↔ a near-black tinted with blue/yellow at low alpha, plus one bold accent block), NOT warm colors.
- **Asymmetric two-column composition:** oversized statement left, media/mockup right, vertically offset. Generous negative space.
- **Oversized sentence-case display headlines.** Isadora uses 60px serif; you use **Inter 800** at `clamp()` up to ~120–140px, tight tracking, sentence case. Uppercase reserved for small mono labels/eyebrows (JetBrains Mono, letter-spacing .08–.16em).
- **Services** (Design / Build / Grow) as stacked hairline rows with accent bullet dots and small mono descriptors; sticky media well that swaps on hover/focus.
- **2×2 oversized stat grid** with **count-up on scroll** (35+ / 4+ / 25+ / 100).
- **Motion toolkit (allowed):** GSAP + ScrollTrigger for pinned/scrubbed section reveals; **Lenis** for smooth scroll; count-up stats; a horizontal capability/keyword or client **marquee with play/pause**; **animated gradient backgrounds within the brand palette**; a tasteful **custom cursor**; reveals at ~`.35s`–`.8s` on `cubic-bezier(.5,1,.89,1)` / expo-out `cubic-bezier(.19,1,.22,1)`; FOUC guard / intro reveal acceptable. Everything must scrub smoothly and cost little.
- **Rounded pill CTAs**, hairline dividers, editorial rhythm.

---

## 5. Required sections (parity with current — improve the execution)
1. **Nav** — brand mark; Approach / Work / Capabilities / Pricing; "Book a call" CTA; mobile drawer.
2. **Hero** — the equation thesis + studio-of-one lede + dual CTA + a hero visual (case-reel / device / motion). Use the three brand 3D renders (`assets/3d/`) honestly as placeholder covers; state real covers are pending.
3. **Capability marquee.**
4. **Manifesto + Services** — profit thesis, then Design/Build/Grow rows with the media well.
5. **Selected work** — offset editorial grid, 6 projects (Ivy RX, Excellent Facets, Wealth Group, Verde Energy, Mused, Michael Sjosten); 3D renders as honest stand-in covers.
6. **Statement + Stats** — scroll word-fill prose + 2×2 count-ups.
7. **Client voice** — three verified testimonials (ruled table or a stronger treatment) + the 4.5★ Upwork link.
8. **Engagement / Pricing** — two rate cards + the cost/timeline calculator (1/5/8 pages).
9. **Contact** — closing display headline + CTA + email / Upwork / response micro-columns.
10. **Footer** — white wordmark lockup, © 2026, in-page nav.

---

## 6. Design-system evolution (allowed & encouraged)
You MAY add or modify tokens beyond v2.0 — **especially motion tokens, new dark ink/color-field shades, and layout tokens**. Record every addition/change in `tokens-delta.md` so the winner's changes can be promoted back into `manage/brand-assets/design-system/`. You may **NOT** add fonts or warm colors (§2).

---

## 7. Deliverable format (each executor)
Write your package to **`deliver/webzite/workflows/04-design/.tmp/redesign/`** in YOUR worktree:
- `index.html`, `css/`, `js/`, `assets/` (reuse existing assets from the current design's `assets/`).
- `tokens-delta.md` — every token you added or changed vs v2.0, with values and rationale.
- `NOTES.md` — your concept in ≤5 bullets: the ONE idea that makes this award-caliber; the key motion moments; what you removed; the biggest risk.
- Must open offline and run cleanly under `prefers-reduced-motion`.

---

## 8. Judging criteria (advisor, ranked)
1. **Award-caliber craft & art direction** achieved *within* the brand constraints.
2. **Motion quality** — art-directed, performant, degrades correctly under reduced-motion.
3. **Fidelity to hard constraints** — Inter-only, dark brand palette, accurate copy & pricing.
4. **Improvement over current** — dust/grain haze gone; hero no longer fragile.
5. **Code quality** and clarity of the `tokens-delta`.
Bonus: a genuinely distinctive hero concept.

---

## 9. Reference paths (local, read-only)

> **Note:** these reference folders are untracked, so they will NOT be inside your Orca worktree. Read them from the **main checkout** on this machine at the absolute root:
> `C:\Users\pc\Documents\Webzite Studio\Webzite Agentic Workflow\`
> e.g. the current design is `C:\Users\pc\Documents\Webzite Studio\Webzite Agentic Workflow\deliver\webzite\workflows\04-design\.tmp\final-design\`. The paths below are relative to that root. (This brief already embeds the distilled Isadora composition/motion values, so the raw capture is optional visual reference.)

- **Current design (study & beat):** `deliver/webzite/workflows/04-design/.tmp/final-design/` (`index.html`, `css/home.css`, `js/home.js`)
- **Alt already on file** (GSAP+Lenis 4-chapter "It Adds Up" scroll-film): `deliver/webzite/workflows/04-design/.tmp/scroll-film/`
- **Isadora capture:** `manage/browser-tools/playwright-browser/.tmp/style-capture-isadora-final/` (`contact-sheets/`, `frames/`, `video.webm`, `code/resources/css` & `js`)
- **Brand system:** `manage/brand-assets/design-system/css/webzite-design-system.css` + `js/webzite-design-system.js`
- **Pricing source of truth:** `sales/PRICING_TIMELINE_RULES.md`

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
