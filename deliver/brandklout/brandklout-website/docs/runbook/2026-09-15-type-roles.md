## 2026-09-15 (night): a font-size edit that never published → Client-First type roles (seq 41)

Reported (Alejandro, after a call): Sang "tried to change the font size of one paragraph element and
when published it wouldn't actually update. Might be the fluid responsive CSS rule ... we need to
fix it." And the direction: "reusable classes, client-first and relume approach, for example
text-regular, text-medium, text-large, and we apply those throughout the site so we can make
updates very easy."

### What actually happened (measured, `.tmp/edit-experiment.mjs`)

The hero paragraph carried `reference-hero-copy_lead text-18-7`. Its type class held the size at
the base breakpoint AND its own tablet (1rem), mobile-landscape (1.0625rem) and mobile (1.307rem)
sizes, written by the house re-basing so Sang's sizes held at 1024/768/600/360. Editing the class's
base size to 1.5rem, saving and publishing: 1440 and 1200 went to 24px; 900 and 390 stayed 16px and
18px. A base-tab edit never reaches a phone, a tablet-tab edit never reaches desktop, and the class
is one of 305 generated names (`text-18-7`) nobody can find or reason about. That is the "didn't
update". (Also found on the way: `.text-18-8` in the seq 27 snapshot had become `.text-18-7` after
the verbatim rebuild — generated names are not stable across builds either.)

### Done (commit `a63efefa`)

- `class-system.mjs`, new stage **Client-First type roles**: font-size lives ONLY on
  `text-size-{micro 6, mini 8, tiny 10, xsmall 12, small 14, regular 16, medium 18, large 22, xlarge 28,
  display 40, display-medium 56, display-large 64, display-xlarge 80}` and `heading-style-{h6 26,
  h5 30, h4 36, h3 44, h2 56, h1 64, display 72}` (px at 1440, rem on the fluid root; heading roles
  are Manrope h1–h6 tags at 24px and up, big `<strong>` numbers are display text). A role carries the members' modal line-height
  (headings also family/weight/tracking) only when every member had the property; its responsive
  sizes are the members' modal ratios per breakpoint, on the role. Everything else typographic is a
  one-property utility stacked after the role (`text-weight-700`, `text-style-allcaps`,
  `text-family-heading`, `text-tracking-n02`, `text-lh-1-65`). Custom classes carry no type.
  Report: `site-src/type-roles.md` (what each role replaced, deviations, what was not carried).
- New gate `type-roles-check.mjs [width] [--live]`: registry invariants (font-size nowhere but the
  roles and the ~20 rules left as written; no `!important` on roles/utilities) and, per text
  element, Sang's page vs the class site (or live), matched by document order: ≤2px for text,
  ≤12% for display type. `class-parity` no longer applies to type at 1440.
- Directive: the type-roles section, with the editing rules for Sang.

### Gates

- Local: `type-roles-check 1440` FAIL none (3,913 text elements; Δ ≤1px 3,798, ≤2px 51, ≤3px 52,
  ≤4px 7, >4px 5 — the last are display numbers within 12%); `type-roles-check 390` 37 elements past
  the advisory 4px/20% bar (display numbers and one chart heading whose phone size Sang set by
  hand); `standard-check` 270/270 ok (after the ordering fix); `visual-diff --source index` 34%
  (every section shifts a few px when 1,267 sizes snap; the page is 402px taller; not a gate).
  `class-parity 1440` differs on every page by design (type only) and is retired for type.
- Live (seq 38, pushed 30 pages, 0 ship warnings, all 30 SEO cells ok): `verify-live` FAIL none;
  `type-roles-check 1440 --live` FAIL none on 29 pages (authority-score paired around the one text
  node the importer drops); `css-parity` FAIL none; `visual-diff` 1440 index 0.131%, worst
  authority-score 1.891% (as always); 390 index 0.172%; `form-probe` three forms post, legal
  entries intact.
- **The proof (`.tmp/edit-proof.mjs`, seq 39–41)**: `.text-size-medium` base 1.125rem → 1.5rem,
  published: hero paragraph 18 → 24px at 1440, 1200 AND 900 (before the fix 900 stayed 16px);
  390 stayed 15px because the role carries its own phone value — the Webflow model, edit it on the
  phone tab. Tablet tab → 0.75rem: only 900 changed (12px). Reverted; seq 41 is seq 38's content.

### Visible changes (tell Sang)

- Every text now carries a role chip (`text-size-medium`, `heading-style-h2`) plus utilities for
  weight, caps, family, tracking. Change the size on the role and every element in that role
  follows; do it on the Tablet tab and only tablets follow. To change one element, swap its role
  chip (remove `text-size-medium`, add `text-size-large`). Never put a size on the first chip.
- Sizes snapped to the scale: up to 2px at 1440 (13→14, 43→44), the big stat numbers 65/80 kept
  their own display roles.

### Gotchas

- **Never renumber every rule with `order: 0`.** The reset revert's rules (`:where(*){…:revert}`)
  sit at order 0 on purpose, FIRST in the registry; the first roles build gave them the last
  orders, `:where(*){box-sizing:revert}` then beat `*{box-sizing:border-box}`, every `.wrap` went
  content-box and `market-opportunity` scrolled sideways at 1024/768/600/480. Found by
  `standard-check.mjs`, not by the type gate (font sizes were fine). Only the rules a stage pushes
  get an order.
- **Phone bands of text roles under 24px take the smallest ratio any ≥15% group of members had**,
  not the modal one. With the modal, a `text-size-small` button Sang shrank to 13px at ≤479 came
  back at 14.8px and the two nowrap CTAs on the home page pushed it 5px sideways at 390. Text 1px
  smaller is not a bug; sideways scroll is. Display type and headings keep the modal: applied to
  them, the same rule halved the stat numbers on phones (42px → 24.8px).
- The type gate must settle (fonts.ready + two frames) before reading computed sizes: read at
  `load`, a 200KB stylesheet was still applying and the failing elements changed from run to run.
- A role carries a non-size property only when every member had it; otherwise a member without it
  would inherit differently and the role would override that.
- Font-family strings arrive quoted three ways (`Manrope,system-ui`, `"Manrope", system-ui`);
  canonicalise before naming a utility or eleven `text-family-heading-N` appear.
- Both local sites link `/assets/site.css` root-absolute: a gate that serves them from one server
  renders BOTH unstyled and reports Δ 0.00 everywhere. One server per site root, and assert the
  page is styled.
- The generated type-class names change between builds; the gate matches elements by document
  order, never by class name.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
