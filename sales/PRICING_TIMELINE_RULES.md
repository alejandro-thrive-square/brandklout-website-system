# Pricing & Timeline Rules

This document is the **single source of truth** for per-page rates and per-page execution duration across the entire Webzite Agentic Workflow. It lives inside the **Sales microsystem** because Sales owns offer pricing, but it is referenced by Deliver (for scheduling) and Manage (for invoicing) so all three pillars stay in sync.

> [!IMPORTANT]
> **Update Protocol**: When these numbers change, edit only this file. Every other pillar and offer references it by link, so the change propagates automatically.

> [!IMPORTANT]
> **Trigger**: This file is reachable from [SYSTEM_RULES.md](../SYSTEM_RULES.md) (master rules) and [SALES_SYSTEM_RULES.md](./SALES_SYSTEM_RULES.md) (sales rules). Any agent loading either entry point must follow the link here before quoting price or timeline.

## 1. Per-Page Rates

| Line item | Rate |
| :--- | :--- |
| Page **design** | **$200 / page** |
| Page **development** | **$200 / page** |

A page that includes both design and development is therefore **$400**.

## 2. Per-Page Throughput

| Line item | Duration |
| :--- | :--- |
| Page **design** | **1 day / page** |
| Page **development** | **1 day / page** |

A page that includes both design and development takes **2 days** of execution.

## 3. Project Calculation Formulas

For any project priced and scheduled under these rules:

```
Total Cost     = pages × ($200 design + $200 dev)
Total Duration = pages × 2 days
```

For development-only engagements (e.g., Figma to Webflow):

```
Total Cost     = pages × $200
Total Duration = pages × 1 day
```

These formulas **replace** any per-phase day estimates in offer files. Discovery, QA, and launch overhead are not separately billed or scheduled under this model — they are absorbed into the per-page rate.

## 4. Worked Examples

| Project | Pages | Cost | Duration |
| :--- | :--- | :--- | :--- |
| Landing page (design + dev) | 1 | **$400** | **2 days** |
| Small site | 5 | **$2,000** | **10 days** |
| Standard site | 8 | **$3,200** | **16 days** |
| Figma-to-Webflow build | 5 | **$1,000** | **5 days** |

## 5. Offer Applicability

| Offer | Design $200/pg | Dev $200/pg | Notes |
| :--- | :--- | :--- | :--- |
| Development from Scratch | Yes | Yes | Full per-page formula applies. |
| Figma to Webflow | No | Yes | Dev-only; client provides Figma. |
| Migration to Webflow | No | Yes (rebuild portion) | Migration-specific work (audit, content export/import, redirects) priced separately. |
| Webflow Improvements & Updates | Conditional | Conditional | Applies only to pages added or redesigned. Other change types stay ad-hoc/hourly. |

## 6. Out of Scope (Add-Ons)

These are **not** included in the per-page rate and must be quoted separately when scoped:

- Copywriting
- Custom integrations beyond standard form/embed wiring
- Brand identity work (logo, palette, typography system) when no brand exists
- Migration audits, content exports/imports, and redirect maps
- Custom GSAP-heavy or scroll-driven animations beyond standard interactions
- Ongoing retainers and ad-hoc bug fixes (priced hourly per the Improvements offer)

## 7. Referenced By

This document is linked from:

- [SYSTEM_RULES.md](../SYSTEM_RULES.md) (master rules index)
- [CLAUDE.md](../CLAUDE.md) (agent entry point)
- [sales/SALES_SYSTEM_RULES.md](./SALES_SYSTEM_RULES.md)
- [deliver/DELIVER_SYSTEM_RULES.md](../deliver/DELIVER_SYSTEM_RULES.md)
- [manage/MANAGE_SYSTEM_RULES.md](../manage/MANAGE_SYSTEM_RULES.md)
- All four offer files in [sales/process/01-define-offers/offers/](./process/01-define-offers/offers)
- [sales/process/02-send-proposal/02-send-proposal.md](./process/02-send-proposal/02-send-proposal.md) (Upwork proposal templates source pricing/timeline numbers from this file)
- [deliver/process/OFFER_ROUTING.md](../deliver/process/OFFER_ROUTING.md)
- [deliver/process/00-client-delivery-initialization/00-client-delivery-initialization.md](../deliver/process/00-client-delivery-initialization/00-client-delivery-initialization.md)

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md - Section 4](../SYSTEM_RULES.md).
- **Branch naming**: `sales/pricing-<description>` (e.g., `sales/pricing-rate-update-2026`).
- **Commit discipline**: A change to these numbers is a single logical change. One commit per rate/throughput update, with a clear message explaining the business reason.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
