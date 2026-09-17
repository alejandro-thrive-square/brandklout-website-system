# 2026-09-17 — Silktide consent banner on test (staging only)

Asana: "Cookie Policy Updates" (task 1218401388192949). Termly accounts can't be created by the agent, so
the user chose to test the free Silktide Consent Manager on Livewell first.

## Done
- **Module 23 gained a Silktide path** (`deliver/process/23-termly-ghl-consent/kit/silktide/`): a loader,
  per-site `sites.json`, and `consent-kit.mjs silktide-snippet | silktide-merge | silktide-check`. The
  directive's "Silktide alternative" section is the how-to.
- **Bridge 2.3.0** (1,910 chars) also reads the loader's `bk.consent` record. It is registered on Livewell
  and applied in the footer, and the hosted copy is byte-identical (`cmp`).
- **Webflow head:** the Silktide block is now first, above GTM. The Ahrefs tag was removed from the head
  and the two GHL tags (`number_pool.js`, `user_session.js`) from the footer; the loader injects all
  three. Before/after code is in `workflows/consent/.tmp/` (`freeform-before-2026-09-17.json`,
  `before-*.html`, `after/`).
- **Published to `livewelldentalva.webflow.io` only.** The live domains were not published. The staging
  page carries the new head and footer verbatim.
- **Tested on staging** with `silktide-check`, with and without GPC; all steps pass (see module 23 for the
  list). Screenshots were checked at 1440 and 390 px: cream/olive theme, Lato, links to /privacy-policy and
  /cookie-policy, Silktide branding hidden.

## Next
- User review on staging: `https://livewelldentalva.webflow.io/contact-us`, in a private window with
  **NordVPN paused** (it blanks jsDelivr in Chrome, so no banner appears).
- To go live: set `live: true` in `sites.json`, re-run merge and preview, write the head, and publish.
  Designer changes have been pending since 2026-09-14, so a live publish is the team's call. Also add a
  `#consent-preferences` "Consent Preferences" link to the footer (Designer).
- Decide with Brandklout whether Silktide's limits are acceptable (no scan, no policy generator, no
  third-party consent log) before rolling it out to other sites.

## Gotchas
- **While `live` is false**, the real domain gets no banner. The loader only injects the three trackers
  exactly as before, so the team's next publish is safe (checked with `--preview --as-published`).
- Sienna's accessibility button (bottom-left) and Elfsight's review badge (bottom-right, after scrolling)
  take both corners. The banner sits bottom-right; the cookie icon sits bottom-left at 96px.
- `/cookie-policy` has the SEO title "Cookie Policy | ACE Dental Center". Not fixed.
- The branch was behind main. Merging main conflicted on `18-instatic-embeds/embed-origins/plugin.json`;
  main's 1.6.0 was taken.
