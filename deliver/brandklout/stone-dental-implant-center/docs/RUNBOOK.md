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

- **Termly → GHL consent bridge**: v1.0 is live and values reach GHL (confirmed by Gage). **v1.1 still needs pasting into
  the Webflow footer in place of v1.0**: the form renders without Termly's Enable step, and no choice counts as Decline.
  See [`runbook/2026-09-16-termly-ghl-consent-v1-1-no-enable-step.md`](./runbook/2026-09-16-termly-ghl-consent-v1-1-no-enable-step.md)
  and [`../snippets/termly-ghl-consent/`](../snippets/termly-ghl-consent/README.md).
