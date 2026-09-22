# Legacy Dental — standing runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the
index, then only the runs you need. Do not read them all.

**Site:** webflow - live https://legacydentalpasadena.com


## Cookie consent (Termly) — 2026-09-22

**Live.** Banner and control work. Trackers fired by GTM are not governed by the page. Tagged analytics and ad pixels wait for consent; the **GoHighLevel call-tracking pool deliberately does not** (client instruction, 2026-09-22). Account `legacydentalpasadena@thrivesquare.com`, website UUID
`3d3418ed-3972-4274-b429-4ebb8135fec7`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_LEGACY`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
