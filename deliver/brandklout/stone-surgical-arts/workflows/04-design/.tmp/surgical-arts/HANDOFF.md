# Stone Surgical Arts — handoff

> [!IMPORTANT]
> **2026-09-04, NIGHT: THE FIRST FEEDBACK ROUND ON THE LOCAL BUILD, EIGHT ITEMS. LOCAL ONLY, NOT
> PUBLISHED.** Alejandro reviewed the home and treatments pages at 2425 and 1918 wide.
>
> - **Dr. Stone's photographs, resolution.** All six re-emitted through Magnific at 2x/4x
>   (`upscale-doctor.mjs`; the script now falls back to the restored asset when the Drive export
>   file is missing, and records that it did). Checked face by face against the source: the same
>   person, sharper, no reinterpretation. The steps photograph's play icon is painted out again by
>   `fix-steps.py`, whose geometry now matches the 646px restored source rather than the 702px
>   export; a faint patch remains on the black top at 100% and is invisible at the tile size the
>   page uses. One file per photograph, reused everywhere it appears.
> - **The hero inset "empty when it loads"**: it was `loading="lazy"` in the first viewport, so
>   the figure's stone ground showed until the photograph arrived. Eager now, high priority.
> - **The results band cut the model at the eyes** with motion on. The parallax drifted a
>   photograph whose face is at its very top; it now takes `data-parallax-anchor="top"` with a
>   4% travel. Verified with motion on at 2425 (`section-shot.mjs --motion`).
> - **Text columns shrinking above 2K.** Two causes. (1) Every heading cap and copy column is in
>   `ch` or `rem`, which follow the root font (x1.25 from 1440 to 2425) but not the viewport
>   (x1.68). Seventy of them now read `calc(N * var(--wide))`; `--wide` is 1, 1.15 from 1700px and
>   1.3 from 2400px (`01-tokens.css`, `59-wide.css`), which is the one place to tune it. (2) The
>   "Three steps" heading sat in a box that applied the section gutter and a 46rem cap on the same
>   element; above 1560px the gutter grows to centre the content column and had squeezed the text
>   to 460px. The cap now excludes the gutter. Measured at 1440 and 2425 on three pages.
> - **The neon band is now the front of the building.** The practice owns no exterior
>   photograph and the sister site's "office" banner is the reception desk, so this is Southlake
>   Style's TRG_1543 from the 2021 opening, 16:9 band, Magnific 2x, `assets/ssa-exterior.webp`,
>   on Alejandro's instruction ("grab one from the internet"). **The copyright is the magazine's
>   and the one-line permission ask in `01-content-intake/.tmp/press-photos/README.md` still has
>   to be sent**; if refused, one line in `home.body.html` puts the neon back. The neon itself
>   stays in the place strip and as the About hero.
> - **The footer's page list** is a column now, the first of four beside the address, the mark
>   and the hours (`partials/footer.html`, `22-footer.css`).
> - **The treatments jump bar's scrollbar**: `overflow-x: auto` computes `overflow-y` to auto,
>   and the current link's underline sat 1px below the box. Clipped, and the scrollbar hidden.
> - **Gates:** audit FAIL none / WARN none, all-pages 144/144, journey 47/47, dossier suites
>   50/50; crop probe re-run at 390/1440/2425 with nothing new.

