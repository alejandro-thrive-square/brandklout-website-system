# Shared Learnings — from the Arvada build, for the rest of the Brandklout batch

Authored 2026-08-05 while building Arvada's six landing pages. Everything here is client-agnostic
and meant to be reused by Grand Mission, Mason Park, Stone and Dr. Nahlah.

Linked from [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md) in two lines, deliberately — that file
is edited by every worktree and long edits there cause merge conflicts. Put shared findings in your
own client folder and link to them.

> [!NOTE]
> **No commercial terms here.** Brandklout is a partner engagement, not a per-page client;
> `sales/PRICING_TIMELINE_RULES.md` does not apply anywhere under `deliver/brandklout/`. Scope and
> page count matter only for sequencing and capacity.

## 1. Every reference in this batch is the same page underneath

Strip the styling and all nine references run the **same nine beats**:

> hero → qualifier → offer → mechanism → proof → doctor → process → FAQ → close

What varies between pages is **which beat leads** and **how loud the offer is** — an emergency
visitor and a full-arch visitor are at opposite ends of the deliberation spectrum and cannot be sold
the same way. Full per-reference extraction, including the copy angles worth stealing and the ones
worth refusing:
[`../workflows/01-content-intake/.tmp/reference-structure-notes.md`](../workflows/01-content-intake/.tmp/reference-structure-notes.md).

## 2. All four recurring archetypes now have a working implementation

At [`../workflows/04-design/.tmp/`](../workflows/04-design/.tmp/): implants, All-on-X,
cosmetic/veneers, and the new-patient special (built twice, once for search intent and once for
neighbourhood intent).

They share `_shared/journey.css`, `_shared/journey.js` and `_shared/journey-boot.js`, plus a vendored
GSAP 3.13 in `_shared/vendor/gsap/`. Between them these provide: a token system with a `data-theme`
light/dark layer, the nav with its reading-progress bar and chapter readout, the stepped qualifier,
an accessible FAQ accordion, form validation through one swappable choke-point, a live opening-hours
pill, the offer component, and a sticky mobile action bar.

**Re-skin the tokens; do not rebuild the components.** The `:root` block is the only part that should
need to change for another practice.

> [!IMPORTANT]
> **This replaced a shared `brand.css` + `brand.js` that drove everything from `IntersectionObserver`,
> and the replacement was an architecture change, not a refactor.** The client rejected the first
> round as "a plain card website design". An observer can only say *this is now visible*; it cannot
> express *how far through* a scene you are, which is what every scrubbed moment depends on. If your
> client folder still has a `brand.js` full of observers, you have the same problem — see
> [DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md), "Journey architecture — chapters, not bands".

Three things in there are worth copying regardless of design direction:

- **The lead choke-point.** No client in this batch has a GoHighLevel endpoint yet. Routing every
  form through one function means wiring GHL up later is a one-function change rather than a hunt.
- **The live opening-hours pill.** Several references headline "Open Now" and guarantee same-day
  appointments. If your client is not actually open, do not copy that claim — compute the real state
  and say it.
- **The chapter shell.** `data-chapter` / `data-chapter-name` on each `<section>` is what drives the
  nav readout and the progress bar for free, and it is what the journey audit counts.

## 3. Two scrapers, because these sites fight back

Both in [`../workflows/01-content-intake/.tmp/`](../workflows/01-content-intake/.tmp/):

| Script | Problem it solves |
| :--- | :--- |
| `capture.mjs` | Dental sites in this batch sit behind SiteGround **sgcaptcha** and Cloudflare. `curl` and `WebFetch` get a `202` interstitial or a `403`, never the page. This drives headless Chrome over CDP, waits the challenge out, and dumps rendered HTML, a structured `meta.json` and full-page PNGs at any widths you ask for. |
| `fetch-assets.mjs` | The challenge covers **images** too, and specifically intercepts *scripted* requests — an in-page `fetch()` for a `.webp` returns `text/html` even with the cookie set, while the browser's own `<img>` loads fine. This reads the original bytes off the network log with `Network.getResponseBody` while the real pages load, which also avoids the re-encoding a canvas round-trip would cause. |

Gotchas both scripts already handle, which cost time to find:

- **Wait on the document's identity, not its size.** The sgcaptcha interstitial is ~12KB, so a
  byte-length check sails straight past it. Check the URL and title instead.
- **`HEADED=1`** runs a real window for sites that fingerprint headless Chrome.
- **Set `Accept-Language`.** `smilecenter.com` serves Spanish without it.
- **Assets are gitignored repo-wide** (`*.webp`, `*.png`, …). Commit the `assets-manifest.json` the
  script writes; it is the record that lets anyone re-fetch.

## 4. Three harnesses, because they answer three different questions

