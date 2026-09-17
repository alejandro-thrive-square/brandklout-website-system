# 2026-09-09 — The last five pages from the old build, and a source that was wrong

**Instance:** `https://staging.masonparkdental.com`. Production untouched.

## Done

Five pages, all at their original WordPress URLs, all live on staging and clean
through `verify-live.mjs`:

| Route | What it is |
| :--- | :--- |
| `/toothpaste-rda-table/` | 87 toothpastes by abrasiveness, in the four bands the old chart named |
| `/ph-and-acidity-of-food-beverages/` | 455 drinks and foods by pH, in 13 lists, most acidic first |
| `/product-recommendations/` | 35 products in six lists, links intact |
| `/patient-resources/` | the hub, 17 entries, every target verified on disk |
| `/town-resource/` | a short "new to Katy" guide, five official links |

Staging now serves **57 page rows** (54 static + `blog`, `blog-article`, `404`)
and the 161 CMS articles. 231 media files. `check.mjs` 222 pages / 0 errors,
`prune-nav.mjs` every internal link resolves, `probe-heights.mjs --diff base`
frozen pages unchanged, `probe-dropdown.mjs` OK.

New scripts: `build-rda.mjs`, `build-ph.mjs`, `build-products.mjs`,
`build-hub.mjs`. All four parse the scrape rather than retyping it.

## Gotchas

**The pH source is factually wrong in nine places.** The old page's food and
condiment table has values off the pH scale entirely — "A-1 Sauce 34",
"Ketchup 37", "Sour cream 44", "Cranberry sauce 23", "Italian salad dressing
33" — plus four with a mangled range separator ("Vinegar 2.4.3.4", "Apples
2.9-.35", "Grapes 3,3-4.5", "Grapefruit 3.0-.3.5"). pH runs 0 to 14, so a 34 is
a lost decimal point, not a reading.

`build-ph.mjs` validates every value against the scale and applies only
MECHANICAL repairs — restoring a decimal, normalising a separator — and prints
each one. Anything it cannot repair mechanically is **dropped with a warning**
rather than shipped. A number on a dental page reads as clinical information;
a guess is worse than an omission. **Read the nine repairs in the build log
before trusting the page.**

**The old page's tab sections are anchors, not headings.** `/product-recommendations/`
has six tabs (`#hygiene #anti #dry #implant #white #invali`) but only three
visible section headings. Grouping on headings put the Dry Mouth and Implant
products under "Anti-Cavity" and the Invisalign products under "Whitening" —
19 products in one bucket instead of four buckets of 11, 4, 4 and 3. The anchor
offsets are the real boundaries.

**The Amazon affiliate tag is not obviously this practice's.** All 29 product
links carry `tag=grandmissiond-20`. It is preserved deliberately — dropping it
would silently end whatever it earns — and the URLs are rebuilt as the
canonical `amazon.com/dp/<ASIN>?tag=…` with the search cruft gone. **Somebody
should check whose Associates account that is.** If it is not Mason Park's,
this page has been earning for someone else.

**A disclosure was added, and is not optional.** The old page carried 29 tagged
affiliate links and no disclosure. The Amazon Associates operating agreement
requires one, and so do the FTC endorsement guidelines. It is one line in the
"How to use this" ledger.

**`cityofkaty.com` answers 403 to anything that is not a browser.** All three
City of Katy links tested dead by `curl` — including the site root, with a
browser user-agent. They are fine: opened in Chrome through the extension, all
three render. Do not delete a link from that host on the strength of a curl
check.

**The Katy PD non-emergency number on the old page is not reprinted.** The old
page gives "(713)-884-3131", which is not a City of Katy number, and the KPD
page does not publish one in its body text. The new page gives 911 for
emergencies and links to KPD for everything else, and says why. Do not add a
number here without checking it against the department's own page that week.

**`.svc-ledger`'s hairline grid used to be the container's background.** With
`gap: 1px` and `background: var(--rule)` on the `<ul>`, a short last row showed
the rule colour as one large tan block — very visible on an 87-item list in a
6-up grid. Now the container is panel-coloured and each `<li>` paints its own
hairline with `box-shadow: 0 0 0 1px`. No layout change (box-shadow is outside
the box model), so the frozen pages did not move.

**The freeze baseline moved 36px at 390 and was re-saved.** Adding one footer
row ("Patient resources") adds one stacked line on mobile. Content did not
move; `heights/base.json` is re-saved against HEAD.

## Decisions

- **The "Dental Library" was not rebuilt.** It was a categorised index of
  treatments, which is exactly `/our-services/` in this build. The hub links
  there rather than shipping a second, competing catalogue.
- **No product photos.** The old page hotlinks 35 PNGs from the WordPress host
  this build replaces; those URLs die with it, and the repo carries no binary
  assets. If the client wants them, they need re-hosting as media first.
- **`/toothpaste-chart/` was NOT rebuilt** — deliberately left for the client.
  It reproduces a third-party toxicant-testing chart credited to Lead Safe
  Mama, LLC. Republishing another organisation's research table wholesale is a
  licensing question, not a build question. Ask before rebuilding it.
- **The hub does not link to a form.** The old page's whole premise is "take
  advantage of our online patient forms" and there is no form backend on this
  site. The forms card says what actually happens today: call ahead, or the
  tablet at reception. Same call as the virtual consultation page.

## Next

- **Open with the client:** the form backend; the Privacy Policy and Cookie
  Policy (Terms §17/§18 reference both, never captured, regulated — must not be
  drafted here); whose Amazon Associates tag `grandmissiond-20` is; and whether
  to rebuild `/toothpaste-chart/`.
- **The 404 page is Instatic's stock one.** No `notFound` template exists, so a
  bad URL gets an unstyled page with no site chrome. One template page with
  `target: {kind:"notFound"}` fixes it.
- **Report the page-level SEO gap to Instatic** — see the 2026-09-09 staging
  upload run.
- Standing recommendation: skip `/appointment/`.
