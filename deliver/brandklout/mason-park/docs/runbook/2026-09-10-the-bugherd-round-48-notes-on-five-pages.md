# 2026-09-10 — The BugHerd round: 48 notes on five pages, locally then to staging

**Instance:** `https://staging.masonparkdental.com`. Production untouched.
**Commit:** `50f74e9b` (this file's own SHA follows in the docs commit).
**Verified live:** published at 17:15Z, 57 pages, seq 76, draft matches published. `verify-live.mjs` (run with `MSYS_NO_PATHCONV=1`) clean on `/`, `/about-us`, `/our-doctors`, `/our-team`, `/patient-reviews` and `/services/invisalign`: 200, no broken images, no overflow. The live markup spot-checked by curl: the strip on the home only, `dr-sung-standing` on every doctor page and the provider band, the tree in both seals, no `ch-named`, the mouthguard line on the team page. Live first screens of About and Team captured in `.tmp/bugherd/first-live-*.png` match the local renders.

The agency reviewer left 48 BugHerd notes (project 539151) on `/`, `/about-us`,
`/our-doctors`, `/our-team` and `/patient-reviews`. The export with every note,
selector and screenshot is `workflows/09-static-rebuild/.tmp/bugherd/tasks-2026-09-10.json`.
The client had already swapped Dr. Sung's home portrait on staging by hand to the
Grand Mission studio portrait; that portrait also has his arms crossed (#16 asks for
none), so it is superseded by the standing frame below rather than mirrored.

## Done — by note number

**Home**
- #2 The hero stack is a link to `/our-team/` and its top frame flips through the three photographs (`stackCycle()` in `elevate.js`).
- #4 Lede: "sharing one building and serving families across Harris County."
- #5 Relay caption paints over the reveal and has more room. #6 Relay/Under One Roof gap tightened (chapter paddings ×.55 / ×.7).
- #7 "Sit back, relax, and watch your favorite show." #8 "How one building saves your family time." #10 Two specialties under one roof, each with its own suite. #11 A dedicated adult practice with its own waiting area; adults come here in their own right. #12 "Inside the adult practice". #13 A specialized team focused on adult needs, separate waiting area. #14 "Lifelong beautiful healthy smiles."
- #15 The People head is about the doctors; cards ordered Nguyen, Cho, Sung. #17 Cho's sedation note removed (replaced with his own bio's line). #18 Sung's note: "Fellow of the Academy of General Dentistry." #19 Nguyen's note: "Board certified. The children's side of the hall."
- #16 Dr. Sung's portrait is `dr-sung-standing` (Grand Mission, arms down) — here and on About, Doctors, Team and all 29 provider bands.
- #20 Band copy: a dedicated and specialized team behind both practices. #21 Band photograph is `team-huddle` (album 134).
- #22 "Then your next visit is booked before you leave, with the same hygienist."
- #23 The only Google review that names Dr. Nguyen (Erica Marrero, 2026-08-10, from the Trustindex JSON) replaces the deck's first card.
- #24 Credential label at .82 alpha. #25/#26 Seattle Study Club and AAPD marks at 4.6rem (`li.is-mark`).
- #27 "Come and see for yourself." #28–#33 FAQ answers name Mason Park Dental of Katy consistently and link to New Patients, Patient Resources, cleanings, cosmetic, crowns, all services and Contact.

**About**
- #34 Manifesto order Nguyen, Cho, Sung. #35 Facts: "Two practices — Two addresses, one building". #36 Seal mark is the tree. #37 Credential strip removed (from every inner page, see #41). #38 Pillars ordered Nguyen, Cho, Sung, Sung at full size, and the three reveal together (the stagger was what read as a fault). #39 Instruments lede rewritten. #40 Invitation shot is `desk-checkin-pair` (album 33, landscape).

**Doctors**
- #41 Every inner page's arrival is now a split (copy on ink, photograph right) and no inner page carries the credential strip. #42 The two dossiers share rows (subgrid), both portraits the same frame anchored to the top.

**Team**
- #44 The Named chapter is gone. #46 Arrival, roster, statement and invitation lead with the doctors; bylines ordered Nguyen, Cho, Sung with larger faces. #45 The pane holds a portrait frame, `team-window-smile` (album 85). #47 Under Emergencies: "Youth sports season? Ask about our mouthguards. #momlife #youthsports #askaboutourmouthguards", linked to `/services/mouth-guards/`.

**Reviews**
- #48 Seal mark is the tree. #49 "Every review on this page is a patient's own words, taken from the practice's Google profile and shown whole."

## Not done

- **#1** the hero photograph "with Dr. Nguyen and Dr. Sung with their kids" exists nowhere I can reach: not in the 212-frame album (contact sheet in `.tmp/album-sheet/`), not in the old site's uploads, not on grandmissiondentistry.com (only hiking shots of the couple). The agency has to send it.
- **#3** "the bottom of the logo is being cut off" does not reproduce in Chrome at 1440/2x on local or staging (`.tmp/bugherd/shot-header.mjs`). The artwork has two pixels under DENTAL. Ask which browser and width.
- **#43** the team portraits are in the agency's Canva; nothing was built for them yet. When they arrive, the removed Named chapter's slot on the team page is where they go.
- BugHerd statuses were not changed; the reviewer should close them against staging.

## Gates

`check.mjs` 223/0 (the two warnings were the seal images, now `aria-hidden`); `prune-nav.mjs --check` every link resolves; `probe-hooks.mjs` clean on `/` and `/about-us`; `probe-heights.mjs` baseline re-saved after the change (home and Invisalign both moved: copy, chapter padding, the strip). `probe-wall.mjs` is stale — it targets the discarded `ab-`/`tm-` drafts and the removed name wall — and reports FAIL on both halves; not a regression from this run.

## The push

`backup-staging.masonparkdental.com-2026-09-10T17-05-03.json` first (57 pages, seq 70). Then the order in the 2026-09-10 404 run, with the media pass in front of it because 20 files were new: `to-instatic` → `upload-media` (367 present, 0 failed) → `to-instatic --media` → `ship-payload` → `run-converter` → `fetch-nodes` → `apply-image-alt` → `apply-body-class` → `import-pages --overwrite` → `import-styles` → `apply-blog-template` → `apply-404-template` → `import-scripts --publish`. Logs in `.tmp/bugherd/push-2026-09-10*.log`.

## Gotchas

**Do not export `RAILWAY_TOKEN` from `.env` before the Railway steps.** The CLI is logged in on its own; with the token exported every `railway ssh` answers "Unauthorized". The first chain of this round was `node step | tail -n`, which never stops on a failed step, so it walked on through `import-pages` (which re-imported the stale *templates* set in `converted-pages.json`, harmlessly) and `import-scripts --publish`, and published the new stylesheet over the old pages before it was stopped. The second chain checks `PIPESTATUS[0]` per step. Staging was in that mixed state for a few minutes.

**Several `home/**/index.html` files mix CRLF and LF.** A regex ending in `\n` matched the strip on 27 pages and missed it on 13. Use `\r?\n`, or `[ \t]*\r?\n`.

**A `file://` image never loads inside `page.setContent`, and Chrome's image viewer ignores an inline restyle.** Both fail silently. `frame.mjs` embeds the source as a data URI. And read a crop-probe grid by its labels, not by eye: the first Dr. Sung crop was 300 px off.

**Every doctor image line carries a srcset.** A hand edit that quotes the `<img>` from a srcset-stripped read will not match; reorder or swap those blocks by script (`reorder-doctors.mjs`, `apply-2026-09-10.mjs`).

## Next

- The agency: the family photograph (#1), the browser for #3, the Canva portraits (#43), and a look at staging to close the 48.
- Everything from the 404 run's list still stands: Privacy/Cookie policies, a form backend, the Amazon tag, the toothpaste chart, the Instatic per-page meta report, then promote staging.
