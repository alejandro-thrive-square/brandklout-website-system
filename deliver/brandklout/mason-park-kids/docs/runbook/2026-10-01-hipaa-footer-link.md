# 2026-10-01 - "HIPAA Disclosure" in the footer's legal row, staging AND production

Follow-up to [`2026-10-01-hipaa-disclosure-page.md`](./2026-10-01-hipaa-disclosure-page.md): a footer link to
`/hipaa-disclosure`, in the legal row, right after Privacy. Nothing else was edited.

### Where the footer lives

The site has **no components**: the footer is inlined into all 216 page bodies. So the change is one
node per page: a clone of that page's Privacy `base.link` (same module, no class, `target: _self`) with a
new id, `href: /hipaa-disclosure`, `text: HIPAA Disclosure`, spliced into `.foot_legal`'s children after
Privacy. The row is `display: flex; gap` (no separator nodes) and `text-transform: uppercase`, so it reads
"PRIVACY  HIPAA DISCLOSURE" like its neighbours. Published markup, on every page:
`<a href="/privacy-policy" target="_self">Privacy</a><a href="/hipaa-disclosure" target="_self">HIPAA Disclosure</a>`.

**Source:** the same line in `home/index.html`'s footer, then `stamp.mjs` (215 pages stamped; `git diff`:
216 files, 216 insertions, all that one line). `stamp.mjs --check` 0 differ, `check.mjs` 216 pages 0 errors.
A future full push keeps it.

### Run

`workflows/03-core-pages/.tmp/hipaa/footer-link.mjs`: refuses unless `draftMatchesPublished`; writes the 216
rows through `PUT /site-document` incremental in batches of 40, each with the rows' `baseSeqs` and a fresh
`shellBaseSeq`; reads back (+1 node per page, link right after Privacy, no other row's seq moved); one publish.

| | Before | Published | After |
| :-- | :-- | :-- | :-- |
| Staging | 216/216, matched | 14:00:37 UTC | 216/216, matched |
| Production | 216/216, matched | 14:02:40 UTC | 216/216, matched |

### Verification

- `slots-diff.mjs` with `STRIP='<a href="/hipaa-disclosure" target="_self">HIPAA Disclosure</a>'` (each new page
  must hold it exactly once): **216/216 identical** on both instances once it and the per-publish tokens
  (script folder id, embed-origins `?v=`) are masked; scripts and CSS identical. So no pending OG overrides
  shipped this time.
- `verify-footer.mjs`: **216/216 pages on each host** serve Privacy -> HIPAA Disclosure exactly once, all 200;
  `/hipaa-disclosure` 200.
- `footer-shot.mjs` (Termly banner hidden), /contacts: **1440** one line, as before. **390**: four lines, against
  three without the link; no item breaks inside itself. That's the flex row taking one more item, not a regression.
- The Termly **Cookie Preferences** control (runtime, `brandklout-consent-preferences.js`) places itself after the
  first legal link that follows Privacy. That was Accessibility; it is now HIPAA Disclosure, so the row reads
  Privacy · HIPAA Disclosure · Cookie Preferences · Accessibility · Sitemap · Dental library · Mason Park Dental of Katy.

### Gotchas

- `slots-diff.mjs`'s container has no python3; the strip is `grep -oF` count + `sed`.
- The Termly banner covers the footer in any viewport crop; hide `#termly-code-snippet-support` first.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
