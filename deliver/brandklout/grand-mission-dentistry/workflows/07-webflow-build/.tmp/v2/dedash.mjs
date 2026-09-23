#!/usr/bin/env node
// dedash.mjs — remove em dashes from the copy already on a v2 page (user instruction,
// 2026-08-18). The build now applies `deDash` as every string passes through the element DSL,
// but the sections built before that rule existed still carry them, and the SEO titles do too.
//
// Copy is written through data_element_settings_tool key "text": `set_text` on the element
// tool works on Heading/Paragraph but silently no-ops on a Block, and a String node's text is
// reached through its parent. Every change is read back.
//
// Usage: node dedash.mjs <v2-slug> [--dry]
import { call, SITE, page, deDash } from "./lib.mjs";

const SLUG = process.argv[2] || "cosmetic-v2";
const DRY = process.argv.includes("--dry");
const P = page(SLUG);
const walk = (n, o = []) => { o.push(n); (n.children || []).forEach((k) => walk(k, o)); return o; };

const nodes = walk(call("data_element_tool", {
  context: "Read the v2 page tree to find copy still carrying em dashes.",
  siteId: SITE, pageId: P.page,
  actions: [{ label: "b", query_elements: { queries: [{ label: "b", element_id: { component: P.page, element: P.body }, children_depth: -1 }] } }],
})[0].result[0].data[0].matches[0]);

// Copy lives on String nodes, exposed by query_elements as `textContent` (NOT `text`, and a
// String has no settings at all — get_settings on one answers "Could not resolve element data
// type"). The write goes through data_element_tool set_text addressed AT THE STRING, which
// leaves any Strong/Link siblings in a mixed paragraph untouched.
const targets = nodes
  .filter((n) => n.type === "String" && typeof n.textContent === "string" && n.textContent.includes("—"))
  .map((n) => ({ id: n.id.element, from: n.textContent, to: deDash(n.textContent) }));

console.log(`${targets.length} text run(s) carry an em dash`);
for (const t of targets) console.log(`  ${JSON.stringify(t.from.slice(0, 70))} -> ${JSON.stringify(t.to.slice(0, 70))}`);
if (DRY || !targets.length) process.exit(0);

for (let i = 0; i < targets.length; i += 8) {
  const batch = targets.slice(i, i + 8);
  call("data_element_tool", {
    context: "Rewrite copy without em dashes, per the client's instruction.",
    siteId: SITE, pageId: P.page,
    actions: batch.map((t, k) => ({
      label: `d${i + k}`,
      set_text: { id: { component: P.page, element: t.id }, text: t.to },
    })),
  });
  console.log("wrote", batch.length);
}

// read back — no em dash may survive
const after = walk(call("data_element_tool", {
  context: "Re-read the page to prove no em dash survived.",
  siteId: SITE, pageId: P.page,
  actions: [{ label: "b", query_elements: { queries: [{ label: "b", element_id: { component: P.page, element: P.body }, children_depth: -1 }] } }],
})[0].result[0].data[0].matches[0]);
const left = after.filter((n) => typeof n.textContent === "string" && n.textContent.includes("—"));
console.log(left.length ? `STILL PRESENT on ${left.length} node(s)` : "clean: no em dashes remain");
