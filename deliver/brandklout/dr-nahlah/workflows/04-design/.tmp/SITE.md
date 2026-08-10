# Design Phase — the Site

The home journey was a single verified page. This turns it into a site: one home
page plus interior pages, all assembled from one shell so they cannot drift
apart.

**Currently 14 pages.** Eleven of them are live in Webflow; three were added on
2026-08-10 and are local only — see [Build-out to 26 pages](#build-out-to-26-pages).

Package: [`final-site/`](./final-site/) · Source: [`site-src/`](./site-src/)

Build: `node site-src/build-site.mjs` (assets: `node site-src/copy-assets.mjs`,
gallery grid: `node site-src/gen-gallery.mjs`).

## Why a builder instead of eleven HTML files

Eleven hand-maintained pages means eleven navs, eleven footers and eleven copies
of the token layer. The second time someone edits the nav, they diverge. So:

```
site-src/
  partials/head.html      tokens, reset, shared primitives, GSAP tags
  partials/nav.html       site nav + reading progress + chapter readout slot
  partials/drawer.html    full site index, opens at every breakpoint
  partials/pagekit.html   the interior-page section vocabulary (one style+script)
  partials/footer.html    site footer
  partials/flush.html     ScrollSmoother creation, queue flush, nav state, drawer
  pages/<slug>.body.html  ONLY the <section> elements for that page
  build-site.mjs          assembles final-site/<slug>.html
```

Each output page is still fully self-contained — the Webflow build story does not
change. `pages/home.body.html` keeps its nine per-chapter `<style>`/`<script>`
blocks; the interior pages share `pagekit.html`, which becomes one site-wide
embed rather than ten copies of the same CSS.

## The eleven pages

| Page | Role |
| :--- | :--- |
| `index.html` | The nine-chapter journey, unchanged in structure |
| `dental-implants.html` | Implant hub — anatomy, four options, process, cases, FAQ |
| `all-on-4.html` | Full arch — why four posts, the four visits, warranty terms |
| `implant-cost.html` | What drives cost, insurance, the three financing partners |
| `sedation-dentistry.html` | Nitrous / oral / IV, and why it is a credential here |
| `smile-makeover.html` | Cosmetic hub — five tools, the design-first argument |
| `veneers.html` | Candidacy, two appointments, "do veneers ruin your teeth" |
| `smile-gallery.html` | 28 filterable before/after pairs — generated, not hand-written |
| `patient-stories.html` | The six filmed patients; three with published quotes |
| `meet-dr-nahlah.html` | All twelve credentials, the Tysons Study Club, UCSF |
| `contact.html` | Two offices, hours, directions, consultation request form |

## Build-out to 26 pages

The eleven-page package covers the implant and cosmetic funnel and nothing else.
The site it replaces has **33 pages**, and its own primary navigation — captured
verbatim in `01-content-intake/.tmp/current-site-scrape/pages/*.md`, where every
scraped page carries the nav in its body text — organises them into six groups:

| Group | Old-site pages |
| :--- | :--- |
| Dental Implants | Implant Surgery · All-on-4 · Fixed vs. Removable · Cost & Compare · Implant FAQ |
| Aesthetics | Cosmetic Dentistry · Porcelain Veneers · Crowns & Bridges · Smile Makeover · Teeth Whitening |
| Treatments | Sedation · Oral Surgery · Emergency · Conditions We Treat |
| What To Expect | Patient Center · Insurance & Financing · Smile Gallery |
| Who We Are | Why Choose Us · Meet Dr. Esam Nahlah · Meet The Team · Video Library · Patient Stories |
| For Doctors | Referral Form |

**That table is the build-out spec.** Fifteen pages restore the groups the
eleven-page package dropped, taking the site to 26. They ship in four batches so
each one can clear the gates before the next begins.

| Batch | Pages | Status |
| :--- | :--- | :--- |
| 1 | `about` · `our-team` · `our-facility` | **Built 2026-08-10** |
| 2 | `cosmetic-dentistry` · `teeth-whitening` · `crowns-and-bridges` · `oral-surgery` | **Built 2026-08-10** |
| 3 | `emergency-dentistry` · `dental-conditions` · `implant-supported-dentures` · `dental-implant-faq` | **Built 2026-08-10** |
| 4 | `patient-center` · `financing` · `doctor-referral` · ~~`tysons-study-club`~~ → `privacy-policy` | Pending |

> [!WARNING]
> **`/tysons-study-club/` is entirely Lorem Ipsum and is live on the client's site.**
> Its two body paragraphs are placeholder Latin and one heading reads *"The [Practice
> Name] Difference"*. The inventory counts it as an 856-word page; none of those words
> are real. It is the only page on the 33-page site in that state.
>
> There is therefore nothing to rebuild from. The only attested fact about the club
> anywhere in the scrape is one line on `/about/`: Dr. Nahlah is *"Founder of Tyson's
> Study Club (dental Continuing Education platform)"*. Building a page off that would
> mean inventing the rest, which is not on offer.
>
> **`privacy-policy` takes the fifteenth slot instead** — it has 1,114 words of real
> content, it is needed at launch, and it was only excluded to keep the count at fifteen.
> Raise the study club with the client as **(a)** an urgent defect on their live site and
> **(b)** a page that needs source content before it can be built.

