# QA Report — Arvada Dental Center landing pages

**Asana parent task**: `1217040406855586`
**Run**: 2026-08-05 · `node qa.mjs` · **238/238 checks passed**
Machine-readable results: [`qa-results.json`](./qa-results.json)

## Why this is a driven test, not a screenshot review

None of the things most likely to be broken on these pages are visible in a capture: the stepped
qualifier, form validation, the FAQ accordion, the live open/closed pill, the mobile action bar, and
whether reduced-motion actually reveals the content rather than leaving it at `opacity: 0`.
[`qa.mjs`](./qa.mjs) drives a real Chrome over CDP and asserts on behaviour.

## What is checked, per page

| Group | Checks |
| :--- | :--- |
| **Structure** | exactly one `h1`; `lang` and a real `<title>`; the Asana task GID recorded on `<html>`; JS booted |
| **Integrity** | no broken images; every `img` has `alt`; empty `alt` only on `aria-hidden` decorative images; no dead `href="#"`; no placeholder/lorem copy |
| **Forms** | every control has a matching `<label for>`; empty submit blocked with no lead emitted; a 9-digit phone rejected; valid submit shows the confirmation; confirmation offers the phone number; lead payload carries its source and the task GID |
| **Qualifier** (implants, AOX) | advances exactly one step at a time; reaches the contact form; captures all four answers; progress ticks fill; back button returns to the previous step |
| **FAQ** | opens — `aria-expanded` flips *and* the panel height actually grows; closes again |
| **Live status** | the open/closed pill resolves to a real state and a sensible label |
| **Motion** | every `[data-reveal]` fires on a human-paced scroll; under `prefers-reduced-motion` nothing is left hidden |
| **Responsive** | no horizontal overflow at 1440 / 1024 / 768 / 390 / 320px; mobile action bar hidden over the hero and shown after it; action bar has a tap-to-call |
| **Content** | only the main line `(303) 421-7611` appears as a `tel:` — the tracking number does not |

## Cross-page content audit

Every page is scanned for claims the client's own material would contradict. All six pass:

| Forbidden | Why |
| :--- | :--- |
| "open 24/7", "always open", "walk-ins welcome" | the practice is Monday–Friday 8–5 only |
| "guaranteed same-day" | the client's wording is "whenever possible", not a guarantee |
| "painless", "no pain at all" | absolute clinical claim |
| `NN% success` | unsourced success-rate statistic |
| `(720) 419-3699` | the call-tracking line — see Open Question 2 |
| `$14,999` | the conflicting price variant — see the pricing warning |

## Defects found and fixed

| # | Page | Defect | Fix |
| :--- | :--- | :--- | :--- |
| 1 | all | `--cyan` (`#03c5ec`) as body/eyebrow text on the light bands measured **1.9:1** — failing even the 3:1 large-text bar, let alone 4.5:1 for the small uppercase eyebrows it was used on. | Added a text-safe `--cyan-ink` (`#056b80`, 5.6:1) and moved every *read* use of cyan onto it. Bright cyan is now fills, icons and text on the dark bands only. |
| 2 | all | `--amber` price figures on light bands measured **2.2:1**. | `.price-tag` uses `--amber-deep` on light bands (3.15:1, passes for large text) and keeps bright amber on the dark bands. |
| 3 | next-door | **7px of horizontal scroll at 320px.** "Wadsworth" set at 48px Cinzel measures 307px inside a 280px grid column. | Lowered the `.since` clamp floor to 2.1rem, added `overflow-wrap: break-word`, and added `min-width: 0` to grid/flex children repo-wide so one long word can never push the page sideways again. |
| 4 | all | The sticky mobile action bar could not shrink below its two button labels (grid items default to `min-width: auto`), widening the fixed bar past the viewport. | `min-width: 0` plus ellipsis on the action-bar buttons. |
| 5 | implants | The "how an implant works" section paired clinical copy about the post, abutment and crown with a **lifestyle photo**, under an `alt` that described an implant close-up. Wrong image, and an `alt` that misdescribed it. | Swapped in the actual implant render; the lifestyle photo moved to the hero, where it belongs. |

## Two false positives in the harness, worth recording

The first run reported 11 failures. Two categories were the test's fault, not the pages':

1. **"Broken images."** Below-the-fold images are `loading="lazy"`, so checking `naturalWidth` on a
   freshly-loaded page reports every one of them as broken. The check now runs after the scroll pass.
2. **"Reveals not firing" (21/29).** The harness scrolled at 0.6 viewport-heights every 130ms, which
   outruns IntersectionObserver. At a human-ish 0.45vh / 220ms all reveals fire on every page. Worth
   knowing: a *capture* script has the same problem in reverse — a static screenshot of these pages
   shows blank sections, because nothing has scrolled. That is what
   [`_shared/preview.mjs`](../../04-design/.tmp/_shared/preview.mjs) exists to solve.

## Not covered

- **No real browser matrix.** Everything was verified in headless Chrome. Safari and Firefox are
  untested, and iOS Safari in particular is worth a look before launch given the sticky action bar
  and `backdrop-filter`.
- **No screen-reader pass.** Roles, labels, `aria-expanded`, live regions and focus movement are
  asserted structurally, but nobody has listened to the pages.
- **Contrast was reasoned about, not swept.** Failures 1 and 2 were caught by calculating ratios for
  the token palette, not by running an automated audit over every rendered element.
- **Forms post nowhere.** By design — see Open Question 3. `submitLead()` is the single function to
  replace.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
