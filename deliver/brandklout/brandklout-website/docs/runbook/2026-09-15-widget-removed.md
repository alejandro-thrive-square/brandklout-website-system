## 2026-09-15: the accessibility widget removed (published, seq stays 25)

Reported (Sang, via Alejandro, with screenshots of the home hero and "Growth you can tie to a real
practice"): "same issue again. showing larger font in the editor but not when it's published", and
"when you refresh the page … on the 2nd refresh it goes back to the normal small font. same with
incognito". Mid-diagnosis Alejandro: "I don't think we need to have the widget on this site".

### Cause: seq 25's widget-fluid.js lost a load-order race

Sang had published nothing since seq 25 (seq 25, no inline font-size on the live h1), so editor and
live were rendering the same data. `.tmp/reload-check.mjs` loads live three times in one browser
profile and samples the sizes over 5 s:

| live, one profile | load 1 | load 2 and 3 (scripts cached) |
| :--- | :--- | :--- |
| 1440 | h1 72px, 0 inline sizes | h1 72px, **454 inline sizes** |
| 1920 | h1 76.63px, p 14.90px, 0 inline | h1 **76px**, p **14px**, 454 inline |

On the first load `widget-fluid.js` (a module, so deferred) attached its observer before the sienna
widget froze the sizes, and removed them. On a cached reload the widget ran first, its writes happened
before the observer existed, and nothing undid them. From then on every text size was frozen whole
px at the load width: nothing followed the stylesheet or a resize. The editor runs no site scripts, so
it always showed the stylesheet's size. (Not reproduced: Sang's exact window width, or the difference
in the "Growth" block, which was not visible in headless at 1440/1920.)

### Done

- `remove-site-widget.mjs` (new; read-merge-write, dry run by default, saves the settings before the change to
  `.tmp/plugins-before-widget-removal.json`): the embed-origins plugin's `siteScripts` was only the
  sienna URL; it is now `""`. Read back empty. Published: 32 pages. **The site seq stays 25**: a
  plugin setting is not content.
- `agency/widget-fluid.js` deleted from the source. **The live script asset still carries it** until
  the next ship; it is inert (it only acts on `data-asw-org-font-size`, which nothing writes now).
- Directive `21-instatic-upload.md`: the widget-fluid bullet and the "live site runs a widget" bullet
  rewritten.

### Gates

- `/`, `/book`, `/guarantee`: no `sienna` in the HTML; the only script is the site bundle.
- `reload-check` after: all three loads identical, 0 inline sizes, h1 72px at 1440 and 76.63px at 1920.
- `resize-check`: 1440 -> 390 h1 72 -> 45px, 390 -> 1440 45 -> 72px, 1440 -> 1920 72 -> 76.63px, no
  inline style.
- `verify-live`: FAIL none.

### Gotchas

- **A widget's first load is not its steady state.** Anything that races a third-party script must be
  tested on a reload in the same profile, not only on fresh pages (every gate uses fresh pages).
- The Instatic `publish()` does not bump `seq`, so `publish-run.mjs <n>` exits 3 on a settings-only
  publish; check `publishedPages` instead.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
