# 2026-09-29 - BugHerd round six: #434-#506, 70 closed, 4 waiting on the practice

**PROMOTED TO PRODUCTION 2026-09-29 23:43 UTC** on the user's go-ahead: `PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app bash publish-0929.sh` (backup `backup-mason-park-kids.up.railway.app-2026-09-29T23-24-47.json` first; payload verified; 215 published, draftMatchesPublished; Elfsight on / and /patient-reviews, so the 09-29 Elfsight run is on production too), then `populate-seo.mjs` against production (215 overrides). `publish-0929b.sh` was not needed: the full chain carries its three pages. `BASE=https://masonparkpediatricdental.com node verify-0929.mjs`: 73/73. Canonicals on the apex, no staging references, no noindex. Live render of /patient-reviews #wall and /our-team hero checked.

BugHerd project **540564** had **83 open notes**: 73 new ones (#434-#506, left on staging over ~20
pages) plus the ten carried from round five (#34, #38, #82, #198, #368, #378-#381, #406).
Most name a Drive photo (`AdobeStock_<id>`, `PXL_*`, `IMG_*`); `scripts/drive.mjs` works from `main`
now (no scratchpad copy needed).

**Published to STAGING only** (staging.masonparkpediatricdental.com), not production. Promote once
the practice has looked at it (see Next).

### Done

| Kind | Notes | What was done |
| :-- | :-- | :-- |
| Photos from Drive | 456-466 470 472 476-479 482 484 486 491 495 496, inserts 461 467-469 | `bugherd-0929.py` SWAP / PATH_INSERTS / GRID_INSERTS, reusing round five's helpers (it execs `bugherd-0926.py` without its `main()`). 25 new Drive keys through `prep-images.py --only`. |
| Crops | 454 455 473 474 480 481 484 485 495 496 498 | `CROP` rows add a class to the frame that holds the image; CSS at the end of `site.css` under "BugHerd round six". #498 is `ar-bg is-top` on /our-team. |
| #470 | | `as-569098023-flip`, a new `MIRRORED` key. |
| #473 | | The old still was a 99 KB JPEG of the ProRes clip. `as-462171644-sharp` is a lossless ffmpeg frame at 1 s, cropped to the mirror (1280x1080), encoded by hand (not a prep-images key). Shown with `.is-whole` (46rem, natural aspect), as is #474. |
| Copy | 434 435 437-440 442 443 445-453 487-490 493 494 497 499 | `COPY` in the script. $89 is on /our-services, /special-offers (+ meta) and /new-patients. |
| Removals | 436 441 444 447 448 492 | "Can I stay with my child?" left all four FAQs that asked it (home, /faq-page, /new-patients, /pediatric-dentistry-faqs-katy-tx); one blog post still answers it in prose, the reply asks. #444's statement was the whole `#reason` chapter, so the chapter went; `data-chapter` renumbered on /our-team and /patient-reviews. |
| Team | 499-501 503 505 | Gia, Kebra (front desk), Lizzie (assistant), Karen (hygienist) out of the wall and the ticker; Anabel is "Billing". "Anabel, Gia or Kebra" also sat on /new-patients, /our-team (booking line), /dental-saving-plan and /thank-you: now "the front desk". Counts ("nine", "three at the front desk") removed. |
| #475 | | Five FAQs added to /invisalign-faqs-katy-tx #general. Four answers are ours; the reply asks the practice to check them. |
| #406 | | The practice asserted Platinum in #435 #445 #453 #475, so the #how photo's caption now says so. Closed; the reply asks for the official badge. |
| #471 | | Round five's fix was `.ch-head h2 ~ .ch-note`; this note sits in an `.lf-head`. Added the `.lf-head` rule. |

### Open, waiting on the practice

- **#483**: PXL_20260714_221358715 is not in the Drive (221325464 is, 33 s earlier). Asked.
- **#502 #504 #506**: seven new staff headshots (Priscilla, Amanda, Nicole; Josh, Alison, Luis; Lola) are "inside of Canva". The Canva account in this Chrome (alejandro@) has nothing from Mason Park. Asked for exports to the Drive, and Lola's role.
- Round five's #34 #198 #368 #378-#381 (GHL form, forms URL, lender links) and #38 #82 are unchanged: no new comment.

### Publishes

- `publish-0929.sh`: full chain, 215 pages, styles, scripts, media, then `add-elfsight-reviews.mjs --apply --publish` (a re-import drops the widget).
- `publish-0929b.sh`: /services/invisalign, /new-patients, /our-team (the #406 caption and the last staff lines). See the first gotcha: three copies of it ran at once before one clean run.
- `populate-seo.mjs` on staging: the page descriptions live in the Open Graph override store, not the HTML, so the $85 in /special-offers' description survived the publish until this ran.
- `verify-0929.mjs` (BASE= for production): 73/73 on staging (swaps, inserts, copy, removals, both Elfsight embeds). Staging still sends noindex, and og:url is the staging host.
- Replies: `reply.mjs --send`, 70 moved to done, 4 left open with a question. The first send died on a network error after 13 comments; `reply.mjs` now skips a comment already on the note and retries dropped connections, so the re-run posted no duplicates.

### Gates

`check.mjs` 215 pages, 0 errors, 5 warnings; `stamp.mjs --check` 0 differ. Every crop checked at 1512 px with `bh-shot.mjs` (local).

### Next

1. Done: production (above).
2. The headshots and #483 when they arrive: staging first, then the same promotion.
3. /patient-reviews #wall still has the lede "The short ones first, then the longer stories, in full." beside the Elfsight widget, which has its own "What Our Customers Say" title. Both were written for the static wall.

### Gotchas

- **Never start a chain while another may be alive, and never wait on a chain by grepping its log.** `publish-0929b.sh` was made from `publish-0926b.sh` with a `sed '2,4d'` that also deleted `set -e`, so a failed `ship-payload` (Railway "error decoding response body") printed an error and the chain carried on. My wait loop saw "error" in the log, returned, and I started a retry while the first copy was still running; that happened twice. Three chains then shared `/tmp/mpkparts` on the container: each run's `rm -rf` and chunk writes clobbered the others, and the payload arrived at 269 KB of 1.43 MB (the sha check caught it). One stray `import-pages --only /services/invisalign --publish` was killed mid-run. Published staging was checked afterwards (verify, section counts) and was unaffected. Every chain needs `set -e`; before a retry, check with `Get-CimInstance Win32_Process` that no `ship-payload`/`run-convert`/`import-pages`/`railway ssh` is still running.
- `railway-ssh.mjs` now retries 8 times with a 3 s x n backoff (about 80 s) instead of 5 times over 10 s.
- **A crop helper that looks for `<figure class="` misses a bare `<figure>`** and classes the nearest ancestor instead (`np-tour` got `is-y45`). `crop()` now handles class-less frames.
- **Meta descriptions have two homes.** Editing `<meta name="description">` in `home/` does not change what staging serves; `populate-seo.mjs` copies it into the override store.
- **Don't name a person in alt text from a guess.** The man in PXL_20260714_212931964 was first labelled "Dr. Cho"; it is now "A dentist".
- The Drive "2026 Team Photo" is another practice's team, not Mason Park's.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
