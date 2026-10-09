# tools/instatic-site/seo

The Instatic half of the [SEO & AEO standard](../../seo-aeo/README.md): structured data built from
what each page shows (standard rule 6), and the keyword H1 above the designed headline (rule 2).
Run from [Scenario 7 step 02](../../../scenario-7-seo-aeo/02-on-page/02-on-page.md) on a live site,
or from Scenario 0 step 05 on a new build. Promoted 2026-10-07 from Dr. Nahlah's SEO v3
(`bk-dr-nahlah` `workflows/22-instatic-api-sync/seo-v3/`), generalised: every Nahlah constant moved
into a per-client config, and the build is proven to reproduce Nahlah's live graph from it
([Evidence](#evidence-dr-nahlah-2026-10-07)).

**Why here and not in `tools/seo-aeo/`:** these scripts write the `brandklout.aeo-schema` plugin store
and Instatic page nodes and registry rules through the admin client, with this toolkit's
`../lib/site.mjs` (the env guard), `../lib/staging-guard.mjs` and `../lib/browser.mjs`. `seo-aeo` stays
platform-neutral (it also serves the Webflow sites of Scenario 6). The two scripts here that read the
keyword map import `../../seo-aeo/lib.mjs`, so this toolkit's `toolkit.json` requires `seo-aeo`.

## The chain

Run from the client's step folder (`deliver/brandklout/<client>/scenario-7-seo-aeo/02-on-page/`).
Every script reads `output/seo-config.json` (`--config` to override) and writes to `output/schema/`
(`--out`). Credentials: the worktree `.env` (never hand-edited). Redirect output to a file: a Node
fetch script can die on a pipe on Windows.

```bash
S=../../tools/instatic-site/seo
node $S/scan-sections.mjs > output/scan.log                 # 1 the visible content → output/schema/sections.json
node $S/fetch-facts.mjs > output/facts.log                  # 2 films (Vimeo/YouTube) + Wikipedia/Wikidata → facts.json
node $S/build-schema.mjs > output/build.log                 # 3 → organization.json, blocks.json, sections-used.txt
node $S/vocab-check.mjs > output/vocab.log                  #   schema.org vocabulary gate: VOCAB CLEAN
INSTATIC_BASE_URL=https://staging.<domain> node $S/push-schema.mjs > output/push-plan-staging.log    # 4 plan: what differs
INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node $S/push-schema.mjs --apply
INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node $S/push-schema.mjs --publish
node $S/verify-schema.mjs https://staging.<domain> > output/verify-staging.log                     # 5 SCHEMA CLEAN
# then production: the same push with --allow-production (on purpose), publish, verify-schema.mjs
```

After a schema push to production, copy the stores to staging so a later promotion does not revert
them: `plugin-stores.mjs export` on production, then `diff` / `import --apply` on staging.
**Rescan, rebuild, push, verify after any copy change**: the graph repeats the page.

## Scripts

| Script | What it does | Writes to an instance |
| :--- | :--- | :--- |
| [`scan-sections.mjs`](./scan-sections.mjs) | Every sitemap URL (a host without one, like staging, at production's paths): title, meta description, words, the visible breadcrumb, every `<section>` as `{ h1?, headline?, h2, lead[], items[{h3,text[]}], qa[{q,a}], images[], videos[], quotes?, table? }`; articles split at their h2s; `--also /a,/b` adds pages no sitemap lists yet (pages built on staging first) | no (public GETs) |
| [`fetch-facts.mjs`](./fetch-facts.mjs) | Each embedded film's name, description, duration, date, thumbnail (Vimeo with the `VIMEO` team token; YouTube watch page); each `wiki` topic's Wikipedia URL and Wikidata item. Exit 1 when a film or a topic did not resolve (drop a topic Wikipedia has no article for) | no |
| [`build-schema.mjs`](./build-schema.mjs) + [`lib/schema-build.mjs`](./lib/schema-build.mjs) | The blocks: base layer + treatment + FAQPage + the config's ops per page, breadcrumbs that repeat the visible trail, articles, organization. Stops on a renamed heading or stale stated fact | no (reads the stored blocks of pages the base does not cover) |
| [`vocab-check.mjs`](./vocab-check.mjs) | Types, property domains, ranges and enum values against schema.org's own vocabulary; `--live <origin>` checks every published graph | no |
| [`push-schema.mjs`](./push-schema.mjs) | Plan / `--apply` / `--publish` of organizationJson, `emitBreadcrumbs: false`, the site-wide block and every block whose graph differs (compared by content) | yes, with `--apply` / `--publish` |
| [`verify-schema.mjs`](./verify-schema.mjs) | The live gate: one graph, vocabulary clean, no forbidden wording or link arrows, breadcrumb = the visible trail (names and links), FAQ = the `?` accordions word for word, one VideoObject per embedded film, no dangling `@id` | no |
| [`plugin-stores.mjs`](./plugin-stores.mjs) | `export` / `diff` / `import [--apply]` of open-graph overrides, aeo blocks, organizationJson and `emit*` between two instances of a site | yes, with `import --apply` |
| [`push-keyword-h1.mjs`](./push-keyword-h1.mjs) | Plan / `--apply` / `--publish` / `--adopt` of the keyword H1 on every target page of the keyword map that needs one ([below](#the-keyword-h1)) | yes, with `--apply` / `--publish` |
| [`hero-look.mjs`](./hero-look.mjs) | `snapshot` before / `compare` after: the headline's computed style, box and `<em>` at 1440 and 390, exactly one H1 | no (headless Chrome) |
| [`hero-shot.mjs`](./hero-shot.mjs) | First-viewport screenshots, `/path@width` | no |
| [`seo-config.template.json`](./seo-config.template.json), [`seo-base.template.json`](./seo-base.template.json) | The two per-client files, filled in for an example practice | |

Every write needs `STAGING_HOST=<that exact host>` or `--allow-production` (staging first). Every
`--apply` backs up what it replaces to `output/schema/backups/` and reads everything back.

## The two client files

Both live in the client's step output, next to each other:
`scenario-7-seo-aeo/02-on-page/output/seo-config.json` and the file its `files.base` names
(`schema-base.json`).

### The base layer (`schema-base.json`)

The practice's **stated facts**, written once and never derived from page text: the organization
(type, name, addresses, phones, hours, departments per office, `areaServed`, logo), the site-wide
nodes (the lead doctor's compact `Person`), and per page the entity nodes the page is about (its
`WebPage` type, the `Service` and `MedicalProcedure`/`SurgicalProcedure` names, the doctor's full
`Person`, the home page's treatments `OfferCatalog`), plus per article the `BlogPosting` facts the page
does not show (original `datePublished`, author). Shape: `{ organization, sitewide: [], pages: { slug:
[nodes] }, posts: { "<keyPrefix><slug>": [nodes] } }`, every `@id` a full URL. Take the facts from the
client's `docs/facts.md`; a node whose `@id` matches one the plugin generates (`#webpage`, `#article`)
extends it. A scanned page with no base starts from its stored block (without the BreadcrumbList and
FAQPage this build rebuilds) or a bare `WebPage`.

### `seo-config.json`

| Key | Required | What it is |
| :--- | :--- | :--- |
| `site.origin` | yes | Production origin; every `@id` and URL in the graph uses it, also when scanning staging |
| `site.name` | yes | The practice name: `creditText` / `copyrightNotice` of case photographs |
| `site.language` | | `inLanguage`, default `en-US` |
| `ids` | `org` | Aliases for `@alias` references: `org` (the organization), and any other node (`person`, each office) |
| `files.base` | | The base layer, relative to the config file |
| `files.keywordMap` | | The keyword map (default `../../01-baseline-research/output/keyword-map.csv`) |
| `markup.breadcrumbClass` | | Class(es) of the visible breadcrumb `<div>` (default `breadcrumb_component`). List old and Client-First names while a site migrates |
| `markup.headlineAttr` | | The attribute marking the designed headline (default `data-split`) |
| `markup.quoteByClass` | | Class fragment of a quote's author line (default `pull-quote_author`) |
| `markup.articleRegionAttr`, `markup.articleEndClass` | | The collection body: `<div data-instatic-content-region>` up to `</article>`, cut at the first `<div class="…">` starting with one of the end classes (related-post rails) |
| `wiki` | | `{ key: "Wikipedia_title" }`: the concepts the graph names with `sameAs` |
| `rules.platformTextDrop` | | Regex: sentences of a film's platform description to leave out (client rules: a treatment the practice does not offer, numbers the site states differently). Default: URLs |
| `rules.platformTextStrip` | | Regex removed from the start of every film description (a channel banner) |
| `rules.graphForbidden`, `rules.graphForbiddenExcept` | | Regex the live gate fails on, and the phrase it is allowed in |
| `videos.about` | | `{ filmId: "/path#node" }` (YouTube ids as `yt:<id>`): what each film is about on the film pages |
| `videos.publisher` | | `{ vimeo, youtube }`: give the organization as `publisher` (default Vimeo yes, YouTube no: a third-party channel is not the practice) |
| `treatmentDefaults` | | Defaults for every page's `treatment` (e.g. `category`) |
| `faq.skip` | | Pages whose `?` accordions are not an FAQ (a call-to-action heading) |
| `breadcrumbs.skip`, `breadcrumbs.fallback` | | Pages with no breadcrumb (default `index`); `{ slug: [{name, href}] }` for a page that shows none |
| `articles` | | `prefix` (`posts/`), `keyPrefix` (aeo entry key, `posts:`), `blogPage` (gets `blogPost`), `crumb` (fallback trail), `headlineMax`, `topics` `[{ match, about, section }]` (first match wins), `mentions` `[[wikiKey, regex]]`, `faqMinQuestions` (3), `dropLines`, `trimTail` |
| `define` | | Named values reused as `{ "use": "name" }` |
| `organization` | | Ops on the organization (`"set": "org"` or an office `"@alias"`) |
| `pages` | | Per page slug: `treatment`, `faq`, `sections`, `ops` ([below](#the-mapping-language)) |
| `keywordH1` | | `heroClass` (default `section_page-hero`), `taglineClass` (`text-style-tagline`), `headlineAttr` (= `markup.headlineAttr`), `baseHeadingSelector` (`h1, h2, h3, h4`), `copyFromBase` (font family, weight, line-height, letter-spacing, colour), `taglineStyles` (label size, no max-width), `h1Attributes` (e.g. a reveal attribute), `nbsp`, and for `hero-look.mjs` `heroSelector` (else the hero class), `leadSelector` (`p[class*="lead"]`), `widths` (`[1440, 390]`) ([below](#the-keyword-h1)) |
| `verify.minUrls` | | The live gate fails below this many URLs (a gate that checked nothing must not say CLEAN) |

Keys starting with `//` are comments. Regexes are `"/pattern/flags"` or a bare pattern.

## The mapping language

Per page, in this order: the base, then `treatment`, then the FAQPage, then `ops`, then a
VideoObject for any embedded film the ops did not describe.

- **`treatment: { wiki: [keys], category }`** — the `#service` gets the hero's lead line as
  `description` and the meta description as `disambiguatingDescription`; the `#webpage` gets a `Thing`
  per wiki key in `about` and the designed headline as `alternativeHeadline`; the `#procedure` gets the
  lead line and the keys' Wikipedia/Wikidata `sameAs`. The Service never gets `sameAs`: the
  practice's service is not the encyclopedia concept.
- **`faq`** — `true` (default): a `#faq` FAQPage = the page's `?` accordions word for word; `false`;
  `"webpage"`: the questions go on the WebPage's `mainEntity` (a page that IS the FAQ).
- **`sections: { alias: "^Heading regex" }`** — matched against each section's h2 (or the hero's h1).
  A heading that no longer matches stops the build; `sections-used.txt` lists what the build reads.
- **`ops`**: `{ "set": "#service", "props": {…} }` (or `/path#node`, `@alias`; `"props": { "use":
  name }`), `{ "add": node | [nodes] }` (a node with an `@id` already in the page is replaced in place,
  and joins the WebPage's `hasPart` unless it is `#faq`/`#service`/`#procedure`), `{ "describeOffers":
  "@services", "from": "$cards.items", "prefixChars": 8, "description": "$cards.lead[0]" }` (each offer's
  description from the card whose name starts the same), `{ "pageSays": ["exact text"], "page"? }`
  (stops the build when a stated fact's source text is gone).

**Values.** A string is literal text unless it starts with `$` (write `$$` for a literal `$`). An array
of `$` paths is their texts joined. `{ "ref": "#id" | "/path#id" | "@alias" }` is `{ "@id": … }`;
`"@id"` keys take the same shorthand. `{ "thing": key | [keys], "name"? }` is a `Thing` with
Wikipedia/Wikidata `sameAs`; `{ "wikiSameAs": [keys] }` the URLs alone; `{ "use": name }` a
`define`; `{ "literal": … }` is copied unevaluated.

**Paths.** `$alias`, `$page:alias` (another page's alias), or the reserved heads `$intro` (the hero's
lead line), `$headline`, `$h1`, `$meta`, `$title`, `$videos`, `$images`, `$crumb`; `$.` is the current
element inside `each` / entries. Then `.h2 .lead .items .qa .images .videos .table .text .h3 .src …`,
`[n]` (negative from the end), `[a:b]`, `[?regex]` (first match, stops the build if none), `[??regex]`
(first match or nothing), `[~regex]` / `[!regex]` (keep / drop matches; tested on an item's h3, a
Q/A's question, an image's alt), and filters `|abs`, `|lower`. As text: an item reads `h3: text`, a
list its parts joined.

**Builders** (`{ "kind": … }`):

| kind | Builds |
| :--- | :--- |
| `list` | `ItemList` `#id`: `name`, `entries`, any extra property (`description`). No `about` (schema.org has none on ItemList) |
| `catalog` | `OfferCatalog` `#id` (default `options`) of `Offer → Service` with the org as provider |
| `howTo` | `HowTo` from a section: h2 = name, lead = description, each h3 + text = a step |
| `cases` | `ItemList #cases` of the section's images that have alt text, as `ImageObject`s captioned by their alt |
| `table` | `Table` from a section's `<table>`, one sentence per row |
| `conditions` | `MedicalCondition` per Q/A (`from`, `wiki: { question: key }`) |
| `video`, `videos`, `videoRef` | One film (`id`), every film on the page (`about`: a value or `"map"` = `videos.about`), a reference to one |
| `each` | One `node` per element of `from` (`skip`, `match` regex with `{1}` `{1\|lower}` `{1\|slug}` `{i}` in the template) |
| `pick` | The first `cases` entry whose key the `value` contains (or `/regex/`), else `default` |
| `imageByAlt`, `refs`, `concat`, `faq` | An image URL by alt prefix; references to a page's nodes of a type; flatten; the page's FAQ questions |

**Entries** (`list` / `catalog`): a path (strings become names; items `{name: h3, description: text}`;
Q/As `{name: q, description: a}`), a list of values, or `{ "from": path, "only": [names], "skip":
regex, "pill": [prefixes], "prefix": [per position], "at": { "2": {…} }, "map": {…}, …overrides }`.

Dr. Nahlah's mapping, written for the 2026-10-07 test (every v3 construct, 386 lines), is the worked
example; it belongs in that client's `scenario-7-seo-aeo/02-on-page/output/` when Nahlah runs Scenario 7.

## The keyword H1

`push-keyword-h1.mjs` takes its pages and text from the keyword map, never from the SEO title:

- **Scope:** `target` rows. A page whose served H1 is exactly one and contains the primary keyword
  (the `keyword-gate.mjs` test) is `ok`.
- **Text:** the map's optional **`h1` column**, the heading as it should read; it must contain the
  primary keyword. A row without one is listed as `NEEDS H1 TEXT`: a search phrase is not a heading.
  `keywordH1.nbsp` suffixes (`", VA"`) get a no-break space so "VA" never wraps alone.
- **Where:** the one node with a `keywordH1.heroClass` class and, inside it, the node with
  `keywordH1.headlineAttr`. A hero built another way, a nested slug (a page write would drop its SEO
  cells) and an article (its H1 is the template's) are listed for a hand edit, never guessed.
- **Look:** three ambient registry rules: `<hero> p[attr]` = `baseHeadingSelector`'s `copyFromBase`
  properties + `<hero> h1`; `<hero> p[attr] em` = `<hero> h1 em`; `<hero> h1.<tagline>` =
  `taglineStyles`. Only rules that select `h1` by element are carried over: `hero-look.mjs` is the
  proof that nothing else moved.

```bash
node $S/hero-look.mjs snapshot https://staging.<domain> > output/hero-before.log   # before
INSTATIC_BASE_URL=https://staging.<domain> node $S/push-keyword-h1.mjs > output/h1-plan-staging.log
INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node $S/push-keyword-h1.mjs --apply
INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node $S/push-keyword-h1.mjs --publish
node $S/hero-look.mjs compare https://staging.<domain> > output/hero-after.log      # HEADLINES IDENTICAL, ONE H1 EACH
node $S/hero-shot.mjs https://staging.<domain> output/assets/hero /about@1440 /about@390
```

`--apply` refuses while the draft already differs from live, while any page in scope cannot be
written (narrow with `--only /a,/b`), or when the shell moved since the plan. `--publish` refuses
unless no row moved and the shell is as `--apply` left it. `--adopt --only …` records the state when a
write landed but its read-back failed on something harmless.

## House rules

- A value is a page string or a fact the practice states (the base layer, or a literal in the config
  guarded by `pageSays`). Nothing is written for the schema.
- No `AggregateRating` or `Review` from on-site testimonials: Google ignores self-serving reviews on a
  LocalBusiness and treats them as a policy risk. Only a third-party source with a displayed count.
- A film platform's description is not the site's copy: `rules.platformTextDrop` filters it sentence
  by sentence, and a third-party channel's film carries no `publisher`.
- A copy change that renames a heading, moves a line a `[?…]` lookup needs or removes a stated fact's
  text stops the build; it never ships a stale value.
- The breadcrumb repeats the trail the page shows (`emitBreadcrumbs: false`); credentials, awards and
  memberships only as the practice documents them; a client rule (a treatment it does not offer)
  goes into `rules`, and the live gate holds it.

## Limitations (what is not generic)

- **Markup:** content in `<section>`s outside `<header>`/`<nav>`/`<footer>`; a section's heading is its
  first `<h2>` (the hero's `<h1>`); items are `<h3>` + `<p>`/`<li>` blocks; accordions are
  `<details><summary>` (or a `<button>` ending in `?` followed by its panel); the breadcrumb `<div>`
  holds `<a>`/`<span>` crumbs and no nested `<div>`. The scan and the gate read accordions the same way.
  A site built otherwise needs `lib/sections.mjs` extended, not a config value.
- **Films:** Vimeo ids from `player.vimeo.com/video/<id>`, `vimeo.com/<id>` and `data-vimeo*="<id>"`;
  YouTube from `/embed/<id>` and `data-yt="<id>"` (Dr. Nahlah's facade).
- **The mapping is per site.** Which section is a catalog, a timeline or a benefit list is copy
  structure, so each client writes its own `pages` entries: start from `seo-config.template.json`, run
  `build-schema.mjs` until it stops stopping, then `vocab-check.mjs`. A page without an entry still
  gets its FAQPage, a VideoObject per embedded film (`about` from `videos.about`, else the
  organization) and its breadcrumb.
- **Keyword H1:** only heroes built as one hero class + a designed headline node; only `h1`-selecting
  rules are carried to the `<p>`. Home pages and contact pages are often built otherwise (Nahlah's are).
- **Site-wide block:** the aeo entries route does not list `"*"`, so `push-schema.mjs` cannot compare
  it and writes it on every `--apply`.

## What stayed client-side, and why

In `bk-dr-nahlah` `workflows/22-instatic-api-sync/` (read with `node scripts/client.mjs`):

- `seo-v2/build-schema.mjs` — Nahlah's base layer generator: every value in it is a Nahlah constant
  (offices, hours, geo, credentials, treatment names, WordPress post dates). Its output is the
  practice's `schema-base.json`; a new client writes its base from `docs/facts.md` and the template.
- `seo-v2/push-seo-v2.mjs` — titles and descriptions into rows, Open Graph overrides and a
  site-specific `seo-head.js` trim (it checks for exactly 21 noindex paths). Titles and descriptions are
  standard rule 3–4 and Scenario 7 step 02 point 3 (`../ops/restore-page-seo-cells.mjs`); the head-script
  trim was one site's migration.
- `seo-v3/build-schema-v3.mjs` itself — replaced by `build-schema.mjs` + Nahlah's config. Its
  derivations that read like page parsing but are stated facts (lender terms, payment methods, office
  profiles and Google place ids, memberships, the study club) are literals in that config, each
  guarded by `pageSays`. Its lender `url` regex produced `"https://www.undefined"` once the financing
  copy stopped naming the lenders' domains; the generic build has no such derivation (see Evidence).
- `seo-v3/build-llms-txt.mjs`, `push-posts-v3.mjs`, `push-old-name.mjs`, `push-copy-fixes-v3.mjs`,
  `local-keyword-h1.mjs`, `sync-local-posts.mjs` and the `find-*`/`peek-*` probes — one-off fixes to
  Nahlah's copy, its posts or its local source, not process.

## Evidence (Dr. Nahlah, 2026-10-07)

All read-only; nothing was written to either instance. Nahlah's config was transcribed from
`build-schema-v3.mjs`, its base from `seo-v2/out/`.

- **Scan:** 81 of 81 production URLs; 76 pages read identically to the client's last scan. The other
  five: `/doctor-referral`'s copy changed after that scan, and four legal pages where this reader
  decodes `&#160;` that the old one left raw.
- **Facts:** 22 of 22 films and 35 of 37 Wikipedia topics, identical to the client's (`smileDesign`
  and `abp` have no article; v3 listed them unused).
- **Build vs the client's v3 output:** identical on 38 pages, 43 articles and the organization except
  6 values: the three lenders' `provider.url: "https://www.undefined"` on `/financing` and
  `/implant-cost`, which the generic build does not produce. Built again from a scan of **staging**
  (Client-First class names): an identical graph.
- **`push-schema.mjs` plan on production:** settings the same; 81 blocks built, 2 differ (those two
  pages), 12 the same graph in another key order.
- **Against the published JSON-LD:** 478 nodes on 81 URLs equal what is published, apart from the
  same 6 lender URLs. `vocab-check.mjs` VOCAB CLEAN; `verify-schema.mjs` SCHEMA CLEAN on production
  and on staging (81 URLs each).
- **Keyword H1 plan** with a test map assembled from the plan doc (*Dr. Nahlah — SEO & AEO Plan*: its
  Keyword map tab and its 19 drafted H1s): 30 target rows → 14 pages to write, 6 already fine, 10 listed
  (2 heroes built another way, 5 rows whose "northern virginia" keyword the live keyword H1 lacks and
  that have no drafted H1, 3 drafted H1s that lack their own keyword). The registry rules it derives
  equal, on both hosts, the three rules the original wrote by hand (`.pg-hero …` on production,
  `.section_page-hero …` on staging); staging gives the same verdicts.

## Version Control

Follows the root rules in [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). Scripts, templates and
this README are committed; a client's config, base and outputs live in its step's `output/`. No token or
password is ever written to a file in this folder.
