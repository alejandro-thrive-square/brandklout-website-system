# Design packages — Grand Mission Dentistry landing pages

Three self-contained coded packages, built locally for review before any platform work.
Source: Asana workspace `1210572425689866`, parent task **`1217040406855578`**.

Built to [DESIGN-STANDARD.md](../../../../docs/DESIGN-STANDARD.md) — awwwards-grade, motion-led,
high-interaction, benchmarked against the Dr. Nahlah reference build.

| Package | Asana task GID | Sections | Signature moment |
| :--- | :--- | :--- | :--- |
| `implant-landing-page/` | **`1217133289235653`** | 7, per spec | Pinned horizontal track — four implant solutions travel sideways while the page holds |
| `cosmetic-landing-page/` | **`1217072657902270`** | 7, per spec, incl. sticky mobile bar | Pinned patient ribbon — eight real before/after cases move as one strip |
| `thank-you-landing-page/` | **`1217162605683014`** | 4, per spec | The receipt stamp — the confirmation ring lands, the check draws itself, a ripple leaves the mark |

Each package is `index.html` + `styles.css` + `page.js` + `app.js` + `assets/` (including its own
copy of `kit.css`, `wz.js` and GSAP 3.13). Nothing loads from a CDN except Google Fonts, so a
package runs from disk.

## Architecture

```
assets/gsap/*.min.js   GSAP 3.13 — all plugins, free since 3.13
assets/kit.css         tokens, type scale, shared components, reduced-motion rules
assets/wz.js           runtime: WZ bootstrap, declarative motion hooks, accordion, lightbox
page.js                bespoke choreography for this page only
app.js                 offer tokens + lead capture (runs before wzFlush)
```

Declarative hooks, so markup drives motion rather than selectors hard-coded in script:
`data-split` (masked line reveal), `data-rv` / `data-rv="stagger"`, `data-wipe="up|left|right"`
(clip-path), `data-drift` (parallax), `data-count` (counter), `data-scrub-count` (scroll-bound
figure), `data-cursor-card`, `data-marquee`, `.magnetic`.

**Order matters**: GSAP in `<head>`, plugins registered in `wzFlush()` at the *end of body*.
Registering in `<head>` leaves ScrollTrigger half-initialised and ScrollSmoother dies silently —
the page does not error, it just feels flat.

## Motion and interaction, per page

### Implant — `implant-landing-page/`

1. **Hero entrance timeline** — the background photo is uncovered by a `clip-path` wipe, the H1
   arrives as SplitText masked lines, and the quiz panel rises with its own controls staggered in
   behind it, so the form assembles rather than appearing whole.
2. **Counting price** — `$2,999` counts up on entry, driven by the token in `app.js`.
3. **Service marquee** — the client's six real services loop seamlessly (duplicated track, `-50%`),
   slowing to a quarter speed on hover.
4. **Pinned scrubbed stat band** — the section pins and the four clinical figures resolve left to
   right against scroll progress, each on its own slice of the scrub, with a rail tracking progress.
   Scroll back up and the numbers run backwards.
5. **Pinned horizontal track — the signature moment.** The page holds while the four implant
   solutions travel sideways, each image counter-moving inside its frame for depth, with a progress
   bar underneath. On mobile it becomes a scroll-snap swipe rail — designed for the thumb, not a
   degraded pin.
6. **Clip-path wipes + parallax drift** on the consult and financing photography.
7. **Staggered financing matrix** — the table builds row by row, which makes a dense block of
   financing terms readable instead of a wall.
8. **Gallery depth** — alternate before/after cases travel at different rates as the row passes.
9. **Animated accordion** — GSAP height tween, one open at a time, `aria-expanded` kept honest.
10. **Magnetic CTAs** (`gsap.quickTo`) and **cursor-aware cards** (pointer position piped into CSS
    custom properties, so the sheen follows the cursor with no JS repaint).
11. **Multi-step quiz** — one tap per step, auto-advance, back navigation, progress bar, field-level
    validation, honeypot.

### Cosmetic — `cosmetic-landing-page/`

