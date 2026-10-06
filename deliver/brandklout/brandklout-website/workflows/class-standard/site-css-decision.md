# site.css stays a page-scoped code asset (decided 2026-10-06, before any write)

`src/styles/site.css` (2,986 chars, 16 rules) is enabled for 2 pages only
(`runtime.styles[Fu9hrUMz8VcVLD2wEKv0N].scope.pageIds` = `multi-location-dental-marketing`,
`general-dentistry-marketing`). It holds:

1. the house fluid root: `:root { --font-from … }` + `html { font-size: calc(var(--base) * 1rem + var(--coefficient) * 1vw) }` with three `@media` steps;
2. seven `@keyframes` (line-flow, ring-reveal, day-reveal, pin-arrive, chip-enter, bk-section-arrive, bk-node-arrive);
3. the `/book` Calendly iframe heights (`.calendly-shell .wz-embed > iframe { height: 47.5rem !important }` + 2 breakpoints).

The registry is site-wide, so moving the file would apply all three on all 35 URLs. That is a
visible change on every page outside the two, measured from the baseline capture itself
(css-parity, scripts off, 390 px wide, most common computed font sizes):

| Page | site.css served | root | body copy |
| --- | --- | --- | --- |
| `general-dentistry-marketing` | yes | 13.76px | 15.03px |
| `multi-location-dental-marketing` | yes | 13.76px | 15.03px |
| `oral-surgery-marketing` (same template) | no | 16px | 17.48px |
| `/`, `book` | no | 16px | 17.48px |

So at 390 every other page would shrink by 14%, and at 1920 grow by 12.5% (root 16 → 18px); the
keyframes would start animations that do not run today on 33 URLs, and `/book`'s calendar would
change height. The brief's rule ("if any page outside those 2 changes, leave site.css scoped") is
therefore met without publishing the change and rolling it back: the move was NOT applied.

Consequence: `editability.mjs` keeps reporting this one asset
(`code asset src/styles/site.css is enabled and holds 16 rule(s)`), so the final gate's
editability line is FAIL for that single, known reason.

Open decision for Alejandro/Sang (not made here): the fluid root is the house standard and the
runbook (2026-09-16) already lists "site.css scoped to no pages" as waiting for approval. Turning it
on for every page is a design change (text size at phone and wide-desktop widths), not a migration.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