All in [`../workflows/08-qa/.tmp/`](../workflows/08-qa/.tmp/); point any of them at another client by
editing the `PAGES` array.

| Script | Question it answers |
| :--- | :--- |
| `content-gate.mjs` | *Has a fabrication got back in?* Static, instant, no browser. Also checks chapter numbering, that no section is named for a background colour, and that the phone and form are present. Run it on every change. |
| `scrub-proof.mjs` | *Is the motion real?* Step-scrolls each pinned chapter and asserts a **different intermediate state at 25 / 50 / 75 %**. Also proves pins release cleanly at both ends, the progress bar tracks the document, and reduced motion hides nothing. |
| `shots.mjs` | *Does it hold together at every width?* Six breakpoints, full page, plus the horizontal-overflow assertion and one interaction pass at 390. |

A static capture of a scroll-driven page shows **half-built scenes**, because the pinned chapters are
deliberately mid-assembly until you scroll them. So:

- **Capture the required full-page shots under `prefers-reduced-motion: reduce`.** That is the one
  state where every chapter renders complete and in normal flow, so it is the honest layout view —
  and it doubles as evidence that reduced motion hides nothing. Capture the motion state separately,
  parked mid-journey.
- **ScrollSmoother breaks `captureBeyondViewport`** — it transforms the content instead of scrolling
  it, so you photograph one viewport and a lot of empty page. `shots.mjs` disables smoothing for the
  capture pass through a `?nosmooth=1` URL parameter, which is never shipped in the markup.
- Check image integrity *after* scrolling, or every `loading="lazy"` image reports as broken.

## 5. Two contrast traps in dental brand palettes

Both caught on Arvada, both likely to recur — these practices favour bright cyan and amber:

- Bright cyan (`#03c5ec`) as text on a light band is **1.9:1**. It fails even the 3:1 large-text bar.
- Amber (`#fb8e28`) on a light band is **2.2:1**.

Keep a darkened text-safe variant of each brand colour for anything that is *read*, and reserve the
bright brand values for fills, icons and text on dark bands.

## 6. The Greenspot reference is unretrievable — do not burn time on it

`greenspotcrossingsdentistry.com/lp/59-nps/` is cited by **two** Arvada tasks and is the same
archetype Mason Park's *New Patient Special* needs. It returns a hard Cloudflare `403` — a WAF rule,
not a JS challenge, so headed Chrome does not help either, `WebFetch` gets the same, and the `/lp/`
path is not in the Wayback Machine (the rest of the domain is).

Use `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC` instead — a `$189` new-patient-special
page, same archetype, captured successfully at
[`../workflows/01-content-intake/.tmp/reference-captures/ref-nextdoor-ghl/`](../workflows/01-content-intake/.tmp/reference-captures/ref-nextdoor-ghl/).
Its testimonials are **lorem ipsum placeholders**, which is a useful reminder of what not to ship.

Worth someone asking Brandklout for a screenshot or PDF of the Greenspot page.

## 7. Ask Brandklout once, for the whole batch

These came up on Arvada but are almost certainly batch-wide:

1. **Which phone number should paid traffic use** — practices in this batch run call-tracking lines
   alongside their main number.
2. **Where form submissions post** — no GoHighLevel endpoint, form ID or location ID has been
   supplied for any client.
3. **The Asana attachments** ("originals from the other Ad company"). Arvada's arrived 2026-08-06 in
   `01-content-intake/.tmp/asana-context/`. **Get yours, and read the README first** — Arvada's
   admitted in writing that the rating, the before/after photos and the finance partner names in
   the delivered page were all placeholders. See item 8 below.
4. **Check the client's own site for a published offer before assuming there isn't one.** Arvada's
   was on a page not linked from the main navigation.

## 7b. Motion: the traps that will hit you too

Carried over from the observer build, still true:

1. **Never let a reveal style apply without JS confirming it can also remove it.** The pre-reveal
   state is armed by `html.js-motion`, added by the script itself once GSAP is confirmed live. A page
   that ships `opacity: 0` in CSS and relies on a script to undo it is one script error away from
   being blank.
2. **Sticky CTAs must trigger on scroll depth, not on the hero leaving the viewport.** On a tall
   mobile hero that leaves a dead zone: the hero's own phone link has scrolled away, the sticky bar
   has not arrived, and for several hundred pixels there is no way to call.

New, from the GSAP rebuild:

3. **Register plugins in `<body>`, not `<head>`.** In `<head>` there is no `document.body` yet;
   ScrollTrigger initialises half-built and ScrollSmoother then dies on `getScrollFunc` — silently.
   No console error, the page merely feels flat. Split the bootstrap: define your queue in `<head>`,
   register and flush at the end of `<body>`.
