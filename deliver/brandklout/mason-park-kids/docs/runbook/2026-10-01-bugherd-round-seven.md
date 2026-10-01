# 2026-10-01 - BugHerd round seven: #507-#515, 8 closed on staging, 13 still on the practice

BugHerd project **540564** had **21 open notes**: 8 new ones (#507, #509-#515, left 2026-09-30; there is no #508)
plus the 13 carried from round six. None of the 13 had a new comment from the practice.

**Published to STAGING only** (staging.masonparkpediatricdental.com). Not promoted to production.

### Done

| Note | Page | What was done |
| :-- | :-- | :-- |
| #507 #509 #510 | / `#comfort`, card 1 | Heading "You stay in the room." -> "Designed for them."; paragraph replaced with the reviewer's text verbatim ("...designed for your child in mind..."); a `link-arrow` "Book an appointment today" to flexbook (same URL as the header Book button), new tab. |
| #511 | /our-doctors `#measure` | `ch-note` "Every number is the practice's own..." removed. |
| #512 #513 | /our-doctors | Captions "A knee-to-knee exam" and "Dr. Nguyen, with her patients" removed; the photos stay. |
| #514 | /our-team ticker | Not markup. `journey.js` `[data-marquee]` duplicated the words once; after round six cut the team to five names a run was ~640 px, so the doubled row left the strip half empty. It now repeats the words until one run is 1.2x the strip, then doubles that; the loop period also counts the flex gap between the runs (it jumped by half a gap at each wrap). |
| #515 | /services/dental-hygiene-education `#invitation` | `st-brush` -> `as-1781157191` (Drive `AdobeStock_1781157191.jpeg`, pulled with `scripts/drive.mjs get`, encoded by `prep-images.py --only`). |

All in `workflows/03-core-pages/.tmp/bugherd-1001.py` (reuses round five's helpers like `bugherd-0929.py`), except #514, which is in `home/assets/journey.js`.

### Publish

`publish-1001.sh`: a partial chain: backup, to-instatic, upload-media (1 new file), ship-payload, run-convert, fetch-nodes, body class, alt, **import-scripts** (journey.js), `import-pages --only /,/our-doctors,/services/dental-hygiene-education,/our-team --publish`, then `add-elfsight-reviews.mjs --apply --publish` (the homepage re-import drops the widget). 215 published, draftMatchesPublished. Backup `backup-staging.masonparkpediatricdental.com-2026-10-01T12-36-42.json`.

`verify-1001.mjs`: 12/12 on staging (copy, removals, the swap, Elfsight on /, the #514 comment in a published script). `BASE=https://masonparkpediatricdental.com` checks production after a promotion.

Replies: `replies-1001.py` -> `reply.mjs --send`, 8 moved to done.

### Gates

`check.mjs` 215 pages, 0 errors, 5 warnings; `stamp.mjs --check` 0 differ. `bh-shot.mjs` at 1512 px: index#comfort, the hygiene invitation, our-doctors#measure, our-team#roster (with motion: the ticker is full).

### Open, waiting on the practice

- **#483**: PXL_20260714_221358715 is not in the Drive (asked 09-29, no answer).
- **#502 #504 #506**: seven staff headshots in Canva (asked 09-29, no answer).
- **#34 #198** (GHL form on /contacts), **#368** (online forms URL), **#378-#381** (practice lender links), **#38**, **#82**: unchanged since round five.

### Next

1. Promote to production on the user's go-ahead: `PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app bash publish-1001.sh`, then `BASE=https://masonparkpediatricdental.com node verify-1001.mjs`. No meta descriptions changed, so `populate-seo.mjs` is not needed.
2. The headshots and #483 when they arrive.

### Gotchas

- A marquee that duplicates its content once only works while one copy is wider than the viewport. Removing items (here, staff) can break it without anyone touching the script.
- The comfort card's new text is the reviewer's verbatim. "designed for your child in mind" may be meant as "designed with your child in mind"; it was not changed.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
