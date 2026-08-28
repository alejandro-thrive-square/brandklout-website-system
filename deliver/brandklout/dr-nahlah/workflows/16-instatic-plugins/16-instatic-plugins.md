# Workflow: 16 - Instatic Plugins

> [!IMPORTANT]
> **Promoted to the canonical process.** The reusable copy of this toolkit now lives at
> [`deliver/process/18-instatic-embeds/`](../../../../process/18-instatic-embeds/18-instatic-embeds.md)
> and is where a NEW client build should start. This folder is the versioned instance it was
> built in (`DELIVER_SYSTEM_RULES.md` §3.2): it keeps the Dr. Nahlah gates, evidence and
> settings. Fixes made here must be promoted there deliberately — the copies do not cascade.
> Note the numbering differs: this client folder used `15`/`16` locally, which collide with
> the canonical `15-improvement-intake-audit` and `16-vercel-deployment`.

## Client-Facing Overview
Capabilities the stock platform does not offer are added as **installable plugins**, never as a modified platform build. Four are in service:

- **Embed Origins** — third-party widgets (booking forms, review widgets, CRM embeds) can be switched on per site. A developer places them **by hand** from the editor: insert the **Embed** block, paste the URL or the vendor's snippet, publish.
- **Link Editor** — the link address on any button or link can be edited, including internal pages, on-page anchors and phone numbers, not only full `https://` addresses.
- **Open Graph** — a link to any page unfurls with a headline, a description and a picture wherever it is pasted. Also gives every page its own meta description and a canonical link, neither of which the platform emits. [README](./open-graph/README.md)
- **AEO Schema** — one JSON-LD `@graph` on every page (organisation, page, breadcrumb, article), managed from the admin and changeable across the whole site in one API call. [README](./aeo-schema/README.md)

> [!IMPORTANT]
> **The publisher's `<head>` is the smallest surface on this platform, and three of
> these four plugins exist because of it.** `buildDocumentMetaTags`
> (`src/core/publisher/render.ts`) emits a title, ONE site-wide description and a
> favicon. Not a canonical link, not an `og:` tag, not a line of structured data,
> and — the one that surprises people — **not the per-page `seoDescription` the
> admin has a field for and 73 of this site's 80 pages had filled in.** Before the
> Open Graph plugin, every published page carried the same sentence. Check what the
> publisher actually emits before assuming a field that exists in the admin reaches
> the page.

> [!IMPORTANT]
> **Plugins are the standing answer here; patching the image is not.** A patch to
> `corebunch/instatic` has to be rebuilt and re-applied on every upstream release. That
> maintenance debt is the reason the Link Editor exists as a plugin even though a working
> three-file patch was already written ([workflow 17](../17-instatic-platform-patch/17-instatic-platform-patch.md), kept as
> reference and **not** deployed). Reach for a plugin first; treat a platform patch as a last
> resort that needs a deliberate decision.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the scripts or technical logic of this workflow must be documented here immediately.

## Operational Purpose

Instatic publishes every public page behind a strict Content-Security-Policy carrying `frame-src 'none'` and `script-src 'self' '<importmap-sha>'`. That is a good default and it makes **every third-party embed impossible** — a HighLevel form, a LeadConnector review widget, any booking iframe is refused by the browser no matter how the markup reaches the page.

There is no configuration escape in the host: the server reads no CSP env var, there is no site setting, and `frame-src` is only ever widened by a module's `cspSources` contribution — of which `base.video` (YouTube) is the only one shipped.

`webzite.embed-origins` closes that gap **through the public plugin API**, with no fork of the platform and no patched image.

## Why a plugin can do this when a module cannot

Three facts, each verified against the v0.0.16 source and then against the live site:

1. **A plugin MODULE cannot lift CSP.** `src/core/plugins/moduleAdapter.ts` rebuilds a plugin module's render output as `{ html, css, js }` and **drops `cspSources` on the floor**. That is a whitelist, not an oversight, so no amount of module cleverness helps.
2. **`publish.html` is a filter over the entire published HTML string.** Registered with `api.cms.hooks.filter('publish.html', fn)` under the `cms.hooks` permission. `server/publish/publishedHtmlPipeline.ts` runs it **LAST** — after `injectFrontendAssets` and `injectModuleScripts` have done their own CSP rewriting — and returns the filter's string **verbatim**, with no re-validation and no CSP re-derivation.
3. **A public page's CSP is ONLY a `<meta http-equiv>` tag.** `server/securityHeaders.ts` sets a `content-security-policy` HEADER for `/admin` paths only. Confirmed live: `curl -I https://encorercm.com/veneers` returns **no CSP header at all**. So there is no header to contradict the meta tag, and rewriting the meta tag IS the page's final policy.

**This overturns the earlier "third-party embeds are impossible on Instatic" conclusion.** That verdict was right about modules and wrong about the platform: it stopped one layer short of the `publish.html` filter.

## What is reachable, and what still is not

| Directive | Reachable by a plugin? | How |
|---|---|---|
| `frame-src` | **Yes** | derived per page from the iframes it contains, or typed in settings |
| `script-src` | **Yes**, origins AND `'sha256-'` hashes | derived per page from the scripts it contains, or typed in settings. (`frontend.assets` alone only ever grants `'self'`, because plugin scripts are served same-origin from `/uploads/plugins/...`) |
| `connect-src` / `style-src` / `font-src` | Yes | granted alongside each trusted script origin, so a widget can call, style and font itself |
| `img-src` / `media-src` | Yes | already `'self' data: https:` on this site; otherwise media storage adapter `cspOrigins`, or this plugin |

## Handing the capability over

`handoff/embed-block-guide.html` is the non-engineer version of the section below: what to click, every field on the block, what each thing you might see actually means, and the one decision that is not an editor's to make. Published at <https://claude.ai/code/artifact/45d0a779-2eb6-4508-a3c5-56d9f6bd8f07>. Give a marketer that; give a developer this file.

## The manual workflow (no agent required)

The plugin ships two halves, and they are separate on purpose:

