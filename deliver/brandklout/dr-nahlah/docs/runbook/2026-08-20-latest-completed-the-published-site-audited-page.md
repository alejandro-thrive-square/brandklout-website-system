## Latest completed: the published site audited page by page, and four site-wide defects closed (2026-08-20)

Brief: "make a full site audit page per page, the before and after sliders seem to be blocked, maybe
import the code from the instatic import feature, the site is very large, is the size making errors".
The size was not the problem. **Everything found lived in the one layer nothing was measuring.**

### The layer nobody was gating
The site exists three times over: the local build, the Instatic draft, and the published pages.
`site-test` / `fluid-qa` / `interaction-test` read the LOCAL build. `verify-all` compares node counts
on the DRAFT. `sim-check` serves the pulled documents against the local `site.css` and `site.js` and
**never loaded `runtime-states.css`**, which is the third stylesheet Instatic actually serves. So
every gate was green while the client's site had 72 dead sliders and no alt text anywhere.
**Do not re-import to fix a rendered-page defect.** The importer is what strips `alt`, empty spans,
button children, `<video poster/id>` and rewrites `<input type=range>` to `type="text"`; re-importing
re-inflicts all of it and discards every repair. Measure the served page instead.

### NEW GATE: `08-qa/.tmp/audit-site.mjs`
Drives all 77 published URLs under headless Chrome and asserts what a renderer can reach: does moving
a slider move the wipe, is the video playing, did any reveal strand at opacity 0, did anything throw,
did a sub-resource 404, is the title unique. `--resume`, `--only`, `--base`, `--local`, `--out`.
`audit-report.mjs` groups the JSON **by defect class, not by page**, because that is the order the
fixes get applied in. `probe.mjs` chases one finding without re-running the sweep (`@file` for a
large expression: 46KB in argv is ENAMETOOLONG on Windows).
**Its scroll routine must hold at the bottom.** ScrollSmoother lags the real scroll by ~1.2s, so a
fast sweep reports three stranded reveals in the last section of every page. That is the harness.

### 1. The sliders: one orphaned CSS rule, not the importer
`runtime-states.css` still carried `.pk-ba input { display: none !important }`, written when
`before-after.js` made the whole figure a pointer-drag surface. `retire-scripts.mjs` disabled that
asset on 2026-08-19 because site.js had taken over and COERCES the input back to a range. The CSS
outlived it and hid the very element site.js repairs. 72 sliders across 8 pages, frozen at 50/50.
Fixed by `fix-ba-slider.mjs`. Live: 54/54 on `/smile-gallery`, 3/3 on `/veneers`.

**`runtime-states.css` now has a local owner** — `src-runtime-states.css` plus
`sync-runtime-states.mjs --verify/--pull/--push`. It was the only file on the site hand-authored on
the platform with no local copy anyone diffed, which is exactly why a dead rule could survive in it.
`build-sim.mjs` now serves it too, so `sim-check` sees the real three-stylesheet cascade.

### 2. Alt text: 482 images, gone again
A page re-push wipes every node-level `htmlAttributes` patch, and the 33-page sync of 2026-08-19 was
never followed by `restore-img-attrs.mjs`. 111 of 111 images on `/smile-gallery` had `alt=""`.
Re-run: 482 rewritten, **0 already correct**. The hero video's `poster` goes the same way
(`fix-video-poster.mjs`). **The order is always: push pages, THEN restore attributes, THEN publish.**

### 3. The blog had no drawer, so site.js threw on 44 URLs
`build-post-template.mjs` extracted the drawer into a variable and never inserted it (and its slice
was broken anyway: `indexOf('</div>', …)` lands four levels inside). `build-blog-index.mjs` never had
one. Both documents shipped a `.burger` with `aria-controls="drawer"` pointing at nothing, so on all
43 posts and on `/posts` the menu button did nothing and `drawer.querySelectorAll` threw — taking the
Escape handler and both `ScrollTrigger.refresh()` calls down with it. `add-drawer-to-blog.mjs` puts
the real drawer back (29 links, balanced-tag extraction); `90-boot.js` now guards the block so a
missing drawer can never take the rest of boot down again.

