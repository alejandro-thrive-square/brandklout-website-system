# 2026-09-29, later — one page per product, and EVERYTHING on production

The team: "The services pages don't have all of the single service pages created. Please make sure
everyone is covered." Two gaps, both closed on the user's word:

1. **Production had one treatment page.** `/botox` only; the eleven generated on 2026-09-23 were
   staging-only, so every other menu row 404'd live.
2. **Two rows were two products each.** "Botox | Xeomin" and "Dysport & Jeuveau" are now four rows
   and four pages.

## Done

- **14 treatments, 26 pages.** `treatments-data.mjs`: rows `botox`, `xeomin`, `dysport`, `jeuveau`
  (were `botox` + `dysport-jeuveau`). `treatment-pages.mjs`: `xeomin`, `dysport`, `jeuveau` replace
  `dysport-jeuveau` (content split from it; each FAQ names its product; related = the other three).
  `/botox` is Botox only: title, first paragraph, `seo.json` title/schema; the four-product stack's
  Xeomin/Dysport/Jeuveau cards carry a `.products_link` to their pages. The navbar dropdown, drawer,
  menu, ticker and concern tooltips all follow from the data.
- **Photos** from the practice's Drive "Stock Images" folder (labelled per treatment), as
  `stock-xeomin-{injection,portrait,smile}`, `stock-dysport-{injection,portrait}`,
  `stock-jeuveau-care`. Jeuveau's cover is `p-eyes-portrait` (the old combined page's).
- **Staging** seq 18 → 26 pages published; `/dysport-jeuveau` 404 (replace mode dropped it).
- **PRODUCTION** `https://westlaketxmedspa.com`: was seq 21, 13 pages (2026-09-18 build + phone +
  pool). Snapshot `05-instatic-upload/.tmp/backup-prod-2026-09-29-pre-rounds`. `upload-media` (26
  new), `install-fonts --apply` (Cormorant 600, seq 22), `set-alt` (3 updated), payload checked
  (0 staging-only media ids, 80 production ids), `ship.sh`, `push-site --apply --force` (26 written),
  `{"publishedPages":26}`. **This carried BugHerd rounds 1 and 2, #15 and the split live.**
- **Sitemap** redeployed: 25 URLs on apex and www, `verify-sitemap` FAIL none. 4-hour token minted
  and deleted (`d1fb28fc…`).

## Gates

- Local: audit FAIL none; all-pages 26 × 5 widths, 520 assertions clean; menu-test 10/10 (now
  expects 14 rows); drag-test 3/3.
- Staging and production: `verify-live` FAIL none, 26 routes, 26/26 titles; `css-parity` FAIL none.
- Production: all 14 treatment URLs 200; Termly (7), Sienna (2) and the GHL pool tag still on the
  home page (plugin settings survive a forced push); `form-test` FAIL none (consent params on the
  frame URL).

## Gotchas

1. The production Railway **service is named "Westlake Medical Aesthetics"**, not "Stone Med Spa"
   (the project's name) — `railway link -s "Stone Med Spa"` fails and `check-link.mjs` refuses.
2. `verify-sitemap` failed once on www straight after deploy (edge still serving the old copy);
   passed 20 s later. Re-run before chasing it.
3. The BugHerd reviewer works on production, which now matches staging; replies that said "live
   on staging" are now live everywhere.

## Next

1. Clinical review of the fourteen pages' figures (unchanged: standard published ranges).
2. BugHerd #10 (Canva photos) and #73 (GHL form colours) still open.
3. Search Console: resubmit the sitemap (25 URLs).

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
