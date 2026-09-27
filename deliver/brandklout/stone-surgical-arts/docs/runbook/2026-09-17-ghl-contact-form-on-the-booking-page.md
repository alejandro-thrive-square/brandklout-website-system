# 2026-09-17, later — The Go High Level contact form on the booking page

The practice's own GHL form replaces the hand-built request form on `/book`, which had no endpoint
and was intercepted in JavaScript so it could not look like it had sent anything. Booking page only:
the four procedure pages carry a self-check tick-list, which stores and sends nothing and is not a
contact form. Phone stays (817) 918-3666.

## Done

- **The form is live on staging**, `https://staging.dfwsurgicalarts.com/book`. It boots, becomes
  visible, auto-sizes to ~700px at 1440 and ~980px at 390, and the Submit button is reachable.
- **The route in is the Embed block**, `brandklout.embed-origins` 1.6.0, `compatible`, already
  installed here. The booking page's published CSP is widened for it; every other page is
  byte-for-byte as locked down as before (checked `/index`: `script-src 'self' cdn.jsdelivr.net`).
- **The pipeline gained a step.** `site-src/pages/book.body.html` carries the vendor snippet
  verbatim inside a marker div; `build-import-input.mjs` empties that marker; the new
  `21-instatic-upload/place-embeds.mjs` swaps the emptied node for the plugin's module node,
  reading the snippet back out of the built page. **Run it after every `push-site.mjs --apply`,
  before the publish.** The directive's execution steps now list it as step 5.
- Removed with the old form: its field, consent and status CSS, and `form()` in `js/12-elevate.js`.
  `css/62-embed.css` replaces them, mirroring the Embed module's own stylesheet.
- Gates: build, audit, check-copy, all-pages (54 x 3) and blog-validate clean;
  `verify-live.mjs` against staging `FAIL none`; **`compare-live.mjs book` says `no differences`**.

## Next

- **Three things belong to the practice, inside Go High Level, and cannot be fixed from here:**
  1. the form's own footer links, "Privacy Policy" and "Terms of Service", both point at
     `https://www.example.com/`. They should point at `/privacy-policy` and `/terms-of-service`.
  2. its SMS consent text names **"Stone Surgical PLLC"**. The entity everywhere else, including
     both legal pages, is **Stone Surgical Arts PLLC**.
  3. its styling is GHL's default, including a blue Submit button that is not a colour on this site.
- **Nobody has submitted the form end to end.** Doing it from here would put a fake lead in their
  CRM. Someone at the practice should send one and confirm it arrives.
- Promote to production with the legal pages, once the text is approved.

## Gotchas

- **The vendor script is not optional.** See trap 32: a bare frame posts `["iframeLoaded"]` and
  waits, and only reports its height once `form_embed.js` answers. Without it the frame stays at
  565px and cuts off its own Submit button. The Embed module's `auto` runtime understands the
  height message but never sends the answer, so URL mode alone does not work for this vendor.
- **`networkidle0` never arrives on a page with a live widget.** The booking page timed out at 60s
  and took the whole `all-pages.mjs` run down with it. That gate now waits for the widget to be
  visible instead, capped at 25s.
- **Judge a request or a console line by WHERE IT CAME FROM.** The widget's own frame loads a dozen
  hosts and logs a styled line Chrome reports as an error; both failed the page while the page was
  perfect. `all-pages.mjs` now ignores anything whose frame or console location is not ours, and
  allows exactly the hosts the page's own marker names.
- **Leaked headless Chrome is worth checking before believing a browser gate.** Two separate
  "failures" here — the widget never appearing, and a navigation timeout — were seven and four
  orphaned headless Chrome roots from earlier interrupted runs. `Get-CimInstance Win32_Process`
  filtered on `--headless`, kill those only, never every `chrome.exe`: the user's own browser is
  in that list.
- **`new RegExp` with a template literal eats the escapes.** `` `\sdata-embed=...` `` in a template
  literal is "sdata-embed", and the pattern silently matches nothing. Build such patterns by
  concatenating single-quoted strings with doubled backslashes.

## Version Control

Tracked. Committed with the work it describes.
