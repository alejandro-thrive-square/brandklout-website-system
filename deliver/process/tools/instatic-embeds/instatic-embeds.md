# Workflow: 18 - Instatic Embeds

> [!IMPORTANT]
> **The plugin ids changed on 2026-09-10: `webzite.*` -> `brandklout.*`.** The author is
> Brandklout too. A rename is a MIGRATION, not an edit — the id keys the installed record,
> `settings_json`, `plugin_records` (which is `on delete cascade`, so an uninstall takes the
> rows with it), and the module id inside every page carrying an Embed block, which the host
> forces to be `<pluginId>.<name>`. Use
> [`deliver/process/tools/instatic-api-sync/migrate-plugin-ids.mjs`](../instatic-api-sync/migrate-plugin-ids.mjs):
> `export` -> `swap --zips <dir> --apply` -> `publish --apply` -> `verify` -> `uninstall --apply`.
> It exports first, imports into the new id, rewrites the embed nodes, then DISABLES the old
> plugins (rollback: they keep their rows until `uninstall`). All five live instances were
> migrated on 2026-09-10; anything installed from an older package will carry the old id.

## Client-Facing Overview
Third-party widgets — booking forms, review widgets, chat bubbles, CRM embeds — can be placed on an Instatic site by hand, from the editor, by whoever is editing the page. Paste the vendor's iframe or snippet, publish, done. No developer, no agent, no platform fork.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the plugin, its scripts or its gates must be documented here immediately, and mirrored into [PROCESS_INDEX.md](../../PROCESS_INDEX.md) and OFFER_ROUTING.md when routing or module behaviour changes.

## Operational Purpose

Instatic publishes every public page behind a strict Content-Security-Policy carrying `frame-src 'none'` and `script-src 'self' '<importmap-sha>'`, and ships **no module that emits an `<iframe>` or raw HTML** (`base.video` is YouTube-only). Out of the box that makes every third-party embed impossible — not awkward, impossible — and there is no setting, env var or admin field that changes it.

`brandklout.embed-origins` closes both halves through the public plugin API, with no fork and no patched image:

| Half | Entrypoint | What it does |
|---|---|---|
| The block | `entrypoints.modules` | an **Embed** module in the canvas library: paste a URL or the vendor's snippet |
| The policy | `entrypoints.server` | a `publish.html` filter that rewrites the page's CSP meta tag at publish time |

They are separate on purpose, and the platform enforces it: `moduleAdapter.ts` drops a plugin module's `cspSources`, so the block cannot widen CSP even if it wanted to.

## Installing it on a new client site

> [!IMPORTANT]
> **The plugin source moved on 2026-09-23.** `embed-origins/`, `pack-plugin.mjs`,
> `install-plugin.mjs` and the two offline suites now live in
> [`../instatic-plugins/`](../instatic-plugins/README.md), the one home for every `brandklout.*`
> plugin. Installing and upgrading plugins across sites is
> [Scenario 4](../../scenario-4-update-plugins/README.md). This folder keeps the Embed-block
> tooling: settings, site scripts, editor and canvas gates, vendor probes, the handoff guide.

```bash
# 1. The toolkit refuses to guess which site it is talking to. Run from the step folder in the client's scenario copy so
#    the generated worktree .env (INSTATIC_BASE_URL + login) is found; never hand-edit it.

node ../instatic-plugins/plugins.mjs test --plugin embed-origins      # 85 + 54 assertions, offline
node ../instatic-plugins/install-plugin.mjs embed-origins             # dry run: shows the grants
node ../instatic-plugins/install-plugin.mjs embed-origins --apply     # needs step-up auth

cd deliver/process/tools/instatic-embeds
node set-origins.mjs                        # show the allowlist

node verify-embed-editor.mjs --place        # is a person OFFERED the block?
node verify-embed-editor.mjs --check        # 11 assertions, publishes nothing
node verify-embed-editor.mjs --cleanup

node verify-embed-canvas.mjs --place        # does the CANVAS show the card?
node verify-embed-canvas.mjs --check        # 15 assertions, publishes nothing
node verify-embed-canvas.mjs --cleanup

node verify-embed-scripts.mjs --place       # does a pasted SCRIPT actually run?
node verify-embed-scripts.mjs --check
node verify-embed-scripts.mjs --cleanup
```

