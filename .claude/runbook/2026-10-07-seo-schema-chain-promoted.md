# 2026-10-07 — Content-built schema chain and keyword H1 promoted to `tools/instatic-site/seo/`

## Why

Scenario 7 and `tools/seo-aeo/` (b78f8d61) left Dr. Nahlah's content-built schema chain and keyword H1
client-side ("not yet promoted"). Promoted here, generalised so any Instatic client runs them from a
config in its step output, and proven against Nahlah's live graph without writing to either instance.

## Done

- **`deliver/process/tools/instatic-site/seo/`**: `scan-sections`, `fetch-facts`, `build-schema`
  (+ `lib/schema-build.mjs`, the engine), `vocab-check`, `push-schema`, `verify-schema`,
  `plugin-stores`, `push-keyword-h1`, `hero-look`, `hero-shot`; `lib/seo-config.mjs`,
  `lib/sections.mjs`; `seo-config.template.json`, `seo-base.template.json`; README (chain, config schema,
  mapping language, house rules, limitations, what stayed client-side, evidence).
- **Home: `instatic-site/seo/`, not `seo-aeo/instatic/`**: the scripts write the aeo-schema store, page
  nodes and registry rules and use this toolkit's `lib/site.mjs`, `staging-guard.mjs`, `browser.mjs`;
  `seo-aeo` stays platform-neutral for the Webflow clients. `instatic-site/toolkit.json` now requires
  `seo-aeo` (two scripts import its `lib.mjs`).
- **Generalised:** host, ids, class names (old and Client-First), wiki topics, client rules (IV
  sedation wording), the film `about` map, article topics and mentions, breadcrumb fallbacks and the
  whole per-page section → node mapping moved to `seo-config.json` (a small mapping language: section
  aliases by heading regex, `$paths`, builders `list/catalog/howTo/cases/table/conditions/videos/each/
  pick/…`, ops `set/add/describeOffers/pageSays`). The practice's stated facts are a base-layer file.
  The keyword H1 scope and text come from the keyword map (new optional `h1` column in
  `keyword-map.template.csv`), never the SEO title; pages it cannot write are listed with the reason.
- **Kept and added safety:** plan by default everywhere; `--apply`/`--publish` need `STAGING_HOST` or
  `--allow-production`; backups before every apply (new for the keyword H1); block read-back in
  `push-schema` (new); `--publish` only when the store equals the build and the draft holds no page
  edits; shell-moved refusal in `push-keyword-h1` (new); every v3 guard (renamed heading stops the build,
  `--adopt`, URL floor in the gate). Films on a page without a mapping are described automatically.
- **Docs:** `seo-aeo/README.md` (rules 2 and 6 gates, script table, map columns, Origin), `instatic-site/
  README.md` (siblings, step map, scripts), Scenario 7 README and step 02 (inputs, checklist, steps 2 and
  7, tools, outputs, evidence), Scenario 0 step 05, `aeo-schema/README.md` (chain now shared; the
  `https://www.undefined` lesson), `staging-clone.md`, PROCESS_INDEX. Step 02's `tools.json` already
  listed `seo-aeo`, `instatic-site`, `instatic-plugins`: unchanged.
- Commit `a4caccbd` (toolkit + docs); this run file in the commit after it.

## Verified (read-only: plan/scan/build/verify only; nothing written to production or staging)

Test config transcribed from `build-schema-v3.mjs` (386 lines), base from `seo-v2/out/`, outputs in the
session scratchpad (`promote/`). Commands ran from the bk-dr-nahlah worktree root for its `.env`.

- `scan-sections.mjs`: 81/81 URLs; 76 pages identical to the client's last scan (5: `/doctor-referral`
  copy changed since, 4 legal pages now decode `&#160;`).
- `fetch-facts.mjs`: 22/22 films, 35/37 topics, identical to the client's facts.
- `build-schema.mjs` vs the client's `seo-v3/out`: identical except 6 values (below, intended). Built
  from a staging scan (Client-First classes): identical graph.
- `push-schema.mjs` plan on production: settings same; 81 blocks, 2 differ (the same fix), 12 same graph
  in another key order.
- Against the published JSON-LD of 81 URLs: 478 nodes equal apart from the same 6 values.
- `vocab-check.mjs` VOCAB CLEAN; `verify-schema.mjs` SCHEMA CLEAN on production and staging (81 each).
- `push-keyword-h1.mjs` plan (test map from the plan doc's Keyword map tab + its 19 drafted H1s):
  14 to write, 6 ok, 10 listed; derived registry rules deep-equal the live ones on both hosts.
- `hero-look.mjs` snapshot/compare and `hero-shot.mjs` ran (headless Chrome); `plugin-stores.mjs`
  export / diff / dry-run import: staging = production (only `"*"`, which is never listed).
- A synthetic Client-First site through the templates: vocabulary-clean graph.

## Found (not fixed: client work that needs a write)

- **Live defect on drnahlah.com and staging:** the three `LoanOrCredit` providers on `/financing` and
  `/implant-cost` publish `"url": "https://www.undefined"` (v3's regex once the copy stopped naming the
  lenders' domains). Every gate was green. The generic build drops it; shipping it is 2 blocks.
- Nahlah's four privacy/terms pages publish **(281) 789-8836**, a Houston-area number, not one of the
  practice's: ask CS (likely copied from a sister practice's legal pages).
- The draft keyword map conflicts with live H1s: five treatment rows map "… northern virginia" while
  their keyword H1s say "McLean & Alexandria, VA"; three drafted H1s (meet-dr-nahlah, both contact
  pages) lack their own keyword. The map is not agreed yet (Scenario 7 gate 1).

## Next

1. In a bk-dr-nahlah session: save the test `seo-config.json`, `schema-base.json` and `keyword-map.csv`
   into `scenario-7-seo-aeo/02-on-page/output/` (and `01-baseline-research/output/`), then rebuild and
   ship the lender fix: `push-schema.mjs --apply`/`--publish` on staging, verify, then production.
2. The write paths (`--apply`, `--publish`, `--adopt`, `import --apply`) were not executed in this run:
   the first real run goes to staging and its read-back output is read line by line.
3. Agree Nahlah's keyword map; the H1 plan then shows what to write and what is hand work (home and
   contact heroes are built another way).
4. Still open from b78f8d61: the FigJam Scenario 7 lane.

## Gotchas

- The aeo entries route never lists the site-wide `"*"` block: `push-schema.mjs` cannot compare it and
  writes it on every `--apply`; `plugin-stores.mjs` export takes it from `blocks.json`.
- Git Bash rewrites a leading `/path` argument (`/about` → `C:/Program Files/Git/about`): `--pages`,
  `--only` and `hero-shot.mjs` undo it (`pagePaths`), as `site-audit.mjs --page` does.
- A keyword map's primary keyword is a search phrase, not a heading: the H1 needs the `h1` column.
- Wikipedia has no article for two of Nahlah's topics (`smileDesign`, `abp`): `fetch-facts.mjs` exits 1
  until they are dropped.
- v3's gate read only `<details>` accordions, so a FAQ built from button accordions would have failed
  it; `verify-schema.mjs` now reads accordions exactly as the scan does (still CLEAN on both hosts).
- Main moved during this run (another session committed the Clarity ban, touching `05-launch.md` and
  `instatic-site/README.md`): commit by explicit paths only.
