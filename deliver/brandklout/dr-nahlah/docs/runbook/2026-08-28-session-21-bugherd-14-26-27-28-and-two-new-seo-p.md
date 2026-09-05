## 2026-08-28 (session 21): BugHerd #14 #26 #27 #28, and two new SEO plugins — PUBLISHED AND VERIFIED LIVE

Four board items closed and two plugins built, installed, configured and gated.
Published at **2026-08-28T05:21Z** (site) plus a separate post-row publish;
`16-instatic-plugins/verify-seo-plugins.mjs` asserts the plugins against the
LIVE bundle — **1511 assertions over all 79 published URLs, all green**.
Snapshot before the publish: `.tmp/backups/pre-publish-s21-{site,pages}.json`.

Session 20's work re-verified first: `.tmp/verify-s20.mjs` still 22/22, so
**#13, #24, #25 and #21/#22/#23 are done and live** and only need closing on the
board.

### #28 — the home portrait, and why it was a swap and not a CSS fix

> "picture is still cut off" — `/` → `#specialist` → `#specPortrait`

`.ch-specialist .doc-plate` is `aspect-ratio: 4/5` with `overflow: hidden` and
`object-fit: cover`. It was drawn for the **1200x1500 cut-out portrait of Dr.
Nahlah — same 4:5, zero crop.** Pin #11's de-duplication pass replaced it with
`dr-and-yolanda.jpg`, which is **800x535, landscape, 1.495:1**. Measured live at
1440: the box is 507.5x634.4 and the picture is drawn 948 wide, so 46% of the
frame is thrown away — his arm off the left, her shoulder off the right. **No
`object-position` fixes that**; half the frame has nowhere to go.

`push-pin28-portrait.mjs` puts `2LB_FQE0Yk3mHR8rlDnxS-dr-headshot.png` back.
**This does not break pin #11:** the client's rule is per page — "not to repeat
images **on the same page**" — and `/` carries this portrait nowhere else; the
script asserts that against the page as saved. `dr-and-yolanda.jpg` stays on
`/about` and `/implant-supported-dentures`.

Worth knowing: `dr-nahlah.png`, `dr-headshot.png` and
`DGT_Dr_Nahlah_Headshot_White-Coat_V2.png` are **three asset ids over one
1,147,115-byte file**. Pointing at the one already in service keeps that count
from growing.

### #26 — the topic filter was not empty, the PUBLISHED ROWS were

> "We need to create the topics, some sort of categories to filter."

The `<select>` had all 8 options and the taxonomy was correct. `blog-filter.js`
prunes each option against the topics the cards actually carry, and every
`<span class="bl-topic">` on the published page was **empty**, so it pruned all
of them and the client saw one "All topics".

Cause: pin #10 wrote `topic` to the **draft** rows with `PATCH /data/rows/:id`,
and **a SITE publish does not promote post rows** — `persistSitePublish` walks
`data_tables.id = 'pages'` only. `publish-post-rows.mjs` exists and documents
this exactly; it had never been run. 43/43 published, verified in the loop
projection. Live now: Implants 16, Aftercare 11, All-on-4 8, Technology 3,
Dentures 3, Veneers 1, Cost 1.

**This is the trap to remember: anything written to a post row's cells needs
`publish-post-rows.mjs --apply` as well as a site publish.**

### #27 — 43 articles, 22 pictures

> "we have a lot of repeated images here, let's use stock photos from Magnific
> API. Make sure to analyze the image so it matches the topic of the article."

Worse than the brief said. Identity settled by **SHA-256 of the fetched bytes**,
never by asset id — 43 rows held 29 distinct ids but only **22 distinct
pictures**, 21 redundant. `patient_hero.jpg` and `pt-hero-4.jpg` were on four
articles each.

`push-post-images-dedupe.mjs` re-shot all 21 from Freepik on
`post-image-pool.mjs`'s curated topic phrase (never the article title — that
rule is inherited and load-bearing). Every candidate is scored before it can be
chosen: it must read as dentistry, it gains points for the topic's own
vocabulary, and it is vetoed outright on children / surgical fields / blood /
braces / render language.

**One rule earned during the run:** two Freepik ids can be two frames of the
SAME shoot. "Teeth ceramics dentures on printed acrylic model in dental lab. Top
view." came back twice under different ids and both were picked, which would
have put two near-identical white acrylic models back on `/posts` — the exact
defect being removed. Candidates are now also de-duplicated on the first five
significant words of the title.

Live: **43 cards, 43 distinct images, zero repeats.**

### #14 — the review widget on `/patient-stories`

Copied byte-for-byte off `/`'s embed at run time rather than pasted into the
script, so the two cannot drift. Placed at index 1, directly after `.pk-head` —
under the paragraph claiming 4.9 out of 5, because the widget is the evidence
for that claim. One new class `.pk-reviews` supplies the bottom margin `.mz` has
no top margin for. No CSP change needed: compatible mode already widens any page
containing an embed.

