# scenario-7-seo-aeo · 02-on-page · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-07 — config for the promoted Instatic SEO tools (no writes)

**Done**
- `seo-config.json` and `schema-base.json` for `tools/instatic-site/seo/` (main `a4caccbd`), transcribed
  from this client's `workflows/22-instatic-api-sync/seo-v3/` by the promotion run. The keyword map is
  read from step 01 (`files.keywordMap` left at its default). Proven read-only on 2026-10-07: the
  generalised build matches the live graph on 81 URLs except 6 values (the lender fix below);
  `vocab-check` VOCAB CLEAN; `verify-schema` SCHEMA CLEAN on production and staging; a staging scan
  (Client-First class names) builds the same graph.

**Next**
1. **Lender fix:** `/financing` and `/implant-cost` publish `"url": "https://www.undefined"` for all
   three lenders (seo-v3 read each domain from copy that no longer names them; every gate stayed green).
   The new build drops those values: `push-schema --apply` on staging, verify, then production (2 blocks).
2. After gate 1: `push-keyword-h1` plan → `--apply` on staging, `hero-look` before/after, then
   production. Its plan with the drafted H1s: 14 pages writable, 6 already pass, 10 need a decision
   (home and contact heroes are built differently, 5 rows have no H1 yet, 3 drafts lack their keyword).
3. Home-page local FAQ (visible section first), wider `areaServed`.

**Gotchas**
- Production still uses the pre-Client-First class names, staging the new ones: the config's `markup`
  carries both. Check which host a run targets.
- None of the write paths (`--apply`, `--publish`) has been run against a real instance yet.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
