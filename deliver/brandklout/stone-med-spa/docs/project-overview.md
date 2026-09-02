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

## The blocker, and it is not a formality

**Stone Surgical Arts has already built and published the entire med spa menu.** Its treatments
hub carries a fee schedule for FaceTite, CO2 laser resurfacing, Morpheus8, chemical peels,
Cosmelan, HydraFacial MD, microneedling, SkinPen, PRP, Botox & Xeomin, Sculptra, dermal filler and
hair restoration. Two of the four categories in the design Dr. Mona approved are named **Skin** and
**Non-Surgical**.

That is this brand's whole product. There is no service left for a med spa site to sell that the
surgical site is not already selling, at published prices, on a live staging link the client has
seen.

This is scoping question 1 from 2026-08-05, which was drafted and **never sent**. It stopped being
a planning question the moment Surgical Arts published. Building the med spa now, without an
answer, produces one of three outcomes and we cannot pick between them:

1. **A second site that competes with the first** for the same searches and the same patients.
2. **A menu cut out of Surgical Arts** and moved here, which means editing a site the client has
   already reviewed.
3. **A different brand entirely** — memberships, wellness, weight loss, skin maintenance — that
   happens to share a treatment room.

> [!WARNING]
> **Do not start design until Brandklout answers which of the three it is.** The overlap is not a
> content detail; it decides the page list, the positioning and whether the sibling site changes.

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
| `01-content-intake` | **Blocked** | Needs the scope answer. The archived corpus is catalogued and ready. |
| `02-wireframe` | **Research done 2026-09-02** | Competitive research against five best-in-class med spa sites, and a proposed eleven-page sitemap. See [`.tmp/competitive-research.md`](../workflows/02-wireframe/.tmp/competitive-research.md) and [`.tmp/sitemap.md`](../workflows/02-wireframe/.tmp/sitemap.md). Proposed, not approved. Wireframes not started — they need the scope answer. |
| `12-migration-audit-plan` | **Applies** | Content is recovered from an archived WordPress site and a redirect map is needed. |
| `04-design` | **Blocked** | Needs the scope answer *and* a brand identity that does not exist. |
| `05-instatic-upload` | Tooling copied, unused | Snapshot of the Surgical Arts instance at `bk-stone` — the only place it exists. Read its traps 21–25 before the first publish. |
| `20-instatic-domain-origins` | Later | Canonical, in `deliver/process/`. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

> [!IMPORTANT]
> Brandklout is a **partner engagement**, not a per-page client. Never compute or record a price,
> rate, quote or cost anywhere in this folder.

## Recommended next action

**Send the med spa scoping questions.** They are four, they are short, and question 1 is the one
that decides whether this build exists at all. Draft:
[`scoping-questions.md`](../workflows/00-client-delivery-initialization/.tmp/scoping-questions.md).

**Ask Q1 as a yes/no, not as an open question.** The competitive research found a live, working
instance of outcome 2: **NassifMD Medical Spa**. Dr. Paul Nassif runs a surgical practice and a med
spa as two separate domains, cut along **modality** — the med spa sells injectables, lasers, body
contouring, aesthetician services and skincare and never sells an operation; the surgical site
never sells a HydraFacial — and joins them with a brand switcher in the header of both. Put that to
Brandklout as the recommended default and ask them to confirm or reject it. Name outcome 1 (two
competing sites) explicitly as the one to avoid, because it is what happens by default if nobody
decides. Two more client-side items belong in the same message: **per-case written consent** for
the before-and-after photography, and an operational answer for the **virtual consultation**.

The task is due 2026-09-03. It cannot be met as a website build. It can be met as a scope decision
plus a page list, which is the honest deliverable for a task nobody has specified.

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
    ├── 01-content-intake/.tmp/       # Empty until scope is answered
    ├── 04-design/.tmp/               # Empty until scope is answered
    └── 05-instatic-upload/           # Tooling snapshot from bk-stone
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