1. **Hero entrance timeline** — same wipe → split → assemble sequence; the offer word "Free" is set
   in the client's own Great Vibes script face, used once, where it carries the offer.
2. **Counter-moving doctor portraits** — each portrait drifts against its column as the section
   passes, so the two-doctor block has depth.
3. **Pillars that take the stage** — sticky heading, and each of the three reasons inverts to the
   dark brand ground as it reaches mid-viewport, with a rail tracking progress through the set.
4. **Offer counters** — `$189` and `$3,799` count up on entry.
5. **Pinned patient ribbon — the signature moment.** Eight real before/after cases travel
   horizontally while the section is pinned, each photo counter-moving inside its frame. Mobile gets
   a snap-scroll swipe rail.
6. **Clip-path wipes** on the technology photo and both portraits, **magnetic CTAs**,
   **cursor-aware service cards** with icon micro-motion, animated lightbox.

### Thank-you — `thank-you-landing-page/`

1. **The receipt stamp — the signature moment.** The ring drops in on a `back` ease, the check
   *draws itself* by animating `stroke-dashoffset` along the path, and a ripple expands past the
   ring and fades. A confirmation page has one emotional job: make it look like something actually
   happened.
2. **Scrubbed 3-step timeline** — the rail draws against scroll position and each step lights up as
   the draw reaches it, so "what happens next" is progressed through rather than listed. The rail
   runs horizontally on desktop and **vertically on mobile**, because that is the axis the steps
   actually run on there.
3. **Live open/closed pill** — reads the hours table on the visitor's clock, and the dot pulses only
   when the practice is actually open. A confirmation page is read minutes after submit, so "call
   us" is only useful if you know somebody is there.
4. Call box lifting into the banner, parallax on the stamp and the map, clip-path wipes, magnetic
   CTAs, and a sticky call bar — on this page, calling *is* the conversion.

Under reduced motion the check is painted already drawn and all three steps are marked complete —
an undrawn stroke would leave an empty circle, which is worse than no motion at all.

### Both

Fluid `clamp()` type scale in `kit.css` (`--d1` through `--label`), weight contrast 800 display
against 400 body, header reading-progress bar, sticky mobile call bar, and the offer + phone
reachable at every scroll depth.

## Reduced motion

`prefers-reduced-motion: reduce` skips ScrollSmoother, skips every pin and scrub, and paints all
content immediately — including the scroll-scrubbed stat figures, which would otherwise read
"0.0%" to anyone who asks for reduced motion. Motion off must never mean content off. The suite
asserts this, not just the media query.

## Verification

```bash
node verify.mjs               # all pages — behaviour + full-page screenshots
node verify.mjs implant       # one package
node qa-viewports.mjs         # real 390x844 mobile viewport shots at 2x
```

`verify.mjs` captures full-page screenshots, which at 390px wide run to ~18,000px on the implant
page — unreadable, and they flatten the details worth judging. `qa-viewports.mjs` takes real mobile
viewport shots at the moments that matter.

**91/91 checks pass**, across all three pages. The suite drives the real pages over CDP and asserts behaviour: plugins
registered, ScrollSmoother live, split-text built, pins created, stat band scrubbing, horizontal
tracks translating, pillars activating, counters reaching real values, accordion animating and
closing its sibling, magnetic CTAs responding to a synthetic pointer, lightbox open/close, quiz
stepping and validation, honeypot, mobile rails replacing pins, sticky bar, no horizontal overflow,
every image resolving, every button legible against its own background, reduced-motion behaviour,
and zero console errors.

Traps this suite exists to catch, all hit during this build:

- **`offsetTop` is 0 inside ScrollSmoother's transformed content.** Measuring section positions that
  way scrolled to the wrong place and reported a working scrub as broken. Measure from
  `getBoundingClientRect().top + scrollY` at the top of the page.
- **A bare `ScrollTrigger` with `scrub` and no animation does not drive `onUpdate` per tick.** The
  stat counters sat at zero. Scrub a proxy value with a tween instead.
