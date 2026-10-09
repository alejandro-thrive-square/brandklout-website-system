# Embed Origins

Makes third-party widgets — booking forms, review widgets, chat bubbles, CRM embeds — possible on
an Instatic site, in two halves that are deliberately separate:

- **The block** (`modules/index.js`, permission `modules.register` + `frontend.assets`) — an
  **Embed** module in the canvas library. Paste a URL or the vendor's snippet, publish.
- **The policy** (`server/index.js`, permission `cms.hooks`) — a `publish.html` filter that
  rewrites the published page's Content-Security-Policy meta tag so the browser will load it.

The block cannot widen CSP even if it wanted to: `moduleAdapter.ts` drops a plugin module's
`cspSources`. That is why the allowlist is a separate, operator-owned decision.

- **Inert by default**: in `strict` mode with no origins configured the page is returned
  byte-for-byte unchanged. Installing the plugin alone changes nothing.
- **Per page, never site-wide**: `autoTrust` widens only the pages that turned out to contain an
  embed, recomputed at each publish. Remove the embed, republish, and the page relocks.
- **Reversible**: clear the settings and republish.

Origins are validated against `https?://host[:port]`; anything else is dropped rather than escaped.
Adding a `script-src` origin lets that origin run arbitrary JavaScript on the site. `frame-src`
alone is the low-risk half: a cross-origin iframe cannot touch the parent document.

**The canvas shows a card, not the embed.** Since module `1.1.0`, `preview()` returns a static
description of the block — mode, destination host(s), height rule — sized to the box the block will
occupy. It loads no vendor, runs no vendor markup and leaks no vendor stylesheet into the editor.
The embed itself appears when the page is published; `render()` is unchanged.

**URL mode writes `loading="lazy"` by default** (the *Lazy load* toggle, `lazy: true`). Never use
it for a GoHighLevel form, survey or booking frame: GHL's `form_embed.js` parks those frames at
`left:-9999px` until they load, and a lazy frame parked there never loads — no form in Firefox
(Stone Med Spa, 2026-10-06). Use **snippet** mode with GHL's paste as given, or turn *Lazy load*
off. Gate: `deliver/process/tools/ghl-forms/check-embed.mjs` (tools/ghl-forms/README.md,
"Embedding the form").

See `deliver/process/tools/instatic-embeds/instatic-embeds.md` for how to use
the block, and `deliver/process/tools/instatic-plugins/README.md` (Scenario 4) for how to build,
test, install and update it across sites.

## Permissions, and why

`../install-plugin.mjs` and `../plugins.mjs rollout` grant exactly the `grants` list in
`../plugins.json` and refuse a package asking for more, so a future version that quietly widens its
request cannot be installed by re-running a script.

| Permission | Needed for |
|---|---|
| `cms.hooks` | the `publish.html` CSP filter |
| `modules.register` | the Embed block in the canvas library |
| `frontend.assets` | module render `js`, used for ONE thing: the auto-height listener served same-origin from `/_instatic/module-js/`. It grants no third-party origin anything. |

## Why a plugin can do this when a module cannot

Verified against the v0.0.16 source and a live site:

1. **A plugin MODULE cannot lift CSP.** `src/core/plugins/moduleAdapter.ts` rebuilds the render
   output as `{ html, css, js }` and drops `cspSources`. A whitelist, not an oversight.
2. **`publish.html` is a filter over the whole published HTML string**, registered under
   `cms.hooks`. `publishedHtmlPipeline.ts` runs it LAST and returns the filter's string verbatim.
3. **A public page's CSP is only a `<meta http-equiv>` tag.** `securityHeaders.ts` sets a CSP
   *header* for `/admin` paths only, so nothing contradicts the meta tag.

## Security posture

- With `strict` + empty settings the filter returns the page byte-for-byte unchanged.
- Every widening is per page and recomputed at each publish; nothing accumulates.
- Origins typed into the settings are validated against `ORIGIN_RE`, not escaped, so a pasted
  `https://x.com; default-src *` is rejected rather than sanitised.
- `'none'` is replaced, never appended to: `frame-src 'none' https://x` is invalid CSP.
- A created directive inherits from `default-src` first (a bare `font-src https://vendor` once
  revoked the site's own webfonts), and is deduped (fixed in 1.6.0).
- Plugin server code and module packs run in a QuickJS-WASM sandbox, scanned at upload for
  forbidden literals.
