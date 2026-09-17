## DONE 2026-08-26 (session 15b): pins #2-#6 LIVE, #7 blocked

Five of the six BugHerd pins are published and verified on drnahlah.com. Two
publishes: 21:12Z (#2-#5) and 21:4xZ (#6).

### #2/#3 — the specialist video  `patch-specialist-video.mjs`

Pin #2 was ALREADY BUILT by hand in the editor on 08-25 22:21Z; nothing to add.
What was there instead was a **regression**: the published rule carried
`grid-column:1; grid-row:2` and the DRAFT had lost it (a second hand-edit at
08-26 03:22Z, presumably a first swing at pin #3). Those two declarations ARE
the desktop layout — `.doc-grid` is `.82fr 1.18fr` above 900px and DOM order is
portrait, video, credentials, so with no explicit placement the auto-placer puts
the VIDEO in the credentials' column. Publishing the draft as found would have
scrambled Chapter 03. Restored, scoped to `(min-width: 900px)`.

Pin #3 is `order:1` on the base rule — every single-column width, not the
`mobile` breakpoint, which on this site is `(max-width: 375px)` and misses every
phone wider than an SE. Also fixed `aspect-ratio: 16:9` -> `16 / 9`; a colon is
invalid CSS and the declaration had been dead since it was written.

### #4/#5 — the mobile flicker  `patch-path-swipe.mjs` + `push-script-asset.mjs`

Session 14's built-but-unshipped work, finished and shipped. The registry half
was the missing piece: 2 edits (the always-on `filter:grayscale(1)` off
`.ch-path .pa-card .pa-shot img`, the hover pair behind `.wz-fine`) and 7 new
ambient rules for `.ch-path.is-swipe`. Then site.js. All 6 is-swipe rules
survived the tree-shake.

### #6 — Chapter 07 "The Services"  `push-services-section.mjs`

New section before `#proof`: 11 treatment pages as a typographic index (number,
name, one line, hairline grid). Deliberately not another image grid — Standard
above it is four photos and Proof below opens on full-bleed video.
`#proof` -> chapter 08, `#invitation` -> 09, labels and attributes both.
6 class rules + 16 ambient rules + 64 nodes. Local source is
`css/39-ch-services.css` and the block in `pages/home.body.html`.

### #7 — BLOCKED

Needs a Magnific API key. Agreed env var: **`MAGNIFIC_API_KEY`** in the repo-root
`.env`. Note the 43 articles are NOT in the pages table — they are CMS rows
behind the `post` template.

### Gotchas earned this session

- **`insta-api.mjs pages` returns `[]`.** The CLI reads `.pages`; the endpoint
  answers `{rows}`. The library is fine, the CLI command is not. Not fixed.
- **`changedPages` entries are FLAT** — `{id, slug, title, nodes, rootNodeId}`,
  not `{cells:{...}}`. A nested one is a bare `400 Invalid request body`. Always
  build them with `toChangedPage`.
- **`baseSeqs: {}` is a 409, not a default.** It must carry `{[page.id]:
  page.seq}` per page written, alongside `shellBaseSeq`.
- **Do not verify a page write by matching hrefs across the whole page.** The
  drawer and footer are in the same node tree, so "11 service links" read as 30
  and the script cried failure over a write that was perfect. Walk the subtree.
- **`site.conditions` is already sorted** max-width desc then min-width asc, so
  REUSING an existing condition is safe and inventing one is not (a new id lands
  at the end of the array and emits after everything). 620px and 1040px were
  already there; the services grid rides those rather than adding 619.98/1039.98.
- **The nav progress bar divisor was a hardcoded `(i/8)`.** Adding a 9th chapter
  would have driven the last two sections past 100%. Now derived from the highest
  `data-chapter` on the page, so the next insertion cannot reintroduce it.
- **The local design package and Instatic have DIVERGED.** `site-src` has no
  Vimeo embed in `.ch-specialist` — that node exists only in Instatic, added by
  hand. The package is supposed to be the reference; it is currently behind.
  Anyone regenerating the home page from it would delete the client's video.
- **`seo.json` has a mojibake** in `crowns-and-bridges.desc` (`practice?s`).
  Cosmetic, not fixed, but it will land in a meta description if regenerated.