- **Two tweens fighting over `opacity`** — an element carrying `data-rv` *and* animated by a page
  timeline can end up stranded invisible.
- **A full-page capture never scrolls**, so `loading="lazy"` images below the fold never fetch and
  the shot shows empty frames. Force them eager before capturing.
- **A crashing suite used to print "all passed"** — the checks it never reached simply did not
  exist. It now records the crash as a failure.
- **Test in a focused tab.** Background tabs freeze transitions, timers and IntersectionObserver.
- Screenshots are taken in the reduced-motion pass, because ScrollSmoother breaks full-page capture.
- **`maps.google.com/maps?...&output=embed` 301s to a URL whose redirect carries
  `X-Frame-Options: SAMEORIGIN`** — the frame renders blank and every `src` assertion still passes.
  `www.google.com/maps?...&hl=en&output=embed` returns 200, needs no API key, and `hl=en` stops
  Google localising the map UI to the viewer's IP.
- **A cross-origin iframe does not paint in a `captureBeyondViewport` screenshot.** The map looks
  blank in the full-page shot and renders fine in a real viewport — that is why the suite asserts
  the frame's `load` event (after re-assigning `src`, since an event that already fired never fires
  again) rather than trusting the picture.

## Offer and phone tokens — one place to edit

Every price and phone renders from an `OFFER` object at the top of each `app.js`, which runs before
`wzFlush()` so counters animate toward the token value. Nothing is hard-coded in markup.

| Token | Current value | Why |
| :--- | :--- | :--- |
| `implantPrice` | `2999` | The client's own currently published price. The vendor's page ran `$3,499` with `$500 off paid in full` — flip this one value if Brandklout confirms that offer is live. |
| `newPatient` / `invisalign` | `189` / `3799` | Live-site specials, with the client's own fine print. |
| `phoneDisplay` / `phoneDial` | `(281) 789-8836` | The practice's **main line**. The vendor used per-campaign tracking numbers — implant `(281) 747-5929`, cosmetic `(281) 729-4615` — which may be switched off at handover. Swap once Brandklout confirms ownership. |

## GHL — what is still needed

Both lead tasks say *"Make sure lead form is created in GHL for this specific page"*. We hold no GHL
grant. Each `app.js` has:

```js
var LEAD_ENDPOINT = null;  // POST target, or an embed replaces the form entirely
var THANK_YOU_URL = null;  // redirect target — the thank-you page in this build
```

With both `null` the form validates, blocks bad input, traps bots and shows its success state, so
the pages review end to end without GHL existing. The payload carries `page` and `asana_task_gid`
for attribution. **The three pages are one flow** — whoever wires GHL needs the thank-you URL at the
same time.

## Content rules applied

Every factual claim traces to the client's own material — the two Asana attachments on task
`1217040406855578` or grandmissiondentistry.com. Inventory:
[`content-intake-summary.md`](../../01-content-intake/.tmp/content-intake-summary.md).

- **Five named reviews**, all real: EM M and Jason Kwan (implant), Diane C., Cedaro and Tiffany T.
  (cosmetic). Nothing invented.
- **Eight before/after cases**, actual patients, watermarked by the practice, with a results-vary
  disclaimer on both pages that use them.
- **Clinical statistics** are the ones the practice already publishes.
- **Doctor bios verbatim.** Dr. Tam Nguyen is pediatric and deliberately appears on neither lead page.
- The vendor's stock photo mislabelled as a "Restorative dentistry icon" was dropped; that slot uses
  an inline icon.

**Section order and copy are unchanged by the rebuild.** The Asana section specs and the verified
real content carried over intact from the first pass — only the execution changed.

## Known copy question

The cosmetic services grid uses the client's own service names *and* their own taglines, and their
pairings are scrambled at source — "Preventive Dentistry / Transform your smile with a touch of
perfection". Reproduced faithfully rather than silently rewritten. Worth raising with Sang Huynh.

## Version Control

Lightweight design artifacts. Media under `assets/` and `verify-shots/` is gitignored per
[SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md); the vendored GSAP files are `.js` and are
committed so a package runs from a fresh clone.
