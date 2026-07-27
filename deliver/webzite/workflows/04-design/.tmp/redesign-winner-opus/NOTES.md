# NOTES — "The Bottom Line" (Opus 4.8 executor)

**The ONE idea.** The whole homepage is art-directed as a studio's **balance
sheet**. The thesis *Strategy + Experience + Function = Profit* is the masthead;
every section is a ruled ledger entry; figures are tabular mono; and the
signature interaction is a **live pricing ledger** — drag the page count and
watch Design, Development, Total, and Timeline tally in real time. "A pretty
site is a cost, a profitable one is an asset" stops being a claim and becomes
the interface. This is the divergent bet: not a generic dark-agency site, but a
site whose *form is its argument about money*.

**Key motion moments.**
1. **Hero equation assembles, then the total is drawn.** On load the three
   terms rise (masked line reveal), a **yellow "sum rule" sweeps left-to-right**,
   and `= Profit` resolves in yellow — the gesture of drawing a total under a
   column. It's a *load-time timeline*, so it can never scroll-jack or stall.
2. **Field switches.** Full-width sections change color-field (ink ↔ raised ink
   ↔ one deep blue-black accent block for the stats), butted with hairline
   "ledger rules" — Isadora composition in strictly dark-brand color.
3. **Live pricing ledger** (signature) — eased tally on the total as you drag.
4. Scroll **word-fill** on the two thesis statements, **count-ups** on the hero
   index + stat grid, sticky **services well** that swaps per row, a **custom
   ledger-tick cursor** (pointer-fine only), and a **play/pausable marquee**.

**What I removed.** The `initDust` particle canvas, the animated `grain`
overlay, the noise-texture dependency, the always-on background-morph rAF loop,
the wandering orb, **and the fragile 300svh manual-lerp pinned hero** — replaced
with a load-time choreography + native scroll. Zero always-on rAF loops except
the cursor (which only runs on pointer-fine, motion-on devices).

**Constraints held.** Inter + JetBrains Mono only (no serif); dark Webzite
palette (yellow primary accent, blue secondary, no cream/purple); studio-of-one
copy, the equation thesis, 35+/4+/25+/100 proof, the three verified named
testimonials, canonical **$400/page · 2 days/page** pricing (1pg $400/2d · 5pg
$2,000/10d · 8pg $3,200/16d — the slider computes exactly this). WCAG AA
contrast; full `prefers-reduced-motion` fallback (no cursor, no marquee, no
count-up, all reveals resolved static, word-fill reads as plain text).

**Zero dependencies.** No GSAP/Lenis/CDN JS — the page opens and runs fully
offline; the only network reference is the Google Fonts stylesheet (with an
Inter/mono system fallback stack if it's blocked).

**Biggest risk.** The concept lives or dies on the *pricing ledger* feeling
alive and the hero "sum rule" landing as a deliberate gesture rather than a
stray line — both depend on timing that reads best at desktop widths; on very
small screens the equation compresses to a plain stacked headline (still on-
brand, less theatrical). Second risk: the deep-blue accent field is the one
place I departed furthest from literal v2.0 backgrounds — it's justified for
AA + drama, but it's the token most worth a second opinion before promotion.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
