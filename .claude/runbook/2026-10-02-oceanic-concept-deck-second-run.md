# 2026-10-02 · Concept deck, second run (Oceanic Dental)

Asked (bk-oceanic-dental): "build the style selection for Oceanic like we did for Livewell; scrape
their old site for assets and everything." The client work is on branch `bk-oceanic-dental`
(`933f8103`, `6642aad0`); this file records what changed in the system.

## Done

- Oceanic Dental registered in `tools/instatic-domain-origins/sites.json` (production + staging) and
  `tools/instatic-plugins/plugins.json`. `check-origins.mjs` OK on both hosts; `plugins.mjs status` no drift.
- `scenario-1-migration/01-old-site-capture/scripts/extract_assets.py`: finds `site-data.json` next to
  `--html-dir` without the flag, and falls back to `/sitemap.xml`. Before, a Webflow site (no
  `sitemap_index.xml`) gave 0 pages unless `--site-data` was passed. Verified: 106 pages, 783 assets.
- `01-old-site-capture.md` Do/Don't: take phone numbers from the raw scrape, never from the rendered
  screenshots (call tracking swaps them after load).
- Deck: https://oceanic-dental-staging.up.railway.app/concepts, built by five parallel agents from
  `content.md` + `directions.md` (about 25-40 minutes each).

## Next

- Still open from 2026-10-01: promote `shoot-concept.mjs` and `publish-deck.mjs` into the step's
  `scripts/`, and `staging-env.mjs` / `with-setup-env.mjs` into `tools/instatic-site/setup/`. They are
  now copied by hand into a third client folder; the next deck should not need that.
- A script for Sang's admin (hash copy from Mason Park). Written by hand again this run.
- `shoot-concept.mjs`: ignore YouTube `api/stats/qoe` and doubleclick aborts, or every page with a
  static YouTube iframe reports "problems" locally.

## Gotchas

- `node scripts/assets.mjs push <slug>` ignores a bare slug and pushes every client, rewriting the
  other clients' `assets.tsv` inside the worktree (and creating folders outside the sparse cone).
  Use `--client <slug>`, then `git checkout --` anything outside the client folder.
- Mason Park's DB is at `sqlite:/app/storage/data/cms.db` (no `//`); strip `sqlite:` before `bun:sqlite`.
- YouTube iframes show "Error 153" from `file://`; they play on the hosted deck (CSP `frame-src https:`).
- The agents' prompts named the other four concepts' idioms so none drifted into another's layout.

## Version Control

Follows [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
