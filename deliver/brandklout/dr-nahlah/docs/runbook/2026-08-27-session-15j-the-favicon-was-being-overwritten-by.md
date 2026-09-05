## DONE 2026-08-27 (session 15j): the favicon was being overwritten by JS — LIVE

Client, third time of asking: "the icon keeps being the same." They were right,
and both earlier fixes were real. **`seo-head.js` was stomping them on every
page load.**

### The bug

`src/scripts/seo-head.js` carried this, and ran it on every page:

    /* No page declares an icon, so every browser falls back to /favicon.ico and
       every page logs a 404. The site does serve /favicon.svg. */
    tag('link[rel="icon"]', ...).setAttribute('href', '/favicon.svg');

`tag()` is SELECT-OR-CREATE. When the publisher emitted no icon it created one.
Once `settings.faviconUrl` was set (session 14, 2026-08-25) the publisher started
emitting `<link rel="icon">` — and this line began *finding* that link and
overwriting its href with `/favicon.svg`, Instatic's black-and-white platform
glyph. The comment was true when written and quietly became a regression.

Served HTML was correct the whole time. The DOM was wrong milliseconds later.

    curl  <link rel="icon" href="/uploads/PhKVdS1R0_...-favicon.png">   correct
    DOM   <link rel="icon" href="/favicon.svg">                          what a tab showed

**This is what the client meant by "it's for the profile, not for the site."**
`/favicon.svg` is the platform-level default, not this site's icon.

### Fixed

- `fix-seo-head-favicon.mjs` (new) — surgical removal of the 5-line block from
  the live code asset, anchored on the comment text + the exact setAttribute
  call, refuses on anything but exactly 1 match, byte-delta asserted, read-back
  verified. Same shape as `fix-seo-head-spelling.mjs`.
- `13-content-export-import/.tmp/gen-seo-head.mjs` — block replaced with a
  comment saying why it must not come back. A regenerate would have reintroduced
  it otherwise.
- Removed rather than repointed: `settings.faviconUrl` is the platform's own
  slot and where `push-favicon.mjs` writes. A repoint would have been a second
  source of truth and would bite the next person who changes the icon in the panel.

### Verified live (published 2026-08-27T03:42:17Z)

    published seo-head   48,049 -> 47,696 bytes, favicon.svg refs 2 -> 0
    asset hash           T07vjZX5komkk94bpwrd1 -> m5Uo9dJK2W3a8R1rTkefI  (no CDN staleness)
    live DOM after 2.5s  exactly 1 icon link -> /uploads/PhKVdS1R0_xk-mtalvGAw-cropped-nahlah-favicon.png
    decoded              512x512 image/png, 23,289 bytes
    spot-checked         /dental-implants /contact /smile-gallery /posts/are-dental-implants-worth-the-cost

Icon itself is the gold "N" monogram from the old WordPress site
(`03-graphic-resources/.tmp/downloads/wp-content/uploads/2022/01/cropped-nahlah-favicon.png`),
set in session 15i. Webflow's icon was byte-identical to the wordmark Instatic
already had and was itself a Facebook/Instagram profile picture
(`494207457_..._n.jpg`) — there was nothing better to extract from it.

### Gotchas

- **Never diagnose a favicon from `curl`.** The served HTML was right through
  three rounds of this. `seo-head.js` rewrites the head at runtime, so the only
  authoritative check is the LIVE DOM after scripts run:
  `[...document.querySelectorAll('link[rel*=icon]')]`. Same trap applies to
  canonical, robots and every og: tag — they all come from that script.
- **`tag()` in `seo-head.js` mutates an EXISTING tag if it finds one.** Every
  block in that file silently outranks the publisher. When adding anything to
  `settings.*`, check whether `seo-head.js` already writes the same tag.
- **`src/scripts/favicon*.js` (12 assets, `favicon.js` + `-b`..`-l`) are all
  retired stubs** from 2026-08-19, emptied and unscoped. They are not the
  culprit; don't go down that path again. Instatic has no delete for code
  assets, so they stay as litter.
- **Chrome caches favicons hard.** After a real fix an already-open tab can keep
  the old icon. Incognito is the zero-risk way to see the truth — no favicon
  cache.
