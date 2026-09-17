# 2026-09-17, later still — The drag rails' arrows were never bound

The report: "The sliders buttons don't work."

They didn't, on any page, since the second build on 2026-09-03. Live on production for two weeks.

## The bug

`js/20-motion.js` bound the arrows by walking **up** from the rail:

```js
var scope = rail.closest("[data-drag-scope]") || rail.parentNode;
$$("[data-drag-prev]", scope).forEach(...)
```

`data-drag-scope` sat on the section's **head** — the block with the eyebrow, the heading and the
two buttons. The rail is a **sibling** of that head, not a child of it: the head lives inside
`.padding-global > .container-large` and the rail is full-bleed below it. So `closest()` found
nothing, the fallback `rail.parentNode` (a `.padding-global`) did not contain the buttons either,
and `$$` returned an empty list. No listener was ever attached. The rails themselves were fine —
mouse drag and touch scrolling both worked, which is why this read as "the buttons do nothing"
rather than "the slider is broken".

Three rails, three pages: the home reviews (`.words_rail`), /about's rooms (`.room_rail`) and
/results' reviews (`.wall_rail`).

## Done (see the commit that adds this file)

- **`js/20-motion.js`:** the scope is resolved by walking up until an ancestor actually *contains*
  an arrow. The attribute is now the fast path, not the only one, so moving the markup around
  cannot silently unbind the controls again.
- **Markup:** `data-drag-scope` moved from the head to the enclosing `<section>` on all three
  pages, which is the element that holds both the head and the rail.
- **New gate `site-src/drag-test.mjs`.** It clicks next, then prev, on every rail and asserts
  `scrollLeft` moved and came back. `node drag-test.mjs` — 3/3 PASS.
- **Production** pushed and published (seq 12, `{"publishedPages":13}`), then **staging** (seq 6),
  so the two do not drift. `verify-live` FAIL none on both.
- **Proved on the live site, not just locally:** a headless Chrome run against
  `https://westlaketxmedspa.com` clicked all three and measured the scroll: / 0→257→0,
  /about 0→621→0, /results 0→504→0.

## Next

1. The open items from the two earlier runs today are unchanged: the legal pages' review, the
   legal entity name and email, the Cherry link, the "Dr. Stone injects" contradiction, the
   Wellness Wallet question, and the sitemap submission.
2. **Consider running `drag-test.mjs` on the sibling builds.** Stone Surgical Arts and Dr. Nahlah
   use the same `20-motion.js` vocabulary, and the same head/rail split may be there.

## Gotchas

- **Every gate was green for two weeks on a control that did nothing.** `audit` reads markup,
  `all-pages` checks overflow, fonts and console, `probe` captures scroll stops, `compare-live`
  diffs computed styles, `visual-diff` compares pixels. **None of them clicks anything.** When a
  client reports a control that "doesn't work", do not re-run the gates expecting to see it —
  write the click.
- **`closest()` is the wrong tool for a control that is a sibling of what it controls.** A
  full-bleed rail with its header inside a container is exactly that shape, and it is the house
  pattern here.
- **Bind-time failures are silent.** `querySelectorAll` on the wrong scope returns an empty list
  and `forEach` does nothing — no error, nothing in the console. `probe.mjs` reported "console
  clean" on all three pages every time.

## Version Control

Tracked. Committed with the work it describes.
