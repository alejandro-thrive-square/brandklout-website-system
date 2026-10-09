# Webzite Relume Style Guide — Extracted Source

Published source of the Webzite Relume style guide page, captured for reference during client delivery initialization.

- **Source URL**: https://webzite-relume.webflow.io/style-guide
- **Extracted**: 2026-07-18

## Contents

| File | Purpose |
| --- | --- |
| `style-guide.html` | The published page with its stylesheet rewritten to `assets/`, so it opens offline (images still load from the Webflow CDN). The Webflow runtime and jQuery were dropped on 2026-09-28: the page is a reference for classes and variables, not an interactive copy. |
| `assets/webzite-relume.webflow.shared.62ada462d.css` | Full compiled site stylesheet: the class/variable definitions of the style guide. Read by the `webflow-clientfirst` MCP (`harvest_style_guide`). |

The CSS file is the primary artifact: it contains every class definition and CSS variable the style guide exposes. Re-extract after any style-guide publish; the hashed filenames change on each Webflow publish.

## On Instatic

The tokens of this style guide go into the Instatic Framework panel, renamed to Framework-safe names, so colours, type and spacing stay editable by hand after every AI upload: [INSTATIC-FRAMEWORK.md](./INSTATIC-FRAMEWORK.md).

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Text artifacts here are lightweight and committable; re-extraction should replace files in place in one atomic commit.
