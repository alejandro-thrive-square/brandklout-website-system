## 2026-09-21d: the warranty claim withheld from the ads landing pages — PUBLISHED AND VERIFIED LIVE

Client instruction, same day the terms page shipped:

> "Let's hide it just in the landing pages, if you need to change verbiage on copy."

**All eighteen ads landing pages now make no warranty claim at all.** `/about`,
`/our-team` and `/five-year-warranty` are untouched and still carry it, which is
what "just in the landing pages" asked for. Published at seq 278 and checked on all
18 live pages plus the three that must keep it.

Reversible in two commands when the practice approves:

```
node toggle-ads-warranty-claim.mjs --restore --apply
node push-warranty-links.mjs --apply
```

### Where the claim came from, since it was asked and is worth recording

The **old WordPress site**, captured 2026-07-30, under the practice's former trading
name *Dental Group of Tysons*. Three pages, verbatim:

| source | wording |
|---|---|
| drnahlah.com/about/ | "We proudly guarantee our cosmetic dentistry work, and are happy to replace any failed part for free with our five-year warranty." |
| drnahlah.com/dental-implants/ | "…five-year warranties on all of our implant procedures (warranties mandate pre-care general cleanings every six months)." |
| drnahlah.com/all-on-4/ | "Dental Group of Tysons offers warranty on All-on-4 with Precare, which mandates general cleanings every six months." |

Two things that are **not** a source: the old terms page mentions warranty only as
PatientPop boilerplate ("AS IS WITHOUT WARRANTY OR CONDITION OF ANY KIND"), which is
a disclaimer about the website, not a grant; and **the current terms of service,
rewritten by the client's counsel effective 2026-08-18, say nothing about warranty
at all.** So nothing contradicts the claim and nothing legally backs it either. The
only authority for it is the practice's own marketing copy.

One inference is on the record: the All-on-4 source states the Precare condition but
**no duration**. Five years comes from the implants page saying "all of our implant
procedures". If the practice ever meant a different term for full arches, that is the
line to correct.

### Twelve places, not ten

Ten are the sentences carrying the linked phrase. The other two are a **hero stat**
on both dental implants pages — `5 years / Warranty on implant work, with Precare` —
one cell of a 2×2 `.lp-hero-facts` grid. Searching for the linked phrase misses it
entirely. Deleting it would leave a hole in the grid, so it is **swapped** for
another fact the practice already publishes (`2 labs / Digital lab in each office`,
from /about's "an in-house digital lab in each of the two practices") and swapped
back on restore.

The rewritten copy keeps everything independently supported and drops only the
promise:

| was | now |
|---|---|
| "…backs its implant work with a five-year warranty, conditional on the Precare cleanings every six months, and gives second opinions on implant surgery free." | "…The practice gives second opinions on implant surgery free." |
| "…The practice's implant work carries a five-year warranty, conditional on the Precare cleanings every six months." | sentence dropped; the crown-maintenance sentence before it stands on its own |
| "…conditional on the Precare cleanings every six months that keep the arch healthy." | "General cleanings every six months are what keep a full arch healthy." |

### Gotchas

- **A source comment ships into the built HTML.** The first version of the "claim
  withheld" note in the page sources spelled the claim out, which put the exact
  marketing phrase back into all four built ads pages in a comment — the one place
  we had just cleared it from. `build-site.mjs` does not strip comments. The note is
  reworded to describe the claim without repeating it.
- **A curly apostrophe matched nothing.** The live node holds `practice's` with a
  STRAIGHT U+0027, despite the site's curly-quote rule; a pattern written with ’
  silently skipped four of the twelve edits and the run looked clean at 8. When
  matching live copy exactly, dump the codepoints rather than trusting the console.
- **Two near-identical paragraphs are two patterns.** The implants FAQ answer and its
  thank-you twin differ only by one sentence ("The crown on top may need maintenance
  over time, like any tooth"). A pattern list has to carry both or two pages fall
  through with no error.
- Still true from 2026-09-21c: **pushing an ads page from the local package reverts
  the Vimeo migration.** That is why this is surgery on the live tree again. All 18
  pages were re-checked for `data-vimeo` after publishing; the counts are unchanged.

### Files

- `22-instatic-api-sync/toggle-ads-warranty-claim.mjs` — `--hide` / `--restore`
- `04-design/.tmp/site-src/pages/ads-{dental-implants,all-on-4}{,-thank-you}.body.html`
  — copy removed, each carrying a note pointing at the restore commands

### Version Control

Committed on `bk-dr-nahlah`. Package and live agree on the ads copy; they still
differ on the film host, as 2026-09-21c records.
