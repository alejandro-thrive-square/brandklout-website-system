# 2026-09-26 - BugHerd round five: #174-#433, 242 closed, 8 waiting on the practice

BugHerd project **540564** had **252 open notes**: #188-#433, left 2026-09-24 to 26 on ~45 pages,
plus the older #34, #38, #82, #174, #176 and #182. Most of them name a photo **by its Drive
filename** (`AdobeStock_<id>`, `PXL_*`, `IMG_*`), and all 82 of those files are in the Mason Park shared drive.
The Drive token works again. `drive.mjs` is on `main`, not on this branch, so it ran from a scratchpad copy.

**242 are done, published to production (masonparkpediatricdental.com; staging is the same
instance), replied to and closed.** 8 stay open and wait on the practice (below). #38 and #82 are
unchanged (#82's attachment is still 0 bytes) and got no new comment.

### Done (commit on `bk-mason-park-kids`, see git log for the SHA)

| Kind | Notes | What was done |
| :-- | :-- | :-- |
| Photos from Drive | ~80 swaps and inserts | `_drive/` (gitignored) holds the originals. `prep-images.py` has a new `DRIVE` pool (keys `as-<id>`, `px-<date>-<time>`, `img-<n>`, EXIF-transposed). `bugherd-0926.py` has the plan: SWAP, PATH_INSERTS, BAND_INSERTS and GRID_INSERTS. AdobeStock_462171644 is a `.mov`, so the still at 1 s is used. |
| Site-wide | 211 223 229 ... (29 notes), ~20 caption notes, 323 | The "Credentialed by" strip is gone from **every page except home** (203 pages), because #229 says "it only needs to be on the home page". All 198 figcaptions containing "Suite 104B" are gone site-wide. The Facebook link is `profile.php?id=100080674540904` on all 215 pages, in the footer and in the JSON-LD. |
| Copy | ~70 | `bugherd-0926.py` COPY, REMOVE and HIDE_H1. #217 and #237 asked to remove an H1: it is now `h1.visually-hidden` with a descriptive title, so every page still has one. |
| Structure | 188 226 253 261 266 276 281 371 376 378-381 201 206 426 | `bugherd-0926b.py` and `-0926c.py`. The Parks Youth Ranch logo is a PNG rendered from the SVG (`svg2png.mjs`). The 12 insurer logos are rendered by `logos2png.mjs` from `_logos/` to `uploads/ins-*.png`. Composite fillings' last chapter is now Silver Diamine Fluoride, adapted from grandmissiondentistry.com without its price or doctor. Restorative has a sixth card, SDF. Six pages had a filled button labelled "Call (281) 578-7100" that opened Flexbook; it now says "Book now". |
| CSS | 192 207 230 247 298 316 355 360-363 387 391-394 427 | Appended at the end of `site.css` under "BugHerd round five". Scroll-written text starts at `--jr-unwritten` .68 on light grounds and .6 on dark ones (was .18 and .22, failed ADA). Kickers and arrow links on dark grounds use `--sage`. `.sq-shot` is a grid photo. `st-guard-flip` is a mirrored key (`MIRRORED`). |
| JS | 205 407 | `journey.js`: the `data-marquee` rows stop while the pointer is over them. |

### Open, waiting on the practice

- **#34, #198**: the kids practice has no GoHighLevel form. The adult account has Contact `JuzM9SxuJMPDMwfO6cgj`, Invisalign and NPS forms; using them would send kids leads into the adult account. The reply asks for a kids form with a "service" field, or permission to use the adult one.
- **#368**: no online-forms URL exists. The old PatientViewer page is broken and Flexbook is booking only.
- **#378-#381**: the lenders' generic apply pages are linked for now. CareCredit only lists the adult practice (457wjc, suite 104A). LendingClub is now Happen Bank; Grand Mission has `clientid=322356`, Mason Park has none. Alphaeon has no listing. The replies ask for the practice links.
- **#406**: no evidence of Invisalign Platinum and no badge. The reply asks for one.

### Publishes

- `publish-0926.sh`: the full chain, 215 pages, styles 552 -> 557, scripts, 95 new media, `draftMatchesPublished` (22:54 UTC).
- `publish-0926b.sh`: /services/comprehensive-pediatric-dentistry and /new-patients, for the #226 and #371 captions (23:12 UTC).
- `publish-0926c.sh`: /financing only, to fix a slip in my own follow-up to #374 ("We also accepts") (23:30 UTC).
- `verify-0926.mjs` on production: 101/101 (all 74 swap rows, the site-wide removals, the Facebook link, logos, SDF, the grid photo, the hidden H1s).
- Replies were sent with `reply.mjs --send`: 242 moved to done, 8 left open with a question.

### Gates

- `check.mjs`: 215 pages, 0 errors, 5 warnings (the usual five). `stamp.mjs --check`: 0 differ.
- Every new slot was checked visually at 1512 px (`bh-shot.mjs`): the head crops, the logos, the grid photo and the fillings path.

### Next

1. Swap in the practice's answers to the 8 open notes as they arrive: `add-inquiry.mjs` is the GHL starting point for #34/#198.
2. `recipes/` and `build-pages.mjs` are further behind the pages now. The files are the source.

### Gotchas

- **The site-wide caption pass only matched "Suite 104B".** #226 and #371 were other captions the reviewer also wanted gone, and they were found only when writing the replies. Check every "remove" note on a `figcaption` against the page, not against the pattern.
- **Bash heredocs ate `\n` in Python twice more** (`bugherd-0926.py` grid insert, `-0926b.py` captions). Write Python edits with the editor.
- `fetch.mjs` skips a download that already exists, so a 0-byte attachment never refreshes. Re-fetch it by hand to see whether the reviewer re-sent it.
- **`upload-media.mjs` failed a publish on "AMBIGUOUS in library"**: the first run stored `as-435979599-960.webp` twice (a retried upload). A same-name, same-size pair is the same file, so it now reuses the first copy; only a name clash at different sizes stays fatal.
- `bh-shot.mjs --live` now points at production (`masonparkpediatricdental.com`), because staging is the same instance.
- A `data-write` statement is split word by word by journey.js; do not put links inside one (#379's links went on the plain lines).

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
