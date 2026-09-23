# 2026-09-23 — The client's BugHerd pass (41 tasks), on staging

BugHerd project `540569` "Stone Med Spa", 41 open tasks filed 2026-09-22/23 against the
**production** site at 1512 wide. Every task was fetched by id with its attachments and
screenshot (the list endpoint hides page and selector). **38 are done on staging; 3 wait on photos.
Production is untouched** — it needs a go.

## Done

**Staging `https://staging.westlaketxmedspa.com` — seq 13, 24 pages, 77 media.** Commit `074363ef`.

| BugHerd | Change |
| :-- | :-- |
| #28–#33, #35–#39 ("why doesn't this have a dedicated page") | **Eleven treatment pages**, one per menu row: `treatment-pages.mjs` (content) rendered by `treatmentPage()` in `build-site.mjs` with Botox's section shape and classes. `page` set in `treatments-data.mjs`, so the menu row, ticker and related cards link to them. |
| #1, #4 | "Stone Surgical Arts" links to dfwsurgicalarts.com in the hero foot and mosaic point 03. |
| #2, #3 | Cadence "3, then yearly" / "3, then 2 a year" → "3 sessions, then …". |
| #5, #6 | Year grid: header row and row names bold. Cormorant **600** added (`assets/fonts/cormorant-garamond-600.woff2`, `03-fonts.css`, `install-fonts.mjs` WANTED) instead of a faux bold. |
| #7 | The client's purple `#733da8` (sampled from their attachment) as `--purple` on the grid's dots and legend. |
| #8 | Home Brooke photo: parallax removed (it stretched the image to 120% and cut her head and the pen), and a brightened copy `staff-brooke-bright.webp` used site-wide. |
| #11, #12, #13 | "Full bio coming soon." removed; Abby is "Medical Aesthetician, Senior Laser Technician", and "aesthetician" everywhere. |
| #16, #17, #18 | Filmstrip: desk frame is "Reception", the second reception frame and the sign are gone, neon is "The Vibe". |
| #19, #20, #21 | Team lead band: the client's eyebrow and paragraph about Dr. Stone verbatim, plus a Stone Dental Implant Center link. |
| #22 | Closing band: "…a plan for the *future you*." (shared partial, every page). |
| #23 | Closing-band fact keys ivory instead of green. |
| #24 | Address **#110b** everywhere: footer, drawer, home, about, book, both legal pages, `seo.json`. |
| #25 | Footer "Looking for surgery?" switch: dark inks on its pale hover ground. |
| #26 | General FAQ (the client's eight questions, answers ours) from `site-faq.mjs`, at the bottom of home and /team. |
| #27 | /book cover: no parallax and `u-cover-flush` (object-position top) — her head touches the photo's top edge. |
| #34 | Facials category on /treatments gets "See the membership →". |
| #40, #41 | A third door, **Dental** → stonedentalimplantcenter.com; lede names "Dr. Jawline" and smile makeovers at the implant centre. |
| #42 | /about rule 01 uses `cat-nonsurgical-tall.webp` instead of the Brooke photo already on home. |

**Waiting on Google Drive** (sign-in expired, `invalid_grant`; run `node scripts/drive.mjs auth`):
**#15** replace the treatment-room frame with Drive's "Stone-Treatment-Room"; **#9/#10** Abby's and
Brooke's photos ("Stone Team - Abby Gentry", "IMG_5299.jpg" — the reviewer says Canva; look in the
Stone shared drive first). With Abby's photo, her team card loses the initial and home's provider
band can show both. Nothing about Brooke is known to write "more about her" (#9's alternative).

## Gates

- Local: `audit` FAIL none; `all-pages` 24 pages × 5 widths, 480 assertions clean; `menu-test`
  9/9; `drag-test` 3/3.
- Staging: `verify-live` FAIL none (24 routes, 24/24 titles); `css-parity` FAIL none;
  `form-test` FAIL none; `compare-live` 16 findings = the 7 known (trap-30 margins on
  /treatments and /botox, the GHL embed on /book) + index (fixed, below, now "No differences") +
  a cover-fact label wrapping to two lines at 390 on /hydrafacial and /hair-restoration (text
  metrics under the staging accessibility widget; harmless).

## Production, when approved

Production was last pushed 2026-09-18 (seq 14) and got **Termly** on 2026-09-22 through the
`brandklout.embed-origins` plugin settings. `push-site.mjs` only *reads* plugin settings and spreads
`site.settings`, so a forced push keeps Termly — check `curl -s https://westlaketxmedspa.com/ | grep -c termly` after anyway.

```bash
unset INSTATIC_BASE_URL
node .tmp/snapshot-staging.mjs backup-prod-2026-09-23-pre-bugherd   # expect seq 14 or Termly's
node upload-media.mjs && cp .tmp/media-map.json .tmp/media-map.production.json
node install-fonts.mjs --apply        # Cormorant 600
node set-alt.mjs --apply
node build-import-input.mjs
RAILWAY_LINK_DIR=<…da866dac…/link-prod> bash ship.sh
node push-site.mjs --apply --force
node -e "import('../../../../process/22-instatic-api-sync/insta-api.mjs').then(m=>m.publish())"
```

Then the gates, and **redeploy the sitemap** (`06-cloudflare-sitemap`, reads production's pages:
11 new URLs; needs a temp Cloudflare token).

## Gotchas

1. **A link inside a `display:grid` paragraph is blockified.** `.mosaic_point` is a grid, so the new
   `<a>` became its own grid row and broke the sentence into three lines — locally too, every gate
   green. `compare-live` caught it as +46px at 390. Wrap the text run in a `<span>`.
2. **`build-import-input.mjs` took titles from `seo.json` only**, so the generated pages shipped with
   empty SEO titles on the first try. It now falls back to the built page's `<title>`/description.
3. **No JSON-LD reaches the live site at all** — not the Botox FAQPage, not the organization.
   `seo.json`'s `schema` is written into the static `<head>` and dropped by the importer. Predates
   this run; the home FAQPage added today has the same fate. Needs the aeo-schema route.
4. `media-map.json` is swapped to staging's for a staging upload; put production's back after.
5. The page lists in `build-import-input`, `verify-live`, `compare-live` and `visual-diff` now
   spread `Object.keys(TREATMENT_PAGES)`, so a new generated page cannot be built and not shipped.
6. Headless element screenshots of the year grid show no dots (the pop animation restarts); a
   viewport screenshot shows them. Not a site bug.

## Next

1. Go-ahead for production (above), then the sitemap.
2. Drive auth → #15, #9, #10.
3. Clinical review of the eleven pages' figures and contraindications, as for Botox. The old
   Stone Surgical Arts pages disagree with `treatments-data.mjs` on Dysport onset/longevity, filler
   longevity, Morpheus8 session count, PRP downtime; the data file was followed.
4. BugHerd statuses are untouched; mark them once production carries the fixes.
