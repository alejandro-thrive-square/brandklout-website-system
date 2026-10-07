# SEO & AEO

The standard every Brandklout site follows to rank in Google and be named in AI answers (ChatGPT,
Perplexity, Google AI Overviews), and the scripts that measure and gate it. Written 2026-10-07 from
the Dr. Nahlah analysis and the review with Trong Huynh (DriveRank, SEO/AEO). Run it as
[Scenario 7](../../scenario-7-seo-aeo/README.md) on a live site; Scenario 0 applies the same rules to
a new build.

The Nahlah evidence in one line: the site ranked #1 for "prosthodontist" in both its cities and was
absent from the top 7–9 results for every implant, All-on-4, denture, veneer and full-mouth search,
while its schema was already twice the size of the example it was compared with. Rankings follow
keyword targeting, office-city pages and content depth, not schema length.

## The standard

| # | Rule | Gate |
| :- | :--- | :--- |
| 1 | **Keyword map before copy.** Every indexable page has one row: one primary keyword, no two pages sharing one, legal and utility pages listed as `exempt`. Pages to build are `planned`. The team agrees the map before any copy changes. | `keyword-gate.mjs` (map, cover) |
| 2 | **One H1, with the keyword.** Exactly one H1 per page, containing the primary keyword, plus the city when the search is local. The designed headline stays: the H1 is set small as an eyebrow above it, and the headline becomes a styled paragraph. | `keyword-gate.mjs` (h1); on Instatic written by [`instatic-site/seo/push-keyword-h1.mjs`](../instatic-site/seo/README.md#the-keyword-h1), proven by `hero-look.mjs` |
| 3 | **Title:** keyword first, then the place, brand last, 60 characters or fewer. | `keyword-gate.mjs` (title) |
| 4 | **Meta description:** 140–155 characters (the gate allows 120–160) with the keyword, one proof point, the city and a call to action. | `keyword-gate.mjs` (desc) |
| 5 | **Alt text:** what the photo truly shows first, then the treatment and place where true; 125 characters or fewer; `alt=""` on decoration; never a keyword list. File names carry the keyword too (Instatic skips an upload whose name it has, so a renamed image is a new upload). | `keyword-gate.mjs` (alt: presence only) |
| 6 | **Schema for AI answers.** Built from each page's visible content (the `aeo-schema` plugin, [its README](../instatic-plugins/aeo-schema/README.md)). On top: a **visible local FAQ** on the home page and every office page (what the specialty is, cost in the city, where the office is, sedation, first visit), each answer naming the office, city and phone, mirrored by a FAQPage; `areaServed` lists the nearby towns from the keyword map; each office is a department whose `url` is its office page; credentials, awards and memberships only when the practice documents them; no self-published review stars (Google ignores them for local businesses). On Instatic the blocks are built and shipped by [`instatic-site/seo/`](../instatic-site/seo/README.md) (scan → facts → build → push → verify). | `keyword-gate.mjs` (faq), `instatic-site/gates/seo-head-check.mjs`, `instatic-site/seo/verify-schema.mjs` + `vocab-check.mjs` |
| 7 | **One domain; a page per office.** Never a second website per office: Google indexes one copy and the backlinks split. Each office gets a full office page (below) and, for the money services, its own version of the service page, **written separately**. Towns without an office are named on the nearest office page, not given pages of their own. | `page-overlap.mjs` (≤25% shared) |
| 8 | **Depth where it pays.** Fill the gaps competitors rank with (missing services, cost pages, comparisons, explainers) and deepen the money pages toward what wins (2,100–3,500 words on Nahlah's searches). Every claim, price and credential confirmed by the practice ([Scenario 0 step 02](../../scenario-0-new-site/02-research-sitemap/02-research-sitemap.md)). | the practice's sign-off |
| 9 | **Measure.** A baseline before anything changes, then monthly: the same rank-check file, Search Console clicks, tracked calls per office. | the monthly snapshot exists |

### An office page holds

The office's own name, address, phone, hours, map and parking; directions from local landmarks and
roads; photos of that office (never the other office's building); who the patient sees there and
which days; the services offered there, each a short summary linking to its page; reviews from that
office's Google Business Profile; financing in brief; the towns served from it; a local FAQ with its
FAQPage. Its schema department `url` points at it, and so does its Google Business Profile's website
link.

## Scripts

All read the served HTML of the sitemap pages (indexes followed; with no sitemap, the home page and
its links), need no login and no dependencies. **Redirect output to a file**: Node fetch scripts can
die on a pipe on Windows.

| Script | What it does | Exit |
| :--- | :--- | :--- |
| [`site-audit.mjs`](./site-audit.mjs) | Per page: title/description length, H1s, JSON-LD size, nodes and FAQ questions (and whether each is visible), images without alt, body words, place mentions beyond the site-wide blocks. The baseline. | always 0 |
| [`keyword-gate.mjs`](./keyword-gate.mjs) | The live site against its keyword map: rules 1–6. | 1 on FAIL |
| [`page-overlap.mjs`](./page-overlap.mjs) | Shared body text between page pairs (5-word shingles). Office twins must stay ≤25%. | 1 on FAIL |
| [`autocomplete.mjs`](./autocomplete.mjs) | Google Autocomplete for every service × place: `AC` (Google suggests it) and `+N` (N longer variations). The keyless demand signal. | 0 |
| [`serp-instruction.mjs`](./serp-instruction.mjs) | The Codex instruction for a location-set Google rank check (map pack, organic order, advertisers), for [`codex_cu.mjs`](../codex-computer-use/README.md). ≤15 searches a run. | 0 |
| [`keyword-map.template.csv`](./keyword-map.template.csv) | The map's columns: `path, primary_keyword, secondary_keywords, group, intent, office, status, volume, volume_source, priority, notes, h1`. `status` = target \| planned \| exempt; `secondary_keywords` separated by `\|`; `h1` (optional) = the keyword H1 as it should read, containing the primary keyword (what `push-keyword-h1.mjs` writes; a search phrase is not a heading, so nothing derives it). | |
| [`../instatic-site/seo/`](../instatic-site/seo/README.md) | The Instatic writers of rules 2 and 6: the content-built schema chain (`scan-sections`, `fetch-facts`, `build-schema`, `vocab-check`, `push-schema`, `verify-schema`, `plugin-stores`) and the keyword H1 (`push-keyword-h1`, gate `hero-look`, `hero-shot`), per-client config in the step output. They live with the Instatic toolkit because they write its plugin store and page nodes. | 1 on FAIL (gates) |

```bash
T=deliver/process/tools/seo-aeo        # or tools/seo-aeo in a client folder
node $T/site-audit.mjs https://www.client.com --places "McLean,Tysons,Alexandria" --out output/site-audit.json > output/site-audit.md
node $T/autocomplete.mjs --seeds "dental implants,all on 4" --places "mclean va,alexandria va" --suffixes "cost,near me" > output/autocomplete.tsv
node $T/serp-instruction.mjs --queries output/serp-queries.txt > output/serp-instruction.txt
node $T/keyword-gate.mjs https://www.client.com --map output/keyword-map.csv > output/keyword-gate.log
node $T/page-overlap.mjs --pair https://www.client.com/mclean/dental-implants https://www.client.com/alexandria/dental-implants > output/overlap.log
```

"Contains the keyword" means every meaningful word of it is present in any order: case,
punctuation, plurals and VA/Virginia are ignored, and in/near/me/best/the… are not required. So
"All-on-4 Dental Implants in McLean & Alexandria, VA" contains both "all on 4 dental implants mclean
va" and "dental implants alexandria va".

## Where the numbers come from

- **Search volume:** none of our keys gives it today. The shared `AHREFS_API_KEY` is an Ahrefs trial
  with 0 units: every v3 data endpoint answers 403 "Insufficient plan". Use, in order of preference,
  Keyword Planner in the client's Google Ads account (most clients already bid on these terms), DriveRank's
  tools through Trong, or a paid Ahrefs plan. Record the source in the map's `volume_source`.
- **Rankings:** Google with the searcher's location set (`serp-instruction.mjs` → Codex). Bing,
  DuckDuckGo and headless Google return bot pages or nothing useful.
- **Demand without volumes:** `autocomplete.mjs`.
- **Competitors:** their sitemaps and pages fetched directly; `page-overlap.mjs` across their office
  pages shows how they avoid duplication. Some (ClearChoice, Nuvia) block scripts: read them through Codex.

### The thresholds' evidence (Dr. Nahlah, 2026-10-07)

| Pattern seen | Shared text | Ranked? |
| :--- | :--- | :--- |
| Same two cities, one domain, every service page written per office (dentalcareofalexandriaandmclean.com) | 5.5% | Yes, in both cities |
| A DC prosthodontist's McLean/Arlington/Vienna pages, long and unique (eliteprostheticdentistry.com) | 12–26% | #5 in McLean |
| Service × town pages with the town name swapped (sculptperio.com) | 95% | Only long-tail full-mouth searches |
| A separate website per office (mcleandentalcare.com / siranlidental.com) | 69% across domains | The McLean site, a single-office domain from 2003 |
| Our two contact pages, McLean and Alexandria | 98% | Neither ranks for a city search |

Competitor figures come from the 2026-10-07 research script (the same 5-word shingles).
`page-overlap.mjs` reads our contact pair at 98% where that script said 92.5%, so read them as ±5 points.

## Gotchas

- **Google blocks after ~16 automated searches from one IP** (CAPTCHA, then a 403 on the next batch).
  Codex is told never to solve a CAPTCHA; split long query files and space the runs.
- **A JSON-LD copied out of Microsoft Teams does not parse:** Teams turns the closing quote of
  link-like URLs into `%22`. Take an example schema from the live page instead.
- **Raw HTML is right for Instatic and Webflow, wrong for a WordPress clone** whose `<head>` is
  replayed after parse: check those heads with `seo-head-check.mjs --render`.
- **Place counts include site-wide blocks** that are not in `<header>`/`<nav>`/`<footer>` (address
  bars, CTA bands); `site-audit.mjs` subtracts the lowest count across pages as that boilerplate.
- **Git Bash rewrites a bare `/path` argument** into a Windows path; `--page` undoes it.

## Origin

`bk-dr-nahlah`, 2026-10-07: the plan doc *Dr. Nahlah — SEO & AEO Plan*, the client runbook
`docs/runbook/2026-10-07-seo-aeo-plan-doc.md`, and the evidence in
`workflows/06-content-seo/.tmp/2026-10-07-seo-aeo-research/` on that branch (`node scripts/client.mjs`
reads it from main). The content-built schema chain (scan → facts → build → push → verify) and the
keyword H1 (`push-keyword-h1.mjs`, gate `hero-look.mjs`) from `bk-dr-nahlah`
`workflows/22-instatic-api-sync/seo-v3/` were promoted the same day, generalised (every Nahlah
constant moved into a per-client `seo-config.json`; the H1 text into this map's `h1` column), to
[`../instatic-site/seo/`](../instatic-site/seo/README.md); what stayed client-side and why is listed
there.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
