# v2 rebuild — status at the consult/thank-you milestone

**All 18 v2 pages now exist in Webflow and are built.** Page ids: `v2-pages.json`.

## Page types

| kind | pages | template | content |
|---|---|---|---|
| ads landing | 6 | `_shared/page-template.tokens.html` | `content/<topic>.json` |
| consult | 6 | `_shared/consult-template.tokens.html` | `content/<topic>.consult.json` |
| thank-you | 6 | `_shared/thankyou-template.tokens.html` | `content/<topic>.ty.json` |

All three share `content/_base.json` (the practice-wide facts) and the one `camp_` class
vocabulary: `camp.css` (109 base + 18 combos) plus `camp-convert.css` (27 more for the form and
the two new page shapes).

The consult and thank-you content is **generated** by `make-convert-content.mjs` from one compact
spec per topic — these pages say almost the same thing on every topic, and hand-copying twelve
files invites exactly the drift `_base.json` exists to prevent. Edit the spec, not the JSON.

## The consult form is a real Webflow form

`data_whtml_builder` turns `<form>` / `<input>` / `<textarea>` / `<button>` into
`FormWrapper > FormForm > FormTextInput / FormTextarea / FormButton`, and adds
`FormSuccessMessage` and `FormErrorMessage` itself. Submissions therefore go to **Webflow's own
form handling** — no custom code, no external endpoint.

That also closes an open problem from the previous build: its form was not a Webflow form at all,
it `preventDefault()`ed and pushed to `window.__arvadaLeads`, so **no lead ever left the page**.

**A `FormSelect`'s `<option>` list is unreachable from the Data API.** No `options` setting is
exposed, the options simply do not travel, and the control ships empty while the build reports
`success` — it shipped that way on all six consult pages before this was caught. Replaced with
radio inputs, which arrive as `FormBlockLabel > FormRadioInput + Span` and keep their text.

## Remaining to finish this milestone

1. Rebuild the consult pages for **aox, veneers, emergency, dentist-near-me, next-door** with the
   radio markup (implants is already rebuilt). `node build-page.mjs <id> <body.html> --clear`,
   ids in `v2-pages.json` under `<topic>.consult`.
2. Publish to the subdomain only, then `node verify-v2.mjs` — it covers all 18 pages.
3. Screenshot a consult and a thank-you page at 1440 and 767 to check them by eye.

**Pace the API.** `GET /v2/assets` rate-limits hard, and once limited even `get_all_elements`
fails because it reads assets server-side. The asset URL cache (`asset-urls.json`) removes the
per-page lookups, but long unbroken runs still trip it. Build two or three pages at a time.
