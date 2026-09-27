# 2026-09-23 — Open Graph share card: the logo on white (staging)

**Asked:** the link preview for `staging.ifadentistry.com` showed a close-up of a patient's smile;
Alejandro wanted the practice's logo on a white background instead.

## Why it showed the smile

Neither staging nor production had any Open Graph plugin installed (only `brandklout.embed-origins`),
so the page carried no `og:image` at all and iMessage picked the first large picture on the page.

## Done

- Copied `brandklout.open-graph` v1.1.2 plus `pack-plugin.mjs` / `install-plugin.mjs` from
  `bk-dr-nahlah/.../16-instatic-plugins/` into `workflows/16-instatic-plugins/`, and installed it on
  **staging only** (active, no error).
- `workflows/21-instatic-upload/home/og-card.mjs` renders the card in Chrome: the header's colour logo
  (`home-logo-color.png`, 734×266, not upscaled) centred on white, 1200×630.
- `workflows/21-instatic-upload/home/set-og.mjs` (staging-locked) uploaded it as
  `/uploads/-54Naz6CJxa8YO3Ve3P8s-ifa-og-card-logo-white.png`, set the plugin (siteUrl = staging host,
  siteName, default image = the card, **emitCanonical off**), saved an `index` override with the card,
  and published (1 page).
- Checked the published HTML: `og:image` and `twitter:image` are the card, `og:url` is staging, no
  canonical; the image serves 200 `image/png`.

## Next

- **Production** (`www.ifadentistry.com`) still has no Open Graph plugin. When the rebuilt site is
  promoted, install it there with siteUrl `https://www.ifadentistry.com` and emitCanonical on.
- Re-run `og-card.mjs` if the logo changes, and give the output a **new filename**.

## Gotchas

- **Chat apps cache previews per link.** A thread that already unfurled the smile keeps it; test by
  pasting the URL with a query string (`?v=2`) or through Facebook's Sharing Debugger.
- **The plugin's derived image skips anything named logo.** Without the `index` override, its
  `deriveFromPage` would pick the first non-logo `<img>` (the smile again) ahead of `defaultImage`.
  The override is what makes the logo win; keep it if the page is re-pushed.
- Instatic keeps media by basename: a re-cut card needs a new filename, or staging keeps the old one.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
