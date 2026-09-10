# 2026-09-09 — Treatment pages, batch 1: the Restorative group and the first two of Oral Surgery

## What this run was for

Take the site to the finish line. The 2026-09-01 freeze kept eleven pages and the
Invisalign page as "the canary for the other 34 treatment pages". Nobody had built
any of the 34. This run built the first eight, wrote the stamper that makes the
rest cheap, and produced the inventory of everything else still missing from the
old WordPress build.

## The inventory (read this before picking up the next batch)

**The approved catalogue is 31 unique treatments**, from the `el-tabs` chips on
`home/our-services/index.html` — seven groups, 32 chips, "Night guards" appearing
in both Preventative and Comfort. That is the definitive list, not the old site's
35 `/services/*` pages and not the nav menu.

**Built after this run (9 of 31):** invisalign (was already there), dental-crowns,
bridges, dentures, composite-fillings, root-canal-therapy,
dental-implant-restorations, extractions, bone-grafting.

**Still to build (22).** Every one has 1,650–3,100 words of the practice's own copy
in `01-content-intake/.tmp/site-scrape/pages/services-<slug>/rendered.txt` except
the three noted:

| Group | Chip | Source page |
| :--- | :--- | :--- |
| Preventative | Cleanings and exams | `services-preventative-dentistry` |
| | Oral cancer screening | `services-oral-cancer-screening` |
| | Hygiene education | `services-dental-hygiene-education` |
| | Mouth guards | `services-mouth-guards` |
| | Night guards | `services-night-guards` |
| | Fluoride | `services-fluoride-treatment` |
| | Sealants | `services-sealants` |
| Cosmetic | Smile makeovers | `services-cosmetic-dentistry` |
| | Bonding | `services-bonding` |
| | Porcelain veneers | **`services-porcelain-dental-veneers` is 193 words — a stub** |
| | Whitening | **no source page at all** |
| Invisalign | Invisalign questions | `invisalign-faqs-katy-tx` (798 words) |
| Hygiene and gums | Deep cleaning | `services-comprehensive-care` (+ `services-hygiene-and-periodontics`) |
| | Laser dentistry | `services-laser-dentistry` |
| | AIRFLOW® ONE | `services-airflow-one` |
| | Frenectomy | `services-frenectomy` |
| Oral surgery | Wisdom teeth | **no dedicated page** — the section inside `services-extractions`, plus the blog post `gaining-wisdom-on-wisdom-teeth-77079-dentist` |
| | Implant placement | `services-dental-implant-placement` |
| | Crown lengthening | `services-crown-lengthening` |
| Comfort and pain | Sedation dentistry | `services-sedation-dentistry` |
| | Emergency dentist | `services-emergency-dentist` |
| | TMJ and TMD | `services-tmj-tmd` (+ `services-what-is-tmj`) |

> [!IMPORTANT]
> **Whitening, Porcelain veneers and Wisdom teeth have no real source copy.**
> Do not write these three from general dental knowledge — every other page on
> this site is the practice's own words re-tagged. Ask the practice for copy, or
> leave the chips dashed. A dashed chip is the designed state for "no page yet";
> `link-chips.mjs` maintains it.

**Old service pages deliberately NOT rebuilt:** `restorative-dentistry`,
`oral-surgery` and `hygiene-and-periodontics` are group overviews the `el-tabs`
catalogue already is; `pediatric-dental-care` and `silver-diamine-fluoride` belong
to **Mason Park Kids**, not this site (see the context-contamination note in
`09-static-rebuild/README.md`); `dental-implants` (324 words) duplicates
implant-restorations.

**Non-service pages missing from the old build**, in the order they were reported
to the client as the attack order:

1. **Contact** (`/contacts`) — there is no contact page at all right now.
2. **Privacy Policy / Terms** (`/terms-of-service`, 2,206 words) — legally required.
3. **Special Offers** (`/special-offers`) — `our-services`' `cp-menu` lists offers with no page behind it.
4. **Technology** — four old pages collapse into one: `/technology`, `/pearl-ai`, `/ceramillmotion3`, `/technology-ai`.
5. **Appointment** (`/appointment`) and 6. **Virtual Consultation** (`/virtual-consultation`).
7. **Patient Resources** hub, and under it: 8. Dental Dictionary (3,891 words), 9. Toothpaste RDA table, 10. pH and acidity of food and beverages, 11. Product recommendations.
12. **FAQs** (`/faq-page` + `/dental-implants-faqs`). 13. **The blog and its ~200 posts** — the largest single item on the list and its own decision. 14. Sitemap. 15. Katy town resource.

**Deliberately not rebuilding:** `/before-after` (the old smile gallery was theme
stock presented as the practice's own results — already on this client's record as
a problem); the individual `/team/dr-sung|dr-cho|tam-nguyen` pages, folded into
`our-doctors`; `/dental-implant-costs` + `-esp`, `/pricing`, `/shop` (thin, and
pricing on a partner site is a client call); `/blog-masonry|portfolio|standard`
(theme demos); `/sample`, `/dental-library` (291-word stub).

