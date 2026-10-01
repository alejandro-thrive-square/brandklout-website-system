# 2026-10-01 — "HIPAA Disclosure" footer link, published seq 27

**Commit:** see the client `RUNBOOK.md` row. Footer link only; production only (the client's
only Instatic instance).

## Done

- **Where:** this site has no components; the footer is inlined on every page row. Both legal
  rows got the link straight after **Privacy**: `.footer-links` (site footer, 81 pages) and
  `.lp-foot-links` (ads landing footer, 6 pages). 87/87 pages.
- **How:** `workflows/21-instatic-upload/add-hipaa-footer-link.mjs` clones each row's Privacy
  `base.link` (same module, classes, props; the rows have no separator nodes, they space with
  `gap`), re-points it to `/hipaa-disclosure`, labels it `HIPAA Disclosure`, and writes all 87 rows
  in one incremental `PUT` (seq 26 → 27), then one publish. Draft matched published before the
  write; no other row and not the shell moved before the publish.
- **SEO cells put back:** a site-document page write drops `seoTitle`/`seoDescription`; the 34
  rows that had them (all flat slugs) were restored by read-merge-write `PATCH`. (`index` had
  already lost them in the 2026-09-30 reviews run; not re-added here.)
- **Source:** `site-src/lib/layout.mjs` `footer()` and `lib/lp.mjs` carry the same link; rebuilt,
  87 dist pages have it.
- **Verified:** every published page fetched before (scratchpad copy) and after. On all 87 the
  link appears exactly once, directly after Privacy, and removing it leaves the page identical
  to before apart from the per-publish asset folder id and module `?v=`. `/hipaa-disclosure` is
  200. Measured at 1440 and 390 in Chrome (puppeteer-core): site footer single-line links at
  both widths, no horizontal overflow.

## Next

- **Ads landing footer at 390 wraps each link onto two lines** ("HIPAA / Disclosure", "Cookie /
  Preferences"): `.lp-foot-links{display:flex;gap:1.4rem}` has no `flex-wrap`, and four labels no
  longer fit 356 px. Single-line at 1440. Fix (needs a CSS go-ahead): add `flex-wrap:wrap` (and
  a row-gap) to `.lp-foot-links` in `css/60-lp.css` and the shell rule; or drop the link from the
  six noindex ads pages.

## Gotchas

- **The runtime Cookie Preferences link moved.** `brandklout-consent-preferences.js` inserts it
  after the first legal link that follows Privacy and matches its list (`hipaa` is in it). The
  row now reads Privacy · HIPAA Disclosure · Cookie Preferences · Accessibility (before:
  Privacy · Accessibility · Cookie Preferences). No script was edited.
- A page write through `site-document` silently drops the SEO cells; always restore them.
- Termly's banner covers footer screenshots in fresh headless sessions; hide it with an injected
  style for the capture.

## Version Control

Tracked with the client runbook on `bk-west-la-implants`; see the repository's SYSTEM_RULES.md §4.
