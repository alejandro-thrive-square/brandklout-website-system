# Project Overview — Institute for Advanced Dentistry

| Field | Value |
| :--- | :--- |
| **Client** | Institute for Advanced Dentistry (Dr. Jonathan Bensoussan, prosthodontist) |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Existing site** | https://www.ifadentistry.com/ — WordPress 7.1 (Site Kit by Google, MotionPage). No XML sitemap is exposed; every sitemap URL returns the HTML 404 page |
| **Selected offer** | `Development from Scratch` (full site, built new). Inferred from the Asana project shape — "Design Home Page" → "Complete Client Website" — not from a Sales handoff |
| **Source** | Brandklout Asana project **BK Implementation - Institute For Advanced Dentistry & Implants** `1215461031852894`, owner Jessica |
| **Asana tasks** | `1217929763942271` Design Home Page (due **2026-09-21**), `1215476573810829` Complete Client Website (no due date) — both assigned to Alejandro. Full tree in [`../workflows/01-content-intake/.tmp/asana-context/CONTEXT.md`](../workflows/01-content-intake/.tmp/asana-context/CONTEXT.md) |
| **Due** | Home page design 2026-09-21; "Study the site" 2026-09-18; "Extract All Assets" 2026-09-03 |
| **Started** | 2026-09-03 (client folder initialized) |
| **`process_baseline_commit`** | `21ae9682` (2026-08-28) |
| **Worktree** | `bk-ifa-dentistry` → this folder only |

## Practice profile

From Jessica's 2026-08-29 Asana comment (the client's own "what sets us apart" brief, verbatim in
the Asana context artifact) and the live site, 2026-09-03:

| Field | Value |
| :--- | :--- |
| Practice | Institute for Advanced Dentistry — specialty prosthodontic practice, history to **1954**, "Arizona's first prosthodontic practice" |
| Doctor | Dr. Jonathan Bensoussan — surgically trained prosthodontist, three-year UCSF Prosthodontics residency, Kois Specialty Graduate, treating patients since 2015 |
| Address | 13360 N 94th Dr, Suite B, Peoria, AZ (serves Peoria and Phoenix) |
| Phone | (602) 242-2256 |
| Positioning (current title tag) | "Knowledgeable, Friendly, Comprehensive Dentistry in Peoria and Phoenix, AZ" — **the client's own brief says the opposite: a high-touch specialty practice, not a comprehensive general one.** Design to the brief |
| Languages | English, French, Dutch |

**Two focus areas, per the client**, and the site should be organised around them:

1. **Cosmetic Dentistry & Smile Makeovers** — porcelain veneers, cosmetic crowns, smile makeovers,
   full-mouth rehabilitation; digital smile design with 3D-printed provisionals the patient wears
   before final ceramics.
2. **Dental Implants & Teeth in a Day** — single implants to full-arch All-on-X; surgery and
   restoration by the same prosthodontist, teeth designed first and implants planned around them.

**The differentiator is who designs the case**: Dr. Bensoussan personally develops diagnosis,
treatment plan, smile design, implant positioning and provisionals; laboratories execute his design,
not the other way round. Technology (CBCT, TRIOS, X-Guide navigation, FastMap photogrammetry,
SprintRay 3D printing) is a supporting cast, and the client says so explicitly.

