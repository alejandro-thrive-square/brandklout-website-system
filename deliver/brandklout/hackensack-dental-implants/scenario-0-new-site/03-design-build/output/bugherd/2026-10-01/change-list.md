# BugHerd 544349 · 2026-10-01 · change list

23 open tasks, all from agency@brandklout.com, in two rounds: #1 to #15 at 18:10 to 18:26 UTC on the
page before the film hero, #16 to #25 at 22:36 to 22:42 UTC on the film hero page. Pulled by id with
attachments by `code/bugherd-pull.mjs` (task folders here). The home page is the only page on
staging, so "site-wide" below means the shared component on that page and the partials every later
page will use.

Fixed in the source (`code/site-src/`), pushed with `push-staging.sh` (backup `backups/pre-bugherd-stg/`,
seq 10 → 11) and checked live: `check-staging.mjs` 14/14, `click-film.mjs` 16/16, `probe.mjs` 27/27,
`fluid-root` pass, `image-reuse` 0 problems, screenshots at 1512×735 and 392.

| # | Comment | Scope | Fix | Draft reply |
| :-- | :-- | :-- | :-- | :-- |
| 1 | Remove the cursor follow | site-wide (runtime) | Cursor follower deleted from the runtime and its CSS | Removed site-wide. |
| 2 | Update with logo in Google Drive | site-wide (nav) | Nav uses the Drive logo "Hackensack Center Logo Stacked" (black, transparent) as `logo-stacked.webp`; the text name and "By Aesthetic Dental Centers" under it are gone, the logo carries the name. Arrival curtain uses it too | Logo from the Drive in the navigation. |
| 3 | "Dedicated implant care in Bergen County, New Jersey" | site-wide (top bar) | Top bar text changed | Updated. |
| 4 | The view doesn't do anything, remove | site-wide | The "View" label was the cursor follower's; gone with #1. The hero photo it was pinned on was replaced by the film | Removed with the cursor follower. |
| 5 | Move All-on-4 to a new line so it's not cut off | this section | "Full-Arch /" then "All-on-4®" on its own line, never broken at its hyphens (`.nowrap`) | All-on-4® now on its own line. |
| 8 | remove (gallery subtitle) | this section | Removed | Removed. |
| 9 | remove (reviews subtitle) | this section | Removed | Removed. |
| 10 | Wrong account (share.google link) | site-wide | **Not done, waiting.** The right listing is Google "Hackensack Center for Dental Implants" (kgmid `/g/11nvclyc8j`, 5.0 from 15 reviews). The widget `cf96ca10` shows Aesthetic Dental Center of Hackensack and is also embedded on the live Webflow site; re-pointing it in Elfsight changes both | (after the change) Widget now shows the Hackensack Center for Dental Implants listing. |
| 11 | Bring his photo up, don't cut off his head, too much white space | this section | The portrait (now in the doctor section) fills its arch: `cover` anchored at the bottom, arch 33rem high. Head whole, little white above | Portrait fills the arch now, head uncropped. |
| 12 | These should link to the team page with their profiles | site-wide (team list) | Each surgeon links to his profile: `/dr-won-sang-lee-dds`, `/dr-maurice-srour-dds`, `/dr-dmitriy-klass-dds-msd` (the live site's slugs). Those pages are not built on staging yet, so they 404 there for now | Linked to each profile; the profile pages come with the inner pages. |
| 13 | Long scroll with nothing happening (closing section) | this section | The closing scene is no longer pinned; its words light while it scrolls past | Closing section no longer holds; it plays as it passes. |
| 14 | remove (footer tagline) | site-wide (footer) | Removed | Removed. |
| 15 | remove ("By Aesthetic Dental Centers", footer) | site-wide (footer) | Removed | Removed. |
| 16 | Move [the doctor card] to the bottom of the video, it's cutting off the image | this section | Card at the film's lower left on desktop; on phones it already sat under the film | Moved to the bottom of the video. |
| 17 | On mobile view Meskin is cut off | this section | Phone: the surname is sized to the screen width (21vw) and set above the arch | Fits the phone now. |
| 18 | This scroll needs to animate faster | this section | The patient-quote scene holds for 55% of a screen instead of 110% | Twice as fast. |
| 19 | F is cut off at the top, need more space | site-wide (every split headline) | Line masks get room above the capitals as well as below (`.ln-mask` padding-top 0.16em) | Fixed on every headline. |
| 20 | Bring her photo up, too much head room | this section | Full-arch photo framed lower (`object-position 56% 85%`) | Less headroom. |
| 21 | C is being cut off, give more space | site-wide | As #19 | Fixed with #19. |
| 22 | F is being cut off, give more space | site-wide | As #19 | Fixed with #19. |
| 23 | Brown line isn't needed | site-wide | Scan line removed from the runtime and its CSS | Removed. |
| 24 | Update [rating] based on office | site-wide (hero card + stats) | 5.0 from the office's own listing (was 4.7, the Aesthetic Dental Center listing): hero card "5.0 · Google rating", stat "5.0 Five-star Google rating" | Updated to the office's 5.0. |
| 25 | Too many scrolls to activate the animation | this section | As #13 | Fixed with #13. |

## Waiting on Alejandro

1. **#10:** re-point Elfsight widget `cf96ca10` to the Hackensack Center for Dental Implants listing
   (changes the live Webflow site's widget too), or create a separate one. Then update
   `review-widgets.json` on `main`.
2. **Replies and status in BugHerd:** the drafts above are not posted and no task is moved; both
   notify the team.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../../SYSTEM_RULES.md).
