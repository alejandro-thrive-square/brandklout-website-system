# Process Index

Start with the scenario that matches the job, open its README, then the step you are on. Each step
directive names the tools it uses. Rules: [../DELIVER_SYSTEM_RULES.md](../DELIVER_SYSTEM_RULES.md).

## Scenarios

### 0 · Website from Scratch — [scenario-0-new-site](./scenario-0-new-site/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Client Inquiry](./scenario-0-new-site/01-client-inquiry.md) |
| 02 | [Research & Sitemap](./scenario-0-new-site/02-research-sitemap.md) |
| 03 | [Design & Build](./scenario-0-new-site/03-design-build.md) |
| 04 | [QA](./scenario-0-new-site/04-qa.md) |
| 05 | [Launch](./scenario-0-new-site/05-launch.md) |
| 06 | [Post-Launch](./scenario-0-new-site/06-post-launch.md) |

### 1 · Website Migration — [scenario-1-migration](./scenario-1-migration/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Old Site Capture](./scenario-1-migration/01-old-site-capture.md) |
| 02 | [Redirect Map](./scenario-1-migration/02-redirect-map.md) |
| then | Scenario 0 from step 02, with the redirects live at the domain switch |

Scripts: [scenario-1-migration/scripts](./scenario-1-migration/scripts/).

### 2 · Website Updates / Expansions — [scenario-2-updates-expansions](./scenario-2-updates-expansions/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Request Intake](./scenario-2-updates-expansions/01-request-intake.md) |
| 02 | [Build](./scenario-2-updates-expansions/02-build.md) (Webflow path, Instatic path) |
| 03 | [QA and Publish](./scenario-2-updates-expansions/03-qa-and-publish.md) |

### 3 · Ads Landing Pages — [scenario-3-ads-landing-pages](./scenario-3-ads-landing-pages/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Campaign Intake](./scenario-3-ads-landing-pages/01-campaign-intake.md) |
| 02 | [Build the Combo](./scenario-3-ads-landing-pages/02-build-the-combo.md) (landing, consultation, thank you) |
| 03 | [QA and Launch](./scenario-3-ads-landing-pages/03-qa-and-launch.md) |

Scripts: [scenario-3-ads-landing-pages/scripts](./scenario-3-ads-landing-pages/scripts/).

### 4 · Update Plugins Across Sites — [scenario-4-update-plugins](./scenario-4-update-plugins/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Change and Version](./scenario-4-update-plugins/01-change-and-version.md) |
| 02 | [Rollout](./scenario-4-update-plugins/02-rollout.md) (status, staging, verify, production, verify) |
| 03 | [Verify and Record](./scenario-4-update-plugins/03-verify-and-record.md) |

Scripts: [tools/instatic-plugins](./tools/instatic-plugins/README.md).

### 5 · Instatic Release Update — [scenario-5-instatic-release-update](./scenario-5-instatic-release-update/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Assess the Release](./scenario-5-instatic-release-update/01-assess-release.md) |
| 02 | [Backup](./scenario-5-instatic-release-update/02-backup.md) |
| 03 | [Update Staging](./scenario-5-instatic-release-update/03-update-staging.md) |
| 04 | [Update Production](./scenario-5-instatic-release-update/04-update-production.md) |
| 05 | [Rollback](./scenario-5-instatic-release-update/05-rollback.md) (only when a step failed) |

Scripts: [tools/instatic-release](./tools/instatic-release/README.md).

## Tools

| Toolkit | What it is for | Used by |
| --- | --- | --- |
| [instatic-site](./tools/instatic-site/README.md) | Provision, staging clone, push pipeline, ops, gates, images, sitemap Worker | 0, 1, 2, 3 |
| [instatic-plugins](./tools/instatic-plugins/README.md) | Every `brandklout.*` plugin source, the registry, install, status, rollout and verify across sites | 0 (01, 05), 4 |
| [instatic-embeds](./tools/instatic-embeds/instatic-embeds.md) | Embed blocks, site scripts, CSP origins (the plugin itself is in instatic-plugins) | 0, 2, 3 |
| [instatic-release](./tools/instatic-release/README.md) | Inventory, backup, pinned image update, data verify, rollback across Railway instances | 5 |
| [instatic-domain-origins](./tools/instatic-domain-origins/instatic-domain-origins.md) | `PUBLIC_ORIGIN` and `check-origins` after any domain change | 0 (01, 05) |
| [instatic-api-sync](./tools/instatic-api-sync/instatic-api-sync.md) | Admin API client, fonts, CSS into the Styles registry, parity | 0 (03), 2 |
| [termly-ghl-consent](./tools/termly-ghl-consent/termly-ghl-consent.md) | Termly banner, GHL consent bridge, consent checks (Instatic and Webflow) | 0 (05), 2, 3 |
| [cloudflare-launch](./tools/cloudflare-launch/cloudflare-launch.md) | Tokens, DNS copy, Railway domain, zone hardening, staging noindex, Workers | 0 (05, 06), 1 |
| [webflow-build](./tools/webflow-build/webflow-build.md) | Webflow MCP client, publish guard, tree audit, script registration | 2, 3 |
| [specialty-sitemaps](./tools/specialty-sitemaps/README.md) | Sitemap templates per specialty and their section flows | 0 (02) |
| [client-first-style-guide](./tools/client-first-style-guide/README.md) | Client-First style guide page and assets | 0 (03) |
| [gsap-animations](./tools/gsap-animations/ANIMATION_INDEX.md) | GSAP motion modules | 0 (03), 3 |
| [scroll-film-studio](./tools/scroll-film-studio/SKILL.md) | Scroll-driven film sections (GSAP + Lenis) | 0 (03) |

Repo-level scripts: `scripts/fluid-root.mjs`, `scripts/drive.mjs`, `scripts/env-sync.mjs`,
`scripts/new-client-worktree.sh`. Brandklout scripts: `deliver/brandklout/scripts/` (Asana, journey
audit, staging verify).

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
