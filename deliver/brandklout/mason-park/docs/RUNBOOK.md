# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Where the build stands — 2026-09-09

**28 pages built.** The eleven approved on 2026-09-01, plus seventeen treatment pages.
**17 of the 31 approved treatments now have pages**; the whole Preventative group is done.

**14 of the 31 approved treatments still have no page.** The definitive list is the
`el-tabs` chips on `home/our-services/index.html`, not the old site's 35
`/services/*` pages. Three of the 22 — **Whitening**, **Porcelain veneers** and
**Wisdom teeth** — have no usable source copy and must not be written from general
knowledge; ask the practice or leave those chips dashed.

**No non-service page from the old build has been rebuilt.** In priority order:
Contact, Privacy Policy, Special Offers, Technology, Appointment, Virtual
Consultation, the Patient Resources hub and its four pages, FAQs, the blog, the
sitemap, the town resource. Full inventory and the deliberate exclusions are in
[`runbook/2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md`](./runbook/2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md).

**Nothing here has been published.** Instatic still holds the eleven-page site.

### Traps that are live right now

- **Build a treatment page with `.tmp/stamp-service.mjs`**, then run
  `.tmp/link-chips.mjs` and `.tmp/prune-nav.mjs`. Neither of the last two is
  triggered by the stamper, and the catalogue chip stays dashed without the first.
- **`prune-nav.mjs` used to be a blind gate** — its route list was hardcoded to the
  eleven routes of 2026-09-02 and reported live pages as DEAD. It now walks `home/`.
  Never reintroduce a literal page list to a gate here.
- **`probe-heights.mjs`'s baseline was stale from 2026-09-02 to 2026-09-09.**
  `base.json` was saved 2026-09-01, the elevation landed 2026-09-02, and nobody
  re-saved it, so the freeze gate reported the approved pages MOVED for a week
  regardless of what you changed. It was re-saved on 2026-09-09 against HEAD.
  **`--save base` after any approved change, or the next person cannot trust it.**
- **The Services dropdown is grouped now** (`GROUPS` in `prune-nav.mjs`), rendering the
  catalogue's seven groups as nested submenus. Empty groups are dropped; a group with one
  built page renders flat. It needed no new CSS or JS.
- **The old WordPress pages carry fabricated testimonials.** `services-sealants` has three
  that match none of the 20 real Google reviews. Check any quoted patient against the
  Trustindex JSON before reproducing it.
