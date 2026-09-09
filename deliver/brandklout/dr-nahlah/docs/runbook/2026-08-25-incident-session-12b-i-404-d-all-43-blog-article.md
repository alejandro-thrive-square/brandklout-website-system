## INCIDENT 2026-08-25 (session 12b): I 404'd all 43 blog articles — FIXED ON DRAFT, seq 75

**Cause: mine.** Every page-writing script in `15-instatic-api-sync` sent
`changedPages` entries shaped `{ id, slug, title, nodes, rootNodeId }`. That is
wrong, and the endpoint gives no warning.

### The mechanism

`PUT /site-document` does **not merge** cells. Each entry goes through
`pageToCells()` (`core/data/pageFromRow.ts`) and the result **REPLACES** the row's
cells:

```js
const cells = { title, slug, body: { nodes, rootNodeId } }
if (page.template) { cells.templateEnabled = true; cells.templateTarget = …; cells.templatePriority = … }
return cells
```

Two consequences, both of which landed:

1. **`template` survives only if the payload carries it.** Omitting it un-templated
   the `post` page — the entry template for the `posts` post-type — so
   `/posts/<slug>` stopped resolving. **43 articles, 404, on both the domain and the
   origin.** The `/posts` index still rendered and still linked to every one of them.
2. **`seoTitle` / `seoDescription` cannot survive at all** — they are not in
   `pageToCells`. So ANY page write through this endpoint wipes them. That is what
   erased session 11's Data-tab SEO work; it was not a separate bug.

### Fixed

- `restore-page-template.mjs` — restores `post`'s template from
  `.tmp/backups/pre-cta-offices-pages.json` (2026-08-24, pre-dating all of this).
  Recovered value: `{enabled: true, target: {kind:'postTypes', tableSlugs:['posts']}, priority: 100}`.
- `push-page-seo-cells.mjs` re-run — 37/37 SEO cells back. **Order matters:** the
  data-row PATCH merges, the site-document PUT does not, so SEO cells must be
  re-applied AFTER any page write, never before.

### The guard, because 11 scripts had this shape

Patching call sites was never going to hold. `insta-api.mjs` now intercepts
`PUT …/site-document` in `api()` and back-fills `template` onto any `changedPages`
entry whose row currently has one, warning on stderr when it fires. It only ADDS
what the row already had, so a caller deliberately setting or clearing a template
still wins. `verify-template-guard.mjs` proves it by monkey-patching `fetch` and
replaying the exact bad payload — **6/6, nothing written**.

`08-qa/perf-budget.mjs` also now fetches three real article URLs. A templated route
is invisible to any check that only walks static pages, which is precisely why this
shipped unnoticed.

### Gotchas earned

- **A page write is a cell REPLACEMENT.** Always carry `template`; always re-apply
  the SEO cells afterwards.
- **Test a templated route, not just the pages.** `/posts` was 200 the whole time.
- **`changedPages` needs `slug`** or it 400s with `Expected string`.

### State

Production (published 13:13Z) carries the perf work but still has the dead
articles and no SEO cells. **The draft at `seq 75` fixes both and ships nothing
else.** `perf-budget.mjs` is 41/44 against production — the only 3 failures are the
404 articles.