A client gets its own copy of this toolkit (in `deliver/brandklout/<client>/tools/`) when a scenario that lists it is started with `node scripts/scenario.mjs start`; `scenario.mjs update` refreshes that copy from main. Never edit the client copy to fix the toolkit: fix it here, then update the clients.

> [!WARNING]
> `verify-embed-module.mjs` and `verify-embed-scripts.mjs` PUBLISH. On Instatic a publish bakes **every** page, so any page whose draft has drifted from what is live ships with it. Audit one known page before and after (see §Gotchas). `verify-embed-editor.mjs` publishes nothing and is the safe one to run first.

## The two policy modes

`embedPolicy` in plugin settings, default **compatible**:

| Mode | What a page gets | Use it when |
|---|---|---|
| `compatible` | a page that CONTAINS an Embed block may load anything over `https` (script, frame, connect, style, font, img, media); pages without one are byte-for-byte untouched | the client will paste whatever their marketing stack hands them |
| `strict` | a page is allowed exactly the origins its markup contains, plus a `'sha256-'` hash per inline script | the embeds are known and few |

**Compatible mode drops script hashes deliberately.** A browser ignores `'unsafe-inline'` the moment any hash appears in `script-src`, so a mode whose job is "the pasted snippet works" cannot keep them; the host's own importmap then runs under `'unsafe-inline'` like everything else, and inline `onclick=` handlers work. `'unsafe-eval'` is granted because widget bundles use `new Function`.

Say the trade out loud at handover: on the pages carrying an embed, what stands between the site and a **maliciously injected** script is `default-src`. What stood between it and a **pasted** one was always the person pasting. That is the bargain Webflow makes, made deliberately, and it is per page rather than site-wide.

`strict` + `autoTrust: false` returns to "nothing is allowed unless an operator typed it", which is where this plugin started.

## Site scripts: one tag on every page

Since **plugin `1.6.0`** the `siteScripts` setting (one https URL per line) puts a script on **every** published page. The `publish.html` filter adds `<script src="…" async data-wz-site-script>` just before `</head>`, then grants that URL's host `script-src`, `connect-src`, `style-src` and `font-src`. That is the same set an auto-trusted script origin gets. It works in both policy modes, with `autoTrust` on or off, and on pages with or without an Embed block. It is the only way onto every page: `importHtml` strips a head `<script>`, and `script-src 'self'` refuses a runtime injection from the site bundle.

Since **plugin `1.7.0`** a line may end with `#consent=advertising` (or `analytics`, or both joined by `|`). That script is emitted as `<script type="text/plain" data-categories="…">` instead of `async`, which is how the cookie banner holds a tracker until the visitor accepts that category (see [termly-ghl-consent](../termly-ghl-consent/termly-ghl-consent.md)). The fragment never reaches the server, so it is a safe place to hang the tag; the host is still granted its four directives, and a line with no tag behaves exactly as before. An unrecognised category is refused outright rather than emitted — a typo in `data-categories` would hold the script for a category nobody can accept, which looks identical to the script being broken.

Since **plugin `1.8.0`** (2026-09-22, Dr. Nahlah) the line fragment takes `&`-joined options, and a line can be scoped to pages. `pages=<glob>[,<glob>]` puts it only on those pages; `except=<glob>[,<glob>]` puts it on every page but those. A glob is a page slug with `*` wildcards, matched against the `slug` the publish context passes (the home page is `index`; a data-row entry arrives with its **template's** slug). Example, two call-tracking pools, one per office: `…/number_pool.js#except=ads-landing-pages/tysons-*` and `…/number_pool.js#pages=ads-landing-pages/tysons-*`. With no slug, a `pages=` line is left off and an `except=` line stays on. An unknown option or a malformed glob refuses the whole line. **A site that reinstalls anything older than 1.8.0 loses the scoping and puts every pool on every page**; `install-plugin.mjs` and `plugins.mjs` refuse a downgrade for that reason. Known flaw: the glob escape writes `'\$&'` where `'\\$&'` was meant, so a `.` in a glob matches any character (harmless for today's slugs; fix it as 1.8.1 through Scenario 4).

