## Latest completed: Dr. Nahlah Instatic parity + FP figure + chapters 07/08 (2026-08-19, later)

Brief: finish the FP1/FP2/FP3 image with Magnific, make the Instatic components match the local
build ("a few step backs on the home page"), clean the duplicated JavaScript, and turn home
chapters 07 and 08 white. **Still NOT published.**

### The FP1/FP2/FP3 figure, rebuilt
`site-src/assets/fp1-fp3-comparison.png` is now a 2000x387 **transparent** PNG: the three real
prosthesis renders lifted out of the client's old diagram, upscaled with Magnific `ultra-photo`
(2x is the only scale that mode allows) and cut out with `images_remove_background`, then composed
on a page in the site's own type and colour and screenshotted. **No dental anatomy was generated** -
every tooth in it is the client's own product render, which is the whole point on a prosthodontist's
site. The old version was navy/orange/red, in a generic UI sans, on a white card inside a cream
section, and repeated ~70% of the `.ta-card` copy that sits directly above it. Working files in
`04-design/.tmp/fp-work/` (`fig.html` is the composition, `shotfig.mjs` renders it transparent).

### Home chapters 07 and 08 now read on the cream ground
`data-theme="dark"` came off `#proof` and `#invitation`; `.pf-film` gained its own
`data-theme="dark"` so the copy over the video scrim still inverts. Baked colours in
`37-ch-proof.css` and `38-ch-invitation.css` went to tokens (`--fg-soft`, `--line`, `--card`,
`--accent`, `--accent-lg`). The gold CTA band is unchanged and still closes the page.

### What Instatic's HTML importer actually destroys (proved with a probe page)
Not the push script, the importer. `zz-probe` was created, fed known markup, read back, deleted:
- **`alt` is wiped on every image.** `base.image` has NO alt prop at all; the module template emits
  a hardcoded `alt=""`. The only way back in is the `htmlAttributes` bag, which produces
  `<img alt="real text" src=... alt="">`. The HTML spec keeps the FIRST duplicate, so browsers and
  crawlers read the real text. Ugly in view-source, and it is all the platform offers.
- **Empty inline elements are dropped**: the burger's two `<span>` bars (menu button rendered as a
  blank 44px square on all 28 pages) and, on a `<button>`/`<a class="btn">`, the whole child
  structure is flattened to text (the `.btn>span` that carries `z-index:1`, and the gallery filter
  counts `<b>54</b>`).
- **`<video>` loses `id`, `poster` and `aria-label`.** `base.video` has no htmlAttributes bag, so
  the ids are unrecoverable, but it DOES have a `poster` prop, which is how the hero got its
  poster back. `#heroFilm` returning null meant the first `onEnter` **threw**, which is what took
  the home page's hero animation down.
- **`<input type=range>` becomes `type="text"`.** All three before/after sliders were text boxes
  reading "50".
- **`<iframe>` is allowlisted**: the YouTube frame survives, the ReputationHub review widget is
  rewritten to a `<div>` keeping every attribute.

### The fix: site.js repairs its own markup
Rather than hand-patching Instatic in its idiom, `site.js` now rebuilds what importers strip, and
is a no-op wherever the markup arrived intact (`90-boot.js`: burger bars, `.btn` label spans,
`.ga-filters` counts; `20-pagekit.js`: coerce the slider back to `type=range` and restore its
aria-label; `ch-arrival.js` / `ch-proof.js`: resolve the films by CLASS with an id fallback and
guard every use; `ch-proof.js`: rebuild the review iframe from the div the importer left).

### NEW GATE: `13-content-export-import/.tmp/sim-check.mjs`
`build-sim.mjs` writes the pulled Instatic documents back out as servable pages against the same
site.css/site.js, and `sim-check.mjs` drives them under CDP. This tests the repair against the REAL
imported markup, which no screenshot can see. **24/24.**

### NEW TOOL: `13-content-export-import/.tmp/parity.py`
Token-stream diff of local built page vs the Instatic document, normalising only the two expected
platform differences (routes, the 21-char upload id). Before: 528 differences, 361 unexplained.
After: **224, every one classified**, 0 unexplained.
182 empty `<span>` (rebuilt at runtime) | 22 filename normalisations | 11 avif to jpg |
6 `<b>` in a button (rebuilt) | 2 `<video id>` (selected by class) | 1 review iframe (CSP).

### Instatic code assets: 216 to 30 enabled
The "a lot of duplications on JavaScript files" was real and worse than it looked: the earlier
2026-08-19 pass emptied 109 inline scripts but left every one `enabled: true`, on the belief that a
stored runtime could not be rewritten. **It can**: `site_write_code_asset` merges `runtime`, and
`{enabled:false}` sticks (verified by read-back). `retire-scripts.mjs` disabled 185 assets: 113
per-page inline stubs, ~50 `zprobe/ztest/zs-*` debugging probes, 12 empty favicon shims, 24 empty
GSAP shims, 4 `pagekit-*`, `wz-site.js`, `before-after.js`. Every page now loads exactly:
`gsap-head-i.js`, `site.js`, its own JSON-LD, `site.css`, `runtime-states.css`.

### Gates
`css-vocab` 234 | `site-test` **484/484** | `interaction-test-gsap` **62/62** | `swap-proof` **6/6**
| `fluid-qa` **390/390** | `image-substance` OK | em dashes **0** | `sim-check` **24/24**

### Gotchas
- **`site_update_node_props` shallow-merges the PATCH, not `htmlAttributes`.** Patching
  `{htmlAttributes:{alt}}` replaced the whole bag and silently deleted `data-drift` from ~60 images.
  The parity diff caught it. Write the attribute bag COMPLETE, every time, which is what
  `restore-img-attrs.mjs` does (456 images rewritten, the local page as source of truth).
- **`site_update_node_props` returns `{"ok":true}` for props that do not exist.** `{alt:...}` and
  `{altText:...}` both "succeeded" and changed nothing. Always read back.
- **21 characters is a real filename prefix.** Stripping the upload-id pattern from the LOCAL side
  too ate `case-veneers-implants-`, which is exactly 21 chars, and produced four false positives.
- **Gate harnesses default to ports nothing is serving**: `swap-proof.mjs` and `fluid-qa.mjs` to
  :8903, `site-test.mjs` to :8902, `interaction-test-gsap.mjs` to :8901. Pass the URL explicitly or
  the gate "fails" against a 404 page.
- **`images_upscale` mode `ultra-photo` only allows `scale:2x`**; 4x is a hard error.
- The Instatic Site-editor bridge still flaps: `site_render_snapshot` needed 4 attempts before it
  returned a frame, with `get_context` reporting `siteConnected:true` throughout.

### Still open
- **The Google review widget cannot render on Instatic**: its CSP does not list `reputationhub.site`
  in `frame-src`/`script-src` (an earlier session recorded exactly this in `review-widget-mount.js`).
  The rehydration in `ch-proof.js` removes its own frame after 8s if nothing sizes it, so the box
  collapses rather than showing an empty 520px well. **The real fix is a Railway env change on the
  Instatic service** and it touches a live service, so it is the user's call.
- **Nothing is published.** `site_publish` has not been called.
- **7,000+ vs 18,000+ implants** on `about` and `doctor-referral`, still the user's call.
- `assets/broll.mp4` still cannot be uploaded (`media_upload` is images only).
- Debris needing a manual pass in the editor: 34 duplicate media uploads (the superseded
  `fp1-fp3-comparison.png` joined them) and 186 disabled code assets.
- **Webflow is untouched** and is now three architectures behind.
