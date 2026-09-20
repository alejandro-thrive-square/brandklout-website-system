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
| **Vercel** | Static preview, prototype, AI-site production, and client/product subdomain deployments. |
| **Airtable** | Lightweight structured content source for scoped AI-site dynamic sections. |
| **Vimeo / Loom** | Hosting delivery walkthroughs and tutorials. |
| **SEO Tools (Ahrefs/Semrush)** | Benchmarking and final optimization reports. |

### 2.1 MCP Access
Deliver MCP usage is client-scoped by default. Before using any MCP in a client project, agents must read:
1. [../mcp-servers/ACCESS_MODEL.md](../mcp-servers/ACCESS_MODEL.md)
2. The closest applicable `mcp-access.md`, normally `deliver/[client-name]/docs/mcp-access.md`
3. The referenced profile in `mcp-servers/profiles/`
4. The client `docs/project-overview.md`

Every Deliver client project that uses MCPs must include `deliver/[client-name]/docs/mcp-access.md`. The file must list active MCP servers, target resources, allowed operations, forbidden operations, confirmation requirements, runtime auth notes, and artifact paths. Publishing, deleting, overwriting, production deploys, DNS changes, access changes, billing, emailing, and production data edits require explicit confirmation.

## 3. Project Organization

The [2026-09-19 architecture proposal](../SYSTEM_ARCHITECTURE.md) separates shared process
version control from client outputs and defines asset recovery before migration. It does not
change the current folder layout or migrate existing sites. Brandklout clients currently live
under `deliver/brandklout/<client>/`; preserve their latest branch state and versioned workflow
instances when implementing that proposal.
Every signed client project must have its own dedicated subdirectory within `deliver/`:
- `deliver/[client-name]/`: Root folder for the client.
- `deliver/[client-name]/workflows/`: Project-specific automations.
- `deliver/[client-name]/docs/`: Knowledge base, meeting notes, and handoff docs.
- `deliver/[client-name]/docs/mcp-access.md`: Required when the client project uses MCPs.

