# AEO Schema — `brandklout.aeo-schema` v1.3.0

One JSON-LD `@graph` on every published page, managed from the admin and
changeable across the whole site in one API call.

## The problem it solves

Instatic emits no structured data at all — there is no `application/ld+json`
anywhere in `src/core/publisher/`. An answer engine reading this site had nothing
to attach to: no organisation entity, no article metadata, no breadcrumb, nothing
to resolve "who is this" against a knowledge graph it already holds.

## What it writes

One `<script type="application/ld+json" data-aeo="brandklout.aeo-schema">` before
`</head>`, holding a `@graph` of linked nodes:

| node | where | built from |
| :--- | :--- | :--- |
| `Dentist` (or the configured type) | every page | the settings fields, or `organizationJson` verbatim |
| `WebSite` | the home page | site name + address, `publisher` → the organisation |
| `WebPage` | every page | the page's `seoTitle`, `seoDescription`, URL and first content picture |
| `BreadcrumbList` | every page but home | the page's own address; the last crumb named from the page |
| `Article` | every journal entry | headline, description, image, `datePublished`, `dateModified`, publisher |
| anything hand-written | per page, and site-wide | the blocks stored by this plugin |

One `@graph` rather than five script tags on purpose: the nodes reference each
other by `@id`, and a consumer that reads only the first script tag then sees the
whole picture instead of an arbitrary fifth of it.

Every generator has its own toggle. With all five off and no hand-written block,
the page is returned byte-identical.

## Two offices, and why `organizationJson` exists

The scalar settings describe ONE business. This practice has two — McLean and
Alexandria — and filling in the flat fields would put one address on eighty pages
and silently drop the other. `organizationJson` replaces the generated
organisation outright, and `configure-seo-plugins.mjs` fills it with a `Dentist`
carrying a `department` per office, each with its own `address`, `telephone`,
`faxNumber` and `openingHoursSpecification`, read off the published contact
pages. A pasted object is still given an `@id` if it has none, so the rest of the
graph can point at it.

If it stops being valid JSON the plugin falls back to the fields and logs it,
rather than emitting nothing.

## The two facts that make it work

Both are shared with the sibling
[Open Graph](../open-graph/README.md) plugin, and are duplicated rather than
shared because a plugin package is a unit of install.

1. **`slug` does not identify an article.** For an entry page the pipeline
   passes the merged template's slug, so all 43 articles arrive as
   `slug: "post"`. The document title is the row's, so the resolver matches slug
   first and falls back to title. The live head gate (`seo-head-check.mjs`) asserts the resulting
   `@id`s are distinct across every published URL.
2. **The filter must be synchronous.** It runs inside the QuickJS worker via an
   RPC round-trip; everything it needs is loaded into an in-memory mirror on
   `publish.before` (which the pipeline awaits) behind a 10-second floor.

## Serialising into a `<script>` safely

`<script>` is a raw-text element: the parser ends it at the first `</script`,
inside a JSON string literal or not, and `<!--` opens a comment. Every `<` in the
serialised graph is replaced with its JSON unicode escape — valid JSON, decodes
to the identical string, and makes both impossible. The test suite feeds a
description containing `end</script><script>alert(1)</script> and <!-- a comment`
through and asserts the document still has exactly one `</script>` and that the
payload round-trips to the original string.

## Idempotence

A page already carrying this plugin's script tag is returned untouched.

## The admin page

`AEO Schema` in the admin sidebar, three tabs:

- **Per page** — a searchable list of all 80 pages showing the `@type`s each one
  declares, and an editor in a popup with server-side JSON validation. Closes on
  Escape, on the backdrop, and on Close.
- **Many at once** — one template across a matched set. `{title}`, `{slug}`,
  `{url}` and `{description}` are replaced per page inside **every string in the
  template, however deeply nested**, so one rule gives eighty pages eighty
  correct blocks. `replace` or `merge`. Preview is a dry run.
- **Site-wide block** — added to the graph on every page, for something true of
  the whole practice.

## One entity, one node

A block whose `@id` matches a generated node **extends** it rather than sitting
beside it: the plugin collapses nodes that share an `@id`, taking the union of
their `@type` (generated type first) and letting the block win on any property
both carry. So `/all-on-4` publishes one node typed `["WebPage",
"MedicalWebPage"]` and an article publishes one typed `["Article",
"BlogPosting"]` — a subtype added to the type it specialises — instead of two
half-descriptions of the same page.

## Every page is populated

`populate-seo.mjs` gives all 80 pages a block whose type is true of that page:
`AboutPage`, `ContactPage`, `CollectionPage`, `MedicalWebPage`, an
`OfferCatalog` of the treatments on the home page, a `Person` for Dr. Nahlah,
and `BlogPosting` with the article's own `articleSection` — the same `topic`
cell the /posts filter reads, so the schema and the visible chip cannot
disagree. The map is hand-written, not pattern-matched: `/dental-conditions` is
conditions and not a procedure, and `/doctor-referral` addresses clinicians.

## The API

