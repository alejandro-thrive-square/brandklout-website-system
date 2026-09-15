## 2026-09-15: headings not scaling (the accessibility widget) and the breakpoint problem again (seq 25)

Reported (Alejandro, after seq 24): "Seems like the heading is wrong again", then "It's wrong because
is not scaling properly", then "FYI we have the breakpoint problem again, might be part of your scripts".

### 1. Headings not scaling: the sienna accessibility widget

The embed-origins plugin's `siteScripts` loads `sienna-accessibility` (2.2.x, jsDelivr) on every page;
it was added outside this toolkit. On load its `W(scale = 1)` visits every
`h1-h6, p, a, dl, dt, li, ol, th, td, span, blockquote`, reads
`parseInt(getComputedStyle(el).fontSize)` (whole px, rounded DOWN: 64.8 -> 64), stores it in
`data-asw-org-font-size` and writes it back inline as `font-size: <px>`. It never recomputes. So the
rem sizes, the fluid root and every breakpoint size freeze at the width the page was opened at:

| live, seq 24 | open 1440 -> resize 390 | open 390 -> resize 1440 | 1440 -> 1920 |
| :--- | :--- | :--- | :--- |
| with the widget | h1 72px -> **72px** | 45px -> **45px** | 72px -> **72px** |
| widget blocked | 72px -> 45px | 45px -> 72px | 72px -> 76.6px |

The gates (`visual-diff`, `compare-live`) block the widget on purpose, so none of them saw it. This
is very likely what "the heading is not right" meant all along, at seq 19 as well.

**Fix: `agency/widget-fluid.js`** (concatenated into the one script asset after Sang's scripts). It
keeps the widget and its text-size tool. At 100% (`asw-user-settings` → `states.fontSize` unset or
1) it removes the widget's inline sizes and `data-asw-org-font-size`, so the stylesheet decides.
At any other scale it recomputes each size as stylesheet size × scale, and again after every
resize. Remove, read and write are three passes, so an inherited size is never read while its parent
still carries a scaled inline size; a MutationObserver on `style` catches the widget's writes, and
`takeRecords()` drops our own.

Checked locally with the real widget injected (`.tmp/widget-local-test.mjs`): scale 1, h1 45 / 72 /
76.6px at 390 / 1440 / 1920 with no inline sizes; scale 1.2, h1 54 / 86.4 / 91.95px (exactly 1.2x)
at the same widths, following each resize.

### 2. The breakpoint problem again: three new max-width conditions

Sang's v16 CSS added `max-width` 900 (the Calendly block), 680 (the guarantee card) and 600. They are
not in `class-system.mjs`'s `BP_MAP`, so seq 22 published them as three extra site conditions beside
the seven editor breakpoints (11 conditions; seq 21 had 7). **My v16 run did that, and its runbook
even noted it as harmless.** Now folded UP into the next editor breakpoint: 900 -> Tablet landscape
(1000), 680 -> Tablet portrait (760), 600 -> Mobile landscape (620). Every gated device width at 768
and above and every phone keeps its styles; only 900-1000, 680-760 and 600-620 change. Conditions:
8 (the seq 21 seven + v16's `(max-width: 1100px) and (min-width: 981px)` range, which cannot be a
breakpoint).

### Gates

- `class-parity` (1440, 1024, 912, 820, 768, 700, 600, 390, 360): 277/288 identical. The 11 others
  are all intended: `/book` at 912 (the ≤900 Calendly rules now start at 1000), `/guarantee` at 700
  (the ≤680 card rules now start at 760), and the same 9 pages at 390 as since seq 21 (the phone fold).
- Shipped (the first attempt hit "Railway can't verify your SSH key right now … temporary service
  issue"; the retry went through), live seq checked (24), pushed, published **seq 25**, 32 pages intact.
- Live breakpoints: the seven editor breakpoints; conditions: 8, none of them a plain max-width.
- `.tmp/resize-check.mjs` on live, **with the widget**: open 1440 -> 390, h1 72 -> 45px, "Why us" 57 ->
  38px; 390 -> 1440, 45 -> 72px; 1440 -> 1920, 72 -> 76.6px; no inline sizes. Identical to the
  widget-blocked run.
- `verify-live` and `css-parity` FAIL none; `prequal-probe`: five pages POST to FormSubmit -> sales@;
  `visual-diff` home / `/book` / `/guarantee` ≤0.161% at 1440, ≤0.244% at 390.

### Gotchas

- **Test live behaviour WITH the widget as well.** The gates block it for pixel stability; anything
  about font sizes or resizing must also be checked with it loaded (`.tmp/resize-check.mjs`).
- **Every new `max-width` in Sang's CSS needs a `BP_MAP` entry**, or it becomes a site condition. Check
  `class-system`'s "max-width blocks by width" line against `BP_MAP` after each new package.
- `class-system.mjs` sometimes dies with `UNKNOWN: unknown error, open …class-site/<page>.html`
  (a Windows lock on the file). Re-run it; the second attempt went through both times.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
