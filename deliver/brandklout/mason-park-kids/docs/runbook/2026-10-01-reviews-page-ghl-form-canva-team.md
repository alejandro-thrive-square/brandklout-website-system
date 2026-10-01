# 2026-10-01 - /patient-reviews rebuilt, the GHL contact form, Canva team portraits, #82; partial publishes

**PROMOTED TO PRODUCTION 2026-10-01 15:38 UTC** on the user's go-ahead, together with round seven (#507-#515), in ONE chain: `PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app bash publish-1001-all.sh` (`--only` over the union of the day's pages: /, /contacts, /patient-reviews, /our-team, /our-doctors, /services/dental-hygiene-education; styles, scripts, Elfsight, GHL form; 32 KB payload; backup `backup-mason-park-kids.up.railway.app-2026-10-01T15-36-05.json`). On https://masonparkpediatricdental.com: `verify-1001` 12/12, `verify-1001b` 26/26 (form visible, fills its card, no CSP errors), `verify-1001c` 26/26, `carousel-test` PASS at 1440 and 390; canonical on the apex, no staging references.

### Done

| What | Where | Notes |
| :-- | :-- | :-- |
| **GHL contact form** (BugHerd #34, #198) | /contacts new chapter `#message` "Send us a message" (between Four Ways and The Hours); /patient-reviews `#question` | Form `pyYcEmfIvtv5LwB1s4X6`, embed sent by the user. `home/` holds a `.ms-slot` placeholder; `.tmp/add-ghl-contact-form.mjs` swaps it for a `brandklout.embed-origins.embed` (snippet verbatim, `fit: "auto"` for lc.setHeight) that keeps the slot's class, so it publishes as `div.ms-slot.wz-embed`. Live: 669x889 in a 722 card at 1440, 319 of 349 at 390, visible, no CSP errors. #34 closed; **#198 stays open**: the form has no "service" field (name, email, phone, message only), which has to be added in GoHighLevel; the copy beside the form asks parents to name the service meanwhile. The form's Privacy/Terms links point to example.com (GHL side). Save-and-exit is off. |
| **/patient-reviews rebuilt** (Asana 1218885013466701, Jessica: "can we do a page more like" marveldentaldds.com/patient-stories, no videos) | /patient-reviews | `.tmp/reviews-page-1001.py` (idempotent). Marvel's order, our shapes: Arrival (kept) -> The Stories (five long reviews verbatim in a scroll-snap carousel, a matching photo each, none captioned as the reviewer's child) -> The Reasons (four) -> Done Right (dark panel, checklist, photo, Amber Choate one-liner) -> The Wall (Elfsight, old lede removed) -> Write One -> A Question (photo + GHL form) -> The Invitation. 8 chapters. Carousel: `site.js` "story carousel", found by class (Instatic drops data-/aria- on buttons), wraps at both ends; `carousel-test.mjs [base]` clicks it: PASS at 1440 and 390, local and staging. |
| **#82** | / `#comfort` | The practice's `Playarea.jpg` (user's Drive export, 382x510). On the user's choice it is NOT upscaled: `playarea-382.webp` in a portrait frame (`.cf-play`, 24rem) beside "A dinosaur wall to keep little hands busy.", replacing the st-play band. |
| **Canva team** (#502 #504 #506) | /our-team, /our-doctors | `.tmp/team-canva-1001.py` from `workflows/Mason Park -Team/` (the user's Canva export, 1000x1000 each, `canva-<first>-{480,960}.webp`). Front desk: Priscilla, Amanda, Nicole, Anabel; assistants: Ivon, Caisy, Josh, Alison, Luis; hygienists: Genevieve, Tiffany, Lola. Every existing portrait and Dr. Dave Cho's (both pages) swapped to the Canva set. Ticker lists all 12. Replies ask: Nicole is titled RDA in Canva but the note puts her at the front desk; Anju Lekshmi (RDA) is in the folder but in no note, not added. |
| **Partial publishes** | `to-instatic.mjs --only` | See the 03 README: a page list cuts the whole chain to those pages (3 pages: 23 KB / 4 chunks vs 1.4 MB / 205). `publish-1001c.sh` is the template. |

### Publishes (staging)

- `publish-1001b.sh`: /contacts + /patient-reviews, styles, scripts, Elfsight, form (before `--only` existed: full convert). `verify-1001b.mjs` 26/26.
- `publish-1001c.sh`: `PAGES=/,/our-team,/our-doctors` with `--only`; then Elfsight on /. `verify-1001c.mjs` 26/26.
- Replies (`replies-1001b.py`): #34 #82 #502 #504 #506 done, #198 open.

### Drive / Canva folders the user dropped into `workflows/`

- `Mason Park Kids-20261001T144800Z-1-001/Mason Park Kids/`: the Drive export, 119 files. Every file already in `.tmp/_drive` is byte-identical; 11 are new (7 AdobeStock, 2 PXL, toothcalendar, Playarea). **PXL_20260714_221358715 (#483) is not in it.** Use this folder for future "swap for the Drive image" notes.
- `Mason Park -Team/`: the Canva team set, 15 PNGs (incl. the logo).
Both are gitignored and backed up to R2 (`scripts/assets.mjs push`).

### Next

1. Done: production (above). Staging and production now match for everything changed on 2026-10-01.
2. #198 when a Service field exists in GHL (nothing to change on the site). #483 still needs its photo.
3. Round six's eleven "face cut" crops were fixed as static `object-position` and checked at rest. The user says "face cutting" notes mean the scroll animation clips the photo (drift/wipe): re-check those with motion on.
4. The Google map on every Invitation chapter rendered as an empty box in headless shots (site.js builds the iframe at runtime; possibly the embed-origins frame-src). Not investigated.

### Gotchas

- A whitespace-dependent regex in the page generator lost the #question chapter on a re-run (the chapter-order assert caught it before writing). Remove/insert blocks with `\s*` on both sides.
- `.dr-copy > p` styled the chapter-tag `<p>` as a lede; scope copy rules with `:not(.chapter-tag)`.
- Another session committed /hipaa-disclosure and a footer link (216 pages) in this worktree while this ran. Check `git log` before committing; never assume you are alone in a worktree.

## Version Control

Tracked with the client runbook on `bk-mason-park-kids`; see the repository's SYSTEM_RULES.md §4.
