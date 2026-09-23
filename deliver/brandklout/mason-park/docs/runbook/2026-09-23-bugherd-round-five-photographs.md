# 2026-09-23 — BugHerd round five: 143 photographs, and every card of the grid gets one

The agency filed 143 notes on 2026-09-21 and 09-22 (#110–#253). Almost all say "replace the image
with the attached one" or "use the same format as 01 and put the image attached". A teammate also
sent a chat message with the same request: *the service pages with those six boxes should look like
the first one you corrected* (preventative, #103 in round four). **133 are done and verified on
staging, 10 wait on the agency**, plus #3 and #66 from earlier rounds. 18 more qualify cards that no
note covered got photographs, so every 3- and 6-card "Is this the treatment you need?" grid on the
site is fully photographed.

## Done

Implementation commit: see the commit that carries this file.

Pull: `.tmp/bugherd/tasks-2026-09-23.json` (251 tasks, 145 open), `open-2026-09-23.txt` is the
digest. Everything below is in `workflows/09-static-rebuild/.tmp/bugherd/`.

### How it was run

1. `resolve-2026-09-23.mjs` mapped every note to its local slot (section, card, current image,
   rendered size). `drift-2026-09-23.mjs` confirmed local == staging on all 34 pages first.
2. Six agents planned the crops in parallel against `plan-2026-09-23/BRIEF.md`, one per page group
   (A home/about/reviews, B contacts/oral/hygiene, C guards/fluoride/sealants, D cosmetic/
   restorative, E surgery/endo, F the 18 uncovered cards). Each looked at the note's screenshot and
   the attachment and wrote a box at the slot's exact aspect, plus alt text and flags.
3. `frames-2026-09-23.mjs` cut 149 frames (131 + 18) into `album-manifest.json`.
   `apply-2026-09-23.mjs` placed them: 128 re-points and add-medias from the notes, 18 fills, the
   expansions, and the Contact doctors.
4. `build-blog.mjs` rebuilt the blog for #160 and #120.

### The ones that were not a straight swap

| Note | What was done |
| :--- | :--- |
| **#120** "the same for all pages" | The building exterior is the invitation photo on **58 pages plus every blog page**, caption "Suite 104A, on the ground floor. Free parking at the door." About keeps its corridor because its hero is now the building (#122). |
| **#179** "do the same for all the pages" | The front-desk photo is the proof portrait on **37 pages**. Reviews, Oral Cancer Screening and Contact keep their own (#126, #139, #165). |
| **#160** | One rail photo (the building) for every blog article: `TOPIC_RAIL` in `build-blog.mjs`. |
| **#164** | Contact's three doctor cards are `svc-card is-shot` (3:4), each with a front-facing portrait. Dr. Sung: `dr-sung-standing-2`. Dr. Cho: a 3:4 cut of his headshot (`dr-cho-portrait`). Dr. Nguyen: cut from the Mason Park Kids Drive family shoot `CTP_TamNguyen2026-69.jpg` at `1490,960,540,720`, which keeps her children out (`dr-nguyen-portrait-2`; the first cut had her against the frame's edge). |
| **#158** | Blog topic tiles: the `<li>` is the grid item, so the `<a>` now fills it (equal heights). Names are `nowrap` at .08em from 992px up. |
| **#159** | The "brown rectangle" was `.bl-grid`'s own background showing through the empty cells of the last row. The rules are now each card's outline. |
| **#201** | `.ar-bg img[src*="mp-scanner-screen-2-"]` at `50% 85%`: the patient in the chair shows. |
| **#237** | Crop raised to end above the girls' carrier bags, so no Colgate branding shows (#239 asked for Colgate off that page). |
| **#130** | The old frame lived in `uploads/2023/11/`. The re-point now always writes `2026/09/`, and the stale `is-portrait` class is dropped. |

### Still open (todo on the board, each with a reply)

- **Empty attachments** — BugHerd stored a 0-byte file: #112, #125, #182, #185, #195, #228, #235, #252.
  #182, #195, #228 and #235 are qualify cards and carry a photo of our own until theirs arrives.
- **Duplicates on one page:** #178 (same bedroom photo as #147 on mouth-guards) and #202 (same
  shade guide as #206 on implant restorations). The first of each is placed; we asked for another photo.
- #3 and #66 from earlier rounds, unchanged.

### The 18 fills

Chosen by agent F, mostly licensed Freepik stock (the `MAGNIFIC` key), adult patients only:
airflow 6, bonding 3, comprehensive-care 3/4/6, crown-lengthening 2/3/4/6, extractions 6,
fluoride 3, root-canal 3, sedation 2/3/4/6, wisdom-teeth 6, implant-placement 2. Sources are in each
manifest entry's `source`. The originals (2–18 MB) are in `plan-2026-09-23/stock/`, gitignored media.

**Not done on purpose:** the eleven 4-card qualify grids (`svc-grid is-4`) keep cards 2 and 3
text-only. They are a staggered layout, and the agency's notes on those pages only asked for cards
1 and 4.

## Verified

Local: `check.mjs` **0 errors on 229 pages**. `sweep-live` against `serve.mjs` on the 59 changed
pages, **0 problems at 1440 and at 390**. `probe-topics-2026-09-23.mjs`: tiles equal and names one
line at six widths. `probe-heights --diff base` moved only Invisalign @390, +22px in the invitation
(the new caption wraps); the baseline is re-saved (`heights/base-before-2026-09-23.json` is the old one).

Live: `verify-2026-09-23.mjs` **0 failures**: 147 placements served, #120 58/58, #179 37/37, blog
rail and invitation on 5 articles, #158/#159 at 1280/1512/2560, #201's `50% 85%`, and every 3- and
6-card qualify grid photographed. `sweep-live` over all 61 URLs: one problem,
`/ads-landing-pages/new-patient-thank-you` logs a 404. **It was already in round four's sweep** and
this round did not touch that page.

Board: 143 comments posted, 133 moved to done. The open list reads `3 66 112 125 178 182 185 195 202
228 235 252`.

Backup first: `backup-staging.masonparkdental.com-2026-09-23T13-19-42.json` (63 pages, 779 media,
shell seq 108, draft == published). Push saved at seq 109. **Production was not written or read.**

## Gotchas

- **BugHerd can store an attachment as zero bytes.** The API lists it, the URL returns 200 with
  `image/png` and an empty body. Hash every download; `da39a3ee…` is SHA-1 of nothing.
- **A live `nth-of-type` is not the local one.** `article.rg-arc:nth-of-type(2)` on the home page is
  the third arc live. `div.wrap:nth-of-type(1)` never matches locally. `#reach` card 2 live is card 3
  locally. A pinned path resolves every pin to card 1. `selector_info.html` (the element as BugHerd
  saw it) is the tiebreaker.
- **"The same for all pages" changes captions too.** 58 invitation captions described the interior
  photo they used to sit under. Change the caption with the photo.
- **A plan edited after the cutter started is cut from the old plan.** #237's raised box missed the
  first run. Drop the manifest entry and files, and re-cut under a new key.
- **`shot.mjs` over 59 pages is hours**, because of the full-page screenshots. For "did anything break",
  `sweep-live-*.mjs` over a local URL list is minutes. Keep `shot.mjs` for looking.
- **Heredocs and Git Bash, twice more:** a `C:\\Program Files` path lost its backslashes, and
  `/services/x/` args became `C:/Program Files/Git/services/x/` (`MSYS_NO_PATHCONV=1`).

## Next

- The agency re-attaches the 8 empty files and sends replacements for #178 and #202. Each lands the
  same way: `frame.mjs` with a new key, a plan entry, `apply-2026-09-23.mjs`.
- Flags the agency may want to see (listed in the plan files' `notes`): several attachments look
  AI-generated; some carry before/after labels (cropped out); a few show teens or children
  (#127, #130, #155, #236, #237, the agency's choice, kept); two show a "Grand Mission Dentistry"
  shirt; #120/#122's building photo is Street-View-like.
- **Production is unchanged.** This round is staging only.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