Under `/admin/api/cms/plugins/brandklout.aeo-schema/runtime/`.

| method | path | gate | what |
| :--- | :--- | :--- | :--- |
| GET | `/entries` | any admin session | every page, its URL, its block and the `@type`s in it |
| GET | `/audit` | any admin session | coverage: how many pages carry a block, which types, which do not |
| POST | `/entry` | `content.manage` | upsert one block. `key: "*"` is the site-wide one |
| DELETE | `/entry` | `content.manage` | remove one |
| POST | `/bulk` | `content.manage` | one template across a matched set — **dry run by default** |
| POST | `/preview` | `content.manage` | the exact graph a given page's HTML would receive |

```bash
# an FAQPage on every journal article, previewed first
curl -sX POST .../runtime/bulk -H 'content-type: application/json' -d '{
  "match": { "kind": "entry" },
  "template": {
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "{title}",
      "acceptedAnswer": { "@type": "Answer", "text": "{description}" }
    }]
  }
}'
```

Every write validates the JSON before it can be stored: it must parse, every
member must be an object, and every node must carry an `@type` (or an `@graph` of
nodes that do). What is stored is the re-serialised canonical form, so a block
that parses at write time cannot fail to parse at publish time.

## Install

```bash
cd deliver/process/tools/instatic-plugins
node install-plugin.mjs aeo-schema            # dry run: packs from source, shows the grants
node install-plugin.mjs aeo-schema --apply    # one site; plugins.mjs rollout for several
```

Then configure it (each client keeps its own idempotent configure script in its own folder;
Dr. Nahlah's is `configure-seo-plugins.mjs`) and publish.

## Test and verify

```bash
node test-aeo-schema.mjs           # 92 assertions, off-platform
node test-aeo-schema.mjs --live    # + the filter over the real published pages (needs INSTATIC_BASE_URL)
node ../../instatic-site/gates/seo-head-check.mjs   # the LIVE gate: every published URL
```

Every emitted graph in the tests is pulled back out of the script tag and
`JSON.parse`d. A structured-data plugin whose output does not parse is worse than
one that emits nothing, and "it looked right in the page source" is not a check.

## Blocks built from the page's content, not its meta (the standard)

A block that describes a treatment with its meta description gives an answer
engine nothing it could not read from the `<head>`. Dr. Nahlah's SEO v3
(2026-10-05, client `22-instatic-api-sync/seo-v3/`) is the reference build:

1. **Scan the live pages** into sections (h2, lead lines, h3 items, `<details>`
   Q/A with trailing nav links cut, images with alts, Vimeo/YouTube ids, tables,
   the visible breadcrumb) — `scan-sections.mjs`.
2. **Map each section to the property it is**: the options a page lists →
   `Service.hasOfferCatalog`; its timeline → `HowTo` and the procedure's
   `preparation` / `howPerformed` / `followup`; benefit, indication and cost
   lists → `ItemList`; before/after photos → `ImageObject`s; accordions →
   `FAQPage`; embedded films → `VideoObject` (Vimeo descriptions are transcripts);
   lender terms → `LoanOrCredit`; a warranty → `WarrantyPromise`. A heading
   rename must fail the build, never ship a stale value.
3. **Name the concepts**: Wikipedia + Wikidata `sameAs` on the procedure and the
   WebPage's `about` Things (Wikipedia REST `page/summary` returns both; Wikidata
   search rate-limits). Not on `Service`: the practice's service is not the
   encyclopedia concept.
4. **Gate on the vocabulary and on the page**: `vocab-check.mjs` (every type,
   property domain, range and enum against schema.org's own file; validator.schema.org
   throttles) and `verify-seo-v3.mjs` (breadcrumb = the visible trail, FAQ = the
   accordions word for word, one VideoObject per embedded film, no dangling `@id`).

**Breadcrumbs:** the generated `BreadcrumbList` names the last crumb with the
full SEO title ("Dental Implants in McLean & Alexandria, VA | Dr. Nahlah"). Where
the page shows a breadcrumb, turn `emitBreadcrumbs` off and store a
`BreadcrumbList` per page that repeats the visible trail; copy the `emit*`
switches with the stores when cloning to staging.

**Text from platforms is not the site's copy.** YouTube/Vimeo descriptions can
carry claims the site's rules forbid; filter them sentence by sentence.

## Still worth doing by hand

- **`sameAs`**: take each office's profiles from what the practice supplies
  (Google Business Profile as `maps.google.com/?cid=…` — a `g.page/r/…/review`
  link redirects to the place id; Facebook without `/reviews`; Yelp). They are
  also each office's `hasMap`.
- **`aggregateRating`** — do not build it from on-site testimonials: Google
  ignores self-serving reviews on a LocalBusiness and treats them as a policy
  risk. Only with a real, displayed review count from a third-party source.
- **Run the pages through Google's Rich Results Test** once. The graph is
  asserted to parse and to carry the right nodes; only Google can say whether it
  earns a rich result.

## Version Control

Follows the version control rules in
[SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The packaged `.zip` under
`output/` is a build artifact and is not committed.
