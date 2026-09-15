# 2026-09-15 - BugHerd staging round one: 24 of 27 fixed and live, 3 open with questions

BugHerd project **540564 "Mason Park Kids"**, 27 notes (#1-#28, no #5) from the agency,
left 2026-09-14/15. All 27 were on the **homepage**. The target was the staging Instatic only:
<https://staging.masonparkpediatricdental.com> (the same service as `mason-park-kids.up.railway.app`).
`masonparkpediatricdental.com` (the WordPress mirror on Pages) was not touched. Nothing was written to Asana.

### Done

- **Fetched every task by id** with comments, attachments and screenshots:
  `workflows/.tmp/bugherd/fetch.mjs` -> `tasks.json`, `summary.txt`, `shots/` (gitignored).
  Every screenshot was looked at before any fix was decided.
- **Fixed locally, gated, and published** the homepage row, `site.css` (code asset) and the script
  bundle. Shell seq 38, 215 pages published, draft matches published. Backup first:
  `backup-mason-park-kids.up.railway.app-2026-09-15T19-23-51.json`.
- **Verified live** at 1440 and 390 with the new `03-core-pages/.tmp/section-shots.mjs live`.
  Over the hero, the Home pill reads white on rgba(255,255,255,.18). The review is 68 of 68 words
  written at mid-window. The rail drifts about 36px/s and holds under the pointer. No page errors.
  Every changed string was grepped in the live HTML. `diff-all --only /` matches: structure identical (533/533).
- **Replied on all 27** with `reply.mjs --send` (plan in `replies.json`, result in `reply-log.json`).
  24 moved to done, 3 left open.
- Commits: `94a5ef6c` (the verify-safe report from the 09-15 mirror clean-up, checked: it is the
  re-run over `mirror-clean`, 1562 files, 41 pages, the new loader check) and `77c30292` (this round).

### Per-number disposition

| # | Note (short) | What was done | Status |
| :-- | :-- | :-- | :-- |
| 1 | Can't see (Home pill) | White text on a near-white pill over the dark hero. Now a white-glass pill, sage when solid. Not a palette change. | done |
| 2 | Hero too zoomed in | Hero is now `gumball` (album frame 171, shared front of house), `.ar-bg.is-mid`. `smile` moved to path card 3. | done |
| 3 | "Dr. Tam Nguyen is a board certified pediatric dentist" | Intro opens with that sentence. Board certification is on the old about page. | done |
| 4 | Approved colours and fonts? Brand guide in the Drive | **Question.** We don't have the Drive guide. The kids site uses slate/sage from the kids logo, plus sun/sky and Fraunces/Nunito. The family practice's Figma palette (copper #8C6349, Newsreader/Nunito Sans/Karla) differs. Changing it would be a brand change, so nothing was changed. | **open** |
| 6 | Caption hidden | `data-drift` scaled the photo over its own caption. Drift removed from `.ft-media`, caption lifted. | done |
| 7 | Line brings no value | "Board certified in pediatric dentistry, and trained at Boston University to treat children from six months old." (bio facts) | done |
| 8 | Add Silver Diamine Fluoride | Added to the 6-9 stage. It was not on the old site. The agency asked for it, and the reply invites a wording check. | done |
| 9 | Add the ® | Invisalign® in the teen stage and on its tag. The menu item is unchanged (chrome on every page), which the reply mentions. | done |
| 10 | Mason Park Dental of Katy down the hall | Sentence changed. | done |
| 11 | Not a hospital setting | Removed from the homepage card. **Question:** the old site said general anesthesia is "at HCA West Houston", and ~10 other pages still say "hospital setting". | **open** |
| 12 | Cavity Free Club | Comfort-shot caption rewritten. | done |
| 13 | Heading doesn't make sense | "Meet the dentist your child will grow up with." | done |
| 14 | Board Certified Pediatric Dentist | `pe-role` changed. | done |
| 15 | Another fact about Dr. Nguyen | "Also here: Dr. Cho" -> "Hometown: Houston, born and raised in the southwest of the city" (bio). | done |
| 16 | Make this a pediatric photo | Team band -> `shelf-kid-2` (album 125, front of house), `.pe-band.is-low`. | done |
| 17 | Sentence doesn't make sense | Band line rewritten. The unverifiable "nine people" is gone. | done |
| 18 | Should be coloured | `.pa-shot img` greyscale-until-active removed. Not a palette change. | done |
| 19 | Colour, another photo, no repeats | Colour, and `knee-2` -> `smile`, so the knee-to-knee exam appears once. | done |
| 20 | Link documents, call, book | Card 1 links tel, flexbook and /new-patients/. | done |
| 21 | "Get the chair" sounds grim | Rewritten ("climb up into the big chair..."). | done |
| 22 | So you and your child see | Sentence changed. | done |
| 23 | Was this on their site before? Highlight | **Answered from evidence:** the paragraph is word for word on the old /new-patients/ (recovered `pages/new-patients/rendered.txt`). Card 6 is now `is-give` (sage), retitled, with a link. | done |
| 24 | Special is buried | `.ar-offer` pill in the hero, linking /special-offers/ ($129 matches that page). The CTA card stays. | done |
| 25 | "What parents have to say" | Heading changed. | done |
| 26 | Needs to get dark faster | `data-write` now runs `top 85%` -> `center 50%`, site-wide (29 other pages carry it). | done |
| 27 | Rotate, stop on hover | `data-rail` is now an auto loop with aria-hidden inert clones, paused on hover/focus, only on screen and ≥900. Also affects /our-services/. | done |
| 28 | "I've updated this image" | **Not found:** no Instatic upload after 09-09 (kids or family instance), album frame 171 byte-identical, no attachment, the CMS home row unchanged. Asked for it to be attached. It will replace the hero gumball frame. | **open** |

The invitation photo became `desk-1` (album 39, front desk, captioned as shared) so the gumball scene appears once.

### Next

- #4: apply the brand guide once the agency sends it or confirms a palette. That is a site-wide token change, so run every gate over all 215 pages.
- #11: if confirmed, strip "in a hospital setting (at HCA West Houston)" from the pages listed by
  `grep -ri "hospital setting" 03-core-pages/home` and from the three recipe files in `.tmp/recipes/`.
- #28: when the edited file arrives, run it through `prep-images.py` as `gumball` and swap it in the hero.
- Optional: the ® on the masthead "Invisalign" item (chrome: edit the homepage, `stamp.mjs`, all pages).
- The JSON-LD `image` on the homepage still names `team-1440` on `pediatricdentistkatytx.com`. It is
  written by the SEO plugin at publish, with the canonical-domain question from the 09-14 run.

### Gotchas

- **`import-pages.mjs --only` matches the CONVERTED slug, `/` for the homepage, not the CMS slug `index`.**
  In Git Bash a bare `/` argument becomes `C:/Program Files/Git/`: use `MSYS_NO_PATHCONV=1`. The same
  applies to `diff-all.mjs --only /`, which silently compared nothing with `--only index`.
- **The review "Mason Park Kids album" did not exist as a separate link.** The kids' own photography
  is the recovered WordPress media (`g7`, `HS-*`, `MPD-2`, `Action-16`, `2024/11/1.png`, `2.png`). The
  rest of the 2023 shoot is listed in `media-originals.tsv` but was never mirrored, and the
  SiteGround host is suspended.
- **A `data-drift` photo overlaps whatever follows it in the same box**: scale 1.09 + yPercent 4.
  Don't put a caption under a drifting image without a clip.
- **`listMedia` returns `{ assets: [...] }`**, and `replacedAt` is how an in-place replacement would show.
- The BugHerd list endpoint still hides page/selector/screenshot. The by-id fetch is the only way in.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
