# Project Overview — Stone Dental Implant Center

| Field | Value |
| :--- | :--- |
| **Client** | Stone Dental Implant Center |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Activation - Stone Dental Implant Center` |
| **Scope** | **2 full websites** — not landing pages |
| **Due** | None set in Asana |
| **Started** | 2026-08-05 (folder created from Asana dispatch) |

## Status

**Scoped, not started.** Both Asana tasks are a single line of title text with no description, no
references, no due date, and no attachments — but public research on 2026-08-05 resolved most of
what was blocking an estimate. See
[discovery-findings.md](../workflows/00-client-delivery-initialization/.tmp/discovery-findings.md).

**Still do not start building.** The remaining unknowns are decisions only Brandklout or the client
can make; they are in
[scoping-questions.md](../workflows/00-client-delivery-initialization/.tmp/scoping-questions.md),
which has not been sent.

## Task manifest

| Task | GID | Notes in Asana |
| :--- | :--- | :--- |
| [Build New Stone Med Spa](https://app.asana.com/1/1210572425689866/task/1217160668112180) | `1217160668112180` | *(empty)* |
| [Build New Stone Surgical Arts website](https://app.asana.com/1/1210572425689866/task/1217160668112175) | `1217160668112175` | *(empty)* |

> [!IMPORTANT]
> These are the **largest-scope and least-specified** items assigned to Webzite. "Build New
> \<name\> website" is a full site build — an order of magnitude more work than a landing page —
> and the Asana project is `BK Activation`, not `BK Implementation`, which for
> [Dr. Nahlah](../../dr-nahlah/docs/project-overview.md) meant early-stage/onboarding rather than
> production. **Do not start building.** Scope these with Brandklout first.

## Resolved 2026-08-05 — one practice, three brands

**Dr. Mona Stone, DDS** (board-certified oral & maxillofacial surgeon) is the sole surgeon behind
all three names, at one address: 72 Andorra Dr #110A, Westlake, TX 76262 · (817) 383-8361.

`Stone Surgical Arts` was the original WordPress site, covering three service pillars. It has been
consolidated into `Stone Dental Implant Center` — **live on Webflow** — which now carries only the
oral-surgery pillar. The cosmetic and skin pillars were dropped and are offline. The two tasks are
therefore **pillars 2 and 3 of a brand split that is already one-third complete**:

| Pillar | Brand | Status |
| :--- | :--- | :--- |
| Oral & maxillofacial surgery | Stone Dental Implant Center | **Live on Webflow.** 43 URLs. |
| Cosmetic facial *surgery* | Stone Surgical Arts | Task `1217160668112175` — to build |
| Non-surgical skin & aesthetics | Stone Med Spa | Task `1217160668112180` — new brand, to build |

Rough sizing, for **sequencing and capacity only**: mirroring the archived architecture is ~42 pages
across both builds; a lean hero-procedure launch is ~21. Which one we plan against depends on the
questions below.

> [!IMPORTANT]
> Brandklout is a **partner engagement**, not a per-page client.
> [PRICING_TIMELINE_RULES.md](../../../../sales/PRICING_TIMELINE_RULES.md) does **not** apply to
> anything under `deliver/brandklout/`. Do not compute or record a price, rate, quote, or cost in
> this folder.

> [!WARNING]
> All ~130 old Surgical Arts deep links **404**. The consolidation used a blanket apex redirect with
> no page-level map, so search equity is decaying now. Worth raising with Brandklout even if both
> builds are deferred.

## Remaining unknowns

Only decisions the client or Brandklout can make. Full set with draft wording in
[scoping-questions.md](../workflows/00-client-delivery-initialization/.tmp/scoping-questions.md):

1. **Is the three-brand split correct**, and which brand owns the overlapping services (Botox,
   fillers, Morpheus8, HydraFacial, CO2 laser, PRP, GLP-1 weight loss)?
2. **Full architecture or lean launch**, and what is the sequence between the two builds?
3. **Does Stone Med Spa exist yet** — and is brand identity in scope? If it is ours, it blocks design
   and sits on the critical path.
4. **Domains and DNS** — is `stonesurgicalarts.com` reclaimed, and who controls DNS?
5. **Webflow grant** — same workspace as the implant center? Shared design system or distinct?
6. **Content** — recover from the Wayback archive, client-supplied, or copywriting in scope?
7. **Before/after photography** — 33 real patient cases; needs current consent, not archive scraping.
8. **Integrations** (Crisalix, Cherry financing, GHL routing) and **who approves**.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | **Artifacts produced 2026-08-05** | Discovery + scoping questions in `.tmp/`. Questions not yet sent. |
| `12-migration-audit-plan` | **Applies** | Confirmed: content is recovered from an archived WordPress site, and a redirect map is needed. |
| `01-content-intake` | Blocked | Source is the Wayback archive; needs Q6/Q7 answered before extraction. |
| `02-wireframe` → `04-design` → build | Blocked | Needs Q1–Q3. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Recommended next action

**Send the question set.** It is drafted and ready in
[scoping-questions.md](../workflows/00-client-delivery-initialization/.tmp/scoping-questions.md);
sending is a human decision because it goes to Brandklout, and nothing has been written to Asana.

Two undated full-site builds sitting alongside twelve landing pages due the same week is a capacity
question as much as a scope question — surface it rather than absorbing it.

Separately and independent of scope: flag the ~130 dead Surgical Arts URLs. That is ongoing SEO loss
that predates our involvement and is cheap to fix.

## Project structure

```
deliver/brandklout/stone-dental-implant-center/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # No grants yet — read before any platform action
└── workflows/
    └── 00-client-delivery-initialization/.tmp/
        ├── discovery-findings.md    # Public research, 2026-08-05
        ├── scoping-questions.md     # Draft message to Brandklout — NOT sent
        └── archived-urls-raw.txt    # ~130 archived Surgical Arts URLs
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
