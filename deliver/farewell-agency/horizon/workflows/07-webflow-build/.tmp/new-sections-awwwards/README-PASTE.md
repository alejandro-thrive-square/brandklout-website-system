# Horizon — New Home-Page Sections, AWWWARDS EDITION: Paste Guide

Dynamic v2 of the six sections (same content as v1, redesigned layouts + GSAP
interactions). Class families use plain site naming: `projects_*`, `why_*`,
`testi_*`, `faq_*`, `cta_*`, and `footer-main_*` for the footer (the site
already has a different minimal `footer_component`, so the footer keeps the
`-main` qualifier to avoid a definition clash). Section combos are
`section_projects/why/testimonials/faq/cta` on `u-section`.

Source design: `../../04-design/.tmp/new-sections-awwwards/new-sections.html`
(open locally to preview all interactions). Regenerate with
`deliver/process/07-webflow-build/html_to_webflow.py --html ... --css sections.css --split <this folder>`.

## Upgrading from the old `-aw` paste (2026-07-02 rename)

The previous version of these sections used `-aw`-suffixed classes
(`projects-aw_*`, `footer-aw_*`, …) and is currently pasted on staging. Before
pasting this version:

1. In the Designer, DELETE the six old `-aw` sections (and the old `footer-aw_component`).
2. Style Manager → Clean Up to purge the unused `*-aw*` classes.
3. Replace the old head/footer custom code with the files below (the old
   `webflow-runtime-states.css` head snippet is no longer needed — remove it
   if it was ever installed).

## What's dynamic

| Section | Interaction |
|---|---|
| Projects | Editorial index list; hover = row tint + slide + cursor-following photo preview (desktop); inline thumbnails on tablet/mobile |
| Why Choose Us | Sticky stacking color cards (cream → rust → ink → terracotta) with giant numerals; previous card scales back as the next stacks |
| Testimonials | Two full-bleed auto-scrolling marquee rows in opposite directions; slow on hover. Each track holds ONE set of 3 cards — the custom code clones the set until the loop covers the viewport, so it never runs out of cards |
| FAQ | Oversized serif accordion, numbered, hover tint, GSAP open/close, terracotta active state |
| CTA | Full-bleed parallax image panel + kinetic split-line heading reveal |
| Footer | Column grid + monumental "HORIZON" wordmark with staggered character reveal |
| Global | Scroll reveals (`data-hz-reveal`) + SplitText line reveals (`data-hz-split`) on all headings |

All animation uses the GSAP stack the site ALREADY loads site-wide
(gsap + ScrollTrigger + SplitText 3.15) — no new libraries needed.

## Paste order (all AFTER the Turn-Key section, inside Main Wrapper)

1. `paste_01_u-section.html` — Projects
2. `paste_02_u-section.html` — Why Choose Us
3. `paste_03_u-section.html` — Testimonials
4. `paste_04_u-section.html` — FAQ
5. `paste_05_u-section.html` — CTA
6. `paste_06_footer-main_component.html` — Footer (move OUTSIDE Main Wrapper, body-level like the current footer)

Per file: open in logged-in Chrome → copy button → focus Designer (Ctrl+0 zoom)
→ select previous section → paste. One at a time; re-copy fresh on a miss.

## REQUIRED after pasting (portable per-section scripts)

Do not install the section behavior in Page settings. Instead, add one Webflow
Embed at the bottom of each section/component and paste that section's matching
script file:

| Section | Embed snippet |
|---|---|
| Projects | `section-scripts/script_01_projects.html` |
| Why Choose Us | `section-scripts/script_02_why.html` |
| Testimonials | `section-scripts/script_03_testimonials.html` |
| FAQ | `section-scripts/script_04_faq.html` |
| CTA | `section-scripts/script_05_cta.html` |
| Footer | `section-scripts/script_06_footer.html` |

Each snippet includes its own `<script>` tag, captures the section/component
that contains it, waits for `DOMContentLoaded`, and initializes only that local
section. This keeps the behavior attached when a section is saved as a Webflow
Component or moved to another page. The scripts are idempotent, so duplicate
runs do not double-bind events.

The Projects snippet also supports the CMS-backed Webflow variant. If
`data-hz-projects` or the original static preview box is missing, it falls back
to `.projects_list`, assigns preview indexes to each CMS row, and creates the
floating preview images from each row's `.projects_thumb`.

**Optional head CSS:** if transitions feel missing after Designer edits, use
`site.css` in the page/site head. It is intentionally motion-only: transitions
and `will-change` hints only. Do not install the old full component CSS in the
head because it overrides Webflow Designer class changes and causes stale style
bugs.

All JS-toggled states (preview visibility, active preview image, FAQ open
styling) are applied as inline styles by the script — there is no runtime-state
CSS file anymore, which is what silently broke the hover preview in the previous
version when the head CSS snippet wasn't installed.

Verify animations on a FOCUSED tab — background tabs freeze ScrollTrigger/timers.

## Notes

- Shared classes (`u-section`, `u-heading_row`, `u-heading_divider` + `is--span`,
  `u-heading`, `u-paragraph`, `button`, `is-alternate`, `button-group`,
  `u-section-content`, `u-eyebrow`, `u-heading-display`) match v1/site defs and
  merge by name.
- Testimonial tracks hold a single set of 3 cards each; the custom code clones
  them at runtime for the seamless loop. Edit review content on the 3 originals
  in the Designer — clones pick it up on the next page load.
- Why-card stacking is pure CSS `position: sticky` (works even with JS off);
  the scale-back effect is the GSAP layer on top.
- Images hotlink the old site's CDN (same set as v1) — re-upload to site assets
  for long-term safety. Project links use old `/projects/<slug>` paths.

## Version Control

Follows [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). Lightweight artifacts
committable; no binaries.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
