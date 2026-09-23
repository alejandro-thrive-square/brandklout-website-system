# 2026-09-23 — OpenAI Ads (ChatGPT Ads) conversion pixel on the All-on-4 ads pages. LIVE

Request (Alejandro): add the ChatGPT Ads pixel (`oaiq`, pixel id `2EKUEqMZC1in13nT8T8eb5`)
and its `lead_created` conversion event to the All-on-X landing pages.

## Done

Commit: `31265aab`

- **Where the conversion happens:** the thank-you page view. Read from the two All-on-4
  LeadConnector forms (`8jq7yzSeCzZrIkuA3sSG` Alexandria, `d1IIoFqitmgu2zBvvmfw` Tysons):
  `formAction.actionType "1"`, `redirectUrl` = `/ads-landing-pages/<office>-all-on-4-thank-you`.
  So RUNBOOK "What is next" item 2 (the redirect) is done in GHL, at least for All-on-4.
- **Six pages**, `ads-landing-pages/{alexandria,tysons}-all-on-4[-consultation|-thank-you]`:
  - SDK `https://bzrcdn.openai.com/sdk/oaiq.min.js` = embed-origins `siteScripts` line
    `#consent=advertising&pages=ads-landing-pages/*-all-on-4*`. **Held until the visitor
    accepts advertising cookies**, like every ad pixel (only the GHL pools are exempt).
  - `connectOrigins` += `https://bzr.openai.com` (the SDK POSTs events there).
  - Code asset `src/scripts/openai-ads-pixel.js` (id `5jBzHIiO7NI8RCKLHf848`), scoped to the six
    page ids, body-end: queue stub + `init` on all six, `measure lead_created
    {type:"customer_action"}` on the two `-thank-you` pages only. Source:
    `workflows/22-instatic-api-sync/openai-ads-pixel.js`; pushed by `set-openai-pixel.mjs --apply`.
- Published (draft matched live beforehand, so nothing else shipped).
- **Verified live:** tags on exactly the six pages (not on veneers/implants ads pages, `/`,
  `/all-on-4`); CSP meta carries `bzrcdn.openai.com` (script) and `bzr.openai.com` (connect).
  Headless Chrome, consent released by hand, OpenAI requests **aborted** so no test lead was
  recorded: the thank-you page sent `lead_created` for the pixel, the consultation page did not.

## Gotchas

- **Conversions only count for visitors who accept advertising cookies.** That follows the
  house standard. If the client wants the pixel to run without consent, the way the GHL pools do,
  drop `consent=advertising&` from `SDK_LINE` in `set-openai-pixel.mjs`, re-run `--apply`, then publish.
- `debug: true` is kept as OpenAI's setup code gave it. It only writes `console.debug`
  lines. Set it to `false` in `openai-ads-pixel.js` once the event stream is confirmed.
- The SDK drains a pre-existing `window.oaiq.q`, so the stub may run before the consent-held
  SDK arrives. That is why the split into siteScripts + code asset works.
- A GHL form's submit action is readable without credentials: `GET
  https://api.leadconnectorhq.com/widget/form/<id>` and decode `__NUXT_DATA__`, then look at
  `formAction.redirectUrl`. `backend.leadconnectorhq.com/forms/data` returns 500.
- Dental implants and veneers ads pages do NOT carry the pixel. To add them, widen `SLUG_RE`
  and the `pages=` glob.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
