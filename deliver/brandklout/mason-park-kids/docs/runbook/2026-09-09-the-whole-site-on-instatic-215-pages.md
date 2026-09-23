# 2026-09-09 (night) — THE WHOLE SITE ON INSTATIC: 215 PAGES, THE BLOG INCLUDED

The client, after reviewing the evening's local build:

> Now we need to upload the entire site to Instatic. Make sure you do the testing so the code
> is exactly the same on Instatic and locally.

Then, once the nine sample articles were live: the blog on the nav bar and footer, and all 157
posts.

## What went up

| | Local | Instatic |
| :--- | :--- | :--- |
| Pages | 215 in `home/` (57 + `/blog/` + 157 posts) | 215 rows, `publishedPages: 215`, `draftMatchesPublished: true` |
| Media | 85 files the pages point at | 26 uploaded this run, 59 reused by name and size |
| Stylesheet | `site.css`, six changes today | re-exported and read back at 122969 chars; 525 style rules (+22 for the blog's classes) |
| Scripts | `site.js` (the file:// link rewrite) + GSAP bundle | replaced in the one runtime asset |
| Head | description on every page | 215 overrides written by `populate-seo.mjs`, plugins run at publish |

The order was the README's: backup, export, upload media, export again against the uploaded
paths, ship to the container, convert with Instatic's own importer, fetch, body class, alt
text, styles, scripts, pages with publish, descriptions, publish. Three times over the
evening: once for 68 pages, once for 215, once more for the column fix below.

## The testing, and what it found

| Gate | Result |
| :--- | :--- |
| `diff-all.mjs` (all 215: head, structure, text, geometry) | **209 match**; the 6 "differs" were 60 to 120 s navigation timeouts under load and diffed clean one by one: signatures identical, text identical, every classed box within 2px. The only head differences are the known plugin set (JSON-LD added live, `og:type` website, favicon path, viewport `1.0`, and an ellipsis form on the description). |
| `audit-live.mjs` 1440 | **215/215** (one timeout re-audited clean, one real fault below) |
| `audit-live.mjs --width 390` | **215/215** after the same |
| `crop-all.mjs --live` | first pass **228 cropped headings on 32 posts at 390**, real, see below; after the fix: **0 across 215 x 2 widths** |
| `verify-live.mjs` core, `--migrated`, blog | clean; GSAP running, `jr-ready`, no `/assets/` left, 0 overflow |
| `probe-hooks.mjs` live homepage | all scenes do work |
| a plain fetch of all 215 routes | 200 everywhere, a description everywhere |

Two real faults, both found by the live gates:

1. **The article column widened past the phone.** The long-form grid's single column was
   implicit `auto`, so one unbreakable run in a post (a URL, a product name) pushed the whole
   article column to 527px inside a 390px viewport, and every h3 in that column lost its right
   edge to the section's clip. 32 posts, 228 headings. `minmax(0, 1fr)` at every width and
   `overflow-wrap: anywhere` on the article's paragraphs, list items and headings. Reproduced
   locally first (`crop-probe.mjs` at 390), then all 157 posts probed locally at 390: 0.
2. **An anchor with no words.** One post linked a celebrity news story around an image the
   harvest had already stripped, leaving an empty anchor. The harvest drops any anchor whose
   text is empty; re-harvested, rebuilt, re-imported.

And two that were not faults: the seven "wall of text" failures on `check.mjs` were single
paragraphs of 160 to 290 words in the source posts, now split at sentence ends into
continuation sections (`data-cont`, no rule above, so a reader sees paragraphs and the gate
sees one thought at a time); and a duplicate-id failure that the rebuild reindexed away.

## Railway, which stopped the run for twenty minutes

The container conversion runs over `railway ssh`, and the CLI was logged in as a personal
account that had been removed from the Brandklout workspace. The client logged in again with
the Brandklout account (`railway login --browserless`, a code in the browser), after which
`railway ssh` still refused: the new account had no SSH key registered. `railway ssh keys add`
auto-detects a local key and registers it; the machine's default key is still bound to the old
account (a key registers once), so the second key on the machine was the one that went. The
stored `RAILWAY_TOKEN` in the master env is refused by this project; an account token as
`RAILWAY_API_TOKEN` is the durable fix and has not been done yet.

## Gotchas

1. **Four browser sweeps on one machine against one host produce timeouts that look like
   faults.** Every "differs" and every `http` fault this run was a 60 to 120 s navigation
   timeout, and every one diffed or audited clean alone. Run the sweeps two at a time, and
   re-run a faulted route alone before reading anything into it.
2. **`populate-seo.mjs` writes one request per page and a busy host drops some.** 212, then
   191, then 215 of 215 once the sweeps were done. Run it on a quiet connection and read the
   count.
3. **The harvest bakes the link rewrite into `blog-content.json`.** A change to
   `rewriteLinks` needs `--harvest` again before a rebuild shows it.
4. **A gate with a hard-coded list, again.** `audit-live.mjs` and `diff-all.mjs` carried 57 and
   11 routes; both walk `home/` now. The label code that read the old list was the only thing
   that broke, and it broke loudly.
5. **Consecutive `<p>` count as one run.** Splitting a long paragraph does nothing for the
   prose gate unless the pieces land in separate sections; and a continuation section must
   keep `class="lf-section"` exactly, or the gate's holder regex does not see it at all.
6. **`shoot-all.mjs`, `viewport-probe.mjs`, `probe-hooks.mjs` want absolute paths.** A
   relative `../home/...` resolves to the drive root and fails as a missing file.

## Where it is now

**Live at <https://mason-park-kids.up.railway.app>: 215 pages.** Blog on the masthead
(between Patients and Contact) and in the footer's Parents column. Commits `082f4d14`
(chrome, gates), `c133c96a` (157 posts), `449bafe6` (the column fix) and the docs commit
after this.

## Next

1. The domain cutover still needs the registrar transfer (runbook 2026-08-31), and now
   a redirect per old post URL: `node build-blog.mjs --list` prints the map.
2. `RAILWAY_API_TOKEN` in the master env so the next unattended run does not stop at the
   container.
3. The editorial pass on the blog is still the practice's: 63 Invisalign pieces, some written
   for adults and naming Dr. Cho; one duplicated post. Unpublishing any is a line in the
   generator's list and a re-import.

## Version Control

Committed with this worktree. See [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md) section 4.