**Deliberately excluded**, and why:

- `/video-gallery/` — 142 YouTube embeds. Films are not hot-linked from a
  prototype (see *Still open*); wire it at Webflow build time or not at all.
- `/blog/` and its 43 posts — CMS work, and it belongs to modules `12`–`14`
  with the redirect map, not to the design package.
- `/privacy-policy/`, `/terms-conditions/` — cheap, and needed before launch.
  They are out only because the brief said fifteen; swap two in on request.
- `/free-event/`, `/veneer-survey-thank-you/`, `/implant-survey-thank-you/` —
  campaign and utility pages tied to funnels nobody has confirmed still run.

### Rules the build-out follows

1. **No forward links.** `site-test.mjs` fails any link to a page that does not
   exist yet, and it is right to — on staging that link is a 404. Batch 1's
   `about` page wants an *Emergency care* link and carries it commented out with
   a `RESTORE IN BATCH 3` marker instead.
2. **Three lists move together**: `PAGES` in `site-src/build-site.mjs`, `PAGES`
   in `site-test.mjs`, and `PAGES` in `fluid-qa.mjs`. A page missing from the
   last two is a page whose links, contrast and overflow nobody is checking.
3. **`webflow-parity.mjs` is deliberately NOT extended.** It gates the eleven
   published pages against the live site; the new pages have no published
   counterpart to diff against, so adding them would only make the gate fetch
   404s. Extend it when the build-out is published.
4. **New pages are written in American spelling.** The eleven original pages
   carry British forms ("practising", "colouring", "anaesthesiologist") on a
   Virginia dental site — a known defect, still open. New pages do not inherit
   it; the older eleven need a pass.

### Batch 1 — the practice cluster

The three pages the client asked for on 2026-08-10, and the reason the `/about`
slug was freed by the `meet-dr-nahlah` rename.

| Page | Source | What it carries |
| :--- | :--- | :--- |
| `about.html` | `/about/` | The practice argument: 7,000+ implants, 20+ years, free second opinions, same-day emergencies, the five-year cosmetic warranty |
| `our-team.html` | `/our-team/` | Five named staff with published portraits, and the in-house-lab argument |
| `our-facility.html` | `/our-dental-facility/` | The tour, and the six-machine technology inventory |

Three things worth knowing about them:

- **They do not overlap.** `about` is *why this practice*, `meet-dr-nahlah` is
  *who the specialist is*, `our-facility` is *the rooms and the equipment*. The
  technology list lives on `our-facility` even though the source site buried it
  on `/about/`, because that is where someone looking for it would go.
- **No bios were written.** The source publishes a name and a job title for each
  staff member and nothing else. The copy under each portrait describes **the
  role at this practice**, never the person — nothing claims a fact about
  Venita, Junko, Helia, Hana or Basma that the source did not publish. Real bios
  from the client replace those paragraphs wholesale.
- **`our-facility` is running on every photograph that exists.** Six images of
  the building survive in the 911-file extraction and two of them are equipment.
  The client offered office photos in a Drive folder during the 2026-08-06
  comment round; that page roughly doubles in strength the moment they arrive,
  with no copy change.

