## DONE 2026-09-09 — THE TITLES, THE IMAGERY, AND LOCAL RECONCILED WITH LIVE

Client, 2026-09-08: *"There are a lot of pages that don't have the last design
upgrade but I see a lot of errors on Instatic so I don't want to cascade those
errors to the redesign on rest of the pages. The titles crop. Please fix that.
Run a comparison between local and instatic to fix the errors on instatic. Use
more images and extract stock photos from Magnific. Increase image quality on
blurry images (using magnific ai generation). Don't stop until you finish
everything."*

All five, done and live. **The 46 migrated pages were repaired but NOT
redesigned** — that is the next job, and it can now start from a clean instance,
which is what the client asked for.

Full write-up, with the numbers and the two wrong turns: the **2026-09-09 pass**
section of
[`workflows/03-core-pages/README.md`](../../workflows/03-core-pages/README.md).
Read that before touching this again.

### The five things

1. **The titles cropped, on every page.** GSAP SplitText's masked line is a
   wrapper sized to the LINE BOX; the display line-heights here are at or below
   1 and Fraunces' ink overshoots at both edges. **131 headings**, up to 13px
   above and 11.8px below on the h1. Fixed by moving the clip
   (`clip-path: inset(-.18em 0)`) rather than the box, plus a longer reveal
   (`RISE = 150`). **131 → 0**, local and live.
2. **The comparison.** `audit-live.mjs` (new) walks all 57 routes: **285 faults
   on 57 of 57**. `diff-all.mjs` (new) runs `diff-live.mjs` over all eleven:
   **163 differences**. Now **0 faults** and **71 differences**, every one of
   which is the published page being equal or richer (see the README table).
3. **More images.** 14 frames bought from Magnific, 28 chapter photographs
   placed. Images inside `<main>`: **55 → 89**, no page below five.
4. **Image quality.** 12 of the practice's own frames re-emitted through
   Magnific's upscaler. **2 rejected** — see the gotcha below.
5. **Not cascaded.** Every repair to the migrated pages is keyed to a
   `legacy-migration.css` class name, so none of it can reach the eleven.

### The three real bugs the comparison found

- **The published site was setting every heading in the WRONG CUT of Fraunces.**
  Instatic's font installer only installs static instances, and a static
  instance ignores `font-variation-settings` in silence — so `"opsz" 144`, which
  is where this brand's display face comes from, did nothing on 57 live pages.
  Measured: `opsz` 9 and 144 both 1657px live, 1665 vs 1340 local. Fixed by
  self-hosting the variable woff2 through the media library
  (`upload-fonts.mjs`), declaring it as `Fraunces VF` in front of the static
  name, and rewriting the `url()` at import.
- **`<meta name="description">`, canonical, og: and JSON-LD were absent from all
  57 pages** — 228 of the 285 faults. An Instatic page row is a title, a slug
  and a body; nothing else in a `<head>` survives the import. Closed by
  promoting two plugins into `deliver/process/19-instatic-seo` and installing
  them here.
- **`figure` never got a margin reset locally.** Two homepage figures sat 80px
  narrower than their grid track. The PUBLISHED pages were right; the local file
  was wrong.

### Gotchas this run paid for

- **MAGNIFIC WILL INVENT A FACE, AND IT LOOKS FINE UNTIL YOU LOOK.** At 4x from
  a 300px source, Karen's portrait came back as a different woman — European
  features replacing East Asian ones — and Anabel's came back with a narrowed
  jaw and lightened skin. Re-run at 2x, both drifted the same way again. They
  are `skip` in `upscale-images.mjs` with the reason, and those two pages keep
  the soft 300px originals, because a sharp photograph of somebody who is not
  Karen is not an improvement to Karen's portrait. **Gia's and Kebra's, from
  the same 300px class, were faithful at 4x.** The difference is the source,
  not the setting. `contact-sheet.py` builds the before/after pairs; look at
  every face, every time.
- **`document.fonts.ready` lies.** It resolves when nothing is *pending*, which
  is true before the stylesheet declaring the faces has been parsed. It resolved
  at 12ms locally and 1016ms live — both before the fonts were even requested —
  and SplitText, splitting at DOM ready, baked the FALLBACK's line breaks in
  permanently. Same h1, same width, same font: two lines locally, three live.
  `document.fonts.load()` names a face and is the honest question; `journey.js`
  now waits on it before it splits anything, capped at 1200ms.
- **`import-styles.mjs` reads `instatic/site.css`, not `home/assets/site.css`.**
  Edit the stylesheet, forget to re-run `to-instatic.mjs`, and it ships the
  PREVIOUS one without a word. Cost one publish that changed nothing; caught
  because the byte count did not move.
- **Windows applies MAX_PATH before it resolves the `..`.** From this worktree's
  root, three of `prep-images.py`'s sources arrive as a 323-character string,
  fail as "no such file", and the same paths are 252 characters once collapsed.
  It reads as a missing file and it is not. `abspath` first, everywhere. The
  same trap ate a screenshot filename later in the run.
- **A gate that always reports the same harmless error is a gate nobody reads.**
  Two were nearly created: a two-source `@font-face` that 404s one path in every
  console, and Instatic's own anti-bot probe (a burst to random 80-character
  same-origin paths) counted as a failed request on all 57 routes. Both are now
  handled at the source rather than tolerated.
- **The font gates were checking a name, not a font.** `shot.mjs`,
  `verify-live.mjs` and `font-axes.mjs` all measured the literal family
  "Fraunces". Once the stacks led with "Fraunces VF", all three reported
  FALLBACK on pages painting the right font perfectly. They read the
  `--font-display` / `--font-body` tokens now.
- **Two Magnific stock frames were off-brand** — a grungy concrete wall and a
  bleak empty corridor — and were re-searched after `stock-sheet.py`. The pool
  is judged by eye before it is placed, exactly like the upscales.

### Verified

`check.mjs` 11 pages, 0 errors, 1 warning (the Doctors' bio, unchanged).
`shot.mjs` all eleven at four widths: 0 overflow, 0 broken, 0 console, both
faces painted. `crop-all.mjs` and `crop-all.mjs --live`: **0 cropped headings**,
11 pages x 2 widths, on disk and published. `verify-live.mjs` clean on all
eleven and on the migrated sample. `diff-all.mjs`: structure, visible text and
geometry **identical on every page**. `audit-live.mjs` at 1440 and 390 across
all 57 routes: 0 faults. `probe-legacy.mjs` on a migrated page: no text under
12px, contact band on `--sage-tint`.

### Next

1. **The 46 migrated pages still need the redesign.** That was the client's
   framing and it is now unblocked: the instance is clean, the stock pool and
   the `.ch-figure` scene exist, and `audit-live.mjs` will catch a regression
   across all of them in one run.
2. The nine open items in the README are unchanged, and **item 1 (the suite and
   the phone) now also decides what the JSON-LD publishes** — the schema states
   #104B and (281) 578-7100 because that is what every page states.
3. `configure-seo.mjs` sets `siteUrl` to the PUBLIC domain, which still does not
   point here. Correct at cutover, and the value to re-check on that day.
4. Carry the `webzite.open-graph` 1.1.3 fix back to `bk-dr-nahlah`'s
   `16-instatic-plugins`, which is where the two plugins are developed.
5. Unchanged: the domain cutover, the key revocation.

---
