# Marvel Dental (Brandklout)

White-label client of Brandklout. Live Webflow site: **Marvel Dental Main**,
`69aedbc6b0c7e78051fd6a2c`, serving `marveldentaldds.com`.

Four other sites in the workspace carry the name (`Marvel Dental`, `… v2`, `… v3`, `Copy of … v2`).
They sit in the scratch and archive folders and are old design iterations. **Marvel Dental Main is
the only deliverable site** — it is the one with the live domain, in the same folder as every other
live Brandklout client.

## Current work: the dental emergency funnel

A three-page paid-traffic funnel, per
[the Brandklout funnel shape](../../docs/DESIGN-STANDARD.md) and the Arvada v2 precedent:

| Page | Slug | Webflow page id |
| :--- | :--- | :--- |
| Landing | `/ads-landing-pages/emergency-dentist` | `6a875326a493a891fd87d30a` |
| Consultation | `/ads-landing-pages/emergency-dentist-consult` | `6a87561bee07bd22cd8998cb` |
| Thank you | `/ads-landing-pages/emergency-dentist-thank-you` | `6a875664e0d205ff3cbd0121` |

**Those three pages already existed when this work started** (created 2026-08-20, ~19:20 UTC).
They hold a copy of the Arvada Dental Center campaign structure, with Arvada's `camp_` classes,
Arvada's Colorado copy, and Arvada's photography. They are unpublished. Nothing in this build has
touched them yet.

### What is built

Everything local, in `workflows/04-design/.tmp/v1/`:

- `_shared/camp.css` + `camp-convert.css` + `camp-sections.css` — the campaign class layer, taken
  from Arvada's proven structure and re-themed onto Marvel by `_shared/theme.mjs`. Re-runnable and
  auditable: the colour and font mapping is declared in one table.
- `_shared/*.tokens.html` — three slotted templates (landing, consult, thank you).
- `content/_base.json` — the practice-wide facts. Phone, address, hours, credentials, images, the
  GHL embed. Written once so three pages cannot drift.
- `content/emergency*.json` — the page copy.
- `emergency/`, `emergency-consult/`, `emergency-ty/` — rendered `index.html` (reviewable offline)
  and `body.html` (what the Webflow builder inserts).

Render with `node workflows/07-webflow-build/.tmp/native/render-page.mjs emergency [consult|ty]`.
It fails loudly on an unfilled slot.

QA: `node workflows/08-qa/.tmp/shots.mjs` (full pages at 1440 and 390, with a horizontal-overflow
assertion) and `slices.mjs <page> <width> <y…>` for 1:1 detail.

### What is deliberately NOT done

- **Nothing has been installed on the Webflow site.** No classes pushed, no markup inserted, no
  page settings changed. The style layer is authored to cover these three pages only, and stays
  local until the design is signed off.
- No publish. When it happens it is subdomain-only: the site carries the live
  `marveldentaldds.com`.

### Decisions taken with the user

| | |
| :--- | :--- |
| Campaign phone | (973) 264-0928, the existing tracking line |
| Hook | Same-day relief, no discount offer |
| Lead capture | LeadConnector (GHL) embed, **form id still needed** |

## Version Control

Per [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). See also [brand.md](./brand.md) for the measured
brand basis, and `../docs/mcp-access.md` for the Webflow grant this work uses.