Two build flags were raised by the source material:

1. **An orphaned job title.** `/our-team/`'s markup carries a sixth title,
   *Receptionist*, with no name and no photograph — an `<h4>` stranded under
   Basma's card. It is not rendered rather than guessed at. Ask whether that is
   a sixth person or a second hat.
2. **`copy-assets.mjs` was silently producing nothing in this worktree.**
   `03-graphic-resources` is 708MB and stayed in the `main` checkout when
   `04-design` was split out, so the hardcoded sibling path resolved to an empty
   directory and every copy "went missing" while the script still exited 0. It
   now takes a **`DOWNLOADS`** environment override and exits 1 if the
   extraction is not where it is told to look.

### Batch 2 — the aesthetics group, plus oral surgery

| Page | Source | What it carries |
| :--- | :--- | :--- |
| `cosmetic-dentistry.html` | `/cosmetic-dentistry/` | The hub above veneers, whitening and crowns: six problems, five tools, the sequence |
| `teeth-whitening.html` | `/teeth-whitening/` | Professional bleaching against strips and home remedies, as a table |
| `crowns-and-bridges.html` | `/dental-crowns-and-bridges/` | Save the tooth before replacing it; the two benefit lists; what decides cost |
| `oral-surgery.html` | `/oral-surgery/` | Extractions, bone grafting, implant placement, and the no-fear argument |

**Three defects on the client's live pages, fixed here rather than carried over:**

1. **An unedited CMS placeholder is live.** `/cosmetic-dentistry/` publishes a treatment
   card headed literally *"This is the heading"*. The body copy under it is real and
   describes **inlays and onlays**, so that is what the card is called in the rebuild.
2. **The practice misspells its own name.** The same page's closing offer reads *"speak
   directly with Dr. Naahlah"*. Corrected.
3. **Two pages contradict each other about the laboratory.**
   `/dental-crowns-and-bridges/` says bridges are hand-crafted "at our partner dental lab";
   `/about/` says the digital lab is in the building, and the equipment inventory backs it.
   Both cannot be current. The rebuild says in-house, because every other page and the
   machine list agree — **but confirm with the client whether an outside partner lab still
   handles bridge work.**

**Three source assets deliberately unused**, each for a reason worth keeping:

- `alluredental-hero-girl-1.png` — named for a different practice; provenance and
  licensing unknown (project-overview.md, open question 9).
- `2025/02/unnamed.jpeg` on `/oral-surgery/` — empty alt, meaningless filename, unknown
  subject. It cannot be given honest alt text, so it is left out rather than guessed at.
- The three procedure icons — dark line art on transparent. Dropping them on the cream
  ground is a contrast gamble nobody has measured; the numbered cards carry the same
  structure with none of the risk.

`teeth-whitening` holds **the only `<table>` on the site**. The page kit has no table
primitive, because one page needing one is not a primitive — and the `implant-cost`
`.vs-us` tint is a different shape (two columns, us vs. them). The new table repeats one
hard-won rule from that page: the highlight tint is layered **over** the cell background
via a gradient, never replacing it, or the table's hairline shows through and produces the
olive wash (bug 12).

### Batch 3 — treatments, and the rest of the implant group

| Page | Source | What it carries |
| :--- | :--- | :--- |
| `emergency-dentistry.html` | `/emergency-dentistry/` | Eight reasons to call today, five situations and what to do before arriving |
| `dental-conditions.html` | `/dental-conditions/` | Ten everyday complaints as an accordion |
| `implant-supported-dentures.html` | `/implant-supported-dentures/` | Fixed vs. removable at 20% / 60% / 98%+ of natural function |
| `dental-implant-faq.html` | `/dental-implant-faq/` | Twelve questions, and the site's second `FAQPage` graph |

Four decisions in this batch worth keeping:

1. **The 911 notice leads the emergency page; on the source it is buried.** The client's
   page puts *"if you are bleeding uncontrollably… call 911"* near the bottom, under five
   treatment write-ups and roughly 900 words. Someone with severe head trauma will not
   read that far. It is now the first thing after the hero, styled as a notice rather
   than as body copy. This is the only page on the site where the reader may be in a real
   emergency while reading it.
