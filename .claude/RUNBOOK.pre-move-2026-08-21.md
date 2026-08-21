# Runbook — session handoff

## Objective

Dr. Nahlah design build (`deliver/brandklout/dr-nahlah/workflows/04-design/.tmp`).
Two things this session: an architecture upgrade the client asked for (one central
stylesheet, JS that belongs to each section, no duplicate or renamed classes), and
the pages the build had not covered.

## The thing to read first

**The work was never lost.** The user believed a deleted Orca worktree had destroyed
progress. It had not — `bk-dr-nahlah` was intact on disk with six unmerged commits
carrying the site from 11 pages to 26. Only the Orca tab was gone. If this comes up
again: check `git worktree list` and `git log main..<branch>` before rebuilding
anything.

## Done this session

| Commit | What |
| :--- | :--- |
| `968ca25` | Vendored GSAP into `site-src/vendor/` — a clean checkout could not run its own gates |
| `bded0f4` | Ignored the stray Chrome profiles; `git status` went from minutes to 0.1s |
| `15298cd` | **Renamed 84 classes** so one name means one thing sitewide |
| `7e0dc06` | Fixed the drawer, which had been dead while 320 checks stayed green |
| `c28fcbb` | **One stylesheet + one JS module per section** |
| `2d601db` | `terms-conditions` and `thank-you` pages, 26 → 28 |
| `9798325` | Reconciled the live 301 map — 14 rules were hiding pages |
| `4390087` | SITE.md: 28-page state, complete exclusion list |

## Verify (all green at handoff)

```bash
cd deliver/brandklout/dr-nahlah/workflows/04-design/.tmp
node serve.mjs final-site 8903 &          # NOT python -m http.server
node site-src/copy-assets.mjs             # assets + vendored GSAP
node site-src/build-site.mjs              # 28 pages + assets/site.{css,js}

node site-test.mjs http://127.0.0.1:8903              # 484/484
node interaction-test-gsap.mjs http://127.0.0.1:8903/index.html   # 64/64
node css-vocab.mjs                                    # clean
node swap-proof.mjs http://127.0.0.1:8903             # 6/6
```

## Gotchas — each of these cost a round

1. **`python -m http.server` is not usable here.** Single-threaded; it resets
   connections under the parallel image loads and the resets surface as fake
   "broken image" failures. Use `serve.mjs`.
2. **A comment containing the literal text `<style>` or `<script>` will be
   matched by any extractor that does not mask comments first.**
   `pagekit.html` and `head.html` both describe the old architecture in prose.
   This wrote a stylesheet starting mid-sentence, and separately ate a comment
   tail plus the `gsap.min.js` tag and shipped the wreckage as the runtime.
3. **`\s` inside a JS template literal is not an escape.** `` `/\s+/` `` reaches
   the page as `/s+/` and splits class names on the letter s. Use `classList`.
4. **A gate that reads a class name agrees with the broken code, not with the
   design.** The drawer was dead for several commits because the stylesheet
   watched `.drawer.is-open` while the script wrote `open`; the test asked
   whether the element carried the class the *script* set. It now clicks the
   button and hit-tests a real link with `elementFromPoint`. Two traps in doing
   that: the drawer is `position:fixed; inset:0` at all times and hides with a
   clip-path, so its rect/visibility/opacity are identical open and shut; and
   the header deliberately rides above the open drawer, so probe *below*
   `#nav`'s bottom edge.
5. **`style-snapshot.mjs` lies unless it emulates reduced motion AND awaits
   `document.fonts.ready`.** Raleway vs the Arial fallback moves every text
   width ~2.5%. It also aligns by element identity, not index — removing one
   element shifted every later index and produced 5515 phantom differences.
6. **Do not flatten `.parent .child` selectors.** It was tried and reverted:
   dropping the ancestor drops the specificity it was carrying, and the snapshot
   measured 153 regressions across the comparison table, the hero and the
   whitening table. A component's own container is legitimate scope.
7. **Git commits in this worktree can take minutes** to return after writing.
   The commit lands; it is the post-commit walk that is slow. Run them with
   `run_in_background` and confirm with `git log -1`.

## Next

1. **Merge `bk-dr-nahlah` into `main`.** Main still carries untracked copies of
   the old 04-design `.tmp` state that will block the merge — move those aside
   first, keep `final-site/assets/` (gitignored media).
2. **`/tysons-study-club/` is Lorem Ipsum and live on the client's site.** Raise
   it as a defect. Nothing to rebuild from.
3. **The terms page assigns copyright in the site to PatientPop Inc.**, the
   former vendor, contradicting the footer on every page. Flagged in-page as
   `data-build-flag="copyright"`. Needs counsel before launch.
4. **Upload `drnahlah-301-redirects.reconciled.csv` (115 rules) when the 28-page
   build ships** — not before; the 129-rule file still matches what is live.
5. Still open from earlier sessions: hero video is 8.8 MB, the contact form has
   no `action` (three Flexbook URLs in play), the McLean current-patient phone
   conflict, and brand naming.