> [!IMPORTANT]
> **2026-09-04, EVENING: FACES UNCUT, AND THE DOCTOR'S OWN STOCK IN. LOCAL ONLY, NOT PUBLISHED.**
> Two jobs on top of the morning's refinement pass, both still unpublished with it.
>
> - **The cut faces.** The client reported faces cut by their frames on several pages. Measured,
>   not guessed: `site-src/crop-probe.mjs` records the visible region of every `object-fit: cover`
>   frame at four widths and `crop-faces.py` intersects it with OpenCV face boxes; 31 of the 40
>   cover rules had no `object-position`, so a portrait in a short frame lost its forehead or
>   chin. Every value was then set from the photograph the frame shows (the values and the
>   reasoning are comments beside each rule). Selectors that always carry a person got a value;
>   selectors shared with rooms got it on the element through `u-focus-top` / `u-focus-upper` /
>   `u-focus-left` in `02-base.css`; the dossier hero has three modifiers now (`is-upper`,
>   `is-mid`, `is-lower`) because 66% held for none of its four photographs, and its 2K cap rose
>   to 56rem so the band can hold a face at all. Two phone frames were too short for any crop and
>   grew: the ask band (5:4) and the treatment step on About (4:5). Re-run the probe after any
>   image swap; the gate is the render. `section-shot.mjs` cuts one section out of a full-page
>   capture for the frames that sit under type.
> - **The doctor's stock.** Twenty files she chose (`01-content-intake/.tmp/Stock Images-…/`),
>   camera originals up to 8768px. `site-src/import-doctor-stock.mjs` brings eighteen in as
>   `ds-*.webp` (16:9 at 2200 or 4:5 at 1200, alt text and provenance per slot in
>   `doctor-stock-manifest.json`). Four are placed, all on the treatments page, beside the
>   treatments they show: the Skin band (Morpheus8 handpiece), the Non-Surgical band (a filler
>   patient smiling), and the two stills under them (PRP syringes, "The plasma"; the spun tube,
>   "The spin"), which replace two generated still lifes. The other fourteen are the library:
>   sized and named so the media panel holds them after the next upload and the client can swap
>   a picture herself. **`Facial Fillers-3.jpeg` is a before-and-after collage of a stranger's
>   mouth and was NOT imported**: a stock before/after on this site reads as the practice's
>   result. **Licence:** she supplied these; nobody has seen the licence. Confirm it covers the
>   practice's own site before the domain goes live.
> - **The clip (`Chemical peels-3.mov`) needs a decision.** Converted to
>   `site-src/video/ds-peel-clip.mp4` (1920x1012, 5 s, muted, 0.6 MB) with a poster frame, and
>   kept OUT of `assets/` on purpose: no component on the site plays video (the steps photograph
>   is a still with the play icon painted out) and `upload-media.mjs` has no `.mp4` entry.
>   Whether a five-second peel clip belongs on the Skin chapter is a design call for Alejandro;
>   if yes it needs a `<video muted loop playsinline>` component with the poster for
>   reduced-motion, and a check that Instatic serves `.mp4` from its media library at all.
> - **Gates:** audit FAIL none / WARN none (the probe found the restored asset library was
>   missing the seven typefaces and the two marble textures; fonts came back with
>   `get-fonts.mjs`, the textures from the live instance's `/uploads/` URLs, both gitignored),
>   all-pages 144/144, journey 47/47, dossier suites unchanged on all four. **To publish, when
>   Alejandro says so:** same route as before; expect the asset step to upload the 18 `ds-*`
>   files and the four re-exported photographs, and `12 written, 0 deleted`.

> [!IMPORTANT]
> **2026-09-04: THE REFINEMENT PASS, LOCAL ONLY, NOT PUBLISHED.** Alejandro, after the doctor had
> seen the twelve pages: *"a little bit less text and more high-definition images ... regenerate
> the same image but on high resolution using Magnific ... improve the spacing, images, reducing
> the text, and improve a little bit the animations. Let's make it locally first so I can review
> it tomorrow and then we can upload it to Instatic."* No layout, colour, type or markup changed;
> the doctor approved the design.
>
> - **Photographs.** Every picture of Dr. Stone, the four small practice photographs and the six
>   staff portraits were re-emitted through Magnific (`site-src/upscale-doctor.mjs`, 2x for the
>   1000px sources, 4x for the 450 to 700px ones; raw PNGs in `assets/_upscaled/`). The steps
>   photograph was a video thumbnail with a play icon on her chest: it is upscaled with the icon
>   on and the icon is painted out afterwards by `fix-steps.py`. `fix-dims.py` rewrote 29
>   width/height attributes to the new intrinsic sizes.
> - **Copy.** Every page body shortened, text nodes only, no element added or removed, every fact,
>   fee and duration kept: home 1474 to 1313 words, blepharoplasty 1966 to 1573, neck lift 1610 to
>   1367, MyEllevate 1695 to 1308, face and neck 1815 to 1409, treatments 1726 to 1466, book 1322
>   to 1208 (the nine sedation instructions and "How you will feel" are fenced off by their own
>   notes and were not cut), memberships 662 to 596, results 588 to 541, doctor 549 to 486, about
>   476 to 435, team 431 to 403.
> - **Spacing, frames, motion.** One new stylesheet, `css/58-breathe.css`, before `59-wide.css`:
>   the section rhythm up a fifth, eyebrow-to-headline a step, body copy at 1.7, the hero inset,
>   the filmstrip, the path panels, the hub stills and the doctor's portrait a size step larger,
>   reveals on a slower settle curve, masked frames on a cinematic curve, photographs answering
>   hover at 1.05, a hairline lift on buttons.
> - **Gates:** audit FAIL none, check-copy clean, all-pages 144/144, journey 47/47, dossier suite
>   on all four dossiers (see the runbook for the numbers). Previews repacked for all twelve
>   (`preview-*.html`); the home preview is the artifact
>   <https://claude.ai/code/artifact/d91e1f09-d1d0-4dab-b97b-98402fa7dc38>, label "Refinement
>   pass, 2026-09-04".
> - **To publish, when Alejandro says so:** the same `build-import-input.mjs` / `push-site.mjs`
>   route as 2026-09-02, `--force`, expect `12 written, 0 deleted`; then `verify-live.mjs` and
>   `compare-live.mjs`. Nineteen image assets changed size, so expect the asset step to re-upload
>   them.

> [!IMPORTANT]
> **2026-09-02, MORNING: TWELVE PAGES PUBLISHED.** The hold below was lifted the same morning
> (*"the team didn't leave any feedback yet"*). Before the publish, three more things the client
> asked for that morning: **one dark marble section on every page** (the hub's financing, About's
> sister practices, the team's reviews, the membership mechanic, the booking page's recovery; the
> home, doctor and dossier pages already had theirs), **2K and 4K** (the full-bleed two-column
> bands cap at the content width above 1700px like the hero; ten full-bleed photographs
> re-exported at their 2200px source; the wide-screen block is `css/59-wide.css`, last in the
> cascade on purpose), and **a page-by-page comparison of live against local**, which ran five
> times and ended at two cosmetic findings. What it found on the way is traps 21 to 25 in
> `21-instatic-upload.md`, the biggest being that every bare `clamp()` size was dropped by the
> conversion and now ships in the code asset with its whole cascade. Two more dossiers were built
> overnight in the loop: **MyEllevate** and the **face and neck lift**.

> [!IMPORTANT]
> **2026-09-02: TEN PAGES, ELEVATED, AND NOT PUBLISHED.** Read this block first; everything
> below it describes the site as it was on 2026-09-01 and is kept for its reasoning.
>
> **The brief that evening.** Brandklout's team and Sang put the journey home page at 60 to 70%
> against four competitor home pages (`../reference-sites/README.md`) and asked for an
> Awwwards-level site: a lot of animations, images and interactions; a more dynamic layout with
> far more section variation; way more images; colours and typefaces unchanged. Then: *"we have
> these Google Drive images too"*, and *"select more doctor photos and the instruments and
> location"*. And, the same evening: **do not publish to Instatic**. The team is commenting on the
> live iteration in BugHerd and the live site is left exactly as they are reviewing it. Those
> comments get addressed on this local build in the morning.
>
> **What exists now, in `final-site/`, every page audited clean:**
>
> | page | shape | its own file |
> | :--- | :--- | :--- |
> | `index.html` | the journey, elevated: a person in the hero, a marquee, the catalogue accordion, the place filmstrip, the surgeon as scrollytelling, a concern index, the review carousel, ghost words, the neon, the towns ticker | `css/50-journey.css`, `css/52-elevate.css` |
> | `neck-lift.html`, `blepharoplasty.html` | the dossier, elevated: parallax hero, mask reveals, a photograph behind the dark band, a related row | `css/51-dossier.css` |
> | `treatments.html` | a MENU: four category chapters, each a person, an instrument still life and a fee table; a sticky jump bar | `css/53-hub.css` |
> | `meet-the-doctor.html` | a magazine profile: the name set behind the portrait, the training as a ledger, the theatre behind the dark band | `css/54-profile.css` |
> | `about.html`, `team.html` | the place and the people, in the practice's own photographs only | `css/55-about.css` |
> | `memberships.html`, `results.html`, `book.html` | a credit calculator, a filterable review wall with an honest gallery state, and the desk with an inert form | `css/56-offers.css` |
>
> `js/12-elevate.js` carries every new behaviour (veil, masks, parallax, ghosts, marquees,
> magnetic buttons, catalogue, surgeon frames, concerns, carousel, jump bar, calculator, filter,
> form) and every one guards on its selector. `motion: true` on every page now.
>
> **Gates:** `audit` FAIL none · `check-copy` clean · `all-pages` 10 pages x 3 widths clean ·
> `journey-test` 47/47 · `dossier-test` 50/50 on both · previews packed for all ten
> (`preview-*.html` beside this file).
>
> **Imagery.** `import-client-images.mjs` now brings in the practice's own photographs (Dr. Stone
> standing, at the desk, smiling, on the steps, candid; the neon; the desk; seven staff
> portraits) AND the previous site's model portrait library, with the rule for where a model
> portrait may go rewritten at the top of the file: as a person, never as a patient or a result.
> **The model library's licence travels with the practice by the client's say-so and needs
> confirming before the domain goes live.** The generated instrument still lifes are back in use
> on the hub. The Southlake Style exterior (`01-content-intake/.tmp/press-photos/TRG_1543.jpg`)
> is still the only exterior photograph and still needs a one-line permission ask; Yelp's twenty
> photos are behind a 403 and are third-party anyway.
>
> **Still true, and now more visible because the pages exist:** the booking form posts nowhere
> (it says so on submit and points at Modento and the phone); the membership tiers are a
> proposal (the page says so; the calculator's fees are real); the before/after gallery is empty
> by rule (the page says so); Abby has no portrait (her card says so); four staff roles are
> unconfirmed (their cards say "Stone Surgical Arts team"); clinical review is outstanding on
> both dossiers.
>
> **For the publish, when it is allowed:** `build-import-input.mjs`, `verify-live.mjs` and
> `compare-live.mjs` already list all ten pages. Five slugs moved from `GONE` back to `ROUTES`.
> Expect `10 written, 0 deleted` and `--force`.

