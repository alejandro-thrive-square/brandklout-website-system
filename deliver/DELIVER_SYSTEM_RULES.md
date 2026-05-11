# Deliver Microsystem: Rules & Objectives

The Deliver Microsystem is the engine room of the agency after contract signing. It handles high-fidelity execution of client projects by selecting the delivery path that matches the signed Sales offer, then carrying the work through implementation, QA, launch or delivery, handoff, and support.

> [!IMPORTANT]
> **Microsystem Documentation Rule**: Whenever an update is made to the Deliver logic, scripts, or project structures, this markdown file and all relevant project-specific files within the `deliver/` directory **MUST** be updated to reflect the changes.

## 1. Mission Statement
To deliver world-class digital experiences (Webflow + SEO + Automation) that exceed client expectations, while maintaining a perfectly organized documentation trail from post-contract Sales handoff through handoff and support.

## 2. Key Integrations
| Tool/API | Usage |
| :--- | :--- |
| **ClickUp** | Task management, resource allocation, and project timelines. |
| **Figma API** | Extracting design assets and syncing styles. |
| **Webflow API** | Automated site creation, CMS population, and publishing. |
| **Vimeo / Loom** | Hosting delivery walkthroughs and tutorials. |
| **SEO Tools (Ahrefs/Semrush)** | Benchmarking and final optimization reports. |

## 3. Project Organization
Every signed client project must have its own dedicated subdirectory within `deliver/`:
- `deliver/[client-name]/`: Root folder for the client.
- `deliver/[client-name]/workflows/`: Project-specific automations.
- `deliver/[client-name]/docs/`: Knowledge base, meeting notes, and handoff docs.

Client assets are workflow-owned. Store client handoff files, source materials, generated files, extracted media, design outputs, and final workflow assets inside the `.tmp/` folder of the workflow that owns or uses them, such as `deliver/[client-name]/workflows/[workflow-name]/.tmp/`. Do not create or use a client-level `assets/` folder as the default asset location.

### 3.1 Delivery Process
The canonical post-contract delivery template library lives in `deliver/process/`. Sales owns offer definition, proposal sending, discovery meeting, contract onboarding, and the handoff package. Deliver starts only after signing, using the Sales handoff and its normalized `selected_offer` value to initialize the client workspace and choose the correct delivery path. Each numbered phase folder is a reusable delivery template that can be required, skipped, adapted, or replaced depending on the signed offer. Each phase keeps the standard workflow structure (`.md` directive, empty `.py` executor, empty `TRIGGER_PROMPT.txt`, and a `.tmp/` artifact folder).
- Index: [process/PROCESS_INDEX.md](./process/PROCESS_INDEX.md)
- Offer routing: [process/OFFER_ROUTING.md](./process/OFFER_ROUTING.md)
- Client initialization: [process/00-client-delivery-initialization/00-client-delivery-initialization.md](./process/00-client-delivery-initialization/00-client-delivery-initialization.md)
- Full-build phases covered: Wireframe -> Graphic Resources -> Design -> Content & SEO -> Webflow Build -> QA -> Launch -> Handoff & Support.
- Offer-specific modules covered: Figma Review & Build Planning, Migration Audit & Plan, Content Export & Import, Migration SEO & Redirects, and Improvement Intake & Audit.
- New client projects are instantiated by manually copying routed workflow templates from `deliver/process/` into `deliver/[client-name]/workflows/`. No automated executor for this initialization exists yet.

## 4. Quality Standards
- **Pixel Perfection**: Final Webflow builds must match Figma designs 1:1.
- **CMS First**: All sites must be built with a scalable CMS structure, never hardcoded content.
- **Responsiveness**: Mandatory testing on Mobile (320px) to Desktop (1920px+).
- **SEO Ready**: Proper H1-H6 hierarchy, meta tags, and alt text on all images.
- **Client Clarity**: Each process phase must keep a plain-language client-facing overview plus a technical setup section for future automation.

### 4.1 Delivery Throughput
- **1 page = 1 design day + 1 dev day.** Project schedules in ClickUp must reflect `pages × 2 days` of execution capacity (or `pages × 1 day` for dev-only engagements).
- Canonical rule: [PRICING_TIMELINE_RULES.md](../sales/PRICING_TIMELINE_RULES.md). Do not declare different per-page durations in client workflows.
- Any client project with negotiated different timing (rush delivery, parallel teams, paused weeks) must be flagged in the Sales handoff package and noted in `project-overview.md`.

## 5. Active Workflows
- [Scrape, SEO & Rewrite (Webflow)](./company-1/workflows/scrape-seo-rewrite-webflow/scrape-seo-rewrite-webflow.md)

## Version Control
- This microsystem is part of a **GitHub repository**. All changes must follow the version control rules defined in [SYSTEM_RULES.md - Section 4](../SYSTEM_RULES.md).
- **Never commit**: `.env` files, secrets, or binary/media assets. Lightweight `.tmp/` artifacts may be committed when useful; heavy assets remain on the VPS.
- **Branch naming**: `deliver/<description>` (e.g., `deliver/client-seo-rewrite`).
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.
- **Client assets**: Stored in the owning workflow's `.tmp/` folder. Commit lightweight files; sync heavy binary/media assets to the VPS via `rclone`.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
