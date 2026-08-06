# QA Report — Arvada Dental Center landing pages

**Asana parent task**: `1217040406855586`
**Run**: 2026-08-06 · `node qa.mjs` · **427/427 checks passed** (focused-tab emulation on)
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
| **Motion declared per page** | every page authors its own `data-split`, `data-stagger` and `data-parallax`, plus an inline `prefers-reduced-motion` guard and a no-JS visibility guard — a page cannot quietly drift back to plain |
| **Motion** | the system is armed (`data-motion="on"`); headings are split into line masks or a word fallback; groups carry a stagger index; the scroll progress bar exists and advances; the hero is lit; the hero media parallax actually changes on scroll; **nothing is left invisible after the scroll pass — including anything still translated outside its own mask** |
| **Reduced motion** | everything visible immediately; **no residual transform left on anything**; the scroll layer is skipped entirely (`data-motion="reduced"`, no progress bar) |
| **Offer never buried** | at **five scroll depths × two viewports**, a phone link, a route to the lead form and the offer are each actually inside the viewport — measured by geometry, not by markup existing somewhere |
| **Responsive** | no horizontal overflow at 1440 / 1024 / 768 / 390 / 320px; mobile action bar hidden over the hero and shown after it; action bar has a tap-to-call |
| **Commercial terms** | no Webzite rate, quote or cost, and no reference to `PRICING_TIMELINE_RULES.md`, in any authored artifact. Brandklout is a partner engagement, so those rules do not apply under `deliver/brandklout/`. The dental practice's **own** patient-facing prices are page content and are expected. |
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
| `4.8`, `931`, `1,270`, `1,000+ reviews`, "average rating", "N out of 5" | **the aggregate rating is an estimate, not a real number** (Brandklout, 2026-08-06) |
| `CareCredit`, `Sunbit`, `PatientFi`, `LendingClub`, `Proceed Finance`, `Cherry` | **named finance partners were assumed, not confirmed** |
| "without affecting your credit", "soft credit check", "no credit check" | a regulated consumer-finance claim riding on the unconfirmed lender list |
| "before and after", "actual patient", "real patient results" | **the client's before/after photos are stock placeholders, not consented patient photography** |
| `$105/mo`, `$185/mo`, `$230/mo`, "10+ lending partners" | the previous vendor's unverified monthly financing figures |
| `images.unsplash.com` | the vendor used Unsplash photos as fake before/after patient cases |

## Defects found and fixed

| # | Page | Defect | Fix |
| :--- | :--- | :--- | :--- |
| 1 | all | `--cyan` (`#03c5ec`) as body/eyebrow text on the light bands measured **1.9:1** — failing even the 3:1 large-text bar, let alone 4.5:1 for the small uppercase eyebrows it was used on. | Added a text-safe `--cyan-ink` (`#056b80`, 5.6:1) and moved every *read* use of cyan onto it. Bright cyan is now fills, icons and text on the dark bands only. |
| 2 | all | `--amber` price figures on light bands measured **2.2:1**. | `.price-tag` uses `--amber-deep` on light bands (3.15:1, passes for large text) and keeps bright amber on the dark bands. |
| 3 | next-door | **7px of horizontal scroll at 320px.** "Wadsworth" set at 48px Cinzel measures 307px inside a 280px grid column. | Lowered the `.since` clamp floor to 2.1rem, added `overflow-wrap: break-word`, and added `min-width: 0` to grid/flex children repo-wide so one long word can never push the page sideways again. |
| 4 | all | The sticky mobile action bar could not shrink below its two button labels (grid items default to `min-width: auto`), widening the fixed bar past the viewport. | `min-width: 0` plus ellipsis on the action-bar buttons. |
| 5 | implants | The "how an implant works" section paired clinical copy about the post, abutment and crown with a **lifestyle photo**, under an `alt` that described an implant close-up. Wrong image, and an `alt` that misdescribed it. | Swapped in the actual implant render; the lifestyle photo moved to the hero, where it belongs. |

## Reconciliation pass, 2026-08-06

Brandklout identified three things in the source material as **fabrications carried forward, not
facts**. Two had been built into these pages. All three now have guards.

| Fabrication | What was in the pages | Now |
| :--- | :--- | :--- |
| **The 4.8 / 1,000+ review aggregate is an estimate.** | "4.8 from 931 reviews" as a hero trust badge and a proof-section `h2` on every page; a rating strip on implants; an "average rating / patient reviews" stat pair on next-door; 27 star rows. | All removed, including **every star glyph** — the 5-star rating attached to each individual quote was inferred here, never sourced. Named reviews stay, quoted verbatim, with no score. |
| **The before/after photos are stock placeholders, not consented patient photography.** | Nothing — no before/after imagery was ever used. | Guarded anyway, and the imagery claim in the intake summary corrected (see below). |
| **The named finance partners were assumed.** | Six lenders listed on implants, named again on AOX and veneers, plus "pre-qualify without affecting your credit score" in four places. | All names removed. The soft-pull claim went too — it is a regulated consumer-finance statement that depends entirely on which lender is actually in place. Replaced with the generic "monthly payment plans are available". |

### A claim of mine that was wrong

The intake summary said *"No stock imagery is used on any of the six pages. Every image is the
client's own."* The first sentence does not follow from the second. Every image is **client-hosted**
— pulled from `arvadadentalcenter.com` rather than a stock library by us — but several are evidently
**licensed stock the practice already runs** (the emergency pain shot, the veneers lifestyle shot,
the outdoor shots on implants and AOX). Corrected in
[`content-intake-summary.md`](../../01-content-intake/.tmp/content-intake-summary.md), and image
rights are now Open Question 11.