### 4. 77 URLs, one `<title>`, one `<meta description>`
Instatic renders the SITE title and description into `<head>` on every page. The per-page title is
stored correctly and simply never emitted, and there is no head/meta tool in the MCP surface. No
canonical and no Open Graph anywhere either.
`gen-seo-head.mjs` builds `src/scripts/seo-head.js`, ONE all-pages classic head script carrying a
route map of all 77 URLs from `seo.json` + `posts.json`: title, description, self-referential
canonical (origin + path, never a hard-coded host), OG/Twitter, and Article JSON-LD for the 43 posts,
which had no structured data at all. Verified against three live pages before shipping: unique title,
unique description, canonical, `og:type=article` on posts, no duplicate tags.
**This is a stop-gap and the user knows it.** Google renders JS and sees all of it; Facebook,
LinkedIn and X do not. The durable fix is server-side in the Instatic deployment on Railway.
`format:"classic"` DID stick on create here, contrary to the 2026-08-19 note — pass the full runtime
object on a tiny create and read it back.

### Published
`site_publish` twice, 35 pages each time. Live and verified: sliders drive, 0 images without alt on
the pages checked, hero poster back and playing, drawer present with 29 links on posts, 0 JS errors,
`seo-head.js` shipping on every page type.

### Everything the audit found and did NOT fix
- **`favicon.ico` 404** on every page (the site has `favicon.svg`).
- **`video-library` thumbnails**: YouTube `hqdefault.jpg` is 480px wide in a 784px box.
- **8 pages carry no JSON-LD**: the four legal documents, both choosers, `thank-you`, `video-library`,
  plus `/posts`. Legal and thank-you do not need it; the other two arguably do.
- **The CSP still blocks** the ReputationHub widget and the Cloudflare Insights beacon. Known.
- Clean everywhere: no broken images, no horizontal overflow, no h1 count problems, no em dashes,
  no lorem ipsum, no build flags, no non-200s, 77/77.

### Where it stands, 2026-08-20
**Report**: https://claude.ai/code/artifact/a33da58d-fb0e-4cc0-b8cb-b5dfcd0765f4 (source
`08-qa/.tmp/audit-report.html`, data from `report-rows.json`; republish the same file path to update).
Commits: 200e9c8, 2b8121b, 87ec3ef, ec1f23f, cd6250b, ada774f.
Gates after every change: site-test 569/569, interaction-test-gsap 64/64, fluid-qa 405/405,
sim-check 27/27, css-vocab 261 OK. Live audit: desktop 70/77 clean, mobile the same.

**Published and verified live on encorercm.com.** Desktop sweep 70/77 clean, mobile sweep the same
after the thank-you fix. What is left, and why it is left:
- **No JSON-LD on 7 URLs.** Four legal documents, two choosers and thank-you do not want structured
  data. `video-library` cannot have `VideoObject` markup without an `uploadDate`, which neither the
  scrape nor YouTube's oEmbed carries, and inventing one is not an option.
- **`video-library` thumbnails**: YouTube serves `hqdefault` at 480px into a 784px box for the eight
  films that have no `maxresdefault`. Documented in `probe-thumbs.mjs` from the 2026-08-19 build.
- **The home page's second video has no poster.** Neither does the local build; `broll.mp4` cannot
  be uploaded to Instatic (`media_upload` is images only) so it plays `hero.mp4`.
- **The SEO head script is a stop-gap.** Google renders it; social scrapers do not. The durable fix
  is server-side in the Instatic deployment on Railway.
- The CSP still blocks the ReputationHub widget and the Cloudflare beacon. Known, unchanged.

### thank-you scrolled sideways on a phone
`data-drift` was on the `<figure>` rather than the `<img>` inside it. The drift scales its target
1.12; on the absolutely-positioned image inside an `overflow:hidden` figure that is clipped, on the
figure it scales the clipping container -- 355.6px to 398.3px, 21px either side against a 17px
gutter. Every other page puts the attribute on the image.
Fixed on Instatic by **clearing the figure's `htmlAttributes` bag**, not by re-pushing the page: a
page push would have wiped all eight image alts again. Reach for the node patch whenever the change
is an attribute.

### The mobile drawer had NINE unreachable links, on every page
Found only because the audit gained a `--mobile` pass. `.drawer` is
`display:flex; flex-direction:column; justify-content:center; overflow-y:auto`, and at 390x844 its
content is 946px tall in an 844px box. A column flex box that centres and then overflows pushes the
overflow off the **TOP**, where `scrollTop` cannot reach it: measured `gridTop: -166` at
`scrollTop: 0`, setting `scrollTop = -500` changed nothing, and the first nine links of the site map
were unreachable on a phone across the whole site.