| Half | What it is | Who touches it |
|---|---|---|
| `entrypoints.modules` | the **Embed** block in the canvas module library | anyone editing a page |
| `entrypoints.server` | the origin allowlist that widens the published CSP | an operator, deliberately, in plugin settings |

A developer maintaining the site does this and nothing else:

1. **Insert** → module library → **Embed** (category *Media*).
2. In the Properties Panel pick **Source**:
   - **URL** — paste the vendor's iframe URL. Height *auto* (the widget reports its own), *fixed*, or an *aspect ratio*. Title, lazy-load, fullscreen and an `allow` attribute are there too.
   - **HTML snippet** — paste the vendor's markup verbatim, for anything the URL form cannot express.
3. If the origin is new: **Plugins → Embed Origins → settings**, add it to *Allowed iframe origins*, save.
4. **Publish**. The CSP filter runs at publish time, so a new origin reaches the site on the next publish and not before.

### Why the block cannot grant its own origin

`moduleAdapter.ts` drops a plugin module's `cspSources`, so a module has no way to widen CSP even if it wanted to — the allowlist has to be typed by a person. That platform limitation lines up with how this should work anyway: placing an embed is content, trusting an origin is a security decision, and the second one should never be a side effect of the first.

### Two traps this module had to design around

**`escapeProps()` runs before `render()` on the publish path.** It dispatches on the declared control type (`src/core/publisher/escapeProps.ts`): `url`/`image`/`media` props are scheme-checked and passed through raw, and **everything else is HTML-escaped** — and the plugin control vocabulary has no `richtext` or `svg` type to escape into. A pasted snippet therefore arrives at `render()` as `&lt;iframe …&gt;` and would publish as visible literal text. The module decodes entities and re-escapes exactly once (`norm()`), which is idempotent and so gives the same output on both paths. The **canvas** calls `preview() ?? render()` with RAW props, so the module can never assume it has been escaped, or that it has not.

**The editor canvas mounts module HTML with `dangerouslySetInnerHTML`,** which never executes `<script>`. Frames themselves DO render in the canvas: the admin CSP (`server/securityHeaders.ts`) sets only `frame-ancestors`, `base-uri` and `object-src`, never `frame-src`. Between them those two facts are why the canvas now gets a card instead of the embed — see below.

### The canvas shows a card, not the embed

Since **module `1.1.0` / plugin `1.4.0`**, `preview()` — the editor-only path — never emits the frame or the snippet. It returns a static description of the block: mode, destination host(s), what a snippet contains, the height rule, and "Appears when the page is published". `render()`, the publish path, is byte-for-byte unchanged.

The live render was wrong on the canvas in both modes, for opposite reasons:

- a **URL-mode iframe loads** in the editor (no `frame-src` in the admin CSP), so the vendor's widget booted inside the canvas — third-party requests, cookie banners and all — and then sat at its *starting* height forever, because the auto-height runtime is a `render()` output and never ships to the canvas. A widget that publishes at 1800px showed as a 600px box with its own scrollbar;
- a **snippet** is mounted with `dangerouslySetInnerHTML`, so its `<script>` never runs and what appears is the vendor's *undressed* markup — the bare divs a bundle was supposed to fill — while any `<style>` or `<link>` in the same paste leaks OUT of the module and restyles the editor around it.

The card keeps what the live render actually gave: the block stays selectable and stylable (same root shape, machine-generated attributes only, so `injectClassIntoRootElement` still lands the author class on it), and the box is sized to what will publish — fixed height, aspect ratio, or the auto starting height as a `min-height`. And it says one thing the live render could not: for a snippet, **the hosts the paste reaches**, which are exactly the origins that must go in this plugin's settings.

Root carries `data-wz-embed-card="1"` next to the usual `data-wz-embed="<fit>"`. `render()` never emits it, so no published page has one. The `[data-wz-embed], .wz-embed-note` probe in `verify-embed-editor.mjs` keeps working unchanged.

### What a raw snippet can and cannot do

Snippet mode emits the markup verbatim, and the published CSP decides what runs: `script-src 'self' '<importmap-sha>'` with no `'unsafe-inline'`, so a pasted inline `<script>` and any `onclick=` handler are refused by the browser. A vendor's `<script src>` runs only if an operator has put that origin in *Allowed script origins*. Anyone who can edit a page here can already ship a site-wide code asset, so this widens no authority that did not exist.

## Execution Steps

```bash
node pack-plugin.mjs embed-origins .tmp/embed-origins.zip   # build the package
node install-plugin.mjs .tmp/embed-origins.zip              # dry run: shows requested permissions
node install-plugin.mjs .tmp/embed-origins.zip --apply      # install (needs step-up auth)

node set-origins.mjs                                        # show current allowlist
node set-origins.mjs --frame https://reputationhub.site --script https://reputationhub.site
node set-origins.mjs --clear                                # back to locked-down

node ../15-instatic-api-sync/insta-api.mjs publish          # settings only affect pages published AFTER
node ../15-instatic-api-sync/test-embed.mjs veneers         # gate: does the widget actually load?
```

**Settings changes do not touch already-published pages.** The filter runs at publish time, so a widened allowlist reaches the site only on the next publish. The same is true in reverse: `--clear` needs a publish to take effect.

## Gate: `test-embed.mjs`

Lives in `15-instatic-api-sync/`. It injects the real LeadConnector snippet into a live page under CDP and reports what the browser actually did. Proven results on `encorercm.com/veneers`:

| allowlist | script | iframe |
|---|---|---|
| none (default) | `BLOCKED` | element in DOM, **load refused** — `Framing ... violates frame-src` |
| `--frame` only | `BLOCKED` | **loads**, cross-origin document |
| `--frame --script` | `LOADED` | **loads**, and **zero CSP violation events** |

## LIVE on Dr. Nahlah, 2026-08-22 — on `frame-src` alone

The Google review widget is now the real vendor widget on `encorercm.com`, and **`script-src` was never granted**.

