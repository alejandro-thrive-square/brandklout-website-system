## 2026-09-14 (evening): the class system, fluid sizing, and the home page's three new sections

Asked (Alejandro, design feedback on `package-v11/index.html`):

1. The hero's client-results card → a slider, editable visually in Instatic.
2. `#results` → preview 1's "Proof before promises" (growth) layout, with images on the three cards.
3. Add preview 1's client stories section (next to "Why us").
4. Site-wide: fluid text for 2K+ screens, and classes that are reusable and editable from Instatic
   ("I tried to edit the paragraph on the hero section and it didn't quite properly update it").

Decisions he made when asked: **rebuild as a class system** (over moving Sang's CSS into the registry
as-is, or home-only), accepting that the site stops taking Sang's zips as patches; and on 2K screens
**everything scales proportionally** (not text only).

### Done

- **Home page** (`patches/index.html.mjs`, `agency/site.css` "home v12", `agency/slider.js`):
  - Hero slider: Sang's Legacy card is slide 1; AVA, Oceanic, Omnia and OCPAO follow, with numbers
    from his own `customer-stories-v10.json`. Arrows, dots built from the slide count, swipe
    (scroll-snap), autoplay 6.5s that stops on hover, focus, off-screen, reduced motion, and for good
    after a manual move. The floating badge now reads "5 practices. 6 stories."
  - `#results`: kicker "PROOF BEFORE PROMISES", preview 1's copy, three case cards, each with a photo
    (Dr. Sean's headshot, Dr. Rafik Dib, the two Oceanic doctors) and the practice's logo (the three
    logos Sang uploaded to the media library on 2026-09-13).
  - New `#client-stories`: "Five stories. Told by the owners who lived the results." (Sang's own
    wording on v2), five video cards; each thumbnail opens Sang's video pop-up (visual.js), "Read
    story" goes to the story page. Sits between `#results` and "Why us".
- **Admin edits: ported, then DROPPED** on Alejandro's instruction ("Forget the changes that we made
  on Instatic", after seq 19 showed a wrong heading). The OCEANIC wordmark, the "Why us" headline,
  the new founder quote, the featured-stories headline, `/guarantee`'s "60-Day promise" and the hero
  paragraph's 40px margin are all gone; the pages carry Sang's v11 wording again. Republished as
  seq 20. The snapshot of those edits stays in `.tmp/live-pages-2026-09-14.json` if anyone asks.
- **The class system**: `class-system.mjs` + `class-parity.mjs`, and a registry mode through
  `build-import-input.mjs`, `import-run.ts`, `push-site.mjs`, `verify-live`, `css-parity`,
  `visual-diff`, `compare-live`. Directive: `21-instatic-upload.md` → "the class system (v12)".
  Result: **2,153 registry rules** (748 layout classes, 300 type classes, 405 state/context rules,
  700 kept as written incl. the 10 reset-revert rules), 7 conditions, 9 breakpoints; 6,086 elements
  carry a new class; 82 unstyled hook classes link on import (2,235 rules live). **Published seq 19**,
  `{"publishedPages":32}`.
- **Fluid**: rem everywhere + `html { font-size: clamp(100%, 100vw / 90, 160%) }`. Identical to v11
  up to 1440px; at 2560 the whole layout is 1.6x (checked by screenshot).
- **Breakpoints** in the editor: Laptop 1190, Small laptop 1050, Tablet landscape 1000, Tablet 800,
  Tablet portrait 760, Large phone 620, Phone 480, Small phone 400, Extra small phone 360 (Sang's
  fourteen widths folded where no common device width changes).
- Media: three logos uploaded as `bk-*.jpg` (duplicates of Sang's own uploads, under names the build
  can map); alt text updated on 8 images.

### Gates

- `class-parity` (local, Sang's CSS vs the class system): **all ok, 32 pages × 9 widths**
  (1440, 1180, 1024, 820, 768, 600, 430, 390, 360): no computed-property difference, no moved box.
- `verify-live` FAIL none: 32 routes, 89 URLs, 214 asset references, 32/32 titles, 6 retired routes 404.
- `css-parity` FAIL none: 3,927 local rules = 3,927 live, every declared property published.
- `visual-diff` live (seq 19, widget blocked), no page changed height:
  - **1440**: 15 pages 0.000%, the rest ≤0.345%.
  - **390**: 13 pages 0.000%, the rest ≤0.751%, except `/authority-score` 1.617% (its static YouTube
    embed, as on v11).
  - Bands inspected as crops: re-encoded photos (the founder poster, the case-card photos); the text
    is identical. Before the reset-order fix (seq 18) the same gate read 11–13% on every page.
- `form-probe`: the three forms POST once to `formsubmit.co/ajax/sales@brandklout.com` (aborted by the
  probe: no email sent); assessment 0 → 21/21, score 52; legal pages keep their bullets; the story
  player and video pop-up load youtube-nocookie with no CSP error.
- 2560: hero and `#results` screenshots scale as one layout (1.6x).
- `compare-live` (seq 19, 1440 + 390): 84 findings, all benign.
  - 32 are the `.js` class push-site's bootstrap puts on `<html>`.
  - Auto-margin readings on a `.wrap` (0 vs 130/15px) sit on unmoved boxes (trap 30).
  - The rest are `/authority-score` pairing one span off: the `↗` span inside its submit button is
    flattened into the button's label (trap 38), so the next spans with the same class pair with
    their neighbours. The pixel diff there is 0.022%.

### Not ported, flag to Alejandro / Sang

- `/authority-score`: in the admin, the page's YouTube video block was replaced by an **empty** video
  block (no URL). Publishing that would show a blank player, so the source keeps the original video.
  If the video was meant to change, set the new URL on the block in the admin.
- Style experiments in the admin, not carried: an inline `font-size: 5rem` on the hero h1, bold on a
  new `cta-button` class inside "Check My Market", `.8rem` on a new `bullets` class. With the class
  system these are now done on the element's own class chip.

### Gotchas

- **Sang's next zip no longer drops in.** The pipeline still starts from `package-v11` + `patches/`,
  so a small change can still be a patch; but once people edit in the Instatic admin, the admin is
  the source of truth, and a re-push (`--force`) overwrites their edits. Diff the live pages first
  (the snapshot/diff script is in this run's history: `.tmp/live-pages-*.json`).
- `class-parity.mjs` must be all `ok` before any push. A breakpoint fold that looks harmless moves
  whole pages at a real device width (1024 lost the desktop nav).
- `upload-media.mjs` has **no dry run**: running it uploads.
- **Seq 18 was published broken for a few minutes**: the reset revert sat in the code asset, after
  the registry, and beat Sang's `* { box-sizing: border-box }` (every page ~12% off, ~30px taller).
  Seq 19 moved it to the front of the registry. Local parity is blind to this (no Instatic reset
  locally): always run the live `visual-diff` after a publish.
- `css-parity.mjs` used to report every padding/margin side as missing, because the publisher
  collapses four sides into the shorthand; it now accepts the shorthand.
- The class names are generated. `layout` names come from Sang's first class on the element
  (`lead`, `ref-proof-top`), variants as `ancestor_name` or `name-2`; `-box` means the plain name is
  a script hook. Renaming a class in the admin is safe; the scripts only use the hook classes.
- **Some names mislead.** A class shared by elements with identical styles takes the name of the first
  one class-system.mjs met, so unrelated elements can share an odd name (the brand name, arrows and
  footer copyright on `/authority-score` all carry `content-block-h2`). Styling is correct; rename in
  the admin where it confuses. Next improvement: name each shared class by the majority of its
  elements' original classes.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
