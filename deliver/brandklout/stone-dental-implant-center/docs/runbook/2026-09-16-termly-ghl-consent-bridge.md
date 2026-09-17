# 2026-09-16 — Termly → GHL consent bridge

## Done
- Built the standard bridge script for all client sites: `deliver/brandklout/snippets/termly-ghl-consent/`
  (`termly-ghl-consent.html` + README with the field mapping and install steps).
- Tested on the live `/contact` page by injecting the script with Playwright. The GHL form
  `0mtZk3CrshD7Y0OYOao4` filled correctly in four cases: no choice (`unknown`), Decline (`denied`,
  opt-out true), Accept (`granted`), and GPC + Accept (ads `denied`, GPC true, opt-out true). Check script:
  `workflows/08-qa/.tmp/termly-ghl-consent-check.cjs` (node; uses the playwright-core copy under
  `~/.cache/codex-runtimes/.../node_modules`).
- **Not yet installed** in Webflow custom code. Nothing was published.

## Next
- Paste the snippet into Webflow Site settings → Custom code → Footer, then publish. This covers
  stonesurgicalarts.com too, because it is the same site.
- In the GHL form builder, mark the 11 consent fields hidden. They are visible on the form right now.
- Submit a test lead and confirm the Consent folder values on the contact.

## Gotchas
- Termly `autoBlock=on` marks the GHL iframe `unclassified` and leaves `src` empty until the visitor
  clicks Accept, so **decliners never saw the contact form**. The bridge loads it for everyone
  (`loadFormsWithoutConsent`).
- Timestamp, visitor UUID and `document_version_id` (76953271) come only from
  `localStorage.TERMLY_API_CACHE.TERMLY_COOKIE_CONSENT`. The public API is just
  `getConsentState/on/off/consentAll`.
- The pasted `hideFields` script can't hide fields from the website side, because the form is a
  cross-origin iframe.
