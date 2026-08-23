# Embed Origins

Adds operator-approved origins to a published Instatic page's Content-Security-Policy,
so third-party widgets (booking forms, review widgets, CRM embeds) can load.

- **Permission**: `cms.hooks` only.
- **Inert by default**: with no origins configured the page is returned byte-for-byte unchanged.
- **Reversible**: clear the settings and republish.

Settings are three textareas — `frame-src`, `script-src`, `connect-src` — one origin per line.
Origins are validated against `https?://host[:port]`; anything else is dropped rather than escaped.

Adding a `script-src` origin lets that origin run arbitrary JavaScript on the site.
`frame-src` alone is the low-risk half: a cross-origin iframe cannot touch the parent document.

See `../16-instatic-plugins.md` for why this works and how to build, install and test it.
