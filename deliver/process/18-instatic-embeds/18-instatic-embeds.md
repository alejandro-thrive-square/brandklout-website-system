# Workflow: 18 - Instatic Embeds

## Client-Facing Overview
Third-party widgets — booking forms, review widgets, chat bubbles, CRM embeds — can be placed on an Instatic site by hand, from the editor, by whoever is editing the page. Paste the vendor's iframe or snippet, publish, done. No developer, no agent, no platform fork.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the plugin, its scripts or its gates must be documented here immediately, and mirrored into [PROCESS_INDEX.md](../PROCESS_INDEX.md) and [OFFER_ROUTING.md](../OFFER_ROUTING.md) when routing or module behaviour changes.

## Operational Purpose

Instatic publishes every public page behind a strict Content-Security-Policy carrying `frame-src 'none'` and `script-src 'self' '<importmap-sha>'`, and ships **no module that emits an `<iframe>` or raw HTML** (`base.video` is YouTube-only). Out of the box that makes every third-party embed impossible — not awkward, impossible — and there is no setting, env var or admin field that changes it.

`webzite.embed-origins` closes both halves through the public plugin API, with no fork and no patched image:

| Half | Entrypoint | What it does |
|---|---|---|
| The block | `entrypoints.modules` | an **Embed** module in the canvas library: paste a URL or the vendor's snippet |
| The policy | `entrypoints.server` | a `publish.html` filter that rewrites the page's CSP meta tag at publish time |

They are separate on purpose, and the platform enforces it: `moduleAdapter.ts` drops a plugin module's `cspSources`, so the block cannot widen CSP even if it wanted to.

## Installing it on a new client site

```bash
cd deliver/process/18-instatic-embeds

# 1. The toolkit refuses to guess which site it is talking to.
#    Add to the repo-root .env:  INSTATIC_BASE_URL=https://client-site.com
#                                INSTATIC_EMAIL=...
#                                INSTATIC_PASSWORD=...

node test-embed-origins.mjs                 # 54 assertions, offline
node test-embed-module.mjs                  # 54 assertions, offline

node pack-plugin.mjs embed-origins .tmp/embed-origins.zip
node install-plugin.mjs .tmp/embed-origins.zip          # dry run: shows the grants
node install-plugin.mjs .tmp/embed-origins.zip --apply  # needs step-up auth

node set-origins.mjs                        # show the allowlist

node verify-embed-editor.mjs --place        # is a person OFFERED the block?
node verify-embed-editor.mjs --check        # 11 assertions, publishes nothing
node verify-embed-editor.mjs --cleanup

node verify-embed-scripts.mjs --place       # does a pasted SCRIPT actually run?
node verify-embed-scripts.mjs --check
node verify-embed-scripts.mjs --cleanup
```

Copy this module into `deliver/[client]/workflows/` only if that client needs client-specific adaptations; otherwise run it from here. **Record `process_baseline_commit`** in the client's `docs/project-overview.md` either way.

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

## The canvas shows a card

Since **module `1.1.0` / plugin `1.4.0`**, `preview()` — the editor-only path — never emits the frame or the snippet. It returns a static description of the block: mode, destination host(s), what a snippet contains, the height rule, and "Appears when the page is published". `render()`, the publish path, is untouched.

Rendering the real thing on the canvas cost more than it bought, differently in each mode:

- a **URL-mode iframe does load** in the editor, because the admin CSP sets no `frame-src`. The vendor's widget booted inside the canvas — third-party requests, cookie banners and all — then sat at its *starting* height forever, since the auto-height runtime is a `render()` output and never ships to the canvas. A widget that publishes at 1800px showed as a 600px box with its own scrollbar;
- a **snippet is mounted with `dangerouslySetInnerHTML`**, so its `<script>` never runs and what appears is the vendor's *undressed* markup — the bare divs a bundle was supposed to fill — while any `<style>` or `<link>` in the same paste leaks OUT of the module and restyles the editor around it.

Neither was a preview of the published page, so neither was worth showing.

The card keeps the two things the live render did give: the block stays **selectable and stylable** (same root shape, machine-generated attributes only, so `injectClassIntoRootElement` still lands the author class on it), and the box is **sized to what will publish** — fixed height, aspect ratio, or the auto starting height as a `min-height` — so the page around it lays out honestly. It also says something the live render could not: for a snippet, **the hosts the paste reaches**, which are exactly the origins that must appear in this plugin's settings.

The card root carries `data-wz-embed-card="1"` alongside the usual `data-wz-embed="<fit>"`. `render()` never emits it, so a published page has none. Gates that probe `[data-wz-embed], .wz-embed-note` keep working; a gate that wants to prove the canvas is *not* rendering the embed should assert on `data-wz-embed-card`.

## Why a plugin can do this when a module cannot

Verified against the v0.0.16 source and then against a live site:

1. **A plugin MODULE cannot lift CSP.** `src/core/plugins/moduleAdapter.ts` rebuilds the render output as `{ html, css, js }` and drops `cspSources`. A whitelist, not an oversight.
2. **`publish.html` is a filter over the whole published HTML string**, registered under `cms.hooks`. `publishedHtmlPipeline.ts` runs it LAST and returns the filter's string verbatim — no re-validation, no CSP re-derivation.
3. **A public page's CSP is only a `<meta http-equiv>` tag.** `securityHeaders.ts` sets a CSP *header* for `/admin` paths only, so there is nothing to contradict the meta tag.

## Permissions this asks for, and why

`install-plugin.mjs` grants from an explicit `GRANT` list and refuses any package asking for more, so a future version that quietly widens its request cannot be installed by re-running the script.

