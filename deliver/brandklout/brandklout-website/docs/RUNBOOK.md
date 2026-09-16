# Runbook — bk-brandklout-website

The **standing** state of this project: what is true now, what comes next, and the traps.
The dated run history is one file per run under [`runbook/`](./runbook/INDEX.md). Read the index,
then only the runs you need.

## Objective

**Brandklout's own website.** Sang (CEO) built a page with ChatGPT. Phase 1 puts that page on
Instatic as supplied, to fix a compliance emergency on the current site. Phase 2 redesigns and
expands the site. Full scope and open questions: [`project-overview.md`](./project-overview.md).

## Status: v18 verbatim with Client-First type roles (seq 42, 2026-09-15)

- **2026-09-16: "my UI edit didn't publish" was the Laptop tab.** Laptop is max-width 1279, so an edit there never shows at 1280/1440/1512 (Webflow's 1280 tab cascades up; ours cascades down). Publishing works. Team guide: <https://claude.ai/artifact/BqYyWXMvR7w73EiLjo76Qo>. Open: whether `.cs-section-head`'s stacked layout goes to every width.
  [`runbook/2026-09-16-laptop-tab-breakpoint-guide.md`](./runbook/2026-09-16-laptop-tab-breakpoint-guide.md).
- **Seq 42 (2026-09-15, night): font sizes are Client-First role classes, tightened.** No-op chips are gone, recurring utility stacks are composite styles (`text-style-label`, `text-style-kicker`…), identical layout classes merged. Sang's edit that never
  published (a paragraph's size) was a base-breakpoint edit on a generated class (`text-18-7`) that
  carried its own tablet and phone sizes. Now font-size lives ONLY on `text-size-{micro…display-xlarge}`
  and `heading-style-{h6…h1, display}`, responsive values on the same chip, everything else
  typographic as one-property utilities (`text-weight-700`, `text-style-allcaps`, …); custom classes
  carry no type. Sizes snapped to the scale (≤2px at 1440, gated by `type-roles-check.mjs`; phones
  advisory). Editing rules for Sang are in the directive.
  [`runbook/2026-09-15-type-roles.md`](./runbook/2026-09-15-type-roles.md).
- **Seq 33 (2026-09-15, evening): the site is Sang's v18 package VERBATIM.** Alejandro: "copy
  exactly that same version"; the v16 instruction to keep the agency's home sections is revoked.
  `patches/index.html.mjs`, `patches/guarantee.html.mjs`, `agency/slider.js` and the home-v12 CSS
  are gone; his hero carousel and results row are the home page. Only non-design layers remain
  (forms to FormSubmit, the legal collection, standard breakpoints/type, reset revert). **No design
  patch goes on top of his package from now on.**
  [`runbook/2026-09-15-v18-verbatim.md`](./runbook/2026-09-15-v18-verbatim.md).
- **Seq 30 (2026-09-15): the whole instance was emptied and re-uploaded from the v18 build** on
  Alejandro's and Sang's call (`wipe-instance.mjs`, then fonts → media → plugin → pages →
  collection → publish). Nothing from before the wipe remains except the two accounts and the site
  settings. The content is identical to seq 27; every id (pages, media, table, rows) is new.
  Rollback: tag `brandklout-website-live-seq27` + `cms-2026-09-15-seq27-pre-wipe.db` +
  `uploads-2026-09-15-seq27-pre-wipe.tgz`.
  [`runbook/2026-09-15-wipe-and-rebuild-from-v18.md`](./runbook/2026-09-15-wipe-and-rebuild-from-v18.md).
- **Seq 27 (2026-09-15): Sang's v18 = v16's design + packaging.** Every zip now goes in through
  `21-instatic-upload/package-intake.mjs` first (`client-handoff/intake-vNN.md` says what changed;
  his importer guides are context, not instructions). v18's per-page CSS bundles are unbundled on
  read by `prepare-source.mjs`. **Privacy / Terms / HIPAA are rows of the `legal` collection**
  (`cms-collections.mjs`, `cms-sync.mjs`) at `/legal/privacy`, `/legal/terms`,
  `/legal/hipaa-data-handling`, rendered through the `legal-template` page; the old `/privacy`,
  `/terms`, `/hipaa` URLs 404 (a row cannot live at the root). Body text is still brandklout.com's
  own policies. Rollback: tag `brandklout-website-live-seq26` + `cms-2026-09-15-seq26-pre-v18.db`.
  [`runbook/2026-09-15-v18-intake-and-legal-collection.md`](./runbook/2026-09-15-v18-intake-and-legal-collection.md).
- **Source is `client-handoff/package-v18/`** + `patches/` (forms and the legal template only) +
  `cms-collections.mjs`, through the class system (`prepare-source.mjs package-v18`). Nothing
  reads `package-v11/` or `package-v16/` any more; they stay as history.
- **Seq 26 (2026-09-15): standard breakpoints and the house type scale**, whatever the package
  brings: Laptop 1279, Tablet 991, Mobile landscape 767, Mobile portrait 479 (Sang's widths snap to
  them), the house fluid root and plain rem font sizes. 1440 is identical to Sang's file; 1920 is
  12.5% larger, phones below 479 slightly smaller. Rollback: tag `brandklout-website-live-seq25` +
  `cms-2026-09-15-seq25-pre-standard.db`.
  [`runbook/2026-09-15-standard-breakpoints-and-type.md`](./runbook/2026-09-15-standard-breakpoints-and-type.md).
- **Widget removed (2026-09-15, seq still 25)**: the sienna accessibility widget is off the site
  (`remove-site-widget.mjs` emptied the plugin's `siteScripts`), and `agency/widget-fluid.js` is gone
  from the source. It had frozen the font sizes on every cached reload.
  [`runbook/2026-09-15-widget-removed.md`](./runbook/2026-09-15-widget-removed.md).
- **Seq 25 (2026-09-15)**: headings scale again under the accessibility widget (`agency/widget-fluid.js`
  undoes its frozen inline px sizes), and v16's max-width 900/680/600 are folded into the seven editor
  breakpoints (they had published as extra conditions).
  [`runbook/2026-09-15-widget-and-breakpoints.md`](./runbook/2026-09-15-widget-and-breakpoints.md).
- **Seq 24 (2026-09-15)**: Sang's and Sean's admin edits are back in the source (`patches/index.html.mjs`,
  `patches/guarantee.html.mjs`, `agency/site.css`), except the duplicate story headline and the 5rem
  h1. [`runbook/2026-09-15-admin-edits-restored.md`](./runbook/2026-09-15-admin-edits-restored.md).
- **Seq 23**: the fluid root now grows at most 1.15x (at 2560) instead of 1.6x, because the home
  heading was far bigger than Sang's on wide screens ("the heading is not right", reported twice).
  [`runbook/2026-09-14-heading-fluid-root.md`](./runbook/2026-09-14-heading-fluid-root.md).

- (Until seq 27) **Source was `client-handoff/package-v16/`** + `patches/`, through the class system. Every v16 change
  is live (prequalification form at the foot of every page, light footer, unified `/guarantee`,
  Calendly on `/book` as the Embed block, Legacy's chart on its story, five-card story row), while
  the home page keeps the live structure: agency hero slider, case cards, client-stories panel,
  prequalification above the FAQ, closing section. Details:
  [`runbook/2026-09-14-v16-published.md`](./runbook/2026-09-14-v16-published.md).
- **Rollback point for seq 21**: git tag `brandklout-website-live-seq21`, the API snapshot in
  `21-instatic-upload/.tmp/backup-2026-09-14-seq21/`, and
  `/app/storage/backups/cms-2026-09-14-seq21-pre-v16.db` on the container.
- The next zip of Sang's goes in the same way: back up, diff, re-anchor patches, rebuild (directive
  `21-instatic-upload.md` → "Sang's v16 on the class system").

## Previous: v12, the CLASS SYSTEM (2026-09-14, evening)

- **The site's CSS is now Instatic classes**, editable in the Styles panel: every element carries its
  own layout class plus a shared type class (`text-18`, `heading-60`), resolved from Sang's cascade
  by `21-instatic-upload/class-system.mjs` and proven identical by `class-parity.mjs` (32 pages × 9
  widths). Fluid: rem + a clamp() root, identical to v11 up to 1440, then gently up to 1.15x at 2560 (was 1.6x until seq 23). Nine editor
  breakpoints. Details: [`runbook/2026-09-14-class-system-and-home-v12.md`](./runbook/2026-09-14-class-system-and-home-v12.md).
- **Home page**: hero results slider (5 practices), `#results` as preview 1's three case cards with
  photos + logos, and preview 1's five-video client stories panel before "Why us".
- **The Instatic admin is now the source of truth.** Sang's next zip does not drop in; a re-push
  (`--force`) overwrites admin edits unless they are ported first. The admin edits of 2026-09-14
  were dropped on Alejandro's instruction; the live pages carry Sang's wording (seq 20).
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
- **Privacy / Terms / HIPAA** carry brandklout.com's own legal text. v11–seq 26: full pages via
  `patches/privacy|terms|hipaa.html.mjs`; **since seq 27: rows of the `legal` collection**
  (`cms-collections.mjs`) at `/legal/<slug>`. The v2 pop-up is retired.
- **CSS is a verbatim code asset** (`src/styles/site.css`), not registry rules: the Styles panel is
  empty by design. It opens with `instatic-reset-revert.css`, which undoes Instatic's reset
  stylesheet (without it every page lost its browser-default margins, block-level icons and so on).
  Directive: `21-instatic-upload.md` → "Brandklout: the shared-layout run (v11)".
- Plugin `brandklout.embed-origins`: `frameOrigins` YouTube (both hosts), `connectOrigins`
  sheetdb.io + formsubmit.co, `autoTrust` on, and `siteScripts` empty (it held the sienna
  accessibility widget until 2026-09-15; removed on Alejandro's call).
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