2. **The emergency page publishes the *new-patient* numbers, not the current-patient
   ones.** The McLean current-patient number is still disputed (448-3312 vs. 493-1358, see
   *Still open*), and an emergency page is the last place to print a number nobody has
   confirmed.
3. **The fixed-vs-removable comparison keeps its unflattering lines.** Implant-supported
   dentures "may not look or feel natural"; traditional dentures are "low-cost". Both are
   the client's own words, and a comparison that lists only the good points of the
   expensive option is not a comparison — it is a price sheet.
4. **`/dental-conditions/` was 2,118 words in one unbroken column** with no headings for
   its ten conditions. It is now an accordion, because nobody reads 2,118 words to find
   the paragraph about their own mouth. Three source typos are silently corrected: *"we
   want to here from you"*, *"a dependably choice"*, and *"gum disease can become
   uncurable"*.

**Stephen is quoted but not photographed.** His words are attributed on the source site,
which is what makes them usable; no portrait of him exists in the extraction, and
captioning a stranger's face with his name is exactly the mistake bug 14 was raised for.

## Navigation — the coherence fix

The home page had **no site navigation**. Its nav was a logo, a chapter readout
and one CTA; its drawer listed chapters; its footer "Treatments" links pointed at
home-page anchors. That is fine for a one-page prototype and broken the moment a
second page exists.

Now, on every page:

- **Nav row**: logo · five primary links · Book a Consult · menu button.
- The menu button is present at **every** breakpoint. The drawer is the site
  index, not a mobile fallback — three columns of real page links plus both
  offices, four phone numbers and hours.
- On the home page only, the five links cross-fade out and the **chapter readout
  fades in** once the nav goes solid (`.nav[data-journey="1"].solid`). Pure CSS,
  no extra JS. The journey keeps its identity; the site keeps its nav.
- `aria-current="page"` marks the section you are in.
- The footer links to real pages, and its hours are no longer anchor links to
  nowhere.

Every page also cross-links laterally through a `.pk-next` block, so no page is a
dead end.

## Light, with two dark anchors

The first build was near-black throughout. The client's read was that dentistry
needs to feel open and light, so the site was inverted — same palette, used the
other way round. Cream is the ground, ink is the type, and gold stops being a
glow on black and becomes the accent that carries the brand.

**Do not paint a section with a raw colour.** Every rule reads from the theme
layer in `partials/head.html`, which is what makes a section flippable:

| Token | Light (default) | Dark scope |
| :--- | :--- | :--- |
| `--bg` / `--bg-2` / `--bg-3` | `#FAF8F3` cream · `#fff` · `#F5F2E9` wash | `#0B0B0C` · `#141416` · `#1C1C1F` |
| `--card` | `#fff` | `#141416` |
| `--fg` / `--fg-body` / `--fg-soft` | `#141416` · `#3A3A40` · `#55555C` | `#fff` · white .78 · white .62 |
| `--line` / `--line-strong` | ink .13 · ink .3 | white .12 · white .3 |
| `--accent` / `--accent-lg` / `--rule` | `--gold-ink` · `--gold-deep` · `--gold-deep` | all `--gold` |

Gold splits three ways because **brand gold is 2.4:1 on cream**. `--accent` is
the only one safe for text-sized type; `--accent-lg` is for display numerals and
quote marks; `--rule` is for hairlines and dots that carry no meaning. White on
`--gold-deep` is 4.06:1 — under AA — so filled gold chips (the "After" tag, the
active gallery filter) use `--gold-ink`.

A section becomes dark by carrying `data-theme="dark"`, and everything inside it
re-resolves. That is used exactly four times: **chapter 07 (the film)**,
**chapter 08 (the invitation)**, the **footer** and the **drawer**. Everything
else — including both hero types — is light. `data-theme="light"` exists for the
reverse case: the gold CTA band sits inside dark chapter 08 and has to step back
into light tokens or its heading would inherit white type on gold.

Three things stayed dark on purpose and are *not* dark sections:

- **Text over photography.** The chapter 06 panels, the before/after tags and the
  patient-story figure captions keep their scrims. White type on a photograph is
  a caption treatment, not a theme.
