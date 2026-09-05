## DONE 2026-09-02 - THE ELEVEN CORE PAGES, designed and LIVE on Instatic. Commit `ad7a2d32`.

Client: *"We need to build the core pages, there is more context in Asana. Checkout the mason
park worktree so you can see what we did there, remember these are very different services and
businesses, but you can guide in the process for the aesthetics. We need to push to instatic
too."* The session was launched in `bk-mason-park`; the only open **Build Core Pages** task with
nothing built was this site's (`1218057689730298`, under **Build New Mason Park Pediatric Site**
`1218009803778905`, due 2026-09-03), so the work was done here, where this site lives.

**What exists:** [`deliver/brandklout/mason-park-kids/workflows/03-core-pages/`](../deliver/brandklout/mason-park-kids/workflows/03-core-pages/README.md).
`home/` is the site root, eleven `index.html` files that open from `file://`, one stylesheet, `site.js`,
the journey runtime ported from the parent, GSAP vendored. **Read the README first**: it has the
page map, the design decisions, the import order, and the nine open items for the practice.

**Live:** <https://mason-park-kids.up.railway.app> since 11:49Z, 57 pages published (54 + 3 new
routes: `/our-doctors`, `/financing`, `/patient-reviews`; 8 existing rows replaced: `/`, `/about-us`,
`/our-team`, `/our-services`, `/new-patients`, `/dental-saving-plan`, `/thank-you`,
`/services/comprehensive-pediatric-dentistry`). The 43 other migrated pages are untouched. Backup
before the writes: `.tmp/backup-mason-park-kids.up.railway.app-2026-09-02T11-41-02.json` (ignored,
on this machine only). The public domain still does not point here; the redirect situation two
entries down is unchanged.

### The three things to know

1. **The look is this brand's, the process is the parent's.** Palette from the logo (slate, sage,
   plus sun and sky), Fraunces and Nunito, round corners, stickers. Chapters, constant chrome,
   varied bodies, scrubbed scenes, three gates, all from `bk-mason-park` workflow 09, read in place.
   Do not port the parent's copper or its layouts; do port its lessons.
2. **The chrome is stamped from the homepage.** `node .tmp/stamp.mjs` rewrites every other page's
   head, top line, masthead, footer and script tags from `home/index.html`, keeping each page's own
   title, description, canonical, og, robots and `<main>`. `check.mjs` fails a page whose chrome
   drifted. Edit one page's `<main>` in place; edit the chrome on the homepage and re-stamp.
3. **Two stylesheets share the Instatic site, ordered by PATH.** Ours is
   `src/styles/mason-park-kids-core.css`; the migration's was renamed
   `src/styles/legacy-migration.css` so it sorts FIRST. See the gotcha below before touching either.

### Gotchas this run paid for

- **Instatic bundles code assets by path, not by `files[]` order.** Appending ours to `files` did
  nothing: `mason-park-kids-core.css` sorts before `mason-park-kids.css`, so the old sheet won every
  `:root` tie. The live h1 computed as Figtree and the body as DM Sans while chapters, GSAP, images
  and the class registry were all green, and `verify-live` reported both faces as FALLBACK. It
  looked exactly like fonts failing and it was not; `font-probe.mjs` (computed family + width
  against fallback + every woff2 request) is what told them apart. `reorder-styles.mjs` renames the
  old asset. **Consequence, deliberate:** the migrated pages now render in Fraunces/Nunito with the
  sage accent. `verify-live.mjs --migrated` renders two of them clean.
- **The old script asset never ran.** The 02 import registered `src/scripts/mason-park-kids.js` with
  no `runtime.scripts` entry, so no migrated page ever had a mobile menu. `import-scripts.mjs` writes
  the GSAP bundle into that same file and adds the entry (`all-pages`, `body-end`, `dom-ready`).
  `site.js` handles both `masthead_*` and `navbar_*`, so the old pages gained a drawer too.
- **The map needs the embed-origins plugin**, and this site had none. Installed from
  `deliver/process/18-instatic-embeds` (zip built with `pack-plugin.mjs`; the prebuilt one is in the
  parent's worktree only), `set-origins.mjs --frame https://www.google.com`. Live CSP now carries
  `frame-src https://www.google.com`. `embedPolicy` is `compatible`, which touches only pages that
  hold an Embed block, of which there are none.
- **The stamper ate `</main>` on its first run** (took the body without its closing tag and
  re-added it once, on the wrong side of the split), so every stamped page lost its footer to the
  chrome gate. Fixed; `stamp.mjs` now refuses a page with no `</main>`.
- **Backslashes through the shell, twice more.** A heredoc turned the Chrome path into
  `C:Program FilesGoogle...`; a `node -e` replace turned `/^https?:\/\//` into `/^https?:///`. The
  house note stands: write `.mjs` with an editor.
- **The `.session-*` cookie file was tracked for one local commit.** Caught before any push,
  the commit was rewritten and `.tmp/.gitignore` now lists it. Nothing left the machine.
- **The logo PNG has a white ground.** Inverted over the hero and in the footer it became a white
  block. `prep-images.py` lifts the ground to alpha. The migrated pages still use the old upload and
  show the same white block in their footer; not fixed, they are not this workflow's.
- **Two frames from the parent's folder were stock** (a woman in a yellow dress, a patient with a
  mirror) and were dropped after a contact sheet. The pool is named by what each frame shows; keep
  it that way.
- **What does not travel to Instatic:** meta description, canonical, og tags, JSON-LD. A page row is
  title + slug + body. Same open item as the 02 entry below; the parent solves it with two plugins.

### Verified

`check.mjs` 11 pages, 0 errors, 1 warning (Doctors' bio 123 words, inside the fold bound).
`shot.mjs` all eleven at 390/768/1440/1920: 0 overflow, both faces painted, nothing under 12px.
`probe-hooks.mjs` all eleven, motion on: every `data-write` at three different word counts, the
growth chart fills 0.1/0.5/0.9 and changes hands, the path pins and fits the window. Live:
`verify-live.mjs` clean on all eleven and on two migrated pages; `diff-live.mjs` on `/` and
`/financing`: signatures identical, text identical; `probe-hooks.mjs` against the live homepage:
all scenes do work; `live-shot.mjs` at 390: 0 overflow. Screenshots reviewed by eye, all eleven.

### Next

1. **Client review at the Railway host.** Nothing on the public domain changed. If the client
   wants BugHerd here, the parent's `import-bugherd.mjs` pattern applies and the plugin now exists
   to hold its origins.
2. The nine open items in the README, item 1 (suite and phone) first.
3. The 22 remaining treatment pages onto the template (`/services/comprehensive-pediatric-dentistry/`
   is the canary), then retire `legacy-migration.css` and the `navbar_*` chrome with them.
4. Unchanged below: the domain cutover, the key revocation, the JSON-LD and description plugins.

---
