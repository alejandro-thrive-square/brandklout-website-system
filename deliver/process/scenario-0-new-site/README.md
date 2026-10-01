# Scenario 0 · Website from Scratch (Instatic)

A new site for a client with no website we need to keep. It is built on Instatic, hosted on Railway,
served through Cloudflare. The FigJam board **Deliver SOP's → Scenario 0** is the same process as a
picture; when the two disagree, fix both.

If the client already has a website, run [Scenario 1 · Migration](../scenario-1-migration/README.md)
first and come back here at step 02.

| Step | Directive | Gate to leave the step |
| --- | --- | --- |
| 01 | [Client Inquiry](./01-client-inquiry/01-client-inquiry.md) | Production and staging admins work, plugins installed, assets requested, style picked |
| 02 | [Research & Sitemap](./02-research-sitemap/02-research-sitemap.md) | Sitemap and strategy approved, prices and claims confirmed |
| 03 | [Design & Build](./03-design-build/03-design-build.md) | Core pages approved by the client, complete site on staging, team review done |
| 04 | [QA](./04-qa/04-qa.md) | No open critical or high issue, every BugHerd pin closed |
| 05 | [Launch](./05-launch/05-launch.md) | Domain live, check-origins clean, staging subdomain up, redirects live if there was an old site |
| 06 | [Post-Launch](./06-post-launch/06-post-launch.md) | Sitemap indexed, real test lead received, handoff done |

## Where things live

- **This scenario on main:** one folder per step (`NN-step/`: directive, `scripts/`, `tools.json`,
  `output/`). Shared toolkits in [`../tools/`](../tools/).
- **For a client:** `node scripts/scenario.mjs start <client> 0` copies it to
  `deliver/brandklout/<client>/scenario-0-new-site/` (plus the toolkits into `<client>/tools/`). Work in
  the step folder there; everything the step produces goes in its `output/` (assets, code,
  `RUNBOOK.md`). The build lives in `03-design-build/output/code/site-src/`.
- **Client docs:** `deliver/brandklout/<client>/docs/` (`project-overview.md`, `facts.md`,
  `mcp-access.md`) and the client `RUNBOOK.md`.
- **Client media:** the client's Google Drive and the step's `output/assets/` (gitignored, backed up to
  R2). Pull with `node scripts/drive.mjs`.
- **Standards:** [`03-design-build/DESIGN-STANDARD.md`](./03-design-build/DESIGN-STANDARD.md),
  [`FLUID-ROOT.md`](../../docs/FLUID-ROOT.md), [`CLIENT-FIRST.md`](../../docs/CLIENT-FIRST.md).

## Models

Opus 5, GPT 5.6 terra, GLM 5.3 flash for most steps; Fable 5.1, GPT Astra, GLM 5.3 flash (or the latest
models) for Design & Build.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