**It renders as an empty white box in headless Chrome — and so does the one on
the home page.** The vendor's widget is client-rendered from
`reputationhub.site` (200, a 6KB shell) and does not paint under CDP. Identical
behaviour to the already-approved home-page instance; not something this change
introduced.

### Two new plugins: Open Graph and AEO Schema

Full write-ups in `16-instatic-plugins/{open-graph,aeo-schema}/README.md` and a
new section in `16-instatic-plugins.md`. The four things that would otherwise
cost a session:

**1. The publisher's `<head>` is three tags, and one of them is site-wide.**
`buildDocumentMetaTags` emits a title, ONE `settings.metaDescription`, and the
favicon. No canonical, no `og:`, no JSON-LD. And `seoDescription` — a real cell,
with a real admin field, filled in on **73 of 80 pages** — is not read at all, so
every page shipped the same sentence. A field existing in the admin is not
evidence the publisher emits it.

**2. `slug` does not identify an entry page.** `publish.html` gets
`{ siteId, pageId, slug }`, and for a data-row page `renderPublishedDataRowTemplate`
returns `slug: merged.slug` — the TEMPLATE's. All 43 articles arrive as
`slug: "post"` sharing one `pageId`. `merged.title = row.cells.title` is set one
line earlier, so `<title>` is the row's; both plugins resolve slug-first,
title-second. `verify-seo-plugins.mjs` asserts all 79 URLs get a **distinct**
canonical and `og:url` — that is the check that catches a regression here.

**3. A `publish.html` filter must be synchronous.** It runs in the QuickJS
worker over an RPC round-trip; calling `api.cms.content.*` from inside it is a
second round-trip while the host awaits the first. Both plugins load an
in-memory mirror on `publish.before`, behind a 10-second floor — because
`publish.before` fires **per page**, not per publish.

**4. Manifest details that are a 400 with an unhelpful message.** `keywords`
must match `^[A-Za-z0-9_-]{1,30}$` (a space is fatal, and the error names only
the pattern). `contentAccess[]` uses `table`, not `tableSlug`. Resource fields
are `text|longtext|number|date|boolean` and `validatePluginRecordData` silently
**drops any key not declared**.

Both ship an admin page (`kind: 'app'`, requiring `editor.code` +
`admin.navigation`), no build step, `usePluginRoutes()` over their own server
routes — and both expose `POST /bulk`, dry-run by default, with `{title}`,
`{slug}`, `{url}`, `{description}` interpolated per page. That is the "massive
changes at scale" surface; eighty pages is past where clicking is a plan.

Verified in the admin UI under CDP: both nav items mount, both lists load all 80
pages, and the AEO bulk preview returned a real interpolated plan for 43
articles with no console errors.

### Schema that was written, and schema that was deliberately refused

`push-aeo-content.mjs` adds the two block kinds no generator can produce,
through the plugin's own `POST /entry` route:

- **FAQPage on `/dental-implant-faq`** — the twelve real `<details><summary>`
  pairs, read out of the PUBLISHED page. Google requires FAQ markup to mirror
  visible content, so the script refuses if fewer than four pairs are found: a
  page restructure becomes a failure rather than stale markup.
- **MedicalWebPage on 11 treatment pages**, each `about` a named
  `MedicalProcedure` (Surgical for the implant / denture / surgery pages,
  Noninvasive for the rest), `specialty: Prosthodontics`. Curated, not matched
  by prefix — `/dental-conditions` is conditions and `/financing` is not a
  procedure.

**Refused on purpose, and this is the part worth keeping:** the bulk API can put
an FAQPage on all 43 articles in one call, article title as the question and meta
description as the answer. That is thin markup mirroring nothing visible on the
page — the pattern Google names as a reason to distrust a site's structured data.
Same for `aggregateRating`. The capability is there; using it that way would be a
mistake, and a future session should not read the empty coverage number as a gap
to fill.

Live after the second publish: `/dental-implant-faq` carries Dentist, WebPage,
BreadcrumbList, FAQPage(12); `/all-on-4` carries Dentist, WebPage,
BreadcrumbList, MedicalWebPage. `verify-seo-plugins.mjs` re-run: 1511/1511.
### Still open on the board

- **#21 / #22 / #23** are in *doing* with stale comments; the work has been live
  since session 19. Someone should close them.
- **#13 / #24 / #25** are in *todo* but done and verified since session 20.
- **AEO `sameAs` is empty** and there is no `aggregateRating`. Both need facts
  nobody has yet — Google Business Profile / Facebook / Yelp URLs, and a review
  count the site actually displays. Do not invent either.
- The pages have never been through **Google's Rich Results Test**. The graph is
  asserted to parse and to carry the right nodes; only Google can say whether it
  earns a rich result.