**A site script's host grant covers only that host.** A tracker that loads from one host and calls another needs the second host in `connectOrigins`, and the gap shows **only on pages without an Embed block**, which keep the strict CSP. GoHighLevel's pool loads from `backend.leadconnectorhq.com`, asks for its number at `services.leadconnectorhq.com` and reports to `services.msgsndr.com`. On Dr. Nahlah that refused the swap on 79 of 97 URLs (2026-09-22e). Any site carrying the pool needs both hosts in `connectOrigins`.

**Live 2026-09-12: the Sienna accessibility widget on every instance.** URL: `https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js`. It needs all three jsdelivr grants: the script, a `fetch` of `dist/locales/`, and the OpenDyslexic font.

```bash
cd deliver/process/tools/instatic-embeds
node ../instatic-plugins/plugins.mjs pack --plugin embed-origins   # the package apply installs
node rollout-site-scripts.mjs status                      # plugin version, siteScripts, draft vs live
node rollout-site-scripts.mjs apply --url <script> --apply  # upgrade/install + merge the URL; publishes nothing
node rollout-site-scripts.mjs publish --apply             # REFUSES a site whose draft differs from live
node rollout-site-scripts.mjs verify --url <script>       # every published page: one tag, CSP allows it
# --only <section>[,<section>] narrows any of them
```

The sites are every `~/.webzite/.env` section with an `INSTATIC_BASE_URL`, so **a new instance is picked up by running `apply` then `publish` against it**, and `status` shows which instances are missing the script. Each site runs in its own child process, because `insta-api.mjs` fixes `BASE` at import. `set-origins.mjs --site-scripts <url>` sets the setting on one site, and it now merges, so setting one box never blanks the others.

## The canvas shows a card

Since **module `1.1.0` / plugin `1.4.0`**, `preview()` — the editor-only path — never emits the frame or the snippet. It returns a static description of the block: mode, destination host(s), what a snippet contains, the height rule, and "Appears when the page is published". `render()`, the publish path, is untouched.

Rendering the real thing on the canvas cost more than it bought, differently in each mode:

- a **URL-mode iframe does load** in the editor, because the admin CSP sets no `frame-src`. The vendor's widget booted inside the canvas — third-party requests, cookie banners and all — then sat at its *starting* height forever, since the auto-height runtime is a `render()` output and never ships to the canvas. A widget that publishes at 1800px showed as a 600px box with its own scrollbar;
- a **snippet is mounted with `dangerouslySetInnerHTML`**, so its `<script>` never runs and what appears is the vendor's *undressed* markup — the bare divs a bundle was supposed to fill — while any `<style>` or `<link>` in the same paste leaks OUT of the module and restyles the editor around it.

Neither was a preview of the published page, so neither was worth showing.

The card keeps the two things the live render did give: the block stays **selectable and stylable** (same root shape, machine-generated attributes only, so `injectClassIntoRootElement` still lands the author class on it), and the box is **sized to what will publish** — fixed height, aspect ratio, or the auto starting height as a `min-height` — so the page around it lays out honestly. It also says something the live render could not: for a snippet, **the hosts the paste reaches**, which are exactly the origins that must appear in this plugin's settings.

The card root carries `data-wz-embed-card="1"` alongside the usual `data-wz-embed="<fit>"`. `render()` never emits it, so a published page has none. Gates that probe `[data-wz-embed], .wz-embed-note` keep working.

`verify-embed-canvas.mjs` is the live gate for all of this, and it **publishes nothing** — the editor reads the draft, so the temp page never needs baking. It writes three CONFIGURED blocks straight into a draft (URL/auto, URL/ratio, and a snippet carrying a `<script>` *and* a `<style>`), opens the real editor under CDP and asserts 15 things across all three breakpoint canvases: every block rendered a card, **no `<iframe>` was created anywhere**, **no `<script>`/`<style>`/`<link>` from the snippet reached the editor document**, the snippet markup never rendered, **the editor made no network request to any vendor**, and each card names its host.

