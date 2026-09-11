# Runbook — bk-brandklout-website

The **standing** state of this project: what is true now, what comes next, and the traps.
The dated run history is one file per run under [`runbook/`](./runbook/INDEX.md). Read the index,
then only the runs you need.

## Objective

**Brandklout's own website.** Sang (CEO) built a page with ChatGPT. Phase 1 puts that page on
Instatic as supplied, to fix a compliance emergency on the current site. Phase 2 redesigns and
expands the site. Full scope and open questions: [`project-overview.md`](./project-overview.md).

## Status: v2 PUBLISHED on the review link, waiting on Sang (2026-09-11)

- **Live at <https://brandklout-production.up.railway.app>**: Sang's v2 package as he wrote it,
  **seven** editable Instatic pages: `/`, `/survey` and five stories at `/customer-stories-<name>`.
  Admin at `/admin`, with the same login as Mason Park. Source: `client-handoff/package-v2/`.
- Gates: `verify-live` and `css-parity` FAIL none. `visual-diff` ≤0.030% on every page at 1440 and
  390. `compare-live` shows 23 findings, all benign. Details:
  [`runbook/2026-09-11-sangs-v2-package-published.md`](./runbook/2026-09-11-sangs-v2-package-published.md).
- **Not on any Brandklout domain.** The cutover waits for Sang's approval.
- **`/survey` is Sang's Netlify 21-point assessment, rebuilt** in the site's style
  (`21-instatic-upload/overlay/survey/`), posting to his SheetDB sheet exactly as before. The
  `brandklout.embed-origins` plugin is installed with `connectOrigins: https://sheetdb.io` only.
  See [`runbook/2026-09-11-netlify-survey-rebuilt.md`](./runbook/2026-09-11-netlify-survey-rebuilt.md).
- **Agency edits on Sang's home page live in `21-instatic-upload/patches/index.html.mjs`**: the
  "Why us" cards are stacked, his video plays in place, and the footer's Privacy / Terms / HIPAA
  open brandklout.com's legal pop-up, cloned with its text verbatim
  (`patches/assets/brandklout-com-legal.json`). His file is untouched.
- **Forms (home + survey): Sang is deciding**, probably GoHighLevel embeds. There is no lead
  email on the old site; its `privacy@`/`legal@`/`hipaa@brandklout.com` are the legal pop-up's
  contact lines. A GHL embed needs its origins added to the embed-origins plugin.
- **The main CTA is a dead end.** Every "Check My Market" / "See If My Market Is Available" goes
  to the home `#apply` form, which captures nothing. The working capture (`/survey`) is linked only
  from the footer, and there is no "Book a Demo" or "Login" as on brandklout.com. Options are in
  [`runbook/2026-09-11-why-us-stacked-and-flow-review.md`](./runbook/2026-09-11-why-us-stacked-and-flow-review.md).
- **The site is not launch-ready, by its own text.** The home form captures nothing and tells
  visitors it is a prototype. Privacy, Terms and HIPAA link to `#`. The prototype lines are still there.
  The claims have grown: a 60-day money-back guarantee on every page, 10-mile exclusivity, and
  story metrics. The full table is in the run file above.
- Worktree `bk-brandklout-website`. Railway project `Brandklout`
  `550ebd58-0e74-444e-96d5-2b836a2db98a`, service `742221a0-b1f1-45f1-bf42-fc7bab85adca`, env
  `production` `ebac465d-468b-4cd3-afc6-78da721e0eb0`.

## Next

1. Sang reviews the link and answers the flagged list: where the home lead form should send its
   data (the survey is settled: SheetDB), the real Privacy/Terms/HIPAA pages, the prototype lines, the claims,
   and the white-on-white story CTA button.
2. Apply his corrections to the source (a new package, unzipped beside itself), then rerun the
   chain in `21-instatic-upload.md` → "Brandklout: the package run".
3. Domain cutover via `20-instatic-domain-origins`, then add the domain to `sites.json`.
4. Phase 2: redesign and expand (see the project overview).

## Gotchas

1. **The Railway token is `user.accessToken` in `~/.railway/config.json`.** `user.token` is null,
   and the `[shared]` `RAILWAY_TOKEN` answers `Not Authorized`.
2. **`ship.sh` needs `RAILWAY_LINK_DIR` linked by project ID**
   (`railway link -p 550ebd58-0e74-444e-96d5-2b836a2db98a -e production -s Brandklout`).
3. **`puppeteer-core` is not a repo dependency.** Run `npm install --no-save puppeteer-core` at the
   worktree root before the Chrome gates.
4. **`push-site.mjs --apply --force` replaces the whole site.** If anyone edits the page in the
   admin, those edits are lost on the next push. Pull their changes into the source first.
5. **Routes are flat.** A package path `customer-stories/x/index.html` publishes at
   `/customer-stories-x` (trap 39). Take routes from `.tmp/site/site-src/pages.json`.
6. **Several stylesheets become one registry.** `prepare-source.mjs` scopes each to a `<body>`
   class and orders `@media` widest first (trap 40). Run `visual-diff --source` after any change
   to it: it must stay at 0.000%.
7. **Never send a real survey submission to test.** It writes a row into Sang's live sheet and
   whatever watches it. `form-probe.mjs` aborts the SheetDB POST and still checks its payload.
8. The toolkit's comments still describe Stone in many places. The Brandklout box and section at
   the top of `21-instatic-upload.md` are what is true here.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). IDs and public URLs only. No secrets.
