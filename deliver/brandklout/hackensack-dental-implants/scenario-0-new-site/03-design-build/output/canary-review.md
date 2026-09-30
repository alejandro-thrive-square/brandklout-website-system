# hackensack-dental-implants · home page canary

Built 2026-09-30. One page: the home page, redesigned. Local build only; nothing is pushed to
Instatic or Webflow and the live site is untouched.

**Look at it:** from this folder, `node code/serve.mjs`, then open http://127.0.0.1:4173/.
Stills: `look/` (motion on, one viewport at a time) and `screenshots/index/<width>.png` (six widths,
full page, reduced motion).

## Where the identity and the words come from

| What | Source | Note |
| :--- | :--- | :--- |
| Colours | `:root` of the published Webflow stylesheet | Ink `#030405`, gold `#9a815a` (27 uses, the most-used accent), ivory, cream, linen, cool grey. Gold is a fill and a rule; accent text is a darkened gold `#66512f` |
| Typefaces | The same stylesheet's own font files | Nunito Sans (variable: weight and width) and Maven Pro. Headlines use Nunito Sans at its condensed width, which the current site never does |
| Logo | Client drive, `Logos PNG` | Black on transparent; the metallic set is there for later |
| Copy | The live home page, captured 2026-09-30 | Every sentence is the practice's own. Nothing rewritten, nothing invented |
| Story order | The two interview briefs on the drive | Hook, trust, transformation, call to action; fear of the dentist is the patient's barrier |
| Photographs | Client drive first, then the old-site capture | 22 photographs and logos, all the client's own, no stock. Ledger: `images.csv` |

Steps 01 and 02 of scenario 0 (style pick, sitemap, confirmed claims) have not been run. This
canary takes its direction from the current site and the drive, and is the thing to react to.

## The page, chapter by chapter

| Chapter | Ground | What scroll does |
| :--- | :--- | :--- |
| Arrival | ivory | Photo window wipes open, headline lines rise from a mask; leaving, the photo drifts and the copy lifts away |
| The Difference | white | **Pinned.** "…it is our entire focus." is written word by word by the scroll |
| A New Way to Live | linen | A marquee that speeds up and reverses with the scroll; the photograph travels beside the list |
| The Specialist | cream | Figures count with the scroll; the three surgeons rise in steps |
| Under One Roof | cool grey | **Pinned, the signature.** A titanium post rises into the gap and a crown comes down; then a bridge on two posts; then a full arch on four |
| The Proof | ivory | **Pinned.** Scroll is the before/after slider, three patients in turn |
| The Visit | white | Five tabs with their photographs; **pinned** four-step path that travels sideways (a swipe rail on phones) |
| The Invitation | linen | The GoHighLevel survey (never pinned or faded), the building, address, hours, languages, FAQ |

Navbar is a light glass bar with reading progress; phones get a fixed Call / Schedule bar that
steps aside while the form is on screen.

## What was checked

| Check | Result |
| :--- | :--- |
| `code/probe.mjs` (drives the page) | 35 of 35 pass: every pin holds and shows three different states at 25/50/75%, the path travels 837px, hero button reaches the form, tabs, FAQ, film player, menu, drawer, 333 text elements at or over 4.5:1 with motion on, reduced motion pins nothing and hides nothing, no overflow and no cut-off control at eight widths, phone tap targets 44px, body copy 17px |
| `fluid-root.mjs --check` | pass |
| `gates/image-reuse.mjs` | 25 images, 0 problems |
| `gates/check-pages.mjs` | 8 chapters, 4 pins at 1440 and 3 at 390, runtime armed, one h1, no overflow. **Exits 1**: its only errors are the GoHighLevel survey's Turnstile challenge answering 401 on localhost, plus the console line that iframe prints |
| `gates/click-controls.mjs` | 50 clicks. **Exits 1** on three that change nothing by design: the skip link at the top of the page, the first tab when it is already selected, and a second button to `#invitation` clicked when the page is already there |
| `journey-audit.mjs` | **Fails, and is blind here**: it cannot follow root-relative `/assets/` links, so it counts zero pins. `check-pages` is the gate on this layout |
| `gates/colour-leak.mjs` | not run: needs `playwright-core`, not installed in this worktree |
| Four pinned scenes at 1512x735 | looked at, all fit |
| Safari / WebKit | not tested |

The clipped-control check was added after a cut-off navbar button at 1280 was seen in a
screenshot and fixed; it has not been proved by breaking the fix again.

## Decisions to confirm

1. **Platform.** Built to the Instatic layout (`dist/`, vendored GSAP, embed marker). If the site
   stays on Webflow this is a Scenario 6 build instead.
2. **The building photograph** shows the "Aesthetic Dental Center of Hackensack" awning and its
   phone number, 201-488-8866. The copy says the practice is inside that center, so the photo fits
   its sentence, but it puts a second brand and a second number on the page.
3. **Dr. Lee's portrait** has "JMC" embroidered on the scrubs (another institution). It is the
   photo the current site uses; a new one would be better.
4. **Before and after photographs** are the three pairs the current home page publishes "with
   written consent". The drive has more pairs; none are used until consent is confirmed for them.
5. **Two small copy edits, both structural.** "Drag the slider on any photo to see the change" is
   dropped because scroll drives the comparison now. Dr. Meskin's biography and the "Made
   Comfortable" paragraph are split, the second half behind "Read more"; every word is still there.
6. **Reception photograph** on "Care That Never Rushes You" is on topic rather than exact (fit 2 of 3).
   A photo of a consultation would be the right one.
7. **Patient films** play from Vimeo (`1198870167`, `1198867061`) on click. The drive holds the
   source files if they should be hosted differently.

## Before this can go to Instatic

- Provision the instance and staging (scenario 0 step 01); no credentials exist for this client.
- The headline typeface relies on the width axis of the variable font. Instatic's font library
  installs static instances, so the variable `woff2` has to be uploaded as media.
- The form marker is `data-embed="ghl-survey"` for `place-embeds.mjs`; the Embed block needs
  `api.leadconnectorhq.com` and `link.msgsndr.com` allowed, and `player.vimeo.com` for the films.
- Service page and contact page complete the canary set (step 5 of the directive).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../SYSTEM_RULES.md). Source is tracked
(`code/site-src/` css, js, pages, partials, vendor); `dist/`, images and fonts are gitignored and
backed up to R2.