| Permission | Needed for |
|---|---|
| `cms.hooks` | the `publish.html` CSP filter |
| `modules.register` | the Embed block in the canvas library |
| `frontend.assets` | authority for module render `js` — used for ONE thing, the auto-height listener served same-origin from `/_instatic/module-js/`. It grants no third-party origin anything. |

### `GRANTS` is per plugin id (changed 2026-08-28)

`install-plugin.mjs` used to hold ONE `GRANT` array, written for `embed-origins`. That made it
refuse the other three Webzite plugins — they legitimately ask for different permissions — and, if
the refusal had been bypassed, would have installed them with the wrong grants. It now keys an
explicit `GRANTS` map by plugin id and grants each package exactly its own entry:

| Plugin | Granted |
|---|---|
| `webzite.embed-origins` | `cms.hooks`, `modules.register`, `frontend.assets` |
| `webzite.aeo-schema` | `cms.hooks`, `cms.storage`, `cms.routes`, `cms.content.read`, `admin.navigation`, `editor.code` |
| `webzite.open-graph` | same as `aeo-schema` |
| `webzite.link-editor` | `editor.code`, `editor.panels`, `editor.store.read`, `editor.store.write` |

Both safety properties are kept and one is added: a package asking for more than its entry is
refused, **and a plugin id with no entry at all cannot be installed** — so an unrecognised package
has to be reviewed and added deliberately. Inspection now runs with an empty grant, since
`inspect-package` only reads the manifest and the id is what selects the list.

> [!NOTE]
> Only `embed-origins` lives in this folder. `aeo-schema`, `open-graph` and `link-editor` are still
> only in `deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/` and have to be packed from
> there (`node pack-plugin.mjs <path-to>/aeo-schema .tmp/aeo-schema.zip`). All four belong on every
> new site, so those three should be promoted here the way `embed-origins` was.

## Gotchas

- **A publish bakes EVERY page.** Unrelated drift ships with whatever you were publishing. On Dr. Nahlah this cost the home page its six review-card fallbacks — present in the published HTML, absent from the draft, gone the moment anything was published. Audit before and after:
  ```bash
  node ../../[client]/workflows/08-qa/.tmp/audit-site.mjs --base https://client.com --only index
  git diff ../../[client]/workflows/08-qa/.tmp/audit-out/
  ```
- **A created CSP directive must inherit from `default-src`.** An absent directive falls back to it, so writing `font-src https://vendor` on a page that had no `font-src` silently revoked the site's own webfonts. It surfaces as one violation per font file, which reads like a font problem. `widen()` seeds from `default-src` first; any new directive must do the same.
- **`escapeProps()` runs before `render()` on the publish path** and HTML-escapes every non-`url` string prop, and the plugin control vocabulary has no `richtext`/`svg` type — so a pasted snippet arrives as `&lt;iframe …&gt;`. The module decodes then escapes exactly once, which is idempotent and therefore also correct on the canvas path, where props arrive RAW.
- **The editor canvas mounts module HTML with `dangerouslySetInnerHTML`**, so `<script>` never runs there. Iframes do (the admin CSP sets no `frame-src`). This is why `preview()` shows a card and not the embed — see §The canvas shows a card.
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
node test-embed-origins.mjs     # 54 — CSP filter, both modes, hashes, inheritance
node test-embed-module.mjs      # 54 — the Embed block, publisher and canvas paths
```

Both run with no host, no network and no site. What they cannot prove is that the host registers the module and calls it — that is what `verify-embed-editor.mjs` (the editor path) and `verify-embed-scripts.mjs` (the published path) are for.

## Technical Setup

- **Executor status**: Working. The executor is the Node toolchain in this folder; `18-instatic-embeds.py` is a thin orchestrator over the documented sequence, in the same spirit as `07-webflow-build`.
- **Credentials**: repo-root `.env` — `INSTATIC_BASE_URL`, `INSTATIC_EMAIL`, `INSTATIC_PASSWORD`. `lib/insta-api.mjs` walks up to find it. There is deliberately no default site.
- **Endpoints**: `POST /admin/api/cms/plugins/inspect-package`, `POST /admin/api/cms/plugins/package`, `GET|PUT /admin/api/cms/plugins/:id/settings`, `GET|PUT /admin/api/cms/site-document`, `POST /admin/api/cms/publish`.
- **Origin**: promoted from `deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/` (built and proven there on `encorercm.com`, plugin v1.3.0). The client folder's numbering (`15`, `16`) predates this promotion and does not match canonical module numbers.

## Output Artifacts
- `embed-origins/` — the plugin: `plugin.json`, `server/index.js` (CSP filter), `modules/index.js` (the Embed block)
- `lib/insta-api.mjs` — headless admin REST client, no default site
- `pack-plugin.mjs` — deterministic zip builder (forward-slashed entries; `Compress-Archive` writes backslash entry names on Windows and installs a plugin whose entrypoint can never be found)
- `install-plugin.mjs` — inspect + install against an explicit permission grant
- `set-origins.mjs` — read / set / clear the allowlist
- `test-embed-origins.mjs`, `test-embed-module.mjs` — offline suites
- `verify-embed-editor.mjs` — is the block offered to a person? (publishes nothing)
- `verify-embed-module.mjs`, `verify-embed-scripts.mjs` — published-page gates (these publish)
- `probe-widget-postmessage.mjs`, `probe-elfsight-bare.mjs` — answer "is this the vendor's fault?" away from the client's site
- `handoff/embed-block-guide.html` — the non-engineer guide; give a marketer this and a developer the directive

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Plugin source, scripts, gates and `.md` are committed; `.tmp/` build output and cached sessions are not (`**/.tmp/.session` is ignored repo-wide — it is a live CMS credential).
