# Project Overview — Dr. Nahlah

| Field | Value |
| :--- | :--- |
| **Client** | Dr. Esam Nahlah, D.D.S., M.S., FACP — Implants & Prosthodontics Specialists |
| **Current site** | https://drnahlah.com (WordPress + Yoast, Cloudflare) |
| **Lead source** | Inbound via Claude brand |
| **Scope** | Full rebuild of the entire site |
| **Design reference** | https://www.lakenonadentist.com (client-approved template) |
| **Locations** | McLean/Tysons Corner, VA + Alexandria, VA |
| **Started** | 2026-07-30 |

## Status

Discovery/extraction phase. The current site has been fully scraped and the design
reference fully captured. **No Sales handoff package exists yet** — see Open Questions.

## Asana source task

Tracked in Brandklout's Asana under `BK Activation - Dr. Esam Nahlah` (workspace
`1210572425689866`). Added 2026-08-05 from the Asana dispatch — see
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md).

| Task | GID | Note |
| :--- | :--- | :--- |
| [Conduct Research on New Client](https://app.asana.com/1/1210572425689866/task/1216611404338509) | `1216611404338509` | Due 2026-08-05 |

Verbatim from Asana: *"Conduct initial research on new client. Check out their website and assign
the development to someone on the team. Make the necessary Project inside of Asana for tracking."*

Two observations on that instruction:

1. **The research half is already done** — this repo holds a full scrape of `drnahlah.com`, the
   captured design reference, and a built light-theme home page (see Work Completed below). The
   task predates that work. It should be updated or closed rather than re-run from scratch.
2. **The two remaining halves are not ours to do unilaterally.** "Assign the development to someone
   on the team" and "Make the necessary Project inside of Asana" are both **writes to Asana that
   notify real Brandklout staff**, and the partnership access file forbids acting on tasks not
   assigned to Webzite without confirmation. Raise it with Brandklout instead of self-assigning.

## Selected Offer & Routing — ASSUMPTION, NEEDS CONFIRMATION

No `deliver-handoff-[client-id].md` was produced by Sales for this client, so
`selected_offer` is **unconfirmed**. The workspace has been provisionally routed as
**Development from Scratch + migration modules**, because the engagement has both
characteristics:

- Full redesign against an approved template → needs `01`–`05` (design chain)
- Existing WordPress site with 43 blog posts carrying local-SEO equity → needs
  `12`/`13`/`14` (migration audit, content export/import, SEO & redirects)

Modules copied into `workflows/`:

`00` · `01` · `02` · `03` · `04` · `05` · `06` · `07` · `08` · `09` · `10` · `12` · `13` · `14`

If Sales confirms this as a straight **Migration to Webflow**, modules `02`/`03` may
be dropped. If confirmed as **Development from Scratch** with no SEO obligation,
`12`–`14` may be dropped. Confirm before Wireframe begins.

## Timeline

Not yet computable. Per
[PRICING_TIMELINE_RULES.md](../../../../sales/PRICING_TIMELINE_RULES.md), full-build
offers run at **pages × 2 days**. The page count for the *new* site is not decided —
the current site has 33 pages + 43 posts, and the reference template runs 77 URLs.
Page count is the single biggest open scope variable and must be fixed before a
timeline or price is committed.

## Work Completed

| Deliverable | Location | Result |
| :--- | :--- | :--- |
| Client workspace | `deliver/dr-nahlah/` | 14 routed modules copied |
| Full site scrape | `workflows/01-content-intake/.tmp/current-site-scrape/` | 78/78 URLs, 0 failures, 284 media assets |
| Site inventory + findings | `.../current-site-scrape/current-site-inventory.md` | 9 defects found on live site |
| Design reference capture | `workflows/00-client-delivery-initialization/.tmp/design-system/lakenonadentist-reference/` | 78 desktop + 22 mobile full-page screenshots |
| Graphic asset extraction | `workflows/03-graphic-resources/.tmp/` | 911 files / 156 MB downloaded, 587 logical assets, 0 failures |

## Assets

Per [DELIVER_SYSTEM_RULES.md §3](../../../DELIVER_SYSTEM_RULES.md), assets are
workflow-owned:

- Design reference screenshots → `00-client-delivery-initialization/.tmp/design-system/lakenonadentist-reference/`
- Current-site content extract → `01-content-intake/.tmp/current-site-scrape/`
- Current-site graphic assets → `03-graphic-resources/.tmp/downloads/` (911 files,
  156 MB, fully downloaded). Catalogue and findings in `03-graphic-resources/.tmp/ASSETS.md`.

No client-level `assets/` folder is used. Screenshot and image binaries are
gitignored and sync to the VPS via `rclone`.

## Open Questions

1. **Sales handoff / signed offer** — no handoff package exists. What is the confirmed
   `selected_offer`, contract value, and timeline? Routing above is an assumption.
2. **Target platform** — Webflow is assumed (module `07-webflow-build` is copied), but
   never stated. Confirm before Wireframe.
3. **New page count** — the driver of both price and timeline. Straight 1:1 with the
   current 33 pages? Or restructured toward the reference's hub/spoke + location-landing
   model?
4. **Blog migration** — 43 posts with real local-SEO equity for "dental implants McLean
   VA". Migrate all, prune to top performers, or rewrite? Needs Search Console data.
5. **Brand naming** — "Dr. Nahlah" vs "Dental Group of Tysons" vs "Dr. Nahlah Implants &
   Prosthodontics Specialists" are used inconsistently sitewide. One decision needed.
6. **Phone-number conflict** — `/contact/` lists Tysons "Current Patients" as
   (703) 493-1358; the footer says (703) 448-3312. Which is correct?
7. **Flexbook booking** — three different booking URLs in use. Consolidate to one? Is
   Flexbook staying, or moving to another booking system?
8. **Smile gallery** — 110 before/after images. Are originals available at higher
   resolution, and is patient photo consent on file?
9. **Media re-use** — all 911 assets are now extracted. Which are re-used vs. reshot?
   This drives whether `03-graphic-resources` is a light readiness check or a full
   photography engagement. Four sub-questions block it:
   - **No vector logo exists.** The master is a 2594x782 PNG with an imperfect
     transparency cut-out. Request the original AI/EPS/SVG from the client.
   - **Adobe Stock imagery is in use** — do the licenses transfer to a rebuilt site?
   - **`alluredental-hero-girl-1.png`** is named for a different practice; provenance
     and licensing unknown.
   - **Patient photo consent** for the 99 before/after case images — on file?
10. **Location pages** — the reference site's city-landing-page pattern is a strong fit
    for the two offices. In scope?

## MCP Access

`docs/mcp-access.md` is **not yet written** — required before any MCP is used in this
client folder, per [DELIVER_SYSTEM_RULES.md §2.1](../../../DELIVER_SYSTEM_RULES.md).
No Webflow site exists for this client yet, so no MCP has been used. Write it at
Webflow Build time.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/dr-nahlah-<change>`.