## Done

- **`.tmp/stamp-service.mjs`** — new. Creates `home/services/<slug>/index.html`
  from the Invisalign page's chrome plus an authored `<main>`. The README said
  "if the chrome changes on all eleven pages at once, write a new one"; thirty
  more treatment pages is that case. Takes a spec JSON (`slug`, `title`,
  `description`, `crumb`, optional `faq`) and a body file, rewrites the six head
  fields and the BreadcrumbList, replaces or **drops** the FAQPage block, splices
  the body, and runs `expand-img.mjs`. It warns if the body's last breadcrumb
  crumb does not match the spec, which is the one error a stamper should make
  impossible.
- **Eight treatment pages built**, all passing `check.mjs`, `shot.mjs` at four
  widths (zero horizontal overflow, no broken images, clean console) and
  `probe-hooks.mjs` (`path pinned`, `console clean`, `all hooks do work`):
  dental-crowns, bridges, dentures, composite-fillings, root-canal-therapy,
  dental-implant-restorations, extractions, bone-grafting.
- **`.tmp/prune-nav.mjs` fixed — it was a blind gate.** `ROUTES` was a literal
  list of the eleven routes that existed on 2026-09-02, so the moment treatment
  pages landed it reported live pages (`/services/dental-crowns/`) as DEAD, and
  it would have gone on pruning the nav to eleven routes with thirty more on
  disk. It now derives routes by walking `home/` for directories containing an
  `index.html`, and the Services dropdown is generated from a catalogue-ordered
  list filtered by what exists.
- **`.tmp/link-chips.mjs`** — new, and it is now the single place the catalogue's
  link state is decided. The README's rule was "a chip becomes a link the day its
  page exists"; the stylesheet already carried both states (`span.el-tabs_chip`
  dashed, `a.el-tabs_chip` solid with an accent hover), so this only swaps the
  element. Idempotent in both directions. 9 chips link, 22 still dashed.

## Next

1. Build the remaining 19 treatment pages that have real source copy. The
   Preventative group (7) is the largest and the highest-traffic.
2. Get copy from the practice for **Whitening**, **Porcelain veneers** and
   **Wisdom teeth**, or agree to leave those three chips dashed.
3. **The Services dropdown needs the grouped mega-menu before the next batch.**
   At nine entries it is already long; at thirty-one it stops being a dropdown.
   The seven catalogue groups are the structure. There is a `NOTE for the next
   batch` comment on `TREATMENTS` in `prune-nav.mjs` saying exactly this.
4. Then the non-service pages, starting with Contact and the Privacy Policy.
5. Push to Instatic and verify live. Nothing in this run has been published.

## Gotchas

- **`stamp-service.mjs` only works for pages at `home/services/<slug>/`.** Every
  treatment page is at the same depth as the Invisalign page, so the `../../`
  asset prefix in the stamped chrome is already correct and nothing rewrites it.
  Use it for a page at any other depth and every asset path will be wrong, with
  no error.
- **`probe-scene.mjs` needs an absolute path**, not the relative one `shot.mjs`
  takes. It does `"file:///" + argv[2]`, so `../home/...` becomes
  `file:///home/...` and fails with `ERR_FILE_NOT_FOUND` that looks like a
  missing page rather than a bad argument.
- **`$TMPDIR` is empty in this Git Bash**, so `cat > "$TMPDIR/spec.json"` writes
  to `/spec.json` and fails with a permission error from `C:\Program Files\Git`.
  Write spec files to the session scratchpad by absolute path.
- **Do not invent a review.** The first draft of the crowns page carried a
  fabricated Google review with an invented patient name; it was caught and
  replaced before the page was stamped. The practice's real reviews are the 20 in
  `01-content-intake/.tmp/site-scrape/assets/cdn.trustindex.io/companies/1e/1e983d388599g1ad/richsnippet.json`
  (`.reviews.review[]`, with `author.name`, `datePublished`, `inLanguage`) plus
  the six in the intake. Show them whole, spelling and all, and put `lang="es"` on
  Cynthia Guerrero's — the dentures page does.
- **A five-card `ch-path` fills its progress bar at 75% of the scrub and holds.**
  That is not a bug; the six-card Invisalign scene does the same thing. Compare
  against `probe-scene.mjs` on the Invisalign page before "fixing" it.
- **The forward references between treatment pages resolve themselves.** Each new
  page links to sibling treatments, so `prune-nav.mjs --check` reports DEAD links
  to pages still in the build queue. Re-run it at the end of each batch, and only
  investigate a DEAD route that is not on the build list.
- **Run `link-chips.mjs` after every `stamp-service.mjs` batch**, then
  `prune-nav.mjs`. Neither is triggered by the stamper.

## Version Control

Runbooks are tracked. This file and its `INDEX.md` row are committed with the run.
