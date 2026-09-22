# Runbook — bk-stone-dental

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Objective

**Stone Dental Implant Center** — the oral & maxillofacial surgery pillar, and the only Stone brand
that is actually live. **Landing pages for ad campaigns**, not site work.

`https://stonedentalimplantcenter.com` is live on Webflow (site `6a07d5aac093f0e4521d29bc`),
43 URLs. Dr. Mona Stone, DDS, 72 Andorra Dr #110A, Westlake, TX 76262, (817) 383-8361.
The same Webflow site also serves `stonesurgicalarts.com` — see gotcha 2 and 5.


## Current

- **Termly (LIVE, standard v2):** head has Termly with `autoBlock=off` above GTM; footer has GHL call tracking
  tagged `advertising`. The GHL bridge is now the registered site script `BrandkloutConsentBridge` 2.2.0,
  **applied but unpublished**; the live site still runs the pasted v2.0 until the next publish.
  **Open:** the 4 ad landing pages have no Consent Preferences link.
  The standard, the kit and every site's state: [`deliver/process/23-termly-ghl-consent/`](../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).
  Latest run: [`runbook/2026-09-17-consent-module-23-rollout.md`](./runbook/2026-09-17-consent-module-23-rollout.md).

## Cookie consent (Termly) — 2026-09-22

**Applied but not published** — it ships with this site's next publish. Nothing fires before a visitor chooses. Account `stonedentalimplantcenter@thrivesquare.com`, website UUID
`e51fcbf6-ee3e-41de-8aeb-9af4d07bdb32`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_STONE_DENTAL`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