It deliberately skips the inserter, which is what makes it the reliable one — see the gotcha below.

**LIVE 2026-08-28 — 15/15 on both sites**, Dr. Nahlah (`encorercm.com`) and Mason Park (`mason-park.up.railway.app`), both then upgraded to plugin `1.4.0`.

## Why a plugin can do this when a module cannot

Verified against the v0.0.16 source and then against a live site:

1. **A plugin MODULE cannot lift CSP.** `src/core/plugins/moduleAdapter.ts` rebuilds the render output as `{ html, css, js }` and drops `cspSources`. A whitelist, not an oversight.
2. **`publish.html` is a filter over the whole published HTML string**, registered under `cms.hooks`. `publishedHtmlPipeline.ts` runs it LAST and returns the filter's string verbatim — no re-validation, no CSP re-derivation.
3. **A public page's CSP is only a `<meta http-equiv>` tag.** `securityHeaders.ts` sets a CSP *header* for `/admin` paths only, so there is nothing to contradict the meta tag.

## Permissions this asks for, and why

`../instatic-plugins/install-plugin.mjs` grants from the explicit `grants` list in `../instatic-plugins/plugins.json` and refuses any package asking for more, so a future version that quietly widens its request cannot be installed by re-running the script.

| Permission | Needed for |
|---|---|
| `cms.hooks` | the `publish.html` CSP filter |
| `modules.register` | the Embed block in the canvas library |
| `frontend.assets` | authority for module render `js` — used for ONE thing, the auto-height listener served same-origin from `/_instatic/module-js/`. It grants no third-party origin anything. |

## Three different things here are called "origin"

Worth naming, because mixing them up sends people to the wrong file:

| | What it is | Where it is set | What it gates |
|---|---|---|---|
| `PUBLIC_ORIGIN` | the site's canonical public origin(s) | env var on the **Instatic host** (Railway) | **the admin** — CSRF on every state-changing request. [`instatic-domain-origins`](../instatic-domain-origins/instatic-domain-origins.md) |
| `INSTATIC_BASE_URL` | which site this toolkit talks to | the `[<client>]` section of `~/.webzite/.env`, generated into the worktree `.env` | which admin **our scripts** hit |
| frame / script / connect origins | vendor hosts an embed may load | **this plugin's** settings, in the admin UI | the **published page's** CSP |

Changing one never affects the others. `INSTATIC_BASE_URL` must be an origin that passes the `PUBLIC_ORIGIN` gate, or every script here starts failing with 403s that read like permissions problems — which is why the platform host must stay in `PUBLIC_ORIGIN` even after a client domain is added. Both live sites were repaired on 2026-08-28; see [`instatic-domain-origins`](../instatic-domain-origins/instatic-domain-origins.md).

## Gotchas

- **A site script can duplicate a widget the site already runs.** On IFA, Sienna appeared next to a UserWay button the WordPress clone was injecting from its `site.js` registry. The page HTML shows neither, because both are added at runtime. Before rolling out a site-wide widget, grep each site's `src/scripts/site.js` shell asset or published `site-*.js` bundle for the same kind of vendor.
- **Check `draftMatchesPublished` before any fleet-wide publish.** `GET /admin/api/cms/publish/status` returns it, and `rollout-site-scripts.mjs publish` re-reads it right before publishing and skips a drifted site. On 2026-09-12 it held back Dr. Nahlah (unpublished edits on 38 pages) and Stone Med Spa (an 11th draft page that has never gone live).
- **A created directive must be deduped.** `widen()` used to build an absent directive as `default-src + origins` without deduping. A site script that auto-trust also found on the page came out as `connect-src 'self' https://x https://x`, and a second publish rewrote it, so the filter was no longer idempotent. Fixed in `1.6.0`.
- **A publish bakes EVERY page.** Unrelated drift ships with whatever you were publishing. On Dr. Nahlah this cost the home page its six review-card fallbacks — present in the published HTML, absent from the draft, gone the moment anything was published. Audit before and after:
  ```bash
  node ../../[client]/workflows/08-qa/output/audit-site.mjs --base https://client.com --only index
  git diff ../../[client]/workflows/08-qa/output/audit-out/
  ```
