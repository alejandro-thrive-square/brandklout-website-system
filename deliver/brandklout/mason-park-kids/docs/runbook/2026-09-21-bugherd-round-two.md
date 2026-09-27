# 2026-09-21 - BugHerd round two: the map, the hours, and a contrast bug the client caught

BugHerd project **540564 "Mason Park Kids"** picked up **eleven new notes** after 09-16 (#29-#31,
#33-#40; #32 was deleted). Nine are done, two stay open on purpose. Nothing was written to Asana,
and `masonparkpediatricdental.com` (the WordPress mirror) was not touched.

**Published to staging and verified, 2026-09-21 13:35-13:36 UTC.** 215 pages, `draftMatchesPublished`,
0 conversion failures, site seq 45 then 46 for the stylesheet top-up. Replies sent; #34 and #38 are
the only notes still open on the project.

### Done

| # | Note | What was done |
| :-- | :-- | :-- |
| 29, 40 | "This is the correct location for Pediatrics" / "Need to map to pediatrics" | The Google Maps embed was pointing at **`0x86412740e7dd5def` - "Mason Park Dental - Katy Dentist", suite 104A, the ADULT practice**. Both `share.google` links in the notes resolve to the same listing, kgmid `/g/11sff9c67k`, ftid `0x8641277706112ec1:0x98941d027afdec7b`, suite **104B**, category "Pediatric dentist". Repointed on all 215 pages. The 644 address links now open that listing instead of a bare street address, the 215 "Get directions" arrows open turn-by-turn navigation, and 7 blog links that pointed at **suite 104A** were corrected too. |
| 30, 39 | Hours are wrong | **Mon to Thu 9am-6pm, Fri to Sun closed.** The old Mon/Wed 9-6, Tue/Thu 8-5 split came from the dead WordPress footer and was in **six** places: the top bar, the invitation `<dl>` at the foot of every page, the footer's day-by-day list, the `/contacts/` hours table, the `/contacts/` "Call" card, and the homepage's `openingHoursSpecification`. All six, 215 pages, plus `build-pages.mjs`, `build-blog.mjs` and `recipes/30-practice.mjs` so a rebuild keeps them. |
| 31 | "Changed to state always welcome..." | Comfort card 1 now reads "Parents are always welcome to accompany their child during the first visit and at checkups. Nobody is sent to the waiting room." |
| 33 | "The color of the font is too dark" | **A real contrast failure, not a preference.** `.ft-sticker` asks for `color: var(--on-sun)` (white), but `.ch p` at `0,1,1` outranks a bare `.ft-sticker` at `0,1,0`, so the sticker painted body grey `#545f62` on the copper: **1.30:1**. Scoped to `.ch .ft-sticker`; it is white again, 5.0:1. `colour-leak.mjs` is the new gate for the whole class of it. |
| 35 | "Please rephrase this" | The `/contacts/` lede: "Free parking at the door, and the suite is on the ground floor. Call us, email us, or request a time online, whichever is easiest." No direction was given on the note; the reply says so and invites a correction. |
| 36 | "Link to address navigation" | The "Come in" card's address is a link now, with a "Get directions" arrow under it. Both open navigation to the pediatric listing. |
| 37 | "Remove this note section" | The Note column is off the `/contacts/` hours table, in the page and in the recipe. Its contents ("the late day", "the early day") described the hours that #30 corrected anyway. |

### Open on purpose

- **#34, the enquiry form.** The site has **no form anywhere** and Instatic has **no form backend**,
  so a submission needs a destination. Brandklout's is GoHighLevel, and **no GHL form is on record
  for this practice** (searched the repo, the client docs and `ASANA-DISPATCH.md`; the only GHL
  reference there is Grand Mission's preview, flagged "do not copy"). `.tmp/add-inquiry.mjs` is the
  entire change - section, copy, chapter renumbering, recipe - waiting on one constant, and the
  `.iq-slot` CSS is already in `site.css`. It **refuses to run with an empty URL on purpose**: an
  empty panel in front of the client is worse than no panel. The reply asks Brandklout for the link
  and offers `office@masonparkdental.com` as the alternative destination.
- **#38, the line on the Book online button.** Measured, not reproduced. The attachment is a 1:1
  capture; the pill is 158x58 and there is exactly **one darkened row, `105,82,69`, at y91 - two
  pixels above the bottom**, spanning the pill and stopping at it (outside the pill that row is
  normal page ground). Two pixels above the bottom of a 2px-bordered pill is the padding box's
  bottom edge, which is where `overflow: hidden` clips, and the only thing that can paint there is
  `.button::after`, the hover fill parked at `translateY(101%)`. It never showed in headless WebKit:
  `btn38-sweep.mjs` rendered that pill at **1032 heights x 8 device scales, 0 leaks**. So the park
  is now `105%`, which costs nothing (the fill is off-screen at rest either way) and puts it beyond
  any rounding. The note stays open until the reviewer re-checks on staging.

### Not in a note, found while sweeping

- **"(281) 578 to 7100" on 18 pages.** `type()` in both generators turns `6-18 months` into
  `6 to 18 months`, and it was eating the phone number. Fixed in the pages **and guarded in both
  generators** (`guard-phone.py` wrote the guard, `guard-phone-check.mjs` proves it: phones survive,
  ranges still convert).
- **A block of raw WordPress schema markup on 5 blog posts**, naming the **adult** practice. On 4 it
  was an `ld+json` script in `<head>` that is not valid JSON (it has `</p><p>` inside it) plus a copy
  in the body; on 2 it was one `<p>` per line, visible on the page. 6 script blocks and 40
  paragraphs removed, 2 chapters left empty and dropped, then `stamp.mjs`.

### Gates

- `check.mjs`: **215 pages, 0 errors, 5 warnings** (6 before - one prose-length warning went with the
  schema paragraphs).
- `stamp.mjs --check`: 0 pages differ.
- `map-check.mjs`: 215/215 pages carry the pediatric ftid, 0 carry the adult one, and the iframe
  resolves and draws the right pin (`embed-compare.png` is the before/after).
- `colour-leak.mjs`: `.ft-sticker` is white again and nothing else on the site loses its colour to a
  contextual rule.
- `guard-phone-check.mjs`: 9/9 cases pass in both generators.
- `verify-0921.mjs`: **every check passes against staging** - the pediatric ftid on `/`, `/contacts/`,
  `/about-us/` and `/blog/`, `Mon to Thu 9am to 6pm` with no `8am to 5pm` anywhere, the top bar, the
  footer's Tuesday, no `578 to 7100`, no stray schema text, the sticker computing `rgb(255,255,255)`,
  the comfort card's sentence, the button fill parked at 56.3px, the hours table two columns and
  544px wide, the address linking to `maps/dir/?api=1` with its arrow, and the rephrased lede.

### Next

1. **Confirm the hours with the practice before production.** They are now in the structured data
   Google reads. The reply to #39 asks.
2. **#34** needs the GHL form URL; **#38** needs the reviewer to re-check, now that it is published.
3. `diff-all.mjs` and `audit-live.mjs` have not been run over all 215 pages since 09-09. This round
   changed text, links and two CSS declarations, no structure. Run them before production.
4. The adult project (539151) still has its own notes; they belong to `bk-mason-park`.

### Gotchas

- **The reviewer's browser is running the Sienna accessibility widget**
  (`cdn.jsdelivr.net/npm/sienna-accessibility`), and it rewrites type inline on **192 nodes** - every
  BugHerd selector on this project carries `data-asw-org-font-size` and a `style="font-size: …"`.
  Their pill measured 158px wide where ours measures 154. Any pixel-level note from this reviewer is
  a measurement of the page **plus that widget**. Check the widget before blaming the CSS.
- **`.ch p` outranks any bare single-class rule.** `0,1,1` beats `0,1,0`. Anything inside a chapter
  that wants its own ink needs `.ch .thing`, not `.thing`. `colour-leak.mjs` finds these.
- **`translateY(101%)` is not "out of frame", it is "1% out of frame".** Give a parked overlay real
  clearance.
- **Never `open(name, "w")` before the replacement string is computed.** A raise between the open and
  the write truncated `build-pages.mjs` to 0 bytes; `git checkout` got it back. `guard-phone.py`
  builds every file in memory first and only then writes.
- **A pixel gate must not sample down the middle of a button.** The first cut of `btn-line-gate.mjs`
  read the white label as a line and flagged every button on the site.
- **`document.styleSheets` is unreadable from a `file://` page in Chrome.** `cssRules` throws, so a
  gate that enumerates rules in the page silently finds nothing and reports all clear.
  `colour-leak.mjs` parses `site.css` from disk instead.
- **The colour gate cannot measure text over a photograph.** The masthead is transparent over the
  hero; walking up for a background colour lands on the page white and reports 1.00:1. It now says
  "not measured" for anything over a picture or a fixed layer.
- **`colour-leak.mjs` over all 215 pages does not finish inside ten minutes.** The default run picks
  the smallest set of pages that between them carry every coloured class - full class coverage, a
  handful of loads. `--all` is the slow path.

- **`body.innerText` loses the top bar after a scroll.** The journey layer slides the chrome away, so
  a text search for the hours in the top line reports a fault that is not there on four pages. Read
  `.topline_note`'s own node.
- **The stylesheet is built by `to-instatic.mjs`, not read from `home/`.** A CSS edit made after the
  publish run started shipped nothing: `import-styles.mjs` sent the copy `to-instatic` had written
  forty minutes earlier and said `+0` rules without complaint. Re-export, then import, then publish.
- **Prefer a CSS-only fix when the payload is already in flight.** Scoping the hours table to
  `.ch-hours` instead of tagging its markup turned a second 50-minute trip through the conversion
  chain into three minutes of `to-instatic` + `import-styles` + `publish`.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
