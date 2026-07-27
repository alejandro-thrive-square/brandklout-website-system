# Workflow: 05 - Design Revisions (Giovanni Serrano)

## Client-Facing Overview
After the first design draft is reviewed, we apply the approved correction list, update the design files, and prepare the final package for development or Vercel delivery.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Own Giovanni's post-design correction loop and maintain the approved `final-design` package. For this project, the package now functions as both the approved design source and the proposed deployable Vercel site with an Airtable-backed portfolio CMS.

## Inputs From Sales / Previous Phase
- First-draft design package from `04-design`
- Client correction documents and approved revision notes

## Execution Steps
1. Receive and normalize the approved client correction set.
2. Store the authoritative correction notes in `.tmp/final-changes/`.
3. Duplicate `04-design/.tmp/final-design/` into `05-design-revisions/.tmp/final-design/`.
4. Apply approved revisions to the copied package.
5. Republish the revised design for review when needed.
6. Record the final approved package for the selected delivery path: proposed Vercel deployment now, optional Webflow Build later if requested.

## Offer-Specific Adaptations
- **Development from Scratch**: Required after Design and before Content & SEO/Webflow Build.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- `05-design-revisions/.tmp/final-changes/` is the sole authoritative location for Giovanni's final correction notes.
- **Source of truth is `.tmp/final revisions/` (with a space), not `.tmp/final-design/`.** It carries the seven live pages — `index`, `invest`, `scale`, `develop`, `sell`, `projects`, `project-detail` — and is the input consumed by `07-webflow-build/build_vocab.py` and `html_to_webflow.py`. `.tmp/final-design/` is the older five-page package. Apply client punch lists to `final revisions/`.
- **Revisions here invalidate the `07-webflow-build/.tmp/` paste artifacts.** Those `paste_*.html` files are generated copies of this CSS/markup; after any change, regenerate them with `html_to_webflow.py` before pasting into Webflow, or the Designer will receive the pre-revision design.
- Chrome-height and tap-target QA can be reproduced headlessly with Playwright from `07-webflow-build/` (`node_modules` already includes it) by loading each page over `file://` at 320/360/390/477px.
- The approved static Vercel preview in `.tmp/final-design/` is also the proposed published site package and includes a serverless Airtable portfolio integration:
  - `api/portfolio.js` reads portfolio records from Airtable using Vercel environment variables and never exposes the Airtable token to browser code.
  - `index.html` renders the portfolio section from `/api/portfolio` into `#portfolio-featured`, `#portfolio-featured-tags`, and `#portfolio-groups`.
  - Required Vercel environment variables: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`; optional `AIRTABLE_PROJECTS_TABLE` defaults to `projects`, and optional `AIRTABLE_CATEGORIES_TABLE` enables linked category-name sorting when a separate category table exists.
  - Portfolio API responses use `Cache-Control: no-store` and the browser fetch uses `{ cache: 'no-store' }` so Airtable content edits are reflected on reload during preview/client review.
- Deployment and maintenance details live in `deliver/giovanni-serrano/docs/vercel-airtable-deployment.md`.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-changes/`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/revision-manifest.json`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-design/`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-design/api/portfolio.js`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/vercel-preview-url.txt`
- `deliver/giovanni-serrano/docs/final-design-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-design-revisions-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
