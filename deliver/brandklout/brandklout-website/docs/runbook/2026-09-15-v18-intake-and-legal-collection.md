## 2026-09-15: Sang's v18 — package intake, unbundled CSS, the Legal Pages collection (seq 27)

Reported (Alejandro, on the `Final Run/` folder Sang sent on Slack, "with different css files and
seperated the legal pages to CMS"): "we do not have the right process to make iterations. He's doing
new versions and sending the code to me but that confused Opus."

### What v18 actually is (client-handoff/intake-v18.md)

Not a redesign. `package-intake.mjs` (new) diffed it against v16: all eight CSS sources rule-identical
to v16, JS and media byte-identical; every page "changed" only because its seven stylesheet links
became one 208KB per-page bundle (`assets/pages/<page>.css`, the same sheets concatenated under
`SOURCE:` banners); the three legal pages gained a `.legal-richtext` wrapper and two copy tweaks; new:
`cms/legal-pages/` (schema, CSV, JSON), `cms-templates/legal-page-template.html`, two importer guides.
His guides describe a paste-the-CSS importer's workflow; they are context, not instructions.

### Done (commit: see below; live seq 27, 30 pages + 3 collection rows published)

- **Process**: `21-instatic-upload/package-intake.mjs` — unpack beside the previous package, write
  the factual change report (`client-handoff/intake-vNN.md` + `.json`) before anyone touches a
  patch. Documented as step 0 in the directive ("how a new package of Sang's goes in").
- **Unbundled CSS on read** (`prepare-source.mjs` → `unbundle`): a per-page bundle is split back into
  virtual sheets at their original paths and the page's link tag into one per source (v16 format, so
  the home patch still anchors); pages that disagree on a source refuse. Downstream unchanged.
- **Legal Pages collection** (`cms-collections.mjs`, `cms-sync.mjs`, `push-site.mjs` binding block,
  `patches/cms-templates/legal-page-template.html.mjs`): Instatic post-type table `legal`
  (`CId4CBUQNnL9Hve7Ey8Cf`, route base `/legal`, fields title/slug/footerLabel/eyebrow/intro/notice/
  body(markdown)/seoTitle/seoDescription/sortOrder), template page `legal-template` (built from
  Sang's template like any page; `template: postTypes [legal]`; nodes bound by his `data-cms-field`
  markers: footer_label/eyebrow/title/intro/notice → `{currentEntry.*}`, body → `base.outlet`), three
  rows published: `/legal/privacy`, `/legal/terms`, `/legal/hipaa-data-handling` (his slug). Row
  metadata is Sang's own `cms/legal-pages/legal-pages.json`; the body stays brandklout.com's real
  policies (2026-09-14 decision), converted HTML → markdown. **`/privacy`, `/terms`, `/hipaa` are
  gone** (replace mode) and every link to them now points at the entry route; Sang's "draft for
  counsel review" notice is an empty cell, hidden by `.legal-note:empty`.
- The three static legal-page patches are deleted (the collection replaces them);
  `agency/site.css` legal rules reworded and extended; gates read `pages.json` `entries` /
  `template` (verify-live checks each entry's h1, eyebrow, `<title>` and that the rendered body text
  equals the source text word for word; visual-diff/compare-live/css-parity skip the template page).

### Gates

- Local: `class-parity 1440` all identical (30 pages); `standard-check` 270/270 ok.
- Backups before the push: tag `brandklout-website-live-seq26` (2b1cf1d9), API snapshot
  `.tmp/backup-2026-09-15-seq26/` (+ plugins), container DB
  `/app/storage/backups/cms-2026-09-15-seq26-pre-v18.db`. Seq was 26 (nobody had edited).
- Shipped (0 warnings), pushed (saved seq 27), `cms-sync --apply` created the table and 3 rows,
  published 30 pages. Live: `verify-live` FAIL none (32 routes incl. the 3 entries; 10 retired
  routes 404 incl. `/privacy`, `/terms`, `/hipaa`, `/legal-template`); `css-parity` FAIL none;
  `visual-diff` 1440: index 0.133%, authority-score 1.894% (the same value as before this run: the
  assessment's runtime repairs), everything else ≤0.25%; `visual-diff 390`: index 0.269% (seq 26:
  0.270%), worst 0.304%; `form-probe`: the three forms post (aborted by the probe, as designed;
  same output as the v16 probe), the three entries read "Effective Date…" with disc bullets and no
  draft note; entry pages eyeballed at 1440 and 390 (h1 64.8px / 37.8px, bullets, notice hidden,
  no sideways scroll).

### Visible changes (tell Sang)

- Privacy / Terms / HIPAA are now **Legal Pages** in the admin's Data workspace (collection `legal`):
  edit the body as rich text there, add a page by adding a row; they live at `/legal/<slug>`.
  The old `/privacy`, `/terms`, `/hipaa` URLs 404 (Instatic cannot serve a row at the root, and has
  no page redirects; the site is not on the domain yet).
- Everything else is pixel-identical to seq 26 (the design did not change in v18).
- Not carried: `canonical_path` (no canonical in the published head), `show_market_prequalification`
  (no per-row visibility; the form shows on every legal page), `published` (row status).

### Gotchas

- **Instatic rows need two path segments** (`contentRouteFromPath`): a collection can never serve
  `/privacy`. A template page is never served at its slug (router skips templates), so its live
  gate is the entry route, not `/legal-template`. A site publish does not publish rows.
- A `<div>` with only text imports as `base.container` + one `base.text` (tag "none"); a binding
  goes on the child. Headings, spans and paragraphs import as `base.text` themselves.
- Keep sample text OUT of the outlet in the template: with it, `.legal h2/p` match static markup
  at build time and the class system resolves them onto own classes, and the markdown-rendered
  body (no classes) loses its styling. Emptied by the template patch.
- `<title data-cms-seo>`: Sang's template title tag carries attributes; the title regexes accept
  them now.
- Sang's template links its stylesheet root-relative from inside `cms-templates/`; prepare-source
  resolves from the page folder first, then the root, and writes the template at the root.
- The Instatic source on the container (`/app/server`, `/app/src/core`) is readable over
  `railway ssh` from `C:\Users\ACER\AppData\Local\Temp\bk-railway-link` and answered every
  collection question the admin UI could not.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
