# 2026-09-24 - BugHerd round three: 127 notes, 126 done, published and verified

BugHerd project **540564** picked up **127 new notes (#42-#168)** on 2026-09-23/24, all from
BrandKlout Success in Chrome on Windows (a wide screen: the screenshots are 3840 px wide).
**126 are done, published to staging, verified live, replied to and moved to done.
#82 stays open**: its attachment arrived as 0 bytes, and the reply asks for it again. #34 and #38
are unchanged from 09-21 and got no new comment.

Published 2026-09-24 14:21 UTC (full chain, 215 pages, `draftMatchesPublished`, style rules
531 -> 546, site seq 55). A second push at 14:39 added #140's links to
/services/preventive-dentistry (see the first gotcha).

### Done (commit on `bk-mason-park-kids`, see git log for the SHA)

| Kind | Notes | What was done |
| :-- | :-- | :-- |
| Photo swaps | 44 46-50 52 53 55 56 60 62 63 66 70 72 74 75 77 80 83-85 87 89-91 93 97 102 103 108 117 126 127 131 134-139 142 143 147 148 150 152 155-158 162 167 168 | The reviewer's own attachments, 30 frames as `rv-*` keys (`REVIEWER` in `prep-images.py`, sources in `.tmp/_reviewer/`, gitignored). Where one frame came attached at several sizes, the largest copy was used (the hygienist and TV frame came at 874 px and at 2276 px). `bugherd-0924-images.py` is the plan: page, chapter, the image on screen, the new key. |
| Conflicting notes, later one wins | 54/141, 86/167, 136/155/156, 67/100 | #54 wanted a new photo in a band that #141 then deleted on every page. #86 and #167 name the same slot. #136 and #155 name the same hero, and #136's frame went where #156 asked. Each reply says which note won and offers to switch. |
| Photos removed | 122 133 160 163, 141 on 7 pages | The band figure and its wrap. #141 ("for all pages") covered every chapter with `id="questions"` that ended on a band: financing, new-patients, comprehensive, cleanings, invisalign, orthodontics, preventive. |
| Crop positions | 45 65 78 96 116 130 145, plus the new heroes | Classes, not styles: `.ar-bg.is-y40/.is-y55/.is-mid`, `.lf-figure.is-top`, `.ch-figure.is-band.is-y72`, `.sw-overlap_shot.is-y60`, `.pe-band.is-low.is-faces`, `.ab-mosaic .is-c.is-left`. #78 is `smile-flip`, the mirrored frame that already existed. |
| Copy | 42 43 58 67-69 71 73 98-101 107 109-113 115 118-121 124 125 128 146 149 153 154 | `bugherd-0924-copy.py`, exact replacements. The blog overview lines are also in `build-blog.mjs`. |
| Adult practice's doctor | 146, plus two not in any note | Dr. William Sung was named on /services/orthodontics (#146), on /services/special-needs-patient-care twice ("Drs. Sung and Nguyen", also in `recipes/10-departments.mjs`) and in one blog post (also in `blog-content.json`). All gone; `grep -rw Sung home` is empty. |
| Hours | 42 | /thank-you had a **seventh** copy of the old Tue/Thu 8-5 hours that round two missed (`ul.ty-hours`). |
| Layout, site-wide | 51 57 64 129 144 159 | `.lf-split` text column `align-self: center` when it is the shorter column. It is a no-op when the text is taller, so the sticky head still works. Blog articles are excluded (`:has(.bl-toc)`). |
| Spacing, site-wide | 61 92 94 114 161 | `--ch-pad` 8.5/7/6/5/4.25rem -> 6/5/4.5/4/3.5rem; `.iv-top:last-child` loses its 4rem; `.manifesto` 42ch -> 60ch. |
| Path cards | 79 151 | `.pa-card:not(:has(.pa-shot))` centres its words (every page). Sealants got `section.ch-path.is-grid` (journey.js keeps it static at 900 px and up) and lost step 2's photo. |
| Menu | 59 76 132 | Services has a second level: every category that has treatments, with "Cosmetic and gum care" added. It is stamped on all 215 pages. Desktop opens a flyout on hover or focus; the drawer uses the existing tap-once-to-open script. |
| The rest | 81 88/123 95 104 105 106 111 140 164 165 166 | Ribbon centred; "6 months" with a smaller unit (`.fig-n`/`.fig-unit`, journey.js counts into `.fig-n`); mosaic side photos fill their row instead of setting its height; breadcrumb padded rather than capped, so its rule runs full width; "forms" linked to Flexbook (what the old site's "Online forms" button did); the visit photo beside the steps; the blog topic count moved into the link; six "Learn more" links; the reviews split into short and long; "Write one" moved above the wall, linked to `maps.google.com/?cid=10994444486808824955` (checked: it carries the pediatric ftid); a "Jump to a topic" list on the FAQ. |

### Gates

- `check.mjs` 215 pages, 0 errors, 5 warnings (the same five). `stamp.mjs --check` 0 differ. All `home/` files are LF.
- `verify-0924.mjs` on staging: **118/118**. It covers every swap and drop row, read out of the plan, plus copy, menu, grid, padding, alignment, the unit, and review order and link.
- `nav59-probe.mjs` live: desktop hover, flyout and click to /services/sealants; phone drawer, tap a category (it opens), tap Bonding (it navigates). All pass.
- `audit-live.mjs` 215 routes at 1440 and 390. Every route has one fault: the Cookie Preferences control (runtime-inserted, no href, since 09-22). At 390 there are also 2 console errors, both `google is not defined` inside Google's own `init_embed.js`. There are no overflow, image, crop or tiny-text faults.

### Next

1. **#82**: reattach the homepage "comfort" band photo when the reviewer resends it (the reply asks).
2. #34 (GHL form URL) and #38 (re-check) are still where 09-21 left them. Confirm the hours with the practice before production.
3. `recipes/` and `build-pages.mjs` are now behind the pages on the photo swaps and most of the copy. The files are the source (03 README); do not rebuild a page from its recipe without porting this round first.

### Gotchas

- **An edit made after `to-instatic` has run does not ship.** #140 was written while
  `publish-0924.sh` was converting, and needed `publish-0924b.sh` (one page). Finish every edit
  before starting the chain, or plan the second push.
- **Desktop hover and focus rules leak into the drawer.** `.has-sub:focus-within > .masthead_sub`
  carries `translateX(-50%)`, and a tap that focuses the link (Android Chrome) slid the opened
  submenu half out of the panel. The drawer media query now resets the transform. This bug predates
  the second level; only a driven tap found it.
- **"Duplicate" attachments are not always duplicates.** Compare the crops on one sheet: #85 was
  wider than #91, and #127 was a different moment from #138/#147.
- **`prep-images.py` stopped at the last standard width that fits the source**, so an 899 px frame
  got only a 480 file. Reviewer frames now also get their native width.
- **Live `page.goto(..., 'load')` can hang on staging** (third-party tags); `bh-shot.mjs --live` waits for the DOM instead.
- **`nav59-probe` against live needs `waitForURL`.** A fixed 800 ms wait reported a failed navigation that was only slow.
- **The note's `selector_info.html` names the live image** (`/uploads/<hash>-<key>-960.webp`). Target the swap by that, not by `nth-of-type`.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
