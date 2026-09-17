# 2026-09-17b — ads landing pages: the GHL form moved into every hero, filmed patients added

Second pass on the nine ads landing pages, on Brandklout's feedback: **more images and video
testimonials, and the GHL form belongs in the hero of every page.** Still local, still not
published, and the form is still the placeholder — see the 2026-09-17 run for that blocker,
which this pass does not change.

## Done (`<sha>`)

### The form is in the hero on all six pages that take one

All three landing pages and all three consultation pages open with a two-column hero: copy
left, form card right, photograph behind both. Three consequences:

- **The landing pages no longer link to the consultation pages.** Every CTA is `#book` and
  scrolls to the form already on the page. A click-through is a place to change your mind.
  The consultation pages still build and still stand alone as the leaner ad destination.
- **The hero's DOM order is copy → form → under.** On a phone the form has to be the next
  thing after the headline; with the ticks, the offer line and the numbers above it the
  first field started ~900px down. Above 1080 the three blocks are placed explicitly, so
  the desktop reading order is still headline, copy, form.
- The h1 drops from `--d2` to `--h2` in this hero, because 4.68rem display type in a 620px
  column wraps a six-word headline onto four lines and pushes the first field under the fold.

### Filmed patients

The practice's own six filmed patients, from `patient-stories.html`. One lead film beside
its pull-quote (`.st-row`) plus three click-to-play facades (`.vl-grid`). **No new CSS and
no new JS** — `sections/video-library.js` guards on `.vl-grid` and picks them up.

| Page | Lead film | Facades |
| :--- | :--- | :--- |
| `ads-all-on-4` | Melanie, full-arch | Stephen, Barbara, the couple |
| `ads-dental-implants` | Yolanda, implants | Stephen, Donita, Barbara |
| both consultation pages | Melanie / Yolanda | none |
| both thank-you pages | Stephen / the couple | none |
| all three veneers pages | none, deliberately | none |

### More imagery

Every landing page: three before/after sliders → **six**. Every mosaic: three figures →
**four**. Per-page counts are now 26 / 28 / 25 local images, plus three film thumbnails on
two of them. No page repeats an image.

## Verified

| Gate | Result |
| :--- | :--- |
| `site-test.mjs`, all 46 pages | **781/784.** Zero failures on any of the nine. |
| `fluid-qa.mjs`, the nine at 7 widths | **135/135** |
| `css-vocab.mjs` | 10 problems, all pre-existing, none naming `landing` |
| hero structure, all six form pages | 6/6, checked in the live DOM, not by tag balance |
| per-page image repeats | 0 (bytes hashed) |

The same three pre-existing failures survive on `index` and `our-facility`; both files are
still unmodified. **site-test gained a check that CLICKS a film facade** and requires a real
player to take its place — it also covers `/video-library`'s thirteen.

## Next

1. Review with Brandklout.
2. **The forms still block the campaign.** One LeadConnector form per campaign, each
   redirecting to its own thank-you page. And make them SHORT: the placeholder has seven
   fields, which makes the hero ~1300px tall and puts the submit button below the fold.
   Name, telephone, email and treatment type is enough to make the call.
3. Ask the client for one filmed veneer patient — see Gotchas.
4. Import to Instatic (workflow 22) and publish.

## Gotchas

- **Only six of the fourteen films in `videos.json` are the practice's own.** The other
  eight feature a GENERIC PRESENTER against a white backdrop and are not Dr. Nahlah;
  `gen-videos.mjs` says so in its header, and the tell is `hqdefault` rather than
  `maxresdefault`. All three cosmetic films are in that eight, which is why **the veneers
  campaign carries no film at all** — there is no veneer patient testimonial either. Do not
  put one of those eight on a paid page.
- **One real `<iframe>` per page is a requirement, not a performance choice.** Instatic
  lifts CSP `frame-src` only for a page that renders a real YouTube node, so a page of
  click-to-play facades alone could never play anything once published. The lead film is
  that node. `video-library.html` has carried this arrangement since it was built.
- **Never wrap already-revealing blocks in a `data-rv` container.** `js/20-pagekit.js` skips
  a `data-rv` whose parent has one:
  `if (el.parentElement && el.parentElement.closest('[data-rv]')) return;`
  The first `.lp-hero-under` carried `data-rv="stagger"` and silently disabled all four of
  its children's reveals, leaving them at opacity 0 on six pages. The wrapper is layout
  only now. Nothing but site-test would have caught this.
- **Tag balance does not prove nesting.** A stray `</div>` keeps the open/close counts equal
  and still re-parents everything after it: the first consultation-page rebuild left the
  form card and the supporting copy OUTSIDE `.lp-hero-grid`, and a balance checker called
  all nine pages BALANCED. Ask the live DOM whether the element is a child of the container
  it is supposed to be in — `probe-grid.mjs` does exactly that for these six heroes.
- **Carrying a block across with a regex carries its indentation too.** Re-indenting by
  counting tags then treats a wrapped continuation line as a new nesting level and each
  list item steps two spaces further right. Rebuild the list from its item text instead.
- **`object-position` does nothing on the hero photograph.** The hero is now tall enough
  that `cover` scales the landscape source to the box HEIGHT and crops horizontally only, so
  the vertical component has no effect. Tested at `50% 0%` against `50% 50%`: pixel
  identical. Do not add a crop hook for it.
- **A blank GHL form under automation is Cloudflare Turnstile.** Not headless Chrome, not
  the page. Turnstile refuses automation and localhost (600010) and parks the iframe at
  `left:-9999px`, and the client's own live form does the same. Prove the form on the
  deployed domain in a real browser; forcing the iframe visible over CDP is enough to review
  the layout.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
