# 2026-09-16 — Termly → GHL bridge v1.1: no Enable step

## Done
- v1.0 was installed on the live site by the team, and Gage confirmed the values reach GHL.
- v1.1 (`deliver/brandklout/snippets/termly-ghl-consent/`): GHL forms render immediately, without
  Termly's "Enable this content?" box. Visitors who haven't chosen yet send Decline values
  (`denied`, opt-out `true`, no timestamp or receipt ID).
- Tested on `/ads-landing-pages/all-on-x` with the live v1.0 swapped for v1.1 via Playwright
  (`workflows/08-qa/.tmp/termly-ghl-consent-check.cjs [path]`). Results for no choice, Decline and
  Accept: the form is 991px tall, the Enable box is hidden, the other 8 video placeholders are
  untouched, and the fields are correct.

## Next
- **Replace the v1.0 script in Webflow footer code with v1.1 and publish.** Not done by the agent.

## Gotchas
- Termly hides the iframe with an inline `display:none` and draws a sibling
  `.termly-blocked-content[data-blocked-iframe-id]` box. Setting `src` alone loads the form invisibly.
- Termly also blocks `link.msgsndr.com/js/form_embed.js` (`type=text/plain`). Without it the iframe is
  150px tall. The bridge injects it with `data-categories="essential"`, and Termly lets that through.
