# 2026-10-04 — GHL forms without layout shift: CSS replaces the consent-field hide script

## Done
- **Cause found:** GHL serves the form HTML with the 11 consent fields (`privacy_*` +
  `marketing_disclosure_version`) visible. On the Mason Park forms, a Custom HTML element at the
  bottom of each form held a script that hid them by label text, but it ran only after GHL's
  JavaScript loaded (2–3 s). The form loaded ~2,250px tall, then collapsed to ~1,100px. Turnstile
  then grew from 27px to 100px.
- **`deliver/process/tools/ghl-forms/no-shift.css`** goes at the top of each form's Custom CSS, which
  GHL serves in the page `<head>`. It hides the 7 fields with `data-q="privacy_…"`, plus everything
  after the Privacy | Terms links (the 4 consent dropdowns have no attribute CSS can match), and it
  reserves 100px for the captcha.
- Verified in headless Chrome with the script switched off and the CSS on, on Mason Park *Contact*
  `JuzM9SxuJMPDMwfO6cgj`, *Invisalign* `jRr3J74MVYjrYAsp4zZD` and *Kids* `pyYcEmfIvtv5LwB1s4X6`, at
  1348px and 375px. Result: 0/11 fields visible at first paint, no real field hidden, URL prefill
  still fills dropdowns, checkboxes and text fields, and the largest jump fell from ~1,150px to
  ≤36px. The captcha's 100px was measured in a signed-in Chrome.
- SOP: README standard rows plus a *No layout shift* section and a gotcha; Codex template step (5);
  `check-ghl-form.mjs --standard` fails a form with no `no-shift.css`, with a hide script still in
  it, or with a consent field above the links. Pointer added in `termly-ghl-consent.md`.

## Next
- Roll out to every form: paste `no-shift.css`, delete the hide-script Custom HTML element, move the
  consent fields below the links where needed, then gate. The three Mason Park forms fail the new
  checks today (no CSS, script present).
- Measure the site side: the embed's `data-height` comes from the builder (Mason Park `2442`, because
  it counts the hidden fields). Check whether `form_embed.js` sizes the iframe to it before resizing.

## Gotchas
- The 4 consent **dropdowns** carry no `data-q`; only their label text names them. CSS can reach
  them only by position (after the links), so the field order is now part of the standard.
- One Kids-site link ends in `/terms-of-service/` with a trailing slash, so the selector uses
  `href*=`, not `href$=`.
- Headless Chrome gets an interactive Turnstile challenge plus an error line (136px); a real
  visitor's captcha is 100px. Never size the reserve from automation.
