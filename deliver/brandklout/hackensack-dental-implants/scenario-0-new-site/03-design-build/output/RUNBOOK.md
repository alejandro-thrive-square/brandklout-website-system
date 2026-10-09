# scenario-0-new-site · 03-design-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-09 · the complete site: 39 pages, Client-First, on staging

Asked for: "We need to finish the entire site please. The homepage was approved."

### Done (commits `9319e015` and the one after it)

- Read first: [`site-review.md`](./site-review.md): the pages, what changed on the approved home,
  how the inner pages are built, eleven content questions to confirm, what was checked.
- **Sitemap = the live site's 38 URLs + 404**, no renames, so no redirect map is needed.
- **site-src rebuilt to the class standard** (CLASS-STANDARD.md, from the first line): tokens in
  `css/01-tokens.css` (block 1 mirrors the Framework: colours, type bases, spacing, radii; block 2
  the registry `:root` formulas and per-breakpoint multipliers), `10-client-first.css` (the
  starter, values set), `20-shell.css` (top strip, navbar with dropdowns from 1280, drawer below,
  footer, call bar), `30-home.css`, `40-components.css` (shared), `50-pages.css` (inner pages).
  Every element styled by its own class; no contextual rules except text-rich-text and states.
  Scripts find everything by `data-` attributes (`js/10-runtime.js`, `js/00-scenes.js`).
- **Home page ported** to the new classes with its approved look: before/after strips in `look/ab/`
  (`code/ab.py`). Changes: site menu and footer, keyword H1 "Dental Implants in Hackensack, NJ" in
  the gold label, links to the new pages (the surgeons now open their profiles).
- **Pages are modules** (`pages/<path>.mjs`) over the component library `lib/ui.mjs` (28
  components, each a Client-First folder with its scroll scene). `page()` folds blocks into eight
  chapters at most. Authoring rules for the next person: `pages/README.md`. Copy placed verbatim
  from the old-site capture by six parallel agents; every change to old copy is in each module's
  header comment.
- **Scenes** (`js/00-scenes.js`): statement, checks, index, timeline, cards, quote, team,
  specialist, films and financing hold (pin) while they play when they fit the window; each held
  element gets the id `<scene>-<n>`. Every designed page has three to seven at 1440. Moving text
  never drops below 0.7 opacity.
- **Images**: `code/images.json` (manifest) → `code/cut-images.py` (crops by focus, film frames via
  ffmpeg, cut-outs composited on the portrait ground), `code/image-assign.json` + `assign-images.py`
  (slot → photo, rewrites alt in the modules), `code/stock.mjs` (Freepik search/download, ledger
  `assets/stock/stock-ledger.json`, nine photos). 121 images on the site, ledger `images.csv`.
- New embeds: GHL booking form (contact), GHL referral form (referring doctors), Google map;
  `code/embed-nodes.mjs` puts every Embed block into the converted payload (31 on 27 pages).
- **Staging** (three full pushes, `push.log`; backups `backups/pre-site-stg`): 39 pages published,
  Framework applied (81 variables), 404 template set, breakpoints unchanged, media conditions in
  cascade order (`css/00-breakpoints.css`).
- **BugHerd #12 done** (`bugherd/2026-10-09/mark-done.txt`): the surgeons link to their profiles,
  all four profiles serve 200. 23 of 23 done.
- Gates, local (`LOCAL_GATES=1` build): check-pages FAIL none (39 pages × 1440/390), click-controls
  DEAD none (113 clicks, 8 pages), word-fit every word fits (360/390), home probe 28/28,
  class-audit IN BOUNDS, structure-audit CLIENT-FIRST SHAPED, image-reuse 0, fluid-root none,
  cross-client-grep 0 hits.
- Gates, staging: editability EDITABLE, class-audit IN BOUNDS, structure-audit CLIENT-FIRST SHAPED
  (81%), editor-canvas ok, image-reuse `--base` 0 problems, css-declared-parity none,
  check-staging all passed, check-pages `--base` (9 designed pages) pins 3 to 7 and smoother on;
  every vendor embed renders (booking form, referral form, map, survey, Elfsight). verify-live: 39
  routes 200, links and images resolve; its other FAILs are listed under Gotchas. compare-live
  (all top-level pages + two nested, `live-compare*.txt`): after the breakpoint fix, no real
  difference but the HIPAA notice and privacy policy at 390, where two paragraphs holding long
  hhs.gov links wrap one line more (0.5% taller, no overflow).

### Next

1. Team review on BugHerd (Asana *team complete site review*: in progress + comment, confirm with
   the user first). Fix at the source: `lib/ui.mjs` for a component, the page module for copy.
