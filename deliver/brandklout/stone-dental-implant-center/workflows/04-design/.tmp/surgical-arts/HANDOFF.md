# Stone Surgical Arts — handoff

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