4. **One property, one owner.** Two scrubbed tweens writing the same property on the same element
   over overlapping ranges overwrite each other every frame and flicker. Both word-by-word statements
   in this build split their words into two disjoint sets for exactly this reason.
5. **Scrubbed scale on raster media must never land on exactly 1.** Sub-pixel rounding under
   ScrollSmoother makes the edges shimmer. End at 1.08, and bleed the element past its clip.
6. **Give a pinned scene a real fallback under reduced motion.** A pinned horizontal track with the
   pin removed is a `height:100svh` box containing a `width:max-content` row — i.e. unreachable
   content. Each one here converts to an ordinary `overflow-x:auto` region instead.

7. **Animate the arrival of a number, never its value, when the number is a price.** A scrubbed
   counter does not animate *past* a wrong value — it **sits** at it for as long as the visitor
   stays there. The `$109` offer total was caught reading **"YOUR FIRST VISIT — $43"** mid-chapter.
   Counting is fine where the intermediate values are true (a year running 2003→2025, implants
   placed 0→4); it is not fine for anything a real practice actually charges.

And four harness traps that cost real time. **Every one of them reports the page as broken when the
page is fine**, so each is an invitation to "fix" something that was never wrong:

- **Measure the pinned element, not the `<section>`.** ScrollTrigger pins the inner stage and grows
  the section to hold the pin-spacer, so the section's own rect keeps scrolling normally. Read
  `trigger.pin`.
- **CDP serialises `-0` as `unserializableValue` with no `value` field.** A perfectly held pin
  measures exactly `-0`, so a probe reading `result.value` alone reports "element missing" for the
  pins that are working *best*. Normalise with `| 0`, and read `unserializableValue` as a fallback.
- **`scrollTo` is instant; ScrollSmoother is not.** Native `scrollY` jumps immediately while
  ScrollTrigger follows the *smoothed* position for ~1s afterwards. Comparing the two before the
  glide settles reports a progress bar as mistracking and a released pin as still engaged. Allow
  ~1.5s after every programmatic scroll.
- **Never use a fixed remote-debugging port.** If a previous run's Chrome has not fully exited it
  keeps the port, the next launch exits immediately, and the run dies with *"did not expose a
  debugging port"* — which reads as a page failure and is not. Derive one per process
  (`9200 + process.pid % 700`). This was the single largest source of flakiness in this harness.

And the testing rule: **drive motion in a focused tab.** Background tabs throttle rAF and freeze
transitions and timers. `Emulation.setFocusEmulationEnabled` + `Page.bringToFront` in the CDP script,
or the failures are fiction.

## 8. The previous vendor's pages contain placeholders presented as facts

**This is the single most important thing on this page for the other clients.** Arvada's Asana
attachment (`index_1.html`, a veneers landing page from the previous ad company) ships with a
README that admits, in writing, that three of its most prominent "facts" were invented:

- **"I used 4.8★ / 1,000+ reviews as a defensible placeholder."** The rating is also baked into
  their JSON-LD as an `aggregateRating` — fabricated review markup, which is a Google
  structured-data policy violation and can cost a practice its rich results.
- **"the before/after slider currently uses stock placeholder images."** Six Unsplash URLs, shown
  as patient cases.
- **"I referenced CareCredit/Sunbit as common industry examples per your brief."** Invented lender
  names, alongside unverified $105/$185/$230 monthly figures.

If your client has an equivalent attachment, **assume the same and check its README before copying
anything numeric out of it.** Ratings, review counts, prices, monthly payments, partner names,
success rates and before/after imagery are all suspect by default.

Two general rules that fall out of this:

1. **A star rating on an individual quote is a claim too.** Ours were inferred, not sourced, so all
   star glyphs came off — not just the aggregate. Quote + name + "Google review" is defensible;
   quote + name + five stars is not.
2. **Never ship `aggregateRating` without a verified figure and its source.** It is the one piece of
   fabricated content that carries a search-engine penalty on top of the credibility problem.

`08-qa/.tmp/content-gate.mjs` fails the build on any of it — ratings, star language, lender names,
soft-pull credit claims, before/after language, `aggregateRating`, the vendor's monthly figures, and
Unsplash URLs. Copy that `FORBIDDEN` list into your client's QA run; it survived the architecture
rebuild precisely because it is the check with real-world consequences.

A third rule fell out of the rebuild: **when a scene wants a before/after and you have no consented
photography, build the scene as a labelled illustration instead of dropping the scene.** Three
chapters here needed a visual transformation — the implant assembling, four posts seating into an
arch, a smile design resolving — and all three are SVG, captioned "Illustration, not a patient
photograph". That keeps the strongest moment on the page without pretending stock imagery is a
patient result.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