- **A created CSP directive must inherit from `default-src`.** An absent directive falls back to it, so writing `font-src https://vendor` on a page that had no `font-src` silently revoked the site's own webfonts. It surfaces as one violation per font file, which reads like a font problem. `widen()` seeds from `default-src` first; any new directive must do the same.
- **`escapeProps()` runs before `render()` on the publish path** and HTML-escapes every non-`url` string prop, and the plugin control vocabulary has no `richtext`/`svg` type — so a pasted snippet arrives as `&lt;iframe …&gt;`. The module decodes then escapes exactly once, which is idempotent and therefore also correct on the canvas path, where props arrive RAW.
- **The editor canvas mounts module HTML with `dangerouslySetInnerHTML`**, so `<script>` never runs there. Iframes do (the admin CSP sets no `frame-src`). This is why `preview()` shows a card and not the embed — see §The canvas shows a card.
- **`verify-embed-editor.mjs`'s picker click fails repeatably, and it is NOT a product fault.** On 2026-08-28 it failed the same four assertions on BOTH sites, twice each: pack fetched 200, "Embed is offered in the inserter" ok, then `inCanvas: 0`, `sidebarTestids: []` — nothing was ever selected. `verify-embed-canvas.mjs` passed 15/15 on the same sites minutes later with configured blocks written into the draft, which proves the module, `preview()` and the canvas render are all fine and isolates the failure to the synthetic click on the picker item. **Do not debug the plugin from a red `verify-embed-editor.mjs`** — run the canvas gate first; if that is green the block itself works. A real trusted click (Chrome MCP `computer`) is the way to check the inserter by hand.
- **A gate whose assertions are all negatives passes vacuously on an empty page.** `verify-embed-canvas.mjs` asserts "no iframe", "no injected script", "no vendor request" — every one of which an editor that never loaded satisfies perfectly. The first Mason Park run reported four greens over zero rendered canvases. Every such assertion is now gated behind `rendered` (3 canvases × 3 cards). Write the positive first, then hang the negatives off it.
- **60s is not enough for a cold Railway dyno.** That first Mason Park run failed only because the editor-ready ceiling was 60s; at 120s the identical run passed 15/15. A short ceiling reports a working site as a dead editor.
- **The deployed admin has no `toolbar-add-module-btn`.** That is in the v0.0.16 zip only; a gate written from the source waits for a button that never appears. The real doors are `canvas-notch-add-btn` and `dom-tree-insert-module`. Dump `[data-testid]` off the running page rather than trusting the zip for admin DOM.
- **A widget that loads and renders nothing is usually not CSP.** Prove it away from the client's site before blaming the platform: `probe-elfsight-bare.mjs` serves the same snippet from localhost with no CSP at all. On Dr. Nahlah that exonerated the platform twice — once for a vendor script that was pure convenience (`probe-widget-postmessage.mjs`), once for a widget whose app id belonged to another client.
- **Headless is not proof of what a visitor sees.** Lazy-loading widgets (Elfsight among them) may never finish in headless Chrome. Confirm in a normal browser before calling a widget broken.
- **`changedPages` takes FLAT `Page` objects** (`id`, `slug`, `title`, `nodes`, `rootNodeId`), not the `cells`-shaped rows `GET /admin/api/cms/pages` returns.
- **Class names are not in a page.** Nodes carry `classIds`; names live in `shell.styleRules`. Grepping page JSON for a class name finds nothing whether the element is there or not.

## Security posture

- With `strict` + empty settings the filter returns the page **byte-for-byte unchanged** — installing the plugin alone changes nothing.
- Every widening is per page and recomputed at each publish, so removing an embed and publishing returns that page to the locked-down policy. Nothing accumulates.
- Origins typed into the settings boxes are validated against `ORIGIN_RE`, not escaped, so a pasted `https://x.com; default-src *` is rejected rather than sanitised.
- `'none'` is replaced, never appended to — `frame-src 'none' https://x` is invalid CSP and would block everything.
- Plugin server code and module packs run in a QuickJS-WASM sandbox, scanned at upload for forbidden literals.