That is worth stating plainly because the obvious reading of the table above is that a working widget costs both directives. It does not. The vendor's parent script has exactly one job — resize the iframe from the `lc.setHeight` message the frame posts — and **the frame posts that message whether or not the script is there**:

```bash
node probe-widget-postmessage.mjs
#   messages received  2
#     {"id":"iframe-ready"}
#     ["lc.setHeight",{"height":1968,"widgetId":"6a73…"}]
#   RESULT  the widget self-reports … `frame-src` alone is sufficient
```

The probe serves a bare page from localhost with no CSP and no vendor script, so it answers the question off the client's site entirely. `site.js` now applies that height itself and **does not inject the vendor script** (`04-design/.tmp/site-src/sections/ch-proof.js`).

**Always run this probe before granting a script origin.** The difference is not cosmetic: `script-src https://vendor` lets that origin run arbitrary JavaScript against the document, its storage and its cookies. A cross-origin iframe can do none of that. Many widgets ship a parent script that is pure convenience, and a five-minute probe is what tells you which kind you have.

The trap that made this non-obvious: `site.js` wired `sc.onerror = reject`, so with `frame-src` widened and `script-src` not, the blocked script tore the *working* widget back down. The low-risk half of the allowlist looked useless when it was only the client code that insisted on the script.

Gates on the published site, all green at 1440 **and** 390:

```bash
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/                     # upgrades
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/ --viewport=390,844  # upgrades, reflows
node ../04-design/.tmp/probe-rv-live.mjs https://encorercm.com/ --block             # falls back to cards
```

The two viewports report different heights (884 px and 2156 px), which is the postMessage sizing doing its job rather than a fixed number baked in.

## v1.2.0 — a pasted script RUNS, without anyone typing an origin

The block shipped in v1.1.0 placed iframes properly and emitted a pasted snippet verbatim, and then the published page's CSP refused half of what people paste: an inline `<script>` has no `'unsafe-inline'` to run under, and an external one needed an operator to add its origin under settings first. "Paste the vendor's snippet and publish" was true on Webflow and not here.

v1.2.0 derives the policy from the page instead of asking for it in advance. At publish time the filter reads the finished HTML and grants that page exactly what it turned out to contain:

| Found in the published page | Granted, on that page only |
|---|---|
| `<iframe src>` on another origin | `frame-src <origin>` |
| `<script src>` on another origin | `script-src <origin>` |
| an inline `<script>` | `script-src 'sha256-<hash of its bytes>'` |
| (for each trusted SCRIPT origin) | `connect-src`, `style-src`, `font-src` |

`autoTrust` (default ON) is the switch. Off, the plugin behaves exactly as v1.1.0 did.

**Inline scripts are trusted by HASH, never by `'unsafe-inline'`.** The filter carries a pure-JS SHA-256 (no `crypto` in the QuickJS sandbox) whose output is checked against `node:crypto` in the tests. A hash covers the exact bytes an editor pasted; `'unsafe-inline'` would cover every inline script on every page forever, including one that arrives by a route nobody intended.

**A script origin gets `connect-src`, `style-src` and `font-src` too.** A widget's script that can load but cannot call its API, style itself or load its font is the shape of "it loaded and then did nothing", which is indistinguishable from broken. A FRAME origin gets none of them: the framed document has its own policy and cannot reach into ours.

**The trust model is the one the author already exercised** — an editor pasted this, on this page. It is per-page, so a widget on `/contact` widens nothing on `/veneers`, and it is narrower than the platform it imitates: Webflow serves no CSP at all.

**What does not work IN STRICT MODE:** an inline event handler (`onclick="…"`) written on a tag inside a pasted snippet. Hashing a script block does not cover a handler attribute — that needs `'unsafe-hashes'`. Workaround under strict: move the handler into the snippet's own `<script>`. Compatible mode (v1.3.0, the default) grants `'unsafe-inline'` with no hashes present, so handlers run there.

### Gate: `verify-embed-scripts.mjs`

```bash
node verify-embed-scripts.mjs --place                        # temp page + publish
node verify-embed-scripts.mjs --check                        # 12/12
node verify-embed-scripts.mjs --check --viewport=390,844     # 12/12
node verify-embed-scripts.mjs --cleanup                      # deleted, 404 confirmed
```

It pastes what a marketer would paste — the vendor's iframe, the vendor's script and an inline script — and asserts EXECUTION, because a script CSP refused is still in the DOM and still looks fine. The inline half writes into a div and sets a global. The external half is `reputationhub.site/reputation/assets/review-widget.js`, whose behaviour is observable from outside: on `lc.setHeight` it sets the iframe's `height` ATTRIBUTE and a `transition` style, and nothing else on the page does that.

**This gate earned its keep immediately.** Creating `font-src` for the vendor silently REVOKED the site's own webfonts: an absent directive falls back to `default-src 'self'`, so writing `font-src https://vendor` replaced that fallback with a list the site's own fonts were not on. The browser reports it per font file as a `font-src` violation, which reads like a font problem. `widen()` now seeds a created directive from `default-src` first, and both the unit tests and this gate check it.

## v1.3.0 — compatible mode, so ANY integration works on paste

v1.2.0 derived the policy from the page's markup. That covers what the markup says and cannot cover what a vendor's JavaScript does once it runs — which is where real integrations live. The live proof arrived within a day: an Elfsight reviews widget pasted onto the home page loaded its script from `elfsightcdn.com` and then called `core.service.elfsight.com`, an address that appears nowhere in the page. The call was refused, the widget rendered at 0px, and the only evidence was one line in a console nobody reads.

There is no way to predict those hosts. So `embedPolicy: compatible` (the default) stops trying:

> **A page that CONTAINS an Embed block may load anything over https.** A page with no Embed block on it is left byte-for-byte alone.

| Directive | On a page with an embed |
|---|---|
| `script-src` | `'self' https: 'unsafe-inline' 'unsafe-eval'` |
| `frame-src` | `'self' https:` |
| `connect-src` | `'self' https: wss:` |
| `style-src` | `'self' https: 'unsafe-inline'` |
| `font-src` | `'self' https: data:` |
| `img-src` / `media-src` | `'self' https: data: blob:` |
| `default-src` | untouched |

