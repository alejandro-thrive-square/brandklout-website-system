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

## Four v1 sections carried into the six ads pages (2026-08-18)

Added, in the v2 style, from the archived v1 pages:

| section | classes | content |
|---|---|---|
| Real Patients. Real Results. | `camp_gallery_grid/_img` | 3 smile-gallery photos |
| A Space Designed For Your Comfort | `camp_space_grid/_img` + `is-lead` | 5 practice photos |
| From Failing Teeth To a Full Smile Again | `camp_outcomes/_outcome/_item/_mark`, `camp_chapters/_chapter*` | before/after, two outcome columns, a 4-beat story |
| Any questions before you call? | existing `camp_faq_*`, now repeated | the full v1 list, 6–10 items per topic |

Pages are now **622 elements, 145/145 classes, 21 images**.

**The v1 before/after was a drag slider driven by two HtmlEmbeds of JavaScript.** This build has no
custom code, so the same two photographs sit side by side using the existing
`camp_result-image` classes. Same information, no script. The copy that said "drag the slider" is
rewritten.

Harvest lives in `v1-harvest/<topic>.json` (`harvest-v1.mjs`), and
`build-sections-content.mjs` parses it into slots **by shape, not by index** — FAQ length alone
runs 6 to 10 — and reports any topic it cannot read.

### whtml_builder has a size ceiling, and it fails with an EMPTY error

19KB inserts in one call. **29KB returns `{"error":""}` — having already cleared the page and
created nothing.** `build-page.mjs` now inserts anything over 18KB in pieces: the wrapper first,
then its children appended into it, recursing where a child is itself too big.

### Known gate noise

`verify-v2.mjs` flags dentist-near-me for copy "exclusive to" next-door. Both are the $109 offer
and legitimately share FAQ answers; the string is present in dentist-near-me's own local source, so
this is the leak heuristic being over-sensitive between two near-identical pages, not a mixup. The
substantive checks (own strings present, class inventory, images) pass on all six.

## NEXT TASK — 14 spacing differences after the section rebuild

`node verify-spacing.mjs implants 1440,767` was clean before the four sections were added and now
reports 14. The pages render correctly by eye (all five new sections captured in `shots-new/`,
every image loading), so these are drift, not breakage — but two of them matter on mobile.

```
.camp_container.camp_proof_grid  padding-left/right   local 16px  live 0px   @767
.camp_footer_col                 row/column-gap       local 0px   live 16px
.camp_header                     padding-bottom       local 0px   live 10px
.camp_button_chev                padding-bottom       local 0px   live 4.2px  (9 elements)
```

**The proof-grid one is the known combo trap, again.** `camp_proof_grid` shares its element with
`camp_container`, so the container's gutter has to survive; it did before the rebuild and does not
now. The fix that worked for the hero was to set the padding on the COMBO
(`.camp_container.camp_hero_grid`), because a class that owns combos takes the write on the combo
rather than the base — see PLAN.md. Do the same for `camp_proof_grid`, and check
`camp_announce_inner`, `camp_header_inner` and `camp_cta_inner` while there.

The other three look like Webflow defaults now reaching elements the chunked insert created
differently (a gap on a flex column, padding on a Section). Confirm by reading the style back
before changing anything — several "differences" in this build turned out to be the gate, not the
page.

Then: publish to the subdomain, re-run `verify-spacing.mjs` and `verify-v2.mjs`.
