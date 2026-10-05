## 2026-10-05: legal pages get real tables (code-block convention) + staging re-seeded from production (prod seq 51)

Reported (Sang, via Alejandro): the Privacy page's table and the Text Messaging Terms page's
consent statement look right in the editor but wrong on the live site.

### Cause

- **Privacy tables**: the `legal` row body is a valid GFM table. The publisher renders it to
  `<table>`, then sanitizes the outlet with `RICHTEXT_CONFIG` (`/app/src/core/sanitize.ts`, Instatic
  0.0.20, unchanged on upstream `corebunch/instatic` main), which has no `table/tr/td`. The tags
  are removed, and the header row's text disappears completely. Instatic has no plugin hook on this
  path, and the leftover text can't be rebuilt because the header is gone.
- **SMS statement**: written as a ``` code block, so it publishes as `<pre><code>` and never wraps
  (3081px wide in an 820px column).

### Done

1. **Code blocks wrap** (seq 48-50): two ambient registry rules, `.legal-richtext pre` (pre-wrap,
   overflow-wrap anywhere, left-aligned, light grey box) and `.legal-richtext pre code`, also in
   `agency/site.css`. NOT in `src/styles/site.css`: that code asset is scoped to 2 pages.
2. **Interim bullets** (morning): the two tables were rewritten as headings and labelled bullets.
   Alejandro: "Sang wanted to have the table." Replaced by step 3.
3. **Real tables, Sang-editable** (seq 51): `agency/legal-tables.js`, appended to
   `src/scripts/site.js` between `bk legal-tables START/END` markers (`push-site.mjs` now appends it
   too). Any `<pre>` whose lines all start with `|` and whose second line is a `| --- |` separator
   becomes a real `<table>` (th scope col/row, explicit ARIA roles); every other code block is left
   alone. `**bold**` is supported, and `\|` is a literal pipe. At ≤767px rows stack into labelled
   cards. The CSS is injected by the script itself, because the registry only keeps rules it can
   bind to imported markup. The editor round-trips a code block verbatim
   (`markdownDocument.ts` codeBlock ⇄ ```lang\ntext\n```), so Sang's edits keep the table intact.
   - The privacy row body = Sang's 05:19 production body plus four ``` lines (proved identical
     with the fences removed). The write was guarded: it would have refused if the live body was
     not the bullet version published this morning.
   - Tested on staging first: 2 tables (6×9 and 2×9), the SMS block not converted, 0 overflow at
     1440/991/390, no page errors. Then the same check on production: identical results.
4. **Staging re-seeded from production** (Alejandro: "clone production to staging … keep working
   from there"). Staging dated from 09-22; Sang has edited production directly since then.
   - Backup of staging before the replace: `backup-staging-pre-reseed.zip` (34.6 MB, 43 files,
     zip-tested) and the production bundle `prod-2026-10-05.zip` (35.85 MB, 62 files), both in
     `workflows/21-instatic-upload/.tmp/` (untracked).
   - `clone-site.mjs --from https://brandklout.ai --to https://staging.brandklout.ai --strategy replace --media`:
     5 tables, 38 rows, 61 media, 1 redirect, 4.8 s.
   - `publish-rows.mjs --table 7MSc_TW0bEkr46Rntb9e_`: 4 of 4. Site publish: 31 pages.
   - **`clone-plugins.mjs` deliberately NOT run**: same three plugins and versions on both
     (aeo-schema 1.2.0, open-graph 1.1.2, embed-origins 1.5.1), and staging's settings differ only on
     purpose (`siteUrl` staging host, `emitCanonical` false, AEO `@id`s on staging). Running it would
     have overwritten them with production's. After the import, Open Graph page data matches
     production on all 31 pages once the host is normalised.
   - Gates: `diff-sites` 31 compared, 31 content-equivalent, 0 differences (srcset a=43 b=0, known);
     `check-noindex` OK (staging `noindex, nofollow`, production untouched); tables render on both.

### Tell Sang

- To add a table to a legal page, insert a **code block** and type it in markdown table syntax:
  `| Column | Column |`, then `| --- | --- |`, then one `| … | … |` line per row. In the editor it
  shows as text in a grey box; on the live site it's a real table, stacked into cards on phones.
- Don't use the editor's own table tool: Instatic strips it on publish (its bug), and the header
  row is lost.
- Staging (`https://staging.brandklout.ai/admin`) is now a fresh copy of production.

### Gotchas

- **Staging goes stale whenever someone edits production.** Before promoting anything from staging
  with `clone-site.mjs`, re-seed staging (or promote with `merge-overwrite --rows` only for rows
  changed on staging) — otherwise Sang's production edits are overwritten.
- `clone-site.mjs --dry` piped into `tail` never exits on Node 24 / Windows (the bundle is written,
  then the process hangs). Redirect to a file instead.
- `site.runtime.styles` scope for `src/styles/site.css` is `pages` with ids
  `qV8VNq2tnGtpdwnmIlcxG`, `dlEXYG6txH9CZjy31Czlx`. Rules meant for every page do not belong there.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
