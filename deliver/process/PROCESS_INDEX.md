# Deliver Process Index

This folder contains the canonical post-contract delivery template library for the Deliver microsystem. Sales owns offer definition, proposal sending, discovery meeting, contract onboarding, and the Deliver handoff package. Deliver starts after signing, then uses the handoff package's normalized `selected_offer` value to initialize a client folder and choose the correct delivery path.

Each numbered module mirrors the standard workflow structure defined in [SYSTEM_RULES.md Section 2.1](../../SYSTEM_RULES.md): `.md` directive, `.py` executor, `TRIGGER_PROMPT.txt`, and a `.tmp/` artifact folder. Module `00` defines client-folder initialization. Modules `01` through `20` are reusable delivery execution templates; [OFFER_ROUTING.md](./OFFER_ROUTING.md) determines which execution modules are copied for each Sales offer.

> [!IMPORTANT]
> **Integrity Rule**: When a phase's or supporting workflow's logic, naming, output schema, or offer routing changes, update the relevant `.md`, this index, and [OFFER_ROUTING.md](./OFFER_ROUTING.md) (when routing is affected) in the same commit.

## Purpose
- Provide reusable, version-controlled delivery templates for every signed delivery engagement.
- Keep the public-facing process simple while preserving technical setup sections for future automation.
- Let Deliver begin from the Sales handoff package by creating a client-specific workspace, without repeating pre-contract sales discovery.
- Route each signed Sales offer into the correct delivery path.

