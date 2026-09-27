// ===========================================================================
// RESOLVE THE @@…@@ MARKERS IN THE CONVERTED BLOG TEMPLATE PAGES.
//
//   node apply-blog-markers.mjs      # after fetch-nodes.mjs -> converted-templates.json
//
// build-blog-templates.mjs writes the two blog pages as ordinary HTML so the
// chrome, classes and images come out identical to every other page, and marks
// the two places that cannot be expressed in HTML with an id attribute. The
// converter turns each of those into a plain `base.container` carrying
// `htmlAttributes.id = "@@…@@"`. This swaps them for the real modules:
//
//   @@OUTLET@@           -> base.outlet
//        An outlet carries an IMPLICIT binding to `currentEntry.body`,
//        rendered from markdown. Nothing is persisted on the node for it --
//        `effectiveNodeBindings()` adds the binding for every base.outlet,
//        so an empty props object is correct and complete.
//
//   @@LOOP:<which>:<n>@@ -> base.loop over the Articles table
//        `data.rows` is the built-in source; `filters.tableId` picks the
//        table. Order is `publishedAt desc` -- the row's OWN publish
//        timestamp, not the article's date, which is why publish-articles.mjs
//        publishes the rows oldest-article-first so the two orders agree.
//
// The `id` attribute is REMOVED as part of the swap: it was scaffolding, and
// leaving `id="@@OUTLET@@"` in the published HTML would be a visible artefact.
//
// Tokens (`{currentEntry.title}`) need nothing here -- the publisher
// interpolates them in any string prop at render time.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, "converted-templates.json");
const TABLE_ID = "hsqsHRo6L5KkU5AGQNGTP"; // Articles, routeBase /blog

const pages = JSON.parse(fs.readFileSync(FILE, "utf8"));

let outlets = 0, loops = 0;

for (const page of pages) {
  const nodes = page.body.nodes;
  for (const node of Object.values(nodes)) {
    const id = node.props?.htmlAttributes?.id;
    if (typeof id !== "string" || !id.startsWith("@@")) continue;

    if (id === "@@OUTLET@@") {
      node.moduleId = "base.outlet";
      // `tag: div` and not the schema default `main`: this outlet sits inside
      // .lf-body, which is already inside <main>. A nested <main> is invalid.
      node.props = { tag: "div", customTag: "", html: "" };
      node.children = [];
      outlets++;
      continue;
    }

    const m = /^@@LOOP:([a-z]+):(\d+)@@$/.exec(id);
    if (!m) throw new Error(`unrecognised marker ${id} on ${page.slug}`);
    const [, which, n] = m;
    const tag = node.props.tag;
    const customTag = node.props.customTag ?? "";
    node.moduleId = "base.loop";
    node.props = {
      sourceId: "data.rows",
      filters: { tableId: TABLE_ID },
      orderBy: "publishedAt",
      direction: "desc",
      limit: Number(n),
      offset: 0,
      // 'infinite' on the listing: Instatic has no numeric paginator module,
      // so the seven /blog/page/N routes the static build had do not exist
      // here and a "load more" is the honest equivalent. The related-articles
      // rail is a fixed three, so it takes 'none'.
      pagination: which === "all" ? "infinite" : "none",
      pageSize: Number(n),
      tag,
      customTag,
      htmlAttributes: {},
    };
    loops++;
  }
}

fs.writeFileSync(FILE, JSON.stringify(pages, null, 2));

console.log(`${outlets} outlet(s), ${loops} loop(s) resolved`);
for (const page of pages) {
  const left = Object.values(page.body.nodes)
    .filter((n) => JSON.stringify(n).includes("@@"));
  console.log(`  ${page.slug.padEnd(16)} ${Object.keys(page.body.nodes).length} nodes, ${left.length} marker(s) left`);
  if (left.length) throw new Error(`markers left unresolved on ${page.slug}`);
}
