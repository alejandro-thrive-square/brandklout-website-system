# 2026-09-23 — BugHerd round 1 on the staging home page

42 notes from BrandKlout Success (`agency@brandklout.com`, Safari 26.6 at 1512×652/633) on project
`542527`, all on `https://staging.ifadentistry.com/`. 38 are fixed in the prototype and published
to staging (seq 8). Four are not ours to fix, or need an answer first (see Open).
All tasks are still `todo` on the board. Nobody has moved them, and nobody has replied on BugHerd.

## Done

| Notes | Change |
| :--- | :--- |
| 1, 31 | Custom cursor removed completely: the gold dot and its DRAG / PLAY bubble. |
| 2, 5, 6, 34 | Hero frame (corner ticks, "Fig. 00 · The practice", coordinates) and the fixed 00–07 chapter rail removed. The right gutter they reserved is released. |
| 3, 10, 16, 21, 23, 29, 35 | Chapter numbers and their dash removed from every tag. The chapter name now carries the deep gold. |
| 8, 17 | "Fig. 01 ·" / "Fig. 03 ·" removed from the captions. |
| 7, 28, 30, 36, 37 | Copy replaced as written: "Who is actually designing your new smile?", "surgical, cosmetic, and restorative treatment", "Brighter smiles and *brighter days*.", "Start with a free, no-obligation *consultation*.", the reviewer's first-visit paragraph word for word. Also fixed: "Marlyin" → "Marilyn", as on the testimonials page. |
| 4 | Hero film autoplay hardened (see Gotchas). **Could not reproduce** in Playwright WebKit: the old build plays there too. |
| 9 | The Question pin: `+=240%` → `+=100%` (one screen of scroll). |
| 11, 14, 15 | Disciplines re-laid out. ≥1280: the open panel gives the card its own column and the photo starts where the card ends; a closed panel keeps only a slim title bar under the chin; crops centred on each face. <1280: two plain cards, photo above text (the accordion would squeeze the photo to a sliver and cut the doctor's face in half at 1100). |
| 12, 13 | "Discipline 1 / 2", not A / B. |
| 18 | The three design steps are buttons. With motion, a click scrolls the pinned scene to that step; without, it sets the divider (0 / 52 / 100). |
| 19 | The guide lines and labels no longer fade out at the end, so "Drag to compare" shows the whole design. Dragging walks the steps (<26 studied, <76 worn, else made). |
| 20 | Portrait `object-position` 50% → 66%: both ears in frame. |
| 22 | Memberships marquee stops on hover and on keyboard focus. |
| 24–27 | Photos swapped from the Drive: DSC_3137 (specialist inset), DSC_3102 (step 03), DSC_3084-Edit (step 04), "Using technology to create smiles" (step 06, shown whole with `contain` because it is a square collage). New file names: `dr-lab`, `path-3-lab`, `path-4-print`, `path-6-design`. |
| 32 | Each story card: name, **original issue**, then "All-on-X full-arch implants · Watch 2 min". The issues come from each patient's own words in the Vimeo auto-captions (Helen: failed implants, years struggling to eat; Mark: failing implants, chipped front teeth; Lisa: few teeth left, years on a soft diet; Philip: failing implants after 30 years). |
| 33 | Reviews rotate every 6.5 s. They stop on hover or focus and while off screen, and they do not rotate at all under reduced motion. The arrows still work and restart the timer. |
| 39 | Payment logos are links to `/about-our-practice/payment-options/`, in three equal boxes, each logo sized to look the same. |
| 41 | Footer: Facebook + Instagram, address with a Google Maps directions link, phone, hours (Mon–Thu 7:00 AM–4:00 PM), languages (English, French and Dutch). |
| 42 | FAQ with the reviewer's 7 questions, inside chapter 07 before the footer (the journey keeps eight chapters). The answers use only facts from the brief and the old site. The cost answer gives no figures. |

Checks: local gate **65/65**. Staging gate **67/67**, with 15 new driven checks (clicks, drags, hovers,
FAQ, footer, removed elements, film playing). WebKit: the film plays on staging. `verify-staging-clean` is OK.
Commit: see `git log` for "BugHerd round 1".

## Open

- **38 (add the procedure to the form)** and **40 ("Submission in progress")** are both the
  GoHighLevel form, `cxtQ5q29TfUr3cYlMmDB`, and are fixed in GoHighLevel, not here: add a
  "procedure interested in" field, and turn `enableSaveExitConfirmation` off (2026-09-21 run).
- **Languages in the footer** are the doctor's (brief: "Fluent in English, French, and Dutch").
  The note asks for "languages spoken in office". Confirm whether staff add others (Spanish?).
- **"Friday to Sunday: closed"** is inferred from the old site's Mon–Thu hours. Confirm it.
- **4 (autoplay)** needs a look in the reviewer's own Safari. If it still waits for a scroll, check
  whether Low Power Mode is on or the site's Safari setting is "Never Auto-Play".
- The FAQ answers are new copy. They need the practice's approval, especially sedation (oral + IV
  with a medical anesthesiologist, from the old sedation page) and cost.
- BugHerd tasks are not moved or answered. Move them to done, or reply, once Alejandro has looked.
- FAQPage schema is not emitted (Instatic strips inline scripts). The aeo-schema plugin could carry it.

## Gotchas

- **Instatic keeps a media file by basename**: the four replaced photos needed new names, or staging
  would have kept serving the old crops.
- **Autoplay:** at the first `play()` the film is inside an `opacity:0` box with its `clip-path`
  closed. WebKit can refuse or pause a muted inline video it thinks is invisible. `home.js` now sets
  `muted`/`playsInline` as properties and retries on `loadeddata`, `canplay`, when the entrance
  ends, on the first scroll/pointer/key, and when the film comes back on screen (IntersectionObserver).
- **The Playwright WebKit here is build 2104**, and only `playwright-core@1.49.1` drives it. The
  latest package wants 2359, which is not installed, and pointing it at 2104 hangs with no output.
- **The reviews test and the auto-rotation:** the timer restarts when the reviews scroll into view,
  so a gate that clicks within about 6 s of scrolling there cannot race it.
- **Disciplines <1280 are cards, not an accordion.** Hover still toggles `is-open` at 992–1279, but
  every rule that differs by state is equalised in the ≤1279 block.
- **Backup for this push:** `21-instatic-upload/.tmp/home/staging-snapshot-2026-09-23-pre-bugherd-r1-seq7.json.gz`
  (new `home/snapshot-home.mjs`). Replace mode deleted 0 pages. Tags, consent bridge and BugHerd
  settings were kept.
- Heredocs in this Bash tool choke on `''` inside Python. Write multi-line scripts to a file.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
