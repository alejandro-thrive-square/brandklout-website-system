# 2026-09-09 — Treatment pages, batch 2: the whole Preventative group, and the Services menu becomes grouped

Second batch of the same day. [Batch 1](./2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md)
built the Restorative group and wrote `stamp-service.mjs`; read its **Gotchas** before
picking this up, because they still all apply.

## Done

**Nine treatment pages**, taking the site from 8 built treatments to 17 of 31:

| Page | Group | Source |
| :--- | :--- | :--- |
| `preventative-dentistry` | Preventative | `services-preventative-dentistry` |
| `oral-cancer-screening` | Preventative | `services-oral-cancer-screening` |
| `dental-hygiene-education` | Preventative | `services-dental-hygiene-education` |
| `mouth-guards` | Preventative | `services-mouth-guards` |
| `night-guards` | Preventative | `services-night-guards` |
| `fluoride-treatment` | Preventative | `services-fluoride-treatment` |
| `sealants` | Preventative | `services-sealants` |
| `bonding` | Cosmetic | `services-bonding` |

**The Preventative group is complete** — all seven chips have pages.

**The Services menu is grouped now.** It was a flat list generated from disk, which was
fine at two entries and unusable at sixteen. `prune-nav.mjs` now holds `GROUPS` — the
catalogue's own seven groups in its own order — and renders a nested dropdown:

- A group with **nothing built** is dropped entirely rather than rendered as an empty submenu.
- A group with **exactly one page** built renders flat, because a submenu holding one item is
  a worse click than the item. That is why Invisalign® currently sits at the top level.
- **"Night guards" is listed once**, under Preventative, though the catalogue has the chip in
  both Preventative and Comfort and pain. A menu is not a catalogue.

**It needed no new CSS and no new JS**, which is worth knowing before anyone "fixes" it:
`site.css:434` already styles `.navbar_dropdown-list .navbar_dropdown-list` and opens it on
hover and focus-within, and `site.js:39` binds the mobile toggle with
`.has-dropdown > .navbar_link`, a selector that matches a nested group as well as a
top-level one.

## Next

1. **Fourteen treatment pages left.** Cosmetic (`cosmetic-dentistry`), all of Hygiene and
   gums (`comprehensive-care`, `laser-dentistry`, `airflow-one`, `frenectomy`), all of
   Comfort and pain (`sedation-dentistry`, `emergency-dentist`, `tmj-tmd`), the rest of
   Oral surgery (`dental-implant-placement`, `crown-lengthening`), and
   `invisalign-questions`. Every one has full source copy.
2. **Three still blocked on the practice**: `whitening` (no source page at all),
   `porcelain-veneers` (193 words) and `wisdom-teeth` (no page of its own). Do not write
   these from general dental knowledge.
3. Then the non-service pages: Contact and the Privacy Policy first.
4. Nothing is published. Instatic still holds the eleven-page site.

## Gotchas

- **The old WordPress pages carry fabricated testimonials, and they must not be carried
  over.** `services-sealants/rendered.txt` has three — "Maria G.", "Kevin R." and
  "Angela M." — that appear in none of the practice's 20 real Google reviews. They read
  like theme filler. This client's record already includes four awards it had not won and
  a stock smile gallery presented as its own results; a fake testimonial is the same
  category of problem. **Check any quoted patient against the Trustindex JSON before
  reproducing it**, and assume a first-name-plus-initial with no date is invented.
- **`ch-qualify` cannot ask "do you need this" on a preventative page.** Everyone needs a
  cleaning, so on `preventative-dentistry` the chapter is the practice's own five signs
  that six months is too long to wait, and on `dental-hygiene-education` it is the five
  readers who get the most from it. A qualify chapter that cannot qualify anyone out has
  to be re-aimed rather than filled.
- **Bruxism is unconscious, so the night guards page cannot ask whether you grind.** Its
  qualify chapter lists what you see in the morning and in the mirror instead. Same class
  of problem as above; worth remembering for any asymptomatic condition.
- **`mouth-guards` and `night-guards` are adjacent subjects and nearly shared a shape.**
  Both source pages argue "custom versus store-bought" as their comparison. Mouth guards
  keeps that as its `vs-table`; night guards uses "treating it now versus leaving it" and
  demotes the store-bought argument to the flipped overlap, because running the identical
  comparison on two neighbouring pages is the site-looks-like-one-page failure the README
  warns about.
- **A `svc-grid is-3` with five cards orphans the fifth**, exactly as the README's "five
  facts on a centred strip" note says. Several pages here carry a sixth card that is a
  `svc-card is-price` doing real work rather than filler — check the count before adding
  or removing one.
- **Re-run `probe-heights.mjs --diff base` after `prune-nav.mjs`, not before.** The nav
  rewrite touches all 27 pages including the two frozen ones, and it is the only thing in
  this workflow that can silently move an approved page.
- **`probe-hooks.mjs` intermittently reports `FAIL console: ReferenceError: google is not
  defined`.** It happened once here on `oral-cancer-screening` and did not reproduce on the
  next run, and the approved Invisalign page passes with the identical markup. It comes from
  inside the deferred Google Maps iframe, which is stamped chrome and identical on all 27
  pages — the maps script losing a race while the probe is scrolling, not anything on the
  page. **Re-run before believing it**, and only investigate if it reproduces or if it
  names a symbol that belongs to our own scripts.

## Version Control

Runbooks are tracked. This file and its `INDEX.md` row are committed with the run.
