# Project Overview — Arvada Dental Center & Implants

| Field | Value |
| :--- | :--- |
| **Client** | Arvada Dental Center & Implants |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Arvada Dental Center & Implants` |
| **Asana parent task** | `1217040406855586` — [Landing Page Needs - Arvada](https://app.asana.com/1/1210572425689866/task/1217040406855586) |
| **Scope** | 6 paid-traffic landing pages — the largest of the current Brandklout batch |
| **Due** | 2026-08-05 |
| **Started** | 2026-08-05 (folder created from Asana dispatch) |

## Status

**Intake only.** Created from the Asana task list. No discovery, scrape, or design work yet.

## Task manifest

Six subtasks, each carrying a single inspiration URL and no written section spec — unlike Grand
Mission, which specifies sections explicitly. **The page structure here has to be derived**, either
from the inspiration links or by reusing the archetypes defined for the other clients.

| Task | GID | Inspiration reference |
| :--- | :--- | :--- |
| [Implants Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633760) | `1217162344633760` | `smile.dentalimplantsgps.com/dental-implants/ppc/` |
| [AOX Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633761) | `1217162344633761` | `yjoms.com/about-full-arch/` |
| [Porcelain Veneers Page](https://app.asana.com/1/1210572425689866/task/1217133289235649) | `1217133289235649` | `avenue.dental/services/veneers/`, `drpaulomalley.com/services/ultra-thin-veneers/` |
| [Emergency Dentistry Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633758) | `1217162344633758` | `smilecenter.com/treatments/emergency-dentistry` |
| [Dentist Near Me Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633759) | `1217162344633759` | `greenspotcrossingsdentistry.com/lp/59-nps/` |
| [Next Door Landing Page](https://app.asana.com/1/1210572425689866/task/1217133289235650) | `1217133289235650` | `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC`, `greenspotcrossingsdentistry.com/lp/59-nps/` |

Notes on this set:

- **"Next Door" and "Dentist Near Me" cite the same `greenspotcrossingsdentistry` new-patient-special
  reference**, and "Next Door" additionally cites the same GHL preview as Mason Park's *New Patient
  Special*. These three pages are probably one archetype with different targeting. **Confirm what
  distinguishes them before building three near-identical pages** — or confirm that near-identical
  is the intent, which is normal for paid-search landing pages.
- **"AOX"** = All-on-X full-arch implants. Distinct offer from the general Implants page; the
  `yjoms.com` reference is a full-arch page.
- The parent task also carries a veneers reference (`drpaulomalley.com`) at the top level.

## Reference material

House references cited on the parent task:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/
- https://www.drpaulomalley.com/services/ultra-thin-veneers/ *(veneers-specific)*
- https://smilecenter.com/

## Build target

**Webflow** (confirmed 2026-08-05). The GHL-hosted reference is a *structure* reference, not the
platform.

Sequence: build locally → review → Webflow. Local output goes to
`workflows/04-design/.tmp/<page-slug>/`, one self-contained HTML/CSS/JS package per page.

Reference URLs are **structure and content only** — screenshot, extract section order and copy
angles, then design original work. That matters most here: six pages with no written specs means
the captures *are* the brief, and six pages that all ape their references will read as six
templates. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Blocking unknowns

1. **No client website URL recorded.** Required for brand extraction and for real doctor/review
   content.
2. **No section specs.** Decide whether to derive structure per inspiration link or standardise on
   the archetypes; record the decision here so the six pages stay coherent.
3. **Are "Next Door", "Dentist Near Me" and "New Patient Special" one page or three?**
4. **Content sourcing.** Real reviews, doctor names, and credentials only — **never invent
   testimonials or statistics for a real practice**.
5. **Capacity.** Six pages is the largest slice of this batch and carries the same due date as
   everyone else's. Flag the conflict to Brandklout rather than silently slipping. No pricing
   question applies — Brandklout is a partner engagement, not a per-page client.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | Scope captured from Asana; no Sales handoff exists. |
| `01-content-intake` | **Next** | Client site + brand assets + real review sources. |
| `02-wireframe` | Recommended | Six pages with no specs — wireframe first to lock structure cheaply. |
| `04-design` | Blocked on intake | Platform-independent. |
| `07-webflow-build` | Blocked on grant | Platform is confirmed Webflow; needs a per-client Webflow grant and local approval first. |
| `08-qa` | Required | For every shipped page. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Project structure

```
deliver/brandklout/arvada-dental-center/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # No grants yet — read before any platform action
└── workflows/                # Copy phase folders from deliver/process/ as needed
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
