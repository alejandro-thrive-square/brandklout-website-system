# Project Overview — Stone Med Spa

| Field | Value |
| :--- | :--- |
| **Client** | Stone Med Spa — the non-surgical pillar of Dr. Mona Stone's practice |
| **Trading name** | Unconfirmed. Instagram calls it **Westlake Medical Aesthetics**; Asana calls it *Stone Med Spa*. Nobody has told us which is the brand. |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Asana task** | [`1217160668112180`](https://app.asana.com/1/1210572425689866/project/1213901750672059/task/1217160668112180) — "Build New Stone Med Spa" |
| **Asana project** | `BK Activation - Stone Dental Implant Center` `1213901750672059` |
| **Due in Asana** | **2026-09-03** (moved once; it previously had no date) |
| **Scope** | A full website, assumed. The task says "Build New Stone Med Spa" without the word *website*. |
| **Worktree** | `bk-stone-med-spa` — its own, created 2026-09-02 |
| **Branch base** | `main` at `21ae9682` (`process_baseline_commit`) |
| **Started** | 2026-09-02 |

> [!IMPORTANT]
> **Same practice, different brand, deliberately separate worktree.** This is the third pillar of
> Dr. Mona Stone's practice. The other two are in `webzite-agentic-workflow`-adjacent folders of
> this repo that **this worktree cannot see**, on purpose:
>
> | Pillar | Brand | Where it lives | Status |
> | :--- | :--- | :--- | :--- |
> | Oral & maxillofacial surgery | Stone Dental Implant Center | `stone-dental-implant-center/` on `main` | **Live on Webflow.** 43 URLs. |
> | Cosmetic facial *surgery* | Stone Surgical Arts | `stone-dental-implant-center/workflows/04-design/.tmp/surgical-arts/` on branch `bk-stone` | 12 pages built and published to Instatic 2026-09-02 |
> | **Non-surgical skin & aesthetics** | **Stone Med Spa / Westlake Medical Aesthetics** | **here** | **Not started.** Blocked — see below. |
>
> The sparse checkout excludes the sibling folders for the same reason Mason Park Kids excludes
> Mason Park: one surgeon, one address, near-identical page shapes, and every detail that matters
> differs. Sessions that held both kept crossing the two sites' facts. Do not work two Stone
> pillars from one session.

## The blocker — RESOLVED 2026-09-03 by the client

> [!IMPORTANT]
> **It is the modality split, and the client drew the line themselves.** On 2026-09-03 the client
> sent the practice's own two category images, archived at
> [`01-content-intake/.tmp/client-references/`](../workflows/01-content-intake/.tmp/client-references/).
> They partition the menu with no ambiguity:
>
> | Surgical — Stone Surgical Arts | Med spa — this site |
> | :--- | :--- |
> | MyEllevate® Facelift · Neck Lift · Facelift \| Easy Lift · FaceTite · Facial Implants · Chin Sculpting & Reshaping · Buccal Fat Removal · Blepharoplasty · Neck Liposuction · Skin Lesion Removal · Male Facial Enhancement · Facial Fat Transfer | Dermal Fillers · Botox \| Xeomin · Morpheus8 · Hair Restoration · PRP Treatment · Chemical Peels · Dysport & Jeuveau |
>
> This is **outcome 2** below — the NassifMD pattern the competitive research recommended as the
> default. The cut is at the incision, not at the price: FaceTite is minimally invasive but still
> an incision under local anaesthetic, so it is surgical; Morpheus8 delivers radiofrequency through
> microneedles, so it is here.

### What the blocker was

**Stone Surgical Arts had already built and published the entire med spa menu.** Its treatments hub
carries a fee schedule for FaceTite, CO2 laser resurfacing, Morpheus8, chemical peels, Cosmelan,
HydraFacial MD, microneedling, SkinPen, PRP, Botox & Xeomin, Sculptra, dermal filler and hair
restoration. Building the med spa without an answer produced one of three outcomes and we could not
pick between them:

1. **A second site that competes with the first** for the same searches and the same patients.
2. **A menu cut out of Surgical Arts** and moved here — *this is the answer*.
3. **A different brand entirely** — memberships, wellness, weight loss, skin maintenance.

### What the answer now obliges, and neither task is on this worktree

> [!WARNING]
> **Stone Surgical Arts still sells all seven of these treatments**, at published prices, on a live
> staging link the client has reviewed. Choosing outcome 2 means that page **loses them**, and a
> **301 redirect map** from those URLs to these has to exist before either domain goes live. That
> work is on the `bk-stone` worktree.

> [!CAUTION]
> **Six treatments the sibling sells are on neither list the client sent** — Sculptra, CO2 laser
> resurfacing, HydraFacial MD, microneedling, SkinPen and Cosmelan. They are non-surgical, so by
> the stated rule they belong here, but the client did not name them. They are **not** in the
> build. Ask before adding them; do not infer a menu the client did not write.

## What we actually know

Everything below came from public research and the archived site, not from a brief.

| | |
| :--- | :--- |
| **Surgeon** | Dr. Mona Stone, DDS — board-certified oral & maxillofacial surgeon, the sole provider behind all three names |
| **Address** | 72 Andorra Dr #110A, Westlake, TX 76262 |
| **Phone** | (817) 383-8361 |
| **Brand identity** | **Does not exist as far as we can find.** No logo, palette or type system for a med spa brand. If identity is ours it sits on the critical path ahead of design. |
| **Domain** | None chosen. `stonesurgicalarts.com` currently resolves to the implant centre and is already contested by the Surgical Arts build. |
| **Content** | Recoverable from the Wayback archive — see [`archived-urls-medspa.md`](../workflows/00-client-delivery-initialization/.tmp/archived-urls-medspa.md). `web.archive.org` was blocking this IP as of 2026-08-30. |
| **Photography** | 15 archived before-and-after galleries of real patients (botox, lip fillers, CO2 laser, hair restoration). **Not usable** without current written consent per case. |

## Asana state, pulled fresh 2026-09-02

> [!IMPORTANT]
> **This pillar has two Asana tasks, in two different projects.** The build task above is bare. The
> page list lives somewhere else entirely and was found on 2026-09-02.

| Task | GID | Project | Content |
| :--- | :--- | :--- | :--- |
| Build New Stone Med Spa | `1217160668112180` | BK Activation `1213901750672059` | **Bare.** No description, comments, subtasks or attachments. One activity signal, a due-date change. |
| **Core Pages - MedSpa** | `1218112701145002` | **Success Daily Stand-Up** `1211830976769588` | **Eleven named subtasks** — the first real page list this pillar has had. Every description empty. |

The eleven: Home · About Us · Meet The Doctor · Meet the Team · Services Overview · Service Page
Sample (Botox) · Testimonials / Before and After Gallery · Financing · Book Consultation (Virtual
and In-Office) · Membership Plan · General Thank You Page.

> [!WARNING]
> **A page list is not a scope decision.** The eleven subtasks do not answer the blocker above —
> two of the eleven (`Services Overview`, `Service Page Sample (Botox)`) are exactly the pages that
> collide with Stone Surgical Arts. Do not read the list as permission to start.

Compare Surgical Arts, whose build was unblocked by a nine-page list Sang Huynh posted in a comment
*and* a design Jessica confirmed Dr. Mona picked. We now have the page list; we still have no scope
decision and no design.

Re-pull before trusting any cached copy — the slug pulls only the first task, so the second needs
its GID:

```
node deliver/brandklout/scripts/asana-context.mjs --task 1217160668112180 --out <dir>
node deliver/brandklout/scripts/asana-context.mjs --task 1218112701145002 --out <dir>
```

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | **Done 2026-09-02** | This folder. Med-spa-specific scoping questions in `.tmp/`. |
| `01-content-intake` | **Partial 2026-09-03** | Unblocked. The client's two category images are in `.tmp/client-references/` and are the source of truth for the menu split. The archived corpus is catalogued and still unmined. |
| `02-wireframe` | **Research done 2026-09-02** | Competitive research against five best-in-class med spa sites, and a proposed eleven-page sitemap. See [`.tmp/competitive-research.md`](../workflows/02-wireframe/.tmp/competitive-research.md) and [`.tmp/sitemap.md`](../workflows/02-wireframe/.tmp/sitemap.md). Proposed, not approved. Wireframes not started — they need the scope answer. |
| `12-migration-audit-plan` | **Applies** | Content is recovered from an archived WordPress site and a redirect map is needed. |
| `04-design` | **Eleven pages built 2026-09-03, local only** | All eleven Asana core pages, in `.tmp/med-spa/`. Carries the Surgical Arts style guide by client request; every section shape is new. `audit.mjs` FAIL none WARN none; `all-pages.mjs` 11 pages × 3 widths clean. **Not published, no domain, brand identity still does not exist.** Read [`HANDOFF.md`](../workflows/04-design/.tmp/med-spa/HANDOFF.md) before touching it. |
| `05-instatic-upload` | Tooling copied, unused | Snapshot of the Surgical Arts instance at `bk-stone` — the only place it exists. Read its traps 21–25 before the first publish. |
| `20-instatic-domain-origins` | Later | Canonical, in `deliver/process/`. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

> [!IMPORTANT]
> Brandklout is a **partner engagement**, not a per-page client. Never compute or record a price,
> rate, quote or cost anywhere in this folder.

## Recommended next action

Q1 is answered and the eleven core pages are built, so what is left is the set of questions the
build could not answer for itself. Every one needs the client, not more build time. In priority
order, because the first has weeks of lead time:

1. **Per-case written consent for the before-and-after photography.** It gates the strongest asset
   on the site. Fifteen archived galleries are ready and none can be published. `/results` and
   `/botox` ship a reserved frame that says so, and degrade without a redesign.
2. **The trading name.** Asana says *Stone Med Spa*; the live Instagram is *@westlakeaesthetics*,
   "Westlake Medical Aesthetics". It is in the wordmark, every H1 and every page title. Cheap to
   change now, expensive after the client has reviewed eleven pages.
3. **The domain.** None chosen. `seo.json` carries a deliberate placeholder origin and the build
   must not be published until it is replaced.
4. **NAP.** The phone and suite recorded in this file are the same two values the Surgical Arts
   footer flagged as belonging to the *sister* practice. One line settles whether the med spa
   really shares that line.
5. **The virtual consultation.** Who takes the call, on what platform, and is it HIPAA-compliant?
   The booking page ships two paths and an inert form until this is answered.
6. **Clinical sign-off** from Dr. Stone on every duration, onset and downtime in
   `treatments-data.mjs` and on the Botox page.
7. **Team roles**, and the five legal/utility pages (Contact, Privacy, Terms, Accessibility, 404)
   the sitemap flags as sitting outside the eleven.

Full detail, with what each one blocks, is in
[`HANDOFF.md`](../workflows/04-design/.tmp/med-spa/HANDOFF.md).

The 2026-09-03 due date is met as eleven built pages plus the scope decision the client themselves
supplied — not as a launch, which none of the seven items above would allow.

## Project structure

```
deliver/brandklout/stone-med-spa/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # Read before any platform action
└── workflows/
    ├── 00-client-delivery-initialization/.tmp/
    │   ├── scoping-questions.md      # Med-spa-specific, NOT sent
    │   ├── archived-urls-medspa.md   # The non-surgical slice, classified
    │   ├── archived-urls-raw.txt     # All 183 archived URLs
    │   └── discovery-findings.md     # Public research, 2026-08-05
    ├── 01-content-intake/.tmp/
    │   └── client-references/         # The two category images that settled the menu split
    ├── 02-wireframe/.tmp/             # Competitive research, sitemap, competitor screenshots
    ├── 04-design/.tmp/med-spa/
    │   ├── HANDOFF.md                 # READ FIRST. Open items, and what each one blocks.
    │   ├── site-src/                  # The build. `node build-site.mjs`
    │   │   ├── treatments-data.mjs    # The seven. Four views on the site are generated from it.
    │   │   ├── build-site.mjs         # Also writes css/60-cadence-plan.css
    │   │   ├── css/ js/ pages/ partials/ assets/
    │   │   ├── audit.mjs              # Static gate. FAIL none WARN none.
    │   │   └── all-pages.mjs          # 11 pages x 390/1024/1440. Clean.
    │   ├── final-site/                # Build output, 11 pages
    │   └── shots/                     # Review screenshots (gitignored, *.png)
    └── 05-instatic-upload/            # Tooling snapshot from bk-stone, still unused
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
