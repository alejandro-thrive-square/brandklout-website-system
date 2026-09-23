# Webzite Relume Style Guide — Extracted Source

Published source of the Webzite Relume style guide page, captured for reference during client delivery initialization.

- **Source URL**: https://webzite-relume.webflow.io/style-guide
- **Extracted**: 2026-07-18

## Contents

| File | Purpose |
| --- | --- |
| `style-guide.html` | Exact published HTML, asset URLs untouched (point to the Webflow CDN). |
| `style-guide.local.html` | Same HTML with the CSS/JS references rewritten to `assets/` so the page opens offline (images still load from the CDN). |
| `assets/webzite-relume.webflow.shared.62ada462d.css` | Full compiled site stylesheet — the class/variable definitions of the style guide. |
| `assets/webflow.a0aa6ca1.*.js`, `assets/webflow.schunk.*.js`, `assets/jquery-3.5.1.min.*.js` | Webflow runtime + jQuery, as referenced by the page. |

The CSS file is the primary artifact: it contains every class definition and CSS variable the style guide exposes. Re-extract after any style-guide publish; the hashed filenames change on each Webflow publish.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Text artifacts here are lightweight and committable; re-extraction should replace files in place in one atomic commit.
