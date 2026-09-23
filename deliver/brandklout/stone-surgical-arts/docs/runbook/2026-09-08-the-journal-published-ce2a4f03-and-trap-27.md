# 2026-09-08 — The journal published (`ce2a4f03`), and the font-instance trap

Picked up a Codex session that had built and shipped the blog and then stopped mid-verification
when its workspace ran out of credits. Its last screen showed a `verify-live` FAIL line and a font
size mismatch, both of which turned out to be misleading. Finished the verification, diagnosed the
one real difference, and committed.

## Done

- **`ce2a4f03`** — `/blog` overview plus three articles (`dermal-fillers-vs-botox`,
  `types-of-plastic-surgery`, `why-do-people-get-plastic-surgery`), rebuilt from the three posts
  sitting unused in `01-content-intake/.tmp/archive-text/`. Sixteen routes live, up from twelve.
- Both gates clean against the published site:
  - `verify-live.mjs` — 16 routes, 104 unique URLs, 241 asset references, 8 retired routes gone,
    16/16 distinct titles, `FAIL none`.
  - `compare-live.mjs` — **no differences**, all sixteen routes, 1440 and 390.
  - `blog-test.mjs` — 27 passed, 0 failed, including "article remains readable without JavaScript".
- Trap 27 written up in `21-instatic-upload.md`, with `font-instance-probe.mjs` next to it.
- Fixed a flag-parsing bug in `compare-live.mjs` (below).

## Gotchas

**The Codex screen lied twice, in opposite directions.** The `FAIL` line it ended on was
`FAIL  none` — the report's footer, not a failure. And the font size mismatch it was chasing
(`inter-600.woff2 local 24452 live 48256`) is real but inert. Read the whole report, not the tail.

**Do not swap the local fonts for Instatic's.** This is the trap I fell into and it cost the most
time. Instatic ignores `assets/fonts` and serves its own `/uploads/fonts/...` — one variable file
covering all four Inter weights against our four static subsets — so the binaries genuinely differ
and it looks like the obvious cause of the prose reflow. It is not: with scripts off the two builds
already measure *identically*, and swapping changes nothing.

Worse, `*.woff2` is in `.gitignore` (line 58), so the seven overwritten files could not be restored
with `git checkout` — there was no tracked copy. They came back only because `build-site.mjs`
copies fonts *from* `site-src/assets/fonts`, which still held the originals. If that had not been
true the recovery was `node site-src/get-fonts.mjs --force`. **Check `git check-ignore` before
overwriting anything under `.tmp/`; a lot of it is untracked and has no undo.**

**The real difference, and why it is not a regression.** With scripts ON the published article is
~30px shorter than local: one body paragraph sets in two lines live and three locally. Ruled out,
each by test, in this order — the font binaries, BugHerd (blocking `bugherd.com` changes nothing),
a runtime-injected stylesheet (the four Instatic stylesheets carry seven `@font-face` rules, all
same-origin, no `local()`), `document.fonts.add` (hooked ahead of every page script: zero calls),
`adoptedStyleSheets` (empty), a third-party webfont (no `fonts.gstatic.com` request; the same six
files load either way), and layout (640px wide either way, same size, line-height, spacing,
weight).

What it actually is: the same downloaded file resolving to a different **instance**.
`CSS.getPlatformFontsForNode` reports postScript `Inter` / 171 glyphs with scripts off and
`Inter-Regular` / 172 glyphs with them on. A 64-character string measures 480.41px against
479.80px — 0.13%, about **0.6px per line**. Invisible except where a long paragraph already sits on
a line-break boundary, which is exactly why twelve short-copy pages never showed it and the first
prose pages showed it at once. `node font-instance-probe.mjs <slug>` reproduces it in about twenty
seconds; a differing `postScriptName` between its two blocks *is* the condition.

**So `--runtime-layout` is a diagnostic, not a gate**, and it deliberately gets no `BENIGN` entry —
a tolerance wide enough to swallow a whole line would swallow a real regression too. The
scripts-off `compare-live.mjs` is the gate, and it passes.

**`--runtime-layout` was silently comparing the wrong thing.** It was not filtered out of `args`,
and the slug test `/^[a-z-]+$/` matches a long flag, so running it without a slug set the page list
to `['--runtime-layout']` and compared one non-existent page. Now all `--` flags are filtered. Any
new flag on this script needs the same treatment.

**`compare-live.mjs --shots` still crashes** with `Page.captureScreenshot timed out` on a full
sixteen-route run — `capture()` never closes its pages, so they accumulate. Unrelated to the above
and not fixed here; run without `--shots`, or a page at a time.

## Next

- `--shots` needs `pg.close()` in `capture()` before it can be used across the whole route list.
- The blog is published but has had no client review pass; BugHerd is still on the site.
