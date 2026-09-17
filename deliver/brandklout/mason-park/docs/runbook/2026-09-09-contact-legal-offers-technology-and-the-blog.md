# 2026-09-09 — Contact, Terms, Offers, Technology, and the whole blog

The treatment catalogue finished earlier today (batches
[1](./2026-09-09-treatment-pages-batch-1-restorative-and-surgery.md)–[5](./2026-09-09-treatment-pages-batch-5-all-31-complete.md)).
This run is the non-service pages the client asked for next, plus the blog migration.

## Done

**The site is 213 pages.** Four hand-authored pages, one paginated blog index (7 pages) and
161 generated article pages.

| Page | Source |
| :--- | :--- |
| `/contacts/` | `contacts` |
| `/special-offers/` | `special-offers` |
| `/technology/` | `technology` + `pearl-ai` + `ceramillmotion3` + `technology-ai`, merged |
| `/terms-of-service/` | `terms-of-service` |
| `/blog/` + `/blog/page/2..7/` | generated |
| `/blog/<slug>/` × 161 | generated |

### New tooling

- **`.tmp/stamp-page.mjs`** — `stamp-service.mjs` generalised to any depth. `spec.path` is the
  folder under `home/`, and the chrome's `../../` asset prefix is rewritten to the depth that
  folder actually sits at. Without this a page at `home/<slug>/` loads no stylesheet at all and
  reports no error. Also takes an optional `spec.parent` for the middle breadcrumb.
- **`.tmp/extract-posts.mjs`** — turns the scrape into `blog/posts.json` (+ `--bodies`).
- **`.tmp/build-blog.mjs`** — generates the index pages and all 161 articles.
- **`.tmp/blog-to-cms.mjs`** — writes `blog/cms-rows.json`, the Instatic CMS payload. **It does
  not upload.**

## The blog

**161 posts, 204,792 words.** That volume cannot pass through a model's context and does not
need to: every field is already structured in the scrape.

- **The classifier is the JSON-LD, not a heuristic.** A page is a post if its Yoast `@graph`
  contains a `BlogPosting` node. No slug patterns, no word-count guesses. 161 found, 91 pages
  correctly skipped.
- **Categories are near-useless and are not used as-is.** 79 of the 161 sit in `dental-care`
  AND `dental-hygiene` AND `family-dentistry` AND `oral-health` simultaneously — four labels
  meaning "a dental post". Only `invisalign` (11) and the implant categories (7) separate
  anything, so the rest read as General.
- **Bodies come from `rendered.txt`, not `rendered.html`.** The HTML is a whole WordPress theme
  and lifting a content container out of it drags in share widgets, related-post rails and the
  author box. The text file is already the article; the trailing boilerplate is bounded by five
  stable markers.
- **Generated pages are NOT hand-editable.** `home/blog/**` is output. Editing an article page
  by hand is overwritten on the next `build-blog.mjs`. The source is `posts.json` + `bodies/`.

## Gotchas

> [!IMPORTANT]
> **`/privacy-policy` does not exist and I did not write one.** The page the old site has at
> `/terms-of-service` is a **Terms of Service**, and that is what was built. Its sections 17 and
> 18 both reference "our Privacy Policy and Cookie Policy" — **neither was captured; the crawl
> got a 403 on `/privacy-policy`.**
>
> A privacy policy is a regulated document (HIPAA, Texas law, A2P 10DLC consent) and is not
> something to draft from a template. **Ask the practice for the existing Privacy Policy and
> Cookie Policy.** Until they arrive, the Terms page references two documents that do not exist
> at this site, which is itself a compliance gap worth telling them about.

- **161 cards in one column is 43,744px on a phone** — 51 screens, against a standing client
  note that users do not scroll a page that long. The index is paginated at 24 per page (7
  pages, 10,313px mobile). **Page 1 stays at `/blog/`** so the canonical blog URL never moves.
- **The posts' hero images are still on the WordPress host and are deliberately NOT used.**
  Referencing them would make the new site depend on the site it replaces. Every card and
  article opens on the practice's own photography, chosen by topic. The originals are kept in
  `posts.json` as `heroImage` and in the CMS rows as `legacyHeroUrl` — **migrating those 161
  images into `uploads/` is its own job** and would improve the blog considerably.
- **`stamp-page.mjs`'s breadcrumb check compares the ESCAPED crumb.** Two blog titles contain
  `&`, which the body writes as `&amp;`; the check was reporting a mismatch that was only an
  encoding difference.
- **One post has no `datePublished`** (`eat-remove-smile-why-removable-teeth-aligners-are-so-popular`)
  and sorts last, not first — `String(null)` sorts above every real date and it briefly led the
  blog. Worth asking the practice for the real date.
- **The blog grid's breakpoints are in max-desc order on purpose.** Process 22 records a case
  where custom conditions emitted in array order flattened a blog grid from three columns to two
  on a live Instatic site. Do not reorder those two media queries.

## Next

1. **The CMS upload.** `blog/cms-rows.json` is written (161 rows, 1.53 MB) and is **not**
   uploaded. Instatic's `PATCH .../data/rows/:id` replaces `cells` wholesale and answers 200 on
   a partial patch that silently deletes the body — read, merge, write whole, read back. Run
   `backup-site.mjs` first. Then a template page bound to the row, and a collection page.
2. **Publish.** Instatic still holds the eleven-page site. The gap is now 202 pages.
3. Remaining old pages: Appointment, Virtual Consultation, the Patient Resources hub and its
   four pages, FAQs, sitemap, town resource.

## Version Control

Runbooks are tracked. This file and its `INDEX.md` row are committed with the run.
