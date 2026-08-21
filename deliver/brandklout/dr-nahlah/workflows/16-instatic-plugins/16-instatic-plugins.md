# Workflow: 16 - Instatic Plugins

## Client-Facing Overview
Third-party widgets (booking forms, review widgets, CRM embeds) can be switched on per site through an installable plugin, instead of being impossible or requiring a modified platform build.

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
| `frame-src` | **Yes** | this plugin's `publish.html` filter |
| `script-src` | **Yes**, arbitrary origins | this plugin. (`frontend.assets` alone only ever grants `'self'`, because plugin scripts are served same-origin from `/uploads/plugins/...`) |
| `connect-src` | Yes | this plugin, or `networkAllowedHosts` via `frontend.assets` |
| `img-src` / `media-src` | Yes | media storage adapter `cspOrigins`, or this plugin |

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

## Gotchas

- **`Compress-Archive` writes BACKSLASH entry names on Windows.** The host looks up `server/index.js` by its manifest path, so a backslashed entry installs a plugin whose entrypoint can never be found — and it surfaces later as a plugin parked in `error`, not as a bad zip. `pack-plugin.mjs` writes the zip by hand for this reason.
- **Plugin server code runs in a QuickJS-WASM sandbox**, scanned at upload for forbidden literals (the `node:` and `bun:` import prefixes, `require(`, `process.binding`, `globalThis.process.env`). A string-rewriting filter is unaffected, but nothing here can reach the filesystem, environment or network.
- **Install requires step-up auth**, and step-up **rotates the session cookie**. `requestForm` in `insta-api.mjs` carries the rotated cookie; a hand-rolled fetch will 401 on the retry.
- **`GET .../settings` returns `{ schema: [...], settings: {...} }`** — the values are an OBJECT keyed by setting id, not the schema array. Iterating `settings` as an array throws `object is not iterable`.
- **Origins are validated, not escaped.** A pasted `https://x.com; default-src *` is *rejected* by `ORIGIN_RE`, not sanitised, so a bad line can never inject a directive. Covered by `test-embed-origins.mjs`.
- **`'none'` is replaced, never appended to.** `frame-src 'none' https://x` is invalid CSP and would block everything; the plugin drops `'none'` when it adds a real source, matching the host's own `addCspSources`.
- **Adding a `script-src` origin lets that origin run arbitrary JavaScript on the site.** It is a real security decision, not a formality — `frame-src` alone is the low-risk half, because a cross-origin iframe cannot touch the parent document. Grant the script origin only when the widget genuinely needs it, and prove that it does with `probe-widget-postmessage.mjs` first: on Dr. Nahlah the answer was no.
- **`Network.setBlockedURLs` cannot block a cross-origin iframe.** It is scoped to the CDP session it is sent on, and the widget frame is out-of-process with its own target, so a "blocked" run in `probe-rv-live.mjs` was quietly loading the widget and passing for the wrong reason. Block at the browser instead: `--host-resolver-rules=MAP vendor.example 127.0.0.1:1`. The old form only ever worked because the thing being blocked was a script the MAIN frame requested.

## Security posture

- With empty settings the filter returns the page **byte-for-byte unchanged** — installing the plugin alone changes nothing.
- The plugin holds exactly one permission, `cms.hooks`. `install-plugin.mjs` grants from an explicit `GRANT` list and **refuses** any package asking for more, so a future version that quietly widens its request cannot be installed by re-running the script.
- Every widening is per-site, operator-typed, and reversible with `--clear` plus a publish.

## Testing

```bash
node test-embed-origins.mjs     # 11 assertions, no network, no platform
```

Covers passthrough, `'none'` replacement, preservation of every other directive, importmap-sha survival, dedupe, trailing-slash stripping, directive-injection rejection, absent-directive creation, idempotence, body integrity, and the no-meta-tag case.

## Upstreaming

Instatic is MIT (`github.com/corebunch/instatic`, v0.0.16, pre-1.0) with a CONTRIBUTING.md inviting contributions. This plugin needs no upstream change to work, but the cleanest long-term fix is for `moduleAdapter.ts` to forward `cspSources` from plugin modules, which would let an Embed module declare its own origin exactly as `base.video` does. Worth filing with the evidence above; nothing here depends on it landing.

## Technical Setup

- **Executor status**: Working. Installed and verified live on `encorercm.com` (Dr. Nahlah) on 2026-08-22. Current allowlist: `frameOrigins = https://reputationhub.site`, script and connect **empty** — the Google review widget runs on `frame-src` alone.
- **Credentials**: reuses `15-instatic-api-sync/insta-api.mjs` and the repo-root `.env`.
- **Endpoints**: `POST /admin/api/cms/plugins/inspect-package`, `POST /admin/api/cms/plugins/package`, `GET|PUT /admin/api/cms/plugins/:id/settings`.

## Output Artifacts
- `embed-origins/` — the plugin source (`plugin.json` + `server/index.js`)
- `pack-plugin.mjs` — deterministic zip builder (forward-slashed entries, fixed timestamps)
- `install-plugin.mjs` — inspect + install with an explicit permission grant
- `set-origins.mjs` — read / set / clear the allowlist
- `test-embed-origins.mjs` — offline unit tests for the filter
- `probe-widget-postmessage.mjs` — does a widget self-report its height, or does it really need the vendor's parent script? Run this BEFORE granting any `script-src` origin.
- `.tmp/embed-origins.zip` — the built package

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Plugin source, scripts and `.md` are committed; `.tmp/` build output is not required.
