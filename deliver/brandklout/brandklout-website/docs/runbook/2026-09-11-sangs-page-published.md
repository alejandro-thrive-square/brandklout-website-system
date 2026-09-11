## 2026-09-11 (later): Sang's page published to the review link

### Done

- Source: `workflows/00-client-delivery-initialization/.tmp/client-handoff/preview (1).html`
  (43 KB, ChatGPT-built, one page, inline CSS and JS, Google Fonts, **no images**). Not edited.
- **Published** at <https://brandklout-production.up.railway.app>, `{"publishedPages":1}`, as one
  editable Instatic page (521 nodes, 194 style rules, 2 breakpoints). The admin is `/admin`.
- `21-instatic-upload` adapted for a one-page source: new `prepare-source.mjs` (splits the HTML into
  the `final-site/` shape the toolkit expects), `inspect-import.mjs`, `form-probe.mjs`,
  `ua-defaults.css`. Every script now points at `.tmp/site/` and the single `index` page, and the
  Stone assertions in `verify-live.mjs` are replaced with checks for this page (FAQ rule, `:root`
  tokens, script contents). The directive has a "Brandklout: the one-page run" section with steps
  and traps 35–38.
- DM Sans and Manrope installed into the instance's font library.
- **Gates, final run:** `verify-live` FAIL none · `css-parity` FAIL none · `visual-diff` 0.013% at
  1440 and 0.028% at 390 · `compare-live` 9 findings, all benign (the submit arrow span flattened
  into text, trap 38, and the intended `.js` class).
- Three real defects found and fixed on the way. First publish: `visual-diff` 4.0% / 8.7%,
  `css-parity` 3 missing. The fixes:
  1. The `h1` rule lost line-height, margin and max-width next to its `clamp()` (trap 35).
     `push-site.mjs` now carries a lossy rule whole.
  2. The browser's default `p`/heading bottom margins were gone, so the lower page was up to 49px
     higher (trap 36). Fixed with `ua-defaults.css`.
  3. The textarea was imported at `rows: 4` instead of 2 (trap 37).
- Section anchors, the FAQ toggle (answer opens to full height) and every form field's `name`,
  `type` and `required` all work on the published page.

### Flagged, NOT changed (Sang's copy, phase 1 publishes it as written)

- **The form sends nothing.** Sang's script shows "Prototype form submitted. Connect this form to
  your CRM / calendar in production." to the visitor. `form-probe.mjs` confirmed no submission
  request is made. A lead typed into it is lost.
- Other visible prototype text: "Replace this prototype text with your final privacy language."
  under the form, and "Prototype rebuild · Conversion-first architecture · Replace legal/contact
  links before production." in the footer.
- Privacy, Terms and HIPAA in the footer all link to `#`.
- Strategy notes rendered as copy: "That idea should become the emotional backbone of the site…",
  "Rather than treating YouTube as a separate content channel, each video should feed…", "The site
  should answer the objections your sales team hears most often…".
- Claims only Sang can stand behind: "60-day guarantee", "5.0★ BrandKlout reputation", "Henry
  Schein One API vendor listing", and the three client case studies with figures ($109K average
  monthly production, +60% collections, 200+ reviews pre-opening).
- The published `<head>` has no Open Graph tags and no JSON-LD (trap 31). The page's FAQ schema and
  `og:url` are dropped.

### Next

1. Send Sang the review link along with the flagged list. The form and the legal links have to be
   settled before this goes on the domain.
2. After his approval: the domain cutover via `20-instatic-domain-origins`.

### Gotchas

- **The Chrome gates need `puppeteer-core`, and the repo does not declare it.** Run
  `npm install --no-save puppeteer-core` at the worktree root. `npm install` alone does not bring it.
- From the second push on, `push-site.mjs --apply` needs `--force`. The page has authored content,
  and replace mode would otherwise refuse (trap 11). That is fine while this script is the only
  writer. Once anyone edits the page in the admin, `--force` throws their edits away.
- `form-probe.mjs` sees four same-host POSTs with random paths and aborts them. They are not the
  page's (the page carries only Instatic's runtime and `site.js`). Most likely it's the local
  network filter; see the NordVPN memory.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
