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

## Applied (later 2026-10-04)
- Codex (`gpt-6.1-sol`, one form per run) pasted the CSS and deleted the hide script on Mason Park
  *Contact* `JuzM9SxuJMPDMwfO6cgj` and Mason Park Kids *Contact* `pyYcEmfIvtv5LwB1s4X6`. Both gate ok
  and `site-style --compare` ok. Live: the same height from the first paint to fully loaded (1116px at
  1348px wide, 1296px at 375px), 0/11 consent fields ever visible, prefill intact.
- `no-shift.css` is now unquoted, and the gate accepts either form (GHL strips the quotes on save).

- Same on the Mason Park landing forms *Invisalign* `jRr3J74MVYjrYAsp4zZD` and *New Patient Special*
  `jEXtvRc1ObkKd1QvmSGn`. Their consent text rendered Inter 16px / Roboto 14px on phones (GHL's mobile
  copy, never styled by Custom CSS) and reflowed 36px on load. A second Codex run appended the
  Contact form's `.tnc` / `.terms-text-container` rule, so they now show Nunito Sans 14px. Both gate
  `--landing` ok and style ok. Live: desktop holds its height; phones nudge 12px late (from 36px).
- `site-style.mjs --compare` now also renders the form as a 375px phone (device emulation: a headless
  window will not shrink that far) and fails consent text that is not the site font at 14px. Both
  consent probes count only visible elements, since the hidden desktop copy fooled them.

- **Every other Instatic site** (crawled each production site for `widget/form` ids; up to 400 pages
  each, sitemap plus links). Same two Codex steps on Dr. Nahlah *Alexandria* `g7FeioS7e7quSCxIQHRw`
  (location `2TREkW8S3atQcs063Pqq`) and *McLean* `axgcdqEPUFoHF8Dt5Nji` (`xJDu1mFoW5jFYTNqmuk7`), IFA
  `cxtQ5q29TfUr3cYlMmDB` (`dSz8gLnp5vds5AZOMmuq`), Stone Surgical Arts `Nzf3xQVLhgMlABuVMxCN`
  (`AtD362nKfN6w4mwob4iV`) and Stone Med Spa `Gqnb0W1NH95MjROPRaLe` (`hNRZyhDNM7ZTpBZx63xO`). All five now
  pass the no-shift checks. Live: 0/11 consent fields ever visible, prefill intact; the ~1,000px
  collapse is gone.
  Not in scope: Brandklout's own form (`coQOO0l1dANhwguaHade`, no consent fields); West LA (GHL forms
  not delivered yet); Livewell, Oceanic and Hackensack (production 404, stagings embed no form).

## Styling step on the five (later 2026-10-04)
- One Codex run per form (`gpt-6.1-sol`): one Custom CSS block built from `site-style.mjs` values
  (font, label/text colours, borders, button, `.tnc` / `.terms-text-container` consent text at
  14px, grey underlined links), the Styles-panel field radius, and save-and-exit OFF where it was on
  (Alexandria, Stone Surgical Arts, Stone Med Spa).
  - Dr. Nahlah ×2: Raleway, gold gradient button `#8A7E4E → #AB9E6A → #D4CDB2`, square fields.
  - IFA: Poppins 18px, yellow gradient button `#FFD23E → #F3AE55`, 4px fields.
  - Stone Surgical Arts: Inter, green `#8FBC46` uppercase button, 2px fields.
  - Stone Med Spa: Inter, green pill button, 12px fields.
- All five are `site-style --compare` ok, including consent text at 375px. Live: Stone ×2 and IFA
  hold their height exactly; Dr. Nahlah moves ≤5px (the rest is the headless-only captcha line).
- Two runs needed a second go: Stone Med Spa lost the Chrome connection before Save (nothing saved),
  and IFA's button was first set flat because the site's gradient had been missed.
- `site-style.mjs`: skips cookie-banner buttons and reads gradient buttons, on both the site and
  the form side.

## Next (owner decisions; the gate still fails on these)
- **Second (care) consent box with the legal name** on all five: needs each practice's legal name
  from its `/privacy-policy`.
- **Service dropdown**: IFA has none; Stone Med Spa's *Treatment Options* is a multi-select, not the
  standard single dropdown.
- **McLean has no Privacy Policy link** (Terms only).
- Site side: the embed's `data-height` (Mason Park `2442`) is still not measured.

## Gotchas
- The 4 consent **dropdowns** carry no `data-q`; only their label text names them. CSS can reach
  them only by position (after the links), so the field order is now part of the standard.
- One Kids-site link ends in `/terms-of-service/` with a trailing slash, so the selector uses
  `href*=`, not `href$=`.
- GHL's CSS box reformats on blur (strips quotes, re-indents, may drop `#_builder-form`). The first
  Kids run read that as a failure and saved nothing; the brief must say to save anyway.
- The consent text exists twice (desktop and mobile copies). A probe that does not filter for
  visibility reads the hidden copy and reports the desktop style on a phone.
- A Chrome tab on the McLean form builder (`1137294533`) was claimed by another browser session;
  the run changed nothing until told to open its own tab. That instruction is now in the brief.
- `site-style.mjs` regexes live inside a template literal: write `\\(` (two backslashes), not `\(`, or the match
  drops the closing parenthesis (`rgb(138, 126, 78` came back twice).
- Headless Chrome gets an interactive Turnstile challenge plus an error line (136px); a real
  visitor's captcha is 100px. Never size the reserve from automation.