- **The film.** It is footage; a light scrim over video reads as a fault.
- **The drawer.** It is an overlay, and the header rides above it — which is why
  `.nav.menu-open .burger span` forces white bars regardless of the page theme.

The rhythm on the light pages comes from three grounds in rotation — cream,
white, gold wash — rather than from alternating dark and light bands. On the
interior pages that is `.pk`, `.pk.alt` and `.pk.light`.

## The home hero is footage, not a portrait

Chapter 00 opened on a cut-out portrait of Dr. Nahlah. It now runs the practice's
own b-roll (`hero.mp4`, from `2022/04/DR-Broll.mp4`) under a cream veil that is
heaviest over the copy column and clears to the right, so the film is visible
rather than being used as texture. He still appears as a portrait in chapter 03,
so nothing is lost by taking him out of the hero.

- **Poster frame is drawn from the video itself** (`hero-poster.jpg`, 52KB, made
  by seeking to 30% and reading the frame off a canvas), so the hero is never
  empty while 8.8MB is still arriving, and it is what reduced-motion users see —
  a looping background film is exactly the motion that setting asks us to stop.
- The film plays only while chapter 00 is on screen.
- **Open build task: 8.8MB is too heavy to ship.** Compress and add a WebM
  before launch. The client's current site serves a 19.7MB banner, so this is
  already an improvement, but it is not a finished figure.

Text over a moving picture cannot be scored by the site contrast audit, which
marks anything over imagery unscorable. `hero-contrast.mjs` covers it: it
screenshots the composited page at four points in the clip, reads the pixels
back through Chrome, and takes the worst case behind each text block. Measured
worst across the full 24s clip — headline **5.68:1**, lead **6.75:1**, meta
**8.41:1** at 1640px, and 14.96 / 8.56 / 9.91 at 390px.

## Scroll feel

Two different things get called "smooth scrolling", and they pull in opposite
directions:

- **Glide** — how long the page keeps easing after the wheel stops. This *is* the
  effect. It is `smooth` on ScrollSmoother.
- **Trail** — how far a pinned scrub lags *behind* that glide. This is the thing
  that reads as broken, and it is the trigger's `scrub`, not `smooth`.

The original build had `smooth: 1.05` with pins at `scrub: .7` and `.6`: the two
lags ran in series and the pinned chapters carried on moving for **1441ms** after
the wheel stopped. Dropping `smooth` to `.8` fixed the trail but also cut the
glide to 754ms, which took the smoothness away with it.

Shipping now: **`smooth: 1.2`, both pins at `scrub: .3`.** Glide **1051ms**, and
the wipe trails the page by roughly **0ms** — the animation moves *with* the
glide instead of behind it. Measured alternatives, same probe:

| smooth | pin scrub | glide | wipe trails page by |
| ---: | ---: | ---: | ---: |
| .8 | .3 | 754ms | 96ms |
| **1.2** | **.3** | **1051ms** | **~0ms** |
| 1.2 | true | — | ~0ms (no better than .3) |
| 1.4 | true | 2433ms | ~0ms — starts to feel like the page is arguing |

**To make the page feel more or less smooth, move `smooth` and leave the scrubs
alone.** Raising the scrubs is what made it feel broken the first time.

`normalizeScroll` was tried and deliberately rejected. It is the usual advice for
pinning, but measured here it changed the settle time by 16ms — inside the noise —
and it swallows `touchmove`, so on a phone a before/after slider jumps to wherever
you tapped and then stops following your finger (value 24 instead of 87 on a
25%→85% drag). Handing those elements back with `ignore: '.pk-ba'` fixes the drag
and then traps the page: a vertical swipe starting on a slider scrolls 0px
instead of 535px. The comment in `partials/flush.html` records this so it is not
re-attempted.

## The page kit

One `<style>` + one `<script>` covering: hero, breadcrumb, sticky-lede prose,
card grids, image/copy splits, stat counters, before/after sliders, pull quotes,
FAQ accordion, next-steps links and the closing CTA band.

Motion is attribute-driven, so page bodies stay semantic:

| Attribute | Effect |
| :--- | :--- |
| `data-rv` | Rises into place at 86% of the viewport |
| `data-rv="stagger"` | Same, walking its children |
| `data-split` | Masked line-by-line reveal via SplitText |
| `data-drift` | Photo drifts against the scroll |
| `data-count` | Counts up; prints the final value under reduced motion |

