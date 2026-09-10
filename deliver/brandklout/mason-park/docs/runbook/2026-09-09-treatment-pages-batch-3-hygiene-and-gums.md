# 2026-09-09 — Treatment pages, batch 3: Hygiene and gums, and a gate that could not fail

Third batch of the day. Read [batch 1](./2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md)
and [batch 2](./2026-09-09-treatment-pages-batch-2-preventative-and-the-grouped-menu.md) gotchas
first; they all still apply.

## Done

**Four treatment pages**, completing the Hygiene and gums group and taking the site to
**21 of 31** approved treatments:

| Page | Source |
| :--- | :--- |
| `comprehensive-care` (Deep cleaning) | `services-comprehensive-care` |
| `laser-dentistry` | `services-laser-dentistry` |
| `airflow-one` | `services-airflow-one` |
| `frenectomy` | `services-frenectomy` |

**`check.mjs` now balances HTML container tags** (check 8). It balanced CSS braces and left
the more likely mistake unguarded: every body under `home/` is hand-authored, and an unclosed
`<div>` does not throw — the browser silently reparents everything after it and the layout goes
wrong at one breakpoint, on one page, with no error anywhere.

It strips comments and `<script>`/`<style>` bodies first (the authored comments in these pages
discuss `<div>` and `<details>` constantly), skips void elements, and reports per tag.
**It was verified in both directions**: clean on all 31 pages, and it correctly caught a
deliberately deleted `</article>`. A gate that has only ever said "clean" has not been tested.

## Gotchas

> [!IMPORTANT]
> **Never build a regex with `new RegExp("...\s...")` in a file written through a heredoc.**
> The first cut of check 8 did exactly that. Python's heredoc ate one backslash level, the
> file ended up holding `new RegExp("<" + tag + "(?=[\s>])")`, JS parsed `"\s"` in a string
> literal as the plain letter `s`, and the character class became `[s>]`. The gate then
> reported `<main> unbalanced: 0 open, 1 close` on **every page** — 507 errors — because
> `<main class=…` has a space after the tag name and a space is not `s` or `>`.
>
> This is the README's heredoc rule reaching a `.mjs` through Python rather than bash. The
> fix was to use a **single regex literal** (`/<(\/?)([a-zA-Z][a-zA-Z0-9]*)(?=[\s/>])/g`)
> with a tag-name capture and a depth map, so there is no string escaping to lose at all.
> **Prefer a regex literal over `new RegExp` in this folder, always.**

- **A treatment page can be about infants without breaking the no-child-photography rule.**
  `frenectomy` is mostly an infant and child treatment and the copy says so across all three
  age groups, honestly. It carries **no child photograph** — the qualify grid uses the waiting
  room, the front desk and a family at the desk. `grep -l "kid-" home/services/*/index.html`
  returns nothing, and that is the check to run after any page that mentions children.
  The rule is about photography and about kids-shaped chapters, not about pretending the
  practice does not treat children.
- **`laser-dentistry` is a technique, not a treatment, and its qualify chapter had to be
  re-aimed** — the question is not what you have but how you would rather it were done. Its
  `ch-treatment` ledger is the five procedures the laser is actually used for, because
  "laser dentistry" means nothing until you say what it does.
- **Do not let `airflow-one` claim it replaces a deep cleaning.** The practice's own myth
  section says it "can reduce the need for" invasive scaling for maintenance patients. The
  page says exactly that and links to `comprehensive-care` for cases where the pockets
  already call for one.
- **A self-test that mutates a page will lose it if the page is untracked.** The check-8
  self-test deleted `</article>` from `comprehensive-care/index.html`, which had been stamped
  minutes earlier and never committed, so `git checkout --` could not restore it. Re-stamping
  from the scratchpad spec fixed it. **Self-test against a committed page, or re-stamp after.**

## Next

1. **Ten treatments left.** Comfort and pain (`sedation-dentistry`, `emergency-dentist`,
   `tmj-tmd`), Cosmetic (`cosmetic-dentistry`), Oral surgery (`dental-implant-placement`,
   `crown-lengthening`), and `invisalign-questions`. All have full source copy.
2. **Three still blocked on the practice**: `whitening`, `porcelain-veneers`, `wisdom-teeth`.
3. Then Contact and the Privacy Policy.
4. Nothing published yet.

## Version Control

Runbooks are tracked. This file and its `INDEX.md` row are committed with the run.
