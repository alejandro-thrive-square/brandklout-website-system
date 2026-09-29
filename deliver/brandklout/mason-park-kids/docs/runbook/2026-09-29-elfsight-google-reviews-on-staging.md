# 2026-09-29 - Elfsight Google Reviews on staging

## Done

- **Widget:** Elfsight Google Reviews "Mason Park Dental for Kids", app
  `d359c3c4-40bc-4c66-87ae-714ed666eb01`, on the shared Elfsight account (Google Reviews, 22/50,
  Enterprise T1). Carousel template, defaults, published. Source is the **pediatric** listing,
  21830 Kingsland Blvd **#104B**, 4.9 from 97 reviews. The search also offers the adult practice
  (#104A, 1,083 reviews): never pick that one.
- **Staging only** (`staging.masonparkpediatricdental.com`), published, 215 pages:
  - `/` `#proof`: the `.pr-rail` of seven hand-picked chips is replaced by an Embed block
    (`.wrap.rv-embed`). The lead quote, the portrait and "All reviews" stay.
  - `/patient-reviews` `#wall`: both `.rv-wall` columns (the nine) are replaced by one Embed
    block (`.rv-embed`), and the heading "All nine, unedited." became "Straight from Google."
  - A new class rule, `.rv-embed` (`display:block; width:100%; min-height:420px`).
- Script: `workflows/03-core-pages/.tmp/add-elfsight-reviews.mjs` (dry run by default; `--apply`
  `--publish`). It can be re-run: it brings an existing embed's snippet up to date.
- Verified in real Chrome on fresh loads: both pages render the widget at 441px with the live
  pediatric reviews (Ruth Lopez, Carnal August, Ashley Caballero, Lawrance Chaisson...).
- Backup before the write: `.tmp/backup-staging.masonparkpediatricdental.com-2026-09-29T17-50-26.json`.

## Next

- **Not on production.** Promote with
  `PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app node add-elfsight-reviews.mjs --apply --publish`
  once the client has seen it.
- Design: the widget brings its own "What Our Customers Say" title, Google-grey cards and its own
  font, under our own chapter heading. Turn the widget's header title off and match the colours in
  Elfsight's editor (Header / Theme) if the reviewer asks.
- The local source (`home/index.html`, `home/patient-reviews/index.html`) still has the static
  rail and wall. See the gotcha.

## Gotchas

- **`data-elfsight-app-lazy` never boots on this site.** With the snippet exactly as Elfsight
  gives it, `platform.js` loads, `window.eapps` exists, and the widget stays at **0px with no
  boot request**. The CSP was fine (compatible mode, `https:`) and every Elfsight host answered
  200 from the page. Any DOM mutation after load made it render. Dropping the attribute fixed it
  on a fresh load. Keep it out of every Elfsight snippet on Instatic sites.
- **A re-import drops the widget.** `import-pages.mjs` rebuilds a page from its local HTML, which
  has no Embed. After any re-import of `/` or `/patient-reviews`, run
  `add-elfsight-reviews.mjs --apply --publish` again.
- "Panel only seen by widget owner" shows above the widget in any browser logged in to Elfsight.
  Visitors do not see it.
- **Jev could not create the widget.** Elfsight's editor is a cross-origin iframe
  (`universe-static.elfsightcdn.com`), which Jev Ultrafast does not read. While the template
  picker loads, the only visible control is "Close", and Jev clicked Create / Close twelve
  times. It created nothing (the count stayed 21/50). The widget was created through Claude in
  Chrome instead.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
