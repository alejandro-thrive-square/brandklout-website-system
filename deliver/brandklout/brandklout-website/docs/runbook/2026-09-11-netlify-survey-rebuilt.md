## 2026-09-11 (late afternoon): Sang's Netlify assessment rebuilt at /survey

Asked: "Can we recreate this survey?" about <https://bk21question.netlify.app/>. Alejandro's calls:
answers go where the Netlify one sends them, it replaces `/survey`, restyled in the site's look;
install the embed-origins plugin for that one host; verify with a **blocked** request, never a
real row.

### What the Netlify survey is (read from its deployed bundle, nothing submitted)

- A React (Vite) app titled "Brandklout 21-Point Assessment". Hero "Be Found Everywhere Your
  Patients Search", Sang's quote and video (`qxXc1GruLLY`), 21 yes/no questions in three groups
  of seven (Online Reputation · SEO & AI Search · Marketing Performance), all required; "Get My
  Results" flags any unanswered question and scrolls to the first; a pop-up asks Full Name, Email,
  Phone (all required, `alert` if empty); then "Thank You!" with a Calendly button.
- **Destination: SheetDB**, `POST https://sheetdb.io/api/v1/w8136dpdrs4st`, JSON
  `{fullName, email, phone, question_1…question_21, submittedAt}`. The sheet's columns (read-only
  `GET …/keys`) are exactly those. **The page makes no Zapier or webhook call.** If a Zap fires,
  it is triggered from the sheet, not by the page.

### Done

- `21-instatic-upload/overlay/survey/index.html`: the rebuild. Copy, questions, validation,
  endpoint, payload and Calendly link verbatim; the look is the site's (DM Sans/Manrope, ink,
  pill buttons, the founder card of the stories). `prepare-source.mjs` gained the **overlay**
  (`overlay/<path>` replaces the package file at that path; the package stays as received) and
  `visual-diff --source` compares an overlaid page with its overlay.
- **Plugin installed**: `brandklout.embed-origins` v1.5.1 (from `5b5e6137`) on the Brandklout
  instance, settings `connectOrigins: https://sheetdb.io`, nothing else. Every published page's CSP
  now reads `connect-src 'self' https://sheetdb.io`; nothing else changed (home keeps
  `frame-src 'none'`). `set-origins.mjs` in `18-instatic-embeds` still used the pre-rename id
  `webzite.embed-origins`; fixed to `brandklout.embed-origins`.
- Published, `{"publishedPages":7}`, seq 7. Same 7 routes; `/survey` is the new page.
- **Gates:** `verify-live` FAIL none (7/7 titles; new: `/survey` has 42 radios, `#contactForm`,
  and `sheetdb.io` in its CSP) · `css-parity` FAIL none · `visual-diff` survey 0.004% at 1440,
  0.012% at 390 (the YouTube player's own controls) · `--source` 0.000% · `compare-live` survey:
  1 finding, the `.js` bootstrap (benign, as on every page) · `form-probe`: 21 flagged on an empty
  try and scrolled to #1; 21/21 answered, bar 100%; pop-up opens; **the POST to SheetDB left the
  browser with exactly the 25 sheet columns as JSON** (CORS preflight passed, so SheetDB accepts
  this origin) and was aborted, so nothing reached the sheet.
- Replaced with it: the package's own Netlify-form survey, whose POST 404'd on Instatic (trap 42).

### Not changed, flag for Sang

- The Calendly link is `…/30min?month=2025-10`, a past month. Verbatim from his app.
- His Netlify app autoplays the video muted with a custom unmute overlay (YouTube iframe API);
  Instatic allows only same-origin scripts, so the rebuild uses the standard YouTube player.
- "Is your contact information is actively monitored…" (Q8) keeps his typo.
- The pop-up promises "detailed assessment results… to your email": nothing on the page sends
  one. Whatever does (the Zap?) is on his side of the sheet.
- Answers are PII going from the browser to SheetDB with a public API id, exactly as on Netlify.

### Next

1. Sang confirms the sheet (and its Zap) still receive rows once the domain moves. The first real
   visitor proves it; do not send a test row.
2. The home "Check my market" form still captures nothing.

### Gotchas

- `form-probe.mjs` must let SheetDB's `OPTIONS` preflight through and abort the POST: abort the
  preflight and the POST is never formed, so there is no payload to check.
- A CSP change from the plugin only reaches pages on the next publish.
- The plugin applies `connectOrigins` to every page, not just `/survey`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
