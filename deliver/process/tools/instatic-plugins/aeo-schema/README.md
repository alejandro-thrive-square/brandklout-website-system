# AEO Schema — `brandklout.aeo-schema` v1.2.0

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
   first and falls back to title. `verify-seo-plugins.mjs` asserts the resulting
   `@id`s are distinct across all 79 URLs.
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
cd deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins
node pack-plugin.mjs aeo-schema output/aeo-schema.zip
node install-plugin.mjs output/aeo-schema.zip            # dry run — shows the grants
node install-plugin.mjs output/aeo-schema.zip --apply
node configure-seo-plugins.mjs --apply                 # the Dr Nahlah values
```

Then publish.

## Test and verify

```bash
node test-aeo-schema.mjs           # 83 assertions, off-platform
node test-aeo-schema.mjs --live    # + the filter over the real published pages
node verify-seo-plugins.mjs        # the LIVE gate: every published URL
```

Every emitted graph in the tests is pulled back out of the script tag and
`JSON.parse`d. A structured-data plugin whose output does not parse is worse than
one that emits nothing, and "it looked right in the page source" is not a check.

## Still worth doing by hand

- **`sameAs`** is empty. Google Business Profile, Facebook and Yelp URLs are how
  an answer engine ties this entity to the one it already knows; nothing was
  invented for it.
- **`aggregateRating`** — the site claims 4.9 out of 5 in copy. A rating in
  schema must be backed by reviews the site actually displays and by a real
  count; it belongs in the site-wide block once someone has the numbers.
- **Run the pages through Google's Rich Results Test** once. The graph is
  asserted to parse and to carry the right nodes; only Google can say whether it
  earns a rich result.

## Version Control

Follows the version control rules in
[SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The packaged `.zip` under
`output/` is a build artifact and is not committed.
