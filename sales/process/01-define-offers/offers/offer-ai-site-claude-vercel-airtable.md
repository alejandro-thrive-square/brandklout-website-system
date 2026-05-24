# Offer: AI Site with Claude, Vercel & Airtable

## 1. Overview
This offer applies when a client needs a custom website designed and built through an AI-assisted code workflow instead of a Webflow production build. The default stack is Claude for wireframing, design refinement, and implementation support; Vercel for preview and production deployment; and Airtable for lightweight dynamic content where a CMS is needed.

## 2. Client Profile
- Needs a polished website without requiring Webflow ownership as the final platform.
- Benefits from a fast wireframe-to-code loop, rich interface polish, custom animations, or a lightweight content system.
- May need portfolio items, projects, services, team entries, testimonials, or other structured content maintained in Airtable.
- Can work with a Vercel-hosted production site and an Airtable editing model for scoped CMS content.
- Typical keywords: "AI website build", "Claude website", "Vercel landing page", "Airtable CMS website", "custom coded marketing site".

## 3. Scope of Work

### Phase 1: Wireframe with Claude
- Gather the approved content direction, sitemap, page goals, and references.
- Create wireframes with Claude that define layout, hierarchy, section order, and conversion paths.
- Review and approve the wireframe before visual design polish begins.

### Phase 2: Claude Design Refinement
- Refine the approved wireframe into a production-minded HTML/CSS/JS design package.
- Establish visual direction, responsive behavior, section composition, interactions, and animation intent.
- Publish reviewable Vercel previews during the design and revision loop when needed.

### Phase 3: Interface Build & Airtable Content
- Finish the coded interface, animation behavior, responsive components, and accessibility basics.
- Model scoped dynamic content in Airtable when the site needs client-editable structured content.
- Keep Airtable credentials server-side through Vercel Functions or another approved server-side route; browser code must not expose Airtable secrets.
- Connect the site UI to Airtable-backed content routes and verify empty, loading, error, and populated states.

### Phase 4: Revisions & Responsiveness
- Apply approved design revisions after the first reviewable coded draft.
- Test desktop, tablet, and mobile breakpoints before launch.
- Resolve layout, motion, content, CMS rendering, and cross-browser issues found during QA.

### Phase 5: Vercel Deployment
- Deploy previews and the approved production site to Vercel.
- Configure Vercel environment variables for Airtable integrations without committing secret values.
- Connect a domain or subdomain when launch is in scope.
- Provide handoff notes for the deployed site and Airtable content model.

## 4. What the Client Needs to Provide
- Business goals, page list, copy status, references, and brand assets that already exist.
- Approval on wireframe and design direction checkpoints.
- Airtable content or approval for the Airtable base/table structure when dynamic content is in scope.
- Domain or DNS access for production launch.
- Any required legal, analytics, form, CRM, or third-party integration requirements before implementation starts.

## 5. Pricing Model
- Quote design and coded implementation per page using the canonical design + development formula unless the approved scope calls for a separate custom quote.
- Airtable content modeling, serverless content routes, complex animations, custom integrations, generated content pipelines, and non-standard application behavior may require separate scoping.
- Canonical rates and formulas: [PRICING_TIMELINE_RULES.md](../../../PRICING_TIMELINE_RULES.md).

## 6. Timeline Estimate
- Use the canonical design + development duration for page-based website scope: **Duration = pages x 2 days**.
- Add explicit schedule allowance for Airtable modeling, integration complexity, revision loops, domain launch coordination, or application-like features when they exceed the page formula.
- See [PRICING_TIMELINE_RULES.md](../../../PRICING_TIMELINE_RULES.md) for the canonical per-page rule.

## 7. Differentiators
- Fast iteration from Claude wireframes into a deployable coded site.
- Production deployment stays close to the design package instead of requiring a second platform rebuild.
- Airtable can give clients a lightweight editing surface for scoped dynamic content.
- Vercel previews make responsive and motion review concrete during delivery.
- Suitable for custom interfaces or animation details that are easier to control in code.

## 8. Risks & Mitigations
| Risk | Mitigation |
| :--- | :--- |
| AI-generated drafts introduce inconsistent structure or polish gaps | Treat Claude outputs as drafts, review each phase, and run QA before launch. |
| Airtable content is expected to behave like a full CMS or app backend | Scope collections, permissions, rendering, SEO needs, and editing expectations before build. |
| Secrets leak through browser code or committed files | Keep Airtable tokens in Vercel environment variables and use server-side content routes only. |
| Dynamic content needs indexable detail pages | Decide early whether static generation, server-rendered Vercel routes, or another platform path is required. |
| Page scope grows into product/application scope | Separate page-based website pricing from custom logic, integrations, and stateful features. |

## Version Control
- All changes to this offer must follow the version control rules in [SYSTEM_RULES.md -- Section 4](../../../../SYSTEM_RULES.md).

## Infrastructure
- **Hosting**: Hostinger VPS
- **Runtime deployment**: Vercel
- **CMS**: Airtable when dynamic content is scoped
- **OS**: Ubuntu 24.04 LTS
