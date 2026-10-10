# Tool · Instatic Embeds

Using the **Embed block** on an Instatic site: placing third-party widgets (booking forms, review
widgets, chat bubbles, CRM embeds), the two policy modes, site-wide scripts, and the live gates that
prove a block works. The block is the `brandklout.embed-origins` plugin. Its source, tests,
packaging, permissions and upgrades live in [`../instatic-plugins/`](../instatic-plugins/README.md)
([embed-origins README](../instatic-plugins/embed-origins/README.md)); installing or upgrading it on
any site is [Scenario 4](../../scenario-4-update-plugins/README.md), never this folder.

> [!IMPORTANT]
> **Integrity Rule**: any change to these scripts or gates is documented here immediately, and in
> [PROCESS_INDEX.md](../../PROCESS_INDEX.md) when which scenario uses it changes.

## Client-facing overview
Whoever edits the page can place a third-party widget from the editor: paste the vendor's iframe
or snippet, publish, done. No developer, no agent, no platform fork. Give a marketer
[`handoff/embed-block-guide.html`](handoff/embed-block-guide.html) and a developer this file.

## Why it is needed

Instatic publishes every public page behind a strict Content-Security-Policy (`frame-src 'none'`,
`script-src 'self' '<importmap-sha>'`) and ships **no module that emits an `<iframe>` or raw HTML**
(`base.video` is YouTube-only). Out of the box every third-party embed is impossible, and no
setting changes that. The plugin closes both halves through the public plugin API:

| Half | Entrypoint | What it does |
|---|---|---|
| The block | `entrypoints.modules` | an **Embed** module in the canvas library: paste a URL or the vendor's snippet |
| The policy | `entrypoints.server` | a `publish.html` filter that rewrites the page's CSP meta tag at publish time |

## Running the scripts

Run everything from this folder: `deliver/process/tools/instatic-embeds/` on main, or the same
folder in the client's mirror (`node scripts/scenario.mjs start|sync` mirrors it, untracked; fix the
toolkit here on main, never in the mirror). The site and login come from the generated
worktree `.env` (`INSTATIC_BASE_URL`, `INSTATIC_EMAIL`, `INSTATIC_PASSWORD`), which
`scripts/env-sync.mjs` writes from `~/.brandklout/.env`; add a missing value to the master, never to
the worktree file ([SYSTEM_RULES.md §4.2.2](../../../../SYSTEM_RULES.md)). The admin client is
[`../instatic-api-sync/insta-api.mjs`](../instatic-api-sync/insta-api.mjs); it has no default site
and refuses to run without one.

```bash
node set-origins.mjs                        # show the allowlist and siteScripts on this site

node verify-embed-canvas.mjs --place        # does the CANVAS show a card, not the embed?
node verify-embed-canvas.mjs --check        # 15 assertions, publishes nothing
node verify-embed-canvas.mjs --cleanup

node verify-embed-scripts.mjs --place       # does a pasted FRAME load and a pasted SCRIPT run?
node verify-embed-scripts.mjs --check       # PUBLISHES: 19 assertions on the published page
node verify-embed-scripts.mjs --cleanup
```

> [!WARNING]
> `verify-embed-scripts.mjs --place` and `--cleanup` PUBLISH. On Instatic a publish bakes
> **every** page, so any page whose draft has drifted from live ships with it. Snapshot before and
> after with `node ../instatic-site/ops/backup-site.mjs`. `verify-embed-canvas.mjs` publishes
> nothing and is the one to run first.

The offline suites (`node ../instatic-plugins/plugins.mjs test --plugin embed-origins`, 85 + 54
assertions) prove the filter and the render functions with no host. The two gates here prove what
only exists on the platform: that the host registers the module, that a snippet survives
`escapeProps()` as markup, that the auto-height runtime is served, and that the CSP lets it load.

## The two policy modes

`embedPolicy` in plugin settings, default **compatible**:

| Mode | What a page gets | Use it when |
|---|---|---|
| `compatible` | a page that CONTAINS an Embed block may load anything over `https` (script, frame, connect, style, font, img, media); pages without one are byte-for-byte untouched | the client will paste whatever their marketing stack hands them |
| `strict` | a page is allowed exactly the origins its markup contains, plus a `'sha256-'` hash per inline script | the embeds are known and few |

**Compatible mode drops script hashes deliberately.** A browser ignores `'unsafe-inline'` the moment
any hash appears in `script-src`, so a mode whose job is "the pasted snippet works" cannot keep them;
the host's importmap then runs under `'unsafe-inline'`, and inline `onclick=` handlers work.
`'unsafe-eval'` is granted because widget bundles use `new Function`.

Say the trade out loud at handover: on pages carrying an embed, what stands between the site and a
**maliciously injected** script is `default-src`. What stood between it and a **pasted** one was
always the person pasting. That is the bargain Webflow makes, made deliberately and per page.

`strict` + `autoTrust: false` returns to "nothing is allowed unless an operator typed it".

## Site scripts: one tag on every page

