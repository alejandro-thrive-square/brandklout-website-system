# Horizon — Turn-Key Section, AWWWARDS EDITION: Paste Guide

Complete redesign of the home-page **Turn-Key Luxury Homes** section as a
full-bleed dark feature listing:

| Element | Interaction |
|---|---|
| Heading | SplitText line reveal (`data-hz-split`), cream on ink |
| Kinetic type marquee | Giant serif address + outlined "Coming Soon" auto-scrolling full-bleed strip; slows on hover (`data-hz-tk-marquee`) |
| Editorial collage | 4 photos in a staggered two-column grid; curtain clip-path reveal on scroll (`data-hz-tk-mask`) + scroll parallax inside each frame (`data-hz-tk-parallax`) |
| Spec numerals | Count-up on scroll — 3 Bed / 2 Bath / 3,100 SQFT / 0.25 Acres (`data-hz-tk-count`, `data-hz-tk-dec`) |
| Info bar | Tag chips, address, location, "Inquire About This Home" button (`/contact-us`), reveal on scroll |

Class family is `turnkey_*` (NO hyphen) — the live site already owns
`turn-key_*` with different defs, so the new family drops the hyphen to avoid
forking `-2` classes. Shared classes (`u-section`, `u-eyebrow` + `is--on-dark`,
`u-heading-display`, `button` + `is-alternate`, `button-group`) are
byte-identical to the `new-sections-awwwards` defs — verified — so they merge
by name.

Source design: `../../04-design/.tmp/turnkey-awwwards/new-sections.html`
(open locally to preview all interactions — on a FOCUSED tab). Regenerate with
`python deliver/process/07-webflow-build/html_to_webflow.py --html <source html> --css <source>/sections.css --split <this folder>`.

## Paste steps

1. In the Designer, DELETE the old `section_turn-key` section (the plain
   heading + CMS spec list + image grid, last section inside Main Wrapper).
   Style Manager → Clean Up later to purge the unused `turn-key_*` classes
   (they are also used by nothing else).
2. Open `paste_01_u-section.html` in logged-in Chrome → copy button → focus
   Designer (Ctrl+0 zoom) → select the section BEFORE the old turn-key spot
   (the image-splitter section) → paste. Re-copy fresh on a miss.
3. Add a Webflow **Embed** at the bottom of the pasted section and paste in
   `section-scripts/script_01_turnkey.html`. Do NOT install it in Page
   settings — the embed keeps the behavior attached if the section is saved
   as a Component or moved. The script is idempotent (safe to run twice) and
   uses the GSAP stack the site already loads site-wide (gsap + ScrollTrigger
   + SplitText 3.15) — no new libraries.

`webflow-custom-code.js` in this folder is the converter's auto-copy of the
preview script (page-level install). Ignore it — the portable embed above is
the supported install, matching the other awwwards sections.

## Notes

- **Static, not CMS.** The old section was CMS-bound (`w-dyn-list`); this
  redesign pastes as static elements for one listing. When more turn-key homes
  exist, wrap `turnkey_info`/gallery in a Collection List and bind fields.
- Spec numbers are real text in the markup (3 / 2 / 3,100 / 0.25) — the
  count-up only animates them, so no-JS/SEO still shows correct values.
- Images hotlink the OLD site's CDN (`675b3bd3757cf1d3225bc88b` bucket, same
  as the section's previous images) — re-upload to site assets for long-term
  safety.
- The marquee track holds ONE set of 4 items; the embed script clones the set
  until the loop covers the viewport. Edit text on the originals — clones pick
  it up on next page load.
- Caption indexes (01–04) are numbered per column so they read sequentially
  when the collage stacks on mobile.
- Verify animations on a FOCUSED tab — background tabs freeze
  ScrollTrigger/timers.

## Version Control

Follows [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). Lightweight
artifacts committable; no binaries.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