Before/after sliders are `<input type="range">`, not mouse-only drag handles, so
they work from the keyboard and announce as sliders.

## Bugs found and fixed

Found by screenshotting every page and by a scripted contrast audit.

1. **`.foot` collided site-wide.** The footer's unanchored
   `.foot{background:var(--black)}` was painting a **black plate inside the cream
   transformation chapter**, under dark caption text — 1.3:1. This is the black
   rectangle visible in the first screenshot pass. Footer CSS is now anchored to
   `footer.foot`, and the chapter's row renamed `.tf-foot`.
2. **Gold labels on light sections.** `--gold` is 2.5:1 on the cream ground and
   `--gold-deep` only 3.7:1 — fine for display sizes, short of AA for small
   uppercase labels. Added **`--gold-ink: #665C33`** for small gold text on light.
3. **Card labels over photographs.** The technology cards' top scrim was
   `rgba(11,11,12,.10)` — effectively raw photo behind a gold label, unreadable
   over the bright practice interior. Both ends of that gradient now carry a real
   scrim, and the label sits on `--gold-light` with a shadow.
4. **Low-alpha UI text.** Seven values at `.34`–`.42` white (3.0–4.1:1) raised to
   `.58`. Light-section body text moved from `--ink-500` to `--ink-700`.
5. **The comparison table's gold gradient** read as a muddy olive wash ending in a
   hard edge at the "vs" column, and dragged text contrast down. Replaced with a
   flat tint plus a gold rule.
6. **Stacked comparison rows lost their meaning on mobile** — the "vs" column is
   hidden below 720px, leaving two unlabelled blocks. They now label themselves
   *Here* / *Elsewhere*.
7. **Mobile hero.** The portrait sat dead centre at .55 opacity, directly behind
   the lead paragraph and both buttons. Moved to the lower-right, dropped to .34,
   with a vertical scrim under the copy column.
8. **"12 board credentials" vs eight listed.** The home page said "Eight of
   twelve" and linked to `meet-dr-nahlah.html`, which lists all twelve. The client
   relabelled that link "Meet Dr. Nahlah" on 2026-08-10, so the contradiction is
   back — raise it with them.
9. **Footer hours were anchor links** to `#invitation` — four keyboard tab stops
   that went nowhere. Now plain text.
10. **Nested `data-rv`** animated a node twice and could strand it invisible. The
    kit now skips any `data-rv` with a `data-rv` ancestor.
11. **`.sp-list` was scoped to `.pk-split`**, so the same list inside a `.pk-lede`
    rendered unstyled. Now a standalone class.
12. **The `.vs-us` tint replaced the opaque cell background** instead of layering
    over it, letting the table's hairline grey show through — the washed-out
    olive the first screenshot pass caught. Now a gradient layered on `--ink-900`.

### Found in the mobile pass (second review round)

13. **Partner logos disappeared on dark cards.** CareCredit, Proceed Finance and
    LendingClub are drawn for white stationery — dark green, navy and red on
    transparent. On a near-black card they all but vanished. They now sit on a
    white `.brandmark` plate, which is the ground they were designed for. The
    alternative — recolouring someone else's logo — is not ours to do.
14. **A named patient was paired with a stranger's face.** Stephen's quote is
    attributed on the source site; no photograph of him is. The card had been
    given `pt-hero-3.jpg`, an unattributed patient portrait, which reads as "this
    is Stephen". The first replacement was worse — `consult-discussion.jpg` turns
    out to be a child in a chair, wrong on every axis. The card now carries a
    **typographic plate**: a gold quote glyph and the treatment name, clearly not
    a person. Swap in a real portrait only if the client supplies one with
    consent.
15. **Alt text claimed a person was in a photograph that has none.** The specialist
    page's award image is the symbolic trophy the source site used, not a picture
    of Dr. Nahlah receiving anything. Alt text corrected.
16. **A verifiable patient went unnamed.** `patient_hero.jpg` carries the source
    alt "Yolanda - All-On-X patient". The All-on-4 hero now names her rather than
    calling her "a patient".
