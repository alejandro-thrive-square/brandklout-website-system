# 2026-09-15 — BugHerd round two: five fixes, republished, all tasks answered and closed

**Commit:** `6247535f` `fix(west-la-implants): BugHerd round two`. Live at
<https://west-la-implants-production.up.railway.app/>, published **seq 12** (was 11).
Pre-push tag `wla-pre-bugherd-round-two` (local) on `43defebc`.

## Done

Brandklout (`agency@brandklout.com`) left five tasks on BugHerd project **541030** on 2026-09-14,
all on the staging instance above (the only target). Pulled with `08-qa/.tmp/bugherd/pull-bugherd.mjs`
(run from the worktree root, output dir as argv), fixed in `04-design/.tmp/site-src/`, republished
through `21-instatic-upload/`, answered and closed with `reply-bugherd.mjs --apply`.

| # | Report | Points back to | Root cause | Disposition |
| :--- | :--- | :--- | :--- | :--- |
| 14 | "issue remains" on the hero `h1` line 2 ("surgery.") | **#11** (agency commented "not fixed, issue remains" on #11 one minute earlier) and #5 | Round one padded `.wz-line-mask`, but `.wz-line` inside it kept `overflow:hidden` at its own 1.04 line box, so the g/y tails were still cut flat | **Fixed, closed.** Both boxes get `padding .14em/.26em` with matching negative margins (longhands, trap 41). Comment-only note on #11 (stays done) |
| 15 | "Remove these chapter's" on the "Chapter 02 · The Answer" label | — | — | **Fixed, closed.** "Chapter NN ·" removed from all seven labels; the short names stay as gold eyebrows. Reply offers to drop the eyebrows entirely if they want |
| 16 | Doctor's face cut off, first surgeon-strip photo | — | 2:1 photo, doctor in the right third, centre crop, plus the `.par` overscan cropping the top of his head | **Fixed, closed.** `.su-shot--doctor`: `object-position:100% 50%`, `scale(1.3)` from the top right, `.par` removed (no parallax on this one) |
| 17 | "Again this photo is not a good one of this patient", transformation shot | **#7** | Round one changed **Leslie's** frame because #7's selector said `tr-shot:nth-of-type(1)`, but #7's screenshot showed **Emily** mid-blink (`still-emily-smile.jpg`) | **Fixed, closed.** Emily's slide uses the practice's own photo `emily_dentalimplant_westlaimplant_barriere2.jpg` (real, already in the library), `object-position:90% 40%`. The same blinking frame was also on answer card 06 → `still-emily-mirror.jpg` (her B-roll, eyes open), `63% 50%`. `still-emily-smile.jpg` is off the page |
| 18 | Review quote font hard to read | — | Bodoni Moda at 1.25rem on the dark ground | **Fixed, closed.** `.pf-quote p` in **Manrope** (the brand text face), 400, 1.12rem / 1.6; `serif` class removed from the three `<p>`. Headlines keep Bodoni |

No task needed the agency, so nothing was left open with a question.

Gates after republish: `verify-live` FAIL none · `css-parity` FAIL none · `verify-motion-live`
FAIL none (pins, scrubs, story swap, console clean, no 390 overflow) · `compare-live` the two
trap-37 `margin-inline` artifacts only · `visual-diff` **6.1 % @1440, 2.5 % @390, no height
delta** once the Sienna widget is blocked (bands: hero film, precision film, JPEG→WebP re-encoding
on the answer cards and surgeon strip, checked side by side). Each fix also captured live at 1440
and 390 and read by eye.

Backups before the `--force` push: git tag, API snapshot
(`21-instatic-upload/.tmp/backup-2026-09-15-pre-round-two/`, uncommitted, via the copied
`.tmp/backup-live.mjs`), and `VACUUM INTO /app/storage/backups/cms-2026-09-15-pre-round-two.db`
(9.8 MB). Draft was seq 11 with `draftMatchesPublished:true`, so no admin edits were overwritten.

## Next

- Wait for Brandklout's third pass; the same two scripts pull and answer it. `reply-bugherd.mjs`
  now holds the current round only (`REPLIES` close, `NOTES` comment without closing) — replace
  both objects each round.
- **Tell the agency about the Sienna widget** (see Gotchas): it is theirs or the platform's to keep
  or remove, and it currently shrinks the Manrope quotes to 16px on live.
- Client-verification list in the standing RUNBOOK still stands.

## Gotchas

- **Trust the BugHerd screenshot over the selector on stacked slides.** `.tr-shot`s are absolutely
  stacked with clip-path; BugHerd recorded `nth-of-type(1)` (Leslie) while the visible slide was
  Emily. Round one fixed the wrong patient and the agency came back with "Again".
- **A SplitText mask padding does nothing while the line inside it also clips.** Check the computed
  `overflow` of both `.wz-line-mask` and `.wz-line`, then zoom the screenshot (ffmpeg crop+scale)
  before calling descenders fixed.
- **The live page loads a Sienna accessibility widget** (`data-wz-site-script`, jsdelivr) that is
  not in `site-src` and was already in the pre-push snapshot. It writes ~200 inline `font-size`s,
  rounded to px and sometimes snapshotted before the CSS applies (hero read 32px for the first
  seconds). It made `visual-diff` read 15.9 % / 31.8 % with the page 66–220px off; blocking it
  made live and local identical in every section top. `visual-diff.mjs` now blocks it — trap 42.
- **Headless screenshots under ScrollSmoother:** element screenshots and `clip` both mis-capture
  after a `smoother.scrollTo`. Scroll with `smoother.scrollTo(smoother.offset(el,'center center'))`,
  then `page.screenshot({clip:{…rect, y: rect.y + scrollY}, captureBeyondViewport:false})`.
- `dist/` is **gitignored** (`.gitignore:70`), not a committed snapshot — rebuild before any gate.
- `upload-media.mjs` skipped everything: both Emily images were already in the library under
  their own names; only `set-alt.mjs --apply` had work (2 alts).
- `tasks.json` holds unauthenticated `files.bugherd.com` screenshot links — keep it uncommitted.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Runbooks are tracked.
