# All-on-X quiz combo — Webflow build

Puts the three pages from `../../../04-design/.tmp/aox-quiz/` on the Arvada Dental Center site
(`693c51e685b19f0d0c149cab`), under `/ads-landing-pages/`.

| Page | Slug | Page id |
| :--- | :--- | :--- |
| Landing | `all-on-x-quiz` | `6abd1c475916198b01bfe90d` |
| Consult | `all-on-x-quiz-consult` | `6abd1c4f0b0c410a144a4850` |
| Thank-you | `all-on-x-quiz-thank-you` | `6abd1c00c6b0efd3cb30ff7f` |

Staging: `https://arvadadentalcenter.webflow.io/ads-landing-pages/<slug>`. **Published to the
webflow.io subdomain only.** Nothing here publishes to a custom domain.

## How a page is put together

This is a custom-code page, not a native one. The quiz is script and the stylesheet uses
pseudo-elements, `clamp()` and masks, which `data_whtml_builder` refuses, so the v2 native route
(`../v2-native`) cannot carry it. Each page is three parts, generated into `out/` by the design
folder's `build.mjs`:

| Part | Goes to | Tool call |
| :--- | :--- | :--- |
| `<key>.head.html` — `noindex` + the stylesheet | page head custom code | `data_scripts_tool` › `set_page_freeform_code` |
| `<key>.embed.html` — the markup | one Embed element in the body | `data_element_builder` (`HtmlEmbed`), then `data_element_settings_tool` › `set_settings` key `code` |
| `<key>.footer.html` — the scripts | page footer custom code | `set_page_freeform_code` |

To change anything, edit the design folder's `build.mjs` or `src/`, rebuild, and push. Editing the
Embed in the Designer works, and the next push overwrites it.

```
node ../../../04-design/.tmp/aox-quiz/build.mjs   # regenerate out/
node push.mjs                                     # write all three parts of all three pages, read each back
node push.mjs --publish                           # ... then publish to webflow.io ONLY
node parity.mjs                                   # computed styles, local vs staging, element for element
node ../../../04-design/.tmp/aox-quiz/verify.mjs --staging   # the click gate, against staging
node pages.mjs                                    # refresh pages.json (read-only)
```

`push.mjs` is idempotent; `pages-built.json` holds the page and Embed ids.

## Things that are true of this site, not of the build

- **Every class is prefixed `aq-`.** 49 of the design's 122 class names already exist in the site
  stylesheet (`.hero`, `.btn`, `.quiz`, `.faq`, `.step`, `.field`, `.wrap` ...).
- **A reset block opens the stylesheet**, for the bare-tag rules the site declares (`li` margins,
  `label` weight, `blockquote` type, `img` alignment, `sup`, gold underlined links). `parity.mjs`
  is what found them, and is the gate if the site stylesheet changes.
- **The Sienna accessibility widget rewrites every font size to a whole pixel** after load
  (15.2px becomes 15px). That looks exactly like a stylesheet leak and is not; `parity.mjs` blocks
  the widget to compare stylesheets. Real visitors see the rounded sizes, as on every page here.
- **Call tracking rewrites every occurrence of the phone number** with a rotating pool number,
  in sentences too. "We'll call you from (720) 419-3699, save that number" published as a false
  statement, so the pages promise the call and no longer name a caller ID.
- **The consent script adds a "Cookie Preferences" link** next to the footer's privacy link. It is
  meant to.
- **Each staging page load with a fresh browser profile takes a call-tracking pool number.** Do
  not loop the staging gate.
- **An empty lead webhook fails closed off staging.** On `localhost` and `*.webflow.io` the quiz
  walks through to the thank-you page and sends nothing (preview). On any other host it shows the
  "call us" error instead, so a whole-site publish cannot turn this into a form that eats leads.

## `wfq.mjs`

`../v2-native/wf.mjs` no longer works: since 2026-09 the Webflow MCP wants `session_id` ("start"
once, then the `ses_` value it issues) and an `agent_id` on every call, and prefixes the first
reply with a text block that is not JSON. `wfq.mjs` carries both and keeps the session in
`.session.json` (ignored).

## Version Control

Tracked, under the root rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
`.session.json` is ignored.
