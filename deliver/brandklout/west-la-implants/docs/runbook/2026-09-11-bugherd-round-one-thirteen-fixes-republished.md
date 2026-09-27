# 2026-09-11 — BugHerd round one: thirteen fixes, republished, all tasks answered and closed

**Commit:** see `git log` for `fix(west-la-implants): BugHerd round one`. Live at
<https://west-la-implants-production.up.railway.app/>, published seq 11.

## Done

Brandklout (`agency@brandklout.com`) left 13 tasks on BugHerd project **541030 "West LA Implants"**
overnight. Pulled with `08-qa/.tmp/bugherd/pull-bugherd.mjs` (tasks + comments + screenshots into
that folder), fixed in `04-design/.tmp/site-src/`, republished through `21-instatic-upload/`, every
task answered with a comment and moved to **done** by `reply-bugherd.mjs --apply`.

| # | Report | Root cause | Fix |
| :--- | :--- | :--- | :--- |
| 1, 6 | Headline / quote hard to read | Bodoni Moda at `opsz 96`, weight 400: hairlines vanish on a 1440 screen; unrevealed words sat at 14 % opacity | Display faces at weight 500, `opsz` 48/42/36, dim words at 32 % |
| 2 | Last treatments unreachable without scrolling the whole pin | Cards 26 rem wide → 1690 px of travel | Cards 19 rem, end card 22 rem → 904 px of travel, 4½ cards on screen |
| 3 | Head cut off on the portrait | `.par` overscan (inset −12 %) plus a −7…7 % parallax | No overscan, `object-position: center 8%`, scale-only settle |
| 4 | Photo strip not flush | Three aspect ratios in one row | One shared height (`24rem`, `18rem` under 1024) |
| 5, 11 | Descenders clipped ("gg", "y") | SplitText line masks clip at the line box; line-height 1.02 | `.wz-line-mask` gets `.18em` bottom padding with a matching negative margin; line-heights 1.04–1.14 |
| 7 | Bad frame of Leslie | 19.5 s frame, eyes half-closed | 20.1 s frame from the Master B-roll, new filename `still-leslie-smile-tablet.jpg` |
| 8, 9 | "Name crossed out" | Not the link: the `.tr-dots` progress bars sat across the link because the absolutely stacked stories outgrew `min-height:19rem` | `.tr-stories` sized from the tallest story in JS (measured in flow — `inset:0` stretches an absolute child); inactive stories `display:none`; underline moved from `::after` to a background gradient |
| 10 | Michael's face cropped | 800×535 photo in a 4:5 frame, centre crop | `object-position: 28% 45%` on that shot |
| 12 | Marquee should stop on hover | — | `pointerenter` eases `timeScale` to 0, `pointerleave` back to 1; velocity reaction paused while held |
| 13 | FAQ should mention the doctor | — | First answer rewritten around Dr. Barriere's training and the under-one-roof model |

Gates after republish: `verify-live` FAIL none · `css-parity` FAIL none · `compare-live` the two
trap-37 `margin-inline` artifacts only · `visual-diff` 2.7 % @1440, 2.8 % @390 (video frames and
re-encoding) · `verify-motion-live` FAIL none (four pins at 1440, three at 390, fonts loaded,
no overflow). Local: journey-audit PASS, probe-motion clean.

## Next

- Wait for Brandklout's second pass; the same two scripts pull and answer it.
- The client-verification list in the previous entry still stands (implant count, amenities,
  consent, logo).

## Gotchas

- **BugHerd's list endpoint hides the page and selector** — fetch each task by id and read the
  screenshots (memory). `pull-bugherd.mjs` does that and prints selector paths, which pointed at
  the exact nodes here.
- **A "strike-through" on a link that has no strike in the DOM is a sibling painting over it.**
  Check `elementsFromPoint` and the neighbours' rects before touching the link.
- **`offsetHeight` of an `inset:0` absolute child is the container's height, not the content's.**
  Measure with `position:static` temporarily.
- **The converter splits `background-position` into `-x`/`-y` longhands.** The page renders right
  but `css-parity` reports the shorthand missing; author the longhands in source so the gate stays
  honest (trap 41 in the directive).
- `upload-media.mjs` is keyed by filename and never re-uploads: a changed image needs a new name
  (hence `still-leslie-smile-tablet.jpg`), and the old file stays in the library.
- A second publish in one evening costs ~15 MB of volume; prune before it matters.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Runbooks are tracked.
