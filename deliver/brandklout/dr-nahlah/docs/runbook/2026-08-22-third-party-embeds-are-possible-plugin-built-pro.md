## DONE 2026-08-22: third-party embeds ARE possible — plugin built, proven live — `5a197e4`

**The "proven impossible" verdict below is OVERTURNED.** It was right about
modules and wrong about the platform: it stopped one layer short.

Everything the old note says still holds — `frame-src 'none'`, no env var, no
site setting, and `moduleAdapter.ts` really does drop a plugin module's
`cspSources` (it whitelists the render output to `{html, css, js}`). But:

- **`publish.html` is a filter over the ENTIRE published HTML string**, via
  `api.cms.hooks.filter` under the `cms.hooks` permission;
- **`applyPublishedHtmlPipeline` runs it LAST** — after `injectFrontendAssets`
  and `injectModuleScripts` do their own CSP rewriting — and returns the
  filter's string **verbatim**, no re-validation, no CSP re-derivation;
- **a public page's CSP is ONLY a `<meta http-equiv>` tag.**
  `securityHeaders.ts` sends the header for `/admin` paths only. Verified live:
  `curl -I https://encorercm.com/veneers` returns **no CSP header at all**.

So rewriting that meta tag IS the page's final policy. No fork, no patched
image, entirely inside the public plugin API.

**Built, installed and proven on the live site**: `webzite.embed-origins`, in
`deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/`. Read
`16-instatic-plugins.md` there before touching it. Real LeadConnector snippet,
under CDP, on `encorercm.com/veneers`:

| allowlist | script | iframe |
|---|---|---|
| none (default) | BLOCKED | element in DOM, load refused, "violates frame-src" |
| `--frame` | BLOCKED | **LOADS**, cross-origin document |
| `--frame --script` | **LOADED** | **LOADS**, and **zero CSP violation events** |

    cd deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins
    node test-embed-origins.mjs                    # 11/11, offline
    node set-origins.mjs                           # show allowlist
    node set-origins.mjs --frame https://reputationhub.site
    node ../15-instatic-api-sync/insta-api.mjs publish
    node ../15-instatic-api-sync/test-embed.mjs veneers

**The plugin is installed and ACTIVE but deliberately INERT** — all three
settings are empty and the live site is back to `frame-src 'none'`. Empty
settings return the page byte-for-byte unchanged. No widget is placed on any
page yet, and a security widening should not outlive the feature that needs it.

**Settings only affect pages published AFTER the change** — the filter runs at
publish time. That is true in reverse too: `--clear` needs a publish.

Traps that cost time, all now in the directive:
- **`Compress-Archive` writes BACKSLASH zip entry names on Windows.** The host
  looks up `server/index.js` by manifest path, so it installs a plugin whose
  entrypoint can never be found — surfacing later as a plugin parked in
  `error`, not as a bad zip. `pack-plugin.mjs` writes the zip by hand.
- **Install is multipart AND needs step-up auth**, which **rotates the session
  cookie**. Added `requestForm` to `insta-api.mjs` so that lives in one place.
- **`GET .../settings` returns `{schema: [...], settings: {...}}`** — values are
  an OBJECT keyed by id, not the schema array. Iterating it throws
  `object is not iterable`.
- Plugin server code runs in a **QuickJS-WASM sandbox** scanned at upload for
  forbidden literals (`node:`/`bun:` prefixes, `require(`, `process.binding`,
  `globalThis.process.env`). String work is fine; no fs, env or network.

**Open decision for the user:** whether to place the review widget / HighLevel
form now (needs `--frame`, and `--script` only if the widget injects its own
JS — that grants the origin arbitrary JS on the site, so `frame-src` alone is
the low-risk half). Native reviews remain the alternative and the site already
renders `.rv-card` markup.
