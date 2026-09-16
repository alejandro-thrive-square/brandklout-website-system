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

- **Termly (LIVE, 2026-09-16):** head is allowlist v1.1 → Termly → GTM; footer has the GHL bridge v1.1.
  Fresh visitors get the full page, videos, maps and forms, with trackers still blocked, and the GHL
  hidden consent fields fill in. Open: the Elfsight footer widget renders 0px even after Accept.
  See [`runbook/2026-09-16-termly-allowlist-head-order.md`](./runbook/2026-09-16-termly-allowlist-head-order.md)
  and [`../snippets/termly-ghl-consent/`](../snippets/termly-ghl-consent/README.md).
