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

See the workflow directive next to this folder (`instatic-embeds.md` in `deliver/process/`, or
`16-instatic-plugins.md` in the Dr. Nahlah client folder) for why this works and how to build,
install and test it.
