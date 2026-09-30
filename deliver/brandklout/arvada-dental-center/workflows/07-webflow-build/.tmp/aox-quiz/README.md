# All-on-X quiz combo — Webflow build

The three pages from `../../../04-design/.tmp/aox-quiz/` on the Arvada Dental Center site
(`693c51e685b19f0d0c149cab`), under `/ads-landing-pages/`, as **native elements and classes**.

| Page | Slug | Page id |
| :--- | :--- | :--- |
| Landing | `all-on-x-quiz` | `6abd1c475916198b01bfe90d` |
| Consult | `all-on-x-quiz-consult` | `6abd1c4f0b0c410a144a4850` |
| Thank-you | `all-on-x-quiz-thank-you` | `6abd1c00c6b0efd3cb30ff7f` |

Staging: `https://arvadadentalcenter.webflow.io/ads-landing-pages/<slug>`. **Published to the
webflow.io subdomain only.** Nothing here publishes to a custom domain.

## History, so it is not repeated

The first push (2026-09-30, morning) put each page in one Embed with its stylesheet in head code.
It rendered identically to the local build and **could not be edited in the Designer**; the user
rejected it the same day. `v2-native/PLAN.md` already said "no HtmlEmbed, no page/site custom
code". The rule stands: a page on this site is built from elements and classes. Custom code is
for behaviour only.

## Steps

```
node ../../../04-design/.tmp/aox-quiz/native/build.mjs   # writes native/ here
node push-native.mjs classes          # the aq- class layer, once (one call creates a style per rule)
node push-native.mjs assets           # stills not yet in the asset library (S3 upload, no Designer needed)
node push-native.mjs pages [key ...]  # rebuild page bodies, head and footer code
node push-native.mjs check            # read back: every class on the right number of elements, images
node push-native.mjs publish          # webflow.io ONLY
node parity.mjs                       # computed styles, local vs staging, element for element, 5 widths
node ../../../04-design/.tmp/aox-quiz/native/verify.mjs --staging   # the click gate, once per publish
```

`pages` clears the page body and rebuilds it, so **Designer edits to a page are lost on the next
`pages` run for that page**. Once the team is editing in the Designer, stop running it; the Designer
is then the source. `classes` creates styles and is for a fresh site: changing an existing class
goes through the Designer or `data_style_tool update_style`, not a second `classes` run.

## What the builder does that is not obvious

- **A class with no CSS rule is dropped from the element, silently.** Every class in the markup has
  a rule in `wf.css`; `build.mjs` checks both directions.
- **One class per element.** No combos: a combo name attaches to one base per build and the rest
  vanish with a `success` status. Variants are separate classes.
- **Selectors: single classes, `:hover`, `:focus`.** Attribute selectors are an error.
  Descendant selectors are not available. Queries must read `screen and (max-width: 991px)`.
- **`<label>` and `<input>` only exist inside a `<form>`** ("Field Label can only be placed in a
  Form"), and become a native Webflow form. The builder drops the class on `<form>` and on a
  checkbox, invents the checkbox label (text = the input's name) and leaves the submit saying
  "Submit": `push-native.mjs` sets those afterwards (`set_style`, `set_text`, `buttonText`).
- **`placeholder` cannot be set**; `site.js` sets it at runtime.
- **Inline SVG, `<details>`/`<summary>` arrive as DOM elements** with tags and attributes kept, and
  do take classes. They publish with the class written twice; `parity.mjs` compares the set.
- **Images bind to an asset only by the asset's `hostedUrl`** (from `get_asset`), not the CDN URL.
- **Font families are stored with the site's fallback stack** (`Centurygothic, Tahoma, sans-serif`),
  so `wf.css` writes the stack.
- **`asset_tool` (upload by URL) needs an open Designer session**; `create_asset` + the presigned
  S3 POST does not, with the field names translated back (`policy` -> `Policy`, ...).
- **28 KB of CSS goes in one call.** Markup above ~19 KB fails with an empty error, so bodies go
  in section by section.

## Things that are true of this site, not of the build

- **The Sienna accessibility widget rewrites every font size to a whole pixel** after load.
  `parity.mjs` blocks it to compare stylesheets; real visitors see the rounded sizes.
- **Call tracking rewrites every occurrence of the phone number**, in sentences too, with a
  rotating pool number. Never promise a caller ID on this site.
- **The consent script adds a "Cookie Preferences" link** next to the footer's privacy link.
- **Each staging page load with a fresh browser profile takes a call-tracking pool number.** Do not
  loop the staging gate.
- **A whole-site publish takes these pages live.** They are not drafts. With no webhook the quiz
  then shows its "call us" error, by design.
- **`aq-build-probe` is a draft scratch page** (`probe.mjs` uses it; the class layer went in through
  it). The API cannot delete pages; it is safe to delete in the Designer.

## `wfq.mjs`

`../v2-native/wf.mjs` no longer works: since 2026-09 the Webflow MCP wants `session_id` ("start"
once, then the `ses_` value it issues) and an `agent_id` on every call, and prefixes the first
reply with a text block that is not JSON. `wfq.mjs` carries both and keeps the session in
`.session.json` (ignored).

## Version Control

Tracked, under the root rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
`.session.json` is ignored.