## Usage
1. Confirm the client has signed and Sales has produced a handoff package.
2. Run the documented manual setup in [00-client-delivery-initialization.md](./00-client-delivery-initialization/00-client-delivery-initialization.md).
3. Read `selected_offer` from the handoff package and validate it against [OFFER_ROUTING.md](./OFFER_ROUTING.md).
4. Identify the required, optional, skipped, and adapted modules for that offer.
5. Copy only the required and scoped execution module folders into `deliver/[client-name]/workflows/` and keep the same internal structure.
6. Store the original signed handoff package and all client-provided starting materials in `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
7. When Deliver owns design creation or redesign, seed `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/` from the handoff's `selected_design_system_reference`.
8. Fill in the `.py` executor and `TRIGGER_PROMPT.txt` for that engagement when automation is needed. Note: module `07-webflow-build` is an exception — its executor (`07-webflow-build.py`, a config-driven orchestrator) and the full HTML→Webflow converter toolchain ship populated in the process source and are cloned as-is into client workflows; per-project setup is done through `webflow-build.config.json`.
9. Update the cloned `.md` files to reflect offer-specific adaptations, skipped phases, or client-specific deviations.
10. Record the source commit as `process_baseline_commit` in the client `docs/project-overview.md`.
11. Before each later phase, refresh the clean client branch from local `main`, compare the current
    canonical module with the copied instance, apply relevant upstream corrections while preserving
    client deviations, and update `process_baseline_commit`.

> [!IMPORTANT]
> A copied workflow is a versioned snapshot. It does not update when `deliver/process/` changes,
> and an Orca worktree does not receive local `main` changes until they are committed and merged.
> Never rely on untracked files in another worktree as workflow inputs.

## Offer-to-Delivery Matrix

| Sales offer | Default start | Required delivery modules | Adapted or optional modules |
| :--- | :--- | :--- | :--- |
| Development from Scratch | `00-client-delivery-initialization` | `00`, then `01` -> `02` -> `03` -> `04` -> `05` -> `06` -> `07` -> `08` -> `09` -> `10` | `16` remains optional for standalone static deployments beyond the required design-review deployments handled inside `04` and `05`. |
| Figma to Webflow | `00-client-delivery-initialization` | `00`, then `11` -> optional `06` -> `07` -> `08` -> `09` -> `10` | `06` validates content/SEO only when scoped; `01`-`05` are skipped unless scoped; `16` optional for preview deployments. |
| Migration to Webflow | `00-client-delivery-initialization` | `00`, then `12` -> optional `01`/`02`/`03`/`04`/`05` -> `13` -> `14` -> `07` -> `08` -> `09` -> `10` | `01`-`05` apply only for new content, redesign, new IA, or a client revision loop; `16` optional for static preview deployments. |
| Webflow Improvements & Updates | `00-client-delivery-initialization` | `00`, then `15` -> `07` -> `08` -> optional `09` -> adapted `10` | `01`-`06` apply only when the approved request needs intake, planning, assets, design, revisions, content, or SEO; `16` optional for review URLs or standalone static delivery. |
| AI Site with Claude, Vercel & Airtable | `00-client-delivery-initialization` | `00`, then `01` -> `02` -> optional `03` -> `04` -> `05` -> optional `06` -> `17` -> `08` -> `16` -> `09` -> `10` | `03` applies when new graphic resources are needed; `06` applies when content/SEO is scoped; `17` replaces `07-webflow-build`; `16` is required for Vercel preview/production deployment. |

Use [OFFER_ROUTING.md](./OFFER_ROUTING.md) as the source of truth for required handoff fields, completion criteria, and detailed routing rules.

## Process Modules

The current numbered folders are reusable templates. Module `00` is the setup workflow for turning a Sales handoff into a client folder. The full `01` through `10` sequence is the default execution path for `Development from Scratch`; other offers assemble a subset or adapted version of these modules, including offer-specific modules `11` through `15`, deployment module `16`, AI Vercel/Airtable build module `17`, and the Instatic modules `18` and `20`.

| # | Phase | Directive |
| :---: | :--- | :--- |
| 00 | Client Delivery Initialization | [00-client-delivery-initialization.md](./00-client-delivery-initialization/00-client-delivery-initialization.md) |
| 01 | Content Intake | [01-content-intake.md](./01-content-intake/01-content-intake.md) |
| 02 | Wireframe | [02-wireframe.md](./02-wireframe/02-wireframe.md) |
| 03 | Graphic Resources | [03-graphic-resources.md](./03-graphic-resources/03-graphic-resources.md) |
| 04 | Design | [04-design.md](./04-design/04-design.md) |
| 05 | Design Revisions | [05-design-revisions.md](./05-design-revisions/05-design-revisions.md) |
| 06 | Content & SEO | [06-content-seo.md](./06-content-seo/06-content-seo.md) |
| 07 | Webflow Build | [07-webflow-build.md](./07-webflow-build/07-webflow-build.md) |
| 08 | QA | [08-qa.md](./08-qa/08-qa.md) |
| 09 | Launch | [09-launch.md](./09-launch/09-launch.md) |
| 10 | Handoff & Support | [10-handoff-support.md](./10-handoff-support/10-handoff-support.md) |
| 11 | Figma Review & Build Planning | [11-figma-review-build-planning.md](./11-figma-review-build-planning/11-figma-review-build-planning.md) |
| 12 | Migration Audit & Plan | [12-migration-audit-plan.md](./12-migration-audit-plan/12-migration-audit-plan.md) |
| 13 | Content Export & Import | [13-content-export-import.md](./13-content-export-import/13-content-export-import.md) |
| 14 | Migration SEO & Redirects | [14-migration-seo-redirects.md](./14-migration-seo-redirects/14-migration-seo-redirects.md) |
| 15 | Improvement Intake & Audit | [15-improvement-intake-audit.md](./15-improvement-intake-audit/15-improvement-intake-audit.md) |
| 16 | Vercel Deployment | [16-vercel-deployment.md](./16-vercel-deployment/16-vercel-deployment.md) |
| 17 | AI Site Build & Airtable | [17-ai-site-build-airtable.md](./17-ai-site-build-airtable/17-ai-site-build-airtable.md) |
| 18 | Instatic Embeds | [18-instatic-embeds.md](./18-instatic-embeds/18-instatic-embeds.md) |
| 19 | Cloudflare Launch (sitemap, 301 map, canonical host) | _not yet promoted — lives in `bk-dr-nahlah` as `19-cloudflare-launch/`_ |
| 20 | Instatic Domain & Admin Origins | [20-instatic-domain-origins.md](./20-instatic-domain-origins/20-instatic-domain-origins.md) |
| 21 | Instatic Staging Clone & Promotion | [21-instatic-staging-clone.md](./21-instatic-staging-clone/21-instatic-staging-clone.md) |

### Instatic modules (`18`, `20`, `21`)

Not part of the offer-routing sequence — they apply to any engagement whose site is delivered on **Instatic** rather than Webflow or Vercel, and both are needed on every such site:

- **`18` Instatic Embeds** makes third-party widgets possible at all. Instatic publishes behind `frame-src 'none'`, so without this plugin no booking form, review widget or chat bubble can load. Install it on every Instatic site.
- **`20` Instatic Domain & Admin Origins** is run at launch and at every later domain change. It covers the two independent ways an Instatic domain breaks and carries a checker for each: `check-origins.mjs` (the **gate** — is `client.com/admin` able to *save*; run it before sending anyone an admin link) and `check-dns.mjs` (the **pointer** — does the domain still reach Railway at all). Railway mints a random CNAME target per custom domain; a redeploy does not move it, but deleting and re-adding the domain does, which is how Mason Park went down on 2026-08-28.

- **`21` Instatic Staging Clone & Promotion** gives the site a real staging twin and a way back. Instatic's publish is all-or-nothing — one click replaces every public page — so a redesign cannot live as drafts on production without riding out with the next typo fix. Proven on Dr. Nahlah 2026-08-31 and run again for Mason Park the same day, which is what promoted it out of the client folder.

`20` should be run as part of [`09-launch`](./09-launch/09-launch.md) for an Instatic site; `09` otherwise only knows about Webflow and Vercel publishing targets.

> [!IMPORTANT]
> **Number `19` is taken.** `19-cloudflare-launch` was built during the Dr. Nahlah launch and still
> lives untracked in the `bk-dr-nahlah` worktree, so it is invisible from `main` and a new module
> numbered from `main` alone will collide with it. That already happened once: this module shipped
> as `19` and was renumbered to `20`. **Before claiming a number, check the worktrees too**, not
> just `git ls-files` on `main`. `19-cloudflare-launch` should be promoted here.

## Supporting Workflows
Non-sequential tools that delivery phases call as needed. They live flat inside `deliver/process/` alongside the numbered phases (mirroring how `deliver/process/` already holds non-numbered items such as `design-system-library`), but they are **not** part of the `00`-`17` offer-routing sequence. Each follows the same standard folder shape and can be cloned into `deliver/[client-name]/workflows/` when run for a specific engagement.

| Workflow | Directive |
| :--- | :--- |
| Copy Style Guide (Variables + Styles) | [copy-style-guide/copy-style-guide.md](./copy-style-guide/copy-style-guide.md) |

## Standard Folder Shape (per phase)

```text
[NN-phase-name]/
|-- [NN-phase-name].md         Directive - defines intent, steps, artifacts.
|-- [NN-phase-name].py         Executor - empty in the process source; implemented per-client.
|-- TRIGGER_PROMPT.txt         Trigger prompt - empty in the process source; populated per-client.
`-- .tmp/                      Artifact storage - lightweight files committed; heavy media synced to VPS via rclone.
```

