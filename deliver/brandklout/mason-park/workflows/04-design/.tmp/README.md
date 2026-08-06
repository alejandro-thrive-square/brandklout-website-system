# Mason Park Dental — landing page packages

**Source Asana parent task**: `1217040406855582` —
[Landing Page - Mason Park](https://app.asana.com/1/1210572425689866/task/1217040406855582)
**Built**: 2026-08-05 · **Status**: built locally, verified, **awaiting review**

Three self-contained coded HTML/CSS/JS packages. Open any `index.html` directly in a browser — no
build step, no server.

| Page | Folder | Asana task GID |
| :--- | :--- | :--- |
| Invisalign<sup>&reg;</sup> — $1,000 off | [`invisalign/`](./invisalign/index.html) | `1217133289235652` |
| $189 New Patient Special | [`new-patient-special/`](./new-patient-special/index.html) | `1217162605683021` |
| Thank you | [`thank-you/`](./thank-you/index.html) | `1217040406855602` |

## Layout

```
04-design/.tmp/
├── shared/                  <- single source of truth
│   ├── mpd.css              design system: tokens + components
│   ├── mpd.js               behaviour + the CLIENT CONSTANTS block
│   ├── img/                 the client's own photography (gitignored)
│   ├── fetch-assets.mjs     re-downloads img/ from the client's site
│   └── sync.sh              copies shared/ into each page package
├── invisalign/{index.html, assets/}
├── new-patient-special/{index.html, assets/}
└── thank-you/{index.html, assets/}
```

Edit `shared/`, then run `bash shared/sync.sh` to push changes into all three packages. Each page
folder stays self-contained so it can be opened, zipped or handed over on its own.

> [!IMPORTANT]
> `shared/img/` and the copies under each `assets/img/` are **gitignored** — the repo excludes all
> binary and media assets. After a fresh clone the pages will show broken images until you run:
>
> ```bash
> node shared/fetch-assets.mjs && bash shared/sync.sh
> ```
>
> The images cannot simply be hotlinked from the client's site: `bestdentistinkatytx.com` sits
> behind a SiteGround bot wall that returns a challenge page to cross-origin image requests, so
> every hotlinked image renders broken. `fetch-assets.mjs` drives a real browser to clear the wall,
> then pulls the files from the page's own origin.

## Design

The visual design is original. Per
[ASANA-DISPATCH.md](../../../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing),
the reference URLs supplied **structure and copy angles only** — the section order was extracted into
[structure-briefs.md](../../01-content-intake/.tmp/reference-captures/structure-briefs.md) and the
design authored from the practice's own brand.

Tokens come off the client's live site: their warm sand band (`#c3a98e`), slate utility bar, deep
ink, and a warm paper ground, with DM Sans (which they already use) paired with Outfit for the
wide-tracked geometric caps their licensed display face suggests. The result is deliberately calm and
editorial rather than the neon-yellow dental-PPC look of the previous agency's page — these compete
against a dozen identical templates, so looking like them is the failure case.

Conversion structure is still doing its job: an offer strip, a price block with the struck-through
regular fee, a two-step form that opens with a low-commitment intent question rather than demanding a
phone number, real Google reviews, a transparent price ladder, and a sticky call/book bar on mobile.

## Motion

The motion layer lives entirely in `shared/mpd.css` and `shared/mpd.js`, so all three pages share one
system. It is driven by `data-anim` attributes that JS assigns at runtime — **the page markup carries
no animation classes**, which is why content and section order were able to stay exactly as they were.

| Primitive | Where it runs |
| :--- | :--- |
| `mask` | Headline lines and every section heading rise out from behind a hard edge |
| `rise` | Eyebrows, leads, checklists, steps, trust marks |
| `wipe` | Photography uncovers itself top-to-bottom |
| `scale` | Card grids, reviews and team portraits settle in, staggered |
| `rule` | Hairlines draw across — the step connectors and the struck-through regular price |

Plus: a staged hero entrance on its own clock (it never waits for a scroll), the headline price
counting up to its exact published figure, a scroll-progress hairline, gentle parallax on
photography, pointer-following sheen on buttons, and FAQ answers that open with height instead of
snapping.

**No pinning and no scroll-jacking.** The page moves at the speed the visitor scrolls it.
Everything animates on transform and opacity only, so it stays on the compositor.

### Motion never buries the offer

- The **offer rail** (`.offer-rail`) surfaces once the hero leaves the viewport and carries the
  offer, the page's tracking number and a booking CTA. It is fixed, so all three are one tap away at
  any scroll depth on desktop.
- On mobile the existing **sticky call/book bar** does the same job.
- The **header is sticky** on every page and carries the phone number and a CTA.
- The hero — price, offer chips and form — is marked in on load and is never gated behind a scroll.

### It fails safe

The hidden states are all gated behind `html.js`. An inline head script arms that class before first
paint, with a 3-second failsafe that removes it if `mpd.js` never runs. The motion module is also
wrapped in its own `try/catch` that strips `html.js` on error. **Any failure degrades to a plain,
complete, fully readable page — never a blank one.**

A note on the observer: `IntersectionObserver` samples frames, so a fast flick-scroll can carry a
section past the viewport between samples and it is never reported — leaving it permanently
invisible. A throttled scroll sweep is therefore authoritative: anything that has reached or passed
the viewport is shown whether or not the observer saw it. This was a real bug the tests caught, not a
theoretical one.

### Reduced motion

`prefers-reduced-motion: reduce` removes the motion, not the content. Masks unclip, wipes drop their
`clip-path`, transforms reset, the ambient hero drift stops and the price is written directly at its
final value. The suite asserts both halves of this: nothing is left hidden **and** no transitions are
still running.

## Content integrity

Every price, name, credential, review and clinical claim is the client's own, sourced in
[content-intake-summary.md](../../01-content-intake/.tmp/content-intake-summary.md). Nothing is
invented. Specifically:

- **Real Google reviews** with real reviewer names, not the lorem ipsum the reference page ships.
- **No aggregate review count** is claimed — the widget exposes the 5.0 rating but no total.
- **No before/after gallery**, because no real before/after images exist for this practice.
- **No "Neighborhood Favorite" award** — that belongs to the sibling Grand Mission page.
- **No insurance carrier logos** — the reference's carrier list is Grand Mission's, not Mason Park's.

## Phone numbers — call tracking is PER PAGE

The outgoing vendor ran **a different tracking number on each landing page**, sharing one GTM
container. Both originals are in
[`asana-context/attachments/`](../../01-content-intake/.tmp/asana-context/attachments/):

| Page | Number | Source |
| :--- | :--- | :--- |
| Invisalign | **(281) 767-8698** | vendor original |
| New Patient Special | **(281) 688-1610** | vendor original |
| Thank you | (281) 769-8878 (public fallback) | no vendor original exists |
| Practice's public number | (281) 769-8878 | live site |

Unifying these would destroy per-campaign call attribution, so each page declares its own via
`MPD.TRACKING` in `shared/mpd.js`, keyed by the page's `<body data-page-key>`:

```js
TRACKING: {
  invisalign:            { display: "(281) 767-8698", e164: "+12817678698" },
  "new-patient-special": { display: "(281) 688-1610", e164: "+12816881610" },
  "thank-you":           null,   // falls back to the public number
},
```

The **thank-you page is shared by both landing pages**, so it cannot have one number baked in. The
form appends `?src=<page-key>` on redirect and the thank-you page renders that campaign's number,
keeping the call attributed at the last step. An unknown or spoofed `src` falls back to the public
number rather than injecting an arbitrary one.

> [!WARNING]
> Ownership of the two tracking numbers is **unconfirmed** — the outgoing vendor provisioned them, so
> they may no longer route to the practice. **Dial both before any spend starts.** If either is dead,
> set its entry to `null` and it immediately falls back to the public number.

## Forms

The lead form posts JSON to `MPD.WEBHOOK_URL`, currently the placeholder
`{{GHL_INBOUND_WEBHOOK_URL}}`. While unconfigured the form **tells the visitor plainly** that the
endpoint is not connected and gives them the phone number — it never displays a false success. On
success it redirects to `../thank-you/index.html?src=<page-key>`.

The payload carries the offer name, the source Asana GID, the intent answer, the visitor's E.164
phone number, the page key, the tracking number that page was displaying, and any
UTM/gclid/fbclid parameters present on the URL.

## Verification

Functional, not just visual — screenshots cannot prove a form advances or an accordion opens:

```bash
node ../../08-qa/.tmp/verify.mjs
```

**81/81 checks passing** across all three pages: image loading, font application, the correct
page-specific tracking number, `?src=` inheritance on the thank-you page (including the spoofed-src
fallback), two-step form advance, validation, phone auto-formatting, honest failure on the
unconfigured webhook, payload contents, FAQ accordion, the thank-you page's four spec sections,
open/closed state, mobile overflow at 390px and the sticky bar.

Motion specifically:

- **the tab is foregrounded** — a background tab freezes transitions, `IntersectionObserver` and
  `requestAnimationFrame`, which reports working motion as broken. The runner passes
  `--disable-renderer-backgrounding` and friends, calls `Page.bringToFront`, and then *asserts*
  `document.visibilityState === "visible"` so a throttled run can never be mistaken for a page defect
- no animated element left hidden after a full-page scroll — checked on opacity, transform,
  `clip-path` and the mask inner, not just a class name
- hero content visible without scrolling
- the price counts up to exactly its published figure
- scroll progress tracks the page
- the offer rail surfaces at depth carrying offer + tracking number + booking CTA
- under reduced motion: content fully visible **and** motion genuinely disabled rather than shortened

## Not done here

- **Nothing has gone to Webflow.** No client has a grant, and local approval comes first.
- No analytics or conversion tag is installed. The previous agency's GTM container must not be
  reused; the practice's own container drops into the marked slot on the thank-you page.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). HTML, CSS, JS and
docs are committed; images are not.