Client assets are workflow-owned:
- Store the initial client handoff package once in `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
- When Deliver owns design creation or redesign, store the selected central design-system reference in `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/`.
- Store later incoming files, generated files, extracted media, design outputs, and final workflow assets inside the `.tmp/` folder of the workflow that receives, produces, or uses them.
- Later workflows should reference the original handoff package instead of duplicating it unless they need a transformed copy.
- Client photos, videos, brand guides and site exports are often in the client's Google shared drive. Check [brandklout/docs/GOOGLE_DRIVE.md](./brandklout/docs/GOOGLE_DRIVE.md) and pull with `scripts/drive.mjs` into the receiving workflow's `.tmp/` before asking for files again.
- Do not create or use a client-level `assets/` folder as the default asset location.
- When a legacy client-level asset path is retired after migration, add that obsolete VPS path to the root `scripts/deploy-cleanup.sh` allowlist so deployments remove stale ignored folders without touching valid workflow-owned media.

### 3.1 Delivery Process
The canonical post-contract delivery template library lives in `deliver/process/`. Sales owns offer definition, proposal sending, discovery meeting, contract onboarding, and the handoff package. Deliver starts only after signing, using the Sales handoff and its normalized `selected_offer` value to initialize the client workspace and choose the correct delivery path. Each numbered phase folder is a reusable delivery template that can be required, skipped, adapted, or replaced depending on the signed offer. Each phase keeps the standard workflow structure (`.md` directive, `.py` executor, `TRIGGER_PROMPT.txt`, and a `.tmp/` artifact folder). The `07-webflow-build` phase is an exception: it ships a populated executor and the full HTML→Webflow converter toolchain, cloned whole into client workflows with per-project setup in `webflow-build.config.json`.
- Index: [process/PROCESS_INDEX.md](./process/PROCESS_INDEX.md)
- Offer routing: [process/OFFER_ROUTING.md](./process/OFFER_ROUTING.md)
- Client initialization: [process/00-client-delivery-initialization/00-client-delivery-initialization.md](./process/00-client-delivery-initialization/00-client-delivery-initialization.md)
- Full-build phases covered: Content Intake -> Wireframe -> Graphic Resources -> Design -> Design Revisions -> Content & SEO -> Webflow Build -> QA -> Launch -> Handoff & Support.
- Offer-specific and optional modules covered: Figma Review & Build Planning, Migration Audit & Plan, Content Export & Import, Migration SEO & Redirects, Improvement Intake & Audit, Vercel Deployment, and AI Site Build & Airtable.
- New client projects are instantiated by manually copying routed workflow templates from `deliver/process/` into `deliver/[client-name]/workflows/`. No automated executor for this initialization exists yet.

### 3.2 Versioned Workflow Instances

Client workflow folders are **versioned instances**, not live mirrors of `deliver/process/`.
Copying a module makes the client self-contained, but later canonical corrections do not cascade
into that copy or into an Orca client worktree automatically.

- `deliver/process/` owns reusable directives, executors, gates, and toolchain logic.
- `deliver/[client-name]/workflows/` owns client configuration, scoped adaptations, artifacts, and
  documented deviations from the canonical module.
- `docs/project-overview.md` must record `process_baseline_commit`, the routed module list, and any
  intentional module deviations. Update the baseline at each clean task-boundary refresh.
- Before starting a phase, merge current local `main` into the clean client branch, read the
  canonical module first, compare it with the client instance, and bring across applicable fixes
  without overwriting client configuration or artifacts.
- Promote reusable learning from a client branch into `deliver/process/` as a separate canonical
  change. Do not leave the only copy of a new rule or tool in one client workflow.
- Never use untracked files in the root worktree as cross-worktree inputs. Commit lightweight
  references and sync ignored media into the active client worktree.

Until initialization and refresh executors exist, this comparison and baseline update are manual
release gates. A client task must not claim it is running the current process without completing
them.

## 4. Quality Standards
- **Authoritative Brand Source**: Inventory and rank all client/partner brand sources, including
  embeds and linked assets, before choosing tokens. Unresolved authority conflicts block batch work.
- **Canary Before Multiplication**: Approve one representative page or shared shell/complex-section
  canary at mobile and desktop before applying the system to the remaining page set.
- **Pixel Perfection**: Final builds must match the approved design source 1:1, whether that source is a Claude Design HTML/CSS/JS package or a Figma design.
- **CMS First**: Dynamic content must use a scoped, maintainable content structure rather than hardcoded repeated records. Webflow routes use Webflow CMS; AI Vercel routes may use Airtable through server-side content access when that is the signed scope.
- **Responsiveness**: Mandatory testing on Mobile (320px) to Desktop (1920px+).
- **SEO Ready**: Proper H1-H6 hierarchy, meta tags, and alt text on all images.
- **Client Clarity**: Each process phase must keep a plain-language client-facing overview plus a technical setup section for future automation.

### 4.1 Delivery Throughput
- **1 page = 1 design day + 1 dev day.** Project schedules in ClickUp must reflect `pages × 2 days` of execution capacity (or `pages × 1 day` for dev-only engagements).
- Canonical rule: PRICING_TIMELINE_RULES.md in the `webzite-agentic-workflow` repository. It does **not** apply to `deliver/brandklout/`, which is a partner engagement rather than a per-page client. Do not declare different per-page durations in client workflows.
- Any client project with negotiated different timing (rush delivery, parallel teams, paused weeks) must be flagged in the Sales handoff package and noted in `project-overview.md`.

## 5. Active Workflows
- [Brandklout Dispatch](./brandklout/docs/ASANA-DISPATCH.md)
- [Brandklout Design Standard](./brandklout/docs/DESIGN-STANDARD.md)

## Version Control
- This microsystem is part of a **GitHub repository**. All changes must follow the version control rules defined in [SYSTEM_RULES.md - Section 4](../SYSTEM_RULES.md).
- **Never commit**: `.env` files, secrets, or binary/media assets. Lightweight `.tmp/` artifacts may be committed when useful; heavy assets remain on the VPS.
- **Branch naming**: `deliver/<description>` (e.g., `deliver/client-seo-rewrite`).
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.
- **Client assets**: Stored in the owning workflow's `.tmp/` folder. Commit lightweight files; sync heavy binary/media assets to the VPS via `rclone`.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
