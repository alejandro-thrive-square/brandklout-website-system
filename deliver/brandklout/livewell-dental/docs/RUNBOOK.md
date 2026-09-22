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


## Cookie consent (Termly) — 2026-09-22

**Live.** The banner renders and the Cookie Preferences control opens Termly's modal. Tagged analytics and ad pixels wait for consent; the **GoHighLevel call-tracking pool deliberately does not** (client instruction, 2026-09-22). Account `livewelldental@thrivesquare.com`, website UUID
`5fd99c51-71ee-4d73-8914-8d4d8565f19e`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_LIVEWELL`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