**The hashes are dropped on purpose, and this is the part to understand.** A browser that sees ANY hash in `script-src` ignores `'unsafe-inline'` entirely. A mode whose job is "a pasted snippet works" therefore cannot keep them: the host's importmap runs under `'unsafe-inline'` like everything else, and inline `onclick=` handlers — which strict mode can never run — start working. `'unsafe-eval'` is granted for the same reason: enough widget bundles use `new Function` that omitting it reintroduces exactly the silent half-failure this mode exists to end.

**What is kept back:** it is per PAGE, so a site whose embeds live on two pages has 33 pages still under the original policy; and `default-src` is untouched, so anything not named above still falls back to `'self'`.

`embedPolicy: strict` returns to v1.2.0 (derive from the page, hashes for inline scripts), and `autoTrust: false` under it returns to v1.1.0 (only what an operator typed).

### Choosing between them

Strict is the better policy and compatible is the one that matches what agencies actually do. Pick strict for a site whose embeds are known and few — one review widget, one booking form — and add origins as they come up. Pick compatible for a site where a client will paste whatever their marketing stack hands them; that was the explicit ask here, in the client's words: *"I just want to have the ability to embed the iframe without any problem or blocking."*

Say the trade out loud when handing it over: on the pages that carry an embed, the site's protection against a *maliciously injected* script is `default-src` and nothing more. The protection against a *pasted* one was always the person pasting.

## Gotchas

- **`Compress-Archive` writes BACKSLASH entry names on Windows.** The host looks up `server/index.js` by its manifest path, so a backslashed entry installs a plugin whose entrypoint can never be found — and it surfaces later as a plugin parked in `error`, not as a bad zip. `pack-plugin.mjs` writes the zip by hand for this reason.
- **Plugin server code runs in a QuickJS-WASM sandbox**, scanned at upload for forbidden literals (the `node:` and `bun:` import prefixes, `require(`, `process.binding`, `globalThis.process.env`). A string-rewriting filter is unaffected, but nothing here can reach the filesystem, environment or network.
- **Install requires step-up auth**, and step-up **rotates the session cookie**. `requestForm` in `insta-api.mjs` carries the rotated cookie; a hand-rolled fetch will 401 on the retry.
- **`GET .../settings` returns `{ schema: [...], settings: {...} }`** — the values are an OBJECT keyed by setting id, not the schema array. Iterating `settings` as an array throws `object is not iterable`.
- **Origins are validated, not escaped.** A pasted `https://x.com; default-src *` is *rejected* by `ORIGIN_RE`, not sanitised, so a bad line can never inject a directive. Covered by `test-embed-origins.mjs`.
- **`'none'` is replaced, never appended to.** `frame-src 'none' https://x` is invalid CSP and would block everything; the plugin drops `'none'` when it adds a real source, matching the host's own `addCspSources`.
- **Adding a `script-src` origin lets that origin run arbitrary JavaScript on the site.** It is a real security decision, not a formality — `frame-src` alone is the low-risk half, because a cross-origin iframe cannot touch the parent document. Grant the script origin only when the widget genuinely needs it, and prove that it does with `probe-widget-postmessage.mjs` first: on Dr. Nahlah the answer was no.
- **`Network.setBlockedURLs` cannot block a cross-origin iframe.** It is scoped to the CDP session it is sent on, and the widget frame is out-of-process with its own target, so a "blocked" run in `probe-rv-live.mjs` was quietly loading the widget and passing for the wrong reason. Block at the browser instead: `--host-resolver-rules=MAP vendor.example 127.0.0.1:1`. The old form only ever worked because the thing being blocked was a script the MAIN frame requested.

### Gotchas from building the Embed block

- **A publish bakes EVERY page, so any draft that has drifted from what is live ships with it.** Publishing to verify the Embed block republished all 35 pages, and the home page lost its six `.rv-card` fallback — present in the published HTML, absent from the draft. Nothing about the plugin caused it; the publish only revealed it. `15-instatic-api-sync/restore-review-wall.mjs` put it back, and the home audit is byte-identical to its committed baseline again (`words: 1741`). **Before publishing this site for any reason, check the pages you are not touching**, and re-run the audit against the committed `08-qa/.tmp/audit-out/` records afterwards.
- **The unnamed script that fails on every page is Cloudflare's.** The 73-URL audit reports `netFailed: [" Script"]` site-wide and it had never been identified. Driving a page with a `securitypolicyviolation` listener names it: `script-src-elem https://static.cloudflareinsights.com/beacon.min.js/…`. The CDN injects its analytics beacon into every response and the page CSP refuses it. Pre-existing, unrelated to embeds, and harmless — but a gate that asserts "zero CSP violations" on this site will fail on someone else's beacon, so assert on the directives you care about.
- **`changedPages` takes FLAT `Page` objects** (`src/core/page-tree/page.ts`: `id`, `slug`, `title`, `nodes`, `rootNodeId` at the top level), NOT the CMS row shape with `cells` that `GET /admin/api/cms/pages` returns. Send the row shape and the validator rejects `site.pages[0].slug: Expected string` — a path the payload appears to contain — one field per round trip.
### Gotchas from gating the editor UI

- **The deployed admin does not have `toolbar-add-module-btn`.** `ModulePickerDropdown.tsx` in the v0.0.16 source renders it, and a gate written from the zip waits for a button that never appears and reports "the editor never loaded" on a fully loaded editor. The live inserter opens from the canvas notch (`canvas-notch-add-btn`) or from *Insert module* in the Layers panel (`dom-tree-insert-module`). **Read the running DOM, not the source tree** — dump `[data-testid]` off the live page and pick from that.
- **A freshly inserted Embed renders `.wz-embed-note`, not `[data-wz-embed]`.** It has no URL and no snippet yet, so `preview()` returns the placeholder — which is the correct render, and its instruction copy is what the person actually reads. A gate that looks only for the frame wrapper fails against a working product.
- **The canvas iframe body carries `[data-plugin-canvas-module]`, not `[data-node-id]`.** Filtering canvases on `[data-node-id]` skips all three breakpoint frames silently and reports zero blocks placed.
- **The notch button mounts before the editor has hydrated.** An insert fired into that window lands on the canvas but never *selects*, so the Properties Panel never opens and the gate reads a working block as a broken one. Wait for `dom-panel-ready`, then settle, before clicking — and poll for `property-control-source` rather than sleeping a fixed 3.5s, which caught the canvases on one run and neither on the next.
- **Backticks inside a JS comment inside a CDP template literal terminate the literal.** `SyntaxError: missing ) after argument list` at the `Runtime.evaluate` call, pointing at a line that looks fine. Keep in-template comments backtick-free.

