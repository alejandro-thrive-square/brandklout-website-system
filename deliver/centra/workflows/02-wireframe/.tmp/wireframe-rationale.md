# CENTRA — Wireframe Rationale & IA Notes

Low-fidelity, RTL Hebrew wireframes built directly from the brief sitemap ([sales/noam-nizrad/docs/sitemap.md](../../../../sales/noam-nizrad/docs/sitemap.md)) as a **pre-sale value-add**. Goal: lock information architecture and page flow before visual design, and demonstrate that we understood the (bilingual) brief.

## How to view
Open [wireframes/index.html](./wireframes/index.html) and navigate the four pages. Grey boxes = placeholders; yellow notes = items to confirm or client-supplied assets.

## Pages & flow
1. **Home** — Hero (3D device) → Logo gallery → Warranty lookup → Counters → Team → Contact form.
2. **EFFECTIVE ROBOTICS** — Brand intro → Logos → Coverage map → Service journey (3) → Service standard (3) → Areas of expertise (5).
3. **CENTRA Installations** — Intro → Work gallery → Samsung credential → Areas of expertise (5) → Contact form.
4. **Special / Government Projects** — Intro → Expandable project list → Contact form.

## Key IA decisions
- **One conversion path per page.** Every page ends in (or surfaces) a contact form tuned to that audience: consumer repair (Home), installation request (Installations), large-project enquiry (Special Projects).
- **Home hero leads with the company promise + the 3D device** — the brief's signature visual. Treated as the page's focal interaction.
- **Warranty lookup placed high on Home** — it's a frequent, high-intent task for existing customers; kept as its own section rather than buried.
- **Special Projects uses an accordion** — matches the brief's "each icon opens a text bar," keeps the page short, and lets the strong Ministry of Health story lead.

## CMS-bound regions (recommended)
- Logo gallery brands · Team members · Areas-of-expertise cards · Work gallery items · Special-projects entries.
- Rationale: these are repeating records the client will want to update without a developer.

## Custom / non-standard components (affect design + build effort)
- **Animated 3D exploded-device hero** (chip + "fixing" hand) — Spline/Lottie; client supplies the 3D object after approval.
- **Warranty serial-number lookup** — needs a backend / catalog data source. Clarify before build.
- **Animated counters** (count-up on scroll) and **moving logo marquee**.

## Open items to confirm with client
- 2 blank expertise cards on Installations (marked `X?`).
- 2 rough project blurbs on Special Projects (Leumit, Education).
- Pending assets: hero 3D object, Israel coverage map image, section icons.
- Warranty lookup data source / backend.

## Status
Draft for client review. On feedback: apply corrections, then persist approved IA to `deliver/centra/docs/ia-approval.md` (per canonical [02-wireframe.md](../../../process/02-wireframe/02-wireframe.md)).
