# Project Overview — Mason Park Dental

| Field | Value |
| :--- | :--- |
| **Client** | Mason Park Dental |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Mason Park Dental` |
| **Asana parent task** | `1217040406855582` — [Landing Page - Mason Park](https://app.asana.com/1/1210572425689866/task/1217040406855582) |
| **Scope** | 3 paid-traffic landing pages |
| **Due** | 2026-08-05 |
| **Started** | 2026-08-05 (folder scaffolded from Asana dispatch) |

## Status

**Intake — partial prior work exists.** This folder already contained a loose
`mpd-invisalign-lp.html` at its root with no docs, no workflow folders, and no record of where it
came from or how far it got.

> [!IMPORTANT]
> `mpd-invisalign-lp.html` corresponds to the **Invisalign Landing Page** task below. Before
> redoing that page, open the file and establish what it is: a finished deliverable, a draft, or a
> reference the client supplied. Its provenance is unknown and it predates this folder structure.
> It should move into the owning workflow's `.tmp/` rather than sit at the folder root.

## Task manifest

| Task | GID | Spec from Asana |
| :--- | :--- | :--- |
| [Invisalign Landing Page](https://app.asana.com/1/1210572425689866/task/1217133289235652) | `1217133289235652` | Inspiration: `tulipdent.com/Beautifulsmile/invisalign-treatment-in-redlands/` — **see existing HTML above** |
| [New Patient Special Landing Page](https://app.asana.com/1/1210572425689866/task/1217162605683021) | `1217162605683021` | Inspiration: `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC`, `greenspotcrossingsdentistry.com/lp/59-nps/` |
| [Thank you Page](https://app.asana.com/1/1210572425689866/task/1217040406855602) | `1217040406855602` | 4 sections (below) + **check GHL for proper tracking number** |

### Thank you Page — section spec (verbatim from Asana)
1. Immediate Status Banner
2. Fast-Track Immediate Call Box (High-Intent Prompt)
3. What to Expect (3-Step Timeline)
4. Practice Details & Location Map

Identical to Grand Mission's thank-you spec — build once as a shared archetype, see
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md). Note the Mason Park variant additionally needs
the **GHL tracking number**, so the "Fast-Track Immediate Call Box" phone number is not the
practice's public number — confirm it before shipping, or call tracking breaks.

## Reference material

House references cited on the parent task:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/

> [!WARNING]
> Parent task: *"Attached are the originals from the other Ad company. Use it as a reference
> point."* **Not yet retrieved** — pull via MCP `get_attachments` on task `1217040406855582`.

## Build target

**Webflow** (confirmed 2026-08-05). GHL is the lead destination only — the New Patient Special
reference happens to be hosted on GHL, and the thank-you page needs a GHL tracking number, but the
page itself ships to Webflow.

Sequence: build locally → review → Webflow. Local output goes to
`workflows/04-design/.tmp/<page-slug>/`, one self-contained HTML/CSS/JS package per page.

Reference URLs are **structure and content only** — screenshot, extract section order and copy
angles, then design original work. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Blocking unknowns

1. **What is `mpd-invisalign-lp.html`?** Finished, draft, or client-supplied. Resolve first — it
   may remove a third of the scope.
2. **No client website URL recorded** in Asana. Needed for brand extraction.
3. **GHL tracking number** for the thank-you call box.
4. **Content sourcing** — real reviews and doctor details only; **never invent testimonials or
   statistics** for a real practice.
5. **Remaining effort**, once it is clear how much the existing Invisalign HTML already covers.
   No pricing question applies — Brandklout is a partner engagement.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | Scope captured from Asana; no Sales handoff exists. |
| `01-content-intake` | **Next** | Asana attachments, client site, brand assets. |
| `04-design` | Partially pre-existing | Audit `mpd-invisalign-lp.html` before starting fresh. |
| `07-webflow-build` | Blocked on grant | Platform is confirmed Webflow; needs a per-client Webflow grant and local approval first. |
| `08-qa` | Required | For every shipped page. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Project structure

```
deliver/brandklout/mason-park/
├── mpd-invisalign-lp.html    # Pre-existing, unknown provenance — triage and relocate
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # No grants yet — read before any platform action
└── workflows/                # Copy phase folders from deliver/process/ as needed
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
