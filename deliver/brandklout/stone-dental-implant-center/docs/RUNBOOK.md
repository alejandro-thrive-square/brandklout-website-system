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

- **Termly (LIVE, 2026-09-16, standard v2):** the head has Termly with `autoBlock=off`, above GTM. The footer
  has GHL call tracking tagged `advertising` and the GHL connection script v2.0.0. There is no allowlist.
  Fresh visitors get the full site, and tracking waits for Accept.
  **Open:** the 4 ad landing pages have no Consent Preferences link.
  See [`runbook/2026-09-16-termly-standard-v2-autoblock-off.md`](./runbook/2026-09-16-termly-standard-v2-autoblock-off.md)
  and [`../snippets/termly-ghl-consent/`](../snippets/termly-ghl-consent/README.md).