The `siteScripts` setting (one https URL per line, plugin 1.6.0+) puts a script on **every**
published page: the filter adds `<script src="…" async data-wz-site-script>` before `</head>` and
grants that host `script-src`, `connect-src`, `style-src` and `font-src`, in both modes, on pages
with or without an Embed block. It is the only way onto every page: `importHtml` strips a head
`<script>`, and `script-src 'self'` refuses a runtime injection from the site bundle.

- **Consent (1.7.0+):** a line ending `#consent=advertising` (or `analytics`, or both joined by `|`)
  is emitted as `<script type="text/plain" data-categories="…">` for the cookie banner to release
  (see [termly-ghl-consent](../termly-ghl-consent/termly-ghl-consent.md)). An unknown category
  refuses the line rather than holding the script forever.
- **Page scoping (1.8.0+):** options join with `&`. `pages=<glob>[,<glob>]` puts the line only on
  those pages; `except=<glob>[,<glob>]` on every page but those. A glob is a page slug with `*`
  (home is `index`; a data-row entry arrives with its **template's** slug). Two call-tracking
  pools, one per office: `…/number_pool.js#except=ads-landing-pages/tysons-*` and
  `…/number_pool.js#pages=ads-landing-pages/tysons-*`. **Anything older than 1.8.0 drops the
  scoping and puts every pool on every page**, which is why the installers refuse a downgrade.
- **A host grant covers only that host.** A tracker that loads from one host and calls another
  needs the second in `connectOrigins`, and the gap shows only on pages **without** an Embed block.
  GoHighLevel's pool loads from `backend.leadconnectorhq.com`, asks `services.leadconnectorhq.com`
  and reports to `services.msgsndr.com`; on Dr. Nahlah the missing host refused the swap on 79 of
  97 URLs (2026-09-22).
- **Live since 2026-09-12:** the Sienna accessibility widget on every instance
  (`https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js`; it needs
  the script, a `fetch` of `dist/locales/` and the OpenDyslexic font).

```bash
node rollout-site-scripts.mjs status                        # plugin version, siteScripts, draft vs live
node rollout-site-scripts.mjs apply --url <script> --apply  # merge the URL; installs and publishes nothing
node rollout-site-scripts.mjs publish --apply               # REFUSES a site whose draft differs from live
node rollout-site-scripts.mjs verify --url <script>         # every published page: one tag, CSP allows it
# --only <section>[,<section>] narrows any of them
```

The sites are every `~/.brandklout/.env` section with an `INSTATIC_BASE_URL`, each in its own child
process (`insta-api.mjs` fixes `BASE` at import). `apply` refuses a site that is not on the released
embed-origins in `../instatic-plugins/plugins.json`: bring it there with
`node ../instatic-plugins/plugins.mjs rollout --plugin embed-origins` first. `set-origins.mjs
--site-scripts <url>` sets the setting on one site.

**The settings `PUT` replaces the whole record; it does not merge.** A call carrying one box emptied
the other two, and every key left out fell back to its default (2026-09-01). `set-origins.mjs` GETs
the record and writes the merged one, so pass only the flags you mean to change. It also drops keys
the installed schema no longer declares (`compatibleEverywhere` from the reverted 1.5.0 would make
the validator refuse the write). Upgrading the plugin does not reset settings.

### A review sidebar is not an Embed block

BugHerd arrives through a **site-wide runtime script**, so no page "contains" it and compatible mode
never engages; the typed boxes allow it. It needs `www.bugherd.com` as a script origin (the loader),
and `sidebar.bugherd.com` as a script origin **and a frame origin**. A logged-in sidebar also opens a
Pusher websocket and builds `blob:` previews; the boxes cannot express those, and it degrades to no
live updates rather than failing. The one time a sidebar "did not open" (Mason Park staging,
2026-09-02) it was NordVPN Threat Protection blanking the script in Chrome with a synthetic `204`;
the policy change made to chase it (1.5.0) was reverted as 1.5.1.

## The canvas shows a card

Since module 1.1.0 (plugin 1.4.0), `preview()`, the editor-only path, never emits the frame or the
snippet. It returns a static card: mode, destination host(s), what a snippet contains, the height
rule, and "Appears when the page is published". `render()`, the publish path, is untouched. The real
thing on the canvas cost more than it bought: a URL-mode iframe booted the vendor's widget in the
editor and sat at its starting height forever (the auto-height runtime never ships to the canvas),
and a snippet mounted with `dangerouslySetInnerHTML` showed undressed markup while its `<style>`
leaked out and restyled the editor.

The card stays **selectable and stylable** and is **sized to what will publish** (fixed height,
ratio, or the auto starting height as `min-height`). Its root carries `data-wz-embed-card="1"`
alongside `data-wz-embed="<fit>"`; `render()` never emits the former.

`verify-embed-canvas.mjs` writes three configured blocks into a draft (URL/auto, URL/ratio, and a
snippet carrying a `<script>` and a `<style>`), opens the real editor under CDP and asserts 15
things across all three breakpoint canvases: every block rendered a card, no `<iframe>` was created,
no `<script>`/`<style>`/`<link>` from the snippet reached the editor, the editor made no vendor
request, each card names its host, and the pack fetched is the released version. It skips the block
inserter on purpose: a synthetic click on the picker fails repeatably (the first click after a
navigation often never reaches React's handler), which once read as a broken plugin on two sites
while the block itself was fine. Check the inserter by hand with a real click.

## Three different things called "origin"

| | What it is | Where it is set | What it gates |
|---|---|---|---|
| `PUBLIC_ORIGIN` | the site's canonical public origin(s) | env var on the **Instatic host** (Railway) | **the admin**: CSRF on every state-changing request. [`instatic-domain-origins`](../instatic-domain-origins/instatic-domain-origins.md) |
| `INSTATIC_BASE_URL` | which site these scripts talk to | the `[<client>]` section of `~/.brandklout/.env`, generated into the worktree `.env` | which admin **our scripts** hit |
| frame / script / connect origins | vendor hosts an embed may load | **the plugin's** settings, in the admin UI | the **published page's** CSP |

Changing one never affects the others. `INSTATIC_BASE_URL` must pass the `PUBLIC_ORIGIN` gate, or
every script here fails with 403s that read like permissions problems.

## Gotchas

- **A site script can duplicate a widget the site already runs.** On IFA, Sienna appeared next to a
  UserWay button the WordPress clone injected from its `site.js` registry; neither shows in page
  HTML. Before a site-wide widget, grep each site's `src/scripts/site.js` shell asset or published
  `site-*.js` bundle for the same kind of vendor.
- **Check `draftMatchesPublished` before any fleet-wide publish.** `rollout-site-scripts.mjs publish`
  re-reads it right before publishing and skips a drifted site. A publish bakes EVERY page: on
  Dr. Nahlah unrelated drift once cost the home page its six review-card fallbacks.
- **`escapeProps()` runs before `render()` on the publish path** and HTML-escapes every non-`url`
  string prop, so a pasted snippet arrives as `&lt;iframe …&gt;`. The module decodes then escapes
  exactly once, which is idempotent and so also correct on the canvas, where props arrive raw.
- **A gate whose assertions are all negatives passes vacuously on an empty page.** "No iframe", "no
  vendor request" are all true of an editor that never loaded; the first Mason Park run reported
  four greens over zero canvases. Write the positive first and hang the negatives off it.
- **60 s is not enough for a cold Railway dyno.** At 120 s the identical run passed 15/15.
- **The deployed admin has no `toolbar-add-module-btn`** (that is the v0.0.16 zip only). The real
  doors are `canvas-notch-add-btn` and `dom-tree-insert-module`. Dump `[data-testid]` off the running
  page rather than trusting the source for admin DOM.
- **A widget that loads and renders nothing is usually not CSP.** Prove it away from the client's
  site first: serve the same snippet from a bare localhost page with no CSP. On Dr. Nahlah that
  exonerated the platform twice (a vendor script that was pure convenience, and an Elfsight app id
  that belonged to another client).
- **Headless is not proof of what a visitor sees.** Lazy widgets (Elfsight among them) may never
  finish in headless Chrome. Confirm in a normal browser before calling one broken.
- **`changedPages` takes FLAT `Page` objects** (`id`, `slug`, `title`, `nodes`, `rootNodeId`), not
  the `cells`-shaped rows `GET /admin/api/cms/pages` returns.
- **Class names are not in a page.** Nodes carry `classIds`; names live in `shell.styleRules`.
- **A placeholder node swapped for an Embed keeps its classes.** A reserved slot
  (`<div class="form-slot" data-ghl-form="...">`) ships as `div.form-slot.wz-embed`, so the
  placeholder's CSS lands on the real embed; on Mason Park (2026-09-18) a centring grid left the GHL
  iframe at 300px in a 578px card. Scope placeholder looks to `:not(.wz-embed)`, make the published
  slot full width, and **assert the width**.
- **Reserve a lead form's height.** A GHL frame arrives at 150px and grows to 800 to 900 a few
  seconds later; without a `min-height` the page drops under the reader and every scroll scene below
  is measured twice.
- **Never name the slot, or anything near it, `ad`.** `is-ad`, `ad-hero`, `ad-rail` and the like are
  on ad blockers' cosmetic lists and get hidden for every visitor with a blocker, while `file://` and
  every request-level gate stay clean. Ask over CDP (`CSS.getMatchedStylesForNode`).

## Files

- `set-origins.mjs`: read / set / clear the allowlist and `siteScripts` on one site (merges)
- `rollout-site-scripts.mjs`: `status` / `apply` / `publish` / `verify` a site-wide script across every instance
- `verify-embed-canvas.mjs`: the canvas gate (publishes nothing)
- `verify-embed-scripts.mjs`: the published-page gate for frames and scripts (publishes)
- `handoff/embed-block-guide.html`: the non-engineer guide

**Endpoints used**: `GET|PUT /admin/api/cms/plugins/:id/settings`, `GET|PUT /admin/api/cms/site-document`,
`GET /admin/api/cms/publish/status`, `POST /admin/api/cms/publish`.

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Scripts, gates and
this file are committed; `output/` and cached sessions are not (`**/output/.session*` is a live CMS
credential).