17. **The gallery hero was a blurred mouth close-up** that read as abstract skin
    texture under the scrim. Swapped for a patient portrait.

### Found in the client review round (third round)

18. **The drawer covered its own close button.** `.nav` is `position:fixed;
    z-index:120`, which makes it a **stacking context** — so the burger's
    `z-index:130` could only ever mean "130 inside the header", not "130 on the
    page". The drawer at `z-index:125` painted straight over it, and the X the
    button morphs into was invisible and unclickable. The header now takes
    `z-index:130` while the drawer is open (`.nav.menu-open`, toggled with the
    same click that opens it), goes transparent so it does not draw a bar across
    the panel, and fades out the links, the CTA and the progress rail so only the
    logo and the X remain. A **`Close` label** fades in beside the X, because an
    unlabelled glyph was what the client read as "there is no close button".
19. **The proof film's top and bottom edges shimmered while scrolling.** The
    video was scrubbed from `scale:1.16` to exactly `scale:1` inside an
    `overflow:hidden` clip. At the end of that scrub the video edge sits *on* the
    container edge, and ScrollSmoother paints the page at fractional offsets — so
    the boundary pixel flickered between video and background on every frame.
    The video is now bled 2px past all four edges and the scrub ends at `1.04`,
    so it always overhangs. Same defect, same fix, in the Chapter 01 frame:
    `#realityImg` ended at `scale:1` while drifting `yPercent:8`, which does not
    just shimmer — it opens a real gap. Now `1.2 → 1.14` against `±6`.
    **Rule: a scrubbed scale inside a clip must never land on 1, and the drift
    must stay under `(scale - 1) / 2`.**
20. **The Google mark was a raster lockup rendered at 40px.** `google.png` is a
    940px "Google Reviews" wordmark with its own star row — squeezed into 40px it
    was mush, and it duplicated the stars already beside the score. Replaced with
    a **vector G** (`assets/google.svg`) at up to 72px, with the source named in
    the caption instead: *Google reviews · both offices*.

21. **The whole site was inverted to light** — see *Light, with two dark anchors*
    above. Worth recording as a bug rather than a preference: the kit had a
    bolt-on `.pk.light` variant with twenty-odd override rules, which meant the
    only way to flip a section was to write it twice. It now paints from theme
    tokens, the overrides are gone, and a section changes theme by changing one
    attribute. Contrast fallout from the flip was four items, all gold: white on
    `--gold-deep` at 4.06:1 (the "After" chips and the active gallery filter),
    the marquee's ◆ separators, and two phone links still set to `--gold-light`
    from the dark build.

22. **Two scrubbed tweens fought over the same words.** Chapter 01's read-through
    brightened every word to ink, and a second tween took the last seven to
    gold. Their scroll ranges overlapped by ~110px, so for that stretch both
    tweens wrote `color` on those seven words every frame — the flicker the
    client saw. The tail is now excluded from the first tween: **one word, one
    owner.** Any two scrubbed tweens sharing a property and an element need
    disjoint ranges, or one of them has to give up the element.
