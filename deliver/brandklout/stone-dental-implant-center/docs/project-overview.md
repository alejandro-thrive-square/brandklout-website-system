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

**Intake only, and the thinnest brief in the batch.** Both tasks are a single line of title text
with **no description, no references, no due date, and no attachments**.

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

Also note the naming: the Asana project is *Stone Dental Implant Center*, but the two deliverables
are *Stone Med Spa* and *Stone Surgical Arts*. That is plausibly one ownership group with three
brands. Confirm whether these are two sites for one client, two separate clients, or sub-brands —
it changes the folder structure, the pricing, and the number of platform grants needed.

## Blocking unknowns

Effectively everything. At minimum, before any estimate:

1. **Are these redesigns of existing sites, or greenfield builds?** No URLs exist in Asana.
2. **Page count per site** — the single biggest driver of both timeline and price per
   [PRICING_TIMELINE_RULES.md](../../../../sales/PRICING_TIMELINE_RULES.md).
3. **Relationship between Stone Dental Implant Center, Stone Med Spa, and Stone Surgical Arts.**
4. **Brand assets** — do they exist, or is identity work in scope too? A med spa and a surgical
   practice would not share one visual system.
5. **Content and photography** — reuse, client-supplied, or in scope.
6. **Who approves**, and on what cadence.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | Scope capture blocked — see above. |
| `12-migration-audit-plan` | **Conditional** | If existing sites are being replaced, audit before scoping. |
| `01-content-intake` | Blocked | Needs URLs and asset sources first. |
| `02-wireframe` → `04-design` → build | Blocked | Not estimable until page count is known. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Recommended next action

Send Brandklout a short scoping question set covering items 1–3 above. Two undated full-site builds
sitting alongside twelve landing pages due the same week is a capacity question as much as a scope
question — surface it rather than absorbing it.

## Project structure

```
deliver/brandklout/stone-dental-implant-center/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # No grants yet — read before any platform action
└── workflows/                # Copy phase folders from deliver/process/ as needed
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
