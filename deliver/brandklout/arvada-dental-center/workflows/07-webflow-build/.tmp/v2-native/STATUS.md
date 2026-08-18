# v2 rebuild — LIVE SLUGS TAKEN OVER, 18/18 VERIFIED

`node verify-v2.mjs` → **18/18 pass** against staging.

Every page is native Webflow elements with client-first `camp_` classes. **No HtmlEmbed, no Custom
Code element, no page or site custom code anywhere in this build.**

| kind | pages | elements | classes | template | content |
|---|---|---|---|---|---|
| ads landing | 6 | 469 | 126/126 | `_shared/page-template.tokens.html` | `content/<topic>.json` |
| consult | 6 | 226 | 79/79 | `_shared/consult-template.tokens.html` | `content/<topic>.consult.json` |
| thank-you | 6 | 187 | 66/66 | `_shared/thankyou-template.tokens.html` | `content/<topic>.ty.json` |

Page ids: `v2-pages.json`. Staging: `https://arvadadentalcenter.webflow.io/<original-slug>`.

## The v2 pages now own the original slugs

`promote-v2.mjs` moved all 18 onto the live ad URLs, so no campaign needs repointing.
Each old page was renamed `<slug>-v1-archived`, retitled `… (v1 archived)`, and set `draft: true`
(which stops it publishing). **This MCP has no `delete_page` action at all**, so archiving is the
only route — and it is the safer one, being fully reversible. Actually deleting them is a Designer
action if wanted.

Re-run `node promote-v2.mjs --dry` any time; it is idempotent and reports what it would do.

## Spacing is gated too

`node verify-spacing.mjs <page> [widths]` compares COMPUTED margin/padding/gap between the local
source and the published page, element for element. Currently clean on all three page types at
1440 and 767.

## What the gate checks

`verify-v2.mjs` compares each **published** page against its own
`04-design/.tmp/v2/<page>/body.html`: every design string present verbatim (text nodes *and*
`value`/`placeholder`/`alt` attributes), the full class inventory, image count, the video element
on ads pages, no leftover `{{token}}`, and no copy exclusive to another topic.

Class layer gates separately: `verify-classes.mjs` → camp.css 130 selectors / 783 declarations and
camp-convert.css 26 / 253, all present at every breakpoint.

## Two things still need a human in the Designer

Both are Webflow API limitations, not build defects, and both are one-off:

1. **The YouTube URL on the six ads pages.** The native `YouTubeVideo` element is created and in
   place, but its `video` setting is unreachable over the Data API — `static_text`, `static_video`,
   `static_json` and `static_link` are all refused with *"Invalid value for setting video: expected
   video"*. Paste `https://www.youtube.com/watch?v=GefKg1nID9w` into each.
2. **Form field placeholders read "Example text"** on the six consult pages. A `FormTextInput`
   exposes no `placeholder` setting, and setting it through `attributes` is refused as a reserved
   name. Every field has a real visible label above it, so the form is usable as it stands.

## Open questions for the user

1. **Call tracking assigns a number per page** — emergency renders `(983) 955-0387`, implants
   `(983) 900-6463`, against a source of `(303) 421-7611`. The script is working as designed, but
   it has never seen these `-v2` slugs; confirm the pool maps them to the right campaigns.
2. **Relume utility values vs the client's design.** `padding-section-large` is 112px against the
   design's 104px, `heading-style-h1` 56px against 74px. The build keeps the **design's** values in
   `camp_` classes and takes client-first for structure, naming and reuse. Snapping to the style
   guide instead is a visible change and therefore the user's call.
3. **The old pages are untouched.** Nothing has been published to `arvadadentalimplants.com`;
   every publish in this build was `publishToWebflowSubdomain:true, customDomains:[]`.

## Rebuilding any page

```
node render-page.mjs <topic> [ads|consult|ty]     # local source from template + content
node build-page.mjs <pageId> <body.html> --clear  # markup only; classes resolve by name
node fix-form-button.mjs <topic>                  # consult pages only — submit label
node verify-v2.mjs [page …]
```

`wf.mjs` now backs off and retries on 429. `GET /v2/assets` rate-limits hard, and once it does even
`get_all_elements` fails because it reads assets server-side — that is what interrupted earlier
runs mid-build.