23. **GSAP wiped the CSS that centred the doctor's portrait.** `.ch-specialist
    .portrait img` centred itself with `transform:translateX(-50%)`, and the
    parallax tween wrote the whole `transform`, dropping it — the portrait sat
    **243px** right of its plate. Centring now lives in the tween as
    `xPercent:-50` on both ends. **A transform used for layout cannot sit under
    a tween that animates transform.**
24. **The film's scrim did not cover the film.** The video is bled 2px past its
    clip so the scaled edges never shimmer (bug 19), but `.film::after` was
    still at `inset:0` — leaving a 2px strip of un-dimmed footage top and bottom
    that flickered as a border while scrolling. The scrim follows the bleed.
25. **Split headings never re-flowed.** SplitText bakes line breaks at split
    time. If the page is measured while it is narrow — a docked devtools, a
    browser side panel — or before the webfont lands, those breaks are kept
    forever, which is how a two-line heading was reported as one word per line.
    `W.splitLines` now passes **`autoSplit:true`**, and takes an optional
    builder used as `onSplit` so the tween is rebuilt against the new lines
    instead of pointing at dead nodes. Call it with a builder wherever the lines
    animate; omit it for one-shot entrances, where the lines still re-flow and
    simply do not re-animate.

`google.svg` and `logo.png` are the two marks that are **not** client photography
and so are not in the extraction. They live in `site-src/assets/` and
`copy-assets.mjs` copies them into the package, so a clean rebuild cannot
silently drop them.

### Photo provenance rule this established

Before a photograph goes next to a named patient, its `alt` in
`01-content-intake/.tmp/current-site-scrape/pages/*.md` or its entry in
`03-graphic-resources/.tmp/asset-manifest.csv` has to actually identify them.
Two of the practice's photographs do (Yolanda, and the framed-photo portrait the
home page attributes to Melanie). The rest are unattributed and must not be
captioned as anyone.

## Content honesty

The reviews grid shipped as six **invented** filler reviews behind a
`data-placeholder` flag. It is now the six real filmed patients from
`/testimonials/`. Three carry the only attributed pull-quotes that exist in the
source material (Melanie, Yolanda, Stephen — each traced to the page that
published it). The other three say a film exists and link to it, rather than
having words written for them. The test asserts both: no filler copy survives,
and every name is on an attested list.

No prices are quoted anywhere, because the source site quotes none.

All imagery is the client's own, from the 911-file extraction. No stock was
bought for this rebuild.

## Verification

```bash
python -m http.server 8902 --directory .tmp/final-site
node .tmp/interaction-test-gsap.mjs http://127.0.0.1:8902/index.html   # 63/63
node .tmp/site-test.mjs http://127.0.0.1:8902                          # 137/137
node .tmp/capture-slices.mjs <url> <outDir> [w] [h] [step]             # screenshots
node .tmp/hero-contrast.mjs 1640 934                                   # ink over the hero film
```

`site-test.mjs` covers all eleven pages: shell present, one `h1`, unique
title/description, **every internal link and in-page anchor resolves**, no broken
images, every revealed block ends visible, sliders respond, no overflow at 1440
or 390, no console errors, and a **WCAG AA contrast audit** of every text node
whose background can be resolved.

### Four harness traps worth keeping

- **`Log.entryAdded` does not carry `console.error`.** `WZ.run` swallows a failing
  section's exception into exactly that, so a page could lose half its motion
  setup and still report "no console errors". The harness now also listens to
  `Runtime.consoleAPICalled`.
- **ScrollSmoother eases; scripted scrolling outruns it.** A fast walk arrives
  with triggers still catching up, which reads as "content never revealed" on a
  page that is fine. Both the capture driver and the test settle deliberately,
  and the test re-parks on anything still hidden before failing it.
- **`python -m http.server` ignores Range requests**, so a `<video>` served from
  it reports `seekable: [0,0]` and every `currentTime` assignment snaps back to
  zero. A harness that seeks through a clip silently measures frame one over and
  over — six identical readings is the tell. Sample during playback instead.
- **`getImageData` past the canvas edge returns transparent black**, which scores
  as a 1.86:1 contrast failure against body ink for something that is not on the
  page at all. Clamp sample rects to the image. Related: GSAP writes inline
  `visibility:visible` on its reveal targets, so hiding a copy column with
  `visibility:hidden` to photograph what is behind it does nothing — the
  measurement then reads the glyphs themselves and reports a flat 1:1. Use
  `display:none`.

## Still open

- The six testimonial films are YouTube embeds on the live site. They are
  deliberately not hot-linked from a prototype — wire at Webflow build time, or
  self-host if the client owns the masters.
- The contact form has no `action`. Three different Flexbook URLs are in use on
  the current site; which survives is unresolved.
- **McLean current-patient phone conflict.** `/contact/` publishes
  (703) 493-1358; the footer and `/dr-esam-nahlah/` publish (703) 448-3312. Three
  of four sources say 448-3312, so that is used, and the contact page carries a
  visible `data-build-flag="phone-conflict"` note. Confirm before launch.
- Brand naming is still unresolved sitewide — the source uses "Dental Group of
  Tysons" in body copy and "Dr. Nahlah Implants and Prosthodontics Specialists"
  in the logo. These pages use the latter throughout.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- `site-src/**` and `final-site/*.html` are committed; `final-site/assets/**` is
  gitignored (it is a copy of extracted client media) and syncs to the VPS.
