# 2026-09-17, later still — The practice's Go High Level form, on /book, live

The ask, with the vendor paste attached: "We need to add this Go High Level form. This is our main
contact point and the phone number. On every page that we have a form, we need to include this."

**/book is the only page on this site with a form**, so that is where it went. The inert local form
it replaces is gone. Live on production and staging.

## Done (`f436db40`)

- **`site-src/ghl-form.mjs`** holds the vendor paste, once. Form `Gqnb0W1NH95MjROPRaLe`
  ("Contact Page"). Two deliberate edits to the client's paste: `height:100%` → `height:565px`
  (100% resolves against a wrapper with no height and the form collapses; 565 is the vendor's own
  `data-height`, which its script then overwrites with the real height) and `loading="lazy"`.
- **The slot.** `book.body.html` carries `<div class="form_embed" data-embed="ghl-form">`.
  `build-site.mjs` inlines the snippet into it for the static build; `push-site.mjs` replaces its
  children with a `brandklout.embed-origins.embed` module node carrying the same snippet.
  **This indirection is not optional:** Instatic's importer treats a non-YouTube `<iframe>` as a
  forbidden custom tag and publishes it as an empty div.
- **CSP.** The Embed plugin (`brandklout.embed-origins` 1.6.0, `embedPolicy: compatible`) widens
  the policy **only on the page carrying the block**. Confirmed live: `/book` serves
  `frame-src 'self' https:`, `/` still serves `frame-src 'none'`.
- **The consent bridge already installed on production** (`001-brandklout-consent-bridge.js`)
  picks the form up by its `/widget/form/` URL and appends the visitor's consent as `privacy_*`
  query parameters. Verified live: the frame URL carries them. Termly is **not** installed on this
  site, so the bridge writes the decline-equivalent values, which is its documented fallback.
  Staging has no bridge, so the params are absent there — that difference is the bridge, not us.
- **`js/11-form.js`** is now only a fallback: if the embed does not arrive, the slot gets the
  phone number instead of an empty box. The two "in person / by video" buttons are plain anchors
  again — they used to preselect a `<select>` that no longer exists.
- **Legal pages updated.** Both now name Go High Level / LeadConnector as the processor behind the
  form, and both gained a **Text messages** section, because the form collects SMS consent. The
  earlier run had deliberately left SMS out on the grounds that there was no texting program;
  the form supplied one. Sections renumbered (privacy 14, terms 19) — the table of contents is
  generated, so it followed.
- **New gate `site-src/form-test.mjs`**: loads a page, waits for the vendor frame, asserts the
  slot, the frame URL, its size, its fields and that typing sticks. `FAIL none` locally, on
  staging and on production.
- **`audit.mjs`** now exempts `[data-embed]` subtrees from the no-inline-styles rule (the vendor's
  paste is verbatim and not ours to reformat). **`all-pages.mjs`** allows the two embed hosts and
  ignores requests made *inside* a third-party iframe; every other off-origin request on every
  page still fails the gate.

### Pushes

Staging seq 7 then 8, production seq 13, each `{"publishedPages":13}`. Production backup before
the push: `.tmp/backup-prod-2026-09-17-preform/` (seq 12). The production push was interrupted
after `push-site` and **before** publish, so the draft carried the form while the live pages did
not for a few minutes; publishing again finished it.

### Gates

- Local: `audit` FAIL none · `all-pages` 156 assertions clean · `menu-test` 9/9 ·
  `drag-test` 3/3 · `form-test` FAIL none.
- Production: `verify-live` FAIL none (13 routes) · `css-parity` FAIL none · `form-test` FAIL none,
  frame 753×487 visible, `privacy_*` present · `compare-live book` **3 findings, all expected**:
  the live page has one extra `div.wz-embed` (the Embed block's own wrapper), which shifts the
  index-based runtime comparison by one. Do not "fix" them.

## Next — two things only the client can fix, both inside GHL

1. **The form's consent text names the wrong business.** It reads "I consent to receive
   non-marketing text messages from **Stone Surgical PLLC**" on the med spa's site, and the two
   practices are separate businesses. It also calls the messages "non-marketing" and then lists
   "special offers, discounts, newsletters" — that is marketing consent wording, and it is the
   wording an SMS carrier audit reads.
2. **The form's own Privacy Policy and Terms of Service links point to `https://www.example.com/`.**
   They are placeholders, live, on the practice's main contact point. They should point at
   `https://westlaketxmedspa.com/privacy-policy` and `/terms-of-service`.

Also open:

3. **Where do submissions go, and is that channel appropriate?** The old local form was inert
   precisely because nobody had answered that. The client has now chosen GHL, which answers it by
   decision rather than by analysis; the form asks for name, phone, email and SMS consent, and the
   page still tells visitors not to send medical history through it.
4. **Point the form's redirect at `/thank-you`** in GHL if the client wants the conversion
   endpoint used; the page exists and is noindex.
5. The earlier legal-page items stand: the client's review, the legal entity name, a contact email.

## Gotchas

- **Cloudflare Turnstile hides the form from every automated browser.** Console:
  `[Cloudflare Turnstile] Error: 600010`, and the vendor's script then leaves the iframe at
  `opacity:0; left:-9999px`. It happens under puppeteer headless AND headful, and it happens on
  **the client's own live form** at stonedentalimplantcenter.com — so a blank form under
  automation is not evidence of a broken embed. On the real domains it reveals in about 10s at
  1440 and up to ~25s at 390. `form-test.mjs` therefore asserts everything except visibility.
- **On `http://127.0.0.1` the form never reveals at all**, same cause. The local build is for
  layout; the form is proved on the deployed URL.
- **The vendor's script owns the iframe's height.** Anything this side sets is overwritten. The
  slot carries `min-height` only, to stop the page jumping while it loads.
- **`compare-live` reports 3 findings on /book forever now.** One extra wrapper div is the Embed
  block itself.
- **A page-level CSP widening is invisible until you look for it.** Check `/book` has
  `frame-src https:` and that another page still has `frame-src 'none'` after any publish.

## Version Control

Tracked. Committed with the work it describes.
