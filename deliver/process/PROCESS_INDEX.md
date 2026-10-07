# Process Index

Start with the scenario that matches the job, open its README, then the step you are on. Each step
is a folder: its directive, `tools.json` (the shared toolkits it uses), `output/`, and `scripts/` when
the step has scripts of its own. A toolkit's `toolkit.json` names the toolkits its scripts need; `scenario.mjs`
mirrors those too. This folder is the only tracked copy of the process. For a client, start the scenario
with `node scripts/scenario.mjs start <client> <scenario>` and work in the client's step folder: its
`output/` is tracked on the client branch, the directive and scripts beside it are an untracked mirror
of main refreshed by `scenario.mjs sync`. Fix the process here, never in the mirror. Rules: [../DELIVER_SYSTEM_RULES.md](../DELIVER_SYSTEM_RULES.md).

## Scenarios

### 0 · Website from Scratch — [scenario-0-new-site](./scenario-0-new-site/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Client Inquiry](./scenario-0-new-site/01-client-inquiry/01-client-inquiry.md) |
| 02 | [Research & Sitemap](./scenario-0-new-site/02-research-sitemap/02-research-sitemap.md) |
| 03 | [Design & Build](./scenario-0-new-site/03-design-build/03-design-build.md) |
| 04 | [QA](./scenario-0-new-site/04-qa/04-qa.md) |
| 05 | [Launch](./scenario-0-new-site/05-launch/05-launch.md) |
| 06 | [Post-Launch](./scenario-0-new-site/06-post-launch/06-post-launch.md) |

### 1 · Website Migration — [scenario-1-migration](./scenario-1-migration/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Old Site Capture](./scenario-1-migration/01-old-site-capture/01-old-site-capture.md) |
| 02 | [Redirect Map](./scenario-1-migration/02-redirect-map/02-redirect-map.md) |
| then | Scenario 0 step 01 items 3-10 (setup and the concept deck), then Scenario 0 from step 02, with the redirects live at the domain switch |

Scripts: in each step folder's `scripts/`.

### 2 · Website Updates / Expansions (Instatic) — [scenario-2-updates-expansions](./scenario-2-updates-expansions/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Request Intake](./scenario-2-updates-expansions/01-request-intake/01-request-intake.md) |
| 02 | [Build](./scenario-2-updates-expansions/02-build/02-build.md) (staging first, then production) |
| 03 | [QA and Publish](./scenario-2-updates-expansions/03-qa-and-publish/03-qa-and-publish.md) |

### 3 · Ads Landing Pages — [scenario-3-ads-landing-pages](./scenario-3-ads-landing-pages/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Campaign Intake](./scenario-3-ads-landing-pages/01-campaign-intake/01-campaign-intake.md) |
| 02 | [Build the Combo](./scenario-3-ads-landing-pages/02-build-the-combo/02-build-the-combo.md) (landing, consultation, thank you) |
| 03 | [QA and Launch](./scenario-3-ads-landing-pages/03-qa-and-launch/03-qa-and-launch.md) |

Scripts: in each step folder's `scripts/`; shared helpers in [tools/ads-combo](./tools/ads-combo/).
Webflow sites build the combo in Scenario 6 (step 02, section K) and return to step 03 for the gates.

### 4 · Update Plugins Across Sites — [scenario-4-update-plugins](./scenario-4-update-plugins/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Change and Version](./scenario-4-update-plugins/01-change-and-version/01-change-and-version.md) |
| 02 | [Rollout](./scenario-4-update-plugins/02-rollout/02-rollout.md) (status, staging, verify, production, verify) |
| 03 | [Verify and Record](./scenario-4-update-plugins/03-verify-and-record/03-verify-and-record.md) |

Scripts: [tools/instatic-plugins](./tools/instatic-plugins/README.md).

### 5 · Instatic Release Update — [scenario-5-instatic-release-update](./scenario-5-instatic-release-update/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Assess the Release](./scenario-5-instatic-release-update/01-assess-release/01-assess-release.md) |
| 02 | [Backup](./scenario-5-instatic-release-update/02-backup/02-backup.md) |
| 03 | [Update Staging](./scenario-5-instatic-release-update/03-update-staging/03-update-staging.md) |
| 04 | [Update Production](./scenario-5-instatic-release-update/04-update-production/04-update-production.md) |
| 05 | [Rollback](./scenario-5-instatic-release-update/05-rollback/05-rollback.md) (only when a step failed) |

