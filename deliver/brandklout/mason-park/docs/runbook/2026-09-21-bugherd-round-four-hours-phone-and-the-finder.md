# 2026-09-21 — BugHerd round four: the opening hours, the phone number, and the finder

The agency filed 32 notes between 2026-09-16 and 2026-09-19 (#78–#109) on top of the two still
open from earlier rounds (#3 the logo, #66 Cherry). All 32 are answered and closed; the board is
down to those two, and both are waiting on the agency, not on us.

The reviewer moved: rounds two and three were Safari 26 at 1512×652, this one is **Windows 10 /
Chrome 153 at 2560×1305**. Two of the notes only exist at that width.

## Done

Implementation commit: see the commit that carries this file.

Pull and disposition: `.tmp/bugherd/tasks-2026-09-21.json` (108 tasks, 34 open at the start),
`open-2026-09-21.txt` is the readable digest. Every reply is in `reply-2026-09-21.mjs`.

### The opening hours (#78, #83)

The practice is open **Monday to Wednesday 9am–6pm, Thursday 9am–5pm, Friday to Sunday closed**.
The site said Mon/Wed 9–6 and Tue/Thu 8–5. That string exists in **six different shapes**, and
they are all now correct on all 61 published pages and in the nine local page builders:

| Where | Shape |
| :--- | :--- |
| the topbar strip | `Mon–Wed 9-6 · Thu 9-5 · Fri–Sun closed` |
| the invitation chapter's fact list | `Mon to Wed <b>9am to 6pm</b><br>Thu <b>9am to 5pm</b>…` |
| the footer's day rows | `<li class="hours_row"><span>Thursday</span><strong>9am - 5pm</strong>` |
| the Contact page's ledger | `<li><b>Thursday</b><span>9am to 5pm</span></li>` |
| the ad pages' own list | `<li><span>Thursday</span><b>9am to 5pm</b></li>` |
| **every page's JSON‑LD** | `openingHoursSpecification`, Mon–Wed 09:00–18:00, Thu 09:00–17:00 |

The last one is the one that matters most: it is what Google reads for the practice's listing.

### The phone number (#79, #80, #81, #82, #84, #97, #100)

Seven notes, all "the button is enabled, but it doesn't redirect to any page", against seven
different phone links. **They were all correct.** `probe-tel.mjs` drives a real, cancelable click
on every `a[href^="tel:"]` of a published page and reports whether anything called
`preventDefault`: nothing does, on any of them. A desktop with no handler registered for the
`tel:` scheme hands the click to Windows and Windows does nothing — indistinguishable, from the
reviewer's chair, from a dead button.

The links are unchanged, because a phone number has to stay a `tel:` link for the readers who are
on a phone. What is added is an answer: on a device with a fine pointer, `site.js` copies the
number and shows a `Copied (281) 769-8878` line beside the button. `preventDefault` is **not**
called, so a machine that does have a handler still gets its dialler.

### The services finder (#94, #95, #96, #98, #99)

Eight of the ten rows pointed at `#invitation`. The agency named five treatment pages; rows 06
(composite fillings) and 07 (TMJ and TMD) had the same defect and are done too. Row 10, the free
second opinion, has no page of its own and keeps the anchor. The rows stay `<a>`s carrying
`data-img` / `data-caption`, so `elevate.js` still swaps the sticky panel on hover — it binds
`mouseenter` and never cancels the click.

### Framing (#85, #86, #88, #91, #92, #106)

Four of the six are **one photograph**: Dr. Sung's portrait, cut from a shot of him beside Dr.
Nguyen with him off to one side of his own frame. His frame and its slot are both 3:4, so
`object-fit` had nothing to move and no `object-position` could have helped. Re-cut from the
source at `box 930,700,1280,1705` — his face on the centre line, Dr. Nguyen clear of the right
edge. It is a tighter crop than the other two doctors', which is as wide as the original allows;
the reply offers to swap in a proper solo portrait if the practice can take one.

#86 and #91 are the same landscape team frame in a taller and a squarer slot, cutting the second
person off at the edge; both are `object-position` rules in `site.css`.

### Type (#87, #93)

**#87** was a real bug and had been live for eleven days: `.cp-figure span`, written for the small
caption under each figure, also matched the `<span data-count>` *inside* the `<b>`, so "100 hrs"
rendered with the 100 at caption size and the hrs at heading size. `.cp-figure > span`.

**#93**, all seven service group names on one line: they wrapped at every width. Locally the row
needed 1819px of 1829 at 2560 and fitted; **on the published page the same names measure 1831px**,
because Instatic installs static instances of Newsreader and they set ~3% wider than the variable
font does from `file://`. From 1280 up the names are smaller and the gap is fluid, which leaves
13–20% of the row empty at every width. Below 1280 it still wraps, correctly.

### The contact sheet (#90)

"When hovering over the photos, it doesn't show where they were taken." It did — into
`.el-sheet_line`, under the whole grid, hundreds of pixels from the pointer. The caption now also
appears on the hovered tile, from the same `data-caption` attribute, in CSS alone. The line stays
for keyboard and touch readers.

### Photographs (#89, #101, #102, #103, #104, #105, #107, #108, #109)

Eight attached by the agency, cropped to the aspect of the slot each one lands in and registered
in `album-manifest.json` by `import-2026-09-21.sh`. **#103** ("match it to the format of #1, do
the same for #4 and #6") asks for a photograph on every card of the preventative "Is this you"
grid; cards 03 and 06 had nothing attached and take two of the practice's own frames.

One thing not asked for: #107's photograph of the front desk on the phone made card 05 of the grid
above it a second picture of the same person on the same phone against the same wall. Card 05 is an
examination now.

## Verified

Local, before the push: `check.mjs` **0 errors on 229 pages**; `probe-heights.mjs --diff base`
moved only at 390px and only by 27px, in the invitation, because "Tue and Thu 8am to 5pm" wrapped
to two lines and "Thu 9am to 5pm" does not — baseline re-saved (`heights/base-before-2026-09-21.json`
is the old one); `shot.mjs` on the eight changed pages, **0 overflow and 0 broken images at four
widths**; `verify-2026-09-21.mjs` against `serve.mjs` **0 failures**.

Live on staging: `verify-2026-09-21.mjs` **0 failures** — the hours in all six shapes on four kinds
of page, the ten finder hrefs plus the hover still swapping the panel, the tab row on one line with
room at five widths, the sheet caption fading in on the tile, the phone answering a click on three
pages with no page errors, the re-cut portrait on three pages, a frame on all six qualify cards
with no two the same, and the number larger than its unit on all four figures.
`sweep-live-2026-09-21.mjs` over **all 61 published pages**: 200s, 0 broken images, 0 overflow, no
page errors. A blog article renders through the template with the new hours. No page anywhere on
the instance still contains `8am`, `"08:00"` or `Tue &amp; Thu`.

Board: 33 comments posted, 31 notes moved to done, then #90 in a second pass. **Two open: #3 and
#66**, both answered and both waiting on the agency.

Backup taken first: `backup-staging.masonparkdental.com-2026-09-21T13-51-51.json` — 63 pages, 747
media, shell seq 99, draft == published. **Production was not written or read.**

## Gotchas

- **A re-cut picture needs a NEW FILENAME.** `upload-media.mjs` lists the live library and skips
  anything already there by basename; that is what makes it resumable, and it means re-cropping a
  photograph under its old name uploads nothing. The first push of this round went out with the
  old crop of Dr. Sung still serving while every local gate was green — the local build was
  correct and the live file was not. The asset is `mp-dr-sung-standing-2-…` for that reason, and
  `apply-2026-09-21.mjs` carries the rename so it is reproducible. **Always diff the live file's
  byte size against the local one after a re-crop.**
- **`/blog` and `blog-article` are not in `instatic/pages/`.** They are 2 of the 63 live pages and
  live in `instatic/pages-blog-cms/`, which `import-pages.mjs` never reads. The main push changed
  61 pages and left the blog's chrome on the old hours; `verify-2026-09-21.mjs` caught it on
  `/blog` and nothing in the main push would have. `push-blog-2026-09-21.sh` is the second half,
  and it is the 2026-09-10 order: `build-blog-templates` → `ship-payload --dir pages-templates` →
  convert → fetch → **`cp converted-pages.json converted-templates.json`** → `apply-image-alt` and
  `apply-body-class` with `--converted --dir` → `apply-blog-markers` → `import-pages --pages
  converted-templates.json --overwrite` → `import-styles --pages converted-templates.json`.
- **Measure type on the published page.** `probe-tabs.mjs` takes a URL for this reason. Two pixels
  of local headroom is not headroom.
- **A rename regex that matches a bare digit renames twice.** `mp-dr-sung-standing-(\d)` turned
  every reference into `-2-2-` on the second run and `check.mjs` reported 148 errors. The size
  suffix is what identifies the old name: `mp-dr-sung-standing-(\d+x\d+)` cannot match `-2-410x546`,
  so the second run is a no-op. Idempotence has to be a property of the pattern, not a promise.
- **`tel:` is not broken on a desktop, it is unanswered.** Check with a driven click and
  `defaultPrevented` before changing anything. The first probe reported *zero* `tel:` links on a
  page that has seven, because `goto(..., { waitUntil: "networkidle" })` timed out and the `.catch`
  swallowed it, so the evaluate ran against `about:blank`. **Never swallow a navigation error
  without printing the status, the title and the byte count.**
- **The hours were in six shapes, and the fifth and sixth were found by the gate, not by the
  grep.** A regex for `8am|9am|5pm|6pm` missed the topbar's `9-6` / `8-5`, and a list of known
  strings missed the Contact page's ledger entirely. `verify-2026-09-21.mjs` reads
  `document.body.innerText` for `8am`, which is the only version of that question that cannot go
  stale.
- **Staging's console is never empty.** Two CSP refusals are on every page and neither is the
  site's: BugHerd's sidebar loads its icon font as a `data:` URI (`font-src`) and Cloudflare
  injects its beacon (`script-src`). `sweep-live` filters both, or the gate reports 61 of 61.

## Next

- **#3** (the logo clipped in Safari 26) and **#66** (the Cherry application link) are the only
  open notes. #3 needs the agency to look once more in Safari; #66 needs the practice's own Cherry
  link (`pay.withcherry.com/<practice-name>`), which is not on the old site, not in Asana, and not
  reachable from Cherry's site.
- Offered in the replies and not yet answered: a proper solo portrait of Dr. Sung; replacement
  frames for preventative cards 03 and 06; whether the appointment-book screen on #109 should be
  published at all; and whether finder row 10 should go to Contact rather than the booking section.
- **Production is unchanged.** This round is on staging only.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
