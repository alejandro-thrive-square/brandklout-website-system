# Stone Surgical Arts — handoff

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
> `05-instatic-upload.md`, the biggest being that every bare `clamp()` size was dropped by the
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

