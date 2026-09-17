# Livewell Dental — standing runbook

**Site:** Webflow `69d03fdbe999e9907724a69d` · live `www.livewelldentalva.com` · staging
`livewelldentalva.webflow.io`. Run history: [runbook/INDEX.md](./runbook/INDEX.md).

## Current state (2026-09-17)
- **Consent:** Silktide banner on test, staging only (`live: false` in
  `deliver/process/23-termly-ghl-consent/kit/silktide/sites.json`). GHL consent bridge 2.3.0 applied.
  Ahrefs and the GHL call-tracking scripts are loaded by the Silktide loader, not by plain tags.
  The `Main Footer` component has a "Consent Preferences" link (`#consent-preferences`), on staging.
- **Publishing:** Designer changes have been pending since 2026-09-14. The live domains were last
  published 2026-09-11. Staging was published 2026-09-17.

## Before you publish live
The next live publish ships everything pending, including the consent code. With `live: false` that
changes nothing visible on the live domain. Check `window.BrandkloutConsentBridge === "2.3.0"` afterwards.

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
