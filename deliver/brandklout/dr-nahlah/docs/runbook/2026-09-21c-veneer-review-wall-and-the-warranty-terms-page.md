## 2026-09-21c: a veneers-filtered review wall, the warranty terms page, and the review wall that was invisible everywhere — PUBLISHED AND VERIFIED LIVE

BugHerd **#41, #42 and #47 closed**. The board is now **45 done / 2 open**, and the
two that remain are a GHL form setting (#32) and a wording question for the client
(#39). Nothing on it is waiting on us.

Published at **2026-09-21T18:5x** (seq 276, then 277 for the style fix). Verified in
the browser and by fetching all nine linked pages.

### The client's two decisions, which is what unblocked this

> "We don't have any veneer videos in the Dr. Nahlah YouTube channel or Vimeo so I
> will delete the patient stories section and I will replace it with reading
> testimonials."
> "Jess just tell me to draft a page for that warranty and then you guys can
> coordinate with Dr. Nahlah's team."

and then, mid-run:

> "If you can have the widget of the Google Reviews with a filter for veneers, that
> would be perfect."

### #41/#42 — the veneers filter is possible, and the reason it looks impossible

**`gen-reviews.mjs` scrapes the ReputationHub SSR widget page, and that page serves
EIGHT reviews. The practice has 319.** Filter those eight for "veneer" and you get
nothing, which is what makes a topic wall look like something the feed cannot do.

The widget's client fetches the rest from its own JSON API, and so does the new
`gen-reviews-topic.mjs`:

```
GET https://services.leadconnectorhq.com/reputation/widgets/data
    ?locationId=…&widgetId=…&projection=reviews&page=1&size=400
    header: channel: APP
```

- **`page` does not work, `size` does.** `page=2` returns `[]` at any size, and
  `page=0` too. Ask for more than the total in one call. The script throws if the
  response comes back at exactly `size`, because that means it truncated.
- 319 reviews, **four of them five-star and naming veneers** — Benjamin Sturms
  ("veneers done 8 months ago… teeth designed in house"), Angela Kelley ("8 top
  veneers"), Daniel Bethea Jr ("porcelain veneers"), Patricia Araujo ("my veneers
  are perfect"). They are a genuine treatment filter, not a selection.
- Reviews are printed whole, never trimmed. A Google review is somebody's published
  words.

The films section on both `-veneers-consultation` pages (Yolanda's implant story and
three more implant films) is **gone**, replaced by that wall. `.lp-rv-wall` is a new
two-column modifier in `70-landing.css`: `.rv-wall` goes to three columns at 1080
because the home page shows six cards, and 3+1 leaves one hanging.

### The bug that was in the way: `.rv-wall` was `display:none` SITE-WIDE

The new wall published invisible. So had the home page's six review cards, since the
import — the section rendered its "4.9 ★★★★★ Google reviews · both offices" headline
over nothing at all, with six `.rv-card` elements in the DOM at height 0.

**Three registry rules carried `display:none`** where `css/37-ch-proof.css` declares
`display:grid`. It is an import artefact, not a decision: `sections/ch-proof.js`
upgrades the cards to the vendor's live widget where a third-party frame is allowed,
and when it does it sets `wall.hidden = true` — the attribute, deliberately, so the
cards stay readable to a crawler. The page was imported while that attribute was
set and **the importer recorded the computed style of a hidden element into the
class rule.** The upgrade can never happen on Instatic anyway; its CSP lists
`frame-src` for YouTube only.

`fix-rv-wall-display.mjs` puts `display:grid` back on all three. The home page's
review wall is visible again for the first time since the migration — 6 cards,
three columns, 707px tall.

**The lesson generalises: a computed style captured at import can encode a JS
runtime state as CSS.** Anything the site's own scripts hide or move before the
importer looked at it is a candidate.

### #47 — /five-year-warranty, and eleven links

The page exists because the site claimed the warranty in twelve places and linked to
nothing. **Nothing on it is invented.** Every commitment traces to something the
practice already publishes, and the page's own header comment names the source of
each line:

| claim | source |
|---|---|
| "Any part that fails inside five years is replaced free of charge" | /about |
| "conditional on Precare: general cleanings every six months" | /all-on-4 |
| "5-Year warranty on implant procedures" | /dental-implants |
| "Free second opinions" | /our-team |

**There is deliberately no exclusion list, no transferability clause and no "what
voids it".** The practice has not published any, and on a warranty an invented
limitation takes away something a patient was promised. Flagged on the pin for
Dr. Nahlah's team to fill in.

Eleven links across nine pages: both dental implants pages (×2 each), both All-on-4
pages, all four thank-you pages, /about. Two mentions are deliberately NOT linked and
the script says so on every run: /about's card heading (the card already carries its
own "Read the warranty terms" link) and /our-team's, which sits inside an existing
`<a>` — an anchor in an anchor is invalid HTML.

### Gotchas

- **Pushing an ads page from the local package reverts the Vimeo migration.** The
  2026-09-21 YouTube → Vimeo swap was applied to the live Instatic document only;
  `site-src` still carries the YouTube embeds. `/ads-landing-pages/alexandria-dental-implants`
  serves `data-vimeo` four times live and `youtube.com/embed` from the package. That
  is why the warranty links went in as **surgery on the live node tree**
  (`push-warranty-links.mjs`) and not as a rebuild. Check this before pushing ANY
  ads page from the package until the two are reconciled.
- **A `base.text` cannot contain a link.** To put one mid-sentence the node has to
  be split. Two shapes, both copied from what the converter emits: a `tag:'p'` text
  node becomes `base.container {tag:'custom', customTag:'p'}` keeping its id, with
  text/link/text children; a `tag:'none'` node's WRAPPER takes the three children
  in its place.
- **`push-ads-pages.mjs` must not be used for an editorial page.** It adds every
  page it pushes to the scope of `src/styles/landing.css`, which sits after the kit
  in the cascade, so `.lp-hero` would beat `.pg-hero`. `push-editorial-pages.mjs`
  is the same script without the stylesheet step.
- **`ads-to-nodes.py` was ads-only in its DISCOVERY only.** `instatic_slug` already
  leaves a non-`ads-` slug alone and `route()` already maps `x.html` → `/x`, so
  `--pages <slug>` was four lines.
- **Classes from `70-landing.css` do not exist on editorial pages.** The first cut
  of the warranty page used `.lp-creds`; that file is scoped to the eighteen ads
  pages, so it would have rendered as an unstyled div. Same for `.pk-note`, which is
  not a kit class at all, and `.nx`, which is `.pk-next`.
- **A screenshot taken right after a programmatic scroll is mid-animation.** The
  `data-split` heading photographs half-drawn and a `data-rv="stagger"` block
  photographs part-revealed. Let ScrollSmoother settle ~2.5–3s, and measure
  `getComputedStyle` rather than trusting the picture — that is what caught the
  `display:none`, which looked at first like the stagger not having fired.

### Files

- `04-design/.tmp/site-src/gen-reviews-topic.mjs` — the filtered wall generator
- `22-instatic-api-sync/push-editorial-pages.mjs` — an editorial page over REST
- `22-instatic-api-sync/push-warranty-links.mjs` — the eleven links, surgically
- `22-instatic-api-sync/fix-rv-wall-display.mjs` — the site-wide `display:none`
- `22-instatic-api-sync/ads-to-nodes.py` — gained `--pages`
- `05-design-revisions/close-bugherd-41-42-47-2026-09-21.mjs`

### Version Control

Committed on `bk-dr-nahlah`. The package carries the new page, the new section, the
`.lp-rv-wall` rule and the anchor in all five ads sources, and `build-site.mjs` was
re-run (56/56). **The package's ads pages still differ from live on the film host**
— see the first gotcha.
