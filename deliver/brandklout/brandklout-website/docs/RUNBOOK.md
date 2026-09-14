# Runbook — bk-brandklout-website

The **standing** state of this project: what is true now, what comes next, and the traps.
The dated run history is one file per run under [`runbook/`](./runbook/INDEX.md). Read the index,
then only the runs you need.

## Objective

**Brandklout's own website.** Sang (CEO) built a page with ChatGPT. Phase 1 puts that page on
Instatic as supplied, to fix a compliance emergency on the current site. Phase 2 redesigns and
expands the site. Full scope and open questions: [`project-overview.md`](./project-overview.md).

## Status: v12, the CLASS SYSTEM (2026-09-14, evening)

- **The site's CSS is now Instatic classes**, editable in the Styles panel: every element carries its
  own layout class plus a shared type class (`text-18`, `heading-60`), resolved from Sang's cascade
  by `21-instatic-upload/class-system.mjs` and proven identical by `class-parity.mjs` (32 pages × 9
  widths). Fluid: rem + a clamp() root, identical to v11 up to 1440, 1.6x at 2304+. Nine editor
  breakpoints. Details: [`runbook/2026-09-14-class-system-and-home-v12.md`](./runbook/2026-09-14-class-system-and-home-v12.md).
- **Home page**: hero results slider (5 practices), `#results` as preview 1's three case cards with
  photos + logos, and preview 1's five-video client stories panel before "Why us".
- **The Instatic admin is now the source of truth.** Sang's next zip does not drop in; a re-push
  (`--force`) overwrites admin edits unless they are ported first (this run ported 2026-09-14's).
- The v11 notes below (forms, legal pages, plugin, widget, IDs) still hold, except "CSS is a verbatim
  code asset": the code asset is now only Instatic's reset reverted + `site-src/code.css`.

## Previous: v11 PUBLISHED on the review link (2026-09-14)

- **Live at <https://brandklout-production.up.railway.app>**: Sang's v11 site, **32** editable
  Instatic pages (home, solutions, specialties, six customer stories, `/market-opportunity`,
  `/authority-score`, `/book`, `/guarantee`, `/privacy`, `/terms`, `/hipaa`). **v2 is gone**:
  `/survey` and `/customer-stories-*` 404. Source: `client-handoff/package-v11/`. Admin at `/admin`,
  with the owner and Sang (`sang@thrivesquare.com`, admin). **Sang edits and publishes from the admin
  himself**, so check before any `--force` push.
- Details, gates and flags:
  [`runbook/2026-09-14-v11-published.md`](./runbook/2026-09-14-v11-published.md).
- **Every form emails sales@brandklout.com** through FormSubmit: the home "Check my market",
  `/market-opportunity`, and the 21-question assessment at `/authority-score` (v11's survey). This
  is set in `21-instatic-upload/patches/assets/site.js.mjs`. **Nothing arrives until someone at
  sales@ clicks FormSubmit's one-time activation email**, and again after the domain moves. GoHighLevel
  will replace it; change `formEndpoint` there and add GHL's origin to the plugin's `connectOrigins`.
- **Privacy / Terms / HIPAA are full pages** in Sang's layout, carrying brandklout.com's own legal
  text (`patches/privacy|terms|hipaa.html.mjs`). The v2 pop-up is retired.
- **CSS is a verbatim code asset** (`src/styles/site.css`), not registry rules: the Styles panel is
  empty by design. It opens with `instatic-reset-revert.css`, which undoes Instatic's reset
  stylesheet (without it every page lost its browser-default margins, block-level icons and so on).
  Directive: `21-instatic-upload.md` → "Brandklout: the shared-layout run (v11)".
- Plugin `brandklout.embed-origins`: `frameOrigins` YouTube (both hosts), `connectOrigins`
  sheetdb.io + formsubmit.co, `autoTrust` on, and `siteScripts` = the sienna-accessibility widget
  (added outside this toolkit). The widget rounds every text element's font size down inline on load;
  the visual gates block it (`KEEP_WIDGET=1` to keep it).
- **Not on any Brandklout domain.** The cutover waits for Sang's approval.
- Worktree `bk-brandklout-website`. Railway project `Brandklout`
  `550ebd58-0e74-444e-96d5-2b836a2db98a`, service `742221a0-b1f1-45f1-bf42-fc7bab85adca`, env
  `production` `ebac465d-468b-4cd3-afc6-78da721e0eb0`.

## Next

1. One labelled test submission from the review link; whoever reads sales@ clicks FormSubmit's
   Activate; confirm the next test arrives.
2. Sang: the three practice photos he added to v2's home cards (still in the media library), the
   "Terms of Use" / "Terms of Service" heading, the claims flagged in the run file, and the GHL
   endpoint.
3. Domain cutover via `20-instatic-domain-origins`, then add the domain to `sites.json`, then
   re-activate FormSubmit for the new origin.
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
