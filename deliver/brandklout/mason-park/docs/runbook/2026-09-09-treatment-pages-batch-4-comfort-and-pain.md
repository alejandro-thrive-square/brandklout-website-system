# 2026-09-09 — Treatment pages, batch 4: Comfort and pain, and a triage table I had to delete

Fourth batch of the day. Batches [1](./2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md),
[2](./2026-09-09-treatment-pages-batch-2-preventative-and-the-grouped-menu.md) and
[3](./2026-09-09-treatment-pages-batch-3-hygiene-and-gums.md) carry gotchas that all still apply.

## Done

**Three treatment pages**, completing the Comfort and pain group and taking the site to
**24 of 31** approved treatments. Four of the seven catalogue groups are now finished.

| Page | Source |
| :--- | :--- |
| `sedation-dentistry` | `services-sedation-dentistry` |
| `emergency-dentist` | `services-emergency-dentist` |
| `tmj-tmd` | `services-tmj-tmd` (+ `services-what-is-tmj`) |

**25 catalogue chips now link.** Seven still dashed: Smile makeovers, Porcelain veneers,
Whitening, Invisalign® questions, Wisdom teeth, Implant placement, Crown lengthening.

## Gotchas

> [!IMPORTANT]
> **I invented a clinical triage table on the emergency page, and deleted it.**
> The first cut of `emergency-dentist` carried a `vs-table` headed "Call the practice vs Go to
> the emergency room", with a right-hand column listing breathing difficulty, suspected broken
> jaw, uncontrollable bleeding and head injury. **None of that is in the practice's copy.**
> It is standard triage and it is probably correct, which is exactly what makes it dangerous:
> it reads as the practice's clinical position on when to send a patient elsewhere, and the
> practice never said it.
>
> This is the same rule that keeps Whitening unwritten. Inventing dental claims is not more
> acceptable when the claim is a safety one — if anything it is less, because a wrong triage
> line does more harm than a wrong marketing line. It was replaced with a plainly-framed
> paragraph: a short list of situations that belong in emergency medical care, stated as
> general advice rather than as a clinical checklist, ending in "if you are unsure, call and
> describe it". **If the practice wants a real triage list on that page, they should write it.**

- **The emergency page's chapter order is deliberately different, and should stay that way.**
  The old WordPress page buried its first-aid advice two thirds of the way down, under the
  marketing. Someone reading that page is quite possibly holding a tooth in a cup of milk, so
  the `ch-qualify` slot (`id="firstaid"`, chapter name "Right now") carries the four first-aid
  cards and the arrival links straight to it. **Do not "fix" the order to match the other
  pages.** The chrome is constant; the chapter bodies and their order serve the reader.
- **The knocked-out-tooth card is `svc-card is-price`** so it reads as the one filled panel in
  that grid. That component is normally the money card; here it is the time-critical one,
  which is the same job — the thing in the grid you must not miss.
- **`probe-hooks.mjs` output read mid-run looks like a failure.** Reading the background task's
  file while it was still working showed `emergency-dentist` with a `clean` from `shot.mjs` and
  no hook lines at all, which looks exactly like a crash. It was simply still running. Wait for
  the completion marker before concluding anything from a partial file — this cost a
  needless re-run.
- **`tmj-tmd` merges two old pages** (`services-tmj-tmd` and `services-what-is-tmj`) and its
  `ch-why` is renamed "The Options" rather than "Why This One", because the honest content
  there is the five non-surgical therapies, not a benefits list. The sixth cell is a
  `svc-card is-price` carrying the surgical options, stated as rare.

## Next

1. **Seven treatments left.** With source copy: `cosmetic-dentistry` (Smile makeovers),
   `dental-implant-placement`, `crown-lengthening`, `invisalign-questions`. That is four.
2. **Three still blocked on the practice**: `whitening` (no source page), `porcelain-veneers`
   (193 words), `wisdom-teeth` (no page of its own).
3. Then the non-service pages, starting with **Contact** and the **Privacy Policy**.
4. Nothing published. Instatic still holds the eleven-page site.

## Version Control

Runbooks are tracked. This file and its `INDEX.md` row are committed with the run.
