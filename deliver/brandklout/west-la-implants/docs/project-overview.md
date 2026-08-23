# Project Overview — West LA Implants

| Field | Value |
| :--- | :--- |
| **Client** | West LA Implants (Dr. Tony Barriere, DDS) |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Existing site** | https://westlaimplants.com/ — WordPress (Rank Math SEO, Site Kit by Google) |
| **Selected offer** | `Development from Scratch` (full site, built new — not a page-for-page migration) |
| **Source** | Direct from Brandklout. **No Asana task exists yet** — the 2026-08-05 pull in `docs/ASANA-DISPATCH.md` predates this client |
| **Due** | Not set |
| **Started** | 2026-08-20 (client folder initialized) |
| **`process_baseline_commit`** | `8d65269` (2026-08-19) |
| **Worktree** | `bk-west-la-implants` → this folder only |

## Practice profile (read from the live site, 2026-08-20)

| Field | Value |
| :--- | :--- |
| Practice | West LA Implants |
| Doctor | Dr. Tony Barriere, DDS |
| Address | 12301 Wilshire Blvd #205, Los Angeles, CA 90025 |
| Phone | (310) 481-0111 |
| Positioning (current meta) | "Dental implants, cosmetic dentistry, and oral surgery in Los Angeles" |
| Social | [Facebook](https://www.facebook.com/WestLAImplants1/), [Instagram](https://www.instagram.com/west_la_implants/), [YouTube](https://www.youtube.com/@westlaimplants892), [Yelp](https://www.yelp.com/biz/west-la-implants-los-angeles-3) |

**Service lines on the current site**, which is the closest thing to a brief that exists right now:

- **Dental implants** — single implants, All-on-4 / full-mouth, implant-supported dentures, hybrid
  fixed-detachable dentures, zirconia fixed bridge, Yomi robotic implant surgery, implant cost,
  implant FAQ, what to expect, failing implants
- **Cosmetic dentistry** — porcelain veneers / Lumineers, smile makeover, Invisalign, teeth
  whitening, sedation dentistry
- **Oral surgery / perio** — bone grafting, sinus augmentation, ridge augmentation, tooth
  extractions, periodontics, bone loss, missing teeth, loose dentures
- **General dentistry**
- **Practice** — meet Dr. Barriere, meet the team, our facility, commitment to excellence,
  patient information, patient stories, gallery, video library, financing, contact, schedule
- **Blog** — 46 posts

## Existing site inventory (scope input, not a scope commitment)

Pulled from `sitemap_index.xml` on 2026-08-20:

| Set | Count |
| :--- | :--- |
| Pages (`page-sitemap.xml`) | **42** |
| Posts (`post-sitemap.xml`) | **46** |
| **Total indexed URLs** | **88** |

The full URL list is captured in
[`../workflows/01-content-intake/.tmp/existing-site-urls.txt`](../workflows/01-content-intake/.tmp/existing-site-urls.txt).

> [!IMPORTANT]
> **88 existing URLs is not the same number as the new build's page count.** A from-scratch build
> normally consolidates a sprawling WordPress service tree into a tighter set of designed pages plus
> a CMS-driven blog. The page count for *this* engagement is a Brandklout decision and is still
> open — see below. Do not infer it from the sitemap and do not start designing against it.

## Timeline

Per PRICING_TIMELINE_RULES.md (in the `webzite-agentic-workflow` repository), `Development from
Scratch` runs at **`pages × 2 days`** (1 design day + 1 dev day per page).

**Cannot be computed yet** — `pages_or_templates` is unknown. For calibration only: a 12-page build
is 24 execution days; a 20-page build is 40. That gap is why the page count is the first question to
close, before any design work is dispatched.

## Routed workflows — `Development from Scratch`

Copied from `deliver/process/` at baseline `8d65269`. Route:
`00` → `01` → `02` → `03` → `04` → `05` → `06` → `07` → `08` → `09` → `10`.

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | **Done** | This doc + `mcp-access.md`; folder scaffolded |
| `01-content-intake` | **Next, blocked on page count** | Existing-site scrape is the content source; download assets, do not just list URLs |
| `02-wireframe` | Pending | IA consolidation of the 42-page WP tree happens here |
| `03-graphic-resources` | Pending | Check the client's own extracted assets before any stock — the practice has a photo and video library |
| `04-design` | Pending | Awwwards-grade, motion-led per [DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md), benchmarked against Dr. Nahlah |
| `05-design-revisions` | Pending | Owns client approval before build |
| `06-content-seo` | Pending | Existing site ranks on a large service-page footprint; preserve topical coverage |
| `07-webflow-build` | Pending | Standard: [PASTEABLE-COMPONENTS.md](../workflows/07-webflow-build/PASTEABLE-COMPONENTS.md). No site ID exists yet |
| `08-qa` | Pending | |
| `09-launch` | Pending | Domain cutover from WordPress — see redirects below |
| `10-handoff-support` | Pending | |

### Modules deliberately not copied

| Module | Why |
| :--- | :--- |
| `11-figma-review-build-planning` | Not used on this offer — no Figma source |
| `12-migration-audit-plan`, `13-content-export-import` | Not used on this offer. Content is re-authored, not migrated |
| `14-migration-seo-redirects` | **Not copied, but flagged.** See below |
| `15`, `16`, `17` | Not used on this offer |

> [!WARNING]
> **A from-scratch rebuild at an existing domain still needs a redirect map.** 88 URLs currently
> return 200 and hold rankings and backlinks. If the new site replaces `westlaimplants.com` (rather
> than launching on a new domain), `14-migration-seo-redirects` must be pulled in before `09-launch`
> or the practice loses that equity on cutover. Confirm the domain plan and copy the module in then.
> Related trap: [redirect maps expire](../../dr-nahlah/docs/seo-redirect-plan.md) — re-derive from
> the built site, never from an old capture.

## Open questions — close these before dispatching `01-content-intake`

1. **Page count for the new build.** Drives the whole schedule and the fee. Blocking.
2. **Is this a replacement at `westlaimplants.com`, or a new domain?** Decides whether `14` enters
   the route and whether launch is a DNS cutover.
3. **Does the blog come across?** 46 posts. CMS collection + import, or start clean?
4. **Brand assets** — logo files, brand colours, fonts. Is identity work in scope, or are we
   designing to the existing mark?
5. **Photography and video** — the site carries practice photography and a YouTube library. Are the
   originals available, or do we extract from the live site?
6. **Webflow site provisioning.** No site exists for this client in Brandklout's workspace yet, and
   the shared grant may need re-authorization to include it. See `mcp-access.md`.
7. **Asana task** — none found. Ask Brandklout to create one so the GID can be recorded in artifacts
   per the standing brief, or confirm this client is tracked outside Asana.
8. **Approver and review cadence.**

## Project structure

```
deliver/brandklout/west-la-implants/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # Read before any platform action
└── workflows/                # 00–10, copied from deliver/process/ at 8d65269
```

Client-provided material goes once into
`workflows/00-client-delivery-initialization/.tmp/client-handoff/`. Everything produced later lives
in the `.tmp/` of the workflow that produces it. No client-level `assets/` folder.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