Nothing on any page is captioned or framed as a patient, a result, or a before/after — which is what
kept this from becoming a live problem rather than a documentation one.

## Motion rebuild, 2026-08-06

The reveal layer was a single uniform fade-up with four hard-coded delays — plain, and patching more
fades onto it would have stayed plain. It was replaced with a choreographed system in
`_shared/brand.css` + `brand.js`. **No page's content or section order changed**: the engine reads
the existing DOM and choreographs it, so all six pages were upgraded by editing the two shared files
(plus a `data-count` attribute on four price figures).

| Behaviour | What it does |
| :--- | :--- |
| **Line-masked headings** | `h1/h2.display` are split into lines and resolve from behind a mask, staggered. Headings containing inline elements fall back to a word stagger, because regrouping across element boundaries would break the markup. |
| **Group cascades** | Cards, symptoms, checklists, steps, stat rows and table rows get a computed `--i`, so they arrive in sequence instead of as a slab. |
| **Media** | Images scale out of their own overflow mask. The scale deliberately lands on `1.008`, never `1` — a scrubbed scale terminating exactly at 1 shows a one-pixel edge shimmer on some GPUs. |
| **Hero** | Copy lights immediately; the form card follows at 320ms; trust items cascade. The media parallaxes and eases its zoom out, but the *copy does not move* — the promise never drifts away from the reader. |
| **Ridge parallax** | The Colorado mountain-ridge motif — the practice's own device — is what carries the parallax, rather than a generic effect bolted on. |
| **Counting offer** | `$18,795` and `$109` count up on entry with an ease-out-expo and **always land on the exact published figure**. |
| **Docked offer chip** | Once the offer scrolls past, a chip carrying the number docks into the header, linked to the form. Hidden while the offer is on screen — two copies of the same number is noise, not emphasis. |
| **Scroll progress** | A cyan→amber bar, `transform: scaleX()` only. |

Everything is transform/opacity only, on one rAF loop that parks itself when the tab is hidden.

### Choreography is authored per page, not inferred at runtime

The first version of this system inferred everything from element classes. It worked and it tested
green — but **the page files themselves declared no motion at all**: no `data-split`, no
`data-stagger`, no `prefers-reduced-motion`. Auditing a page on its own turned up nothing, the
choreography was tunable nowhere, and runtime-only classes are fragile to port into Webflow later.

Each page now declares its own:

| Attribute | Meaning | Per page |
| :--- | :--- | :--- |
| `data-split="lines\|words"` | heading resolves behind a line mask, or falls back to a word stagger | 6–11 |
| `data-stagger="ms"` | group cascades, with a per-step interval tuned to what the group is (checklists 45ms, cards 70–110ms, process steps 120ms) | 5–6 |
| `data-parallax="k"` | element drifts against scroll | 1–2 |
| `data-reveal="scale"` | media enters with a scale rather than a rise | 0–2 |
| inline `@media (prefers-reduced-motion: reduce)` guard | the contract holds even if the shared stylesheet is swapped, minified or ported | every page |
| `html:not([data-motion="on"]) [data-reveal]` guard | nothing is left hidden if the script never runs | every page |

The engine honours declarations and falls back to inference for anything undeclared, so nothing
regressed. QA now asserts the declarations exist, so a page cannot quietly drift back to plain.

### Two real bugs the new checks caught

1. **The hero headline was masked off on all six pages.** The line-mask CSS resolved on `.is-in`,
   which is applied by the reveal observer — but the hero heading is not inside a `[data-reveal]`, so
   nothing ever applied it. The headline sat translated 105% below its own line box, permanently.
   Only one page reported it, because the opacity-only check could not see a transform-hidden
   element; the check now measures translation against element height too. Fixed by resolving on
   `.hero.is-lit` as well.
2. **A dead zone on tall mobile heroes.** The action bar appeared when the hero left the viewport,
   so on pages with a tall mobile hero there were several hundred pixels where the hero's own phone
   link had scrolled away but the bar had not yet arrived — no way to call, no route to the form. It
   now triggers on scroll depth (two thirds of a viewport), which has no dead zone by construction.

### Testing in a focused tab

Both `qa.mjs` and `preview.mjs` now call `Emulation.setFocusEmulationEnabled` and
`Page.bringToFront`. A background tab throttles rAF and freezes CSS transitions and
IntersectionObserver, so a driven test reports working motion as broken. This is not optional for
any page with scroll-linked behaviour.

## Three harness bugs, worth recording

Three harness bugs produced false failures. Recording them because each is a general trap:

1. **"Broken images."** Below-the-fold images are `loading="lazy"`, so checking `naturalWidth` on a
   freshly-loaded page reports every one of them as broken. The check now runs after the scroll pass.
3. **A flaky FAQ and action-bar failure on `dentist-near-me`** (added 2026-08-06). `load()` waited a
   fixed 1700ms after navigation, which on the heaviest page was sometimes not enough — the test
   clicked the FAQ before `brand.js` had bound its listener. It now polls for `data-js="on"`, the
   readiness flag `boot()` sets last, and the accordion check polls for the height to settle instead
   of sleeping. Three consecutive clean runs confirm it. Worth internalising: a fixed sleep in a
   driven test is a false failure waiting to happen — wait on a signal the app actually emits.
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
