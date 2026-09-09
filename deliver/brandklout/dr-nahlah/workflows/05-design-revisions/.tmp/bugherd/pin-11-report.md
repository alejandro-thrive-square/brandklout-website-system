# BugHerd #11 — repeated images. Before and after.

> "There are a lot of repeated images in this site overall. We need to make sure
> not to repeat images on the same page. If you don't have a related image or if
> the image has a round radius to it, pick a new one from the Magnific API."

**Status: done on the DRAFT. Nothing published, nothing committed.**

| | before | after |
|---|---:|---:|
| Pages that repeat an image in their own content | **19 of 37** | **0 of 37** |
| Repeat groups | 37 | 0 |
| Redundant instances | 43 | 0 |
| Round-cropped source images on a page | 9 | 0 (2 left, both justified below) |
| Images changed | — | 58 |
| …from the practice's own library | — | 20 |
| …licensed from Magnific/Freepik | — | 31 pictures over 38 slots |

Full tables: `image-audit.before.md` → `image-audit.after.md`.
Every change, with the picture before and after: `dedupe-contact-sheet.html`.
Round-crop evidence: `round-corner-audit.before.md` → `.after.md`.

---

## The thing that was actually wrong

The `/smile-makeover` process grid you pinned shows the same laboratory
photograph three times. It was not a copy-and-paste mistake. **The media library
holds byte-identical uploads of the same photograph under different filenames** —
`lab.jpg` and `tech-hero.jpg` are one 215,637-byte file under two asset ids, and
whoever built that grid picked what looked like two different images.

It is not isolated:

| one picture | filenames it is stored under |
|---|---|
| the laboratory bench | `lab.jpg`, `tech-hero.jpg` |
| the sedation patient | `sedation.jpg`, `sedation-patient.jpg`, `sedation-dentistry-patient.jpg` |
| the crown model | `crown-model.jpg`, `dental-crowns-model-2.jpg` |
| the multi-implant model | `multiple-dental-implant-model.png`, `multi-implant-model.png` |

That one fact accounted for repeats on eight pages. Checking filenames would
never have found it, so the audit settles identity by **SHA-256 of the bytes**.
Worth knowing before anyone adds imagery to this site again.

## How the replacements were chosen

Your ordering from pin #7 was kept: **the practice's own library first, Magnific
second.** 20 of the 58 slots were filled from photography you already own,
including four assets that had never been used anywhere — the intraoral scanner
and its scan on screen, the team in the lounge, the front-desk greeting, and the
full-resolution original of a patient portrait that was only on the site as a
circular crop.

Where the library had nothing related, Magnific was queried on **a curated phrase
for that specific card**, never on the page title. Each candidate was reviewed
from the free preview before any download was spent — one search returned an open
surgical field, another returned ceramic *cups* for "zirconia crown", and neither
was licensed.

Three rules decided which copy of a repeated image moved:

1. **A case photograph's home is the before/after gallery.** Where a case photo
   was in both the gallery and a process card, the gallery keeps it and the card
   was re-shot. Breaking a before/after pair to satisfy a de-duplication rule
   would be a worse page.
2. **A hero outranks a card.**
3. Nothing was swapped for something less related than what it replaced.

## Two round-cropped images deliberately left alone

- **`team-hana.png`** on `/our-team`. This is Hana, a real dental assistant, and
  her headshot arrived cropped into a circle while the other four staff photos
  are square. Replacing a named member of staff with a stock photograph would be
  a worse error than the crop. **The practice needs to send the square original**
  — that is the only correct fix, and it is a one-file change once you have it.
- **`allon4.png`** on `/all-on-4`. The detector flagged it; the pixels say
  otherwise. It is a 3D render whose translucent blue backdrop happens to reach
  all four edges. Not a rounded crop, so it stays.

## One thing still open, and it is not on these pages

All 43 blog articles now carry a featured image, and **14 of those images are
used on two articles each**. On the article pages that is invisible. On the
`/posts` index — where all 43 render as cards on ONE page — it becomes 14 visible
duplicate pairs, which is the same defect you raised here.

That table belongs to a different piece of work running in parallel; the list has
been handed over in `briefs/NOTES-posts.md`. Clearing it needs 14 more distinct
images. Say the word and they can be sourced the same way.

## Also worth a designer's eye, not blocking

One licensed picture — the implant-supported overdenture on `/implant-supported-dentures`
and `/dental-implants` — sits on a blue studio backdrop while its two neighbours
in the same row are on white. It is the only accurate photograph of that specific
prosthesis in the catalogue, so accuracy won over palette. If you would rather
have consistency there, it is one swap.
