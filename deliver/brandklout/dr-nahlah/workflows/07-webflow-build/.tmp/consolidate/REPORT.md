# Class consolidation — outcome

Dr. Nahlah Webflow site `6a6b84cc7fe55ddeabc0b314`, run 2026-08-17.

**Nothing is published.** Everything below is on the Designer canvas and ships on
the client's next publish.

## What the problem was

The site was built by pasting whole pages, one page at a time. The converter
renamed every class per page to avoid collisions, so a single component exists as
up to eleven separate classes — `pk-more`, `pk-more-2`, … `pk-more-9`. Editing the
component means editing it nine times. The user hit this directly: the Aug-14 →
Aug-17 stylesheet diff shows them applying the *same* layout fix three times, to
`pk-more-7`, `pk-more-8` and `pk-more-9`.

## What was done

**15 families consolidated, 90 fork classes retired, 273 element rewrites** —
each rewrite verified by comparing the classes the API returned against the
intended list.

| Family | Forks retired |
| :--- | ---: |
| `ph-bg-after`, `pk-crumb`, `ph-lead`, `nx-k`, `nx-d` | 9 each |
| `lc-head` | 8 |
| `ph-meta`, `lc-body`, `sp-copy`, `sp-list` | 6 each |
| `summary-after`, `ba-line-before` | 4 each |
| `pk-ba-cap` | 3 |
| `pk-quote`, `pk-quote-by` | 1 each |

**`chapter-tag` (10), `dr-grid` (8), `dr-foot` (8), `n` (5) — 31 further forks,
correctness confirmed.** A sweep of **1,303 elements across 10 of the 11 live
pages found ZERO still referencing any retired class** from these families
(Contact was rate-limited, but its moves are journalled as successful). What is
NOT confirmed is cosmetic: whether the now-unused class objects were actually
deleted from the style panel. `query_styles` is quota-exhausted at any result
limit while every other endpoint works, so that check has to wait. It affects
tidiness, not rendering.

**Totals: 19 families, 121 fork classes, 273 element rewrites.**

## What was deliberately NOT done

**58 converter tag-name families (415 classes, 2284 elements)** — `di-li`,
`vn-span-2`, `di-a-4` and similar. Their definitions match only because the design
is consistent. They are per-element generated names, not components; merging them
would fuse unrelated elements under one meaningless name and make a future
single-page edit hit all eleven pages.

**`btn-after` and `eyebrow`** — `"btn-after 2"` and `"btn-after-2"` are two
distinct Designer classes that sanitise to the same CSS selector `.btn-after-2`.
The stylesheet cannot tell them apart, so a merge risks retiring the wrong one.

**`creds-more-after` / `pk-more-after`** — byte-identical but different
components. Identical definitions are not sufficient grounds to merge; members
must be numbered variants of the same stem.

**Relume library classes** — never touched, so the shared kit stays intact.

## Blocked — 3 families, 12 forks

`pg-hero` (6), `pk-head` (5), `pk-quote-mark` (1).

`set_style(["pg-hero"])` fails with *"One or more styles not found: pg-hero"*.
The class exists, but so do combos of the same name (`.contact-div.pg-hero`,
`.sg-div.pg-hero`, `.patient-stories-div.pg-hero`), and the API cannot
disambiguate. The obvious fix — delete the redundant combo first — does not work:
**`remove_style` with `parent_style_names` returns success but does not delete
the combo.** All seven are still present after reporting deletion.

This is circular through the API: the combo cannot be removed while elements use
it, and those elements cannot be restyled because the name will not resolve.

**These are quick to finish by hand in the Designer** — 26 elements across 7
pages. Select the element, remove the numbered class, apply the canonical:

| Page | Element | Change |
| :--- | :--- | :--- |
| Dental Implants | 1 hero, 5 package heads | `pg-hero 7`→`pg-hero`, `pk-head 6`→`pk-head` |
| All-on-4 | 1 hero, 5 package heads | `pg-hero 6`→`pg-hero`, `pk-head 5`→`pk-head` |
| Implant Cost | 1 hero, 4 package heads | `pg-hero 3`→`pg-hero`, `pk-head 4`→`pk-head` |
| Sedation Dentistry | 1 hero, 3 package heads | `pg-hero 2`→`pg-hero`, `pk-head 3`→`pk-head` |
| Patient Stories | 3 package heads | `pk-head 2`→`pk-head` |
| Veneers | 1 hero | `pg-hero 5`→`pg-hero` |
| Smile Makeover | 1 hero | `pg-hero 4`→`pg-hero` |

## Held back pending a decision

**`pk-more`** (5 forks) and **`pk-more-7`** (1). The user edited `pk-more-7/8/9`
to `display:flex` + `margin-right:auto`, so they no longer match `pk-more`.
Collapsing the family means choosing which definition wins — adopting the new one
also changes the pages still on `inline-flex`. Not guessed.

**`fa-body`** (4 forks). One of its four elements on Implant Cost cannot be
captured — every query for it returns 429 — so retiring `fa-body-2` could strip
that element.

## Safety record

- **No element anywhere references a retired class.** 1,303 elements swept.
- **No element was orphaned.** All 26 elements whose restyle failed still carry
  their original class (`check26.json`: 0 of 26).
- Every write is journalled in `journal.jsonl` with before/after, so any change
  can be reversed.
- `elements.json` is the pre-run snapshot of every element's class list.

## Defects found and fixed in the tooling

1. **Access token expired mid-run** — the driver fetched the bearer once per
   process; ~160 writes became 401s. Now refreshed per call.
2. **The published CSS is not a complete inventory of style objects** — Webflow
   emits a rule only for a combo that HAS properties, so property-less combos are
   invisible. Enumerate combos via `query_styles`, never from the stylesheet.
3. **The safety guard was inert** — `movedBad` was keyed by style name but looked
   up by selector, so "do not retire a fork whose elements failed to move" never
   fired and all 133 forks were retired regardless. Webflow's own refusal to
   delete an in-use style is the only reason nothing broke. Fixed.

## To finish

```bash
cd deliver/brandklout/dr-nahlah/workflows/07-webflow-build/.tmp/consolidate
WF_MIN_GAP_MS=8000 node survey.mjs     # confirm the last 4 families
node verify.mjs                        # full check
```
