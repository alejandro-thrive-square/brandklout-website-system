# Mason Park — Live LP Theme Extraction (Phase 1, 2026-08-17)

Source of truth: https://mason-park-dental.webflow.io/invisalign (+ /new-patient-special, /new-patient-thank-you cross-checked), stylesheet `mason-park-dental.webflow.shared.dd596814c.css` (100KB, 128 `imp-*` rules analyzed) + head custom-code blocks. Parity target = the live pages, per Phase 1 directive.

## Fonts — the "serif display" expectation is FALSE on the live pages

- **Everything renders Montserrat.** `body` tag style = `Montserrat, sans-serif` (#333, 14px/20px legacy); headings have NO font-family anywhere in the served CSS → inherit Montserrat. Only 3 `imp-*` rules even restate Montserrat. Strays: `.ty-step__h3`/`.qz-nav__back` use Lato.
- **Fraunces + Inter are LOADED (Google Fonts link in site head) but consumed by ZERO selectors.** `--display:"Fraunces",Georgia,…` is defined in the mpd-parity page-head block, and `var(--display)` appears **0 times** in the shared CSS and 0 times in any page HTML. Same on all LPs.
- **Disagreement noted**: the coded design / earlier brand direction (Fraunces display + Inter body, teal #00738D/#00B4D8/#8FDCEC, ink #26292F) survives only in the parity block's minor chapter/progress rules and the dead `--display` token. The published Home ("moodboard") is an **empty body** — nothing to extract; the moodboard embed is gone from the Home canvas too (element query: 0 embeds, 0 blocks).
- **Decision (LP CSS wins)**: Typography Heading = `Montserrat`, Body = `Montserrat`. Flipping the Heading variable to Fraunces later is a one-field change if the client direction reasserts itself.

## Palette (usage counts across the 128 imp-* rules)

| Hex | Uses | Role on the live LPs |
|---|---|---|
| #ffffff | 19 | backgrounds, text-on-dark |
| #2e3634 | 13 | main ink: headings, dark hero bg, ghost-button text |
| #00bde0 | 8 | ACCENT/CTA: button bg, eyebrows, checks, step numbers, `.accent` headings |
| #4a5b66 | 6 | muted body text |
| #f5f4f0 | 5 | off-white section bg (story/options/gallery/faq) |
| #d8e0e4 | 5 | borders (cards, price band, video titles, header rules) |
| #12211f | 4 | deepest ink — **text on accent** (buttons, stamps, step numbers) |
| #d3aa5a | 4 | gold — stars, ghost-button hover bg |
| #071e2d | 2 | primary-button hover bg, big price |
| #535e61 | 2 | dark alt section bg (`imp-cbody`, `imp-final`) |
| #376b7b | 1 | `imp-button:hover` bg |
| #b6c8d3 | 2 | muted text on dark |
| #2b2b2d / #0b2c41 / #8b958e / #9cb2c0 / #a0b4aa / #6e8a7c / #e08a7a | 1–2 | trust-bar bg / legacy navy / strike gray / hints / blockquote accents |
| shadows | — | all on #101820 alpha (0 24px 60px, 0 16px 40px, 0 10px 28px) + CTA glow #00bde04d |

## Buttons (live)

- **Primary** (`.imp-button`, `.imp-btn-primary`): bg **#00bde0**, color **#12211f**, uppercase, 700, letter-spacing .08em, **pill radius (50px/999px)**, padding 15px 20px (nav) / 17px 30px (hero CTA), hover bg **#376b7b** (imp-button) / #071e2d (imp-btn-primary), glow shadow 0 8px 22px #00bde04d.
- **Ghost** (`.imp-btn-ghost`): bg **#fff**, color **#2e3634**, border **2px #545f62**, pill radius, hover bg **#d3aa5a** (gold).

## Radii / strokes / shadows

- Cards & media: **16px** (9 uses) and **12px** (5) · pills **999px/50px** · circles 50%.
- Borders: 1px standard (#d8e0e4); ghost button 2px; dark-section hairline #ffffff1f (~12% white).
- Shadows: large soft `0 24px 60px rgba(16,24,32,.18)`, card `0 10px 28px rgba(16,24,32,.10)`.

## Type scale (live)

h1 3.5rem (Relume h1 = same) · h2 **2.5rem wt 600** (19 uses of imp-h2 — differs from Relume's 3rem/700) · h3 uppercase 15–20px/700–800 (section-specific) · body **1.125rem/1.65** via site-head override (`body{font-size:1.125rem;line-height:1.65}` applies site-wide, incl. future v2 pages) · small .9rem · fine 13–14px.

## Token mapping (→ STEP 2 variables)

**Primitives** — White #ffffff · Neutral Lightest #f5f4f0 · Neutral Lighter #d8e0e4 · Neutral Light #b6c8d3 · Neutral #8b958e · Neutral Dark #535e61 · Neutral Darker #4a5b66 (¹) · Neutral Darkest #2e3634 (²) · brand extras: Accent #00bde0, Accent Deep #376b7b, Ink #12211f, Ink Navy #071e2d, Gold #d3aa5a. Opacity ramps kept stock-shaped (White 5–60 on pure white; Neutral Darkest 5–60 on rgba(16,24,32,x) — the #101820 base every live shadow uses).

¹ #4a5b66 vs #535e61 are near-identical luminance; Darker = the muted-text gray (#4a5b66), Dark = the dark surface (#535e61).
² #12211f (the true darkest) is used ONLY as on-accent text, so it becomes `Colors/Ink` and the broadly-used #2e3634 takes the Darkest slot (Scheme 1 Text aliases it, matching stock's Text→Darkest alias).

**Color Scheme 1 (light — most sections)**: Text→Neutral Darkest (#2e3634) · Background→White · Foreground→Neutral Lightest (#f5f4f0) · Border→Neutral Lighter (#d8e0e4, live borders are light not dark — deliberate divergence from stock's Border→darkest) · Accent→Accent (#00bde0).

**Color Scheme 2 (dark — hero/final/trust sections exist on every LP)**: Text→White · Background→Neutral Darkest (#2e3634) · Foreground→Neutral Dark (#535e61, the on-dark card bg) · Border→Opacity/White 15 · Accent→Accent (#00bde0).

**Typography**: Heading = Montserrat · Body = Montserrat (see disagreement note above).

**UI Styles**: Radius Small 12px · Radius Medium 16px · Radius Large 999px (pill — buttons/badges are the only "large radius" surfaces on the LPs) · Border Width 1px · Divider Width 1px.
