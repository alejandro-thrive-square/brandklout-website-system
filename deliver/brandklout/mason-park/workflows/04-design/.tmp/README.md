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

## Content integrity

Every price, name, credential, review and clinical claim is the client's own, sourced in
[content-intake-summary.md](../../01-content-intake/.tmp/content-intake-summary.md). Nothing is
invented. Specifically:

- **Real Google reviews** with real reviewer names, not the lorem ipsum the reference page ships.
- **No aggregate review count** is claimed — the widget exposes the 5.0 rating but no total.
- **No before/after gallery**, because no real before/after images exist for this practice.
- **No "Neighborhood Favorite" award** — that belongs to the sibling Grand Mission page.
- **No insurance carrier logos** — the reference's carrier list is Grand Mission's, not Mason Park's.

## The phone number

All three pages read the number from one place, `MPD.TRACKING_PHONE` in `shared/mpd.js`, which
currently falls back to the practice's public number **(281) 769-8878**.

The previous agency's page used **(281) 767-8698**, which appears in no public listing and is almost
certainly their call-tracking number. Swapping in the practice's own GHL tracking number is a
one-line change:

```js
TRACKING_PHONE: "(281) 555-0000",
TRACKING_PHONE_E164: "+12815550000",
```

Until that is confirmed the pages ship a number that definitely reaches the practice, rather than one
that may route to a third party's tracking pool.

## Forms

The lead form posts JSON to `MPD.WEBHOOK_URL`, currently the placeholder
`{{GHL_INBOUND_WEBHOOK_URL}}`. While unconfigured the form **tells the visitor plainly** that the
endpoint is not connected and gives them the phone number — it never displays a false success. On
success it redirects to the thank-you page.

The payload carries the offer name, the source Asana GID, the intent answer, an E.164 phone number
and any UTM/gclid/fbclid parameters present on the URL.

## Verification

Functional, not just visual — screenshots cannot prove a form advances or an accordion opens:

```bash
node ../../08-qa/.tmp/verify.mjs
```

**50/50 checks passing** across all three pages: image loading, font application, phone consistency,
scroll reveals, two-step form advance, validation, phone auto-formatting, honest failure on the
unconfigured webhook, payload contents, FAQ accordion, the thank-you page's four spec sections,
open/closed state, mobile overflow at 390px, sticky bar, and reduced-motion (nothing stuck invisible).

## Not done here

- **Nothing has gone to Webflow.** No client has a grant, and local approval comes first.
- No analytics or conversion tag is installed. The previous agency's GTM container must not be
  reused; the practice's own container drops into the marked slot on the thank-you page.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). HTML, CSS, JS and
docs are committed; images are not.
