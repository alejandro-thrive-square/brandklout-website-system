# 2026-10-06c — Footer "Find Us Online": per-office Facebook, Google and Yelp. PUBLISHED on production and staging

Asana `1219087019480243`, "Add Social Media profiles to website". On 2026-10-05 the task carried no
links and that run found six by search. The task description now holds the links the practice
supplied, one set per office, and the user asked to correct the footer to them and push to
production "without breaking anything".

## The links (source of truth: `22-instatic-api-sync/footer-reviews-links.mjs`)

| Office | Facebook | Google | Yelp |
| :--- | :--- | :--- | :--- |
| McLean | `facebook.com/drnahlahprosthodontist/reviews` | `g.page/r/CSj2i2dK5ibmEAE/review` | `yelp.com/biz/nahlah-implants-and-prosthodontics-specialists-mclean-3` |
| Alexandria | `facebook.com/DrNahlahAlexandria/reviews` | `g.page/r/CbIvIUIh1cfREAE/review` | `yelp.com/biz/dr-nahlah-alexandria-2` |

- These **replace** the two guessed links of 2026-10-05 (one Facebook page, the McLean Google
  Maps profile). **Instagram, RealSelf, Vitals and Healthgrades were kept** below them: the task
  does not list them, and the user said "add". Ask before removing; it is one constant
  (`OTHERS`) and a re-run.
- The McLean Yelp link was supplied with `?osq=…` (a search-origin parameter); it is the same
  business page without it and is published without it.

## What the footer shows now (column 1, every site page; ads pages still have none)

```
FIND US ONLINE
McLean
Facebook  Google  Yelp
Alexandria
Facebook  Google  Yelp
Instagram  RealSelf  Vitals  Healthgrades
```

- Office list = the footer's own facts list (`ul.foot-facts`; `ul.footer_facts` on staging), one
  `li` per office: `<b>` label then three links. **No class, no CSS added**; inline only:
  `li {display:flex; flex-wrap:wrap; column-gap:1.25rem; row-gap:.3rem}`, `b {width:100%}`,
  list `row-gap:.9rem`. The kept list went from a 3-column `max-content` grid to
  `display:flex; flex-wrap:wrap` with `margin-top:1rem`.
- Why stacked and wrap-safe: the first footer column is **189–201px wide between 720 and 760**
  (four-column grid starts at 720). A label + three links on one line needs ~280px.
- Links open in a new tab; `aria-label` "Dr. Nahlah McLean on Facebook (opens in a new tab)".

## How
- `push-footer-reviews.mjs` (plan → `--apply` → `--publish`), from either starting state: it edits
  the 2026-10-05 row where it exists (production: +13 nodes, −4) and creates the whole block where
  it never landed (staging: +23). Class ids are resolved per host through
  `class-standard/class-map.json`, so the one script serves the old names (production) and the
  Client-First names (staging).
- **Staging first** (rehearsal, published 15:03:46Z), then **production** (published 15:09:58Z).
  40 rows each (every row with the site footer grid, the `post` template included, so the 43
  Journal posts are covered); 19 ads rows skipped.
- Before production: `backup-site.mjs` → `22-instatic-api-sync/.tmp/backups/footer-reviews-prod-2026-10-06/`
  (shell seq 341, 59 rows + published HTML), head snapshot of all 100 URLs, both SEO gates.
- Site source: `04-design/.tmp/site-src/partials/footer.html` carries the same block;
  `final-site/` rebuilt (56/56).

## Verified (production unless noted)
| Check | Result |
| :--- | :--- |
| Read-back before publish | 40 pages: only the planned nodes differ; every other node and every cell identical (`seoTitle`/`seoDescription` on all 40, template flags on `post`/`404`); shell identical |
| Publish guard | no row moved since the apply, no new row, shell unchanged |
| `verify-footer-reviews.mjs` | **100 URLs: 81 site pages with the block** (6 office links at the exact URLs, 4 kept, both superseded links gone, one `rel` each, 28 footer links), **19 ads pages without**. Staging: same, 100/100 |
| Layout, scripts on, `/about` + `/posts` at 1440 / 760 / 390 | nothing sticks out of the column, no horizontal overflow (also prototyped at 1920, 1100, 1024, 900, 720, 600, 320 before writing) |
| Head parity before → after (title, every meta, canonical, JSON-LD) | **0 of 100 URLs differ** |
| `seo-v2/verify-seo-v2.mjs`, `seo-v3/verify-seo-v3.mjs` | ALL CLEAN / SEO v3 CLEAN, before and after |
| `check-pool-scope.mjs` (call-tracking pools) | 99 URLs, 0 failing |
| The six links | Both Google links resolve to the right place (McLean's is the known Jones Branch place id `0xe626e64a678bf628`). **Facebook answers 400 and Yelp 403 to a script** (bot walls): open those four in a browser once. |

## Next
- Confirm with the user whether Instagram / RealSelf / Vitals / Healthgrades stay.
- The live structured data `sameAs` lists the McLean Facebook page, Instagram and the McLean
  Google profile on the Dentist, and Healthgrades, Vitals and RealSelf on the Person. It has
  **neither Yelp page, nor the Alexandria Facebook page or Google profile**. Not changed here:
  schema edits go through seo-v3 (rebuild, push, publish).
- Asana: the task is open; no comment was posted from this run.
- Staging and production now show the same footer block. Staging keeps the Client-First class
  names; production the old ones until it migrates (2026-10-06b).

## Gotchas
- **Importing a push script to reuse its constants runs it.** The first verifier imported
  `OFFICES` from `push-footer-reviews.mjs`, which ran a plan and exited before any check. Shared
  data lives in `footer-reviews-links.mjs`.
- Element screenshots of the footer need scripts off (ScrollSmoother's fixed viewport returns the
  hero); measure with scripts on, photograph with scripts off.
- A `max-content` grid in a footer column cannot wrap. Use flex + wrap for link rows in this
  footer; test 720–800, where the first column is narrowest.
- The shared client (main `9aaea03b`) now restores `seoTitle`/`seoDescription` after every page
  save by itself ("restored page cells…" in the log); the script's own restore found nothing left
  to do. Nested-slug pages are refused by it: the ads pages are not written here.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Committed on
`bk-dr-nahlah` only.