**Claims the client supplied** (use only these, verbatim — they are the client's own figures):

| Claim | Client figure |
| :--- | :--- |
| Smile makeovers completed | 500+ |
| Veneer and crown cases | 4,000+ |
| Dental implants placed | **2,500+ in the narrative, 2,800+ in the "Implant Statistics" list** — the brief contradicts itself; ask which |
| Implant survival rate | 98% verified |
| Reviews | 85 five-star reviews, 5/5 average |
| Awards | Phoenix Magazine Top Dentist / Top Prosthodontist, 4 consecutive years |
| Warranty | Results-based warranty on qualifying surgical and restorative treatment |
| Placeholder left in the brief | "smile transformations for [X+ patients]" — unfilled by the client |

> [!IMPORTANT]
> Never invent testimonials, reviews, patient stories or statistics. The figures above are the
> client's; anything not in the table needs the client to supply it.

## What already exists — read before designing

- **A Webflow site exists.** Trong Huynh (Brandklout) posted
  https://institute-for-advanced-dentistry---conc.webflow.io/ on 2026-08-31. Its page title is
  "Institute for Advanced Dentistry — Homepage Concepts" and its `data-wf-site` is
  `6a946f89a8315fa7643642e3`. **That site is not in the shared `webflow-brandklout` grant** (79
  sites listed 2026-09-03, none with that id), so it is read-only via the public URL until the grant
  is re-authorized per [`../../docs/mcp-access.md`](../../docs/mcp-access.md). Whether it is
  Brandklout's own concept, a vendor's, or the intended build target is an open question.
- **A survey is done.** Jessica's 2026-08-29 comment on "Complete Client Website" links an Asana
  asset (`asset_id=1217954436752458`) — the context pull found no downloadable attachment, so it is
  an inline asset that must be opened in the Asana UI.
- **Done dependencies** on Complete Client Website: "Add Pricing Information for the Pages" and
  "Get Client's Financial Payment option link/info". Their content was not in the pull; ask
  Brandklout where it lives (likely the Share Drive the asset-extraction task names).
- **Open dependency**: "Style Guide" blocks both Design Home Page and Complete Client Website.

## Routed workflows — `Development from Scratch`

Copied from `deliver/process/` at baseline `21ae9682`. Route:
`00` → `01` → `02` → `03` → `04` → `05` → `06` → `07` → `08` → `09` → `10`.

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | **Done** | This doc + `mcp-access.md`; folder scaffolded; Asana brief pulled |
| `01-content-intake` | **In progress** | Maps to Asana "Study the site" + "Extract All Assets" (due 2026-09-03, already due). **Scrape done 2026-09-04**: `workflows/01-content-intake/.tmp/current-site-scrape/` holds a working local mirror (`site/index.html`), 56 desktop screenshots, the full 237-file media library, 3 of 10 Vimeo clips, and per-page text extracts; read `current-site-inventory.md` there first. The Yoast sitemap serves the 404 page, so the crawl came from the WP REST API. Still open: 7 domain-locked Vimeo clips (4 are the practice's own testimonials), placing the assets in Brandklout's Share Drive, and the questionnaire/summary side of intake |
| `02-wireframe` | Pending | Asana "Comparable sites" (3 minimum) and "Content Gap analysis" (SpyFu) sit here |
| `03-graphic-resources` | Pending | Client's own photography first; the practice documents smile transformations |
| `04-design` | Pending | Home page first, due 2026-09-21. Elevated build from day one per [DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md): photograph in every chapter, GSAP scroll moves, varied grounds, a sentence per idea |
| `05-design-revisions` | Pending | Client review via Brandklout |
| `06-content-seo` | Pending | Current site targets "Peoria / Phoenix comprehensive dentistry"; the new positioning is specialty prosthodontics — a deliberate keyword shift, plan it |
| `07-webflow-build` | Pending | Target site unconfirmed — see open questions |
| `08-qa` | Pending | |
| `09-launch` | Pending | Replacement at `ifadentistry.com` needs a redirect map — see below |
| `10-handoff-support` | Pending | Asana subtask "Setup GHL for organic leads" belongs to Brandklout, not this route |

### Modules deliberately not copied

| Module | Why |
| :--- | :--- |
| `11-figma-review-build-planning` | No Figma source |
| `12`, `13` | Content is re-authored from the brief, not migrated |
| `14-migration-seo-redirects` | **Not copied, but flagged.** If the new site replaces `ifadentistry.com`, copy it in before `09-launch` |
| `15`, `16`, `17`, `18`, `20` | Not on this offer. `18`/`20` apply only if the build lands on Instatic |

## Open questions — close these before dispatching `04-design`

1. **Build target.** Is `6a946f89a8315fa7643642e3` ("Homepage Concepts") the site to build in, or a
   concept to be replaced? Either way the shared grant must be re-authorized with it ticked.
2. **Page count and site map.** "Complete Client Website" has no scope. The Asana project says
   "Start the work on the site map" — the site map is ours to propose in `02`.
3. **Style Guide** — the blocking Asana task. Who owns it, and does a brand exist beyond the logo?
4. **Implant count** — 2,500+ or 2,800+. **Smile-transformation patient count** — the `[X+]`
   placeholder.
5. **Pricing and financing** — two done Asana tasks hold this; where is the content?
6. **Survey results** — the inline Asana asset from 2026-08-29.
7. **Domain plan** — replacement at `ifadentistry.com` (needs `14`) or new domain.
8. **Photography** — originals of the smile transformations, or extract from the live site.

## Project structure

```
deliver/brandklout/institute-for-advanced-dentistry/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # Read before any platform action
└── workflows/                # 00–10, copied from deliver/process/ at 21ae9682
    └── 01-content-intake/.tmp/asana-context/   # The Asana brief, pulled 2026-09-03
```

Client-provided material goes once into
`workflows/00-client-delivery-initialization/.tmp/client-handoff/`. Everything produced later lives
in the `.tmp/` of the workflow that produces it. No client-level `assets/` folder.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