## Testing

```bash
node ../instatic-plugins/test-embed-origins.mjs     # 85 — CSP filter, both modes, hashes, inheritance, site scripts
node ../instatic-plugins/test-embed-module.mjs      # 54 — the Embed block, publisher and canvas paths
```

Both run with no host, no network and no site. What they cannot prove is that the host registers the module and calls it — that is what `verify-embed-editor.mjs` (is the block offered), `verify-embed-canvas.mjs` (does the canvas render the card) and `verify-embed-scripts.mjs` (the published path) are for. Only the last of those publishes.

## Technical Setup

- **Executor status**: Working. The executor is the Node toolchain in this folder; `instatic-embeds.py` is a thin orchestrator over the documented sequence, in the same spirit as `webflow-build`.
- **Credentials**: repo-root `.env` — `INSTATIC_BASE_URL`, `INSTATIC_EMAIL`, `INSTATIC_PASSWORD`. `lib/insta-api.mjs` walks up to find it. There is deliberately no default site. That `.env` is **generated** from `~/.webzite/.env` by `scripts/env-sync.mjs`: `INSTATIC_EMAIL` comes from `[shared]`, and `INSTATIC_BASE_URL` + the per-instance `INSTATIC_PASSWORD` from the client's own section. Add a missing value to the master, never to the worktree file — see [SYSTEM_RULES.md §4.2.2](../../../../SYSTEM_RULES.md).
- **A plugin setting's `description` is capped at 500 characters.** Over it,
  `inspect-package` answers `400 Invalid plugin manifest: Expected union value` — a zod union
  error that names neither the field nor the limit. Bisect by shortening the description; the
  rest of the manifest is fine. Reformatting `plugin.json` (e.g. re-dumping it from a JSON
  library) is harmless on its own.
- **Endpoints**: `POST /admin/api/cms/plugins/inspect-package`, `POST /admin/api/cms/plugins/package`, `GET|PUT /admin/api/cms/plugins/:id/settings`, `GET|PUT /admin/api/cms/site-document`, `POST /admin/api/cms/publish`.
- **Origin**: promoted from `deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/` (built and proven there on `encorercm.com`, plugin v1.3.0). The client folder's numbering (`15`, `16`) predates this promotion and does not match canonical module numbers.

## Output Artifacts
- `../instatic-plugins/embed-origins/` — the plugin (moved 2026-09-23): `plugin.json`, `server/index.js` (CSP filter), `modules/index.js` (the Embed block)
- `lib/insta-api.mjs` — headless admin REST client, no default site
- `../instatic-plugins/pack-plugin.mjs`, `../instatic-plugins/install-plugin.mjs` — deterministic zip builder and the per-id grant installer (moved 2026-09-23)
- `set-origins.mjs` — read / set / clear the allowlist and `siteScripts` on one site (merges; targets `brandklout.embed-origins`)
- `rollout-site-scripts.mjs` — `status` / `apply` / `publish` / `verify` a site-wide script across every instance
- `../instatic-plugins/test-embed-origins.mjs`, `test-embed-module.mjs` — offline suites (moved 2026-09-23)
- `verify-embed-editor.mjs` — is the block offered to a person? (publishes nothing)
- `verify-embed-canvas.mjs` — does the CANVAS show the card and not the embed? 15 assertions against the real editor, configured blocks written into a draft, inserter skipped (publishes nothing)
- `verify-embed-module.mjs`, `verify-embed-scripts.mjs` — published-page gates (these publish)
- `probe-widget-postmessage.mjs`, `probe-elfsight-bare.mjs` — answer "is this the vendor's fault?" away from the client's site
- `handoff/embed-block-guide.html` — the non-engineer guide; give a marketer this and a developer the directive

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Plugin source, scripts, gates and `.md` are committed; `output/` build output and cached sessions are not (`**/output/.session` is ignored repo-wide — it is a live CMS credential).