> [!NOTE]
> **Exception — `07-webflow-build`:** this module ships with a full, tested
> HTML/CSS/JS → Webflow clipboard converter toolchain (`html_to_webflow.py`,
> `wf_tools.py`, `build_vocab.py`, `html_to_webflow_wholepage.py`, the
> `gen_*.py` clipboard helpers, `verify.mjs`, regression `tests/`, and the
> `html-to-webflow-clipboard.md` method directive) plus a config-driven
> executor (`07-webflow-build.py`). It is cloned whole into client workflows;
> per-project values live in `webflow-build.config.json`. The current build
> standard is [PASTEABLE-COMPONENTS.md](./07-webflow-build/PASTEABLE-COMPONENTS.md); refresh older
> client copies before execution because their trigger prompts and toolchains may predate it. See
> [07-webflow-build.md](./07-webflow-build/07-webflow-build.md).

## Non-Copy Resources

Some process resources are committed once and reused across delivery engagements.

| Resource | Path | Rule |
|:---|:---|:---|
| Design system library | `deliver/process/design-system-library/` | Single source of truth for references selected in Sales discovery. Initialization copies only the chosen package into the client project's `00-client-delivery-initialization/.tmp/design-system/`. |

## Version Control
- All changes to the delivery process and this index must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- **`.tmp/` folders**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. They exist in the process structure so cloned client workflows have a designated artifact path from day one. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/process-<change>` for changes to this folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
