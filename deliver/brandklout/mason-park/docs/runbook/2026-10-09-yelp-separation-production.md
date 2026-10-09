# 2026-10-09 — Yelp separation: Dr. Nguyen, the team and the children's practice off the general site (PRODUCTION only, temporary)

The client, as an emergency: Yelp is reviewing the listings, with one account for the general practice
and one for the kids practice. Remove Dr. Tam Nguyen from the whole site, remove the team except photos
of Dr. Dave Cho and Dr. William Sung, make sure no photo is shared with the kids site, and remove the
pediatric mentions. Temporary, production only. The user chose:
- **Team:** staff headshots and the Team page off; office photos of staff at work stay.
- **Pediatric:** "kids as patients" off. Clinical facts that mention children stay, for example
  fluoride and sealant facts, the glossary, and the privacy policy's children's-privacy section.
- **Instances:** production only.

## Done (www.masonparkdental.com, published 13:47 to 14:08Z, seq 84 -> 88)
- **Backups first** (local, untracked, in `workflows/09-static-rebuild/.tmp/yelp/`):
  - `backup-www-pre-yelp/` (`backup-site.mjs`: shell, 95 rows, published HTML, seq 84);
  - `articles-backup.json` (all 161 Articles rows);
  - `og-overrides-backup-*.json` (open-graph overrides).
- **Pass 1** (`phase1.mjs`), 89 rows:
  - `/our-team` and `/team/tam-nguyen` forward to `/our-doctors`; `/services/pediatric-dental-care`
    forwards to `/our-services`. These are the root-ad-page forwarders, marked `data-yelp-2026-10`.
  - "Meet Our Team" is out of 80 navbars and "Children's Dentistry" out of 22. Other `/our-team` links
    go to `/our-doctors`.
  - The AAPD/ABPD badges are off 29 pages.
  - Dr. Nguyen's chapter, schools and pillar are removed (Our Doctors, About). The "Next Door" chapter
    is removed (Our Services), and so is the "Meet the team" band (home).
  - Every Nguyen sentence is rewritten.
- **Photos:**
  - Photos of children and the shared front-desk photo (`desk-tablet-2`) are swapped for adult photos of
    the same orientation, never twice on a page. The swaps are in `phase1.mjs` and `swap-photos.mjs`.
  - Every photo the site shows (253) was then reviewed on contact sheets. Ten more child or possible-child
    photos were swapped, including `hygienist-working-2` on 172 pages and `-4`.
  - The building photo (220 pages) showed the "CHILDREN'S DENTISTRY" sign. It is now
    `mp-building-entrance-1536x864.jpg`, a crop to the arch and the "Family Dentistry" sign.
  - The heroes: the home Nguyen–Sung family photo is now `mp-n131-dentist-assistant-laugh`. Our
    Doctors' three-doctors photo is now `mp-dr-cho-dr-sung-1536x864.jpg`, Dr. Cho and Dr. Sung cut
    from the same studio shot.
- **Share and meta:** `og-overrides.mjs` set 17 share images (1200x630, rendered by `render-share.py`)
  and rewrote 14 descriptions (`desc-map.json`). These are runtime and live at once.
- **Copy:**
  - `phase2-pages.mjs` + `pages-map.json`: 191 edits on 69 pages, plus 3 in `pages-map-3.json`. FAQ
    items about teens, children and babies are removed. So are the Patient Reviews "The Families"
    chapter (it held a review about a 5-year-old), the pediatric offer, and the infant and children
    cards.
  - The Invisalign copy now says adults, not teens.
- **Articles** (`apply-articles.mjs` + `articles-map.json`): 47 rows patched and published one by one
  (121 rewrites, 17 deletions; the map was written by an agent and verified). Four slugs were renamed:
  the two "-with-dr-tam-nguyen-dmd" articles and the two "your-childs" ones. **Instatic 301s the old
  slug to the new one by itself.**
- **Sitemap:** `13-cloudflare-sitemap/build-sitemap.mjs` excludes the three forwarders, and the Worker
  was redeployed with 238 URLs.

## Verified
- Every live page and all 161 articles, raw HTML including head and JSON-LD: **0 mentions of
  Nguyen**. No pediatric badge, no `/our-team` nav link, no swapped photo left.
- What stays on purpose: the glossary (`/dental-dictionary`), clinical lines (sealants, SDF, fluoride),
  the toothpaste product tables, the privacy policy's "Children's Privacy" section, "family history",
  Dr. Sung's "family business", and patient quotes ("Found our family dentist!").
- The two parenting articles stay. They are "How to Get Your Kids to Eat Healthier" and "4 Ways to
  Make Brushing Fun for Kids"; neither claims the practice treats children.
- Photo mixing: dHash of every www image against all 227 kids-site images. Before, only the 13 staff
  headshots, Dr. Nguyen's headshot, the front-desk photo and the ABPD badge matched. After the swaps
  none of them is on the general site.
- Contact form (GHL `JuzM9SxuJMPDMwfO6cgj`): no children's option.

## Next
- **Do not run the page chain or `push-site` against production while this holds.** Staging and
  `home/` still carry Dr. Nguyen, the team and the kids content, so a push puts them all back.
- **Restoring** when the client says so: the backups above. Rows from `backup-www-pre-yelp/pages.json`
  go back through a guarded site-document save. Article cells and slugs come from
  `articles-backup.json`; slug renames 301 both ways. Then the overrides from
  `og-overrides-backup-*.json`, and the three EXCLUDE lines out of `build-sitemap.mjs` before a
  sitemap redeploy.
- Open for the client:
  - The Google reviews widget (Elfsight `e30c1531`) shows live Google reviews, some naming Dr. Nguyen
    or kids. Elfsight can hide reviews by keyword.
  - Some photos were taken in a room with red window frames that may be the kids practice's open bay
    (`dentist-handheld`, `dentist-standing`, `clinical-room`, `n115-two-chairs-window`). No child is
    visible in them, so they stay unless the client says otherwise.
  - The privacy policy no longer says the practice treats children. That is a legal page; restore it
    with the rest.

## Gotchas
- `PATCH /data/rows/:id {status:'draft'}` is ignored and `POST /data/rows/:id/unpublish` 404s, so an
  article cannot be unpublished through the API. Rename the slug instead (Instatic 301s the old one),
  or delete the row.
- Share images (`og:image`) are open-graph overrides made from the old hero. Swapping a hero leaves
  the old picture in every share preview until the override changes.
- A filename or alt scan misses photos: "a hygienist showing a young patient how to brush" had no
  kid word in its file name. Only looking at the contact sheets found the last ten.
- A Python `-` heredoc in this Git Bash opens the REPL and hangs; write the script to a file.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
