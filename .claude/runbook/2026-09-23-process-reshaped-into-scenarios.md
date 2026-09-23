# 2026-09-23 — Process reshaped into scenarios; Scenario 0 audited and redrawn; client folders out of v2

## Why

The owner asked whether the FigJam Scenario 0 matched what really happens. An audit of the 22
directives and the runbooks of all 16 client worktrees said no: every real project was a migration
or a Webflow update, staging and domain cutover were ad hoc, several QA and launch lines were wrong,
and the numbered 00–23 modules still described a Webflow/Figma/Vercel pipeline. The owner decided the
model and asked for the board first, then the directives, removing anything without a purpose.

## Owner decisions (2026-09-23)

- New site: Railway + Instatic deployed as production on `business-name.up.railway.app`, staging
  mirror with the same Sang/Alejandro logins; staging subdomain and public origins at Launch, after the
  domain.
- Competitors: other towns, same services or expertise.
- Migration is its own scenario (scrape, screenshot, extract all assets).
- Webflow stays, informed by the Webflow runbooks. Remove files with no purpose. Promote executables
  the runbooks show being reused.

## Done

- **FigJam (Deliver SOP's):** Scenario 0 rebuilt with the decisions and audit findings and a new blue
  **Conditionals** bar on every step; new section *Scenario 1 · Website Migration* (Old Site Capture,
  Redirect Map, Continue in Scenario 0). Other scenario headers moved right.
- **`deliver/process/` reshaped:**
  - `scenario-0-new-site/` (6 steps, written here), `scenario-1-migration/`,
    `scenario-3-updates-expansions/` (Webflow first), `scenario-5-ads-landing-pages/` (the three-page
    combo) — each with a README and one directive per step; 1 and 5 have `scripts/`.
  - `tools/` (unnumbered): `instatic-site` (new, 44 scripts: provision, staging clone, push pipeline,
    ops, gates, images), `cloudflare-launch` (new, from bk-dr-nahlah's unmerged 19 plus the cutover
    knowledge), `instatic-embeds`, `instatic-domain-origins`, `instatic-api-sync`, `termly-ghl-consent`,
    `webflow-build` (rewritten; 10 promoted scripts, retired paste route removed), `specialty-sitemaps`,
    `client-first-style-guide`, `gsap-animations`, `scroll-film-studio`.
  - Removed: modules 00–06, 08–17, `copy-style-guide`, `design-system-library` (animations kept),
    `OFFER_ROUTING.md`, the TRIGGER_PROMPT files, `deliver/workflow-test/`.
  - Rewritten: `PROCESS_INDEX.md`, `deliver/DELIVER_SYSTEM_RULES.md`; CLAUDE/AGENTS/GEMINI protocol
    items 2–4; `SYSTEM_RULES.md` deliver-files line; shared Brandklout docs and scripts repointed.
- **Client folders removed from this worktree** (14 clients, the DentalPro toolkit and a contract
  translation; 5,779 files). They stay on `main` and every `bk-*` branch. `deliver/brandklout/docs` and
  `scripts` stay. Also removed `manage/browser-tools`, `.claude/launch.json`, the pre-move runbook.
- New client layout: `deliver/brandklout/<client>/workflows/<step>/.tmp/`, scripts run from the client
  folder; the build lives in `workflows/03-design-build/.tmp/site-src/` (`SITE_SRC` / `SITE_DIST`).

## Follow-up the same day

- Owner decisions: Webflow consent scripts go in the **header** (termly-ghl-consent Phase 1 and
  `set_site_scripts` now say header; sites still on footer, like Arvada, move at their next publish);
  **www** is the main address (cloudflare-launch step 7, scenario 0 step 05).
- FigJam: Scenarios 3 (Website Updates / Expansions) and 5 (Ads Landing Pages) drawn from their
  directives; the board runs 0 to 6 left to right, with 2, 4 and 6 still headers only.

- Owner renumbered the board (Migration & Redesign and Article Writing removed). Scenarios are now
  0 new site, 1 migration, 2 updates/expansions, 3 ads landing pages, 4 update plugins, 5 Instatic
  release update; repo folders renamed to match.
- New **Scenario 4 · Update Plugins Across Sites** and `tools/instatic-plugins/` (one source per plugin:
  embed-origins 1.8.0 moved in from instatic-embeds, open-graph 1.1.3 from bk-mason-park-kids,
  aeo-schema 1.2.0, link-editor 1.0.2; registry `plugins.json`; `plugins.mjs status | rollout | verify`).
  Read-only status: parity broken on dr-nahlah (1.8.0 vs 1.5.1) and mason-park (1.6.0 vs 1.5.1); IFA,
  Stone Surgical Arts, Stone Med Spa and West LA have no open-graph or aeo-schema. `sites.json` gained
  dr-nahlah-staging, mason-park-staging and client-branch entries.
- New **Scenario 5 · Instatic Release Update** and `tools/instatic-release/` (inventory, backup with
  VACUUM INTO, pinned image update, verify-data, rollback). Read-only inventory: all 14 Railway
  instances run `ghcr.io/corebunch/instatic:latest` unpinned, spread over releases 0.0.16 to 0.0.20;
  staging is ahead of production on IFA, Stone Surgical Arts, Stone Med Spa and Mason Park; only 4 of
  14 volumes have Railway backups; 0.0.20 carries a rewriting migration (`030_iso_timestamps`).
- Both drawn on the board. Nothing was installed, updated or published on any site.

## Next

- Answer the agents' open questions (listed in the chat summary of this run): Webflow page branches, Arvada's `lw-` classes, per-request folder for updates,
  build folder layout for `push-site`, a script to add Sang's admin, SEO plugin sources as a toolkit,
  drive upload, IFA managed robots.txt, Google Ads conversion ownership.
- Redraw the Sitemap board's ads columns from the corrected `section-flows.py`.
- Owner go needed: pin all 14 instances to their current release (`update-image --pin-current`), then a first plugin round (embed-origins 1.8.1 glob fix, open-graph 1.1.3) and the SEO pair on the four sites without it.
- Merge to `main` only when the owner says so; the 16 client branches still expect the old layout.

## Gotchas

- **Client branches still use the old module folders** (`workflows/04-design`, `08-qa`, …). New scripts
  default to the scenario layout; `journey-audit.mjs` checks both. Set `SITE_SRC`/`SITE_DIST` when
  running a new tool against an old client.
- **Nothing promoted was run against a live site for writes.** Agents syntax-checked everything and ran
  read-only checks (Livewell combo gates, Arvada tree audit, mirror scans); Cloudflare, Railway and
  Webflow writes are untested.
- **Two agents promoted Cloudflare scripts;** `tools/cloudflare-launch` is the only Cloudflare toolkit
  now (the duplicate `instatic-site/cloudflare` was deleted).
- **FigJam edits can vanish when the tab closes.** Scenarios 4 and 5 were drawn, looked fine, and were
  gone on the next load; redrawn and confirmed from a second, freshly loaded tab before closing. Always
  prove a board change from a fresh tab (the REST API is often rate-limited).
- **The Figma REST API stayed rate-limited (429) for hours**; the board was read and written in Chrome.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
