# Livewell Dental - Project Overview

## Client Information
- **Client Name**: Livewell Dental
- **Agency**: Brandklout (white-label partner; Webzite delivers, Brandklout owns the client relationship)
- **Project Start**: 2026-07-27
- **Status**: Client baseline checkpointed; dedicated Orca worktree being established

> [!NOTE]
> Livewell Dental is the **first** project under the Brandklout partnership. Decisions
> made here (folder conventions, MCP grant model, review/approval loop) become the
> default pattern for every future Brandklout client.

## Project Type
**Existing Webflow site - scoped improvements after audit**

The client already has a live Webflow site that "needs a lot of work". Delivery started with
`15-improvement-intake-audit`, which produced the evidence-based gap analysis now used to route
scoped design and Webflow improvements.

- **Selected offer**: `Webflow Improvements & Updates`
- **Design ownership**: Webzite. New/redesigned surfaces ship as a Claude coded HTML/CSS/JS
  design package (`04-design`) with a Vercel review URL, then `05-design-revisions`.
- **Design-system reference**: Livewell-specific system documented in
  `workflows/04-design/.tmp/design-notes.md`; no reusable library package was selected during the
  original audit/design run.

## Key URLs
- **Live site**: https://www.livewelldentalva.com (57 pages, crawled 2026-07-27)
- **Webflow staging**: https://livewelldentalva.webflow.io
- **Webflow site ID**: `69d03fdbe999e9907724a69d` (confirmed 2026-08-07 through the live
  `webflow-brandklout` grant)
- **Practice**: Livewell Dental, Fairfax Station VA - Dr. Chris Kim. Phone 703-690-0102.
- **Site shape**: 40+ static service pages, 2 (blank) city pages, blog with 1 post,
  smile gallery, testimonials, 5-page About section, contact.

## Routed Workflows
| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | Done (this doc) | No formal Sales handoff package exists; scope captured here instead. |
| `15-improvement-intake-audit` | Run (2026-07-27) | Public crawl + all 191 Designer comments. See `.tmp/existing-site-audit.md` and `.tmp/home-page-brief.md`. |
| `04-design` | In progress | Home page r1 built 2026-07-27 against the client's own requested flow. `/services/no-prep-veneers` rebuilt 2026-07-28 as a 10-section component package in the Clifton Exteriors idiom. Client-sent cosmetic dentistry landing page **rebuilt** 2026-07-28 (not restyled) off its invented forest/wine/Fraunces palette onto the Livewell system: 14 component roots, 3 signature motion sections, behaviour-verified with motion enabled. See `.tmp/design-notes.md`. |
| `05-design-revisions` | Not copied yet | Copy when r1 goes to Brandklout for review. |
| `07-webflow-build` | Copied 2026-07-28 | **Both pages pasted to Webflow and image assets bound 2026-07-28.** Veneers → page `no-prep-veneers-landing-page` (`6a677f236cd710348c4241bf`), clean paste, 10/10 images bound. See `.tmp/VENEERS-RUNBOOK.md`. Cosmetic landing → page `cosmetic-dentistry-2` (`6a6856e29d14cd95a2d88fa6`), 15/15 images bound; two classes forked on paste (`page_cosmetic 2`, `csm-img 2`) and still need cleanup. See `.tmp/COSMETIC-LANDING-RUNBOOK.md`. Neither page published. Open: cosmetic slug unconfirmed, lead form not wired to a backend, all site assets still `altText: null`. |
| `08-qa` | Not copied yet | Required for any changed surface. |
| `09-launch` | Conditional | Only if production publish/domain work is in scope. |
| `10-handoff-support` | Conditional | Adapted to a delivery note or retainer loop. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Timeline
Not yet computable. Per [PRICING_TIMELINE_RULES.md](../../../../sales/PRICING_TIMELINE_RULES.md),
redesigned pages cost `pages x 2 days` and dev-only rebuilds `pages x 1 day`; other
improvement work is ad-hoc/hourly. The page count comes out of the audit.

## Project Structure
```
deliver/brandklout/livewell-dental/
├── docs/
│   ├── project-overview.md    # This file
│   └── mcp-access.md          # Webflow MCP boundaries for this client
└── workflows/
    ├── 04-design/                       # Livewell design source and review artifacts
    ├── 07-webflow-build/                # Client Webflow build instance and runbooks
    └── 15-improvement-intake-audit/     # Audit workflow and lightweight findings
```

## Open Questions
1. Engagement model: one-time, hourly, or retainer.
2. Is there a written change list / complaint list from the client, or is the audit
   defining the problems from scratch?
3. Who approves designs - Brandklout only, or the end client too? This sets the review loop.
4. Brand assets: does Brandklout hold a brand kit (logo files, palette, type), or do we
   extract from the live site?
5. Content and photography: reuse existing, or is new copy/imagery in scope?

## Version Control
- **Branch / Orca worktree**: `bk-livewell`
- **Process baseline commit**: `30b0168d343c09b08267247d7e10f710addcbf7a`
- **Commit pattern**: Conventional commits scoped to `livewell`, for example
  `feat(livewell): add approved landing page`.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
