## 2026-10-05: legal pages: privacy tables and the SMS consent box (seq 50)

Reported (Sang, via Alejandro): the Privacy page's table and the Text Messaging Terms page's
consent statement look right in the editor but wrong on the live site.

### Cause

- **Privacy tables**: the `legal` row body is a valid GFM table. The publisher renders it to
  `<table>`, then sanitizes the outlet with `RICHTEXT_CONFIG` (`/app/src/core/sanitize.ts`, Instatic
  0.0.20), which has no `table/tr/td`. The tags are removed, so only the cell text is left. This is an
  Instatic bug, and no setting or CSS change fixes it.
- **SMS statement**: written as a ``` code block, so it publishes as `<pre><code>` and never wraps
  (3081px wide in an 820px column).

### Done (approved by Alejandro: "apply both")

- **Privacy row** (`Fewzt56AUBJdQpg-5Px_c`, PATCH cells + row publish): §7's 6-column table became
  one `### <category>` per row with `- **Examples:** …` / Sources / Purposes / Disclosed to /
  "Sold or shared for advertising" bullets; §8's 2-column table became `- **<information>:** <period>`
  bullets. The text is the same word for word. Sang can still edit it in the admin as normal text.
  Guarded on `updatedAt` 05:19:54.770Z (Sang's last save), so an edit made in the meantime would
  have stopped the write.
- **CSS**: two ambient registry rules, `.legal-richtext pre` (pre-wrap, overflow-wrap anywhere,
  left-aligned, light grey box, 1rem padding) and `.legal-richtext pre code` (0.875rem / 1.6), also
  in `agency/site.css`. First tried in `src/styles/site.css`, which had no effect: that code asset
  is scoped to 2 pages. Reverted to its original content (checked byte-equal).
- Three shell saves + site publishes (seq 48, 49, 50). The draft matched the published site before
  the first one, and the `legal-template` template flag was checked intact before each publish.
- Directive `21-instatic-upload.md`: a new trap (collection body tables are stripped) and a
  note on the code-asset scope.

### Verified (headless Chrome, 1440 and 390)

- `/legal/sms`: `pre` white-space `pre-wrap`, 0px overflow inside the box, 0px page overflow.
- `/legal/privacy`: 14 h3, 110 li, 0px page overflow; screenshots read correctly at both widths.

### Tell Sang

- Don't insert tables in legal pages. The editor shows them but the live site strips them until
  Instatic fixes its sanitizer. Use a heading per row and bold labels, like Privacy §7 now does.
- Code blocks are fine now (they wrap). A quote block is the more natural choice for consent text.

### Gotchas

- Backup of all four legal rows before the write (gitignored, this worktree only):
  `workflows/21-instatic-upload/.tmp/backup-2026-10-05-legal-rows.json`.
- `site.runtime.styles` scope for `src/styles/site.css` is `pages` with ids
  `qV8VNq2tnGtpdwnmIlcxG`, `dlEXYG6txH9CZjy31Czlx`. Rules meant for every page do not belong there.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
