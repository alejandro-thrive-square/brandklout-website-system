# Project Overview — Grand Mission Dentistry

| Field | Value |
| :--- | :--- |
| **Client** | Grand Mission Dentistry |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Grand Mission Dentistry` |
| **Asana parent task** | `1217040406855578` — [Landing Page - Grand Mission](https://app.asana.com/1/1210572425689866/task/1217040406855578) |
| **Scope** | 3 paid-traffic landing pages |
| **Due** | 2026-08-05 |
| **Started** | 2026-08-05 (folder created from Asana dispatch) |
| **Named contact** | "Sang" — per task note *"Add Landing page needs for Sang for Grand Mission"*. Role unconfirmed. |

## Status

**Intake only.** This folder was created from the Asana task list; no discovery, no site scrape, no
design work has happened yet. Everything below the task manifest is unconfirmed.

## Task manifest

| Task | GID | Spec from Asana |
| :--- | :--- | :--- |
| [Implant Landing Page](https://app.asana.com/1/1210572425689866/task/1217133289235653) | `1217133289235653` | 7 sections (below) + **lead form in GHL** |
| [Cosmetic Landing Page](https://app.asana.com/1/1210572425689866/task/1217072657902270) | `1217072657902270` | 7 sections (below) + **lead form in GHL** |
| [Thank you Landing Page](https://app.asana.com/1/1210572425689866/task/1217162605683014) | `1217162605683014` | 4 sections (below) |

### Implant Landing Page — section spec (verbatim from Asana)
1. Header & Hero Section
2. Solution Breakdown: Why Dental Implants?
3. Patient Eligibility & Preliminary Procedures Section
4. Insurance & Flexible Financing Matrix
5. Doctor Spotlight & Patient Testimonials
6. FAQ Section (Accordion Format)
7. Reviews

### Cosmetic Landing Page — section spec (verbatim from Asana)
1. Header & Hero Section
2. Meet the Cosmetic Doctors
3. Service Offerings Grid
4. Why Choose Grand Mission Dentistry
5. Social Proof & Real Patient Gallery
6. Sticky Mobile Bar
7. Reviews

### Thank you Landing Page — section spec (verbatim from Asana)
1. Immediate Status Banner
2. Fast-Track Immediate Call Box (High-Intent Prompt)
3. What to Expect (3-Step Timeline)
4. Practice Details & Location Map

This is the **same 4-section thank-you spec** as Mason Park. Build it once as a shared archetype —
see [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md).

## Reference material

House references cited on the parent task:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/
- https://go.voitdental.com/ *(cited only for Grand Mission)*

> [!WARNING]
> The parent task says *"Attached are the originals from the other Ad company. Use it as a
> reference point."* **Those attachments have not been retrieved.** They are the closest thing to a
> brief that exists. Pull them (MCP `get_attachments` on task `1217040406855578`) before designing,
> or you are designing without the client's actual reference.

## Build target

**Webflow** (confirmed 2026-08-05). GHL is the lead destination only — the two tasks requiring a
"lead form in GHL" mean the form posts to GHL, not that the page is built there.

Sequence: build locally → review → Webflow. Local output goes to
`workflows/04-design/.tmp/<page-slug>/`, one self-contained HTML/CSS/JS package per page.

Reference URLs are **structure and content only** — screenshot, extract section order and copy
angles, then design original work. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Blocking unknowns

1. **No client website URL is recorded anywhere in the Asana task.** Needed for brand extraction
   (logo, palette, type, real doctor names, real reviews).
2. **Who is "Sang"?** Approver, practice contact, or Brandklout staff — this sets the review loop.
3. **Content sourcing.** Per
   [client-assets-before-stock rules](../../livewell-dental/docs/project-overview.md), testimonials,
   reviews, doctor bios and stats must come from the client's real material. **Never invent
   reviews, patient stories, or statistics for a real dental practice** — that is both a
   credibility and a regulatory problem.
4. **Are these new designs or rebuilds of the attached originals?** Changes the amount of design
   work, not the commercial terms — Brandklout is a partner engagement, so per-page pricing does
   not apply here.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | No Sales handoff package exists; scope captured from Asana. |
| `01-content-intake` | **Next** | Retrieve the Asana attachments and the client's live site first. |
| `04-design` | Blocked on intake | Platform-independent — can start once references exist. |
| `07-webflow-build` | Blocked on grant | Platform is confirmed Webflow; needs a per-client Webflow grant and local approval first. |
| `08-qa` | Required | For every shipped page. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Project structure

```
deliver/brandklout/grand-mission-dentistry/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # No grants yet — read before any platform action
└── workflows/                # Copy phase folders from deliver/process/ as needed
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit docs and
lightweight `.tmp/` artifacts; never secrets or binary/media assets.