Scripts: [tools/instatic-release](./tools/instatic-release/README.md).

### 6 · Webflow Sites — [scenario-6-webflow-sites](./scenario-6-webflow-sites/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Request Intake](./scenario-6-webflow-sites/01-request-intake/01-request-intake.md) |
| 02 | [Build](./scenario-6-webflow-sites/02-build/02-build.md) (change types A to K, native whtml) |
| 03 | [QA and Publish](./scenario-6-webflow-sites/03-qa-and-publish/03-qa-and-publish.md) |

Scripts: [tools/webflow-build](./tools/webflow-build/webflow-build.md); `03-qa-and-publish/scripts/staging-verify.mjs`.
The FigJam board *Deliver SOP's* has a Scenario 6 lane (section `374:1330`, added 2026-10-02 from the scenario README). All seven lanes were brought in line with the directives on 2026-10-04.

### 7 · SEO & AEO (live sites) — [scenario-7-seo-aeo](./scenario-7-seo-aeo/README.md)

| Step | Directive |
| --- | --- |
| 01 | [Baseline & Research](./scenario-7-seo-aeo/01-baseline-research/01-baseline-research.md) (gate: the team agrees the keyword map) |
| 02 | [On-Page Pass](./scenario-7-seo-aeo/02-on-page/02-on-page.md) (keyword H1, title, description, alt, home-page local FAQ) |
| 03 | [Office Pages](./scenario-7-seo-aeo/03-office-pages/03-office-pages.md) (a page per office, each office's money pages, ≤25% shared) |
| 04 | [Content Depth & Gaps](./scenario-7-seo-aeo/04-content-depth/04-content-depth.md) (gap pages, depth, the practice's sign-off) |
| 05 | [Measure](./scenario-7-seo-aeo/05-measure/05-measure.md) (monthly) |

Scripts: [tools/seo-aeo](./tools/seo-aeo/README.md); on Instatic the schema and keyword-H1 writers in [tools/instatic-site/seo](./tools/instatic-site/seo/README.md). Edits go through Scenario 2 (Instatic) or 6 (Webflow).
Added 2026-10-07 from the Dr. Nahlah analysis and Trong Huynh's review; the FigJam board has no Scenario 7 lane yet.

## Tools

"Used by" is derived from the steps' `tools.json` files: scenario (steps).

| Toolkit | What it is for | Used by |
| --- | --- | --- |
| [instatic-site](./tools/instatic-site/README.md) | Provision, staging clone, push pipeline, ops, gates, images; [`seo/`](./tools/instatic-site/seo/README.md): the aeo-schema blocks built from each page's visible content (scan → facts → build → push → `verify-schema` gate) and the keyword H1 (`push-keyword-h1`, gate `hero-look`), per-client `seo-config.json` | 0 (01, 03–06), 2 (01–03), 4 (02, 03), 5 (02–04), 7 (02, 03) |
| [instatic-plugins](./tools/instatic-plugins/README.md) | Every `brandklout.*` plugin source, the registry, install, status, rollout and verify across sites | 0 (01, 05), 2 (02), 4 (01–03), 5 (01, 03), 7 (02) |
| [instatic-embeds](./tools/instatic-embeds/instatic-embeds.md) | Embed blocks, site scripts, CSP origins (the plugin itself is in instatic-plugins) | 0 (03, 05), 2 (02), 3 (02), 4 (01, 03) |
| [instatic-release](./tools/instatic-release/README.md) | Inventory, backup, pinned image update, data verify, rollback across Railway instances | 5 (01–05) |
| [instatic-domain-origins](./tools/instatic-domain-origins/instatic-domain-origins.md) | `PUBLIC_ORIGIN` and `check-origins` after any domain change | 0 (01, 05), 2 (02), 4 (02), 5 (03, 04) |
| [instatic-api-sync](./tools/instatic-api-sync/instatic-api-sync.md) | The admin API client, fonts, CSS into the Styles registry, parity; the Framework (`framework.mjs`), code assets into the registry (`css-to-registry.mjs`) and the **editability gate** (`editability.mjs`); the **class gate** (`class-audit.mjs`), rename engine (`class-rename.mjs`) and migration gates (`migration-gates.mjs`) | 0 (03), 1 (01), 2 (01–03), 3 (02), 4 (01, 02), 5 (02, 03, 05) |
| [termly-ghl-consent](./tools/termly-ghl-consent/termly-ghl-consent.md) | Termly banner, GHL consent bridge, the GHL form and DNI gates (Instatic and Webflow) | 0 (01, 04, 05), 2 (02, 03), 3 (01–03), 4 (03), 5 (04), 6 (02, 03) |
| [cloudflare-launch](./tools/cloudflare-launch/cloudflare-launch.md) | Tokens, DNS copy, Railway domain, zone hardening, staging noindex, the sitemap Worker | 0 (05, 06), 1 (01, 02), 5 (04) |
| [ads-combo](./tools/ads-combo/) | `combo.json` loader and the CDP helper the ads gates share | 3 (01, 03), 6 (03) |
| [webflow-build](./tools/webflow-build/webflow-build.md) | Webflow MCP client, publish guard, tree audit, script registration | 6 (01–03) |
| [specialty-sitemaps](./tools/specialty-sitemaps/README.md) | Sitemap templates per specialty and their section flows | 0 (02), 3 (02) |
| [client-first-style-guide](./tools/client-first-style-guide/README.md) | Client-First reference CSS and style guide page; [INSTATIC-FRAMEWORK.md](./tools/client-first-style-guide/INSTATIC-FRAMEWORK.md): every token in the Instatic Framework panel so sites stay hand-editable; [CLASS-STANDARD.md](./tools/client-first-style-guide/CLASS-STANDARD.md): class naming, vocabulary and the fleet migration steps | 0 (03), 2 (02), 6 (02) |
| [codex-computer-use](./tools/codex-computer-use/README.md) | Codex (ChatGPT desktop app) computer use from Claude Code: one plain instruction, background tab of the user's Chrome, read-only unless `--allow-writes`. **The standard for all computer use** since 2026-10-02 | 0 (02), 7 (01, 05); ad hoc for vendor dashboards such as GoHighLevel |
| [seo-aeo](./tools/seo-aeo/README.md) | **The SEO & AEO standard** (keyword map, keyword H1, title/description/alt, local FAQ schema, a page per office, depth, monthly measure) and its scripts: `site-audit.mjs`, the `keyword-gate.mjs`, the twin `page-overlap.mjs` gate, `autocomplete.mjs`, `serp-instruction.mjs` (location-set Google rank check through Codex); the keyword map template (with the H1 text column). Its Instatic writers are in `instatic-site/seo/` | 0 (02, 05, 06), 2 (02), 7 (01–05) |
| [ghl-forms](./tools/ghl-forms/README.md) | **The guide for every GoHighLevel lead form**: the standard (service dropdown, optional SMS consent, real Privacy/Terms links), the Codex instruction template, the `--standard` gate, and `check-embed.mjs` (no `loading="lazy"` on a GHL iframe, every sitemap page) | none yet (ad hoc; any new or fixed GHL form) |
| [jev-browser-agent](./tools/jev-browser-agent/README.md) | **Superseded by codex-computer-use (2026-10-02); do not use for new work.** Jev (TypeSafe) computer use in vendor dashboards: `jev_deep` perception (iframes at any depth, shadow DOM, div cards, Enter) + steps + `--forbid`, benchmarked 24/24 on offline fixtures in `bench/` | none yet (ad hoc; widget creation before an embed step) |
| [elfsight-reviews](./tools/elfsight-reviews/README.md) | One Google Reviews widget per client: registry, inventory, create over CDP, render check; **the in-section widget standard** (no widget title, Google-logo header with the review count, button and cards in the site's style) with its Codex brief and `check-widget.mjs` gate | none yet (ad hoc; before an embed step) |

The design bar and its motion gate live in Scenario 0 step 03:
[`DESIGN-STANDARD.md`](./scenario-0-new-site/03-design-build/DESIGN-STANDARD.md) and
`scripts/journey-audit.mjs`.

Repo-level scripts: `scripts/scenario.mjs`, `scripts/fluid-root.mjs`, `scripts/drive.mjs`, `scripts/env-sync.mjs`,
`scripts/assets.mjs`, `scripts/new-client-worktree.sh`. Brandklout scripts: `deliver/scripts/` (Asana).

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