- **Class names are not in the page.** Nodes carry `classIds`; the names live in `shell.styleRules`. Grepping a page's JSON for `rv-card` finds nothing whether or not the cards are there, which is exactly how a "the draft never had them" conclusion gets reached. Resolve ids through the shell before concluding anything.

## Security posture

- With empty settings the filter returns the page **byte-for-byte unchanged** — installing the plugin alone changes nothing.
- The plugin holds three permissions as of v1.1.0: `cms.hooks` (the CSP filter), `modules.register` (the Embed block) and `frontend.assets` (authority for the module's auto-height runtime, served same-origin from `/_instatic/module-js/webzite.embed-origins.embed.js` — it grants no third-party origin anything). `install-plugin.mjs` grants from an explicit `GRANT` list and **refuses** any package asking for more, so a future version that quietly widens its request cannot be installed by re-running the script.
- The Embed block **cannot** widen CSP: `moduleAdapter.ts` drops plugin `cspSources`, so every origin is still typed by a person into settings.
- Every widening is per-site, operator-typed, and reversible with `--clear` plus a publish.

## Testing

```bash
node test-embed-origins.mjs     # 11 assertions on the CSP filter — no network, no platform
node test-embed-module.mjs      # 54 assertions on the Embed block — no network, no platform

node verify-embed-module.mjs --place    # the PUBLISHED page: render, runtime, CSP
node verify-embed-module.mjs --check
node verify-embed-module.mjs --cleanup

node verify-embed-editor.mjs --place    # the ADMIN EDITOR: can a person find and place it?
node verify-embed-editor.mjs --check
node verify-embed-editor.mjs --cleanup
```

**The two `verify-*` gates cover different code paths, and for a long time only one of them was gated.** `verify-embed-module.mjs` writes nodes straight into the site document over the API and drives the published page, so it proves the publish path — `moduleAdapter` plus the QuickJS sandbox, server side. It cannot prove the thing the handoff actually promises: that a developer or a marketer is *offered* the block at all. That is `editorPluginLoader.ts`, running in the BROWSER, dynamically importing `/uploads/plugins/<id>/<version>/modules/index.js` and registering what it default-exports into the inserter.

**That editor path fails silently by design.** `editorPluginLoader` pushes a `failed` entry and moves on, so a module pack that 404s, that is not valid ESM in a browser, or whose `modules.register` grant was dropped, leaves a plugin card still reading `active` and an inserter with no Embed in it — while the published page keeps working and tells you nothing. `verify-embed-editor.mjs --check` drives the real admin under CDP and asserts 11 things, from "the browser fetched the module pack and got 200" through "Embed is offered in the inserter" to "the Properties Panel exposes every control the block declares". **It publishes nothing** — the editor reads the draft, so the temp page never needs to be baked, which keeps the whole gate off the publish path that cost the home page its review wall.

`test-embed-module.mjs` writes every case that matters TWICE — once with raw props (the canvas) and once with props escaped the way `escapeProps()` escapes them (the publisher) — and asserts the two agree. It also covers the scheme guard (`javascript:`, `data:`, control-character smuggling), single-escaping of text props, the snippet round trip, the three height modes, and that an unconfigured block publishes a comment rather than an empty box.

`test-embed-origins.mjs` covers passthrough, `'none'` replacement, preservation of every other directive, importmap-sha survival, dedupe, trailing-slash stripping, directive-injection rejection, absent-directive creation, idempotence, body integrity, and the no-meta-tag case.

---

# Plugin 2: Link Editor (`webzite.link-editor` v1.0.0)

Full detail in [`link-editor/README.md`](./link-editor/README.md). The short version, and
the part that generalises beyond this one plugin:

## The problem

The platform's own "Link URL" field cannot express most of this site's links. `UrlControl.tsx`
commits only on a valid value — `if (valid) onChange(propKey, v)` — and `isValidUrl()` accepts
absolute `https:` / `http:` / `mailto:` **only**.

The input is controlled from the store and the store is written only on a valid value, so every
keystroke that leaves the value invalid is discarded and the field re-renders from the unchanged
value. Backspacing `#invitation` passes through `#invitatio`, `#invitati`, … — each schemeless,
each rejected, each snapped back. The empty string that *would* be accepted is unreachable, so
the field can be neither edited **nor cleared**. It reads as broken, not restricted. That is what
the client reported: **2,362 of 2,510** link/button nodes on this site.

## The editor-plugin surface — the finding that made this possible

An earlier pass concluded "a plugin cannot fix this" after testing only `modules.register`, and
went to a platform patch. That rejection was correct **for what it tested** and wrong as a
conclusion. The plugin API has a whole second surface:

| Permission | Grants | Risk |
|---|---|---|
| `editor.code` | plugin JS in the admin window, **unsandboxed**, full admin privileges | `dangerous` |
| `editor.store.read` | `api.editor.store.read()` → the entire `EditorStore` | medium |
| `editor.store.write` | `api.editor.store.transaction(mutate)` → a mutable draft of the whole store | high |
| `editor.panels` | a React panel in the editor's left rail | medium |
| `editor.toolbar` / `editor.commands` / `editor.canvas` | toolbar buttons, ⌘K commands, canvas overlays | medium–high |

All of it is really implemented in 0.0.16 — `editorPluginLoader.ts` loads the entrypoint,
`runtime.ts:489-508` wires `read` / `transaction` behind `assertPluginPermission` — not merely
typed. **Check this surface before ever proposing a platform patch to editor behaviour.**

## How the plugin works

Registers a **Link URL** panel; reads the selection via `useEditorStore`; writes via
`api.editor.store.read().updateNodeProps(nodeId, { href })`. Nothing about `UrlControl` changes.

Two decisions worth carrying to any future editor plugin:

1. **Keep the draft in local React state.** This IS the fix. Deriving the input value from the
   store is exactly what makes the platform's field snap back. Let the field be typed freely and
   decline to *commit* an unsafe value instead of refusing to let it be *typed*.
2. **Write through the store ACTION, not `store.transaction`.** The editor store is
   `zustand-mutative`; `transaction(fn)` runs `setState((state) => fn(state))`, so `state` is a
   **Mutative draft** and calling `state.updateNodeProps(...)` on it re-enters `set()` from
   inside a producer. `store.read()` returns `getState()` — the real store, real actions, and
   the same `updateNodeProps` the platform's property panel calls, so undo coalescing and dirty
   tracking come along for free.

## No build step

Hand-written ESM, like the Embed block. Bare specifiers (`react`, `@instatic/host-hooks`,
`@instatic/host-ui`) resolve through the host import map in `index.html`, which re-exports the
host's live instances from `globalThis.__instatic`. `createElement` is used directly — JSX would
need a compiler. **`@core/*` is NOT importable**; anything needed from core must be transcribed,
which is why the safety gate has a drift test.

## Gotchas

- **Page refs must be allowed explicitly.** `urlScheme('cms:page:x')` returns `cms:`, so
  `isSafeUrl` refuses it. Gating on `isSafeUrl` alone leaves a page-ref link uneditable in
  *precisely* the way the platform's field is — every intermediate keystroke keeps the prefix.
  Caught by the verify gate, not by inspection.
- **Allowing them is a feature.** The native Page picker only *preserves* an existing fragment
  (`makePageRef(pageId, ref?.fragment)`) and cannot type one, so `cms:page:<id>#book` is
  unreachable from stock UI and reachable here.
- **`Input` from `@instatic/host-ui` is NOT the design-system Input.** It is `PluginInput`, a
  narrowed wrapper whose whole contract is `PluginUiInputProps`. Two traps, both of which cost a
  live debugging round: **`onChange` is handed the STRING, not the event** (a handler written as
  `(e) => e.target.value` throws on every keystroke and the field silently refuses input), and
  **anything outside the contract is dropped** — `id`, `fieldSize`, `autoComplete`, `spellCheck`
  all do nothing, and the wrapper assigns its own `id` from `useId()`. Use its `label` and
  `description` props; it renders them in a host `FormField`.
- **Debounce the write; do not commit per keystroke.** Every *prefix* of what is typed gets
  written, and every prefix of a dangerous value is itself safe: `javascript:alert(1)` walks
  through `j`, `ja`, … `javascript` — all schemeless, all committed — and only the colon stops
  it. The live node was left holding `javascript` while the panel said "Not saved". 400 ms plus
  an immediate commit on blur. Applies to ANY editor plugin writing from a text field.
- **Do not write a literal `[\u0000-\u0020]` range into the source.** Doing so puts a real NUL
  byte in the file: `grep` then reports "binary file matches" and editors mangle it on save. The
  verify gate asserts the source is free of raw control characters.
- **Only `editor.panels` exists — there is no right-hand inspector extension point.** The field
  lives in the left rail, not beside the platform's own Link URL control.
- **Reload the editor tab after installing.** Plugins activate at admin boot;
  `useInstalledEditorPlugins` re-runs only on `CMS_PLUGINS_CHANGED_EVENT`.
- **`install-plugin.mjs` now keys its grants by plugin id.** A flat list would have silently
  handed the second plugin the first one's permissions; an unknown id is refused outright.

## LIVE on Dr. Nahlah, 2026-08-24 — v1.0.2, verified in the editor

Installed on `encorercm.com`, plugin `active`, `lastError: null`, all four permissions granted.
Driven under CDP against the real editor, on the home page's `Book a Free Consult` CTA:

| Typed | Result |
|---|---|
| `…#book` appended to a `cms:page:` ref | committed — a fragment on a page ref, which the Page picker cannot author |
| `tel:+15717029900` | committed |
| `#book` | committed; canvas re-rendered `<button>` → `<a href="#book">` in all three frames |
| `javascript:alert(1)` | refused, field marked invalid, warning shown, **node untouched after 1.2 s** |
| selecting a `base.container` | "has no link address" empty state |

The node was restored to its original `cms:page:5eKjtlsP8RzgQ-CM7rh2c` and the draft re-read
over the API to confirm it: **MATCH, and no test residue anywhere in the 37 page trees.** The
draft was already at `seq 67` with unpublished work; nothing was published.

Both v1.0.0 and v1.0.1 failed this run — see the two gotchas above. The bugs were only visible
against the live editor; the offline gates passed throughout, which is why they now assert both.

## Gate: `verify-link-editor.mjs`

```bash
node verify-link-editor.mjs        # 53 assertions, ~1s
```

Lifts the safety functions out of the real plugin file by source slice, then re-reads the host's
`src/core/html-sanitize/index.ts` and fails if `SAFE_URL_SCHEMES`, `isSafeUrl` or `urlScheme`
have drifted from what the copy was transcribed against. A hand-copied security check rots
silently; this turns an upstream change into a test failure. Override the checkout with
`--host=<path>` (default `C:\ifork\Instatic-main`).

---

## Upstreaming

Instatic is MIT (`github.com/corebunch/instatic`, v0.0.16, pre-1.0) with a CONTRIBUTING.md inviting contributions. This plugin needs no upstream change to work, but the cleanest long-term fix is for `moduleAdapter.ts` to forward `cspSources` from plugin modules, which would let an Embed module declare its own origin exactly as `base.video` does. Worth filing with the evidence above; nothing here depends on it landing.

## Technical Setup

- **Executor status**: Working. v1.3.0 installed and verified live on `encorercm.com` (Dr. Nahlah) on 2026-08-22, plugin `active`, all three permissions granted. Current allowlist: `frameOrigins = https://reputationhub.site`, script and connect **empty** — the Google review widget runs on `frame-src` alone. The Embed block gated end to end at 1440 and 390: URL mode grew from a 240px start to 861px / 2116px on the widget's own postMessage, snippet mode survived the publish boundary as an element at its fixed height, no frame refused by CSP.
- **Credentials**: reuses `15-instatic-api-sync/insta-api.mjs` and the repo-root `.env`.
- **Endpoints**: `POST /admin/api/cms/plugins/inspect-package`, `POST /admin/api/cms/plugins/package`, `GET|PUT /admin/api/cms/plugins/:id/settings`.

---

## Open Graph and AEO Schema — v1.0.0, LIVE 2026-08-28

Two sibling plugins, built together because they need the same two facts and the
same shape. Each has its own README; this section records what a future session
needs and would otherwise have to rediscover.

### The `<head>` surface, and the 73 buried descriptions

`buildDocumentMetaTags` emits `settings.metaTitle ?? page.title`, a single
`settings.metaDescription`, and `settings.faviconUrl`. That is the whole head.

`pages.seoDescription` and `posts.seoDescription` are real cells with a real
admin field, and 30 of 37 pages and 43 of 43 articles had one written — none of
which ever reached a page. **A field existing in the Instatic admin is not
evidence that the publisher emits it.** Read `render.ts` first.

### `slug` does not identify an entry page — the trap both plugins are built around

`applyPublishedHtmlPipeline` passes `publish.html` a context of
`{ siteId, pageId, slug }`. For a data-row page those come from the merged
TEMPLATE:

```ts
// publicRenderer.ts → renderPublishedDataRowTemplate
return { ...rendered, pageId: merged.id, slug: merged.slug, siteId: … }
```

All 43 articles therefore arrive as `slug: "post"` sharing one `pageId`. Anything
keyed off `slug` gives every article identical output, and it looks correct until
two of them are compared. The same function sets `merged.title = row.cells.title`
one line earlier, so `<title>` **is** the row's — which is why both plugins
resolve slug-first-then-title, and why `verify-seo-plugins.mjs` asserts all 79
published URLs carry a **distinct** `og:url`, canonical and `@id`.

### A `publish.html` filter must be synchronous

The filter runs inside the QuickJS worker over an RPC round-trip
(`runHookFilterInWorker`). Calling `api.cms.content.*` or `api.cms.storage.*`
from inside it is a second round-trip while the host awaits the first.
`embed-origins` avoided this by reading only `api.cms.settings.get`, which is a
synchronous mirror read. Both new plugins follow the same discipline: everything
is loaded into an in-memory mirror on the `publish.before` event — which the
pipeline `await`s — behind a 10-second floor, because `publish.before` fires
**per page**, not per publish, and a 37-page publish would otherwise reload the
whole content table 37 times.

### An admin app page: what it costs and what it gives

`adminPages[].content.kind = 'app'` mounts a real React component in the admin
window. It requires the **`editor.code`** grant (`adminRuntime.ts` refuses the
import without it, and says so in the page body rather than failing silently),
and `admin.navigation` for the sidebar item. `assetPath` is filled in by the host
at install — never set it in the manifest, it is stripped.

No build step, exactly like the Link Editor: `react`, `@instatic/host-hooks` and
`@instatic/host-ui` resolve through the host import map, and `createElement` is
used directly because JSX would need a compiler. `usePluginRoutes()` gives
`fetch`/`json` scoped to the plugin's own routes, so the admin page is a thin
view and every rule lives on the server where the publish filter can also reach
it.

**The host-ui trap, again:** `Input` / `Textarea` / `Select` are the narrowed
`PluginInput` wrappers and their `onChange` receives the **string value, not the
event**. Anything outside `PluginUi*Props` (`id`, `name`, `autoComplete`) is
dropped.

### Manifest gotchas that cost a round-trip

- **`keywords` must match `^[A-Za-z0-9_-]{1,30}$`.** `"open graph"` with a space
  is a 400 at `inspect-package`, and the error names only the pattern, not the
  field.
- **`contentAccess[]` entries are keyed `table`, not `tableSlug`.**
- Resource fields are `text | longtext | number | date | boolean`, and
  `validatePluginRecordData` **drops any key not declared** — a JSON blob has to
  be a declared `longtext` field or it silently vanishes.

### The bulk API is the point

Both plugins expose `POST /bulk` under
`/admin/api/cms/plugins/<id>/runtime/`, gated on `content.manage`, **dry-run by
default**, with `{title}` / `{slug}` / `{url}` / `{description}` interpolated per
page — for AEO, inside every string of a JSON template however deeply nested.
Eighty pages is past the point where clicking is a plan.

### Live state, 2026-08-28

Installed, `active`, configured by `configure-seo-plugins.mjs`, published, and
gated: **`verify-seo-plugins.mjs` — 1511 assertions over all 79 published URLs,
all green.** Every URL now carries a unique canonical, its own meta description,
a full Open Graph and Twitter card, and a JSON-LD graph that parses.

### The two blocks that needed a decision, not a generator

`push-aeo-content.mjs` writes them through the plugin's own `POST /entry` route:

- **FAQPage on `/dental-implant-faq`**, built by reading that page's twelve
  `<details><summary>` pairs out of the PUBLISHED HTML. Google's guidance is that
  FAQ markup must mirror visible content, so the script refuses to write if fewer
  than four pairs are found — a page restructure becomes a failure, not silently
  stale markup.
- **MedicalWebPage on 11 treatment pages**, each `about` a named
  `MedicalProcedure`, `specialty: Prosthodontics`, `audience: Patient`. The list is
  curated, not matched by prefix: `/dental-conditions` describes conditions and
  `/financing` is not a procedure, and a prefix rule would sweep both in.

**What was deliberately not done, and it matters more than what was.** The bulk
API can put an FAQPage on all 43 articles in one call — title as the question,
meta description as the answer. It would be thin markup mirroring nothing visible
on the page, which is the pattern Google names as a reason to distrust a site's
structured data. Same for `aggregateRating`: the copy says 4.9 out of 5, and a
rating in schema has to be backed by reviews the page displays and a real count.
The capability exists; using it either way would be a mistake.
### The per-page editor is a popup, and `<dialog>` is why

Both admin pages open the per-page editor in a native `<dialog>` driven by
`showModal()`. Not a styled div: the top layer escapes `overflow` and ancestor
transforms, and the admin shell has both, so a `position: fixed` overlay would
have been clipped by the scroll container the page lives in. The browser also
supplies the focus trap, the inert background and Escape.

Three things it cost, all worth writing down:

- **`::backdrop` cannot be set inline.** One `<style>` is injected once. The
  dialog itself is transparent and unpadded and the visible surface is the
  host's own `Card`, so the popup is themed by the admin rather than by guesses
  about its colour tokens.
- **`inset: 0` + `margin: auto` is what centres it.** The UA sheet does that for
  you only while nothing else sets margin or inset; the admin's reset does, and
  without those the popup pinned itself to the top-left corner.
- **Listen to `close`, not `cancel`.** Cancelling Escape and closing from React
  looks right and was measured wrong: the element closed, the `cancel` handler
  never ran, React went on believing the popup was open, and the row could never
  be reopened. `close` fires however the element closed — including our own
  `d.close()` — so it is the one source of truth.

### One entity, one node

`aeo-schema` collapses graph nodes that share an `@id`: the union of their
`@type` (generated first), and the hand-written block wins on any property both
carry. That is what lets a stored block EXTEND a generated node instead of
sitting beside it — `/all-on-4` publishes one `["WebPage", "MedicalWebPage"]`
and an article one `["Article", "BlogPosting"]`, a subtype added to the type it
specialises. Before it, `/privacy-policy` published two `WebPage` nodes with the
same id.

**It also broke the gate, and that is the lesson.** `@type` is a string OR an
array. `verify-seo-plugins.mjs` compared with `===`, silently stopped matching,
and reported 93 failures against a site that was entirely correct. It now treats
`@type` as the set it is, and additionally asserts no `@id` appears twice.

### Populating every page

`populate-seo.mjs` writes an explicit Open Graph override and a schema block for
all 80 pages, through the plugins' own routes.

Two values are left DERIVING on purpose, and both are the same judgement:
**never freeze a fallback into 80 rows.** The canonical URL comes from the
site-address setting, so storing 80 absolute URLs would make a domain change an
80-row edit. And on the 7 pages with no `seoDescription`, the derived
`og:description` is the site-wide sentence — freezing that would re-create the
exact defect the Open Graph plugin was written to remove, except worse, because
it would then no longer follow the setting. Those 7 pages are listed by the
script so someone can write them a description.

The mirror image of that rule caught a real bug in the dry run: `/` was
deliberately pointed at the doctor's portrait, which is ALSO the fallback image,
so the skip-the-fallback rule suppressed it and the home page would have come
out with no override and fallen back to the first picture on the page — a
patient's before photograph, as the card for the practice's front door. A
hand-set picture now always wins over anything derived.

**The script is the re-sync.** Materialising a derived value stops it tracking
its source, so `og:title` no longer follows a CMS title edit. Re-running
`populate-seo.mjs --apply` refreshes every stored title and description from the
current content, while preserving the fields a person set by hand (image, alt,
canonical URL, type).

## Output Artifacts
- `open-graph/` — the Open Graph plugin (`plugin.json`, `server/index.js`, `admin/index.js`, `README.md`)
- `aeo-schema/` — the AEO Schema plugin (`plugin.json`, `server/index.js`, `admin/index.js`, `README.md`)
- `configure-seo-plugins.mjs` — the Dr Nahlah values for both, idempotent, dry-run by default
- `push-aeo-content.mjs` — the FAQPage and MedicalWebPage blocks, written through the plugin's own API
- `populate-seo.mjs` — an explicit Open Graph override and a schema block on all 80 pages; idempotent, and the re-sync after a content change
- `test-open-graph.mjs` — 64 offline assertions, `--live` runs the filter over the real published pages
- `test-aeo-schema.mjs` — 83 offline assertions, every emitted graph parsed back out of its script tag
- `verify-seo-plugins.mjs` — the LIVE gate over every published URL; uniqueness of canonical / `og:url` is the check that matters
- `embed-origins/` — the plugin source (`plugin.json`, `server/index.js` for the CSP filter, `modules/index.js` for the Embed block)
- `link-editor/` — the Link Editor plugin source (`plugin.json`, `editor/index.js`, `README.md`)
- `verify-link-editor.mjs` — offline gate for the Link Editor: safety-gate behaviour plus a drift test against the host's `html-sanitize`
- `.tmp/link-editor.zip` — the built package
- `pack-plugin.mjs` — deterministic zip builder (forward-slashed entries, fixed timestamps)
- `install-plugin.mjs` — inspect + install with an explicit permission grant
- `set-origins.mjs` — read / set / clear the allowlist
- `test-embed-origins.mjs` — offline unit tests for the filter
- `test-embed-module.mjs` — offline unit tests for the Embed block, publisher and canvas paths both
- `verify-embed-scripts.mjs` — end-to-end gate: does a pasted script actually RUN on the published page?
- `verify-embed-module.mjs` — end-to-end gate on the PUBLISHED page: places a temporary page, publishes, drives it under CDP, removes it
- `verify-embed-editor.mjs` — end-to-end gate on the ADMIN EDITOR: temp draft page, drives the real inserter and Properties Panel under CDP, deletes the page. No publish at any point
- `probe-widget-postmessage.mjs` — does a widget self-report its height, or does it really need the vendor's parent script? Run this BEFORE granting any `script-src` origin.
- `.tmp/embed-origins.zip` — the built package

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Plugin source, scripts and `.md` are committed; `.tmp/` build output is not required.
