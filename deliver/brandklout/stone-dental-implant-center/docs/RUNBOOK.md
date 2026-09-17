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
