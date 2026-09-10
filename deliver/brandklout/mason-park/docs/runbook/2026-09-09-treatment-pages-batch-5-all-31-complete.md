# 2026-09-09 — Treatment pages, batch 5: all 31 built, and the blocked list was my own mistake

Fifth and final treatment batch. Batches
[1](./2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md),
[2](./2026-09-09-treatment-pages-batch-2-preventative-and-the-grouped-menu.md),
[3](./2026-09-09-treatment-pages-batch-3-hygiene-and-gums.md) and
[4](./2026-09-09-treatment-pages-batch-4-comfort-and-pain.md) carry gotchas that still apply.

## Done

**Seven treatment pages**, completing the catalogue. **All 31 approved treatments now have
pages, all 32 chips link, and none are dashed.** `prune-nav.mjs --check` reports that every
internal link on every page resolves.

| Page | Group | Source |
| :--- | :--- | :--- |
| `cosmetic-dentistry` | Cosmetic | `services-cosmetic-dentistry` |
| `dental-implant-placement` | Oral surgery | `services-dental-implant-placement` |
| `crown-lengthening` | Oral surgery | `services-crown-lengthening` |
| `invisalign-questions` | Invisalign® | `invisalign-faqs-katy-tx` |
| `porcelain-veneers` | Cosmetic | `services-porcelain-dental-veneers` + the cosmetic page |
| `wisdom-teeth` | Oral surgery | the extractions page + `gaining-wisdom-on-wisdom-teeth-77079-dentist` |
| `whitening` | Cosmetic | the cosmetic page + the Invisalign page + the laser page |

## The mistake worth recording

> [!IMPORTANT]
> **Whitening, porcelain veneers and wisdom teeth were on a "blocked, needs client copy" list
> for four batches. They should not have been.** The test I applied was "does this treatment
> have a dedicated page in the scrape", and it is the wrong test. The rule is **do not invent**,
> not **only use dedicated pages**.
>
> All three had real practice copy scattered across other sources:
> - **Whitening** — two full paragraphs on the cosmetic-dentistry page (in-office and take-home),
>   the Kör gel included with every Invisalign plan, and the laser's role in activating whitening
>   agents. Plus a real review naming it.
> - **Porcelain veneers** — a 193-word dedicated page that is thin but substantive (what they
>   are, who they suit, what they make teeth look like, longevity, care), *plus* a fuller
>   paragraph on the cosmetic page, *plus* the durability comparison already used on the bonding
>   page, *plus* a review from a patient who had them here.
> - **Wisdom teeth** — the whole wisdom-tooth section of the extractions page (three eruption
>   states, complications, digital imaging, sedation), plus a substantive blog post carrying the
>   AAOMS 90%-impaction figure, the 17–25 age range, and the systemic-health argument.
>
> **Before declaring a treatment unbuildable, grep the whole scrape for it**, not just
> `services-<slug>/`. `grep -rl "whitening" 01-content-intake/.tmp/site-scrape/pages/` would
> have settled it in one command on day one.

The correct response to thin sourcing is a **shorter page**, which the README already says:
"A beat with nothing behind it is dropped, not invented — a thin treatment gets five chapters,
not eleven." `whitening` has six chapters and `invisalign-questions` has five. Neither was
padded to match the house shape.

## Gotchas

- **`invisalign-questions` carries no `ch-path` and no `ch-compare`, and that is correct.** Its
  entire source is 21 questions in 7 groups. Both scrubbed scenes in `journey.js` are guarded
  with `if (!sec) return;` and **eight of the eleven approved pages already have no `ch-path`**,
  so a page without one is the house norm rather than an exception. This was checked in
  `journey.js` before the page was written rather than assumed.
- **`porcelain-veneers` states the enamel-removal row plainly** and adds one line the source
  does not: that enamel does not grow back. That is not an invented claim, it is the same fact
  already stated on `night-guards` and `composite-fillings`, and it is the single row on that
  comparison table a patient should sit with before deciding.
- **`wisdom-teeth` is not an argument for removal.** Its `ch-compare` says outright that some
  wisdom teeth get monitored rather than removed and that the imaging decides, not the pain.
  A page that only argues one way on an elective extraction would be a sales page.
- **`whitening` names its own limits** — restorations do not lighten, health comes first, and
  some stains will not lift and need covering instead. Those are the three things that make
  patients unhappy after whitening, and all three are on the page rather than in a footnote.

## Next

**The treatment catalogue is finished.** What remains is the non-service pages, in this order:

1. **Contact** (`/contacts`) — the site still has no contact page.
2. **Privacy Policy / Terms** (`/terms-of-service`, 2,206 words) — legally required.
3. **Special Offers** (`/special-offers`) — the services page lists offers with no page behind them.
4. **Technology** — `/technology` + `/pearl-ai` + `/ceramillmotion3` + `/technology-ai` into one.
5. Appointment, Virtual Consultation, the Patient Resources hub and its four pages, FAQs.
6. The blog and its ~200 posts — its own decision.
7. Sitemap, Katy town resource.

**Nothing is published.** Instatic still holds the eleven-page site. That is now the largest
single gap between this repository and what a patient can actually see.

## Version Control

Runbooks are tracked. This file and its `INDEX.md` row are committed with the run.
