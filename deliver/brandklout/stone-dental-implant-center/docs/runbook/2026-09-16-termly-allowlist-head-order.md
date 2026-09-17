# 2026-09-16 — Termly allowlist + head order (LIVE)

## Done
- Diagnosed the "blank until you accept and reload" bug. Termly `autoBlock=on` blocked Webflow's own
  bundle (`cdn.prod.website-files.com/6a07d5aac093f0e4521d29bc/js/stone-surgical-arts.*.js`, filed
  `unclassified`), so `Webflow` was undefined and the hero never appeared. It also blocked every
  YouTube/Vimeo/embedly video, Google Maps, the reputationhub review widget, Elfsight, the GHL survey
  and forms.
- Head order was GTM → Termly (Termly warned "not the first script").
- New standard snippet `deliver/brandklout/snippets/termly-ghl-consent/termly-allowlist.html` (v1.1.0).
- **Webflow head code rewritten via MCP and published twice (full site, both domains).** The order is now
  allowlist → Termly → GTM → font CSS. Before/after copies are in `workflows/08-qa/.tmp/head-*-2026-09-16.html`.
- Live check as a fresh visitor (`workflows/08-qa/.tmp/termly-allowlist-check.cjs <path> none`) on `/`,
  `/ads-landing-pages/all-on-x`, `/contact` and `/services/bone-grafting`: `Webflow` object,
  0 blocked iframes, 0 placeholders, 7/9/2/3 embeds loaded, no page errors. Only gtag,
  `number_pool.js` and `user_session.js` stay blocked.
- The GHL consent fields are now hidden (the team's script inside the form) and still prefill from the
  bridge's URL params (checked on form `beenRQctdWExVJnPV6OC`).
- The Termly key was in the worktree `.env` as `TERMILY`. It is now in the master file as
  `[stone-dental-implant-center] TERMLY_API_KEY` (backup `.env.bak-2026-09-16-termly`), synced.

## Next
- The Elfsight footer reviews widget (`elfsight-app-c92f78df...`) is 0px tall **even after Accept**,
  so the cause isn't Termly. Check the widget in the Elfsight dashboard (domain/plan). It is labelled
  "Stone Surgical Arts".
- `/about` returns 404.

## Gotchas
- The Termly key is Consent API only (read-only; raw `Authorization: <key>`, `app.termly.io/api/v1/...`).
  It can't change what the blocker blocks.
- Termly judges a script created by another script before that script reaches the DOM, so
  `data-categories` set on insert is too late. The allowlist's `rescue()` swaps in a new tag marked essential.
- Webflow `get_site` shows `lastUpdated` about 20 s after `lastPublished` right after an API publish.
  That comes from the publish itself and doesn't mean unpublished Designer work.