Fixed with `justify-content: safe center` in `css/11-drawer.css`. `safe` falls back to
start-alignment the moment the content does not fit, and a browser that does not know the keyword
drops the declaration and starts from the top, which is the same correct behaviour. Verified locally
at 390x844: `gridTop 76`, 0 unreachable, drawer scrolls.

**`audit-site.mjs --mobile` now gates this**: it opens the drawer, waits out the 0.8s clip
transition, and counts links above the viewport top at `scrollTop 0`. Everything the drawer, the
burger and the touch behaviour of the sliders do exists ONLY at phone widths, so a desktop-only
sweep is half an audit.

**BLOCKED reaching the live site**: `push-site-css.mjs` needs the Site editor bridge and
`get_context` reports `siteConnected:false`. The CSS fix is in the local build and gated; it is not
on Instatic yet. Retry the push when the bridge is back (opening the Instatic editor in a browser
brings it up), then `site_publish`.

### `sim-check` is now honest, and it is 27/27
Three things had to change before it meant anything:
- **It loads `runtime-states.css`.** That is the whole reason the sliders could die under a green
  gate. `build-sim.mjs` copies it now, in Instatic's order (runtime-states, then site.css).
- **It resolves `/uploads/` back to the local files.** The pulled documents reference Instatic's flat
  media path with a 21-character upload id, which the simulator does not serve, so every image 404'd
  and "every image decoded" failed on pages that were fine. `resolveAsset()` also tries other
  extensions: Instatic re-encodes on upload, so five practice photographs are `.jpg` there and
  `.avif` here.
- **The "no third-party frame in the reviews block" assertion was removed.** It is true on Instatic,
  whose per-page CSP blocks `reputationhub.site`, and false on a plain local server, where the widget
  mounts and `ch-proof.js` correctly leaves the frame. `audit-site.mjs` records `iframes` on the real
  origin, which is where the question means something.
**And `pull2.mjs` caches by file existence** — it prints "(cached)" and skips. Re-pull with
`FORCE=1 node pull2.mjs` or the simulator silently tests a state that no longer exists.

### The chunked code-asset push has TWO ways to eat the file, and both were hit
`gen-seo-head.mjs --push` clears the asset to a sentinel and refills in 8KB chunks, the same shape
as `push-site-css.mjs`. Writing that from scratch found two failures the older scripts never hit,
and one of them **published an empty `seo-head.js`**:

1. **Do not strip the sentinel after filling.** The tidy-looking final step left the file with
   nothing for the NEXT run to converge on: the clear loop deleted it 4000 characters at a time
   down to zero, and an empty file cannot be patched at all (`oldText` has `minLength: 1`), so the
   run died with the asset at 0 bytes. The sentinel is an inert comment; it stays in the file.
   A file that has lost it is rewritten whole with `site_write_code_asset`, carrying `runtime`
   explicitly, because runtime attaches on write and omitting it unscopes the asset.
2. **Build the clear slice from the START of the file, not from "content minus the sentinel".**
   The sentinel sits at the END, so removing it splices the trailing newline onto the head and
   yields a string that appears NOWHERE contiguously. Every patch then returns *"Replacement text
   not found"* — as prose, with a 200 — and the loop burns all 400 attempts leaving a fragment.
   Use `content.slice(0, content.indexOf(SENTINEL))`.

**A publish reports a broken asset and refuses.** `site_publish` returned
*Runtime script build failed for page "…": src/scripts/seo-head.js:1:5 — Expected ";" but found
"and"*. That is the guard rail working, but note the earlier publish of the EMPTY file succeeded
silently: empty is valid JavaScript. **Re-run the push a second time before publishing** — an
idempotent push is the only proof the clear loop converges.

### Gotchas
- **`restore-img-attrs.mjs` skips anything with no local page** and prints "no local page" — `post`
  and `posts` are authored natively on Instatic, so they kept the importer's empty alts until
  `fix-blog-img-alt.mjs` was written for them.
- **`site_read_code_asset` paginates at 12000 chars.** A single read of a 14.8KB file silently
  returns a slice; walk `pageInfo.nextPart` or pass `maxChars`.
- The audit and the MCP writes run against different endpoints (published site vs draft), so they
  are safe to run concurrently — but two audit processes sharing one `--out` directory are not.