2. Rulings on `site-review.md` "To confirm" (eleven items).
3. Step 05: per-page schema through the `aeo-schema` plugin (the build's own JSON-LD, FAQPage and
   BreadcrumbList, does not survive the import; staging serves the plugin's skeleton).
4. On `main` (process fixes, made there, not here):
   - `push/place-embeds.mjs` skips nested slugs and takes one page per key: adopt
     `code/embed-nodes.mjs` (Embed nodes into `import-out.json` before `push-site`).
   - The push chain needs `framework.mjs apply` after every full replace (the import re-adds the
     `:root` tokens); `framework.mjs extract` files `heading-gap` under typography and leaves the
     type bases out of `registry.remove`.
   - `check-pages.mjs` looks a pin up by its first class when it has no id (`.padding-section-large`
     found the wrong element); scenes now set ids, the gate should key on the trigger itself.
   - `check-pages` needs a switch to empty vendor embeds for local runs (Hackensack's `LOCAL_GATES`).
   - `compare-live` / `visual-diff` see only top-level pages; `verify-live` / `verify-motion-live`
     assert West LA names; `--site` needs `INSTATIC_PASSWORD` in the master section.
   - Directive 03 item 12 asks for the blog as a CMS collection; the collection tooling is not in
     the toolkit (listed, not copied, from bk-brandklout-website).

### Gotchas

- **Windows MAX_PATH**: a media file named after a blog slug pushed Python past 260 characters;
  blog images have short names (`blog-cost.webp`).
- **A Node build cannot delete `dist/` while a shell's cwd is inside it** (EPERM).
- **`check-pages.mjs` never settles locally with the vendor widgets in** (Elfsight keeps the network
  busy, GHL's Turnstile answers 401): `LOCAL_GATES=1 node build.mjs` empties the embed markers for
  local browser gates. Never push that build; `push-staging.sh` builds without it.
- **Pins need to fit the window.** A scene holds only when its element is shorter than the window
  (900px in the gate); long copy pushed four pages under three pins until the films, financing,
  team, specialist and quote scenes held too, and the index holds its own list when the chapter
  is too tall.
- **No pipes in the push chain**: Node 24 on Windows dies with a libuv assertion when piped;
  `push-staging.sh` writes straight to `push.log`. Start it detached (`Start-Process` a `.cmd`) so a
  background-shell reap cannot cut a full replace in half.
- **`framework.mjs apply` refuses** while any registry `:root` rule still declares a Framework name;
  the spec's `registry.remove` now lists all 81.
- **verify-live false FAILs**: West LA runtime classes (`.is-solid`, `.wz-smooth` … not used here),
  "tokens missing from userStyles" (they are in the Framework), `wz-ready`. Real ones: the
  duplicate title (to confirm) and the HIPAA notice's two hhs.gov `.html` links (external, fine).
- **Live structure-audit counts differently** from `--local` (registry rules, not files): 81% local
  became 78% live until thirteen exact-value literals moved to `--space-tiny` / `--grid-gap` /
  `--global` (same pixels).
- **Instatic orders media conditions site-wide by first appearance**, and the house fluid root
  (`00-fluid-root.css`, first file) declares 479 before the tokens declare 1279/991/767: on staging
  every phone override came before its tablet one and lost (About's H1 52px at 390, local 45).
  `css/00-breakpoints.css` now comes first and names every condition once in cascade order; the
  third push publishes them in that order and the H1 matches. Local gates cannot see this; compare
  a phone override on staging (`compare-live`).
- **compare-live false findings**: the Embed module adds `position: relative; max-width: 100%` to
  its wrapper, the Framework stores colours as HSLA (`#7c6133` = `hsla(37.81, 41.71%, 34.31%)`),
  and a container caught mid-pin reads 0px margins.
- **check-staging asserted the H1's font**: the H1 is now the DM Sans keyword label, so the check
  reads the display headline (`.arrival_heading`).
- **An RGBA cut-out converted straight to RGB goes black** (the doctors' portraits): composite on
  the portrait ground first.
- The full-page capture repeats from the top past 16,384px (Chrome's texture limit): long phone
  pages look doubled in `look/pages`; it is the capture, not the page.

## 2026-10-02 (evening) · the right Google reviews widget, BugHerd #10 done

Alejandro supplied the right Elfsight widget: `948f2cd1-3863-46db-a63b-689bfc31ace0`, connected to
"Hackensack Center for Dental Implants, 163 Main St Suite A1" (checked on Elfsight's boot API first).

### Done (commit: see the client `RUNBOOK.md` row)

- `pages/index.html`: the `google-reviews` embed marker now carries `948f2cd1` (lazy attribute left
  out, as always on Instatic). Pushed (backup `backups/pre-reviews-948-stg/`, seq 12).
- New `code/check-reviews.mjs`: scrolls to `#reviews` and reads the widget's shadow root. Live at
  1512 and 390: only the new widget on the page, 5.0 from 21 reviews. `check-staging.mjs` 14/14.
- BugHerd #10 marked done. 22 of 23 done; only #12 left (profile pages not built).

### Next

1. On `main`: update `deliver/process/tools/elfsight-reviews/review-widgets.json`, row `hackensack`:
   widget `948f2cd1…`, listing "Hackensack Center for Dental Implants, 163 Main St Suite A1".
   `cf96ca10` (Aesthetic Dental Center) stays on the live Webflow site until launch; decide then
   whether to delete it.

### Gotchas

- **Claude in Chrome could not click Elfsight's source menu.** "⋯" opened it; "Change" ignored
  direct clicks, hover-then-click and the keyboard. Orca's OS-level control could not take focus
  from Orca on Windows. The user had the right widget all along: ask for the widget before trying
  to re-point one. (The house skill for vendor dashboards is now `codex-computer-use`.)
- The office listing gains reviews fast (15 to 21 in a day): the page says "5.0 Google rating" and
  never prints the count.

## 2026-10-02 (later) · 21 BugHerd tasks marked done

Asked for: "mark the tasks done, the ones that you are sure you finished, double-check". Verified
again live (24/24), then `code/bugherd-mark-done.mjs` moved 21 tasks to done, re-reading each first
and reading it back after; no comments posted. **Open: #10** (widget account, waiting on Alejandro)
and **#12** (profile pages not built yet, links 404 on staging). List in
`bugherd/2026-10-01/change-list.md`.

## 2026-10-02 · every fixed BugHerd pin verified on the live page

Asked for: "make sure all of the resolved pins on BugHerd are addressed". New
`code/bugherd-verify.mjs` (read-only): one assertion per task on live staging at 1512x735, #17 at
390, plus a viewport shot of each pinned spot. 24/24 pass (`bugherd/2026-10-01/verify.txt`), commit
`8f7a9ba1`. No new BugHerd activity. Still open: #10 (widget account) and posting the replies, both
waiting on Alejandro.

Gotcha: a puppeteer `clip` screenshot under ScrollSmoother failed with "0 height" once the page had
scrolled; full-viewport shots after scrolling the element in work.

## 2026-10-01 (night) · BugHerd round: 23 tasks, 22 fixed on staging

Asked for: "resolve last bugherd comments". Project 544349, tasks #1 to #25 (no #6, #7).

### Done (commit: see the client `RUNBOOK.md` row)

- Read first: [`bugherd/2026-10-01/change-list.md`](./bugherd/2026-10-01/change-list.md): every
  task, its scope, the fix and a draft reply. Pulled by id with attachments by the new
  `code/bugherd-pull.mjs` (read-only).
- Fixed: cursor follower and scan line removed; Drive logo in the nav; top bar "Bergen County";
  All-on-4 on its own line; two subtitles and two footer lines removed; portrait fills its arch;
  surgeons link to their profiles; closing scene unpinned; story scene twice as fast; doctor card at
  the foot of the film; "Meskin" fits a phone; line masks no longer clip capitals; full-arch photo
  framed lower; rating 5.0 from the office's own Google listing.
- Pushed (backup `backups/pre-bugherd-stg/`, seq 11). `check-staging` 14/14 (now three pins, no
  cursor), `click-film` 16/16 (doctor card checked at the film's foot on desktop), probe 27/27,
  `fluid-root` pass, `image-reuse` 0 problems.

### Next

1. **#10 waits on Alejandro:** re-point Elfsight `cf96ca10` to "Hackensack Center for Dental
   Implants" (it is also on the live Webflow site) or make a new widget; then `review-widgets.json` on `main`.
2. Post the draft replies and move the tasks to done once Alejandro says so.

### Gotchas

- **The reviewer's "wrong account" link is a `share.google` short link.** `curl -L` resolves it to a
  Google search carrying the listing's `kgmid`; the rating renders only in a browser (Chrome extension).
- Split headlines in Newsreader need room above the line as well: a mask padded only below clips
  the tops of F and C.
- `look/390` was held open by another process and `rm -rf` failed; capture at 392 instead.
- A Python edit script that dies on its first assertion does not stop a commit chained after its
  heredoc on the next line: the first commit of this round went in without the docs.

## 2026-10-01 (later) · film hero, doctor moved up with credentials and numbers, on staging

Asked for (Alejandro, after a call with Jess): move the doctor up so he is seen sooner; add his
credentials and a reputation section like Dr. Nahlah's ("4.8 on Google", implants placed), after
researching his reputation; a new hero, with video if possible.

### Done (commit: see the client `RUNBOOK.md` row)

- Read first: [`canary-review.md`](./canary-review.md) → "Film hero and the doctor moved up": what
  changed, every figure with its source, and four new items to confirm (7 to 10).
- **Hero** (`pages/index.html`, `30-sections.css`, `25-interaction.css`, `00-runtime.js`): headline
  and copy, then `.hero-film` > `.hero-frame` with a muted loop and two cards (doctor + rating, play
  button). With motion on at ≥992 the scroll opens the frame from the page margins to the window
  (`clip-path`, trigger id `hero-film`); the frame's margins move into the clip so the cards stay on
  the grid. Under 768 the hero is a flex column with `.hero-grid` as `display: contents`, so the film
  comes straight after the headline. The proof bar and its ticker are gone.
- **Video:** both 1080p patient films from the agency Vimeo (folder "Hackensack Center", project
  `29482006`: Isaac `1198870167`, Daniel `1198867061`) downloaded with the team token
  (`download[]` links). Loop = Daniel 67.4s+2.5, Isaac 27.0s+2.8, Daniel 70.3s+2.5, Isaac 49.0s+2.8,
  Isaac 72.0s+3.4, hard cuts, no audio; CRF 26 at 1920 and 960. Full film = Isaac at 1280, CRF 24,
  AAC 128k, faststart. Poster = the loop's frame at 0.4s. Originals stay out of the repo (scratch).
- **Interface layer** (runs with or without GSAP): sets the loop's `src` from `data-src` /
  `data-src-mobile`, never under reduced motion; plays only while on screen
  (`IntersectionObserver`); creates the pause control `.film-toggle`; opens `.js-film` links in a
  light box (`.film`, role dialog, focus trap, Escape, focus returned, smoother paused).
- **Doctor chapter** (`#doctor`, chapter 1): arched portrait, "Meskin" watermark (the old team
  mark, now on `.doc-grid`), bio, `dl.creds`, `.stats` (count-up from `data-count`,
  `data-decimals`, `data-suffix`; the HTML carries the final values), the three surgeons. Team block
  removed; `#technology` moved into chapter 4 (journey), so there are still eight chapters.
  Menu and footer: "Your Doctor" → `#doctor`.
- New images: `doctor-face.webp` (192px crop of `doctor.png` for the hero card, so the portrait is
  not used twice), `hero-poster.webp`. Rows added to `images.csv`.
- Research: 4.7 / 1,104 Google reviews verified; Dr. Meskin's NYU dates verified; the team totals
  are the practice's own claims. Summary in `docs/facts.md` → Reputation and credentials.
- Pushed twice with `push-staging.sh` (backup first: `backups/pre-film-stg/`, seq 8 → 9 → 10).
  Checks: `probe.mjs` 28/28; `check-staging.mjs` 14/14 (its ticker check is now a film check);
  new `code/click-film.mjs` 16/16 live (real clicks, desktop and phone); `fluid-root` pass;
  `image-reuse` 13 images, 0 problems.

### Next

1. Client answers on items 7 to 10 in `canary-review.md` (the two team numbers, the rating's
   listing, other dentists in the film, captions).
2. Captions for Isaac's film: Vimeo `/videos/1198870167/texttracks` → `.vtt`, read through, then
   try a `.vtt` upload to the media library and add a `<track>` in the light box.
3. The video tricks here (data-src, light box, pause control) are client code; if a second client
   wants a film hero, lift them into the toolkit on `main`.

### Gotchas

- **The pause control was below the fold** at 1440×900 when it sat at the film's bottom corner, and
  `click-film.mjs` failed on it: a puppeteer click below the fold scrolls natively under
  ScrollSmoother and the play button then left the viewport. Controls for a hero film go in its top
  edge.
- **Clicking a control is the only proof it works.** `check-staging.mjs` saw the film playing; only
  the click test opened the light box, pressed Escape and read the focus.
- `ffmpeg` in a `while read` loop eats the loop's stdin: pass `-nostdin`, or only the first segment
  is cut.
- `drawtext` on Windows: copy the font next to the working folder and pass `fontfile=arial.ttf`; a
  `C\:/Windows/...` path dies in the filter parser.
- A Python heredoc in Git Bash with many apostrophes inside failed with "unexpected EOF"; the same
  script written to a file with the Write tool ran.
- Numbers that count up must be written at their final value in the HTML. The runtime sets them to
  0 just before counting, so without a script, with reduced motion, and in the import they read
  correctly.

## 2026-10-01 · BugHerd project for the staging site

### Done

- Created BugHerd project **544349** "Hackensack Dental Implants" with `POST /api_v2/projects.json`
  (`BUGHERD` key from `[shared]`), `devurl` https://hackensack-dental-implants-staging.up.railway.app/,
  private. The account added the five team members itself; columns todo / doing / done.

### Next

- Team complete site review on BugHerd once the inner pages exist (checklist item in this step).
  Pull each task by id with attachments; decide scope first (`deliver/docs/BUGHERD.md`).

### Gotchas

- The BugHerd script cannot run on Instatic (CSP `script-src 'self'`): pin with the extension.
- When production replaces staging, add the production URL to the project's sites.

## 2026-09-30 (evening) · Google reviews widget (Elfsight) under the gallery, on staging

Task brief: [`docs/tasks/2026-09-30-google-reviews-widget.md`](../../../docs/tasks/2026-09-30-google-reviews-widget.md).

### Done (commit: see the client `RUNBOOK.md` row)

- **Where.** The home page had no review section (neither has concept 04), so the widget sits in the
  proof chapter: a `.reviews` block (`#reviews`) inside `section#results`, after the pinned gallery,
  with the chapter's own `.results-top` heading shape: kicker "Patient Reviews", "In their own
  words.", "Google reviews of the practice, shown live and unedited." The old Webflow site runs the
  same widget on `/patient-testimonials`, `/insurance-financing` and `/technology`, never on `/`.
- **Widget.** Elfsight Google Reviews `cf96ca10-8feb-4ac7-8668-ddf398e0f61f` (registry key
  `hackensack`, listing Aesthetic Dental Center of Hackensack, 163 Main St). Snippet without
  `data-elfsight-app-lazy`. Nothing was created or edited on Elfsight.
- **How.** An embed marker in `site-src/pages/index.html` (`data-embed="google-reviews"`) plus an
  entry in `embeds.json`, so the normal chain (`push-staging.sh`) places it as a
  `brandklout.embed-origins.embed` node in snippet mode and a re-import keeps it. Backup first:
  `output/backups/pre-reviews-stg/` (seq 7). Chain run once: 356 nodes, 2 markers → 2 Embed blocks,
  published, seq 8. CSS: `.reviews`, `.reviews-embed` in `30-sections.css` (+767 margins).
- **Verified in real Chrome, fresh load:** 751px tall, "Excellent on Google 4.7 (1,104)", live
  reviews (Nicole Obregon, Adriene Urquhart, Öznur Erdem, Laura Santos...). Published HTML has the
  compatible CSP, `platform.js` and the widget div, no lazy attribute. `probe.mjs` 28/28,
  `check-staging.mjs` 14/14.
- **Production: not written.** The production instance is still the empty default (one page
  "Home", one node, no style rules, nothing published). The marker ships with the site when the
  home page is first pushed there; nothing to place until then.

### Next

1. Production gets the widget with the first push of the site (the chain places it). Verify in a
   real browser there too, scrolled to `#reviews`.
2. The widget brings its own header ("Excellent on Google"), Google-grey cards and its own font under
   our chapter heading. If the reviewer wants it quieter, turn the widget header off and match the
   colours in Elfsight's editor (Header / Theme), not in CSS.
3. Promote the balanced-`</div>` fix in `tools/instatic-site/push/place-embeds.mjs` to `main`
   (and fold `empty-embed-markers.mjs` into `build-import-input.mjs` there): `scenario.mjs update`
   would overwrite the client copy with the broken one.

### Gotchas

- **Both marker regexes cut at the first `</div>`.** `place-embeds.mjs` (`snippetFor`) and
  `empty-embed-markers.mjs` matched `<div data-embed>…</div>` non-greedily. The GHL survey has no
  inner div so it never showed; Elfsight's snippet is `<script>` + `<div class="elfsight-app-…">`,
  and the cut would have emptied the marker to `<div></div></div>` (closing the parent early) and
  published an unclosed div. Both now walk to the div that balances the marker.
- **The Google Reviews app renders only near the viewport, lazy attribute or not.** On a fresh
  load the div is 0px with 0 children while `platform.js`, the boot request (200) and the app
  bundle have all loaded; scroll `#reviews` into view and it renders within ~2s. A gate that
  measures the widget at `scrollY 0` will call it broken. Measure after scrolling to it.
- `probe.mjs` now aborts Elfsight hosts like the GHL ones: `platform.js` keeps polling and
  `networkidle2` never settled (30s navigation timeout on the local build).
- A comment in the page source that names `data-elfsight-app-lazy` reaches the built page: the
  build keeps HTML comments, so a grep for the attribute is a false positive. The comment was
  reworded.
- The chain's `tail -3` hides `place-embeds.mjs`'s per-marker lines; `output/push-6-embeds.log`
  is from an earlier hand run. Run `node ../../tools/instatic-site/push/place-embeds.mjs` (dry)
  to see "2 block(s) already placed".

## 2026-09-30 (late) · layouts recomposed editorially, on staging

### Done (commit: see the client `RUNBOOK.md` row)

- Asked for: "change the layout so it's not too common … the majority shouldn't be like a regular
  layout". Nine of twelve blocks recomposed on a 12-column grid; list in `canary-review.md` →
  Layout. Feature, consult form and FAQ kept.
- Markup: hero masthead (`.hero-meta`, h1, `.hero-visual`, `.hero-copy`), treatment numerals are
  `01/02/03`, `#process-scene` also carries `.process-wrap`. `--bleed` token in `01-tokens.css`.
- Layout that exists only with motion (ticker, horizontal journey, name behind the team, stepped
  closing words, split-headline indent) is in `25-interaction.css`, shipped verbatim.
- Runtime: hero no longer pinned (the masthead is taller than a laptop window); pins are
  story/process/results/final and each pins only if it fits the window (`scene()` helper),
  otherwise scrubs unpinned.
- Checks: probe 28/28; fluid-root pass; live `check-staging.mjs` 14/14; visual-diff 0.60% / 0.89%.

### Gotchas

- **A negative `text-indent` on a split headline** is inherited by every SplitText line and word
  (inline-blocks): the words piled up on one spot. Clear it inside (`.ln-mask, .ln, .wh`) and pull
  only the first `.ln-mask` back with a negative margin.
- **Mobile one-column resets lose to desktop placements** like `.intro-grid > div:last-child`
  (0,2,1). The reset uses `> div:nth-child(n)` to match that specificity and come later.
- **Puppeteer clicking a control below the fold under ScrollSmoother** scrolls the window natively
  first and the smoother stalls at that offset: the probe's hero-button check failed with the
  button 30px under the fold. Moving the button above the fold fixed it; a JS `.click()` never
  shows it.
- A mouse click leaves focus on the in-page link; the handler now blurs it (mouse) or focuses the
  destination (keyboard, `e.detail === 0`).

## 2026-09-30 (night) · home page motion elevated to the editorial standard, on staging

### Done (commit: see the client `RUNBOOK.md` row)

- `js/00-runtime.js` motion layer rewritten; new `css/25-interaction.css`. Scene by scene list in
  `canary-review.md` → Motion. Five pins at desktop (`hero-scene`, `story-scene`, `process-scene`,
  `results-scene`, `final-scene`); `#final-scene` is on `.final-grid`, the consult and closing h2
  are `js-light` (words lit grey → ink by scroll). Hero pins only when it fits the window.
- Everything motion-only (curtain, cursor, SVG implant drawings, scan line, process rule, rolling
  button labels) is created by the runtime, never in the imported markup.
- Checks: `code/probe.mjs` 29/29 twice; `fluid-root --check` pass; `check-staging.mjs` 14/14 (new
  check: interaction layer created and styled on the live page); `visual-diff` 0.62% at 1440,
  0.80% at 390 (unchanged).
- Pushed with `push-staging.sh`, which now exports `TOKEN_FILES=00-fluid-root.css,01-tokens.css,25-interaction.css`.

### Next

Same as the run below: rulings in `canary-review.md`, then inner pages.

### Gotchas

- **CSS for elements the runtime creates must ship verbatim.** The registry importer keeps only
  rules it can bind to imported markup, so `.curtain`, `.cursor`, `.drawing`… would publish
  unstyled. `push-site.mjs` honours `TOKEN_FILES`; list the interaction stylesheet there. Worth a
  line in the design-build directive on `main`.
- **A puppeteer `screenshot({ clip })` resizes the viewport** (captureBeyondViewport defaults to
  true), which fires `gsap.matchMedia` and reverts every pin: the capture comes back blank. Use
  `look.mjs --at <fraction>` or pass `captureBeyondViewport: false`.
- **FAQ close animation vs one-open rule:** auto-closed siblings must shut at once; animating them
  left two answers open for 0.4s and the probe caught it intermittently.
- `.solution` had a CSS `transition: transform`, which fights a GSAP scrub; `.motion .solution`
  narrows it to `box-shadow`. Same for `.btn` under the magnetic hover (`.is-magnetic`).

## 2026-09-30 (evening) · home page published on Instatic staging

Staging: https://hackensack-dental-implants-staging.up.railway.app/ . Production is provisioned and empty.
Instance details are in the step 01 runbook.

### Done (commit: see the client `RUNBOOK.md` row)

- One command repeats the whole push: from this step folder,
  `RAILWAY_LINK_DIR=<dir linked to the staging environment> bash output/code/push-staging.sh > output/push.log 2>&1`.
  It builds, uploads media, sets alt text, builds and ships the payload, runs Instatic's own
  importer on the container, writes the site document (replace), sets the editor breakpoints,
  places the form Embed block, applies the Open Graph settings, publishes and records.
- The build was made import-safe first: JS hooks are classes (`js-rise`, `js-split`, ...), not
  `data-*`; no custom property is declared outside `:root`; `head.js` is folded into the one
  script; keyframes and the reduced-motion rule live in `01-tokens.css`; underlines are borders.
- Live checks: `output/code/check-staging.mjs` 13/13 (runtime armed with three pins and the
  smoother, both variable fonts loaded from the media library, form Embed block in place, icon and
  share image in the head, `noindex`, no canonical, `og:url` on staging). `visual-diff` local versus
  live: 0.62% at 1440, 0.80% at 390. `compare-live`: the only computed-style differences are the
  Embed block's own box.
- Editor breakpoints are the house set: Desktop, 1279, 991, 767, 479.

### What the generic gates said, and why

| Gate | Exit | Reading |
| :--- | :--- | :--- |
| `verify-live.mjs` | 1 | Four real findings: links to `/services/single-implant`, `/services/implant-bridges`, `/dr-alan-meskin`, `/about` are 404 because only the home page exists. Its other lines look for West LA's runtime (`wz-ready`, drawer, hero film) |
| `css-declared-parity.mjs` | 1 | `* { box-sizing }` was not published as written; the computed value on the page is `border-box` (checked). `.form-card .wz-embed` was tree-shaken; the Embed block carries its own box |
| `check-pages.mjs --base` | 1 | 8 chapters, 3 pins, smoother, one h1. Fails on Turnstile's 401 inside the form frame and on `NOSEO`: there is no canonical on staging by design and no JSON-LD until AEO Schema is configured |
| `verify-motion-live.mjs` | 1 | West LA specific (Bodoni, Manrope, `#heroFilm`); no pin finding |

### Next

1. Send the staging link for review once the items in `canary-review.md` are ruled on.
2. Inner pages (the four 404 links above first), then AEO Schema and the production promotion at launch.
3. After anyone edits in the browser, use `push-site.mjs --update`, not the replace chain.

### Gotchas (toolkit copy, all need fixing on `main`)

- **Seven scripts use `P.WORK` / `P.DIST` without importing `lib/paths.mjs`**: `push/upload-media.mjs`,
  `push/set-alt.mjs`, `gates/verify-live.mjs`, `css-declared-parity.mjs`, `compare-live.mjs`,
  `visual-diff.mjs`, `verify-motion-live.mjs`. They die with "P is not defined". Workaround:
  `node --import ./output/code/preload-paths.mjs <script>`.
- **`build-import-input.mjs` does not empty `data-embed` markers** (bk-stone's copy does, step 0c),
  so `place-embeds.mjs` refuses. Workaround: `output/code/empty-embed-markers.mjs` between the build
  and the ship.
- **`push-site.mjs` hardcodes the favicon as `media/img/logo-icon-dark.png`** and wants all six GSAP
  files in `dist/assets/gsap/`. The build names its icon that way and vendors `ScrollToPlugin` and
  `Observer` although it does not use them.
- `verify-live.mjs` and `verify-motion-live.mjs` still carry West LA's own assertions.
- **A background-image underline publishes as a solid block**: size and position are lost in the
  registry. Use a border.
- **`process.exit()` after fetch trips a libuv assertion on Node 24 for Windows** and the script
  reports failure after doing its work; with `set -e` that stops the chain. Set `process.exitCode`.
- `tools/instatic-api-sync/output/` holds session cookies and had no `.gitignore` in the client
  copy; one is added.
- The replace push keeps the site's breakpoints, but `set-breakpoints.mjs` is in the chain anyway.

## 2026-09-30 (later) · home page rebuilt to the client's chosen concept

Alejandro: the client chose https://hackensack-dental-implants.webflow.io/concept-04-human-transformation;
make the page as accurate to it as possible. The first canary below predates that and is replaced
(its source is in git at `1ef53236`).

### Done (commit: see the client `RUNBOOK.md` row)

- Read first: [`canary-review.md`](./canary-review.md): how to open the page, where it differs
  from the concept and why, what was checked, six things to confirm.
- The concept is one Webflow embed with its own stylesheet and markup. Captured to
  `assets/reference/concept-04/` (`page.html`, `inline.css`, `body.html`, `style-*.json`, screenshots
  at 1440 and 390) with `code/shoot-url.mjs`. The build was ported from those values: px to rem,
  `clamp()` headlines to `rem x --s-h`, the concept's 1000/800 breakpoints to 991/767.
- `code/site-src/` rewritten: `css/01-tokens` to `30-sections`, `pages/index.html` (concept order and
  copy, eight `data-chapter` wrappers), `js/00-runtime.js` (concept reveals plus three scenes).
  Fonts are now Newsreader and DM Sans (variable `woff2` from Google Fonts, latin).
- `code/prep-images.py` re-cut: 14 files, client's own, one per concept slot.
- `build.mjs` also writes `OPEN-home.html` here: the double-click copy. `dist/index.html` is
  root-relative and shows unstyled from the file system.
- `code/compare.py <width>` makes concept-versus-build strips in `look/compare-<width>/`.
- Checks: `code/probe.mjs` 27/27; `fluid-root --check` pass; `image-reuse` 0 problems;
  `check-pages` and `click-controls` exit 1 for the reasons in `canary-review.md`.

### Next

1. Rulings on the six items in `canary-review.md` (patient quote, All-on-4, doctor dates, phone,
   "by Aesthetic Dental Centers", platform).
2. The concept has no multi-page menu, financing, hours or office photographs. Decide where they
   go before the inner pages are built.
3. Ask Brandklout whether the other four concepts matter; only 04 was captured.

### Gotchas

- **Ask for the chosen concept before designing.** Brandklout presents concepts on a `webflow.io`
  staging site; the first canary was built without it and thrown away.
- **Read the concept's code, not only its picture.** Its CSS gave exact grid ratios, radii and
  sizes in one pass; the screenshots were for checking.
- The concept's small text (8 to 10px) and gold kickers (2.9:1) are kept out on purpose; both are
  listed as differences.
- A pinned block that is only a grid looks bare with its heading scrolled away: the process scene
  pins the heading with its steps. The gallery pins alone because heading plus gallery is taller
  than a 735px viewport.
- The GHL survey paints late or not at all in headless captures, so the form card looks empty in
  `look/` stills. It renders in a real browser.

## 2026-09-30 · home page canary, local build

Asked for: "redesign the home page". Steps 01 and 02 of this scenario have not been run and the
platform is not decided; the build follows the Instatic layout.

### Done (commit: see the client `RUNBOOK.md` row)

- Read first: [`canary-review.md`](./canary-review.md) (sources, chapters, checks, decisions to confirm).
- Build: `code/site-src/` (`pages/index.html`, `partials/`, `css/00..30`, `js/head.js` + `00-runtime.js`,
  `vendor/gsap` 3.15.0, `seo.json`, `build.mjs` to `dist/`). Look: `node code/serve.mjs`.
- Images: `python code/prep-images.py` cuts 31 files from the drive pull (`assets/drive/`) and the
  old-site capture into `site-src/media/img` and writes `images.csv`. Fonts: subset `woff2` of the
  site's own Nunito Sans and Maven Pro (`site-src/fonts`, made with fonttools).
- Client drive pulled to `assets/drive/` (office, root, ba, logos; no video). All of it is in R2.
- Checks: `code/probe.mjs` 35/35; `fluid-root --check` pass; `image-reuse` 0 problems;
  `check-pages` and `click-controls` exit 1 for the reasons in `canary-review.md`.

### Next

1. Alejandro and Brandklout react to the canary; rule on the seven decisions in `canary-review.md`.
2. Decide the platform. Instatic: run scenario 0 step 01 (instance, staging, plugins), then push.
3. Service page (All-on-X) and contact page to complete the canary set; read the mobile branch of
   every shared component on the second page.
4. Safari pass (playwright-core 1.49.1 and webkit-2104) and `colour-leak.mjs` once playwright-core
   is installed.

### Gotchas

- **ScrollTriggers are created by kind, not in page order.** Without `ScrollTrigger.sort()` and
  `refresh()` at the end of the runtime, every reveal below a pin measured itself before the pin
  spacer existed and chapter heads faded out while still on screen (seen at 390).
- **`position: sticky` is dead under ScrollSmoother.** Sticky columns are a scrubbed translate
  (`[data-sticky]`), not a pin: a pin with a static subtree fails `check-pages` ("does not scrub").
- **`check-pages` fingerprints opacity, transform, clip-path and text length, not colour.** The
  word-by-word statement only changed colour and was reported as not scrubbing; each word now
  also settles 7px.
- **A scrubbed timeline's trigger stops calling `onUpdate` before a smoothed scrub has caught up.**
  The progress ticks on the treatment scene lagged one step; they hang off the timeline's own
  `onUpdate` now.
- **A custom property computed at `:root` does not follow an override further down.**
  `--d1: calc(6.5rem * var(--s-d1))` ignored `--s-d1` set on the hero; the hero sets its own
  `font-size` from `--hero`. The tiers are measured (`code/measure-hero.mjs`): the longest line,
  "Hackensack, NJ", is 7.16em wide.
- **`scroll-snap-align: start` eats a rail's left padding** unless the rail has `scroll-padding-inline`.
- **The GHL survey's Turnstile answers 401 on localhost** and fails `check-pages` on its own.
  `probe.mjs` blocks those hosts; the gate cannot.
- `journey-audit.mjs` counts zero pins on a root-relative build. Known; not a finding.
- Write `.mjs` files with the Write tool: a bash heredoc broke on a quote inside `probe.mjs`.
- Drive folder names are shortened (`office`, `root`, `ba`, `logos`) to stay under Windows MAX_PATH.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
