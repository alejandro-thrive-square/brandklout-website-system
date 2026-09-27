# 2026-09-17, later — Everything on staging went to PRODUCTION

One ask, after the legal pages landed on staging: "Push it to production."

**Production was eleven pages behind.** The push is a whole-site replace — `push-site.mjs` has no
per-page mode, and trap 8 deletes any stored page absent from `changedPages` — so this was not a
two-page push. I said so before running it and the answer was to push everything. So production
now carries the client's Asana feedback, the teammate's web dev brief pass **and** the two legal
pages, all of which had been held on staging.

## Done (`03db652c`)

- `https://westlaketxmedspa.com` is now **13 pages** and content-equivalent to staging.
  - The trading name is **Westlake Medical Aesthetics** everywhere, the menu is 12 treatments in 4
    categories, the team is Brooke and Abby, the membership is the single $149 plan with its
    signed agreement, the phone is the (817) 383-8361 tracking number, Cherry is the primary
    lender, and Dr. Stone neither assesses nor injects here. See the two 2026-09-15 runs for the
    detail; nothing in them changed on the way to production.
  - `/privacy-policy` and `/terms-of-service` are live and linked from the footer of every page.
- **Backup first:** `.tmp/backup-prod-2026-09-17-pre-legal/` (production at **seq 10**, 11 pages).
  The push saved **seq 11**, and publish returned `{"publishedPages":13}`.
- **The duplicate `<title>` is gone.** Since an admin edit on 2026-09-12 every production page had
  carried the same title; `verify-live` now reports **13/13 distinct**. This push overwrote it.
  The home title is "Westlake Medical Aesthetics | Westlake, TX &amp; Dallas-Fort Worth Area" —
  the "Dallas Forth Worth" typo in the old site-wide title is gone with it.
- **Sitemap rebuilt and redeployed**: 12 URLs (the 13 pages less `/thank-you`), Worker
  `westlaketxmedspa-sitemap`, both routes bound, `verify-sitemap` **FAIL none**. The Cloudflare
  token was minted from `CLOUDFLAREAPI` for 4 hours, scoped to the zone with Workers Scripts
  added, and has been **revoked**.

### Gates (production)

- `verify-live` **FAIL none** — 13 routes, 95 URLs, 189 asset references, 13/13 distinct titles.
- `css-parity` **FAIL none**.
- `compare-live` 4 findings, all of them the trap 30 container-margin noise on /treatments and
  /botox.
- `visual-diff` 1440: /privacy-policy 3.6%, / 1.2% — antialiasing and image re-encoding.
- Spot-checked by curl: the five key routes are 200, the footer links resolve, and no page carries
  the old office number.

## Next

1. **The legal pages still want a review**, and the practice's legal entity name and a contact
   email. They are live now, so this is a correction to make, not a gate to pass. See the earlier
   run today.
2. Still open from the 2026-09-15 runs, now live in front of patients: the practice's own Cherry
   apply link (the button goes to Cherry's generic site), the "Dr. Stone injects" contradiction
   from the brief, how the Wellness Wallet handles an unused balance, reviewer names, and #110 vs
   #110b.
3. **Submit `https://westlaketxmedspa.com/sitemap.xml`** in Search Console and Bing. robots.txt
   cannot name it (workflow 06 gotchas).
4. Treatment pricing, bios and photos for Brooke and Abby, and before-and-after photos.

## Gotchas

- **`verify-live.mjs` was testing the wrong script on production.** It took the first
  `/_instatic/assets/**.js` on the page, and production carries site scripts of its own — the
  Brandklout consent bridge sorts ahead of the entry bundle, because Instatic orders code assets
  by path. It reported "site.js is missing the `js` class bootstrap" and "does not contain the
  drawer logic" on a site that was fine. Fixed here: it now picks `/entries/site-`. **Staging
  never caught this**, because staging carries the same scripts but the gate had only ever run
  against it after a push in which the first match happened to be the bundle.
- **`verify-sitemap.mjs` can fail once right after a deploy** and pass on the retry. The bytes
  were identical; it was the edge serving the previous copy for a few seconds.
- **There is no per-page push.** Any "just push this one page" request is a whole-site replace,
  so check what else is sitting in the local build before running it.

## Version Control

Tracked. Committed with the work it describes.
