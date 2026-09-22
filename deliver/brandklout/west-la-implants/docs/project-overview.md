# Project Overview — West LA Implants

| Field | Value |
| :--- | :--- |
| **Client** | West LA Implants (Dr. Tony Barriere, DDS) |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Existing site** | https://westlaimplants.com/ — WordPress (Rank Math SEO, Site Kit by Google) |
| **Selected offer** | `Development from Scratch` (full site, built new — not a page-for-page migration) |
| **Source** | Brandklout. Asana **"Complete Client Website" 1216841931530915** (project "BK Implementation - West LA Implants" 1213035312304439, owner Jessica); also "West LA All on 6 Page" and "West La 3 on 6 Landing Page" ad tasks |
| **Due** | Not set |
| **Instatic instance** | `https://west-la-implants-production.up.railway.app` — Railway project `a55b5cac-b92d-4653-a9ff-6da522a5c89c`, service "West LA Implants", provisioned 2026-09-10. Homepage review build only; the client domain stays on WordPress |
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
| `01-content-intake` | **Done (2026-08-20, extended 2026-09-10)** | Client scrape 91/91 + 102 MB asset mirror; three competitors in full (Wilshire OMS, Santa Monica OMS, Implant Center LA); `gap-analysis/HOMEPAGE-GAP-ANALYSIS.md` is the homepage blueprint |
| `02-wireframe` | **Done (2026-09-22)** | `sitemap.json` + `wireframe-rationale.md`: 34 designed pages + journal, decided from the gap analysis; no separate wireframe round |
| `03-graphic-resources` | **Done for the homepage** | The practice's four B-roll clips and 1080p stills cut from them carry the page; no stock used. Catalogue in `03-graphic-resources/.tmp/ASSETS.md` |
| `04-design` | **Full site built (2026-09-22)** | Homepage 2026-09-10 (approved 2026-09-22); the other 33 designed pages and the 46-entry journal rendered from `pages/` and `templates/` through `lib/blocks.mjs` |
| `05-design-revisions` | In progress | Homepage: two BugHerd rounds closed. Full site: awaiting Brandklout's review |
| `06-content-seo` | **Done in the build** | Titles/descriptions per page, FAQPage + Dentist + procedure JSON-LD injected at runtime (`js/80-seo.js`), six neighbourhood pages, the journal carried over |
| `07-webflow-build` | **Superseded by Instatic** | The build ships to the client's Instatic instance through `21-instatic-upload/` (Stone Med Spa lineage), not Webflow. Kept for the component library only |
| `08-qa` | **Ongoing** | `check-local.mjs` (local and live), six-breakpoint screenshots, plus the five 21-instatic-upload gates |
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

## Open questions

Read [`RUNBOOK.md`](./RUNBOOK.md) for the live list. The original set, for the record:

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
