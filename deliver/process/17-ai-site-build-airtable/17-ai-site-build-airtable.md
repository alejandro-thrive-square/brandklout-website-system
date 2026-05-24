# Workflow: 17 - AI Site Build & Airtable

## Client-Facing Overview
We turn the approved Claude design package into the final coded website, wire scoped dynamic content through Airtable, refine responsive and motion behavior, and prepare a Vercel-ready site for QA.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the executor, stack assumptions, Airtable integration pattern, or output schema of this workflow must be documented here immediately.

## Operational Purpose
Build the production website package for the `AI Site with Claude, Vercel & Airtable` offer without routing the project through a Webflow build. This module starts after the approved wireframe, design draft, and design-revision package exist. It owns the code implementation work that turns the approved design source into a Vercel-deployable site with Airtable-backed content where scoped.

The workflow may produce a plain HTML/CSS/JS deployment root or a Vercel-compatible app structure selected for the signed scope. It must preserve server-side secret handling for Airtable and keep the deployable package inside the owning workflow `.tmp/` folder until it is copied or deployed through the Vercel deployment workflow.

## Inputs From Sales / Previous Phase
- Sales handoff with `runtime_stack`, `airtable_scope`, `dynamic_content_types`, `vercel_launch_expectation`, and `seo_rendering_expectation`.
- Approved final wireframe structure from `02-wireframe`.
- Approved Claude design package and correction list from `04-design` and `05-design-revisions`.
- Final content and SEO decisions from `06-content-seo` when that module is scoped.
- Airtable schema decision, content samples, field mapping, and non-secret runtime configuration names when dynamic content is in scope.

## Execution Steps
All `.tmp/` paths below resolve to `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/`.

1. Confirm the approved design package, page list, content state, integrations, and delivery target before implementation starts.
2. Choose the Vercel-compatible implementation shape for the scope and record it in `.tmp/build-plan.md`.
3. Build the final interface from the approved Claude design package, including navigation, page templates, animations, forms, accessibility basics, and responsive behavior.
4. Define the Airtable content contract for scoped dynamic sections: table purpose, fields, sort/filter rules, fallbacks, and SEO rendering expectation.
5. Implement server-side Airtable access through Vercel Functions or the approved server-side route pattern. Keep tokens and secret values out of browser code and version-controlled artifacts.
6. Connect the frontend to same-origin content routes and handle loading, empty, populated, and failure states.
7. Run a responsive and motion pass for desktop, tablet, and mobile surfaces before QA.
8. Record the deployment root, required Vercel environment variable names, Airtable route notes, known SEO tradeoffs, and QA handoff checklist.

## Offer-Specific Adaptations
- **AI Site with Claude, Vercel & Airtable**: Required after final design approval. This module replaces `07-webflow-build` for the coded production site path.
- **Development from Scratch**: Not used unless the signed agreement changes from Webflow production delivery to this stack.
- **Figma to Webflow**: Not used.
- **Migration to Webflow**: Not used.
- **Webflow Improvements & Updates**: Not used unless a separately scoped Vercel/Airtable deliverable is approved.

## Airtable Rules
- Use Airtable only for the dynamic content types included in the signed scope.
- Browser code must call same-origin site routes such as `/api/projects`; it must not call Airtable with a token directly.
- Store Vercel environment variable names in docs and manifests; never commit token values, `.env` files, full credentials, or private secrets.
- Record whether dynamic content must be present in the initial HTML for SEO. Client-side rendering is not a silent default for SEO-critical detail pages.
- Hand deployment-specific Airtable runtime checks to `16-vercel-deployment`.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Validate build manifests, generate Airtable field contracts, check secret boundaries, run responsive screenshot checks, and package the deployment root for `16-vercel-deployment`.
- **Likely integrations**: Claude, Airtable API, Vercel Functions, Vercel CLI, Playwright, Lighthouse.

## Output Artifacts
- `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/build-plan.md`
- `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/site-package/`
- `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/airtable-content-contract.md`
- `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/runtime-env-vars.md`
- `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/seo-rendering-notes.md`
- `deliver/[client-name]/workflows/17-ai-site-build-airtable/.tmp/qa-handoff.md`
- `deliver/[client-name]/docs/ai-site-build-notes.md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight implementation plans, manifests, and text artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Secrets**: Never commit Airtable tokens, Vercel secret values, `.env` files, or private credentials.
- **Branch naming**: `deliver/[client-name]-ai-site-build-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **Runtime deployment**: Vercel
- **CMS**: Airtable when dynamic content is scoped
- **OS**: Ubuntu 24.04 LTS
